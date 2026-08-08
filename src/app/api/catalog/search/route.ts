import { NextRequest } from "next/server";

type ItadSearchItem = { id: string; title: string; type: string; assets?: Partial<Record<"boxart" | "banner145" | "banner300" | "banner400" | "banner600", string>> };
type ItadPrice = { id?: string; deals?: Array<{ price: { amount: number }; regular: { amount: number }; cut: number; platforms?: Array<{ name: string }> }> };

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ items: [] });
  const key = process.env.ITAD_API_KEY;
  if (!key) return Response.json({ items: [], error: "catalog-unavailable" }, { status: 503 });
  try {
    const headers = { "content-type": "application/json", "ITAD-API-Key": key };
    const search = await fetch(`https://api.isthereanydeal.com/games/search/v1?title=${encodeURIComponent(query)}&results=30`, { headers, next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
    if (!search.ok) throw new Error("search failed");
    const games = ((await search.json()) as ItadSearchItem[]).filter((item) => item.type === "game").slice(0, 20);
    if (!games.length) return Response.json({ items: [] });
    const pricesResponse = await fetch("https://api.isthereanydeal.com/games/prices/v3?country=BR&deals=false&capacity=1", { method: "POST", headers, body: JSON.stringify(games.map((game) => game.id)), next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
    const prices = pricesResponse.ok ? ((await pricesResponse.json()) as ItadPrice[]) : [];
    const priceMap = new Map(prices.map((entry, index) => [entry.id ?? games[index]?.id, entry.deals?.[0]]));
    const items = games.map((game) => {
      const offer = priceMap.get(game.id);
      return { id: game.id, title: game.title, imageUrl: game.assets?.banner300 ?? game.assets?.banner400 ?? game.assets?.banner600 ?? game.assets?.boxart ?? "", currentPrice: offer?.price.amount ?? null, originalPrice: offer?.regular.amount ?? null, discount: offer?.cut ?? 0, metascore: null, platforms: offer?.platforms?.map((platform) => platform.name) ?? ["PC"] };
    });
    return Response.json({ items, source: "isthereanydeal" });
  } catch {
    return Response.json({ items: [], error: "catalog-unavailable" }, { status: 503 });
  }
}
