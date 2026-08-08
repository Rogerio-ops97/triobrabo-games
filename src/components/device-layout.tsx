"use client";
import { useEffect } from "react";

type DeviceLayout="mobile"|"tablet"|"desktop"|"tv";
function detectDevice():DeviceLayout{
 const shortest=Math.min(window.screen.width,window.screen.height);
 const longest=Math.max(window.screen.width,window.screen.height);
 const coarse=window.matchMedia("(pointer: coarse)").matches;
 if(shortest<600)return "mobile";
 if(shortest<1024&&coarse)return "tablet";
 if(longest>=1600&&coarse)return "tv";
 return "desktop";
}
export function DeviceLayoutDetector(){useEffect(()=>{const update=()=>{document.documentElement.dataset.device=detectDevice();document.documentElement.dataset.orientation=window.matchMedia("(orientation: portrait)").matches?"portrait":"landscape"};update();window.addEventListener("resize",update);window.addEventListener("orientationchange",update);return()=>{window.removeEventListener("resize",update);window.removeEventListener("orientationchange",update)}},[]);return null}
