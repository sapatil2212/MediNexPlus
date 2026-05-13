import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import prisma from "../../../../backend/config/db";
import { randomUUID } from "crypto";
import { sendEnquiryConfirmation, sendEnquiryNotificationToHospital } from "../../../../backend/utils/mailer";

const HOSPITAL_NAME = process.env.HOSPITAL_NAME || "MediNex+";
const HOSPITAL_EMAIL = process.env.HOSPITAL_EMAIL || "medinexplus666@gmail.com";
const HOSPITAL_PHONE = process.env.HOSPITAL_PHONE || "+91 90590 53938";

/**
 * Push enquiry data to Google Sheet via Apps Script webhook.
 * Google Apps Script returns 302 redirects — a normal fetch follows 302
 * but converts POST→GET (HTTP spec), losing the body. So we follow
 * redirects manually to preserve the POST method + body at every hop.
 */
async function pushToGoogleSheet(data: Record<string, string>) {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) {
    console.log("[GSheet] URL not set");
    return;
  }

  try {
    const payload = JSON.stringify(data);
    console.log("[GSheet] Sending data...");

    let currentUrl = url;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(currentUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) { currentUrl = location; continue; }
      }

      const text = await res.text();
      console.log("[GSheet] Response:", res.status, text);
      return;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GSheet] Error:", msg);
  }
}

/**
 * POST /api/enquiries — Public: submit enquiry from contact form
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName, mobile, altContact, email, gender,
      city, state, country, pincode, department, enquiryType, details,
    } = body;

    if (!fullName || !mobile) {
      return errorResponse("Full name and mobile number are required", 400);
    }

    const hospital = await prisma.hospital.findFirst({ 
      select: { 
        id: true, 
        name: true, 
        email: true, 
        mobile: true,
        settings: {
          select: {
            logo: true,
            phone: true,
            email: true,
            hospitalName: true
          }
        }
      } 
    });
    if (!hospital) return errorResponse("Hospital not configured", 500);

    const id = randomUUID();
    const now = new Date();

    await prisma.$executeRawUnsafe(
      `INSERT INTO Enquiry (id, hospitalId, fullName, mobile, altContact, email, gender, city, state, country, pincode, department, enquiryType, details, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?)`,
      id, hospital.id,
      fullName.trim(), mobile.trim(),
      altContact?.trim() || null, email?.trim() || null, gender || null,
      city?.trim() || null, state?.trim() || null, country || null,
      pincode?.trim() || null, department || null, enquiryType || null,
      details?.trim() || null, now, now,
    );

    // Push to Google Sheet (awaited so Next.js doesn't drop the promise)
    await pushToGoogleSheet({
      enquiryId: id,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      altContact: altContact?.trim() || "",
      email: email?.trim() || "",
      gender: gender || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      country: country || "",
      pincode: pincode?.trim() || "",
      department: department || "",
      enquiryType: enquiryType || "",
      details: details?.trim() || "",
      status: "NEW",
      timestamp: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    });

    // Send confirmation emails (fire-and-forget — don't block response)
    const emailData = {
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      altContact: altContact?.trim() || "",
      email: email?.trim() || "",
      gender: gender || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      country: country || "",
      pincode: pincode?.trim() || "",
      department: department || "",
      enquiryType: enquiryType || "",
      details: details?.trim() || "",
    };

    // Use HOSPITAL_EMAIL env var for hospital notification recipient
    const hospitalEmailAddress = HOSPITAL_EMAIL;
    const userEmailAddress = email?.trim();
    const hospitalDisplayName = hospital.settings?.hospitalName || hospital.name || HOSPITAL_NAME;
    const hospitalPhoneNumber = hospital.settings?.phone || hospital.mobile || HOSPITAL_PHONE;
    const hospitalLogoUrl = hospital.settings?.logo || null;

    console.log("[Email] User email:", userEmailAddress);
    console.log("[Email] Hospital email:", hospitalEmailAddress);
    console.log("[Email] Hospital.settings?.email:", hospital.settings?.email);
    console.log("[Email] HOSPITAL_EMAIL env:", HOSPITAL_EMAIL);

    // Email to user (only if they provided an email)
    if (userEmailAddress) {
      sendEnquiryConfirmation({
        to: userEmailAddress,
        ...emailData,
        hospitalName: hospitalDisplayName,
        hospitalEmail: hospitalEmailAddress,
        hospitalPhone: hospitalPhoneNumber,
        hospitalLogo: hospitalLogoUrl,
      }).catch(err => console.error("[Email] User confirmation error:", err.message));
    }

    // Email to hospital admin
    sendEnquiryNotificationToHospital({
      to: hospitalEmailAddress,
      ...emailData,
      hospitalName: hospitalDisplayName,
      hospitalLogo: hospitalLogoUrl,
      enquiryId: id,
    }).catch(err => console.error("[Email] Hospital notification error:", err.message));

    return successResponse({ id }, "Enquiry submitted successfully", 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("POST /api/enquiries error:", msg);
    return errorResponse(msg || "Failed", 500);
  }
}

/**
 * GET /api/enquiries — Dashboard: list with filters + stats
 * Uses raw SQL because prisma generate hasn't run for the Enquiry model.
 */
const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF"];

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const department = searchParams.get("department") || undefined;
    const enquiryType = searchParams.get("type") || undefined;

    let whereClause = `WHERE hospitalId = ?`;
    const params: (string | number | boolean | undefined | null)[] = [auth.hospitalId];

    if (status) { whereClause += ` AND status = ?`; params.push(status); }
    if (department) { whereClause += ` AND department = ?`; params.push(department); }
    if (enquiryType) { whereClause += ` AND enquiryType = ?`; params.push(enquiryType); }
    if (search) {
      whereClause += ` AND (fullName LIKE ? OR mobile LIKE ? OR email LIKE ? OR city LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const countParams = [...params];

    const enquiries = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM Enquiry ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...params, limit, skip
    );

    const countResult = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
      `SELECT COUNT(*) as cnt FROM Enquiry ${whereClause}`, ...countParams
    );
    const total = Number(countResult[0]?.cnt || 0);

    const statsBaseWhere = enquiryType ? `hospitalId = ? AND enquiryType = ?` : `hospitalId = ?`;
    const statsBaseParams: (string | undefined)[] = enquiryType ? [auth.hospitalId, enquiryType] : [auth.hospitalId];

    const statsResult = await prisma.$queryRawUnsafe<{ status: string, cnt: bigint }[]>(
      `SELECT status, COUNT(*) as cnt FROM Enquiry WHERE ${statsBaseWhere} GROUP BY status`,
      ...statsBaseParams
    );
    const totalAllResult = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
      `SELECT COUNT(*) as cnt FROM Enquiry WHERE ${statsBaseWhere}`, ...statsBaseParams
    );
    const totalAll = Number(totalAllResult[0]?.cnt || 0);

    const statsMap: Record<string, number> = {};
    for (const r of statsResult) statsMap[r.status] = Number(r.cnt);

    return successResponse({
      enquiries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        new: statsMap["NEW"] || 0,
        contacted: statsMap["CONTACTED"] || 0,
        inProgress: statsMap["IN_PROGRESS"] || 0,
        converted: statsMap["CONVERTED"] || 0,
        closed: statsMap["CLOSED"] || 0,
        total: totalAll,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("GET /api/enquiries error:", msg);
    return errorResponse(msg || "Failed", 500);
  }
}

/**
 * DELETE /api/enquiries — Bulk delete enquiries
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || !ids.length) {
      return errorResponse("Invalid or empty list of enquiry IDs", 400);
    }

    // Ensure all enquiries belong to the same hospital
    const placeholders = ids.map(() => "?").join(", ");
    await prisma.$executeRawUnsafe(
      `DELETE FROM Enquiry WHERE hospitalId = ? AND id IN (${placeholders})`,
      auth.hospitalId, ...ids
    );

    return successResponse(null, `${ids.length} enquiries deleted`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("DELETE /api/enquiries error:", msg);
    return errorResponse(msg || "Failed", 500);
  }
}
