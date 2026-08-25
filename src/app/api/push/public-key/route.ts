import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit(request, "push-public-key", 60, 60);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);
  const key = process.env.VAPID_PUBLIC_KEY;
  return key
    ? Response.json({ key }, { headers: { "Cache-Control": "public, max-age=3600" } })
    : Response.json({ error: "Web Push não configurado" }, { status: 503 });
}
