import { NextRequest } from "next/server";
import { successResponse } from "../../../../../backend/utils/response";

export async function POST(req: NextRequest) {
  const response = successResponse(null, "Logged out successfully");
  
  response.cookies.set({
    name: "hms_session",
    value: "",
    httpOnly: true,
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return response;
}
