# 📊 Tela de Faturamento - Sistema Completo

## 📋 Visão Geral

A tela de faturamento é o centro de controle financeiro do ConectCRM, oferecendo uma interface completa para gestão de faturas, cobranças e acompanhamento de receitas. O sistema combina dashboard interativo, gestão de faturas e ferramentas avançadas de configuração em uma interface moderna e responsiva.

## ⭐ Características Principais

### 🎯 **Dashboard Inteligente**
- **Cards Configuráveis**: De 1 a 4 cards personalizáveis por usuário
- **Métricas em Tempo Real**: Atualizações automáticas dos valores
- **Layout Responsivo**: Adaptação automática para qualquer dispositivo
- **Persistência**: Configurações salvas no navegador

### 📊 **Gestão de Faturas**
- **Criação Avançada**: Modal completo com itens, descontos e totais
- **Edição em Linha**: Modificação direta na tabela
- **Estados Múltiplos**: Pendente, enviada, paga, vencida, cancelada
- **Ações em Massa**: Operações simultâneas em múltiplas faturas

### 🔍 **Sistema de Filtros**
- **Busca Inteligente**: Por número, cliente ou observações
- **Filtros Avançados**: Status, tipo, período
- **Ordenação**: Por qualquer coluna da tabela
- **Resultados Dinâmicos**: Atualizações instantâneas

### 📱 **Interface Responsiva**
- **Mobile-First**: Design otimizado para dispositivos móveis
- **Breakpoints Inteligentes**: Adaptação fluida entre tamanhos
- **Touch-Friendly**: Botões e elementos otimizados para toque
- **Performance**: Carregamento rápido em qualquer dispositivo

## 🔧 Como Usar a Tela de Faturamento

### 1. **Acessando a Tela**
1. Navegue até o **Núcleo Financeiro**
2. Clique em **"Faturamento"**
3. A tela carregará com dashboard e lista de faturas

### 2. **Configurando o Dashboard**
1. Clique no botão **"Configurar Cards"** (ícone de engrenagem)
2. Selecione de 1 a 4 cards desejados
3. Visualize o preview em tempo real
4. Clique em **"Salvar Configuração"**
5. O dashboard se reorganizará automaticamente

### 3. **Criando Nova Fatura**
1. Clique no botão **"Nova Fatura"** (botão azul principal)
2. **Preencha as informações básicas**:
   - Selecione o cliente (obrigatório)
   - Escolha o contrato (opcional)
   - Defina data de vencimento
   - Selecione tipo e forma de pagamento

3. **Adicione itens à fatura**:
   - Descrição do produto/serviço
   - Quantidade e valor unitário
   - Unidade e descontos (opcional)
   - Use o botão "Adicionar" para incluir na lista

4. **Configure descontos gerais** (opcional):
   - Valor fixo em reais OU
   - Percentual sobre o total
   - Visualize o cálculo automático

5. **Adicione observações** (opcional)
6. Clique em **"Criar Fatura"**

### 4. **Gerenciando Faturas Existentes**
1. **Visualizar**: Clique no ícone de olho para ver detalhes
2. **Editar**: Clique no ícone de lápis para modificar
3. **Baixar PDF**: Clique no ícone de download
4. **Gerar Link**: Clique no ícone de link para pagamento
5. **Enviar Email**: Clique no ícone de envio
6. **Excluir**: Clique no ícone de lixeira

### 5. **Usando Filtros e Busca**
1. **Busca por Texto**: Digite no campo de busca (número, cliente, observações)
2. **Filtro por Status**: Selecione o status desejado no dropdown
3. **Filtro por Tipo**: Escolha o tipo de fatura
4. **Aplicar**: Clique em "Buscar" ou pressione Enter

### 6. **Seleção e Ações em Massa**
1. **Selecionar Faturas**: Marque as checkboxes das faturas desejadas
2. **Ações Disponíveis**:
   - Enviar por Email (múltiplas faturas)
   - Baixar PDFs (todas selecionadas)
   - Excluir (múltiplas faturas)
3. **Aplicar Ação**: Clique no botão da ação desejada

## 📊 Componentes da Tela

### **1. Header da Página**
| Elemento | Descrição | Funcionalidade |
|----------|-----------|----------------|
| Breadcrumb | Navegação hierárquica | Volta para Núcleo Financeiro |
| Título | "Faturamento" | Identificação da tela |
| Contador | Número total de faturas | Atualização em tempo real |
| Botão Principal | "Nova Fatura" | Abre modal de criação |

### **2. Dashboard de Cards**
| Card | Métrica | Cor | Cálculo |
|------|---------|-----|---------|
| Total de Faturas | Quantidade total | Azul | COUNT(*) |
| Faturas Pagas | Faturas finalizadas | Verde | COUNT(status='PAGA') |
| Faturas Vencidas | Faturas em atraso | Vermelho | COUNT(vencimento < hoje) |
| Valor Pendente | Valor a receber | Laranja | SUM(valor WHERE status≠'PAGA') |
| Valor Recebido | Valor já recebido | Verde | SUM(valor WHERE status='PAGA') |
| Faturas do Mês | Faturas do mês atual | Roxo | COUNT(mês atual) |

### **3. Área de Filtros**
| Campo | Tipo | Funcionalidade |
|-------|------|----------------|
| Busca | Texto livre | Busca em número, cliente, observações |
| Status | Dropdown | Filtra por status específico |
| Tipo | Dropdown | Filtra por tipo de fatura |
| Botão Buscar | Ação | Aplica filtros selecionados |

### **4. Tabela de Faturas**
| Coluna | Dados | Ordenação | Ações |
|--------|-------|-----------|-------|
| Seleção | Checkbox | - | Seleção múltipla |
| Número | Identificador único | ✓ | Link para detalhes |
| Cliente | Nome do cliente | ✓ | - |
| Valor | Valor total formatado | ✓ | - |
| Status | Badge colorido | ✓ | - |
| Vencimento | Data formatada | ✓ | - |
| Ações | Botões de ação | - | Ver, Editar, PDF, etc. |

### **5. Modal de Criação/Edição**
| Seção | Campos | Validação |
|-------|---------|-----------|
| Cliente/Contrato | Selects autocomplete | Cliente obrigatório |
| Informações Básicas | Data, tipo, forma pagamento | Data obrigatória |
| Itens da Fatura | Tabela editável | Mín. 1 item, valores > 0 |
| Descontos | Valor ou percentual | Mutuamente exclusivos |
| Observações | Texto livre | Opcional |
| Totais | Cálculo automático | Somente leitura |

## 🎨 Comportamento Responsivo

### **Desktop (> 1024px)**
```css
Dashboard: 1-4 colunas (baseado na configuração)
Tabela: Todas as colunas visíveis
Modal: Largura máxima 6xl
Filtros: Layout horizontal
```

### **Tablet (768px - 1024px)**
```css
Dashboard: 1-2 colunas (baseado na configuração)
Tabela: Scroll horizontal para colunas extras
Modal: Largura adaptativa
Filtros: Layout empilhado
```

### **Mobile (< 768px)**
```css
Dashboard: 1 coluna (todos os cards)
Tabela: Cards verticais em vez de tabela
Modal: Tela completa
Filtros: Accordion ou modal
```

## 💾 Persistência e Estado

### **Configurações do Usuário**
```typescript
interface ConfiguracaoUsuario {
  cardsConfigurados: string[];           // IDs dos cards selecionados
  filtrosAplicados: FiltrosFatura;       // Últimos filtros utilizados
  ordenacaoTabela: OrdenacaoTabela;      // Coluna e direção da ordenação
  itensPorPagina: number;                // Quantidade de itens por página
}
```

### **Estado da Aplicação**
```typescript
interface EstadoFaturamento {
  faturas: Fatura[];                     // Lista de faturas carregadas
  dashboardCards: DashboardCards;        // Dados dos cards
  carregando: boolean;                   // Estado de carregamento
  filtros: FiltrosFatura;                // Filtros ativos
  faturasSelecionadas: number[];         // IDs das faturas selecionadas
  modalAberto: boolean;                  // Estado do modal
  faturaEdicao: Fatura | null;           // Fatura sendo editada
}
```

### **Armazenamento Local**
- **Cards Dashboard**: `localStorage['faturamento-cards-config']`
- **Filtros Aplicados**: `sessionStorage['faturamento-filtros']`
- **Ordenação**: `localStorage['faturamento-ordenacao']`

## 🛠️ Arquitetura Técnica

### **Componentes Principais**

#### **1. FaturamentoPage.tsx**
```typescript
// Componente principal da tela
export default function FaturamentoPage() {
  // Estados de controle
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({});
  
  // Funções principais
  const carregarFaturas = async () => { ... };
  const handleSalvarFatura = async (dados: NovaFatura) => { ... };
  const excluirFatura = async (id: number) => { ... };
  
  return (
    // JSX da interface
  );
}
```

#### **2. ModalFatura.tsx**
```typescript
// Modal de criação/edição de faturas
interface ModalFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dadosFatura: NovaFatura) => void;
  fatura?: Fatura | null;
  isLoading?: boolean;
}
```

#### **3. ModalConfigurarCards.tsx**
```typescript
// Modal de configuração do dashboard
interface ModalConfigurarCardsProps {
  isOpen: boolean;
  onClose: () => void;
  cardsDisponiveis: CardConfig[];
  onSave: (cardsSelecionados: string[]) => void;
}
```

### **Serviços e APIs**

#### **FaturamentoService**
```typescript
export const faturamentoService = {
  // CRUD básico
  listarFaturas: (filtros?: FiltrosFatura) => Promise<Fatura[]>,
  criarFatura: (dados: NovaFatura) => Promise<Fatura>,
  atualizarFatura: (id: number, dados: NovaFatura) => Promise<Fatura>,
  excluirFatura: (id: number) => Promise<void>,
  
  // Ações específicas
  gerarLinkPagamento: (id: number) => Promise<string>,
  enviarFaturaPorEmail: (id: number) => Promise<void>,
  baixarPDF: (id: number) => Promise<Blob>,
};
```

### **Fluxo de Dados**
1. **Carregamento Inicial**: API → Estado → UI
2. **Filtros**: Input → Estado → API → UI
3. **Criação**: Modal → Validação → API → Atualização lista
4. **Configuração**: Modal → localStorage → Estado → UI
5. **Ações**: Botão → API → Feedback → Atualização

## 🎯 Casos de Uso por Perfil

### **👔 CEO/Diretor - Visão Executiva**
**Objetivo**: Acompanhar resultado financeiro geral
```yaml
Dashboard Recomendado: 1 card - "Valor Recebido"
Ações Principais:
  - Visualizar total arrecadado
  - Acompanhar crescimento mensal
  - Exportar relatórios executivos
Frequência de Uso: Semanal/Mensal
```

### **💼 CFO/Controller - Controle Financeiro**
**Objetivo**: Monitorar fluxo de caixa e inadimplência
```yaml
Dashboard Recomendado: 2 cards - "Valor Pendente" + "Valor Recebido"
Ações Principais:
  - Analisar contas a receber
  - Monitorar faturas vencidas
  - Gerenciar fluxo de caixa
  - Configurar alertas de vencimento
Frequência de Uso: Diária
```

### **📈 Gerente Comercial - Vendas e Cobrança**
**Objetivo**: Acompanhar vendas e reduzir inadimplência
```yaml
Dashboard Recomendado: 3 cards - "Total" + "Vencidas" + "Do Mês"
Ações Principais:
  - Criar faturas para novos contratos
  - Acompanhar faturas vencidas
  - Enviar cobranças por email
  - Gerar links de pagamento
Frequência de Uso: Diária
```

### **📋 Analista/Assistente - Operação Completa**
**Objetivo**: Gestão operacional detalhada
```yaml
Dashboard Recomendado: 4 cards - Visão completa
Ações Principais:
  - Criar e editar faturas
  - Processar pagamentos
  - Gerenciar documentos (PDFs)
  - Manter dados atualizados
  - Suporte a clientes
Frequência de Uso: Contínua
```

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **Dashboard não carrega cards**
**Sintomas**: Cards aparecem vazios ou não são exibidos
```javascript
// Diagnóstico
console.log('Cards configurados:', localStorage.getItem('faturamento-cards-config'));
console.log('Dados dashboard:', dashboardCards);

// Solução
localStorage.removeItem('faturamento-cards-config');
// Recarregar página para usar configuração padrão
```

#### **Faturas não carregam**
**Sintomas**: Tabela vazia ou loading infinito
```javascript
// Verificar conexão com API
fetch('http://localhost:3001/api/faturamento/faturas')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Verificar estado do componente
console.log('Estado carregando:', carregando);
console.log('Faturas:', faturas);
```

#### **Modal de criação não abre**
**Sintomas**: Botão "Nova Fatura" não responde
```javascript
// Verificar estado do modal
console.log('Modal aberto:', modalAberto);

// Forçar abertura
setModalAberto(true);
```

#### **Cálculos incorretos no modal**
**Sintomas**: Totais não batem com itens informados
```javascript
// Verificar função de cálculo
console.log('Itens:', formData.itens);
console.log('Totais calculados:', totais);

// Recriar item para forçar recálculo
setFormData(prev => ({ ...prev, itens: [...prev.itens] }));
```

#### **Responsividade quebrada**
**Sintomas**: Layout não se adapta em mobile/tablet
```css
/* Verificar se Tailwind está carregando */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Testar classes responsivas */
.test { @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-4; }
```

### **Validações do Sistema**
- ✅ Cliente obrigatório para criar fatura
- ✅ Mínimo de 1 item por fatura
- ✅ Valores numéricos sempre > 0
- ✅ Data de vencimento obrigatória
- ✅ Máximo de 4 cards no dashboard
- ✅ Validação de dados do localStorage
- ✅ Tratamento de erros de API

## 📈 Métricas e Performance

### **Indicadores de Performance**
- **Tempo de Carregamento**: < 2s para lista de faturas
- **Tempo de Criação**: < 1s para salvar nova fatura
- **Responsividade**: < 100ms para mudanças de layout
- **Busca**: < 500ms para filtrar resultados

### **Otimizações Implementadas**
- ✅ **Lazy Loading**: Componentes carregados sob demanda
- ✅ **Memoização**: Cálculos complexos memoizados
- ✅ **Debounce**: Busca com delay para evitar spam
- ✅ **Paginação**: Carregamento progressivo de dados
- ✅ **Cache**: Resultados de API em cache temporário

### **Monitoramento**
```typescript
// Métricas coletadas automaticamente
interface MetricasFaturamento {
  tempoCarregamento: number;        // ms para carregar lista
  numeroFaturasCriadas: number;     // quantidade por sessão
  cardsConfiguradosFrequencia: Record<string, number>; // uso por card
  errosAPI: number;                 // erros encontrados
  dispositivoMaisUsado: 'mobile' | 'tablet' | 'desktop';
}
```

## 🚀 Futuras Melhorias

### **Versão 2.0 - Planejadas**
- [ ] **Exportação Avançada**: Excel, CSV com filtros aplicados
- [ ] **Gráficos Integrados**: Charts dentro dos cards do dashboard
- [ ] **Notificações Push**: Alertas de vencimento automáticos
- [ ] **Assinatura Digital**: Integração com certificados digitais
- [ ] **Recorrência**: Faturas automáticas por período
- [ ] **Multi-moeda**: Suporte a diferentes moedas
- [ ] **Workflow**: Aprovação de faturas por múltiplos usuários

### **Versão 3.0 - Visão Futura**
- [ ] **IA/Machine Learning**: Predição de inadimplência
- [ ] **Integração Bancária**: Conciliação automática
- [ ] **API Externa**: Webhooks para sistemas terceiros
- [ ] **Mobile App**: Aplicativo nativo para gestão
- [ ] **Relatórios Avançados**: Business Intelligence integrado
- [ ] **Marketplace**: Integrações com gateways de pagamento
- [ ] **Blockchain**: Contratos inteligentes para pagamentos

### **Versão 4.0 - Inovação**
- [ ] **Realidade Aumentada**: Visualização de dados em AR
- [ ] **Assistente Virtual**: ChatBot para suporte
- [ ] **Análise Preditiva**: Projeções de fluxo de caixa
- [ ] **Integração IoT**: Sensores para automação
- [ ] **Compliance Automático**: Adequação fiscal automática

## 📞 Suporte

### **Documentação Relacionada**
- `configuracao-cards-dashboard.md` - Configuração detalhada dos cards
- `exemplos-praticos-cards.md` - Exemplos práticos de uso
- `README.md` - Índice geral da documentação

### **APIs de Teste**
```bash
# Listar faturas
GET http://localhost:3001/api/faturamento/faturas

# Criar fatura
POST http://localhost:3001/api/faturamento/faturas
Content-Type: application/json

# Gerar PDF
GET http://localhost:3001/api/faturamento/faturas/{id}/pdf
```

### **Logs e Debug**
```javascript
// Habilitar logs detalhados
localStorage.setItem('debug', 'faturamento:*');

// Verificar estado atual
window.debugFaturamento = {
  faturas,
  dashboardCards,
  carregando,
  filtros,
  modalAberto
};
```

### **Contato para Suporte**
1. Consulte esta documentação primeiro
2. Verifique a seção de troubleshooting
3. Teste em ambiente de desenvolvimento
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 7 de agosto de 2025  
**Versão**: 1.0  
**Responsável**: Equipe Frontend - Sistema ConectCRM  
**Compatibilidade**: React 18+, TypeScript 4+, Tailwind CSS 3+
