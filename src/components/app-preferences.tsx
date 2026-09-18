"use client";

import { BellRing, Check, History, Settings, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

const RELEASE_ID = "2026-09-18-notifications-and-preferences-v1";

export function AppPreferences() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [introEnabled, setIntroEnabled] = useState(() => typeof window === "undefined" || localStorage.getItem("triobrabo:intro-enabled") !== "0");

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("triobrabo:open-settings", openSettings);
    const timer = window.setTimeout(() => {
      if (localStorage.getItem("triobrabo:release-seen") !== RELEASE_ID) setReleaseOpen(true);
    }, localStorage.getItem("triobrabo:intro-enabled") === "0" ? 700 : 6300);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("triobrabo:open-settings", openSettings);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen && !releaseOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setReleaseOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [settingsOpen, releaseOpen]);

  const setIntro = (enabled: boolean) => {
    setIntroEnabled(enabled);
    localStorage.setItem("triobrabo:intro-enabled", enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent("triobrabo:intro-preference", { detail: enabled }));
  };
  const dismissRelease = () => {
    localStorage.setItem("triobrabo:release-seen", RELEASE_ID);
    setReleaseOpen(false);
  };

  return (
    <>
      {settingsOpen ? <div className="preference-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSettingsOpen(false)}>
        <section className="preference-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
          <button className="preference-close" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><X /></button>
          <div className="preference-heading"><Settings /><p>Preferências</p><h2 id="preferences-title">Seu app, do seu jeito.</h2><span>Estas escolhas ficam salvas somente neste dispositivo.</span></div>
          <label className="preference-row">
            <div><strong>Exibir introdução ao abrir</strong><small>Mostra a apresentação cinematográfica uma vez por sessão.</small></div>
            <input type="checkbox" checked={introEnabled} onChange={(event) => setIntro(event.target.checked)} />
            <i aria-hidden="true"><span /></i>
          </label>
          <button className="preference-done" onClick={() => setSettingsOpen(false)}>Concluir</button>
        </section>
      </div> : null}

      {releaseOpen ? <div className="preference-backdrop release-backdrop" onMouseDown={(event) => event.target === event.currentTarget && dismissRelease()}>
        <section className="release-modal" role="dialog" aria-modal="true" aria-labelledby="release-title">
          <button className="preference-close" onClick={dismissRelease} aria-label="Fechar novidades"><X /></button>
          <p className="release-kicker">Atualização TrioBrabo</p>
          <h2 id="release-title">Novidades que deixam seus drops mais certeiros.</h2>
          <div className="release-list">
            <article><History /><div><strong>Sem alertas repetidos</strong><span>O mesmo jogo fica protegido contra novos avisos por 30 dias.</span></div><Check /></article>
            <article><Smartphone /><div><strong>Steam mais direta</strong><span>Ofertas compatíveis tentam abrir primeiro no aplicativo, com fallback para o navegador.</span></div><Check /></article>
            <article><BellRing /><div><strong>Introdução opcional</strong><span>Você pode desligá-la a qualquer momento nas configurações.</span></div><Check /></article>
          </div>
          <button className="release-confirm" onClick={dismissRelease}>Entendi, vamos aos jogos</button>
          <small>Este aviso aparece apenas uma vez neste dispositivo.</small>
        </section>
      </div> : null}
    </>
  );
}
