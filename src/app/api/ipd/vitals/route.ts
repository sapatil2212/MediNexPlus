import { NextRequest } from "next/server";
import { errorResponse } from "../../../../../backend/utils/response";

export async function GET(_req: NextRequest) {
  return errorResponse("Not implemented", 501);
}

export async function POST(_req: NextRequest) {
  return errorResponse("Not implemented", 501);
}
