import {notFound} from "next/navigation";
import {GameDetails} from "@/components/game-details";
import {getCatalogGameDetails,getMultiStoreOffers,getMultiStoreOffersById,getSteamGameDetails} from "@/lib/deals";
export const revalidate=900;
export default async function GamePage({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!/^[A-Za-z0-9_-]{1,128}$/.test(id))notFound();const appId=Number(id);const isSteamId=Number.isSafeInteger(appId)&&appId>0&&String(appId)===id;const game=isSteamId?await getSteamGameDetails(appId):await getCatalogGameDetails(id);if(!game)notFound();const offers=isSteamId?await getMultiStoreOffers(game.name):await getMultiStoreOffersById(id);return <GameDetails game={game} offers={offers}/>}
