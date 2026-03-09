# GDN-401 - Roteiro de piloto controlado Guardian

## Data
- 2026-03-07

## Objetivo
- Executar piloto controlado do Guardian com coorte reduzida de contas reais, monitoramento por janela e decisao formal de GO/NO-GO.

## Premissas
- Sprint 3 aprovada (`GDN-311` concluido).
- Runbook de incidente finalizado:
  - `docs/runbooks/PLANO_GUARDIAN_INCIDENT_RESPONSE_PILOTO.md`
- Fluxo N1/N2/N3 publicado:
  - `docs/features/GDN-306_SUPPORT_WORKFLOW_N1_N2_N3_2026-03-07.md`

## Estrategia de coorte
- Lote inicial: 2 a 3 contas com menor risco operacional.
- Criterios de selecao:
  - historico sem P0/P1 recente
  - owner operacional identificado
  - janela de suporte ativa durante o piloto
  - volume moderado de operacoes administrativas
- Registro oficial da coorte:
  - `docs/features/GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv`

## Modo de rollout recomendado
- Fase piloto: manter transicao em `dual` e operar contas selecionadas pelo Guardian.
- Mitigacao rapida:
  - fallback para legado quando necessario
  - sem ampliar lote com incidente aberto P0/P1
- Migracao mais agressiva (`canary`/`guardian_only`) somente apos estabilidade validada.

## Janela de execucao
- T0: ativacao da coorte piloto.
- T+30 min: smoke funcional inicial.
- T+2 h / T+8 h / T+24 h / T+48 h: checkpoints de estabilidade.
- T+48 h: decisao de GO/NO-GO para expansao.

## Criticos de monitoramento no piloto
- Saude da API (`/health`).
- Operacoes de empresas no Guardian.
- Operacoes de billing no Guardian.
- Leitura/exportacao de auditoria critica.
- Ausencia de incidente aberto P0/P1.

## Regras de NO-GO imediato
- indisponibilidade Guardian por mais de 10 minutos sem mitigacao.
- quebra de auditoria critica em operacao sensivel.
- regressao com impacto financeiro em billing.
- qualquer incidente de seguranca administrativa.

## Evidencias obrigatorias
- Resultado do smoke inicial da coorte.
- Checklist 48h preenchido.
- Registro de incidentes/mitigacoes.
- Decisao formal de GO/NO-GO com responsaveis.

## Comandos operacionais
- Smoke do piloto (dry-run tecnico):
  - `powershell -ExecutionPolicy Bypass -File scripts/test-guardian-piloto-cohort.ps1 -DryRun`
- Smoke do piloto (execucao real):
  - `powershell -ExecutionPolicy Bypass -File scripts/test-guardian-piloto-cohort.ps1 -BaseUrl <url_backend> -Token <jwt_guardian> -CohortFile docs/features/GDN-401_COHORT_PILOTO_GUARDIAN_2026-03-07.csv`
