# Backlog Jira - Guardian Producao (2026-03_04)

## 1. Arquivos de importacao

1. Jira Cloud com hierarquia por `Parent ID`:
   - `docs/features/BACKLOG_JIRA_CLOUD_GUARDIAN_PRODUCAO_2026-03_04.csv`
2. Jira classico com relacionamento por `Epic Link`:
   - `docs/features/BACKLOG_JIRA_GUARDIAN_PRODUCAO_2026-03_04.csv`

## 2. Estrutura entregue

1. 6 Epics (`GDN-EPIC-00` a `GDN-EPIC-05`).
2. Stories e Tasks do inicio ao go live com gates por sprint.
3. Validacoes de teste no final de cada sprint.
4. Colunas extras para operacao: `Owner`, `Sprint`, `Dependencies`, `Start date`, `Due date`.

## 3. Mapeamento recomendado no importador CSV

### 3.1 Jira Cloud com Parent ID

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
11. `Start date` -> Start date
12. `Due date` -> Due date

### 3.2 Jira classico com Epic Link

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
11. `Start date` -> Start date
12. `Due date` -> Due date

## 4. Colunas adicionais

1. `Owner` e `Dependencies` podem ser importadas como campos customizados.
2. Se nao houver campo customizado, manter como referencia no CSV para planejamento e automacao.
3. `Dependencies` esta no formato de IDs internos separados por `;`.

## 5. Regra operacional sugerida para o agente

1. Concluir todos os itens do sprint.
2. Concluir validacoes de sprint.
3. Concluir `Gate` do sprint.
4. Ao fechar o `Gate`, iniciar automaticamente o proximo sprint sem solicitar confirmacao.
