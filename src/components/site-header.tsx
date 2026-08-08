"use client";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { AlertButton } from "./alert-button";
export function SiteHeader({saved=0,onSaved}:{saved?:number;onSaved?:()=>void}){return <header><Link className="brand" href="/"><Image className="brand-logo" src="/trio-brabo-logo.png" width={42} height={42} alt="Logo TrioBrabo"/><span className="brand-name">TrioBrabo <b>Games Drop</b></span></Link><nav><Link href="/#jogos">Jogos grátis</Link><Link href="/plataformas">Plataformas</Link>{onSaved&&<button onClick={onSaved}><Bookmark size={17}/> Salvos <b>{saved}</b></button>}</nav><AlertButton/></header>}
