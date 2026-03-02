# Backlog Jira - Admin Backoffice (2026-03)

## 1. Arquivo de importacao

1. `docs/features/BACKLOG_JIRA_ADMIN_BACKOFFICE_2026-03.csv`
2. Versao Jira Cloud com hierarquia por `Parent`:
   - `docs/features/BACKLOG_JIRA_CLOUD_ADMIN_BACKOFFICE_2026-03.csv`

## 2. Estrutura entregue

1. 4 Epics:
   - ADM-01 Seguranca e identidade
   - ADM-02 Governanca de permissoes
   - ADM-03 Auditoria e monitoramento
   - ADM-04 Backoffice dedicado
2. 11 Stories (ADM-001 a ADM-303).
3. 22 Tasks tecnicas (sufixo `-T1` e `-T2`).

## 3. Mapeamento recomendado no importador CSV do Jira

1. `Issue ID` -> External issue id
2. `Issue Type` -> Issue Type
3. `Summary` -> Summary
4. `Description` -> Description
5. `Priority` -> Priority
6. `Story Points` -> Story Points
7. `Epic Name` -> Epic Name
8. `Epic Link` -> Epic Link
9. `Labels` -> Labels
10. `Components` -> Component/s

## 4. Observacoes de uso

1. As Stories e Tasks foram vinculadas ao Epic via coluna `Epic Link`.
2. As Tasks estao com prefixo da Story no `Summary` para rastreabilidade simples apos importacao.
3. Se o projeto Jira nao usar `Epic Link`, mapear para campo de hierarquia equivalente (`Parent`).

## 5. Priorizacao sugerida para primeira onda

1. Importar e planejar primeiro:
   - ADM-001
   - ADM-002
   - ADM-003
   - ADM-101
   - ADM-102
   - ADM-201
2. Segundo ciclo:
   - ADM-103
   - ADM-202
3. Fase 2:
   - ADM-301
   - ADM-302
   - ADM-303
