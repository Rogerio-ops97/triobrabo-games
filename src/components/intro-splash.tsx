"use client";
import Image from "next/image";
import { useEffect,useState } from "react";

function freshSelection(images:string[]){
 const unique=[...new Set(images)].filter(Boolean);let previous:string[]=[];try{previous=JSON.parse(localStorage.getItem("triobrabo:last-intro-images")||"[]")}catch{}
 let pool=unique.filter(image=>!previous.includes(image));if(pool.length<6)pool=unique;
 for(let index=pool.length-1;index>0;index--){const random=new Uint32Array(1);crypto.getRandomValues(random);const target=random[0]%(index+1);[pool[index],pool[target]]=[pool[target],pool[index]]}
 const selected=pool.slice(0,6);localStorage.setItem("triobrabo:last-intro-images",JSON.stringify(selected));return selected;
}
export function IntroSplash({images}:{images:string[]}){
 const [visible,setVisible]=useState(false);const [exiting,setExiting]=useState(false);const [displayImages,setDisplayImages]=useState<string[]>([]);
 useEffect(()=>{if(sessionStorage.getItem("triobrabo:intro-shown")==="1")return;sessionStorage.setItem("triobrabo:intro-shown","1");queueMicrotask(()=>{setDisplayImages(freshSelection(images));setVisible(true)});const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const exitTimer=window.setTimeout(()=>setExiting(true),reduced?100:5250);const closeTimer=window.setTimeout(()=>setVisible(false),reduced?250:6000);return()=>{clearTimeout(exitTimer);clearTimeout(closeTimer)}},[images]);
 if(!visible)return null;const close=()=>{setExiting(true);window.setTimeout(()=>setVisible(false),350)};
 return <section className={`intro-splash ${exiting?"intro-exit":""}`} aria-label="Introdução TrioBrabo Games Drop"><div className="intro-gallery" aria-hidden="true">{displayImages.map((src,index)=><span key={`${src}-${index}`} style={{backgroundImage:`url(${src})`}}/>)}</div><div className="intro-shade"/><div className="intro-grid" aria-hidden="true"/><div className="intro-orbit intro-orbit-one" aria-hidden="true"/><div className="intro-orbit intro-orbit-two" aria-hidden="true"/><div className="intro-particles" aria-hidden="true">{Array.from({length:14},(_,index)=><i key={index}/>)}</div><div className="intro-brand"><Image src="/trio-brabo-logo.png" width={148} height={148} priority alt="Logo TrioBrabo Games Drop"/><p>TRIOBRABO</p><h1>GAMES <em>DROP</em></h1><div className="intro-rule"/><strong>Feito entre amigos.<br/>Criado para nenhum drop passar.</strong></div><button onClick={close}>Pular introdução</button><div className="intro-progress"/></section>;
}
