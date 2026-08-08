export type PlatformKind = "Loja" | "Marketplace" | "Assinatura" | "Giveaway" | "Free-to-play";

export type Platform = {
  slug: string;
  name: string;
  kind: PlatformKind;
  website_url: string;
  featured: boolean;
  requires_subscription: boolean;
  note: string;
  sort_order: number;
};

export const platforms: Platform[] = [
  {slug:"epic-games",name:"Epic Games",kind:"Loja",website_url:"https://store.epicgames.com/free-games",featured:true,requires_subscription:false,note:"Jogos semanais para ficar para sempre",sort_order:1},
  {slug:"steam",name:"Steam",kind:"Loja",website_url:"https://store.steampowered.com/search/?maxprice=free",featured:true,requires_subscription:false,note:"Promoções free-to-keep, fins de semana e F2P",sort_order:2},
  {slug:"gog",name:"GOG",kind:"Loja",website_url:"https://www.gog.com/",featured:false,requires_subscription:false,note:"Giveaways ocasionais e jogos sem DRM",sort_order:3},
  {slug:"prime-gaming",name:"Prime Gaming",kind:"Assinatura",website_url:"https://gaming.amazon.com/",featured:false,requires_subscription:true,note:"Jogos mensais para assinantes Amazon Prime",sort_order:4},
  {slug:"itch-io",name:"itch.io",kind:"Loja",website_url:"https://itch.io/games/free",featured:false,requires_subscription:false,note:"Grande catálogo indie gratuito e promoções",sort_order:5},
  {slug:"indiegala",name:"IndieGala",kind:"Giveaway",website_url:"https://freebies.indiegala.com/",featured:false,requires_subscription:false,note:"Freebies DRM-free e chaves promocionais",sort_order:6},
  {slug:"fanatical",name:"Fanatical",kind:"Giveaway",website_url:"https://www.fanatical.com/",featured:false,requires_subscription:false,note:"Giveaways ocasionais de chaves para PC",sort_order:7},
  {slug:"humble-bundle",name:"Humble Bundle",kind:"Giveaway",website_url:"https://www.humblebundle.com/",featured:false,requires_subscription:false,note:"Giveaways e campanhas promocionais ocasionais",sort_order:8},
  {slug:"ubisoft-connect",name:"Ubisoft Connect",kind:"Loja",website_url:"https://store.ubisoft.com/free-games",featured:false,requires_subscription:false,note:"Free weekends, demos e ofertas gratuitas",sort_order:9},
  {slug:"ea-app",name:"EA app",kind:"Loja",website_url:"https://www.ea.com/ea-app",featured:false,requires_subscription:false,note:"Jogos gratuitos, testes e fins de semana",sort_order:10},
  {slug:"xbox-pc",name:"Xbox / Microsoft Store",kind:"Loja",website_url:"https://www.xbox.com/pc-gaming",featured:false,requires_subscription:false,note:"Jogos F2P e promoções para PC",sort_order:11},
  {slug:"battle-net",name:"Battle.net",kind:"Free-to-play",website_url:"https://www.blizzard.com/apps/battle.net/desktop",featured:false,requires_subscription:false,note:"Catálogo gratuito da Blizzard",sort_order:12},
  {slug:"riot-games",name:"Riot Games",kind:"Free-to-play",website_url:"https://www.riotgames.com/",featured:false,requires_subscription:false,note:"Jogos competitivos gratuitos para PC",sort_order:13},
  {slug:"hoyoverse",name:"HoYoverse",kind:"Free-to-play",website_url:"https://www.hoyoverse.com/",featured:false,requires_subscription:false,note:"RPGs e aventuras gratuitos para PC",sort_order:14},
  {slug:"wargaming",name:"Wargaming.net",kind:"Free-to-play",website_url:"https://wargaming.net/",featured:false,requires_subscription:false,note:"Jogos online gratuitos e eventos",sort_order:15},
  {slug:"gaijin",name:"Gaijin.net",kind:"Free-to-play",website_url:"https://gaijin.net/",featured:false,requires_subscription:false,note:"Jogos online gratuitos para PC",sort_order:16},
  {slug:"ncsoft",name:"NCSoft / PURPLE",kind:"Free-to-play",website_url:"https://www.plaync.com/",featured:false,requires_subscription:false,note:"MMOs gratuitos e campanhas",sort_order:17},
  {slug:"pearl-abyss",name:"Pearl Abyss",kind:"Free-to-play",website_url:"https://www.pearlabyss.com/",featured:false,requires_subscription:false,note:"MMOs e períodos promocionais",sort_order:18},
  {slug:"alienware-arena",name:"Alienware Arena",kind:"Giveaway",website_url:"https://www.alienwarearena.com/giveaways",featured:false,requires_subscription:false,note:"Chaves, sorteios e recompensas para PC",sort_order:19},
  {slug:"steelseries-gg",name:"SteelSeries GG",kind:"Giveaway",website_url:"https://steelseries.com/gg/collectors",featured:false,requires_subscription:false,note:"Chaves e itens promocionais limitados",sort_order:20},
  {slug:"nuuvem",name:"Nuuvem",kind:"Loja",website_url:"https://www.nuuvem.com/br-pt/",featured:false,requires_subscription:false,note:"Loja brasileira com preços em reais e chaves para diferentes launchers",sort_order:21},
  {slug:"thunderkeys",name:"ThunderKeys",kind:"Marketplace",website_url:"https://www.thunderkeys.com/",featured:false,requires_subscription:false,note:"Marketplace de chaves; confira região, plataforma de ativação e políticas do vendedor",sort_order:22},
];
