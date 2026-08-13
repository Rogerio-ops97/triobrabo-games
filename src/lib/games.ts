import type { Game } from "./types";
// Nunca exiba ofertas fictícias quando a fonte estiver indisponível.
export const demoGames: Game[] = [];
export function hoursLeft(end:string, now=Date.now()){ return Math.max(0,Math.ceil((new Date(end).getTime()-now)/36e5)); }
export function money(value:number){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value); }
