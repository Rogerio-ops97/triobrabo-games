import "server-only";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Game } from "./types";

function serverDb(cronToken = "") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SYNC_SECRET;
  if (!url || !key || !secret) throw new Error("Configuração do servidor incompleta");
  return createClient(url, key, {
    global: { headers: { "x-sync-secret": secret, "x-sync-cron-token": cronToken } },
    auth: { persistSession: false },
  });
}

function configure() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Chaves Web Push ausentes");
  webpush.setVapidDetails("mailto:triobrabogamesdrop@gmail.com", publicKey, privateKey);
}

const platformSlug = (store: string) => store.toLowerCase().replace(/\s*\/\s*/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
type PushTarget = { id: string; endpoint: string; p256dh: string; auth: string };

export async function sendPush(game: Game, cronToken = "") {
  configure();
  const db = serverDb(cronToken);
  const slug = platformSlug(game.store);
  const secret = cronToken || process.env.SYNC_SECRET || "";
  const { data, error } = await db.rpc("push_targets", { platform_slug: slug, sync_token: secret });
  if (error) throw error;
  const targets = Array.isArray(data) ? data as unknown as PushTarget[] : [];

  let sent = 0;
  let expired = 0;
  const payload = JSON.stringify({
    title: `🎁 ${game.title} está grátis!`,
    body: `De ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(game.original_price)} por R$ 0 na ${game.store}.`,
    url: game.claim_url,
    gameId: game.id,
  });

  await Promise.all(targets.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 86400, urgency: "high" });
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        expired++;
        await db.rpc("disable_push_target", { subscription_id: sub.id, sync_token: secret });
      }
    }
  }));
  return { sent, expired, total: targets.length };
}
