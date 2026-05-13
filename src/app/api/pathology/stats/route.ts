import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string | undefined;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = req.nextUrl.searchParams.get("subDepartmentId") || undefined;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = { hospitalId };
    if (subDeptId) where.subDepartmentId = subDeptId;

    const whereToday = { ...where, createdAt: { gte: today, lt: tomorrow } };

    // Build referral queue filter: appointments referred to this pathology sub-dept
    // that have no LabOrder linked to them yet
    const referralWhere: any = {
      hospitalId,
      status: "COMPLETED",
      labOrders: { none: {} },
    };
    if (subDeptId) referralWhere.subDepartmentId = subDeptId;

    // Fetch from HospitalSettings first (configure page saves here), fall back to Hospital
    const hsRow = await (prisma as any).hospitalSettings.findUnique({ where: { hospitalId } });
    const hBase = await (prisma as any).hospital.findUnique({
      where: { id: hospitalId },
      select: { name: true, email: true, mobile: true },
    });
    const hospital = hsRow ? {
      name: hsRow.hospitalName || hBase?.name || "",
      logo: hsRow.logo || null,
      address: hsRow.address || "",
      phone: hsRow.phone || hBase?.mobile || "",
      email: hsRow.email || hBase?.email || "",
      website: hsRow.website || "",
      gstNumber: hsRow.gstNumber || "",
      registrationNo: hsRow.registrationNo || "",
      letterhead: hsRow.letterhead || null,
      letterheadType: hsRow.letterheadType || "IMAGE",
      letterheadSize: hsRow.letterheadSize || "A4",
    } : hBase ? {
      name: hBase.name, logo: null, address: "",
      phone: hBase.mobile || "", email: hBase.email || "",
      website: "", gstNumber: "", registrationNo: "",
      letterhead: null, letterheadType: "IMAGE", letterheadSize: "A4",
    } : null;

    const [
      totalToday, pending, inProcess, resultEntered, verified, reported, delivered, cancelled,
      criticalItems, totalOrders, revenueToday, revenueTotal,
      ordersByPriority, ordersByStatus, recentOrders, referralQueue,
    ] = await Promise.all([
      (prisma as any).labOrder.count({ where: whereToday }),
      (prisma as any).labOrder.count({ where: { ...where, status: "PENDING" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "IN_PROCESS" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "RESULT_ENTERED" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "VERIFIED" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "REPORTED" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "DELIVERED" } }),
      (prisma as any).labOrder.count({ where: { ...where, status: "CANCELLED" } }),
      (prisma as any).labOrderItem.count({ where: { isCritical: true, order: { hospitalId, ...(subDeptId ? { subDepartmentId: subDeptId } : {}) } } }),
      (prisma as any).labOrder.count({ where }),
      (prisma as any).labOrder.aggregate({ where: whereToday, _sum: { totalAmount: true } }),
      (prisma as any).labOrder.aggregate({ where, _sum: { totalAmount: true } }),
      (prisma as any).labOrder.groupBy({ by: ["priority"], where, _count: true }),
      (prisma as any).labOrder.groupBy({ by: ["status"], where, _count: true }),
      (prisma as any).labOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          patient: { select: { name: true, patientId: true } },
          items: { select: { id: true, isAbnormal: true, isCritical: true, status: true } },
          sample: { select: { status: true } },
        },
      }),
      (prisma as any).appointment.findMany({
        where: referralWhere,
        orderBy: { appointmentDate: "desc" },
        take: 30,
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true, address: true } },
          doctor: { select: { name: true, specialization: true } },
          prescription: {
            select: {
              id: true,
              labTests: true,
              diagnosis: true,
              chiefComplaint: true,
              medications: true,
              advice: true,
              aiSuggestions: true,
              doctorNotes: true,
              vitals: true,
            },
          },
        },
      }),
    ]);

    const completedCount = verified + reported + delivered;

    // Calculate average TAT from orders that have both createdAt and deliveredAt
    const deliveredOrders = await (prisma as any).labOrder.findMany({
      where: { ...where, status: "DELIVERED" },
      select: { createdAt: true, updatedAt: true },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
    const avgTat = deliveredOrders.length > 0
      ? Math.round(
          deliveredOrders.reduce((sum: number, o: any) => {
            const hrs = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 3_600_000;
            return sum + hrs;
          }, 0) / deliveredOrders.length * 10
        ) / 10
      : 0;

    return successResponse({
      kpis: {
        totalToday,
        pendingSamples: pending,
        inProcess,
        completedReports: completedCount,
        criticalCases: criticalItems,
        revenueToday: revenueToday._sum?.totalAmount || 0,
        revenueTotal: revenueTotal._sum?.totalAmount || 0,
        avgTat,
        totalOrders,
        resultEntered,
        verified,
        reported,
        delivered,
        cancelled,
        pendingReferrals: referralQueue.length,
      },
      hospital: hospital || null,
      ordersByPriority: ordersByPriority.map((r: any) => ({ priority: r.priority, count: r._count })),
      ordersByStatus: ordersByStatus.map((r: any) => ({ status: r.status, count: r._count })),
      recentOrders,
      referralQueue: referralQueue.map((a: any) => ({
        appointmentId: a.id,
        appointmentDate: a.appointmentDate,
        appointmentNotes: a.notes || "",
        subDeptNote: a.subDeptNote || "",
        referralNote: a.subDeptNote || "",
        // Patient demographics
        patientId: a.patient?.id,
        patientName: a.patient?.name || "—",
        patientUHID: a.patient?.patientId || "—",
        patientPhone: a.patient?.phone || "",
        patientGender: a.patient?.gender || "",
        patientDob: a.patient?.dateOfBirth || null,
        patientBloodGroup: a.patient?.bloodGroup || "",
        // Doctor
        doctorName: a.doctor?.name || "—",
        doctorSpecialization: a.doctor?.specialization || "",
        // Prescription data
        prescription: a.prescription ? {
          id: a.prescription.id,
          labTests: a.prescription.labTests || "",
          diagnosis: a.prescription.diagnosis || "",
          chiefComplaint: a.prescription.chiefComplaint || "",
          medications: a.prescription.medications || "",
          advice: a.prescription.advice || "",
          doctorNotes: a.prescription.doctorNotes || "",
          vitals: a.prescription.vitals || "",
          aiSuggestions: a.prescription.aiSuggestions || "",
        } : null,
      })),
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch stats", 500);
  }
}
