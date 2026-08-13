import { GameBrowser } from "@/components/game-browser";
import { demoGames } from "@/lib/games";
import { getSupabase } from "@/lib/supabase";
export const revalidate=60;
export default async function Home(){let games=demoGames;const db=getSupabase();if(db){const {data}=await db.from("games").select("*").eq("is_active",true).order("featured",{ascending:false}).order("ends_at");if(data?.length)games=data;}return <GameBrowser games={games}/>}
