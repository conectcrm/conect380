# Funil de Vendas - ConectCRM
## Design System e Padrões de Interface

### 📋 **Especificações do Funil de Vendas**

#### **Conceito Base:**
Inspirado nos CRMs líderes de mercado (Salesforce, HubSpot, Pipedrive) com a identidade visual do ConectCRM.

#### **Cores do Sistema:**
- **Primary:** #159A9C (Teal principal)
- **Primary Dark:** #0F7B7D (Teal escuro)
- **Secondary:** #F0F9FF (Azul claro)
- **Success:** #10B981 (Verde)
- **Warning:** #F59E0B (Amarelo)
- **Danger:** #EF4444 (Vermelho)
- **Gray-50:** #F9FAFB
- **Gray-100:** #F3F4F6
- **Gray-200:** #E5E7EB
- **Gray-800:** #1F2937

#### **Componentes Padrão:**

1. **Cards de Pipeline:**
   - Border radius: 12px
   - Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
   - Padding: 20px
   - Background: White

2. **Modais:**
   - **FORMATO OBRIGATÓRIO: PAISAGEM (Landscape)**
   - Width: min-width 800px, max-width 1200px
   - Height: min-height 500px, max-height 80vh
   - Border radius: 16px
   - Backdrop: rgba(0, 0, 0, 0.5)

3. **Botões:**
   - Primary: bg-[#159A9C] hover:bg-[#0F7B7D]
   - Secondary: bg-gray-100 hover:bg-gray-200
   - Border radius: 8px
   - Padding: px-4 py-2

4. **Forms:**
   - Input border: border-gray-300
   - Focus: ring-2 ring-[#159A9C] border-transparent
   - Border radius: 8px

#### **Estágios do Funil (Padrão CRM Profissional):**

1. **Leads** (Prospects iniciais)
2. **Qualificação** (Leads qualificados)
3. **Proposta** (Proposta enviada)
4. **Negociação** (Em negociação)
5. **Fechamento** (Aguardando assinatura)
6. **Ganho** (Venda fechada)
7. **Perdido** (Oportunidade perdida)

#### **Funcionalidades Obrigatórias:**

1. **Kanban Board:** Drag & Drop entre estágios
2. **Cards de Oportunidade:** Com todas as informações essenciais
3. **Modal de Detalhes:** Formato paisagem com abas
4. **Filtros Avançados:** Por período, vendedor, valor, etc.
5. **Métricas em Tempo Real:** Taxa de conversão, valor total, etc.
6. **Timeline de Atividades:** Histórico completo
7. **Integração com Clientes:** Link direto com módulo de clientes

#### **Responsividade:**
- Desktop: Layout completo com 4-7 colunas
- Tablet: Layout adaptativo com scroll horizontal
- Mobile: Cards empilhados com navegação por abas

#### **Padrões de UX:**
- Feedback visual em todas as ações
- Loading states consistentes
- Confirmações para ações críticas
- Tooltips informativos
- Atalhos de teclado

### 🎨 **Identidade Visual Mantida:**
- Logo ConectCRM sempre visível
- Cores da marca em todos os elementos principais
- Tipografia consistente (Inter/System fonts)
- Espaçamento uniforme (Tailwind spacing scale)
- Ícones do Lucide React (consistência visual)

### 📱 **Acessibilidade:**
- Contraste adequado (WCAG 2.1 AA)
- Navegação por teclado
- Screen reader friendly
- Focus indicators visíveis
- Textos alternativos em imagens

---

**Última atualização:** 22/07/2025
**Responsável:** Sistema ConectCRM
**Versão:** 1.0
