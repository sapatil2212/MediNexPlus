import { NextRequest } from "next/server";
import { verifyToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";

export const authMiddleware = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = req.cookies.get("hms_session")?.value || "";
    }

    if (!token) {
      return { user: null, error: errorResponse("Unauthorized", 401) };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { user: null, error: errorResponse("Invalid token", 401) };
    }

    return { user: payload, error: null };
  } catch (error) {
    return { user: null, error: errorResponse("Unauthorized", 401) };
  }
};
