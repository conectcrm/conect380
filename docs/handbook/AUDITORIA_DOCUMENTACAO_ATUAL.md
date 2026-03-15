# Auditoria da Documentação Atual — Conect360

**Data**: 19/01/2026
**Objetivo**: identificar documentos desatualizados, legados ou fora de escopo e orientar correções.

## Atualização 2026-03

- Esta auditoria deve ser lida em conjunto com [MATRIZ_COBERTURA_REQUISITOS_2026-03.md](MATRIZ_COBERTURA_REQUISITOS_2026-03.md) e [PLANO_SANEAMENTO_DOCUMENTACAO_2026-03.md](PLANO_SANEAMENTO_DOCUMENTACAO_2026-03.md).
- Após as correções recentes, os principais índices já foram rotulados com melhor clareza de escopo.
- O risco principal deixou de ser "índice errado como documento principal" e passou a ser "documento setorial ou de implementação sendo usado como contrato funcional futuro".
- As lacunas mais críticas de contrato-base foram reduzidas com a publicação de contratos e backlogs para assinatura eletrônica, e-mail omnichannel, inbound/threading de email, NFSe fase 1 e sincronização externa de calendário.
- O risco remanescente está mais concentrado em homologação, decisões de provider e fases seguintes ainda não contratadas.

---

## 1) Resultado Executivo

### ✅ Atualizados / Alinhados

- [VISAO_SISTEMA_2025.md](../../VISAO_SISTEMA_2025.md)
- [docs/INDICE_DOCUMENTACAO.md](../INDICE_DOCUMENTACAO.md)
- [docs/websocket-events.md](../websocket-events.md)
- [docs/handbook/INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)

### 🟡 Válidos, mas precisam rotulagem de escopo

- [backend/INDICE_DOCUMENTACAO.md](../../backend/INDICE_DOCUMENTACAO.md)
  - **Status**: corrigido.
  - **Observação**: manter o aviso de subsistema e os links para os índices gerais.

- [QUICKSTART.md](../../QUICKSTART.md)
  - **Status**: corrigido.
  - **Observação**: manter o quickstart estritamente como guia de setup, sem tratá-lo como mapa de maturidade funcional.

- [docs/ROADMAP_OMNICHANNEL.md](../ROADMAP_OMNICHANNEL.md)
  - **Problema**: roadmap setorial pode ser interpretado como planejamento oficial do produto inteiro.
  - **Ação recomendada**: manter banner explícito de escopo do módulo Atendimento (Omnichannel) e apontar para a matriz de cobertura.

- [docs/implementation/AGENDA_INTEGRADA_NOTIFICACOES.md](../implementation/AGENDA_INTEGRADA_NOTIFICACOES.md)
  - **Problema**: registro de implementação pode ser lido como contrato funcional fechado da Agenda.
  - **Ação recomendada**: rotular como evidência técnica/histórica, não como especificação futura.

### 🔴 Desatualizados / Legado

- (Sem itens críticos neste recorte após as correções recentes de índice/escopo)

---

## 2) Evidências e Fontes de Verdade

### Visão oficial do produto

- [VISAO_SISTEMA_2025.md](../../VISAO_SISTEMA_2025.md)
  - Define Conect360 como suite all‑in‑one com 8 módulos.

### Índice principal da documentação

- [docs/INDICE_DOCUMENTACAO.md](../INDICE_DOCUMENTACAO.md)
  - Reforça a visão all‑in‑one e lista docs já arquivados.

### Documentação técnica de realtime

- [docs/websocket-events.md](../websocket-events.md)
  - Alinhado com rooms por tenant e eventos canônicos.

---

## 3) Itens de Risco (Desalinhamentos)

1. **Documentos setoriais lidos como contrato global**

- Mesmo após ajustes nos entrypoints, ainda existe risco de roadmap de módulo ou nota de implementação serem tratados como requisitos oficiais do produto.
- Risco: agentes e novos devs implementarem backlog futuro com base em texto narrativo local, sem checar contratos atuais em [docs/features](../features) e na matriz de cobertura.

2. **Lacunas reais de requisitos ainda não fechadas**
  - Ainda faltam principalmente artefatos de homologação, evidências operacionais e decisões de provider/arquitetura em fiscal, assinatura, sincronização externa e canal email.
  - Risco: implementação futura avançar para rollout sem validação suficiente ou tratar backlog de fase seguinte como contrato pronto.

---

## 4) Inventário de Legado Arquivado (OK)

Documentos já arquivados como legados (sem ação agora):

- [docs/archive/2025/deprecated-omnichannel](../archive/2025/deprecated-omnichannel)
- [docs/archive/2025/deprecated-omnichannel-old](../archive/2025/deprecated-omnichannel-old)

Referência da análise que motivou o arquivamento:

- [ANALISE_DOCUMENTACAO_DESATUALIZADA.md](../../ANALISE_DOCUMENTACAO_DESATUALIZADA.md)

---

## 5) Recomendações Prioritárias

### Prioridade Alta

1. **Manter e propagar banners de escopo** em documentos setoriais ainda relevantes, especialmente [docs/ROADMAP_OMNICHANNEL.md](../ROADMAP_OMNICHANNEL.md) e docs do módulo Atendimento.
2. **Separar evidência técnica de contrato funcional** em documentos de implementação, especialmente Agenda e integrações.

### Prioridade Média

3. Formalizar checklists de homologação e contratos de fase seguinte nas frentes com cobertura parcial, conforme [MATRIZ_COBERTURA_REQUISITOS_2026-03.md](MATRIZ_COBERTURA_REQUISITOS_2026-03.md).

---

## 8) Apêndice — Arquivos com risco de confusão (priorizados)

### A) Entrypoints (alta prioridade)

- [README.md](../../README.md) — revisar trechos que citam “omnichannel” como se fosse o produto inteiro; manter como suite.
- [QUICKSTART.md](../../QUICKSTART.md) — remover “Você configurou... Omnichannel” e ajustar links para docs do módulo.
- [docs/websocket-events.md](../websocket-events.md) — já rotulado como Atendimento (Omnichannel).

### B) Docs do módulo Atendimento (manter, mas com rótulo de escopo)

- [docs/RELATORIO_FINAL.md](../RELATORIO_FINAL.md)
- [docs/RESUMO_COMPLETO_OMNICHANNEL.md](../RESUMO_COMPLETO_OMNICHANNEL.md)
- [docs/ROADMAP_OMNICHANNEL.md](../ROADMAP_OMNICHANNEL.md)
- [docs/PLANO_EVOLUCAO_CHAT_OMNICHANNEL.md](../PLANO_EVOLUCAO_CHAT_OMNICHANNEL.md)
- [docs/runbooks/PROXIMOS_PASSOS_ACAO_IMEDIATA.md](../runbooks/PROXIMOS_PASSOS_ACAO_IMEDIATA.md)
- [docs/handbook/GUIA_RAPIDO_PLANO_EXCELENCIA.md](GUIA_RAPIDO_PLANO_EXCELENCIA.md)
- [docs/runbooks/PLANO_ELIMINACAO_GAMBIARRAS_ROADMAP.md](../runbooks/PLANO_ELIMINACAO_GAMBIARRAS_ROADMAP.md)

### B2) Docs gerais que precisam de título/escopo (alta prioridade)

- [docs/GUIA_DEPLOY.md](../GUIA_DEPLOY.md)
- [docs/API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

### C) Arquivados/Histórico (sem ação)

- [docs/archive/2025/](../archive/2025/)

---

## 6) Próximos Passos (após varredura)

1. Confirmar se [backend/INDICE_DOCUMENTACAO.md](../../backend/INDICE_DOCUMENTACAO.md) está com aviso de escopo e links para o índice geral.
2. Padronizar banners de escopo nos docs do módulo Atendimento listados no apêndice (quando ainda faltarem).
3. Considerar um check automático simples (CI) para evitar reintroduzir “Conect360 Omnichannel” fora de docs do módulo ou sem rótulo de escopo.

---

## 7) Observações

- Esta auditoria não altera código ou documentação; apenas aponta inconsistências.
- Todas as recomendações respeitam a visão oficial em [VISAO_SISTEMA_2025.md](../../VISAO_SISTEMA_2025.md).
- Após 2026-03, parte desta auditoria passou a registrar também o status de saneamento já executado, para evitar recomendações duplicadas.
