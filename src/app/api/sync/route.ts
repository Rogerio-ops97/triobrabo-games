import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { sendPush } from "@/lib/push";
import type { Game } from "@/lib/types";

type Giveaway={id:number;title:string;worth:string;thumbnail:string;image:string;description:string;instructions:string;open_giveaway_url:string;published_date:string;end_date:string;type:string;platforms:string};
const storeName=(platforms:string)=>platforms.includes("Epic")?"Epic Games":platforms.includes("Steam")?"Steam":platforms.includes("GOG")?"GOG":platforms.includes("itch")?"itch.io":platforms.split(",")[0]?.trim()||"PC";
const slugify=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
async function synchronize(request:NextRequest){
 const auth=request.headers.get("authorization"),valid=[process.env.CRON_SECRET,process.env.SYNC_SECRET].filter(Boolean).some(secret=>auth===`Bearer ${secret}`);if(!valid)return Response.json({error:"Não autorizado"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SYNC_SECRET;if(!url||!key||!secret)return Response.json({error:"Configuração incompleta"},{status:503});
 const response=await fetch("https://www.gamerpower.com/api/filter?platform=pc&type=game",{headers:{accept:"application/json"},cache:"no-store"});if(!response.ok)throw new Error(`Fonte respondeu ${response.status}`);const offers=(await response.json()) as Giveaway[];
 const eligible=offers.filter(item=>item.type==="Game"&&item.worth!=="N/A"&&Number(item.worth.replace(/[^0-9.]/g,""))>0);
 const db=createClient(url,key,{global:{headers:{"x-sync-secret":secret}},auth:{persistSession:false}});const ids=eligible.map(item=>`gamerpower:${item.id}`);const {data:known}=await db.from("games").select("source_id").in("source_id",ids);const knownIds=new Set((known||[]).map(row=>row.source_id));
 const rows=eligible.map(item=>({source_id:`gamerpower:${item.id}`,slug:`${slugify(item.title)}-${item.id}`,title:item.title,store:storeName(item.platforms),description:item.description.slice(0,500),image_url:item.image||item.thumbnail,claim_url:item.open_giveaway_url,original_price:Number(item.worth.replace(/[^0-9.]/g,"")),starts_at:new Date(item.published_date).toISOString(),ends_at:item.end_date==="N/A"?new Date(Date.now()+30*864e5).toISOString():new Date(item.end_date).toISOString(),genres:["Jogo grátis"],featured:false,is_active:true}));
 const {data:stored,error}=await db.from("games").upsert(rows,{onConflict:"source_id"}).select("*");if(error)throw error;const fresh=(stored||[]).filter(game=>!knownIds.has(game.source_id)&&Number(game.original_price)>0) as Game[];let sent=0;for(const game of fresh){const result=await sendPush(game);sent+=result.sent;await db.from("games").update({notified_at:new Date().toISOString()}).eq("id",game.id)}
 return Response.json({ok:true,checked:offers.length,eligible:eligible.length,newGames:fresh.length,notifications:sent,source:"GamerPower"});
}
export async function GET(request:NextRequest){try{return await synchronize(request)}catch(error){console.error(error);return Response.json({error:"Falha na sincronização"},{status:500})}}
export async function POST(request:NextRequest){return GET(request)}
