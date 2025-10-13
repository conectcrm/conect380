# 📊 Configuração de Cards do Dashboard - Faturamento

## 📋 Visão Geral

O sistema de faturamento possui uma funcionalidade avançada de configuração de cards no dashboard que permite aos usuários personalizar quais métricas desejam visualizar na tela principal. Esta funcionalidade oferece flexibilidade total na escolha e organização dos indicadores mais importantes para cada usuário.

## ⭐ Características Principais

### 🎯 **Flexibilidade de Seleção**
- **Quantidade**: De 1 a 4 cards podem ser selecionados
- **Personalização**: Cada usuário pode escolher seus próprios cards
- **Persistência**: Configurações são salvas automaticamente no navegador

### 📱 **Responsividade Inteligente**
- **Grid Adaptativo**: Layout se ajusta automaticamente ao número de cards selecionados
- **Multi-dispositivo**: Otimizado para desktop, tablet e mobile
- **Escalabilidade Visual**: Cards ajustam tamanho baseado na quantidade selecionada

## 🔧 Como Configurar

### 1. **Acessar a Configuração**
1. Navegue até a página de **Faturamento**
2. Clique no botão **"Configurar Cards"** (ícone de engrenagem)
3. O modal de configuração será aberto

### 2. **Selecionar Cards**
1. **Visualizar Cards Disponíveis**: 6 opções de métricas diferentes
2. **Clicar para Selecionar**: Cards selecionados ficam destacados em azul
3. **Ordem Numérica**: Números indicam a ordem de seleção (1, 2, 3, 4)
4. **Preview em Tempo Real**: Visualize como ficará o layout

### 3. **Salvar Configuração**
1. **Validação Automática**: Sistema valida se há entre 1-4 cards selecionados
2. **Clicar em "Salvar Configuração"**
3. **Aplicação Imediata**: Cards são reorganizados automaticamente

## 📊 Cards Disponíveis

| Card | Descrição | Métrica | Cor |
|------|-----------|---------|-----|
| **Total de Faturas** | Quantidade total de faturas no sistema | Número inteiro | Azul |
| **Faturas Pagas** | Quantidade de faturas com status "Paga" | Número inteiro | Verde |
| **Faturas Vencidas** | Quantidade de faturas em atraso | Número inteiro | Vermelho |
| **Valor Pendente** | Valor total a receber | Moeda (R$) | Laranja |
| **Valor Recebido** | Valor total já recebido | Moeda (R$) | Verde |
| **Faturas do Mês** | Faturas criadas no mês atual | Número inteiro | Roxo |

## 🎨 Layouts Responsivos

### **1 Card Selecionado**
```css
Layout: Centralizado
Grid: grid-cols-1 max-w-md mx-auto
Tamanho: Maior (padding p-8, texto text-4xl, ícone w-10 h-10)
Uso: Foco em uma única métrica principal
```

### **2 Cards Selecionados**
```css
Layout: Dois cards lado a lado
Grid: grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto
Tamanho: Grande (padding p-7, texto text-4xl, ícone w-10 h-10)
Uso: Comparação entre duas métricas importantes
```

### **3 Cards Selecionados**
```css
Layout: Três cards distribuídos
Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Tamanho: Padrão (padding p-6, texto text-3xl, ícone w-8 h-8)
Uso: Visão balanceada de múltiplas métricas
```

### **4 Cards Selecionados**
```css
Layout: Quatro cards em grid completo
Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
Tamanho: Padrão (padding p-6, texto text-3xl, ícone w-8 h-8)
Uso: Dashboard completo com máxima informação
```

## 💾 Persistência de Dados

### **Local Storage**
- **Chave**: `faturamento-cards-config`
- **Formato**: Array JSON com IDs dos cards selecionados
- **Exemplo**: `["totalFaturas", "valorTotalPendente", "valorTotalPago", "faturasDoMes"]`

### **Carregamento Automático**
- Configurações são carregadas automaticamente ao acessar a página
- Fallback para configuração padrão se não houver dados salvos
- Validação de integridade dos dados salvos

## 🛠️ Arquitetura Técnica

### **Componentes Principais**

#### **1. FaturamentoPage.tsx**
```typescript
// Estados principais
const [cardsConfigurados, setCardsConfigurados] = useState<string[]>([...]);
const [modalConfigurarCardsAberto, setModalConfigurarCardsAberto] = useState(false);

// Funções utilitárias
const obterClasseGrid = (numeroCards: number): string => { ... };
const obterClassesCard = (numeroCards: number): string => { ... };
const salvarConfiguracaoCards = (novaConfiguracao: string[]) => { ... };
```

#### **2. ModalConfigurarCards.tsx**
```typescript
interface CardConfig {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  description: string;
  isActive: boolean;
}
```

### **Fluxo de Dados**
1. **Carregamento**: localStorage → useState
2. **Seleção**: Modal → Estado temporário
3. **Salvamento**: Validação → localStorage → Estado principal
4. **Renderização**: Estado → Grid responsivo → Cards visuais

## 🎯 Casos de Uso Recomendados

### **1 Card - Foco Executivo**
- **Ideal para**: CEOs, diretores
- **Métrica sugerida**: Valor Recebido
- **Benefício**: Visão clara do principal KPI

### **2 Cards - Comparação Estratégica**
- **Ideal para**: Gerentes financeiros
- **Métricas sugeridas**: Valor Pendente + Valor Recebido
- **Benefício**: Comparação direta entre entradas e saídas

### **3 Cards - Visão Balanceada**
- **Ideal para**: Analistas financeiros
- **Métricas sugeridas**: Total de Faturas + Valor Pendente + Faturas Vencidas
- **Benefício**: Visão equilibrada de volume e urgências

### **4 Cards - Dashboard Completo**
- **Ideal para**: Operadores, assistentes
- **Métricas sugeridas**: Todas as principais
- **Benefício**: Visão completa para operação diária

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **Cards não salvam a configuração**
- **Causa**: Problemas no localStorage
- **Solução**: Verificar se o navegador permite armazenamento local
- **Comando**: `localStorage.getItem('faturamento-cards-config')`

#### **Layout quebrado em mobile**
- **Causa**: Classes CSS não carregadas
- **Solução**: Verificar se o Tailwind CSS está funcionando
- **Teste**: Inspecionar elementos e verificar classes aplicadas

#### **Modal não abre**
- **Causa**: Estado não atualizado
- **Solução**: Verificar se `setModalConfigurarCardsAberto(true)` está sendo chamado
- **Debug**: Console.log do estado do modal

### **Validações do Sistema**
- ✅ Mínimo de 1 card selecionado
- ✅ Máximo de 4 cards selecionados
- ✅ Validação de dados do localStorage
- ✅ Fallback para configuração padrão
- ✅ Responsividade em todos os tamanhos de tela

## 📈 Métricas e Analytics

### **Dados Calculados em Tempo Real**
- **Total de Faturas**: `COUNT(*) FROM faturas`
- **Faturas Pagas**: `COUNT(*) FROM faturas WHERE status = 'PAGA'`
- **Faturas Vencidas**: `COUNT(*) FROM faturas WHERE status != 'PAGA' AND data_vencimento < NOW()`
- **Valor Pendente**: `SUM(valor_total) FROM faturas WHERE status != 'PAGA' AND status != 'CANCELADA'`
- **Valor Recebido**: `SUM(valor_total) FROM faturas WHERE status = 'PAGA'`
- **Faturas do Mês**: `COUNT(*) FROM faturas WHERE MONTH(data_emissao) = MONTH(NOW())`

## 🚀 Futuras Melhorias

### **Versão 2.0 - Planejadas**
- [ ] **Drag & Drop**: Reordenar cards arrastando
- [ ] **Filtros Temporais**: Cards por período (semana, mês, ano)
- [ ] **Cards Customizados**: Criar métricas personalizadas
- [ ] **Exportação**: Salvar configurações em arquivo
- [ ] **Temas**: Cores personalizadas para os cards
- [ ] **Alertas**: Notificações baseadas nos valores dos cards

### **Versão 3.0 - Visão Futura**
- [ ] **Gráficos Integrados**: Micro-gráficos dentro dos cards
- [ ] **Comparação Temporal**: Variação percentual vs período anterior
- [ ] **Metas**: Definir objetivos para cada métrica
- [ ] **Dashboard Compartilhado**: Salvar configurações por perfil de usuário

## 📞 Suporte

Para dúvidas sobre a configuração de cards:
1. Consulte esta documentação
2. Teste as configurações no ambiente de desenvolvimento
3. Verifique os logs do console em caso de erros
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 7 de agosto de 2025  
**Versão**: 1.0  
**Responsável**: Equipe Frontend - Sistema ConectCRM
