import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export const sendOTPviaSMS = async (mobile: string, otp: string) => {
  if (!accountSid || !authToken || !fromPhone) {
    console.error("[SMS] Twilio credentials not configured — skipping SMS");
    return;
  }

  // Ensure the mobile number has a country code (default to +91 for India)
  const to = mobile.startsWith("+") ? mobile : `+91${mobile.replace(/\D/g, "")}`;

  try {
    await client.messages.create({
      body: `Your MediGrowNex verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      from: fromPhone,
      to,
    });
    console.log(`[SMS] OTP sent successfully to ${to}`);
  } catch (error) {
    console.error("[SMS] Failed to send OTP via SMS:", error);
  }
};
