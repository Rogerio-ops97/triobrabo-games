import type { Metadata,Viewport } from "next";
import { Inter,Manrope } from "next/font/google";
import "./globals.css";
import "./brand.css";
import "./premium.css";
import { MobileBackGesture } from "@/components/mobile-back-gesture";
const inter=Inter({subsets:["latin"],variable:"--font-body"}); const manrope=Manrope({subsets:["latin"],variable:"--font-display"});
export const metadata:Metadata={title:"TrioBrabo Games Drop — jogos grátis, no tempo certo",description:"O drop de jogos grátis do TrioBrabo, reunindo ofertas das principais lojas.",applicationName:"TrioBrabo Games Drop",manifest:"/manifest.webmanifest",icons:{icon:"/trio-brabo-logo.png",apple:"/trio-brabo-logo.png"}};
export const viewport:Viewport={themeColor:"#0a0b0e",colorScheme:"dark"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className={`${inter.variable} ${manrope.variable}`}><MobileBackGesture/>{children}</body></html>}
