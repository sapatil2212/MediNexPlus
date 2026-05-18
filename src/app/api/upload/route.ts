import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return errorResponse("File upload is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.", 503);
  }

  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("type") as string) || "image";

    if (!file) return errorResponse("No file provided", 400);

    const isDocType = uploadType === "document" || uploadType === "patient-document" || uploadType === "letterhead";
    const maxSize = isDocType ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(`File too large. Max size is ${isDocType ? "10MB" : "5MB"}`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let folder = "hms/others";
    if (uploadType === "document") folder = "hms/doctors/documents";
    else if (uploadType === "signature") folder = `hms/doctors/${auth.user.userId}/signatures`;
    else if (uploadType === "stamp") folder = `hms/doctors/${auth.user.userId}/stamps`;
    else if (uploadType === "profile") folder = "hms/doctors/profiles";
    else if (uploadType === "patient-photo") folder = "hms/patients/photos";
    else if (uploadType === "patient-document") folder = "hms/patients/documents";
    else if (uploadType === "logo") folder = `hms/hospitals/${auth.hospitalId}/logos`;
    else if (uploadType === "letterhead") folder = `hms/hospitals/${auth.hospitalId}/letterheads`;
    else folder = "hms/doctors/images";

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "auto",
            allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp", "gif"],
          },
          (error, res) => {
            if (error) {
              reject(error);
            }
            else {
              resolve(res);
            }
          }
        )
        .end(buffer);
    });

    return successResponse(
      { url: result.secure_url, publicId: result.public_id, format: result.format },
      "File uploaded successfully"
    );
  } catch (e: any) {
    return errorResponse(e.message || "Upload failed", 500);
  }
}
