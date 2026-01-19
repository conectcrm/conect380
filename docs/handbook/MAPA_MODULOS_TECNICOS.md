# 🗺️ Mapa: Módulos Técnicos (Backend) vs Módulos de Produto

Este mapa existe para evitar duas derivas comuns:

1. confundir **nome de pasta/módulo técnico** com **módulo de produto**
2. criar features isoladas por “conveniência de pasta”, quebrando integração (cliente/ticket/fatura)

## ✅ Fonte de verdade do escopo

- Índice oficial: [docs/INDICE_DOCUMENTACAO.md](../INDICE_DOCUMENTACAO.md)
- Contexto operacional: [CONTEXTO_ATUAL.md](./CONTEXTO_ATUAL.md)

---

## 🎯 Macro-módulos de produto (visão do negócio)

- **Atendimento / Omnichannel**: tickets, mensagens, canais, filas, equipes, SLA
- **CRM / Vendas**: leads, oportunidades, propostas, contratos
- **Financeiro**: faturamento, contas, cobranças, pagamentos, conciliação
- **Automação / IA**: triagem, automações, copilots, insights
- **Analytics**: KPIs, relatórios, métricas
- **Admin / Governança**: empresas (tenant), usuários, planos, permissões
- **Integrações**: provedores externos (ex.: Mercado Pago)

---

## 🧩 Módulos técnicos do backend (pasta em `backend/src/modules/`)

Abaixo está o mapeamento prático entre pasta e “área” do produto.

### Atendimento / Omnichannel

- `atendimento/`
- `configuracoes-tickets/`
- `interacoes/`

### CRM / Vendas

- `leads/`
- `oportunidades/`
- `propostas/`
- `contratos/`
- `produtos/`
- `metas/`

### Financeiro

- `financeiro/`
- `faturamento/`
- `pagamentos/`
- `mercado-pago/` (integração específica que afeta o financeiro)

### Automação / IA

- `triagem/`
- `ia/`
- `orquestrador/` (coordenação de fluxos/eventos/execuções)
- `eventos/` (event-driven / integrações internas)

### Analytics / Observabilidade

- `analytics/`
- `dashboard/`
- `metrics/` (métricas/telemetria)

### Admin / Governança

- `empresas/` (tenant raiz)
- `users/`
- `auth/`
- `planos/`
- `admin/`
- `agenda/` (pode ser produto ou infra, depende do uso)

### Suporte / Infra

- `common/`

---

## ✅ Regra prática: onde colocar uma feature nova?

1. Identifique o **domínio de negócio principal** (ex.: “proposta”, “cobrança”, “ticket”).
2. Coloque a feature no módulo técnico que já “detém” o agregado principal.
3. Se a feature cruza domínios, prefira:
   - manter a regra/estado no domínio dono
   - integrar via eventos (`eventos/`) ou orquestração (`orquestrador/`) quando fizer sentido

---

## 🛑 Multi-tenant (lembrete)

- Qualquer entidade de negócio deve ter `empresa_id/empresaId` + RLS.
- Controllers devem ser protegidos por `JwtAuthGuard` (ou `@Public()` + justificativa quando for realmente público).

(Referência: [docs/handbook/DECISOES_TECNICAS.md](./DECISOES_TECNICAS.md))
