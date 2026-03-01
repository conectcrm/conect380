# ðŸ“š ÃNDICE DE DOCUMENTAÃ‡ÃƒO - Conect360

**Atualizado**: 01/03/2026  
**VersÃ£o**: 2.1

---

## ðŸŽ¯ DocumentaÃ§Ã£o Principal (LEIA PRIMEIRO)

### 1. **VISAO_SISTEMA_2025.md** â­ ESSENCIAL

**Posicionamento oficial do sistema**

- DefiniÃ§Ã£o: Conect360 como Suite All-in-One
- Concorrentes reais: HubSpot, Zoho CRM, RD Station
- 8 MÃ³dulos principais
- Diferenciais competitivos
- Roadmap 2026
- Mensagem para o time (dev, vendas, product)

ðŸ“– [Ler documento](../VISAO_SISTEMA_2025.md)

---

### 2. **README.md** â­ ESSENCIAL

**DocumentaÃ§Ã£o tÃ©cnica completa**

- Overview dos 8 mÃ³dulos
- Stack tecnolÃ³gico (NestJS + React)
- Guia de instalaÃ§Ã£o
- Deploy com Docker
- VariÃ¡veis de ambiente

ðŸ“– [Ler documento](../README.md)

---


## Padroes de Tela e UI (Layout V2)

### Fonte oficial de requisitos

- [ARQUITETURA_PADRONIZACAO_TELAS.md](features/ARQUITETURA_PADRONIZACAO_TELAS.md) - requisitos oficiais de tipologia, largura, responsividade e padrao de modais.
- [CHECKLIST_PADRONIZACAO_TELAS.md](features/CHECKLIST_PADRONIZACAO_TELAS.md) - checklist de PR/QA para validar padronizacao de tela e modal.

---

## ðŸ“Š AnÃ¡lises e Comparativos

### 3. **ANALISE_COMPARATIVA_CRM_MERCADO.md**

**Benchmark detalhado vs concorrentes**

- ComparaÃ§Ã£o com Salesforce, HubSpot, Pipedrive, Zoho, RD Station
- Score por categoria (64 funcionalidades)
- Gaps identificados
- PontuaÃ§Ã£o: 34% (bÃ¡sico+)

ðŸ“– [Ler documento](archive/2025/ANALISE_COMPARATIVA_CRM_MERCADO.md)

---

### 4. **ANALISE_DOCUMENTACAO_DESATUALIZADA.md**

**AnÃ¡lise crÃ­tica da documentaÃ§Ã£o antiga**

- IdentificaÃ§Ã£o de inconsistÃªncias
- ComparaÃ§Ã£o: visÃ£o antiga vs real
- Documentos obsoletos listados
- AÃ§Ãµes de correÃ§Ã£o tomadas

ðŸ“– [Ler documento](../ANALISE_DOCUMENTACAO_DESATUALIZADA.md)

---

## ðŸ¤– Bot de Triagem

### 5. **BOT_STATUS_ATUALIZADO.md**

**Status atual do bot de triagem**

- Bot estÃ¡ CONFIGURADO e FUNCIONANDO
- 1 fluxo publicado (Triagem Inteligente v3.0)
- 3 nÃºcleos visÃ­veis no bot
- 2 triagens concluÃ­das em 24h

ðŸ“– [Ler documento](../BOT_STATUS_ATUALIZADO.md)

---

### 6. **BOTOES_INTERATIVOS_WHATSAPP.md**

**ImplementaÃ§Ã£o de botÃµes no WhatsApp**

- Reply Buttons (1-3 opÃ§Ãµes)
- List Messages (4-10 opÃ§Ãµes)
- Fallback automÃ¡tico para texto
- Estrutura da API

ðŸ“– [Ler documento](../BOTOES_INTERATIVOS_WHATSAPP.md)

---

## ðŸš€ ImplementaÃ§Ã£o e Guias

### 7. **docs/handbook/**

**Guias prÃ¡ticos de implementaÃ§Ã£o**

- INDICE_DOCUMENTACAO.md - Ãndice do handbook (operaÃ§Ã£o do Copilot)
- AUDITORIA_DOCUMENTACAO_ATUAL.md - Auditoria: documentaÃ§Ã£o vs cÃ³digo
- MAPA_MODULOS_TECNICOS.md - Mapa: mÃ³dulos tÃ©cnicos vs mÃ³dulos de produto
- GUIA_TESTES_TRIAGEM_BOT.md - Como testar o bot
- GUIA_IMPLEMENTACAO_MELHORIAS_BOT.md - NLP e melhorias

ðŸ“ [Ver pasta](handbook/)

---

### 8. **docs/runbooks/**

**Procedimentos operacionais**

- IntegraÃ§Ã£o bot + nÃºcleos
- Checklist de testes completo
- PrÃ³ximos passos triagem

ðŸ“ [Ver pasta](runbooks/)

---

## ðŸ—‚ï¸ DocumentaÃ§Ã£o Arquivada

### 9. **docs/archive/2025/deprecated-omnichannel/**

âš ï¸ **DOCUMENTAÃ‡ÃƒO OBSOLETA - NÃƒO USAR**

**Arquivamento 1** (deprecated-omnichannel/):

- âŒ OMNICHANNEL_RESUMO_EXECUTIVO.md
- âŒ TODO_OMNICHANNEL.md
- âŒ OMNICHANNEL_ANALISE_MANTER_VS_REMOVER.md

**Arquivamento 2** (deprecated-omnichannel-old/):

- âŒ OMNICHANNEL_INDICE.md
- âŒ OMNICHANNEL_ROADMAP_MELHORIAS.md
- âŒ OMNICHANNEL_GUIA_VISUAL.md
- âŒ OMNICHANNEL_O_QUE_REMOVER.md
- âŒ MELHORIAS_CHAT_OMNICHANNEL.md
- âŒ RESUMO_MELHORIAS_CONFIGURACOES.md
- âŒ ANALISE_ESTAGIOS_OMNICHANNEL_TEMPO_REAL.md
- âŒ APRESENTACAO_EXECUTIVA_5MIN.md
- âŒ ANTES_DEPOIS_UX_BOT.md
- âŒ VALIDACAO_CONFIGURACOES_VS_MERCADO.md
- âŒ MVP_TRIAGEM_CONCLUIDO.md
- âŒ PROPOSTA_SIMPLIFICACAO_ESTAGIOS_ATENDIMENTO.md

**Por que foram arquivados:**

- Tratavam ConectCRM como "sistema de atendimento" (ERRADO: Ã© suite all-in-one)
- Comparavam apenas com Zendesk/Intercom (ERRADO: competimos com HubSpot/Zoho)
- Propunham remover Pipeline/Financeiro (ERRADO: sÃ£o diferenciais)
- Focavam 80%+ em omnichannel, ignorando outros 6 mÃ³dulos

ðŸ“– [Ver README do arquivo 1](archive/2025/deprecated-omnichannel/README_ARQUIVADO.md)  
ðŸ“– [Ver README do arquivo 2](archive/2025/deprecated-omnichannel-old/README_ARQUIVADO.md)

---

## ðŸ“‹ Outros Documentos Importantes

### Pitch e ApresentaÃ§Ãµes

- ConectCRM_Pitch_Deck.html - ApresentaÃ§Ã£o para investidores

### Design System

- DESIGN_GUIDELINES.md - Tema Crevasse (paleta de cores)
- COMPONENTS_GUIDE.md - Guia de componentes

### HistÃ³rico de ImplementaÃ§Ãµes

- docs/archive/2025/ - Documentos histÃ³ricos de implementaÃ§Ã£o

---

## ðŸŽ¯ Guia RÃ¡pido por Perfil

### Para Desenvolvedores:

1. âœ… Ler [VISAO_SISTEMA_2025.md](../VISAO_SISTEMA_2025.md) - Entender escopo
2. âœ… Ler [README.md](../README.md) - Setup tÃ©cnico
3. âœ… Ler [DIFERENCIAL_INTEGRACAO_NATIVA.md](../DIFERENCIAL_INTEGRACAO_NATIVA.md) - Backend Ãºnico (arquitetura)
4. âœ… Ler [ANALISE_COMPARATIVA_CRM_MERCADO.md](archive/2025/ANALISE_COMPARATIVA_CRM_MERCADO.md) - Features vs mercado
5. âŒ **NÃƒO** ler documentaÃ§Ã£o em deprecated-omnichannel/ ou deprecated-omnichannel-old/

### Para Product Managers:

1. âœ… Ler [VISAO_SISTEMA_2025.md](../VISAO_SISTEMA_2025.md) - Posicionamento e roadmap
2. âœ… Ler [DIFERENCIAL_INTEGRACAO_NATIVA.md](../DIFERENCIAL_INTEGRACAO_NATIVA.md) - DIFERENCIAL #1 vs Zoho/HubSpot
3. âœ… Ler [ANALISE_COMPARATIVA_CRM_MERCADO.md](archive/2025/ANALISE_COMPARATIVA_CRM_MERCADO.md) - Gaps vs concorrentes
4. âœ… Ler [ANALISE_DOCUMENTACAO_DESATUALIZADA.md](../ANALISE_DOCUMENTACAO_DESATUALIZADA.md) - Entender correÃ§Ãµes

### Para Vendas:

1. âœ… Ler [KIT_VENDAS_CONECTCRM.md](../KIT_VENDAS_CONECTCRM.md) - Scripts prontos, objeÃ§Ãµes, comparativos
2. âœ… Ler [DIFERENCIAL_INTEGRACAO_NATIVA.md](../DIFERENCIAL_INTEGRACAO_NATIVA.md) - Frases, casos, ROI (R$148k/ano)
3. âœ… Ler [VISAO_SISTEMA_2025.md](../VISAO_SISTEMA_2025.md) - SeÃ§Ã£o "Mensagem para Vendas"
4. âœ… Ver [ConectCRM_Pitch_Deck.html](../ConectCRM_Pitch_Deck.html) - ApresentaÃ§Ã£o pronta
5. âœ… Memorizar: "Um Ãºnico sistema que faz tudo - nÃ£o produtos separados como Zoho"

### Para Investidores:

1. âœ… Ler [PITCH_DECK_INVESTIDORES.md](../PITCH_DECK_INVESTIDORES.md) - 7 seÃ§Ãµes (problema, soluÃ§Ã£o, mercado, traÃ§Ã£o, roadmap, time, ask)
2. âœ… Ler [VISAO_SISTEMA_2025.md](../VISAO_SISTEMA_2025.md) - SeÃ§Ãµes "Posicionamento" e "MÃ©tricas"
3. âœ… Ver [ConectCRM_Pitch_Deck.html](../ConectCRM_Pitch_Deck.html) - ApresentaÃ§Ã£o visual

---

## âš ï¸ AVISO IMPORTANTE

### âŒ Documentos que NÃƒO devem ser usados:

- Qualquer documento em **docs/archive/2025/deprecated-omnichannel/** (3 arquivos)
- Qualquer documento em **docs/archive/2025/deprecated-omnichannel-old/** (12 arquivos)
- Qualquer documento que compare ConectCRM apenas com Zendesk/Intercom
- Qualquer documento que trate sistema como "apenas atendimento"
- Qualquer roadmap que proponha remover Pipeline ou Financeiro

**Por que foram arquivados:**

- VisÃ£o ERRADA: tratavam ConectCRM como "clone do Zendesk"
- Competidores ERRADOS: ignoravam HubSpot/Zoho (verdadeiros concorrentes)
- Escopo ERRADO: focavam 80%+ em omnichannel, ignorando outros 6 mÃ³dulos
- Roadmap ERRADO: propunham integrar Discord/Slack em vez de Email/Templates
- Diferencial IGNORADO: nÃ£o mencionavam backend Ãºnico (R$148k/ano de economia)

### âœ… Documentos oficiais atualizados (use ESTES):

- **VISAO_SISTEMA_2025.md** - Posicionamento, escopo, roadmap
- **README.md** - Setup tÃ©cnico, comandos
- **KIT_VENDAS_CONECTCRM.md** - Scripts, objeÃ§Ãµes, comparativos (42 pÃ¡ginas)
- **DIFERENCIAL_INTEGRACAO_NATIVA.md** - Backend Ãºnico vs Zoho/HubSpot (40+ pÃ¡ginas, ROI R$148k/ano)
- **PITCH_DECK_INVESTIDORES.md** - 7 seÃ§Ãµes para investidores
- **ANALISE_COMPARATIVA_CRM_MERCADO.md** - Benchmark features vs mercado

---

## ðŸ”„ HistÃ³rico de AtualizaÃ§Ãµes

| Data       | VersÃ£o | MudanÃ§as                                                                                                                                                              |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19/01/2025 | 3.0    | Arquivados 12 docs adicionais (deprecated-omnichannel-old/), criado DIFERENCIAL_INTEGRACAO_NATIVA.md, KIT_VENDAS_CONECTCRM.md, PITCH_DECK_INVESTIDORES.md atualizados |
| 19/12/2025 | 2.0    | Criado novo Ã­ndice, arquivada documentaÃ§Ã£o omnichannel desatualizada (3 docs)                                                                                         |
| 19/12/2025 | 2.0    | Criado VISAO_SISTEMA_2025.md como documento oficial                                                                                                                   |
| 19/12/2025 | 2.0    | Atualizado README.md com foco em suite all-in-one                                                                                                                     |

---

**PrÃ³xima revisÃ£o**: Trimestral ou quando lanÃ§ar novo mÃ³dulo

