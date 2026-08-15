import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { sendPush } from "@/lib/push";
import { getFreeMultiStoreDeals } from "@/lib/deals";
import type { Game } from "@/lib/types";

type Giveaway = {
  id: number;
  title: string;
  worth: string;
  thumbnail: string;
  image: string;
  description: string;
  open_giveaway_url: string;
  published_date: string;
  end_date: string;
  type: string;
  platforms: string;
};

type EpicOffer = {
  id: string;
  namespace?: string;
  title: string;
  description?: string;
  keyImages?: { type: string; url: string }[];
  catalogNs?: { mappings?: { pageSlug?: string; pageType?: string }[] };
  offerMappings?: { pageSlug?: string; pageType?: string }[];
  price?: { totalPrice?: { originalPrice?: number; currencyInfo?: { decimals?: number } } };
  promotions?: {
    promotionalOffers?: {
      promotionalOffers?: { startDate?: string; endDate?: string; discountSetting?: { discountPercentage?: number } }[];
    }[];
  };
};

type GameRow = Omit<Game, "id"> & { source_id: string; is_active: boolean };

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const gameTitle = (value: string) => value.replace(/\s*\([^)]*\)\s*(?:Key\s+)?Giveaway.*$/i, "").trim();
const titleKey = (value: string) => slugify(gameTitle(value));
const storeName = (platforms: string) => platforms.includes("Epic") ? "Epic Games" : platforms.includes("Steam") ? "Steam" : platforms.includes("GOG") ? "GOG" : platforms.includes("itch") ? "itch.io" : platforms.split(",")[0]?.trim() || "PC";
const canonicalStore = (store: string, activation = "") => {
  const value = `${store} ${activation}`.toLowerCase();
  if (value.includes("epic")) return "Epic Games";
  if (value.includes("steam")) return "Steam";
  if (value.includes("gog")) return "GOG";
  if (value.includes("prime gaming") || value.includes("amazon")) return "Prime Gaming";
  if (value.includes("humble")) return "Humble Bundle";
  if (value.includes("ubisoft")) return "Ubisoft Connect";
  if (value.includes("indiegala")) return "IndieGala";
  if (value.includes("itch.io")) return "itch.io";
  if (value.includes("microsoft") || value.includes("xbox")) return "Xbox / Microsoft Store";
  if (value.includes("electronic arts") || value.includes("ea app")) return "EA app";
  return store;
};
const SUPABASE_CRON_TOKEN_HASH = "35e456a451c9eb4fdf053c774d194a9261948f7bf1e5db1c9c6eb372320f6079";
const validSupabaseCronToken = (value: string | null) => {
  if (!value) return false;
  const received = Buffer.from(createHash("sha256").update(value).digest("hex"));
  const expected = Buffer.from(SUPABASE_CRON_TOKEN_HASH);
  return received.length === expected.length && timingSafeEqual(received, expected);
};

async function fetchEpicOffers(now = new Date()) {
  const response = await fetch("https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR", { cache: "no-store" });
  if (!response.ok) throw new Error(`Epic respondeu ${response.status}`);
  const json = await response.json();
  const offers = (json?.data?.Catalog?.searchStore?.elements || []) as EpicOffer[];

  return offers.flatMap((offer) => {
    const promotion = offer.promotions?.promotionalOffers?.flatMap((group) => group.promotionalOffers || []).find((item) => {
      const start = item.startDate ? new Date(item.startDate) : null;
      const end = item.endDate ? new Date(item.endDate) : null;
      return item.discountSetting?.discountPercentage === 0 && start && end && start <= now && end > now;
    });
    if (!promotion?.startDate || !promotion.endDate) return [];

    const decimals = offer.price?.totalPrice?.currencyInfo?.decimals ?? 2;
    const originalPrice = (offer.price?.totalPrice?.originalPrice || 0) / 10 ** decimals;
    if (originalPrice <= 0) return [];

    const mapping = [...(offer.catalogNs?.mappings || []), ...(offer.offerMappings || [])].find((item) => item.pageType === "productHome")
      || [...(offer.catalogNs?.mappings || []), ...(offer.offerMappings || [])][0];
    const image = offer.keyImages?.find((item) => item.type === "OfferImageWide")?.url
      || offer.keyImages?.find((item) => item.type === "featuredMedia")?.url
      || offer.keyImages?.[0]?.url
      || "";

    return [{
      offer,
      promotion,
      originalPrice,
      image,
      claimUrl: mapping?.pageSlug ? `https://store.epicgames.com/pt-BR/p/${mapping.pageSlug}` : "https://store.epicgames.com/pt-BR/free-games",
    }];
  });
}

async function highResolutionSteamImages(offers: Giveaway[]) {
  const images = new Map<number, string>();
  await Promise.all(offers.filter((item) => item.platforms.includes("Steam")).map(async (offer) => {
    try {
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameTitle(offer.title))}&l=portuguese&cc=br`, { cache: "no-store" });
      const json = await response.json();
      const match = json?.items?.find((item: { name: string }) => titleKey(offer.title) === titleKey(item.name)) || json?.items?.[0];
      if (match?.id) images.set(offer.id, `https://cdn.cloudflare.steamstatic.com/steam/apps/${match.id}/library_hero.jpg`);
    } catch {
      // The original source image remains available as a safe fallback.
    }
  }));
  return images;
}

async function synchronize(request: NextRequest) {
  const startedAt = Date.now();
  const auth = request.headers.get("authorization");
  const valid = [process.env.CRON_SECRET, process.env.SYNC_SECRET].filter(Boolean).some((secret) => auth === `Bearer ${secret}`)
    || validSupabaseCronToken(request.headers.get("x-sync-cron-token"));
  if (!valid) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SYNC_SECRET;
  if (!url || !key || !secret) return Response.json({ error: "Configuração incompleta" }, { status: 503 });

  const [gamerPowerResult, epicResult, dealsResult] = await Promise.allSettled([
    fetch("https://www.gamerpower.com/api/filter?platform=pc&type=game", { headers: { accept: "application/json" }, cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error(`GamerPower respondeu ${response.status}`);
      return response.json() as Promise<Giveaway[]>;
    }),
    fetchEpicOffers(),
    getFreeMultiStoreDeals(),
  ]);
  if (gamerPowerResult.status === "rejected" && epicResult.status === "rejected" && dealsResult.status === "rejected") throw new Error("Todas as fontes de jogos grátis falharam");

  const offers = gamerPowerResult.status === "fulfilled" ? gamerPowerResult.value : [];
  const epicOffers = epicResult.status === "fulfilled" ? epicResult.value : [];
  const freeDeals = dealsResult.status === "fulfilled" ? dealsResult.value.filter((deal) => deal.salePrice === 0 && deal.originalPrice > 0) : [];
  const eligible = offers.filter((item) => item.type === "Game" && item.worth !== "N/A" && Number(item.worth.replace(/[^0-9.]/g, "")) > 0);
  const epicTitleKeys = new Set(epicOffers.map(({ offer }) => titleKey(offer.title)));
  const secondaryOffers = eligible.filter((item) => !(item.platforms.includes("Epic") && epicTitleKeys.has(titleKey(item.title))));
  const heroImages = await highResolutionSteamImages(secondaryOffers);

  const cronToken = request.headers.get("x-sync-cron-token") || "";
  const db = createClient(url, key, { global: { headers: { "x-sync-secret": secret, "x-sync-cron-token": cronToken } }, auth: { persistSession: false } });
  const { data: activeEpicRows, error: activeEpicError } = await db.from("games").select("source_id,title").eq("store", "Epic Games").eq("is_active", true).gt("ends_at", new Date().toISOString());
  if (activeEpicError) throw activeEpicError;
  const existingEpicSource = new Map((activeEpicRows || []).map((row) => [titleKey(row.title), row.source_id]));
  const matchedGamerPowerSource = new Map(eligible.filter((item) => item.platforms.includes("Epic")).map((item) => [titleKey(item.title), `gamerpower:${item.id}`]));

  const primaryOfferKeys = new Set([
    ...epicOffers.map(({ offer }) => `${titleKey(offer.title)}:epic-games`),
    ...secondaryOffers.map((item) => `${titleKey(item.title)}:${slugify(storeName(item.platforms))}`),
  ]);
  const uniqueFreeDeals = freeDeals.filter((deal) => {
    const key = `${titleKey(deal.title)}:${slugify(canonicalStore(deal.store, deal.activation))}`;
    if (primaryOfferKeys.has(key)) return false;
    primaryOfferKeys.add(key);
    return true;
  });

  const rows: GameRow[] = [
    ...epicOffers.map(({ offer, promotion, originalPrice, image, claimUrl }) => ({
      source_id: existingEpicSource.get(titleKey(offer.title)) || matchedGamerPowerSource.get(titleKey(offer.title)) || `epic:${offer.namespace || "catalog"}:${offer.id}`,
      slug: `${slugify(offer.title)}-${slugify(offer.id)}`,
      title: offer.title,
      store: "Epic Games",
      description: (offer.description || "Jogo grátis por tempo limitado na Epic Games Store.").slice(0, 500),
      image_url: image,
      claim_url: claimUrl,
      original_price: originalPrice,
      starts_at: new Date(promotion.startDate!).toISOString(),
      ends_at: new Date(promotion.endDate!).toISOString(),
      genres: ["Jogo grátis"],
      featured: true,
      is_active: true,
    })),
    ...secondaryOffers.map((item) => ({
      source_id: `gamerpower:${item.id}`,
      slug: `${slugify(item.title)}-${item.id}`,
      title: item.title,
      store: storeName(item.platforms),
      description: item.description.slice(0, 500),
      image_url: heroImages.get(item.id) || item.image || item.thumbnail,
      claim_url: item.open_giveaway_url,
      original_price: Number(item.worth.replace(/[^0-9.]/g, "")),
      starts_at: new Date(item.published_date).toISOString(),
      ends_at: item.end_date === "N/A" ? new Date(Date.now() + 30 * 864e5).toISOString() : new Date(item.end_date).toISOString(),
      genres: ["Jogo grátis"],
      featured: false,
      is_active: true,
    })),
    ...uniqueFreeDeals.map((deal) => ({
      source_id: `itad:${deal.catalogId}:${slugify(canonicalStore(deal.store, deal.activation))}`,
      slug: `${slugify(deal.title)}-${slugify(deal.catalogId)}-${slugify(canonicalStore(deal.store, deal.activation))}`,
      title: deal.title,
      store: canonicalStore(deal.store, deal.activation),
      description: `Jogo pago disponível gratuitamente por tempo limitado na ${canonicalStore(deal.store, deal.activation)}.`,
      image_url: deal.imageUrl,
      claim_url: deal.url,
      original_price: deal.originalPrice,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      genres: ["Jogo grátis"],
      featured: ["Steam", "Epic Games"].includes(canonicalStore(deal.store, deal.activation)),
      is_active: true,
    })),
  ];

  const { data: stored, error } = await db.rpc("sync_free_games", { payload: rows, sync_token: cronToken || secret });
  if (error) throw error;

  const storedGames = Array.isArray(stored) ? stored as unknown as (Game & { is_new?: boolean; notified_at?: string | null })[] : [];
  const fresh = storedGames.filter((game) => (game.is_new || !game.notified_at) && Number(game.original_price) > 0);
  let sent = 0;
  let failed = 0;
  for (const game of fresh) {
    const result = await sendPush(game, cronToken);
    sent += result.sent;
    failed += result.failed;
    if (result.failed === 0) {
      const { error: notifiedError } = await db.rpc("mark_game_notified", { game_id: game.id, sync_token: cronToken || secret });
      if (notifiedError) throw notifiedError;
    }
  }

  revalidatePath("/");
  const result = { ok: true, checked: offers.length, eligible: rows.length, epicDirect: epicOffers.length, freeDeals: uniqueFreeDeals.length, notificationCandidates: fresh.length, notifications: sent, notificationFailures: failed, sources: { gamerPower: gamerPowerResult.status, epic: epicResult.status, deals: dealsResult.status }, durationMs: Date.now() - startedAt };
  console.info("free-games-sync", result);
  return Response.json(result);
}

export async function GET(request: NextRequest) {
  try {
    return await synchronize(request);
  } catch (error) {
    console.error("free-games-sync-failed", error);
    const detail = error instanceof Error ? error.message : (error as { message?: string })?.message || JSON.stringify(error);
    return Response.json({ error: "Falha na sincronização", detail }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
