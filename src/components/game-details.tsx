"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  Monitor,
  Share2,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { SteamGameDetails, StoreOffer } from "@/lib/deals";
import { SiteHeader } from "./site-header";
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export function GameDetails({ game, offers }: { game: SteamGameDetails; offers: StoreOffer[] }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSaved(
          (
            JSON.parse(
              localStorage.getItem("triobrabo:deal-wishlist") || "[]",
            ) as number[]
          ).includes(game.appId),
        );
      } catch {}
    });
  }, [game.appId]);
  const toggle = () => {
    const current = JSON.parse(
      localStorage.getItem("triobrabo:deal-wishlist") || "[]",
    ) as number[];
    const next = current.includes(game.appId)
      ? current.filter((id) => id !== game.appId)
      : [...current, game.appId];
    localStorage.setItem("triobrabo:deal-wishlist", JSON.stringify(next));
    setSaved(next.includes(game.appId));
  };
  const steamUrl = `https://store.steampowered.com/app/${game.appId}/?cc=BR&l=brazilian`;
  return (
    <>
      <SiteHeader />
      <main className="deal-detail">
        <Link className="back-link" href="/buscar">
          <ArrowLeft /> Voltar ao catálogo
        </Link>
        <section className="detail-hero">
          <div>
            <p className="eyebrow">
              <Check /> Catálogo TrioBrabo
            </p>
            <h1>{game.name}</h1>
            <p>{game.shortDescription}</p>
            <div className="detail-tags">
              {game.genres.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            {game.currentPrice !== null ? (
              <div className="detail-price">
                {game.discount > 0 && game.originalPrice !== null ? (
                  <s>{brl.format(game.originalPrice)}</s>
                ) : null}
                <strong>
                  {game.currentPrice === 0
                    ? "Grátis"
                    : brl.format(game.currentPrice)}
                </strong>
                {game.discount > 0 ? <b>-{game.discount}%</b> : null}
              </div>
            ) : null}
            <div className="detail-actions">
              <a href={steamUrl} target="_blank" rel="noreferrer">
                Ver na Steam
                <ArrowUpRight />
              </a>
              <button onClick={toggle}>
                <Bookmark />
                {saved ? "Salvo" : "Salvar"}
              </button>
              <button
                onClick={() =>
                  navigator.share?.({
                    title: game.name,
                    text: "Confira este jogo no TrioBrabo!",
                    url: window.location.href,
                  })
                }
              >
                <Share2 />
                Compartilhar
              </button>
            </div>
          </div>
          <Image
            src={game.headerImage}
            alt={`Capa de ${game.name}`}
            width={920}
            height={430}
            priority
          />
        </section>
        <section className="offer-compare">
          <div>
            <p className="eyebrow">
              <Store /> Onde comprar
            </p>
            <h2>Preços disponíveis</h2>
          </div>
          {offers.map((offer,index)=><article className={index===0?"best-offer":""} key={`${offer.shop}-${offer.url}`}>
            <Store />
            <div><strong>{offer.shop}</strong><span>{offer.drm.length?`Ativação: ${offer.drm.join(", ")}`:offer.platforms.join(", ")||"PC"}</span></div>
            {offer.discount>0?<s>{brl.format(offer.regular)}</s>:<span/>}
            <b>{brl.format(offer.price)}</b>
            <a href={offer.url} target="_blank" rel="noreferrer">Ir à loja <ArrowUpRight /></a>
          </article>)}
          {!offers.length ? <article>
            <Store />
            <div>
              <strong>Steam</strong>
              <span>Compra e ativação na Steam</span>
            </div>
            {game.discount > 0 && game.originalPrice !== null ? (
              <s>{brl.format(game.originalPrice)}</s>
            ) : (
              <span />
            )}
            <b>
              {game.currentPrice === null
                ? "Consultar"
                : game.currentPrice === 0
                  ? "Grátis"
                  : brl.format(game.currentPrice)}
            </b>
            <a href={steamUrl} target="_blank" rel="noreferrer">
              Ir à loja <ArrowUpRight />
            </a>
          </article> : null}
          {offers.length ? <small>Preços e links fornecidos por IsThereAnyDeal. A primeira opção é o menor preço encontrado.</small> : <small>
            Epic Games, Nuuvem, GOG e outras lojas aparecerão quando houver
            preço e disponibilidade confirmados.
          </small>}
        </section>
        {game.screenshots.length ? (
          <section className="screenshots">
            <h2>Imagens do jogo</h2>
            <div>
              {game.screenshots.map((src, index) => (
                <Image
                  key={src}
                  src={src}
                  alt={`${game.name}, imagem ${index + 1}`}
                  width={600}
                  height={338}
                />
              ))}
            </div>
          </section>
        ) : null}
        <section className="game-info">
          <div>
            <Monitor />
            <h2>Compatibilidade</h2>
            <p>{game.platforms.join(", ") || "PC"}</p>
          </div>
          <div>
            <h2>Estúdio</h2>
            <p>{game.developers.join(", ") || game.publishers.join(", ")}</p>
          </div>
          <div>
            <h2>Requisitos mínimos</h2>
            <p>{game.requirements}</p>
          </div>
        </section>
      </main>
    </>
  );
}
