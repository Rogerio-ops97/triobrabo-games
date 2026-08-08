"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import type { Deal } from "@/lib/deals";
import type { Game } from "@/lib/types";
import { SiteHeader } from "./site-header";
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export function SearchHub({ games, deals }: { games: Game[]; deals: Deal[] }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase("pt-BR");
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
            <Search /> Busca universal
          </p>
          <h1>
            Encontre o jogo.
            <br />
            <em>O TrioBrabo encontra a oportunidade.</em>
          </h1>
          <label>
            <Search />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite o nome de um jogo..."
            />
          </label>
        </section>
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
                <Image src={deal.imageUrl} alt="" width={150} height={80} />
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
      </main>
    </>
  );
}
