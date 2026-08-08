"use client";
import { useEffect,useMemo,useState } from "react";
import { Bell,Bookmark,ChevronRight,Clock3,Gamepad2,Search,SlidersHorizontal,Sparkles } from "lucide-react";
import type { Game } from "@/lib/types";
import { hoursLeft,money } from "@/lib/games";
const stores=["Todas","Epic Games","Steam","GOG","Prime Gaming"];
export function GameBrowser({games}:{games:Game[]}){
 const [query,setQuery]=useState(""); const [store,setStore]=useState("Todas"); const [saved,setSaved]=useState<string[]>([]); const [onlySaved,setOnlySaved]=useState(false);
 useEffect(()=>{queueMicrotask(()=>setSaved(JSON.parse(localStorage.getItem("freedrop:saved")||"[]")));},[]);
 const toggle=(id:string)=>setSaved(v=>{const n=v.includes(id)?v.filter(x=>x!==id):[...v,id];localStorage.setItem("freedrop:saved",JSON.stringify(n));return n});
 const shown=useMemo(()=>games.filter(g=>(store==="Todas"||g.store===store)&&(!query||`${g.title} ${g.genres.join(" ")}`.toLowerCase().includes(query.toLowerCase()))&&(!onlySaved||saved.includes(g.id))),[games,store,query,onlySaved,saved]);
 const featured=games.find(g=>g.featured)||games[0];
 return <>
  <header><a className="brand" href="#"><span><Gamepad2 size={21}/></span>FreeDrop</a><nav><a className="active" href="#jogos">Jogos grátis</a><button onClick={()=>setOnlySaved(v=>!v)}><Bookmark size={17}/> Salvos <b>{saved.length}</b></button></nav><button className="notify"><Bell size={18}/> Ativar alertas</button></header>
  <main>
   <section className="hero"><div><p className="eyebrow"><Sparkles size={15}/> Sua próxima aventura não custa nada</p><h1>Jogos incríveis.<br/><em>Preço zero.</em></h1><p>Ofertas gratuitas de verdade, reunidas em um só lugar. Descubra, salve e resgate antes que acabem.</p><a className="primary" href="#jogos">Explorar ofertas <ChevronRight size={18}/></a></div>
    {featured&&<article className="featured" style={{backgroundImage:`linear-gradient(90deg,rgba(10,11,14,.94),rgba(10,11,14,.12)),url(${featured.image_url})`}}><span>Destaque da semana</span><div><small>{featured.store}</small><h2>{featured.title}</h2><p>{featured.description}</p><strong>Grátis agora</strong><s>{money(featured.original_price)}</s></div></article>}
   </section>
   <section className="stats"><div><strong>{games.length}</strong><span>ofertas ativas</span></div><div><strong>{money(games.reduce((n,g)=>n+g.original_price,0))}</strong><span>em jogos grátis</span></div><div><strong>{new Set(games.map(g=>g.store)).size}</strong><span>lojas monitoradas</span></div></section>
   <section id="jogos" className="catalog"><div className="section-title"><div><p>Atualizado diariamente</p><h2>Grátis para resgatar</h2></div><span>{shown.length} ofertas</span></div>
    <div className="toolbar"><label><Search size={18}/><input aria-label="Buscar jogos" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por jogo ou gênero..."/></label><div className="pills"><SlidersHorizontal size={17}/>{stores.map(s=><button className={store===s?"selected":""} onClick={()=>setStore(s)} key={s}>{s}</button>)}</div></div>
    <div className="grid">{shown.map(g=><article className="card" key={g.id}><div className="cover" style={{backgroundImage:`url(${g.image_url})`}}><span>{g.store}</span><button aria-label={`Salvar ${g.title}`} className={saved.includes(g.id)?"saved":""} onClick={()=>toggle(g.id)}><Bookmark size={18}/></button></div><div className="card-body"><div className="tags">{g.genres.map(x=><span key={x}>{x}</span>)}</div><h3>{g.title}</h3><p>{g.description}</p><div className="price"><div><strong>Grátis</strong><s>{money(g.original_price)}</s></div><span><Clock3 size={15}/> {hoursLeft(g.ends_at)}h restantes</span></div><a href={g.claim_url} target="_blank" rel="noreferrer">Resgatar agora <ChevronRight size={17}/></a></div></article>)}</div>
    {!shown.length&&<div className="empty"><Gamepad2/><h3>Nenhuma oferta encontrada</h3><p>Tente outro termo ou limpe os filtros.</p></div>}
   </section>
  </main><footer><a className="brand" href="#"><span><Gamepad2 size={19}/></span>FreeDrop</a><p>As ofertas pertencem às respectivas lojas. Sempre grátis para usar.</p></footer>
 </>;
}
