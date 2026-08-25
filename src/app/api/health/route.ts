import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "health", 60, 60);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);
  return Response.json({ status: "ok", service: "freedrop" }, { headers: { "Cache-Control": "no-store" } });
}
