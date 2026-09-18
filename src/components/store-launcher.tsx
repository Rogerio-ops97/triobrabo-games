"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function StoreLauncher({ appUrl, fallbackUrl }: { appUrl: string; fallbackUrl: string }) {
  const [waiting, setWaiting] = useState(true);

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      setWaiting(false);
      window.location.replace(fallbackUrl);
    }, 1800);
    window.location.href = appUrl;
    return () => window.clearTimeout(fallback);
  }, [appUrl, fallbackUrl]);

  return (
    <main className="store-launcher">
      <Image src="/trio-brabo-logo.png" width={96} height={96} alt="TrioBrabo Games Drop" />
      <p>{waiting ? "Abrindo a Steam…" : "Não encontramos o aplicativo."}</p>
      <h1>Seu jogo está a um toque.</h1>
      <span>Se a Steam não abrir automaticamente, continue pela loja no navegador.</span>
      <a href={fallbackUrl}>Abrir no navegador <ExternalLink size={18} /></a>
    </main>
  );
}
