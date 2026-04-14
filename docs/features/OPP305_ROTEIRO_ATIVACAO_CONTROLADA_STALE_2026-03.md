# OPP-305 - Roteiro de ativacao controlada (stale deals) - 2026-03

## 1. Objetivo

Ativar stale deals e auto-arquivamento com baixo risco operacional, em ondas, com criterio de reversao imediato.

## 2. Fase 0 - Pre-check tecnico

1. Confirmar deploy da Sprint 5.
2. Confirmar endpoints:
   - `GET /oportunidades/lifecycle/stale-policy`
   - `PATCH /oportunidades/lifecycle/stale-policy`
   - `GET /oportunidades/stale`
   - `POST /oportunidades/stale/auto-archive/run?dry_run=true`
3. Confirmar monitor automatico desabilitado em desenvolvimento.
4. Executar smoke da API stale:
   - `npm run test:opp305:homolog:dryrun`
   - `npm run test:opp305:homolog -- -BaseUrl <url_homolog> -Token <jwt_valido>`
5. Prosseguir para Fase 1 apenas com autenticacao valida (sem `401`) nos endpoints protegidos.

## 3. Fase 1 - Dry-run assistido (sem arquivar)

Janela recomendada inicial:

1. Inicio: sexta-feira, 6 de marco de 2026.
2. Duracao: 3 dias uteis de observacao.

Passos por tenant piloto:

1. Configurar politica:
   - `enabled=true`
   - `thresholdDays=30`
   - `autoArchiveEnabled=false`
2. Executar diariamente:
   - `POST /oportunidades/stale/auto-archive/run?dry_run=true`
3. Consolidar:
   - quantidade de candidatos;
   - amostra de oportunidade candidata;
   - validacao com lider comercial.

## 4. Fase 2 - Piloto com auto-arquivamento real

1. Selecionar 1 ou 2 tenants de menor risco.
2. Ajustar politica:
   - `autoArchiveEnabled=true`
   - `autoArchiveAfterDays=45` (ou valor aprovado pelo negocio).
3. Rodar monitor por 48h com checkpoints:
   - `T+2h`, `T+8h`, `T+24h`, `T+48h`.
4. Validar:
   - arquivamentos esperados;
   - historico de atividade registrado;
   - ausencia de chamado critico.

## 5. Fase 3 - Expansao por lote

1. Expandir por grupos pequenos de tenants.
2. Manter comparativo `dry-run` vs `real` no primeiro dia de cada lote.
3. Congelar expansao se houver incidente P1/P2.

## 6. Criterios de Go/No-Go

## GO

1. Dry-run consistente com expectativa comercial.
2. Piloto 48h sem incidente critico.
3. Sem divergencia relevante de pipeline.

## NO-GO

1. Arquivamento inesperado em massa.
2. Reclamacao recorrente de perda de visibilidade operacional.
3. Erro tecnico recorrente no endpoint de auto-arquivamento.

## 7. Rollback imediato

1. `PATCH /oportunidades/lifecycle/stale-policy`:
   - `autoArchiveEnabled=false`
2. Se necessario:
   - `enabled=false` para pausar stale policy inteira.
3. Comunicar Operacao/Comercial no mesmo ciclo.

## 8. Evidencias minimas

1. Parametros aplicados por tenant.
2. Resultado diario de `dry-run`.
3. Resultado de arquivamento real (quando habilitado).
4. Registro de decisao GO/NO-GO.
5. Relatorio de smoke (`OPP305_HOMOLOG_API_SMOKE_<timestamp>.md`) da janela de validacao.
