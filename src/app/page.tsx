import { GameBrowser } from "@/components/game-browser";
import { demoGames } from "@/lib/games";
import { getSupabase } from "@/lib/supabase";
import { platforms } from "@/lib/platforms";
export const revalidate=900;
export default async function Home(){let games=demoGames;let sources=platforms;const db=getSupabase();if(db){const [{data:gameData},{data:platformData}]=await Promise.all([db.from("games").select("*").eq("is_active",true).order("featured",{ascending:false}).order("ends_at"),db.from("platforms").select("*").eq("active",true).order("sort_order")]);if(gameData?.length)games=gameData;if(platformData?.length)sources=platformData;}return <GameBrowser games={games} platforms={sources}/>}
