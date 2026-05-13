import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, hospitalName, phone, email, address, date, time } = await req.json();

    if (!name || !hospitalName || !phone || !email || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "dreampropertiesnashik@gmail.com";

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Formatting date and time for emails
    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    
    let formattedTime = time;
    if (time.includes(":")) {
      const [h, m] = time.split(":");
      const hour = parseInt(h, 10);
      formattedTime = `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
    }

    const year = new Date().getFullYear();

    // 1. Email to the User
    const userHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Demo Request Received</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr><td style="padding:28px 36px 20px;background:linear-gradient(135deg,#7C3AED,#6D28D9);">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#ddd6fe;letter-spacing:.08em;text-transform:uppercase;">MediNex+</p>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Demo Request Received</h1>
      </td></tr>
      <tr><td style="padding:28px 36px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.65;">
          Thank you for requesting a demo of MediNex+ for <strong>${hospitalName}</strong>! We have received your request and our team will get back to you shortly to confirm your slot.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f5f3ff;border-radius:10px;border:1px solid #ede9fe;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Preferred Date</p>
            <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#6d28d9;">${formattedDate}</p>
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Preferred Time</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#6d28d9;">${formattedTime}</p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">If you have any urgent questions, feel free to reply to this email.</p>
      </td></tr>
      <tr><td style="padding:16px 36px 24px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; ${year} MediNex+ &middot; Automated confirmation.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    // 2. Email to the Super Admin
    const adminHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>New Demo Request</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr><td style="padding:28px 36px 20px;background:linear-gradient(135deg,#0F172A,#1E293B);">
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">New Demo Request 🚀</h1>
      </td></tr>
      <tr><td style="padding:28px 36px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">You have received a new demo request from the MediNex+ landing page.</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:120px;">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Hospital</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;">${hospitalName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#3b82f6;"><a href="mailto:${email}" style="color:#3b82f6;text-decoration:none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Address</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;">${address || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Pref. Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:600;color:#111827;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:13px;color:#6b7280;">Pref. Time</td>
            <td style="padding:10px 0;font-size:14px;font-weight:600;color:#111827;">${formattedTime}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    const senderEmail = process.env.EMAIL_USERNAME || "no-reply@medinex.com";

    await Promise.all([
      // Send to user
      transporter.sendMail({
        from: `"MediNex+" <${senderEmail}>`,
        to: email,
        subject: `Demo Request Received - MediNex+`,
        html: userHtml,
      }),
      // Send to admin
      transporter.sendMail({
        from: `"MediNex+ Website" <${senderEmail}>`,
        to: SUPER_ADMIN_EMAIL,
        subject: `New Demo Request: ${hospitalName} (${name})`,
        html: adminHtml,
      })
    ]);

    return NextResponse.json({ success: true, message: "Emails sent successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Error sending demo emails:", error);
    return NextResponse.json({ error: "Failed to send emails", details: error.message }, { status: 500 });
  }
}
