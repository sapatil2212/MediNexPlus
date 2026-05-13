import prisma from "../config/db";

export const getSettings = async (hospitalId: string) => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM HospitalSettings
    WHERE hospitalId = ${hospitalId}
    LIMIT 1
  `;
  const settings = rows?.[0];
  if (settings) return settings;

  // Fallback to basic info from the Hospital registration
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { name: true, email: true, mobile: true }
  });

  if (!hospital) return null;

  return {
    hospitalId,
    hospitalName: hospital.name,
    email: hospital.email,
    phone: hospital.mobile,
    address: "",
    website: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    gstNumber: "",
    registrationNo: "",
    letterhead: null,
    letterheadType: "IMAGE",
    letterheadSize: "A4"
  };
};

export const upsertSettings = async (hospitalId: string, data: {
  hospitalName: string; logo?: string; address?: string; phone?: string;
  email?: string; website?: string; timezone?: string; currency?: string;
  gstNumber?: string; registrationNo?: string;
  letterhead?: string; letterheadType?: string; letterheadSize?: string;
}) => {
  const { letterhead, letterheadType, letterheadSize, ...safeData } = data;

  const saved = await prisma.hospitalSettings.upsert({
    where: { hospitalId },
    update: { ...safeData },
    create: { hospitalId, ...safeData },
  });

  const letterheadValue =
    typeof letterhead === "string"
      ? (() => {
          const v = letterhead.trim();
          if (v.startsWith("`") && v.endsWith("`")) return v.slice(1, -1).trim();
          return v;
        })()
      : letterhead ?? null;

  const shouldUpdateLetterhead =
    letterhead !== undefined || letterheadType !== undefined || letterheadSize !== undefined;

  if (shouldUpdateLetterhead) {
    await prisma.$executeRaw`
      UPDATE HospitalSettings
      SET
        letterhead = ${letterheadValue},
        letterheadType = ${letterheadType ?? null},
        letterheadSize = ${letterheadSize ?? null}
      WHERE hospitalId = ${hospitalId}
    `;
  }

  return saved;
};

/** Calculate setup completion % for the onboarding wizard */
export const getSetupProgress = async (hospitalId: string) => {
  const [settings, deptCount, doctorCount, staffCount, wardCount, bedCount, pricingCount] =
    await Promise.all([
      prisma.hospitalSettings.findUnique({ where: { hospitalId } }),
      prisma.department.count({ where: { hospitalId } }),
      prisma.doctor.count({ where: { hospitalId } }),
      prisma.staff.count({ where: { hospitalId } }),
      prisma.ward.count({ where: { hospitalId } }),
      prisma.bed.count({ where: { hospitalId } }),
      prisma.pricing.count({ where: { hospitalId } }),
    ]);

  const steps = [
    { name: "Basic Info", done: !!settings },
    { name: "Departments", done: deptCount > 0 },
    { name: "Doctors", done: doctorCount > 0 },
    { name: "Staff", done: staffCount > 0 },
    { name: "Wards & Beds", done: wardCount > 0 && bedCount > 0 },
    { name: "Pricing", done: pricingCount > 0 },
  ];

  const completed = steps.filter(s => s.done).length;
  return {
    steps,
    completed,
    total: steps.length,
    percentage: Math.round((completed / steps.length) * 100),
    isComplete: completed === steps.length,
  };
};
