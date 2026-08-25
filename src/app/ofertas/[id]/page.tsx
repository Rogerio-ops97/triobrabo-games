import {notFound} from "next/navigation";
import {DealDetails} from "@/components/deal-details";
import {getBrazilianDeals,getSteamGameDetails} from "@/lib/deals";
export const revalidate=900;
export default async function DealPage({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!/^\d{1,10}$/.test(id))notFound();const appId=Number(id);if(!Number.isSafeInteger(appId)||appId<=0)notFound();const[deals,details]=await Promise.all([getBrazilianDeals(),getSteamGameDetails(appId)]);const deal=deals.find(item=>item.appId===appId);if(!deal||!details)notFound();return <DealDetails deal={deal} details={details}/>}
