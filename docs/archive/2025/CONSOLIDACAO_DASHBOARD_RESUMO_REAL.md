# Consolidação — Dashboard Resumo com Dados Reais (28/11/2025)

## ✅ Entregas Concluídas
- `dashboard.service.ts`
  - `getVendasMensais`: corrigido alias `mes_numero` para evitar erros de coluna inexistente.
  - `getFunilVendas`: reimplementado com agregações reais (clientes + propostas) usando status válidos.
  - `getAtividadesTimeline`: agora consulta `eventosService.findByEmpresaAndRange` e distribui eventos por mês (reunião, ligação, follow-up).
- `eventos.service.ts`
  - Adicionada a função `findByEmpresaAndRange` para facilitar filtros por faixa de datas.
- `backend/scripts/seed-dashboard-timeline-events.sql`
  - Script novo com 20 eventos reais (maio–novembro/2025) para a empresa `11111111-1111-1111-1111-111111111111`.

## 🧪 Testes Executados
1. `cd backend && npm test`
   - 5 suítes / 63 testes aprovados (apenas logs conhecidos do módulo de atendimento).
2. `curl http://localhost:3001/dashboard/resumo?periodo=mensal`
   - Payload agora reflete timeline real (contagens por mês) + funil e KPIs consistentes.

## 📊 Dados de Referência
- Timeline retornando meses `Mai` a `Nov` com as seguintes contagens de exemplo após o seed:
  - `Mai`: 2 reuniões, 2 ligações, 2 follow-ups
  - `Jun`: 2 / 2 / 2
  - `Jul`: 2 / 0 / 2
  - `Ago`: 2 / 2 / 2
  - `Set`: 2 / 2 / 2
  - `Out`: 2 / 2 / 2
  - `Nov`: 2 / 2 / 2
- Agenda (`kpis.agenda`) reportando 6 eventos concluídos no período mensal atual.

## 📍 Como Reproduzir
1. Aplicar seed (apenas ambientes locais):
   ```powershell
   cd backend
   $env:PGPASSWORD="conectcrm123"
   psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -f scripts/seed-dashboard-timeline-events.sql
   Remove-Item Env:PGPASSWORD
   ```
2. Reiniciar backend (`npm run start:dev`) se necessário.
3. Chamar `GET /dashboard/resumo?periodo=mensal` e conferir `chartsData.atividadesTimeline`.

## 🔎 Observações
- Endpoint continua retornando `vendasMensais` vazio porque o período recente não possui registros de venda real (depende da base).
- Para ajustar a agenda em outros períodos, basta replicar o seed adaptando datas e tipos em `scripts/seed-dashboard-timeline-events.sql`.
