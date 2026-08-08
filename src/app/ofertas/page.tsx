import {DealsBrowser} from "@/components/deals-browser";
import {getBrazilianDeals} from "@/lib/deals";
export const revalidate=900;
export default async function DealsPage(){const deals=await getBrazilianDeals();return <DealsBrowser deals={deals}/>}
