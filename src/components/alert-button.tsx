"use client";
import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

export function AlertButton(){
 const [permission,setPermission]=useState<NotificationPermission|"unsupported">("default");
 useEffect(()=>{queueMicrotask(()=>setPermission("Notification" in window?Notification.permission:"unsupported"));},[]);
 async function activate(){
  if(permission==="unsupported"){alert("Este navegador não oferece notificações. Instale a PWA ou use Chrome, Edge ou Safari atualizado.");return;}
  const registration=await navigator.serviceWorker.register("/sw.js");
  const result=await Notification.requestPermission();setPermission(result);
  if(result==="granted"){
   const keyResponse=await fetch("/api/push/public-key");if(!keyResponse.ok)throw new Error("Push indisponível");const {key}=await keyResponse.json();
   let subscription=await registration.pushManager.getSubscription();
   if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(key)});
   const saved=await fetch("/api/push/subscribe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(subscription)});if(!saved.ok)throw new Error("Falha ao salvar inscrição");
   registration.showNotification("Alertas ativados! 🎮",{body:"Você receberá os próximos jogos pagos que ficarem grátis.",icon:"/trio-brabo-logo.png",badge:"/icon.svg",tag:"alerts-ready"});
  }
 }
 return <button className={`notify ${permission==="granted"?"enabled":""}`} onClick={activate} title={permission==="granted"?"Alertas permitidos neste dispositivo":"Ativar alertas neste dispositivo"}>{permission==="granted"?<BellRing size={18}/>:<Bell size={18}/>}<span>{permission==="granted"?"Alertas ativos":"Ativar alertas"}</span></button>;
}
function urlBase64ToUint8Array(value:string){const padding="=".repeat((4-value.length%4)%4);const base64=(value+padding).replace(/-/g,"+").replace(/_/g,"/");const raw=atob(base64);return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))}
