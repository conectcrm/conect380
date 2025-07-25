# 📋 Guia Completo - Como Utilizar a Tela de Gestão de Empresas

## 🎯 **Visão Geral**

A tela de **Gestão de Empresas** é um módulo administrativo que permite monitorar, gerenciar e controlar todas as empresas cadastradas no sistema. É ideal para administradores que precisam ter visibilidade completa sobre os clientes corporativos.

---

## 🚀 **Como Acessar**

### **Método 1: Via Navegação Principal**
1. **Acesse o Dashboard** (`/dashboard`)
2. **Clique no card "Sistema"** (cor roxa, 4 notificações)
3. **Selecione "Gestão de Empresas"** (ícone 🏢)

### **Método 2: URL Direta**
```
http://localhost:3000/admin/empresas
```

---

## 📊 **Área de Métricas (Dashboard Superior)**

### **O que você verá:**
- **Total de Empresas**: Número total cadastradas no sistema
- **Receita Mensal**: Soma dos valores mensais das empresas ativas
- **Total de Usuários**: Quantidade de usuários em todas as empresas
- **Empresas Ativas**: Quantas estão com status "Ativa"

### **Como interpretar:**
- **Indicadores de Crescimento**: Setas verdes (📈) ou vermelhas (📉)
- **Cores dos Cards**:
  - 🔵 **Azul-verde**: Total de empresas
  - 🟢 **Verde**: Receita mensal
  - 🔵 **Azul**: Total de usuários
  - 🟡 **Amarelo**: Empresas ativas

### **Quando usar:**
- **Reuniões executivas**: Para apresentar números gerais
- **Monitoramento diário**: Verificar crescimento da receita
- **Planejamento**: Entender capacidade atual do sistema

---

## 🔍 **Sistema de Filtros**

### **Filtros Disponíveis:**

#### **1. Busca Textual**
- **Onde**: Campo de busca no topo
- **O que busca**: Nome da empresa, CNPJ, email
- **Como usar**: Digite qualquer parte do texto e pressione Enter
- **Exemplo**: "Tech", "12.345.678", "contato@empresa.com"

#### **2. Filtros por Status**
- **Ativa** 🟢: Empresas em operação normal
- **Trial** 🔵: Em período de teste
- **Suspensa** 🟡: Temporariamente desabilitada
- **Inativa** 🔴: Cancelada ou desativada

#### **3. Filtros por Plano**
- **Starter**: Plano básico
- **Professional**: Plano intermediário
- **Enterprise**: Plano completo

#### **4. Filtros Avançados**
- **Data de Cadastro**: Período específico
- **Valor Mensal**: Faixa de preços
- **Data de Expiração**: Empresas expirando

### **Filtros Rápidos Pré-configurados:**
- **"Empresas Ativas"**: Status = Ativa
- **"Trial Expirando"**: Trial + expirando em 7 dias
- **"Receita Alta"**: Valor > R$ 500/mês
- **"Novas Empresas"**: Cadastradas nos últimos 30 dias

### **Como usar os filtros:**
1. **Clique no ícone de filtro** 🔍
2. **Selecione os critérios desejados**
3. **Clique em "Aplicar Filtros"**
4. **Para limpar**: Clique em "Limpar Filtros"

---

## 📋 **Cards de Empresas**

### **Informações Exibidas:**

#### **Cabeçalho do Card:**
- **Nome da Empresa**: Título principal
- **Status Visual**: Badge colorido (Ativa, Trial, etc.)
- **Plano Contratado**: Badge do plano

#### **Dados Principais:**
- **CNPJ**: Documento da empresa
- **Email**: Contato principal
- **Usuários Ativos**: Quantos usuários estão usando o sistema
- **Clientes Cadastrados**: Quantos clientes a empresa tem

#### **Informações Temporais:**
- **Último Acesso**: Quando alguém da empresa acessou por último
- **Data de Expiração**: Quando o plano expira
- **Valor Mensal**: Quanto a empresa paga (se aplicável)

#### **Alertas Visuais:**
- **🚨 Expirando em Breve**: Borda vermelha se expira em 7 dias
- **⚠️ Trial**: Badge azul para empresas em teste
- **❌ Inativa**: Tom acinzentado para empresas desativadas

---

## 🎯 **Casos de Uso Práticos**

### **1. Monitoramento Diário (5 min/dia)**
```
✅ Verificar métricas gerais
✅ Identificar empresas expirando (filtro rápido)
✅ Revisar novas empresas cadastradas
✅ Monitorar receita total
```

### **2. Gestão de Cobrança (Semanal)**
```
✅ Filtrar por "Trial Expirando"
✅ Identificar empresas com valor alto não pagas
✅ Verificar empresas suspensas
✅ Acompanhar conversão Trial → Pago
```

### **3. Análise de Crescimento (Mensal)**
```
✅ Comparar métricas com mês anterior
✅ Analisar distribuição por planos
✅ Identificar empresas com mais usuários
✅ Revisar empresas inativas para reativação
```

### **4. Suporte ao Cliente**
```
✅ Buscar empresa por CNPJ/nome
✅ Verificar status e plano atual
✅ Conferir último acesso
✅ Validar data de expiração
```

### **5. Reuniões Comerciais**
```
✅ Apresentar números de crescimento
✅ Mostrar receita mensal total
✅ Demonstrar base de empresas ativas
✅ Identificar oportunidades de upsell
```

---

## 📱 **Interface Responsiva**

### **No Desktop:**
- **Grid 3-4 colunas**: Máxima visibilidade
- **Filtros sempre visíveis**: Lateral esquerda
- **Dashboard completo**: Todas as métricas
- **Hover effects**: Interações suaves

### **No Tablet:**
- **Grid 2 colunas**: Otimizado para tela média
- **Filtros colapsáveis**: Sidebar retrátil
- **Métricas em grid 2x2**: Compactas mas legíveis

### **No Mobile:**
- **Cards empilhados**: Full-width vertical
- **Filtros em modal**: Drawer que abre por cima
- **Métricas em carrossel**: Deslizar horizontal
- **Menu hambúrguer**: Navegação otimizada

---

## ⚡ **Dicas de Performance**

### **Para Grandes Volumes:**
- **Use filtros específicos**: Evite listar todas as empresas
- **Busca textual inteligente**: Digite pelo menos 3 caracteres
- **Paginação automática**: Sistema carrega apenas o necessário

### **Navegação Eficiente:**
- **Filtros rápidos**: Use os pré-configurados
- **Atalhos de teclado**: Ctrl+F para busca rápida
- **URLs diretas**: Marque filtros úteis nos favoritos

---

## 🔄 **Fluxos de Trabalho Sugeridos**

### **Fluxo 1: Verificação Matinal (Admin)**
```
1. Acessar Dashboard → Sistema → Gestão de Empresas
2. Verificar métricas gerais (crescimento da receita)
3. Aplicar filtro "Trial Expirando"
4. Revisar empresas que precisam de atenção
5. Aplicar filtro "Novas Empresas"
6. Verificar cadastros recentes
```

### **Fluxo 2: Suporte a Cliente**
```
1. Cliente liga com problema
2. Buscar por nome/CNPJ na busca textual
3. Verificar status e último acesso
4. Confirmar plano e data de expiração
5. Prestar suporte baseado no contexto
```

### **Fluxo 3: Análise Comercial**
```
1. Filtrar por "Receita Alta" (Enterprise)
2. Identificar empresas com muitos usuários
3. Filtrar por "Trial" para oportunidades
4. Analisar empresas "Suspensas" para recuperação
5. Gerar relatório de crescimento
```

### **Fluxo 4: Controle Financeiro**
```
1. Verificar receita mensal total
2. Filtrar empresas por valor mensal
3. Identificar inadimplentes (suspensas)
4. Monitorar conversão trial → pago
5. Acompanhar cancelamentos (inativas)
```

---

## 🎯 **Próximas Funcionalidades (Roadmap)**

### **Em Desenvolvimento:**
- **Modal de Detalhes**: Clique no card para mais informações
- **Edição Inline**: Alterar planos e status diretamente
- **Histórico de Atividades**: Timeline de mudanças
- **Exportação de Dados**: Excel/PDF dos relatórios

### **Planejadas:**
- **Alertas Automáticos**: Notificações de expiração
- **Gráficos Avançados**: Charts de crescimento
- **API Completa**: Integração com outros sistemas
- **Relatórios Customizados**: Dashboard personalizável

---

## ❓ **Perguntas Frequentes**

### **P: Os dados são atualizados em tempo real?**
R: Sim, as métricas são calculadas dinamicamente baseadas nos dados atuais das empresas.

### **P: Posso exportar os dados filtrados?**
R: Atualmente não, mas está no roadmap para as próximas versões.

### **P: Como funciona o cálculo da receita mensal?**
R: Soma todos os valores mensais das empresas com status "Ativa".

### **P: Posso editar informações das empresas?**
R: Atualmente é apenas visualização, mas a edição está sendo desenvolvida.

### **P: Os filtros são salvos entre sessões?**
R: Não atualmente, mas você pode usar URLs diretas para filtros específicos.

---

## 🏁 **Resumo de Utilização**

A tela de **Gestão de Empresas** é sua central de comando para:

✅ **Monitorar** a saúde financeira (receita mensal)
✅ **Acompanhar** o crescimento (novas empresas)
✅ **Identificar** oportunidades (trials expirando)
✅ **Gerenciar** problemas (empresas suspensas)
✅ **Analisar** performance (métricas de usuários)

**Acesso rápido**: Dashboard → Sistema → Gestão de Empresas
**Frequência recomendada**: Diário para admins, sob demanda para suporte
**Foco principal**: Monitoramento proativo e gestão estratégica de clientes corporativos

---

*💡 **Dica Final**: Use esta tela como seu "painel de controle" principal para decisões estratégicas sobre a base de clientes corporativos. As métricas em tempo real ajudam a identificar tendências e oportunidades rapidamente.*
