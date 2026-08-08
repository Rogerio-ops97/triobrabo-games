# TrioBrabo Games Drop — plano do produto

## Visão

Um web app instalável que reúne promoções temporárias de jogos 100% grátis e leva o usuário ao resgate oficial antes do prazo.

## V1 — entregue

- Catálogo responsivo com busca e filtros por loja.
- Cards com preço anterior, prazo restante, gênero e link oficial.
- Destaque editorial e indicadores de economia.
- Favoritos persistidos no aparelho.
- PWA instalável com manifesto, ícone e tema próprio.
- Supabase: tabela de jogos, índice, RLS e acesso público somente a ofertas ativas.
- Endpoint de saúde e endpoint protegido para futura sincronização.
- Fallback local para o app continuar útil sem banco configurado.

## Backlog priorizado

### P1 — automação e retenção

- Coletores para Epic, Steam, GOG e Prime Gaming com normalização e deduplicação.
- Vercel Cron chamando `/api/sync` e painel de execuções.
- Web Push com VAPID, preferências por loja/gênero e alertas de encerramento.
- Login por magic link; favoritos sincronizados entre aparelhos.
- Detalhe do jogo com histórico e instruções de resgate.

### P2 — qualidade de descoberta

- Metacritic/OpenCritic, plataformas, idiomas e requisitos.
- Ordenação por prazo, valor, nota e novidade.
- Compartilhamento nativo e páginas sociais/SEO por oferta.
- Histórico de jogos já resgatados e alertas silenciosos.

### P3 — comunidade e operação

- Painel administrativo para revisão e destaque.
- Denúncia de oferta expirada e auditoria de fontes.
- Canais Discord/WhatsApp, digest diário e métricas de conversão.

## Arquitetura

Next.js App Router na Vercel; Supabase Postgres com RLS; tarefas agendadas na Vercel; Web Push no navegador. Segredos ficam apenas no ambiente do servidor. O catálogo público usa uma chave publicável e políticas de leitura restritas a ofertas ativas.

## Critérios de aceite da V1

- Build de produção e lint passam.
- Layout funcional em desktop e celular.
- Busca, filtros, favoritos e links de resgate funcionam.
- `/api/health` responde 200; `/api/sync` rejeita chamadas sem segredo.
- Manifesto PWA e ícone estão acessíveis.
