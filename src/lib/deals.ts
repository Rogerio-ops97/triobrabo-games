export type Deal = {
  id: string;
  appId: number;
  catalogId: string;
  title: string;
  imageUrl: string;
  store: string;
  activation: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  url: string;
};
type SteamSpecial = {
  id: number;
  name: string;
  header_image?: string;
  large_capsule_image?: string;
  original_price?: number;
  final_price?: number;
  discount_percent?: number;
};
const STEAM_SPECIALS =
  "https://store.steampowered.com/api/featuredcategories?cc=BR&l=brazilian";
export async function getBrazilianDeals(): Promise<Deal[]> {
  try {
    const response = await fetch(STEAM_SPECIALS, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      specials?: { items?: SteamSpecial[] };
    };
    const deals = (payload.specials?.items ?? [])
      .filter(
        (item) =>
          item.final_price !== undefined &&
          item.original_price !== undefined &&
          (item.discount_percent ?? 0) > 0,
      )
      .map((item) => ({
        id: `steam-${item.id}`,
        appId: item.id,
        catalogId: String(item.id),
        title: item.name,
        imageUrl: item.large_capsule_image ?? item.header_image ?? "",
        store: "Steam" as const,
        activation: "Steam" as const,
        originalPrice: (item.original_price ?? 0) / 100,
        salePrice: (item.final_price ?? 0) / 100,
        discount: item.discount_percent ?? 0,
        url: `https://store.steampowered.com/app/${item.id}/?cc=BR&l=brazilian`,
      }));
    return Array.from(
      new Map(deals.map((deal) => [deal.id, deal])).values(),
    ).sort((a, b) => b.discount - a.discount);
  } catch {
    return [];
  }
}

type ItadDealItem = {
  id: string;
  title: string;
  type: string;
  assets?: ItadAssets;
  deal: {
    shop: { name: string };
    price: { amount: number };
    regular: { amount: number };
    cut: number;
    drm?: Array<{ name: string }>;
    platforms?: Array<{ name: string }>;
    url: string;
  };
};

export async function getMultiStoreDeals(): Promise<Deal[]> {
  const key = process.env.ITAD_API_KEY;
  if (!key) return getBrazilianDeals();
  try {
    const response = await fetch("https://api.isthereanydeal.com/deals/v2", {
      method: "POST",
      headers: { "content-type": "application/json", "ITAD-API-Key": key },
      body: JSON.stringify({ country: "BR", limit: 100, sort: "-cut", nondeals: false, mature: false }),
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return getBrazilianDeals();
    const payload = (await response.json()) as { list?: ItadDealItem[] };
    const deals = (payload.list ?? [])
      .filter((item) => item.type === "game" && item.deal.cut > 0)
      .map((item) => ({
        id: `${item.id}-${item.deal.shop.name}`,
        appId: 0,
        catalogId: item.id,
        title: item.title,
        imageUrl: item.assets?.banner400 ?? item.assets?.banner300 ?? item.assets?.banner600 ?? item.assets?.boxart ?? "",
        store: item.deal.shop.name,
        activation: item.deal.drm?.map((drm) => drm.name).join(", ") || item.deal.platforms?.map((platform) => platform.name).join(", ") || "PC",
        originalPrice: item.deal.regular.amount,
        salePrice: item.deal.price.amount,
        discount: item.deal.cut,
        url: item.deal.url,
      }));
    const unique = new Map<string, Deal>();
    for (const deal of deals) {
      const key = deal.catalogId || deal.title.trim().toLocaleLowerCase("pt-BR");
      const current = unique.get(key);
      if (!current || deal.salePrice < current.salePrice) unique.set(key, deal);
    }
    return Array.from(unique.values());
  } catch {
    return getBrazilianDeals();
  }
}

export type SteamGameDetails = {
  appId: number | null;
  catalogId?: string;
  name: string;
  shortDescription: string;
  headerImage: string;
  website: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  platforms: string[];
  screenshots: string[];
  requirements: string;
  originalPrice: number | null;
  currentPrice: number | null;
  discount: number;
};
type ItadAssets = Partial<Record<"boxart" | "banner145" | "banner300" | "banner400" | "banner600", string>>;
type ItadGame = {
  id: string;
  title: string;
  type: string;
  assets?: ItadAssets;
  appid?: number | null;
  tags?: string[];
  developers?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
};
export type StoreOffer = {
  shop: string;
  price: number;
  regular: number;
  discount: number;
  drm: string[];
  platforms: string[];
  url: string;
};
export async function getMultiStoreOffers(title: string): Promise<StoreOffer[]> {
  const key = process.env.ITAD_API_KEY;
  if (!key) return [];
  try {
    const headers = { "content-type": "application/json", "ITAD-API-Key": key };
    const lookup = await fetch("https://api.isthereanydeal.com/lookup/id/title/v1", {
      method: "POST",
      headers,
      body: JSON.stringify([title]),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!lookup.ok) return [];
    const ids = (await lookup.json()) as Record<string, string | null>;
    const id = ids[title];
    if (!id) return [];
    return getMultiStoreOffersById(id);
  } catch {
    return [];
  }
}
export async function getMultiStoreOffersById(id: string): Promise<StoreOffer[]> {
  const key = process.env.ITAD_API_KEY;
  if (!key) return [];
  try {
    const headers = { "content-type": "application/json", "ITAD-API-Key": key };
    const prices = await fetch("https://api.isthereanydeal.com/games/prices/v3?country=BR&deals=false&capacity=30", {
      method: "POST",
      headers,
      body: JSON.stringify([id]),
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!prices.ok) return [];
    const payload = (await prices.json()) as { deals?: Array<{ shop:{name:string}; price:{amount:number}; regular:{amount:number}; cut:number; drm?:Array<{name:string}>; platforms?:Array<{name:string}>; url:string }> } | Array<{ deals?: Array<{ shop:{name:string}; price:{amount:number}; regular:{amount:number}; cut:number; drm?:Array<{name:string}>; platforms?:Array<{name:string}>; url:string }> }>;
    const result = Array.isArray(payload) ? payload[0] : payload;
    return (result?.deals ?? []).map((deal) => ({ shop:deal.shop.name, price:deal.price.amount, regular:deal.regular.amount, discount:deal.cut, drm:(deal.drm??[]).map(item=>item.name), platforms:(deal.platforms??[]).map(item=>item.name), url:deal.url })).sort((a,b)=>a.price-b.price);
  } catch {
    return [];
  }
}
export async function getCatalogGameDetails(id: string): Promise<SteamGameDetails | null> {
  const key = process.env.ITAD_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(
      `https://api.isthereanydeal.com/games/info/v2?id=${encodeURIComponent(id)}`,
      { headers: { "ITAD-API-Key": key }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const info = (await response.json()) as ItadGame;
    if (info.appid) {
      const steam = await getSteamGameDetails(info.appid);
      if (steam) return { ...steam, catalogId: info.id };
    }
    const image = info.assets?.banner600 ?? info.assets?.banner400 ?? info.assets?.banner300 ?? info.assets?.boxart ?? "";
    return {
      appId: info.appid ?? null,
      catalogId: info.id,
      name: info.title,
      shortDescription: "Compare o preço atual e a disponibilidade deste jogo nas lojas monitoradas pelo TrioBrabo.",
      headerImage: image,
      website: "https://isthereanydeal.com/",
      developers: (info.developers ?? []).map((item) => item.name),
      publishers: (info.publishers ?? []).map((item) => item.name),
      genres: (info.tags ?? []).slice(0, 8),
      platforms: ["PC"],
      screenshots: [],
      requirements: "Os requisitos variam conforme a versão. Consulte a loja escolhida antes da compra.",
      originalPrice: null,
      currentPrice: null,
      discount: 0,
    };
  } catch {
    return null;
  }
}
export async function getSteamGameDetails(
  appId: number,
): Promise<SteamGameDetails | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=BR&l=brazilian`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const result = (await response.json()) as Record<
      string,
      {
        success: boolean;
        data?: {
          name: string;
          short_description: string;
          header_image: string;
          website?: string;
          developers?: string[];
          publishers?: string[];
          genres?: { description: string }[];
          platforms?: Record<string, boolean>;
          screenshots?: { path_full: string }[];
          pc_requirements?: { minimum?: string };
          price_overview?: {
            initial: number;
            final: number;
            discount_percent: number;
          };
        };
      }
    >;
    const data = result[String(appId)]?.data;
    if (!data) return null;
    const requirements = (
      data.pc_requirements?.minimum ??
      "Consulte os requisitos completos na loja."
    )
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      appId,
      name: data.name,
      shortDescription: data.short_description,
      headerImage: data.header_image,
      website: data.website ?? `https://store.steampowered.com/app/${appId}`,
      developers: data.developers ?? [],
      publishers: data.publishers ?? [],
      genres: (data.genres ?? []).map((item) => item.description),
      platforms: Object.entries(data.platforms ?? {})
        .filter(([, enabled]) => enabled)
        .map(([name]) => name),
      screenshots: (data.screenshots ?? [])
        .slice(0, 6)
        .map((item) => item.path_full),
      requirements,
      originalPrice: data.price_overview ? data.price_overview.initial / 100 : null,
      currentPrice: data.price_overview ? data.price_overview.final / 100 : null,
      discount: data.price_overview?.discount_percent ?? 0,
    };
  } catch {
    return null;
  }
}
