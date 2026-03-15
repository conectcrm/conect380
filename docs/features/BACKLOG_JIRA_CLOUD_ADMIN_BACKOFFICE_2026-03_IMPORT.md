# Backlog Jira Cloud - Admin Backoffice (2026-03)

## 1. Arquivo de importacao

1. `docs/features/BACKLOG_JIRA_CLOUD_ADMIN_BACKOFFICE_2026-03.csv`

## 2. Estrutura entregue

1. 4 Epics (`ADM-EPIC-01` a `ADM-EPIC-04`).
2. 11 Stories (`ADM-001` a `ADM-303`) com `Parent ID` apontando para o Epic.
3. 22 Sub-tasks (`-T1` e `-T2`) com `Parent ID` apontando para a Story.

## 3. Mapeamento recomendado no importador CSV (Jira Cloud)

1. `Issue ID` -> External issue id
2. `Parent ID` -> Parent
3. `Issue Type` -> Issue Type
4. `Summary` -> Summary
5. `Description` -> Description
6. `Priority` -> Priority
7. `Story Points` -> Story Points
8. `Epic Name` -> Epic Name
9. `Labels` -> Labels
10. `Components` -> Component/s

## 4. Observacoes importantes

1. O campo `Parent` deve aceitar valor externo para resolver hierarquia durante o import.
2. Se o projeto nao permitir `Sub-task` no CSV inicial, importe em duas etapas:
   - etapa 1: Epics + Stories;
   - etapa 2: Sub-tasks com `Parent ID` das Stories.
