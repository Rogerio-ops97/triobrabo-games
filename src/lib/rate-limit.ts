import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

type RateLimitResult = { allowed: boolean; retryAfter: number };

function clientFingerprint(request: NextRequest, secret: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret).update(address.slice(0, 128)).digest("hex");
}

export async function checkRateLimit(request: NextRequest, bucket: string, maximum: number, windowSeconds: number): Promise<RateLimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SYNC_SECRET;
  if (!url || !key || !secret) return { allowed: false, retryAfter: 60 };
  const db = createClient(url, key, {
    global: { headers: { "x-sync-secret": secret } },
    auth: { persistSession: false },
  });
  const { data, error } = await db.rpc("consume_api_rate_limit", {
    rate_bucket: bucket,
    rate_client_hash: clientFingerprint(request, secret),
    rate_maximum: maximum,
    rate_window_seconds: windowSeconds,
    sync_token: secret,
  });
  if (error) {
    console.error("rate-limit-check-failed", { bucket, code: error.code });
    return { allowed: false, retryAfter: 60 };
  }
  return { allowed: data === true, retryAfter: windowSeconds };
}

export function rateLimitResponse(retryAfter: number) {
  return Response.json(
    { error: "Muitas solicitações. Aguarde um pouco e tente novamente." },
    { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
  );
}
