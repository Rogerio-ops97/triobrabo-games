"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Gamepad2,
  LoaderCircle,
  Search,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Deal } from "@/lib/deals";
import type { Game } from "@/lib/types";
import { SiteHeader } from "./site-header";
type CatalogItem = {
  id: string;
  title: string;
  imageUrl: string;
  currentPrice: number | null;
  originalPrice: number | null;
  discount: number;
  metascore: string | null;
  platforms: string[];
};
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export function SearchHub({ games, deals }: { games: Game[]; deals: Deal[] }) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const term = query.trim().toLocaleLowerCase("pt-BR");
  useEffect(() => {
    if (term.length < 2) {
      queueMicrotask(() => {
        setCatalog([]);
        setLoading(false);
      });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        setCatalog(data.items ?? []);
      } catch {
        if (!controller.signal.aborted) setCatalog([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  const results = useMemo(
    () => ({
      games: games.filter(
        (item) => !term || item.title.toLocaleLowerCase("pt-BR").includes(term),
      ),
      deals: deals.filter(
        (item) => !term || item.title.toLocaleLowerCase("pt-BR").includes(term),
      ),
    }),
    [deals, games, term],
  );
  return (
    <>
      <SiteHeader />
      <main className="search-page">
        <section>
          <p className="eyebrow">
            <Search /> Catálogo completo
          </p>
          <h1>
            Procure qualquer jogo.
            <br />
            <em>Veja o preço atual.</em>
          </h1>
          <label>
            <Search />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Elden Ring, GTA, Cyberpunk..."
              aria-label="Pesquisar no catálogo completo"
            />
            {loading ? <LoaderCircle className="search-loading" /> : null}
          </label>
          <small className="search-help">
            Pesquise por pelo menos duas letras. Catálogo de jogos em várias lojas de PC.
          </small>
        </section>
        {term.length >= 2 ? (
          <section className="catalog-results">
            <div className="catalog-results-head">
              <h2>Jogos encontrados</h2>
              <span>
                {loading ? "Buscando..." : `${catalog.length} resultados`}
              </span>
            </div>
            {!loading && !catalog.length ? (
              <div className="deals-empty">
                <Search />
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente o nome completo ou outra grafia.</p>
              </div>
            ) : (
              <div className="catalog-list">
                {catalog.map((item) => (
                  <Link
                    href={`/jogos/${item.id}`}
                    className="catalog-item"
                    key={item.id}
                  >
                    {item.imageUrl ? <Image
                      src={item.imageUrl}
                      alt={`Capa de ${item.title}`}
                      width={231}
                      height={87}
                    /> : <span className="catalog-placeholder"><Gamepad2 /></span>}
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {item.platforms.join(" · ") || "PC"}
                        {item.metascore ? ` · Nota ${item.metascore}` : ""}
                      </small>
                    </div>
                    <div className="catalog-price">
                      {item.discount > 0 && item.originalPrice !== null ? (
                        <s>{brl.format(item.originalPrice)}</s>
                      ) : null}
                      <b>
                        {item.currentPrice === null
                          ? "Ver preço"
                          : item.currentPrice === 0
                            ? "Grátis"
                            : brl.format(item.currentPrice)}
                      </b>
                      {item.discount > 0 ? (
                        <span>-{item.discount}%</span>
                      ) : null}
                    </div>
                    <ArrowUpRight />
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="search-columns">
            <section>
              <h2>
                <Gamepad2 /> Grátis agora <span>{results.games.length}</span>
              </h2>
              {results.games.map((game) => (
                <a
                  className="search-result"
                  href={game.claim_url}
                  target="_blank"
                  rel="noreferrer"
                  key={game.id}
                >
                  <span
                    className="search-thumb"
                    role="img"
                    aria-label={`Capa de ${game.title}`}
                    style={{ backgroundImage: `url(${game.image_url})` }}
                  />
                  <div>
                    <small>{game.store}</small>
                    <strong>{game.title}</strong>
                    <span>Resgatar gratuitamente</span>
                  </div>
                  <ArrowUpRight />
                </a>
              ))}
            </section>
            <section>
              <h2>
                <Tag /> Em promoção <span>{results.deals.length}</span>
              </h2>
              {results.deals.map((deal) => (
                <Link
                  className="search-result"
                  href={`/ofertas/${deal.appId}`}
                  key={deal.id}
                >
                  <Image
                    src={deal.imageUrl}
                    alt={`Capa de ${deal.title}`}
                    width={150}
                    height={80}
                  />
                  <div>
                    <small>
                      {deal.store} · -{deal.discount}%
                    </small>
                    <strong>{deal.title}</strong>
                    <span>{brl.format(deal.salePrice)}</span>
                  </div>
                  <ArrowUpRight />
                </Link>
              ))}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
