# 🚀 Guia Rápido - Admin Console

## 📍 Como Acessar

### **Opção 1: Via Menu Lateral**
1. Faça login como SuperAdmin: `admin@conectsuite.com.br` / `admin123`
2. No menu lateral, clique em **"Administrativo"**
3. Clique em **"Admin Console"**

### **Opção 2: Via URL Direta**
```
http://localhost:3000/admin/console
```

---

## 🎯 Funcionalidades Disponíveis

### **1. Dashboard Executivo (KPI Cards)**

Os 4 cards no topo mostram métricas em tempo real:

- **Empresas Ativas** (verde): Total de clientes operando normalmente
- **Trials Expirando** (amarelo): Empresas trial que vencem nos próximos 7 dias
- **Módulos Críticos** (vermelho): Módulos com uso acima de 90% do limite
- **MRR Total** (teal): Receita mensal recorrente consolidada

**Atualização**: Clique no botão "Atualizar dados" no canto superior direito.

---

### **2. Filtros e Busca**

**Buscar Empresa**:
- Digite nome, CNPJ ou email
- Resultados aparecem automaticamente

**Filtrar por Status**:
- Ativa
- Trial
- Inadimplente
- Suspensa
- Cancelada
- Inativa

**Filtrar por Plano**:
- Starter
- Professional
- Business
- Enterprise
- Custom

**Limpar Filtros**: Clique no botão "Limpar" com ícone X.

---

### **3. Tabela de Empresas**

#### **Colunas**:
| Coluna | Descrição |
|--------|-----------|
| **Empresa** | Avatar + Nome + Email |
| **CNPJ** | CNPJ da empresa ou "--" se não cadastrado |
| **Plano** | Badge azul com nome do plano |
| **Status** | Badge colorido (verde/amarelo/vermelho/cinza) |
| **Health** | Score de 0-100 (verde ≥80, amarelo 50-79, vermelho <50) |
| **Valor/Mês** | Valor mensal em R$ |
| **Último Acesso** | Data/hora do último login ou "Nunca" |
| **Ações** | Botões de ação |

#### **Ações Disponíveis**:

**Ver Detalhes** (ícone 👁️):
- Abre página completa da empresa
- Mostra usuários, módulos, histórico de planos

**Suspender** (ícone 🚫):
- Prompt para informar motivo
- Suspende acesso da empresa imediatamente
- Status muda para "Suspensa" (laranja)
- Faturamento pausado

**Reativar** (ícone ✅):
- Reativa empresa suspensa
- Status volta para "Ativa" (verde)
- Acesso restaurado

#### **Paginação**:
- Botões "Anterior" e "Próxima"
- Mostra página atual e total de páginas
- Padrão: 20 empresas por página

---

### **4. Gestão de Módulos**

#### **Como Usar**:
1. No dropdown "Selecione uma empresa", escolha a empresa desejada
2. Os módulos da empresa carregarão automaticamente

#### **Informações por Módulo**:
- **Ícone + Nome**: Identifica o módulo (CRM, Atendimento, Comercial, etc)
- **Descrição**: Breve explicação da funcionalidade
- **Uso Atual / Limite**: Ex: "45 / 100"
- **Barra de Progresso**: 
  - Verde: Uso normal (<70%)
  - Amarelo: Atenção (70-89%)
  - Vermelho: Crítico (≥90%)
- **Status**: ✓ Ativo ou ○ Inativo
- **Botão Configurar**: Abre configurações detalhadas do módulo

#### **Módulos Disponíveis**:
```
🔵 CRM - Gestão de clientes
🔵 Atendimento - Tickets e suporte
🔵 Comercial - Vendas e cotações
🔵 Financeiro - Faturas e pagamentos
🔵 Produtos - Catálogo e estoque
🔵 Configurações - Ajustes gerais
```

---

### **5. Resumo Financeiro (Billing)**

#### **Cards Financeiros**:

**MRR Consolidado** (verde):
- Total de receita mensal recorrente
- Soma de todas as empresas ativas

**Inadimplentes** (vermelho):
- Valor total em atraso
- Quantidade de empresas inadimplentes
- Requer ação imediata

**Suspensas** (laranja):
- Quantidade de empresas suspensas
- Aguardando reativação

**Trials em Risco** (amarelo):
- Empresas trial expirando nos próximos 7 dias
- Oportunidade de conversão

#### **Empresas Críticas**:
Lista das **Top 5 empresas** com problemas (inadimplentes, suspensas ou canceladas), ordenadas por valor mensal.

**Ação**: Clique em "Resolver" para ver detalhes e tomar providências.

---

## 🔐 Permissões e Segurança

### **Acesso ao Admin Console**:
✅ **Permitido**: Usuários com role='**superadmin**'  
❌ **Bloqueado**: Usuários com role='user' ou 'admin'

### **Proteção de Rotas**:
- Frontend: `protegerRotaSuperadmin()` wrapper
- Backend: `@Roles(UserRole.SUPERADMIN)` decorator

### **Usuário Padrão**:
```
Email: admin@conectsuite.com.br
Senha: admin123
Role: superadmin
```

---

## 📊 Interpretação dos Dados

### **Health Score** (0-100):
```
90-100: Excelente - Cliente saudável
80-89:  Bom - Tudo funcionando bem
70-79:  Razoável - Monitorar de perto
50-69:  Atenção - Possível churn
0-49:   Crítico - Ação imediata necessária
```

**Fatores que afetam o score**:
- Frequência de uso (último acesso)
- Módulos críticos (uso >90%)
- Status de pagamento
- Engajamento dos usuários

### **Status de Empresas**:
```
🟢 Ativa (active)         - Operando normalmente
🔵 Trial (trial)          - Período de teste
🔴 Inadimplente (past_due) - Pagamento atrasado
🟠 Suspensa (suspended)   - Acesso bloqueado
⚫ Cancelada (cancelled)  - Contrato encerrado
⚪ Inativa (inactive)     - Sem uso recente
```

---

## 🎯 Fluxos de Trabalho Comuns

### **Fluxo 1: Monitorar Saúde das Empresas**
1. Acesse o Admin Console
2. Observe os KPI cards (empresas ativas, trials, MRR)
3. Verifique a seção "Empresas Críticas"
4. Clique em "Resolver" nas empresas com problemas
5. Tome ações corretivas (reativar, entrar em contato, ajustar plano)

### **Fluxo 2: Suspender Empresa Inadimplente**
1. Use o filtro "Status" → selecione "Inadimplente"
2. Localize a empresa na tabela
3. Clique no botão 🚫 "Suspender"
4. Digite o motivo (ex: "Fatura vencida há 15 dias - 3ª tentativa de cobrança")
5. Confirme
6. Status muda para "Suspensa" automaticamente

### **Fluxo 3: Converter Trial para Pago**
1. Use o filtro "Status" → selecione "Trial"
2. Observe a coluna "Último Acesso" (engajamento)
3. Para trials expirando (KPI amarelo):
   - Clique em "Ver Detalhes"
   - Analise uso de módulos
   - Entre em contato para conversão
   - Mude o plano (botão na página de detalhes)

### **Fluxo 4: Gerenciar Módulos Críticos**
1. Observe o KPI "Módulos Críticos" (vermelho)
2. Vá para a seção "Gestão de Módulos"
3. Selecione a empresa no dropdown
4. Identifique módulos com barra vermelha (≥90% de uso)
5. Clique em "Configurar"
6. Opções:
   - Aumentar limite do módulo
   - Fazer upgrade de plano
   - Entrar em contato com cliente

---

## 🚨 Alertas e Notificações

### **Alertas Visuais no Dashboard**:
- ⚠️ **Vermelho**: Módulos críticos (≥90%), empresas críticas
- ⚠️ **Amarelo**: Trials expirando (próximos 7 dias)
- ⚠️ **Laranja**: Empresas suspensas

### **Quando Agir Imediatamente**:
1. **MRR caindo** → Investigar churn
2. **Inadimplentes crescendo** → Revisar política de cobrança
3. **Health score baixo** (<50) → Contato proativo
4. **Módulos críticos** → Prevenir estouro de limite

---

## 🔄 Atualização de Dados

### **Manual**:
Clique no botão "Atualizar dados" (ícone 🔄) no canto superior direito.

### **Automática**:
Os dados são carregados automaticamente quando:
- Você entra no Admin Console
- Você muda os filtros
- Você muda de página (paginação)
- Você seleciona uma empresa (módulos)

### **Última Sincronização**:
Veja o timestamp abaixo dos KPI cards:
```
Última sincronização: 04/12/2025 17:14:32
Monitorando 47 empresas | 3 páginas de dados
```

---

## 📈 Métricas Esperadas (Benchmark)

### **KPIs Saudáveis**:
```
Empresas Ativas:        >80% do total
Trials Expirando:       <10 por mês
Módulos Críticos:       <5% do total
MRR Total:              Crescimento mês a mês
```

### **KPIs de Atenção**:
```
Inadimplentes:          <5% da base
Suspensas:              <2% da base
Trials Expirando:       Taxa de conversão >30%
Health Score Médio:     >70 pontos
```

---

## 🛠️ Troubleshooting

### **Problema: "Nenhuma empresa encontrada"**
**Causas possíveis**:
- Filtros muito restritivos
- Sem empresas no banco de dados
- Erro de conexão com backend

**Solução**:
1. Clique em "Limpar" para resetar filtros
2. Clique em "Atualizar dados"
3. Verifique console do navegador (F12) por erros

### **Problema: "Erro ao carregar empresas"**
**Causas possíveis**:
- Backend não está rodando (porta 3001)
- Permissão negada (usuário não é superadmin)
- Erro de rede

**Solução**:
1. Verifique se backend está rodando: `netstat -ano | findstr :3001`
2. Verifique role do usuário no banco de dados
3. Abra DevTools (F12) → Network tab → veja resposta da requisição

### **Problema: Módulos não carregam**
**Causas possíveis**:
- Empresa não tem módulos cadastrados
- Empresa selecionada é inválida

**Solução**:
1. Selecione outra empresa no dropdown
2. Verifique no backend se empresa tem módulos
3. Clique em "Atualizar dados"

---

## 📞 Suporte

**Problemas técnicos**: Abrir issue no GitHub  
**Dúvidas de uso**: Consultar este guia  
**Feature requests**: Criar proposta de melhoria

---

**Última Atualização**: 04/12/2025  
**Versão**: 1.0.0  
**Autor**: Equipe ConectCRM
