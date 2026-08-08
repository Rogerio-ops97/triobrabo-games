import type { Metadata,Viewport } from "next";
import { Inter,Manrope } from "next/font/google";
import "./globals.css";
const inter=Inter({subsets:["latin"],variable:"--font-body"}); const manrope=Manrope({subsets:["latin"],variable:"--font-display"});
export const metadata:Metadata={title:"FreeDrop — jogos grátis, no tempo certo",description:"Ofertas de jogos grátis em todas as grandes lojas.",manifest:"/manifest.webmanifest",icons:{icon:"/icon.svg"}};
export const viewport:Viewport={themeColor:"#0a0b0e",colorScheme:"dark"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body className={`${inter.variable} ${manrope.variable}`}>{children}</body></html>}
