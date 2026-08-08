alter table public.push_subscriptions add column if not exists alert_types text[] not null default array['free-games'];
alter table public.platforms drop constraint if exists platforms_kind_check;
alter table public.platforms add constraint platforms_kind_check check (kind in ('Loja','Marketplace','Assinatura','Giveaway','Free-to-play'));
insert into public.platforms (slug,name,kind,website_url,featured,requires_subscription,note,active,sort_order) values
('nuuvem','Nuuvem','Loja','https://www.nuuvem.com/br-pt/',false,false,'Loja brasileira com preços em reais e chaves para diferentes launchers',true,21),
('thunderkeys','ThunderKeys','Marketplace','https://www.thunderkeys.com/',false,false,'Marketplace de chaves; confira região, plataforma de ativação e políticas do vendedor',true,22)
on conflict (slug) do update set name=excluded.name,kind=excluded.kind,website_url=excluded.website_url,note=excluded.note,active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
