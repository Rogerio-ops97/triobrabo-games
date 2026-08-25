import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { platforms as platformCatalog } from "@/lib/platforms";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 16_384;
const allowedPlatforms = new Set(platformCatalog.map((platform) => platform.slug));
const allowedAlertTypes = new Set(["free-games", "big-discounts", "wishlist"]);
const allowedPushHosts = ["fcm.googleapis.com", "updates.push.services.mozilla.com", "push.services.mozilla.com", "web.push.apple.com"];

function validEndpoint(value: string) {
  if (value.length > 2_048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && (!url.port || url.port === "443")
      && allowedPushHosts.some((host) => url.hostname === host || url.hostname.endsWith("." + host));
  } catch {
    return false;
  }
}

const validKey = (value: string, minimum: number, maximum: number) =>
  value.length >= minimum && value.length <= maximum && /^[A-Za-z0-9_-]+$/.test(value);

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, "push-subscribe", 8, 3_600);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return Response.json({ error: "Solicitação muito grande" }, { status: 413 });
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Solicitação muito grande" }, { status: 413 });
    }
    const body = JSON.parse(raw);
    const endpoint = String(body?.endpoint || "");
    const p256dh = String(body?.keys?.p256dh || "");
    const auth = String(body?.keys?.auth || "");
    const deviceKey = String(body?.deviceKey || "");
    const platforms = Array.isArray(body?.platforms)
      ? [...new Set(body.platforms.filter((item: unknown): item is string => typeof item === "string" && allowedPlatforms.has(item)))].slice(0, platformCatalog.length)
      : [];
    const alertTypes = Array.isArray(body?.alertTypes)
      ? [...new Set(body.alertTypes.filter((item: unknown): item is string => typeof item === "string" && allowedAlertTypes.has(item)))].slice(0, allowedAlertTypes.size)
      : [];
    if (!validEndpoint(endpoint)
      || !validKey(p256dh, 40, 256)
      || !validKey(auth, 10, 128)
      || !platforms.length
      || !alertTypes.length
      || !/^[a-f0-9-]{20,64}$/i.test(deviceKey)) {
      return Response.json({ error: "Assinatura inválida" }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secret = process.env.SYNC_SECRET;
    if (!url || !key || !secret) return Response.json({ error: "Serviço indisponível" }, { status: 503 });
    const db = createClient(url, key, { global: { headers: { "x-sync-secret": secret } }, auth: { persistSession: false } });
    const { error } = await db.rpc("register_push_subscription", {
      subscription_endpoint: endpoint,
      subscription_p256dh: p256dh,
      subscription_auth: auth,
      subscription_platforms: platforms,
      subscription_alert_types: alertTypes,
      subscription_user_agent: request.headers.get("user-agent")?.slice(0, 500) || "",
      subscription_device_key: deviceKey,
      sync_token: secret,
    });
    if (error) throw error;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("push-subscribe-failed", { errorId, error: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "Não foi possível ativar os alertas", errorId }, { status: 500 });
  }
}
