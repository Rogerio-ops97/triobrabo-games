"use client";

import Link from "next/link";
import { Bookmark, Gamepad2, Menu, Search, Tag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/#jogos", label: "Grátis", icon: Gamepad2, path: "/" },
  { href: "/ofertas", label: "Ofertas", icon: Tag, path: "/ofertas" },
  { href: "/buscar", label: "Explorar", icon: Search, path: "/buscar" },
  { href: "/?salvos=1#jogos", label: "Salvos", icon: Bookmark, path: "" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="mobile-nav" aria-label="Navegação principal no celular">
        {items.map(({ href, label, icon: Icon, path }) => (
          <Link key={label} href={href} className={path && (path === "/" ? pathname === "/" : pathname.startsWith(path)) ? "active" : ""}>
            <Icon /><span>{label}</span>
          </Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /><span>Menu</span></button>
      </nav>
      {open ? (
        <div className="mobile-menu-backdrop" onClick={() => setOpen(false)}>
          <section className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu do aplicativo" onClick={(event) => event.stopPropagation()}>
            <div><strong>TrioBrabo Games Drop</strong><button onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button></div>
            <Link href="/" onClick={() => setOpen(false)}>Jogos grátis</Link>
            <Link href="/ofertas" onClick={() => setOpen(false)}>Melhores ofertas</Link>
            <Link href="/buscar" onClick={() => setOpen(false)}>Explorar catálogo</Link>
            <Link href="/plataformas" onClick={() => setOpen(false)}>Plataformas monitoradas</Link>
            <Link href="/como-usar" onClick={() => setOpen(false)}>Como instalar e usar</Link>
          </section>
        </div>
      ) : null}
    </>
  );
}
