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
  if(result==="granted") registration.showNotification("Alertas ativados! 🎮",{body:"O TrioBrabo Games Drop está pronto para avisar você.",icon:"/trio-brabo-logo.png",badge:"/icon.svg",tag:"alerts-ready"});
 }
 return <button className={`notify ${permission==="granted"?"enabled":""}`} onClick={activate} title={permission==="granted"?"Alertas permitidos neste dispositivo":"Ativar alertas neste dispositivo"}>{permission==="granted"?<BellRing size={18}/>:<Bell size={18}/>}<span>{permission==="granted"?"Alertas ativos":"Ativar alertas"}</span></button>;
}
