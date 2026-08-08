import {DealsBrowser} from "@/components/deals-browser";
import {getMultiStoreDeals} from "@/lib/deals";
export const revalidate=900;
export default async function DealsPage(){const deals=await getMultiStoreDeals();return <DealsBrowser deals={deals}/>}
