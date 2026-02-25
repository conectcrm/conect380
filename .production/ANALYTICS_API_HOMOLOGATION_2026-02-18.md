# Homologacao API Analytics MVP (2026-02-18)

## Escopo
- Modulo: `backend/src/modules/analytics/*`
- Rotas homologadas: `/analytics/*`
- Perfis validados: `admin` e `vendedor`
- Foco: dados reais por empresa + isolamento multi-tenant + contrato basico de resposta

## Evidencias executadas
1. `npm --prefix backend run type-check` -> PASS
2. `npm --prefix backend run test:e2e -- test/analytics/analytics-real-data.e2e-spec.ts` -> PASS (`5 passed`)
3. `npm --prefix backend run build` -> PASS
4. `npm --prefix frontend-web run type-check` -> PASS
5. `npx playwright test e2e/mvp-smoke-ui.spec.ts --project=chromium --reporter=list` -> PASS (`1 passed`)
6. `.production/scripts/smoke-mvp-ui.ps1` -> PASS (`1 passed`)
7. `npm --prefix frontend-web run build` (com `REACT_APP_MVP_MODE=true`) -> PASS
8. `.production/scripts/smoke-mvp-core.ps1` -> PASS
9. Reexecucao final em `2026-02-19`: todos os itens acima em verde na mesma rodada de verificacao

## Atualizacao desta rodada (2026-02-18)
- Smoke E2E atualizado para cobrir troca de perfil (`administrador` e `vendedor`) com validacao de persistencia de `selectedProfileId` e carga de `/dashboard` + `/atendimento/analytics`.
- UI de alertas (`frontend-web/src/components/analytics/AlertasGestao.tsx`) alinhada ao contrato real de `/api/analytics/alertas-gestao`:
  - suporte explicito a `conversao_leads`;
  - labels de `prazo_vencido` e `baixa_conversao` ajustadas ao dominio comercial;
  - parsing defensivo para arrays opcionais (`alertas_criticos`, `alertas_atencao`, `oportunidades`).
- Observacao operacional: houve bloqueio temporario por rate-limit (`429`) durante reruns de validacao, normalizado na janela seguinte sem alteracao de codigo.

## Atualizacao final (2026-02-19)
- Navegacao de analytics comercial homologada para rota dedicada:
  - `frontend-web/src/App.tsx`: `/relatorios/analytics` agora carrega `AnalyticsPage`.
  - `frontend-web/src/config/menuConfig.ts` e `frontend-web/src/config/mvpScope.ts`: menu MVP inclui `Analytics Comercial`.
- Smoke UI atualizado para validar as 3 rotas principais de dashboard:
  - `/dashboard`
  - `/relatorios/analytics`
  - `/atendimento/analytics`
- Baseline MVP de release executada sem falhas:
  - backend/frontend type-check
  - backend/frontend build
  - analytics E2E dedicado
  - smoke core + smoke UI

## Cobertura de endpoints (E2E)
- `GET /analytics/dashboard`
- `GET /analytics/funil-conversao`
- `GET /analytics/performance-vendedores`
- `GET /analytics/evolucao-temporal`
- `GET /analytics/tempo-medio-etapas`
- `GET /analytics/distribuicao-valores`
- `GET /analytics/previsao-fechamento`
- `GET /analytics/alertas-gestao`
- `GET /analytics/kpis-tempo-real`
- `GET /analytics/metas-progresso`
- `GET /analytics/export`

## Cenarios validados
1. Dashboard com dados da propria empresa para perfil admin.
2. Dashboard filtrado por vendedor para perfil vendedor.
3. Isolamento multi-tenant com tentativa de bypass por `vendedor` de outra empresa.
4. Contrato minimo de resposta dos endpoints secundarios.
5. Exportacao em formato XLSX com headers corretos.

## Bug encontrado e corrigido
- Sintoma: `funil.propostas_criadas` retornava `0` mesmo com propostas criadas no periodo.
- Causa: comparacao temporal com `Date`/timezone em colunas `timestamp without time zone`.
- Correcao aplicada em `backend/src/modules/analytics/analytics.service.ts`:
  - filtro de propostas por `DATE(p.criadaEm) BETWEEN :startDateOnly AND :endDateOnly`
  - ajuste equivalente nos fallbacks de `faturas` e `contratos` por `DATE(...createdAt)`

## Checklist de release MVP (/analytics)
- [x] `AnalyticsModule` conectado no `AppModule`.
- [x] `empresaId` injetado via `@EmpresaId()` nos endpoints do modulo.
- [x] Homologacao API por perfil (`admin` e `vendedor`) concluida.
- [x] Validacao de isolamento multi-tenant concluida.
- [x] Build e type-check do backend em verde.
- [x] Smoke UI dos dashboards por perfil.
- [x] Revisao final de labels/expectativas da UI alinhadas aos dados reais.

## Resultado
- Status recomendado: `GO`
