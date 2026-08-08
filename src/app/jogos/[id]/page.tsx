import {notFound} from "next/navigation";
import {GameDetails} from "@/components/game-details";
import {getSteamGameDetails} from "@/lib/deals";
export const revalidate=3600;
export default async function GamePage({params}:{params:Promise<{id:string}>}){const{id}=await params;const appId=Number(id);if(!Number.isInteger(appId))notFound();const game=await getSteamGameDetails(appId);if(!game)notFound();return <GameDetails game={game}/>}
