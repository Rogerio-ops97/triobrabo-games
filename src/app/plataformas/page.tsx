import { PlatformCatalog } from "@/components/platform-catalog";
import { platforms } from "@/lib/platforms";
import { getSupabase } from "@/lib/supabase";
export const revalidate=900;
export default async function PlatformsPage(){let sources=platforms;const db=getSupabase();if(db){const {data}=await db.from("platforms").select("*").eq("active",true).order("sort_order");if(data?.length)sources=data;}return <PlatformCatalog platforms={sources}/>}
