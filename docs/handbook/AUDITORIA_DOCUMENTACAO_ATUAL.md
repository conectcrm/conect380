# Auditoria da Documentação Atual — Conect360

**Data**: 19/01/2026
**Objetivo**: identificar documentos desatualizados, legados ou fora de escopo e orientar correções.

---

## 1) Resultado Executivo

### ✅ Atualizados / Alinhados

- [VISAO_SISTEMA_2025.md](../../VISAO_SISTEMA_2025.md)
- [docs/INDICE_DOCUMENTACAO.md](../INDICE_DOCUMENTACAO.md)
- [docs/websocket-events.md](../websocket-events.md)
- [docs/handbook/INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md)

### 🟡 Válidos, mas precisam rotulagem de escopo

- [backend/INDICE_DOCUMENTACAO.md](../../backend/INDICE_DOCUMENTACAO.md)
  - **Problema**: índice de subsistema (WhatsApp/Tickets) pode parecer “documento principal”.
  - **Ação recomendada**: inserir aviso no topo: “documentação do subsistema de tickets/WhatsApp”.

- [QUICKSTART.md](../../QUICKSTART.md)
  - **Problema**: ainda contém trechos e links que podem soar como “produto omnichannel”.
  - **Ação recomendada**: manter como quickstart do projeto, mas rotular explicitamente quando estiver descrevendo o módulo Atendimento (Omnichannel).

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

1. **Entrypoints com trechos “omnichannel-only”**

- Alguns documentos de entrada (especialmente [QUICKSTART.md](../../QUICKSTART.md) e o README raiz) ainda têm trechos e links que parecem “produto omnichannel”.
- Risco: novos devs interpretarem o Conect360 como Zendesk‑like, em vez de suite all‑in‑one.

2. **Índice do backend sem aviso de escopo**
   - [backend/INDICE_DOCUMENTACAO.md](../../backend/INDICE_DOCUMENTACAO.md) pode ser lido como “documentação oficial”.
   - Risco: foco excessivo em WhatsApp/Tickets ao iniciar tarefas gerais.

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

1. **Rotular escopo** no topo de [backend/INDICE_DOCUMENTACAO.md](../../backend/INDICE_DOCUMENTACAO.md).
2. **Ajustar QUICKSTART** para remover frases finais “Omnichannel” e deixar links do módulo com rótulo de escopo.

### Prioridade Média

3. Criar um “Mapa de Módulos Técnicos” (backend) vs “Módulos de Produto” (visão 8 módulos).

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
