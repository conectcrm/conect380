# Plano de atualização de links (docs)

Fonte: `docs/document-link-audit.csv` (gerado em 01/12/2025). O objetivo é substituir referências antigas para arquivos que foram movidos para `docs/handbook`, `docs/runbooks` ou `docs/archive/2025`.

## Resumo das mudanças
- **README.md**: linhas 342-469 possuem 12 links para arquivos agora em `docs/handbook` (GUIA), `docs/runbooks` (TESTE) e `docs/archive/2025` (CONSOLIDACAO, STATUS, SPRINT, SISTEMA, MISSAO, ROADMAP, ANALISE).
- **docs/archive/2025/**: 7 arquivos históricos referenciam outros .md movidos; todos devem usar os caminhos relativos dentro de `docs/archive/2025/` ou apontar para `../runbooks/`/`../handbook/` conforme o caso.
- **docs/runbooks/**: 3 runbooks citam seus próprios nomes ou outros docs, devendo apontar para `./` (mesmo diretório).

## Tabela de remapeamento (por arquivo)
| Arquivo | Linha | Link atual | Novo destino |
| ------- | ----- | ---------- | ------------- |
| README.md | 342 | `(GUIA_GESTAO_NUCLEOS_WHATSAPP.md)` | `(docs/handbook/GUIA_GESTAO_NUCLEOS_WHATSAPP.md)` |
| README.md | 343 | `(GUIA_CRIAR_FLUXO_WHATSAPP.md)` | `(docs/handbook/GUIA_CRIAR_FLUXO_WHATSAPP.md)` |
| README.md | 345 | `(GUIA_TOKEN_WHATSAPP.md)` | `(docs/handbook/GUIA_TOKEN_WHATSAPP.md)` |
| README.md | 350 | `(CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md)` | `(docs/archive/2025/CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md)` |
| README.md | 351 | `(TESTE_FECHAMENTO_AUTOMATICO.md)` | `(docs/runbooks/TESTE_FECHAMENTO_AUTOMATICO.md)` |
| README.md | 352 | `(STATUS_FECHAMENTO_AUTOMATICO.md)` | `(docs/archive/2025/STATUS_FECHAMENTO_AUTOMATICO.md)` |
| README.md | 358 | `(ANALISE_MODULOS_SISTEMA.md)` | `(docs/archive/2025/ANALISE_MODULOS_SISTEMA.md)` |
| README.md | 403 | `(ROADMAP_MELHORIAS.md)` | `(docs/handbook/ROADMAP_MELHORIAS.md)` |
| README.md | 428 | `(STATUS_BACKEND_ATENDIMENTO.md)` | `(docs/archive/2025/STATUS_BACKEND_ATENDIMENTO.md)` |
| README.md | 435 | `(SPRINT_1_COMPLETO_MULTITENANT.md)` | `(docs/archive/2025/SPRINT_1_COMPLETO_MULTITENANT.md)` |
| README.md | 440 | `(SISTEMA_WHATSAPP_CONCLUIDO.md)` | `(docs/archive/2025/SISTEMA_WHATSAPP_CONCLUIDO.md)` |
| README.md | 442 | `(CONSOLIDACAO_CONSTRUTOR_VISUAL.md)` | `(docs/archive/2025/CONSOLIDACAO_CONSTRUTOR_VISUAL.md)` |
| README.md | 443 | `(MISSAO_CUMPRIDA_ATENDIMENTO.md)` | `(docs/archive/2025/MISSAO_CUMPRIDA_ATENDIMENTO.md)` |
| README.md | 469 | `(ROADMAP_MELHORIAS.md)` | `(docs/handbook/ROADMAP_MELHORIAS.md)` |
| docs/archive/2025/CONSOLIDACAO_BACKEND_VALIDATION.md | 311 | `(CONSOLIDACAO_BACKEND_VALIDATION.md)` | `(./CONSOLIDACAO_BACKEND_VALIDATION.md)` |
| docs/archive/2025/CONSOLIDACAO_ETAPA4_DOCUMENTACAO.md | 239 | `(CONTRIBUTING.md)` | *(sem alteração; referência externa)* |
| docs/archive/2025/CONSOLIDACAO_FINAL_SLA.md | 827 | `(TESTE_MANUAL_SLA.md)` | `(../runbooks/TESTE_MANUAL_SLA.md)` |
| docs/archive/2025/CORRECAO_DEPARTAMENTOS_CONCLUIDA.md | 83 | `(ANALISE_STATUS_DEPARTAMENTOS.md)` | `(./ANALISE_STATUS_DEPARTAMENTOS.md)` |
| docs/archive/2025/RESUMO_SESSAO_03NOV2025.md | 451 | `(ROADMAP_MELHORIAS.md)` | `(../handbook/ROADMAP_MELHORIAS.md)` |
| docs/archive/2025/STATUS_BACKEND_ATENDIMENTO.md | 430 | `(INTEGRACAO_FRONTEND_BACKEND.md)` | `(../runbooks/INTEGRACAO_FRONTEND_BACKEND.md)` |
| docs/archive/2025/STATUS_DEPLOY_ATUAL.md | 8 | `(PLANO_DEPLOY_PRODUCAO.md)` | `(../runbooks/PLANO_DEPLOY_PRODUCAO.md)` |
| docs/runbooks/PROXIMOS_PASSOS_DETALHADOS.md | 731 | `(PROXIMOS_PASSOS_DETALHADOS.md)` | `(./PROXIMOS_PASSOS_DETALHADOS.md)` |
| docs/runbooks/PROXIMOS_PASSOS_MULTI_TENANCY.md | 316 | `(TESTE_E2E_MULTI_TENANCY_RESULTADOS.md)` | `(./TESTE_E2E_MULTI_TENANCY_RESULTADOS.md)` |
| docs/runbooks/VALIDACAO_FINAL_PRODUCAO.md | 308 | `(VALIDACAO_FINAL.md)` | `(./VALIDACAO_FINAL_PRODUCAO.md)` |

> Observação: A linha 239 de `CONSOLIDACAO_ETAPA4_DOCUMENTACAO.md` menciona `CONTRIBUTING.md` (que permanece na raiz) e não requer ajuste.

## Próximos passos
1. Aplicar todas as substituições acima (mantendo caminhos relativos). 
2. Rodar `npx markdown-link-check README.md docs/**/*.md` para garantir que nenhum link quebrou.
3. Registrar no changelog (ou no PR) que o repositório usa a nova estrutura e que os principais docs foram atualizados.
