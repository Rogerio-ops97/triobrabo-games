import {SearchHub} from "@/components/search-hub";
import {getMultiStoreDeals} from "@/lib/deals";
import {demoGames} from "@/lib/games";
import {getSupabase} from "@/lib/supabase";
export const revalidate=900;
export default async function SearchPage(){let games=demoGames;const db=getSupabase();if(db){const{data}=await db.from("games").select("*").eq("is_active",true).order("featured",{ascending:false});if(data?.length)games=data}const deals=(await getMultiStoreDeals()).slice(0,24);return <SearchHub games={games} deals={deals}/>}
