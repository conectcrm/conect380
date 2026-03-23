# GDN-405 - Training plan N1 N2 N3 Guardian

## Data
- 2026-03-07

## Objetivo
- Treinar operacoes e suporte para executar resposta a incidente Guardian sem dependencia imediata de engenharia.

## Publico
- N1: suporte operacional
- N2: operacoes/plataforma
- N3: engenharia de sustentacao

## Estrutura do treinamento

### Bloco 1 - Contexto Guardian (30 min)
- Escopo do Guardian e fronteira com legado.
- Riscos principais de operacao.
- Canais oficiais de incidente e comunicacao.

### Bloco 2 - Runbook e escalacao (45 min)
- Uso do runbook:
  - `docs/runbooks/PLANO_GUARDIAN_INCIDENT_RESPONSE_PILOTO.md`
- Matriz de severidade P0/P1/P2/P3.
- Escalacao N1 -> N2 -> N3 e tempos de resposta.

### Bloco 3 - Operacao assistida (45 min)
- Monitor de billing/plataforma:
  - `scripts/monitor-guardian-billing-platform.ps1`
- Drill de contingencia e rollback:
  - `scripts/test-guardian-contingency-rollback-drill.ps1`
- Validacao de flags de transicao legado:
  - `scripts/ci/guardian-transition-flags-check.ps1`

### Bloco 4 - Simulacao pratica (60 min)
- Execucao guiada de incidentes simulados.
- Registro de decisao GO/NO-GO.
- Debrief com gaps e acoes corretivas.

## Criterio de aprovacao por nivel
- N1: consegue abrir incidente completo e seguir checklist sem apoio de engenharia.
- N2: aplica mitigacao/rollback de flag e valida estabilizacao.
- N3: valida diagnostico, define correcao e confirma encerramento tecnico.

## Entregaveis do treinamento
- Registro da sessao preenchido.
- Lista de pendencias com owners e prazo.
- Evidencia de execucao dos exercicios praticos.
