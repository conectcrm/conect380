# Classificação dos Documentos (.md)

Atualizado em 01/12/2025 a partir de `docs/document-inventory.csv` (447 arquivos). Cada arquivo foi atribuído a um destino final com base no prefixo do nome, respeitando o plano aprovado: `docs/handbook` (referências vivas), `docs/runbooks` (procedimentos operacionais) e `docs/archive/2025` (histórico).

## Critérios dos Destinos
- **docs/handbook**: documentos de referência contínua (guias, índices e roadmaps) usados para onboarding e alinhamento estratégico.
- **docs/runbooks**: materiais acionáveis com passo a passo, validações, testes, planos operacionais ou próximos passos imediatos.
- **docs/archive/2025**: registros históricos (análises, conclusões, consolidações, relatórios, status, sessões, etc.) mantidos apenas para rastreabilidade.

## Mapeamento por Prefixo
| Prefixo        | Qtde | Destino           | Justificativa                                                                 | Exceções |
| -------------- | ---- | ----------------- | ----------------------------------------------------------------------------- | -------- |
| ANALISE        | 34   | docs/archive/2025 | Relatórios analíticos históricos.                                             | —        |
| CHECKLIST      | 17   | docs/runbooks     | Passo a passo acionável de validações ou deploy.                              | —        |
| CONCLUSAO      | 26   | docs/archive/2025 | Fechamentos de etapas já concluídas.                                          | —        |
| CONSOLIDACAO   | 47   | docs/archive/2025 | Consolidam resultados passados.                                               | —        |
| CORRECAO       | 57   | docs/archive/2025 | Pós-mortems/histórico de bugs corrigidos.                                     | —        |
| FASE           | 3    | docs/archive/2025 | Fechamentos por fase.                                                         | —        |
| GUIA           | 50   | docs/handbook     | Material de referência contínua (setup, integrações, testes).                | —        |
| IMPLEMENTACAO  | 13   | docs/runbooks     | Procedimentos para implantações específicas.                                  | —        |
| INDICE         | 6    | docs/handbook     | Tabelas de conteúdo utilizadas recorrentemente.                               | —        |
| INTEGRACAO     | 11   | docs/runbooks     | Playbooks de integração frontend/backend.                                     | —        |
| MISSAO         | 2    | docs/archive/2025 | Registros comemorativos de entregas.                                          | —        |
| PLANEJAMENTO   | 2    | docs/runbooks     | Planos táticos aplicáveis na operação.                                        | —        |
| PLANO          | 9    | docs/runbooks     | Planos operacionais (deploy, testes, unificação).                             | —        |
| PROBLEMA       | 8    | docs/runbooks     | Registro de incidentes com resolução ativa.                                   | —        |
| PROGRESSO      | 6    | docs/archive/2025 | Marcos históricos de progresso.                                               | —        |
| PROPOSTA       | 5    | docs/archive/2025 | Propostas avaliadas ao longo de 2025.                                          | —        |
| PROXIMAS       | 1    | docs/runbooks     | Plano imediato de ações (`PROXIMAS_ACOES`).                                    | —        |
| PROXIMOS       | 12   | docs/runbooks     | Sequências de trabalho aprovadas.                                             | —        |
| RELATORIO      | 6    | docs/archive/2025 | Relatórios históricos.                                                        | —        |
| RESUMO         | 41   | docs/archive/2025 | Sumários executivos já consolidados.                                          | —        |
| ROADMAP        | 6    | docs/handbook     | Diretrizes estratégicas vivas para o produto.                                 | —        |
| SEMANA         | 6    | docs/archive/2025 | Entradas de weekly reports concluídos.                                        | —        |
| SESSAO         | 6    | docs/archive/2025 | Notas de sessões específicas.                                                 | —        |
| SISTEMA        | 8    | docs/archive/2025 | Snapshots de estado final do sistema.                                         | —        |
| SOLUCAO        | 12   | docs/runbooks     | Procedimentos de correção reutilizáveis.                                      | —        |
| SPRINT         | 1    | docs/archive/2025 | Registro histórico da sprint #1.                                              | —        |
| STATUS         | 16   | docs/archive/2025 | Fotografias de status em datas passadas.                                      | —        |
| TESTE          | 21   | docs/runbooks     | Guias de execução de testes manuais/automáticos.                              | —        |
| VALIDACAO      | 15   | docs/runbooks     | Playbooks de validação pós-entrega.                                           | —        |

> **Cobertura completa:** cada arquivo listado em `docs/document-inventory.csv` herda o destino definido pelo respectivo prefixo acima, sem exceções adicionais até o momento.

## Projeção de Pastas Após Move
- `docs/handbook/GUIA_*.md`, `docs/handbook/INDICE_*.md`, `docs/handbook/ROADMAP_*.md`.
- `docs/runbooks/CHECKLIST_*.md`, `docs/runbooks/IMPLEMENTACAO_*.md`, `docs/runbooks/INTEGRACAO_*.md`, `docs/runbooks/PLANO_*.md`, `docs/runbooks/PLANEJAMENTO_*.md`, `docs/runbooks/PROBLEMA_*.md`, `docs/runbooks/PROXIMOS_*.md`, `docs/runbooks/PROXIMAS_ACOES.md`, `docs/runbooks/SOLUCAO_*.md`, `docs/runbooks/TESTE_*.md`, `docs/runbooks/VALIDACAO_*.md`.
- `docs/archive/2025/<prefixo>_*.md` para todos os demais prefixos (ANALISE, CONCLUSAO, CONSOLIDACAO, CORRECAO, FASE, MISSAO, PROGRESSO, PROPOSTA, RELATORIO, RESUMO, SEMANA, SESSAO, SISTEMA, SPRINT, STATUS etc.).

Qualquer novo arquivo deve seguir o mesmo critério: verificar prefixo, validar se é conteúdo vivo (handbook), operacional (runbook) ou histórico (archive) antes de salvar.

## Plano de Movimentação (detalhado)
O arquivo `docs/document-move-plan.csv` lista os 447 registros com a coluna `Destination`, já apontando o caminho final (ex.: `docs/runbooks/TESTE_RAPIDO_ATRIBUICOES.md`). Esse CSV será usado como base para os scripts de movimentação em massa e para auditoria posterior.
