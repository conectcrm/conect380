# WINDOW_CONFIRM_AUDIT

Data: 2026-02-20

## Escopo
- Busca global em `frontend-web/src` por `window.confirm(...)` e `confirm(...)`.
- Objetivo: mapear uso atual e separar legado/template.

## Resumo
- Ocorrencias totais: 72
- window.confirm: 64
- confirm: 8
- Arquivos com ocorrencias: 54
- Ocorrencias em arquivos ativos (excluindo padrao legado/template): 65
- Ocorrencias em legado/template/examples: 7
- Ocorrencias em paginas raiz presentes no inventario de rotas ativas (USED_UI_INVENTORY.md): 15

## Ocorrencias por Arquivo
| Arquivo | Ocorrencias |
| --- | ---: |
| frontend-web/src/features/comercial/pages/CotacaoPage.tsx | 4 |
| frontend-web/src/features/propostas/PropostasPage.tsx | 3 |
| frontend-web/src/features/gestao/pages/GestaoNucleosPage.tsx | 3 |
| frontend-web/src/features/atendimento/pages/GestaoFilasPage.tsx | 2 |
| frontend-web/src/features/financeiro/fornecedores/FornecedoresPage.tsx | 2 |
| frontend-web/src/features/admin/empresas/EmpresaDetailPage.tsx | 2 |
| frontend-web/src/features/contatos/ContatosPageNova.OLD.tsx | 2 |
| frontend-web/src/features/propostas/components/PropostaActions.tsx | 2 |
| frontend-web/src/features/propostas/components/SelecaoMultipla.tsx | 2 |
| frontend-web/src/features/contatos/ContatosPage.OLD.tsx | 2 |
| frontend-web/src/hooks/base/useEntityCRUD.ts | 2 |
| frontend-web/src/pages/DemandaDetailPage.tsx | 2 |
| frontend-web/src/pages/TicketDetailPage.tsx | 2 |
| frontend-web/src/features/clientes/ClientesPage.tsx | 2 |
| frontend-web/src/features/atendimento/configuracoes/tabs/NucleosTab.tsx | 1 |
| frontend-web/src/features/atendimento/configuracoes/tabs/TagsTab.tsx | 1 |
| frontend-web/src/features/bot-builder/components/ModalHistoricoVersoes.tsx | 1 |
| frontend-web/src/components/filtros/FiltrosAvancados.tsx | 1 |
| frontend-web/src/features/gestao/pages/GestaoDepartamentosPage.tsx | 1 |
| frontend-web/src/features/contatos/ContatosPage.tsx | 1 |
| frontend-web/src/components/chat/RespostasRapidas.tsx | 1 |
| frontend-web/src/components/modals/ModalCadastroProduto.tsx | 1 |
| frontend-web/src/features/gestao/pages/GestaoEquipesPage.tsx | 1 |
| frontend-web/src/examples/ExemploModalProdutoAvancado.tsx | 1 |
| frontend-web/src/features/gestao/pages/GestaoFluxosPage.tsx | 1 |
| frontend-web/src/pages/PipelinePage.tsx | 1 |
| frontend-web/src/components/whatsapp/WhatsAppManager.tsx | 1 |
| frontend-web/src/components/modals/ModalCadastroProdutoNovo.tsx | 1 |
| frontend-web/src/pages/GestaoSkillsPage.tsx | 1 |
| frontend-web/src/features/gestao/pages/DepartamentosPage.tsx | 1 |
| frontend-web/src/features/gestao/pages/GestaoAtribuicoesPage.tsx | 1 |
| frontend-web/src/features/gestao/pages/GestaoAtendentesPage.tsx | 1 |
| frontend-web/src/features/atendimento/pages/FluxoBuilderPage.tsx | 1 |
| frontend-web/src/components/calendar/EventModal.tsx | 1 |
| frontend-web/src/pages/_TemplateSimplePage.tsx | 1 |
| frontend-web/src/pages/GestaoTemplatesPage.tsx | 1 |
| frontend-web/src/pages/GestaoNiveisAtendimentoPage.tsx | 1 |
| frontend-web/src/pages/GestaoStatusCustomizadosPage.tsx | 1 |
| frontend-web/src/pages/ConfiguracaoDistribuicaoPage.tsx | 1 |
| frontend-web/src/pages/ConfiguracaoSLAPage.tsx | 1 |
| frontend-web/src/hooks/base/useSecureForm.ts | 1 |
| frontend-web/src/pages/_TemplateWithKPIsPage.tsx | 1 |
| frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx | 1 |
| frontend-web/src/pages/LeadsPage.tsx | 1 |
| frontend-web/src/pages/faturamento/FaturamentoPagePadronizada.tsx | 1 |
| frontend-web/src/components/oportunidades/ModalOportunidadeRefatorado.tsx | 1 |
| frontend-web/src/components/notifications/ReminderManager.tsx | 1 |
| frontend-web/src/pages/configuracoes/MetasConfiguracao.tsx | 1 |
| frontend-web/src/features/clientes/ClientesPageNew.tsx | 1 |
| frontend-web/src/pages/InteracoesPage.tsx | 1 |
| frontend-web/src/components/Billing/Admin/PlanosAdmin.tsx | 1 |
| frontend-web/src/components/Billing/Admin/ModulosAdmin.tsx | 1 |
| frontend-web/src/pages/FechamentoAutomaticoPage.tsx | 1 |
| frontend-web/src/pages/GestaoTiposServicoPage.tsx | 1 |

## Arquivos de Rotas Ativas (intersecao com `USED_UI_INVENTORY.md`)
| Arquivo | Ocorrencias |
| --- | ---: |
| frontend-web/src/features/propostas/PropostasPage.tsx | 3 |
| frontend-web/src/pages/TicketDetailPage.tsx | 2 |
| frontend-web/src/features/admin/empresas/EmpresaDetailPage.tsx | 2 |
| frontend-web/src/pages/GestaoTiposServicoPage.tsx | 1 |
| frontend-web/src/pages/FechamentoAutomaticoPage.tsx | 1 |
| frontend-web/src/pages/PipelinePage.tsx | 1 |
| frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx | 1 |
| frontend-web/src/pages/ConfiguracaoDistribuicaoPage.tsx | 1 |
| frontend-web/src/pages/GestaoStatusCustomizadosPage.tsx | 1 |
| frontend-web/src/pages/LeadsPage.tsx | 1 |
| frontend-web/src/pages/GestaoNiveisAtendimentoPage.tsx | 1 |

## Legado/Template/Examples (nao priorizar migracao)
| Arquivo | Ocorrencias |
| --- | ---: |
| frontend-web/src/features/contatos/ContatosPageNova.OLD.tsx | 2 |
| frontend-web/src/features/contatos/ContatosPage.OLD.tsx | 2 |
| frontend-web/src/examples/ExemploModalProdutoAvancado.tsx | 1 |
| frontend-web/src/pages/_TemplateSimplePage.tsx | 1 |
| frontend-web/src/pages/_TemplateWithKPIsPage.tsx | 1 |

## Recomendacao Tecnica
1. Bloquear novos usos com ESLint: habilitar regra `no-alert` como `error`.
2. Migrar primeiro os arquivos de rotas ativas (intersecao com inventario).
3. Em seguida, migrar hooks compartilhados (`useEntityCRUD`, `useSecureForm`) para reduzir reincidencia transversal.
4. Deixar legado/template para ultimo ou manter fora de escopo.

## Nota
- O projeto ja possui alternativas como `ModalConfirmacao`, `ConfirmationModal`, `useConfirmation` e `useConfirmacaoInteligente`.
