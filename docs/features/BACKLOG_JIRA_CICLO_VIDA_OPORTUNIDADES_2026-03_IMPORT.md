# Backlog Jira - Ciclo de Vida de Oportunidades (2026-03)

## 1. Arquivos de importacao

1. Jira classico:
   - `docs/features/BACKLOG_JIRA_CICLO_VIDA_OPORTUNIDADES_2026-03.csv`
2. Jira Cloud com hierarquia por `Parent ID`:
   - `docs/features/BACKLOG_JIRA_CLOUD_CICLO_VIDA_OPORTUNIDADES_2026-03.csv`

## 2. Estrutura entregue

1. 4 Epics:
   - OPP-01 Governanca e contrato funcional
   - OPP-02 Backend lifecycle e seguranca de dados
   - OPP-03 Pipeline e UX operacional
   - OPP-04 Dashboard analytics integracoes e rollout
2. 15 Stories:
   - OPP-001 a OPP-305
3. 30 Tasks tecnicas:
   - sufixo `-T1` e `-T2`

## 3. Mapeamento recomendado no importador CSV do Jira

1. `Issue ID` -> External issue id
2. `Issue Type` -> Issue Type
3. `Summary` -> Summary
4. `Description` -> Description
5. `Priority` -> Priority
6. `Story Points` -> Story Points
7. `Epic Name` -> Epic Name
8. `Epic Link` -> Epic Link (arquivo classico)
9. `Parent ID` -> Parent (arquivo cloud)
10. `Labels` -> Labels
11. `Components` -> Component/s

## 4. Ordem de execucao para nao pular etapas

1. Fase 0:
   - OPP-001
   - OPP-002
2. Fase 1:
   - OPP-101
   - OPP-102
   - OPP-103
   - OPP-104
   - OPP-105
3. Fase 2:
   - OPP-201
   - OPP-202
   - OPP-203
   - OPP-204
4. Fase 3/4:
   - OPP-301
   - OPP-302
   - OPP-303
   - OPP-304
5. Fase 5 opcional:
   - OPP-305

## 5. Regras de uso

1. Nao iniciar story de fase seguinte sem aceite formal da fase atual.
2. Nao liberar `hard delete` antes de `soft delete + restore` em producao.
3. Nao liberar rollout geral sem piloto OPP-304 concluido.
4. OPP-305 e opcional e entra somente apos estabilizacao do go-live.

## 6. Referencias

1. Plano de execucao:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico detalhado:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
