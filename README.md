# DDS Avaliações

Sistema de placas QR + NFC para avaliações no Google, construído sobre o
**DDS Links** — o motor central de QR dinâmico do ecossistema DDS
Inovação. MVP funcional, 100% gratuito no volume inicial.

## Arquitetura (DDS Links como motor central)

```
DDS AVALIAÇÕES (produto)
      |
      v
DDS LINKS (dds_links)  -- motor generico: codigo, slug, destino, status
      |
      v
scan-redirect (Edge Function) -- resolve slug -> destino_atual -> redireciona
      |
      v
link_scan_events -- analytics unico (QR/NFC, dispositivo, geo)
```

- **`plates`** é o objeto físico (código impresso, PIN, apelido) e aponta
  para um `dds_links` via `dynamic_link_id`.
- **`dds_links`** é o motor: guarda o slug que vai na URL, o destino atual
  e o status. Trocar o destino é um `UPDATE` nessa tabela — **a imagem do
  QR impressa nunca precisa mudar**.
- **`link_destination_history`** guarda toda troca de destino (quem
  alterou, quando, valor anterior e novo) — nunca é apagado.
- **`link_scan_events`** é o único analytics do sistema — tanto o
  dashboard do cliente quanto o Admin → QR Codes leem da mesma tabela,
  cada um com seu próprio filtro (`company_id` ou `link_id`).

Isso deixa o motor pronto para outros produtos além de avaliações (NFC
avulso, cartão de visita digital, etc.) sem duplicar nada.

## O que está pronto neste MVP

- Schema completo do banco (Supabase/Postgres) com RLS, incluindo o
  motor DDS Links
- Fluxo do consumidor final: scan → resolve link → registra evento →
  redireciona (ou manda para ativação/pausa quando aplicável)
- Fluxo de ativação: código + PIN → busca da empresa no Google → cadastro
  → `complete-activation` grava tudo de uma vez (profile, company,
  destino do link + histórico, placa ativa)
- Dashboard do cliente: cards, gráfico de evolução, contagem QR/NFC,
  botão "Atualizar agora" (limitado a 1x/24h)
- Job diário automático (`refresh-ratings`) — semanal por padrão
- **Admin → Placas**: listagem com bloquear/desbloquear/transferir
- **Admin → QR Codes** (novo): busca por código do QR, placa ou empresa;
  visualização do QR, destino atual, contagem de acessos; **alterar
  destino** (com histórico), pausar/reativar, baixar PNG/SVG
- Criação de placas em lote (`admin-create-plates`) — já cria o par
  placa + dds_link, gera PNG e SVG e salva no Storage
- Geolocalização por IP nos acessos

## O que fica para uma próxima etapa (fora deste corte)

- Gráficos de dia da semana / horário / dispositivos no dashboard (os
  dados já são coletados em `link_scan_events`, só falta a visualização)
- Página de política de privacidade / termos (LGPD)
- Empacotar os QR Codes em um único .zip na criação em lote (hoje baixa
  um PNG por vez)
- Suporte a outros produtos além de "avaliacoes" no campo `dds_links.produto`

Nada disso precisa de mudança de arquitetura — é só continuar construindo
em cima do que já está no ar.

## 1. Configurar o Supabase

1. Crie um projeto em supabase.com (plano Free).
2. Rode as migrations (a `0004_dds_links.sql` já migra qualquer placa que
   você tenha criado nos testes anteriores):
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```
3. Antes de rodar `0002_cron.sql`, edite o arquivo e troque
   `SEU_PROJECT_REF` e `SEU_SERVICE_ROLE_KEY` pelos valores reais
   (Project Settings → API).
4. **Crie o bucket de Storage** `qr-codes` (Storage → New bucket),
   marcado como **público** — é onde ficam os PNG/SVG de cada QR, para
   poderem ser baixados de novo a qualquer momento pelo Admin → QR Codes.
5. Configure os secrets das Edge Functions:
   ```bash
   supabase secrets set GOOGLE_PLACES_API_KEY=xxxxx
   supabase secrets set FALLBACK_URL=https://ddsinovacao.com.br
   supabase secrets set SCAN_BASE_URL=https://SEU_PROJECT_REF.functions.supabase.co/scan-redirect
   ```
6. Deploy das functions:
   ```bash
   supabase functions deploy activate-plate
   supabase functions deploy complete-activation
   supabase functions deploy search-company
   supabase functions deploy manual-refresh
   supabase functions deploy refresh-ratings
   supabase functions deploy admin-create-plates
   supabase functions deploy scan-redirect --no-verify-jwt
   ```

## 2. Google Places API

1. No Google Cloud Console, ative a **Places API (New)** (não a legada).
2. Crie uma chave de API restrita por domínio/IP (nunca use uma chave sem
   restrição).
3. A chave só é usada dentro das Edge Functions — nunca no frontend.

## 3. Frontend

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Build de produção:
```bash
npm run build
```

## 4. Deploy no GitHub Pages

1. Suba o repositório no GitHub.
2. Em Settings → Pages, aponte para a pasta `dist/` (via GitHub Actions,
   recomendado) ou publique manualmente o conteúdo de `dist/`.
3. Configure o domínio customizado `avaliacao.ddsinovacao.com.br` em
   Settings → Pages → Custom domain (isso cria o CNAME automaticamente).

### Importante sobre a URL do QR/NFC

O QR Code e a gravação do NFC devem apontar direto para a Edge Function
`scan-redirect` — não para o GitHub Pages (estático), senão o SPA
precisaria carregar inteiro antes de redirecionar:

```
https://SEU_PROJECT_REF.functions.supabase.co/scan-redirect/Q7K29P?src=qr
https://SEU_PROJECT_REF.functions.supabase.co/scan-redirect/Q7K29P?src=nfc
```

Para ter a URL "bonita" `go.ddsinovacao.com.br/Q7K29P` pedida no
briefing do DDS Links, crie esse subdomínio apontando (CNAME ou um proxy
simples, ex: Cloudflare Worker) para o domínio de functions do Supabase.
Isso não muda nada da lógica já implementada — é só uma camada de
apresentação da URL.

## 5. Criar seu usuário admin

Todo cadastro novo nasce com `role = 'cliente'`. Para virar admin (e
poder gerar placas em lote, bloquear/transferir, alterar destino de
QR, etc.), depois de criar sua conta normalmente pela tela de
login/cadastro, rode no SQL editor do Supabase:

```sql
update profiles set role = 'admin' where id = 'SEU_USER_ID';
```

## 6. Estratégia de custo (resumo)

- Busca de empresa (ativação): dentro do limite gratuito do Google até
  ~5.000 ativações/mês.
- Atualização de rating: **semanal por padrão** (`update_frequency` em
  `companies`), o que cobre gratuitamente até ~230 empresas/mês. O botão
  "Atualizar agora" é limitado a 1x/24h por empresa para não furar essa
  conta.
- Quando um cliente pagar por atualização diária no futuro, basta trocar
  `update_frequency` para `'daily'` naquele registro — a lógica de cron já
  suporta isso, não precisa mexer em código.
