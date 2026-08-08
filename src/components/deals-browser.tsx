"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgePercent,
  Bookmark,
  CalendarDays,
  Check,
  Search,
  Share2,
  SlidersHorizontal,
  Store,
  Users,
} from "lucide-react";
import type { Deal } from "@/lib/deals";
import { SiteHeader } from "./site-header";
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const events = [
  { name: "Cyberpunk Fest", date: "3–10 ago", status: "Acontecendo agora" },
  { name: "Pins & Pegs Fest", date: "17–20 ago", status: "Em breve" },
  {
    name: "Festival de sobrevivência PvE",
    date: "31 ago–7 set",
    status: "Em breve",
  },
  { name: "Promoção de Outono", date: "1–8 out", status: "Sazonal" },
  { name: "Steam Next Fest", date: "19–26 out", status: "Demos" },
  { name: "Promoção de Inverno", date: "17 dez–4 jan", status: "Sazonal" },
];
const verdict = (discount: number) =>
  discount >= 80
    ? "Imperdível"
    : discount >= 60
      ? "Vale muito"
      : discount >= 40
        ? "Boa oferta"
        : "Preço reduzido";
export function DealsBrowser({ deals }: { deals: Deal[] }) {
  const [query, setQuery] = useState("");
  const [minimum, setMinimum] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSaved(
          JSON.parse(localStorage.getItem("triobrabo:deal-wishlist") || "[]"),
        );
      } catch {}
    });
  }, []);
  const toggle = (id: number) =>
    setSaved((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      localStorage.setItem("triobrabo:deal-wishlist", JSON.stringify(next));
      return next;
    });
  const shown = useMemo(
    () =>
      deals.filter(
        (deal) =>
          deal.discount >= minimum &&
          (!maxPrice || deal.salePrice <= maxPrice) &&
          (!onlySaved || saved.includes(deal.appId)) &&
          deal.title
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")),
      ),
    [deals, maxPrice, minimum, onlySaved, query, saved],
  );
  return (
    <>
      <SiteHeader />
      <main className="deals-page">
        <section className="deals-hero compact">
          <div>
            <p className="eyebrow">
              <BadgePercent /> Ofertas em destaque
            </p>
            <h1>
              Promoções que
              <br />
              <em>valem o clique.</em>
            </h1>
            <span>
              Compare oportunidades, filtre o que interessa e vá direto para a
              loja.
            </span>
          </div>
          <div className="deal-summary">
            <strong>{deals.length}</strong>
            <span>ofertas atualizadas</span>
            <b>{saved.length}</b>
            <span>jogos na sua lista</span>
          </div>
        </section>
        <section className="deal-channels" aria-label="Lojas do radar">
          <strong>Agora no radar</strong>
          <span className="ready">
            <i />
            Steam ao vivo
          </span>
          <span>Nuuvem em preparação</span>
          <span>Epic em preparação</span>
          <span>GOG em preparação</span>
          <small>Marketplaces de chaves são identificados separadamente.</small>
        </section>
        <section className="deals-catalog">
          <div className="section-title">
            <div>
              <p>Atualizadas automaticamente</p>
              <h2>Melhores ofertas agora</h2>
            </div>
            <span>{shown.length} promoções</span>
          </div>
          <div className="deals-toolbar premium-filters">
            <label>
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar uma promoção..."
                aria-label="Buscar promoções"
              />
            </label>
            <div>
              <SlidersHorizontal />
              {[0, 50, 70, 80].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={minimum === value ? "selected" : ""}
                  onClick={() => setMinimum(value)}
                >
                  {value ? `${value}%+` : "Todas"}
                </button>
              ))}
            </div>
            <div className="price-filters">
              {[0, 20, 30, 50].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={maxPrice === value ? "selected" : ""}
                  onClick={() => setMaxPrice(value)}
                >
                  {value ? `Até R$ ${value}` : "Qualquer preço"}
                </button>
              ))}
            </div>
            <button
              className={`saved-filter ${onlySaved ? "selected" : ""}`}
              onClick={() => setOnlySaved((value) => !value)}
            >
              <Bookmark /> Minha lista ({saved.length})
            </button>
          </div>
          {shown.length ? (
            <div className="deals-grid">
              {shown.map((deal) => (
                <article className="deal-card" key={deal.id}>
                  <Link className="deal-image" href={`/ofertas/${deal.appId}`}>
                    <Image
                      src={deal.imageUrl}
                      alt={`Capa de ${deal.title}`}
                      fill
                      sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"
                    />
                    <b>-{deal.discount}%</b>
                    <span>
                      <Check /> {verdict(deal.discount)}
                    </span>
                  </Link>
                  <div className="deal-body">
                    <div className="deal-store">
                      <Store />
                      <span>{deal.store}</span>
                      <small>Ativa na {deal.activation}</small>
                    </div>
                    <h3>
                      <Link href={`/ofertas/${deal.appId}`}>{deal.title}</Link>
                    </h3>
                    <div className="deal-price">
                      <div>
                        <s>{brl.format(deal.originalPrice)}</s>
                        <strong>{brl.format(deal.salePrice)}</strong>
                      </div>
                      <button
                        className={saved.includes(deal.appId) ? "saved" : ""}
                        onClick={() => toggle(deal.appId)}
                        aria-label={`${saved.includes(deal.appId) ? "Remover" : "Adicionar"} ${deal.title} da lista`}
                      >
                        <Bookmark />
                      </button>
                    </div>
                    <div className="deal-actions">
                      <a href={deal.url} target="_blank" rel="noreferrer">
                        Ver na loja <ArrowUpRight />
                      </a>
                      <button
                        onClick={() =>
                          navigator.share?.({
                            title: deal.title,
                            url: deal.url,
                          })
                        }
                        aria-label={`Compartilhar ${deal.title}`}
                      >
                        <Share2 />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="deals-empty">
              <BadgePercent />
              <h3>Nenhuma oferta com esses filtros</h3>
              <p>Aumente o preço máximo ou reduza o desconto mínimo.</p>
            </div>
          )}
        </section>
        <section className="gamer-calendar">
          <div className="calendar-head">
            <div>
              <p className="eyebrow">
                <CalendarDays /> Agenda gamer
              </p>
              <h2>Próximos eventos</h2>
            </div>
            <span>Datas oficiais anunciadas</span>
          </div>
          <div className="event-rail">
            {events.map((event) => (
              <article key={event.name}>
                <small>{event.status}</small>
                <strong>{event.name}</strong>
                <span>{event.date}</span>
              </article>
            ))}
          </div>
        </section>
        <section className="premium-hub">
          <div>
            <Users />
            <strong>Feito para decidir rápido</strong>
            <span>
              Grátis, promoções, eventos, favoritos e alertas em um só lugar.
            </span>
          </div>
          <Link href="/buscar">
            Abrir busca universal <ArrowUpRight />
          </Link>
        </section>
      </main>
    </>
  );
}
