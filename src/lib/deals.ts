export type Deal = {
  id: string;
  appId: number;
  title: string;
  imageUrl: string;
  store: "Steam";
  activation: "Steam";
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

export type SteamGameDetails = {
  appId: number;
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
