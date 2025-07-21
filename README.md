# 🔥 Fênix CRM

Um sistema CRM completo, moderno e escalável, desenvolvido para ser comercializado como SaaS (Software as a Service).

## 🚀 Características Principais

- **Multi-empresa (Multi-tenant)**: Suporte a múltiplas empresas com isolamento de dados
- **Multi-idioma (i18n)**: Internacionalização completa com i18next
- **Multi-plataforma**: Web e Mobile (React Native)
- **Temas personalizáveis**: Personalização visual por cliente
- **Autenticação JWT**: Sistema seguro de autenticação
- **Módulos completos**: Vendas, Financeiro, Dashboard e muito mais

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + **TypeScript**
- **NestJS** (Framework)
- **PostgreSQL** (Banco de dados)
- **JWT** (Autenticação)
- **Docker** (Containerização)

### Frontend Web
- **React** + **TypeScript**
- **Tailwind CSS** (Estilização)
- **i18next** (Internacionalização)

### Mobile
- **React Native** (Expo)

### Ferramentas Adicionais
- **html-pdf-node** (Exportação PDF)
- **Docker Compose** (Orquestração)

### 🎨 Padrões de Design
- **Ícones**: Exclusivamente em formato SVG para máxima qualidade e personalização
- **Responsividade**: Mobile-first design
- **Acessibilidade**: Seguindo padrões WCAG 2.1

### ♿ Recursos de Acessibilidade
- **Labels ARIA**: Todos os elementos interativos possuem labels descritivos
- **Navegação por Teclado**: Suporte completo a Tab, Shift+Tab, setas e teclas de escape
- **Leitores de Tela**: Anúncios automáticos de mudanças de estado e ações
- **Contraste**: Cores atendem ao padrão WCAG AA (4.5:1)
- **Estrutura Semântica**: HTML5 com roles e landmarks apropriados
- **Estados de Loading**: Indicadores acessíveis para operações assíncronas
- **Focus Management**: Controle de foco em modais e componentes interativos

## 🎨 Sistema de Componentes Base

O Fênix CRM possui um **sistema de componentes base padronizados** para garantir consistência visual e de experiência do usuário em toda a aplicação.

### 📋 Componentes Disponíveis
- **BaseModal**: Modal padronizado com header, footer e animações
- **FormField**: Campo de formulário com label, erro e hint
- **BaseInput**: Input padronizado com validação visual
- **BaseSelect**: Select padronizado
- **BaseTextarea**: Textarea padronizado  
- **BaseButton**: Botão com variants e estados de loading
- **ThreeColumnLayout**: Layout em 3 colunas para modais complexos
- **StatusBadge**: Badge para status com cores padronizadas
- **StatusPanel**: Painel lateral para informações adicionais

### 📚 Documentação Completa
- **[Padrão de Modais](frontend-web/docs/PADRAO-MODAIS.md)**: Guia completo para criação de modais
- **[Template de Modal](frontend-web/docs/TEMPLATE-MODAL.md)**: Template pronto para uso
- **[Exemplo Prático](frontend-web/src/examples/ModalCadastroProduto.tsx)**: Modal de exemplo implementado

### ✨ Características dos Componentes
- **React Hook Form + Yup**: Validação robusta e em tempo real
- **Design Responsivo**: Mobile-first em todos os componentes
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Temas Consistentes**: Cores e estilos padronizados do Fênix CRM
- **TypeScript**: Tipagem completa para melhor DX

## 📁 Estrutura do Projeto

```
fenix-crm/
├── backend/                 # API Backend (NestJS)
│   ├── src/
│   │   ├── modules/        # Módulos da aplicação
│   │   │   ├── auth/       # Autenticação
│   │   │   ├── users/      # Usuários
│   │   │   ├── clientes/   # Clientes
│   │   │   ├── propostas/  # Propostas comerciais
│   │   │   ├── produtos/   # Catálogo de produtos
│   │   │   ├── contratos/  # Contratos
│   │   │   ├── financeiro/ # Módulo financeiro
│   │   │   └── dashboard/  # Dashboard e KPIs
│   │   ├── common/         # Utilitários comuns
│   │   ├── config/         # Configurações
│   │   └── main.ts         # Ponto de entrada
│   ├── .env                # Variáveis de ambiente
│   ├── Dockerfile          # Container do backend
│   └── docker-compose.yml  # Orquestração completa
├── frontend-web/           # Interface Web (React)
│   ├── public/             # Arquivos públicos
│   ├── src/
│   │   ├── assets/         # Recursos estáticos
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── features/       # Features por módulo
│   │   │   ├── clientes/   # Telas de clientes
│   │   │   ├── propostas/  # Telas de propostas
│   │   │   └── dashboard/  # Dashboard
│   │   ├── contexts/       # Contextos React
│   │   ├── i18n/           # Configuração de idiomas
│   │   ├── themes/         # Temas personalizáveis
│   │   └── App.tsx         # Componente principal
│   ├── Dockerfile          # Container do frontend
│   └── .env                # Variáveis de ambiente
├── mobile/                 # App Mobile (React Native)
│   ├── src/                # Código fonte mobile
│   ├── App.tsx             # Componente principal
│   └── app.json            # Configuração Expo
└── README.md               # Este arquivo
```

## 🏗️ Módulos do Sistema

### 🔐 Autenticação
- Login/logout multi-empresa
- JWT com refresh tokens
- Controle de permissões por função (RBAC)

### 👥 Clientes
- Cadastro completo de clientes
- Histórico de interações
- Segmentação e tags
- **✅ IMPLEMENTADO** - Interface completa com padrão Crevasse

### 💼 Propostas
- Criação de propostas comerciais
- Funil de vendas
- Exportação em PDF
- **✅ IMPLEMENTADO** - Sistema de gestão comercial

### 📦 Produtos
- Catálogo de produtos/serviços
- Preços dinâmicos
- Configurações por empresa
- **✅ IMPLEMENTADO** - Controle de estoque e performance

### 📋 Contratos
- Gestão de contratos
- Assinaturas digitais
- Renovações automáticas

### 💰 Financeiro
- Controle de pagamentos
- Alertas de vencimento
- Relatórios financeiros
- **✅ IMPLEMENTADO** - Contas a Receber e Contas a Pagar

## 📊 Dashboard

O dashboard implementado possui:

### 🎯 KPIs Animados
- Contador animado de vendas
- Métricas de receita em tempo real
- Indicadores de performance

### 📈 Gráficos Interativos
- Vendas por período
- Performance de vendedores
- Análise de funil

### 📋 Widgets Funcionais
- Tabela de vendas filtráveis
- Ranking de vendedores
- Sistema de alertas
- Cards de status por categoria

### 🔥 Características Avançadas
- Interface moderna e responsiva
- Animações suaves
- Filtros dinâmicos
- Dados em tempo real

## 🎯 Módulos Implementados

### 👥 **Clientes** (✅ Concluído)
- **Dashboard completo** com estatísticas de clientes
- **Sistema de busca** por nome, email e telefone
- **Filtros avançados** por status (ativo, inativo, lead, prospect)
- **Tabela responsiva** com informações detalhadas
- **Modal completo** para visualização de detalhes
- **5 clientes mock** para demonstração

### 📦 **Produtos** (✅ Concluído)
- **Dashboard de catálogo** com estatísticas de vendas
- **Controle de estoque** com alertas de nível baixo
- **Categorização** por Software, Hardware e Serviços
- **Análise financeira** com margem de lucro
- **Performance de vendas** com métricas mensais
- **5 produtos/serviços mock** com dados completos

### 💰 **Contas a Receber** (✅ Concluído)
- **Dashboard financeiro** com valores totais e pendentes
- **Filtros por status** (pendente, pago, vencido, cancelado)
- **Alertas de vencimento** com indicadores visuais
- **Sistema de pesquisa** por cliente e número da conta
- **Modal detalhado** com histórico de pagamentos
- **6 contas mock** com diferentes status

### 💸 **Contas a Pagar** (✅ Concluído)
- **Gestão de fornecedores** e pagamentos
- **Controle de vencimentos** com alertas automáticos
- **Categorização** por tipo de despesa
- **Filtros avançados** por status e período
- **Modal completo** com detalhes do fornecedor
- **5 contas de fornecedores** para demonstração

### 🎨 **Padrão de Design Crevasse Aplicado**
- **Cores consistentes** em todos os módulos
- **Componente BackToNucleus** para navegação
- **Ícones Lucide React** padronizados
- **Layout responsivo** mobile-first
- **Animações suaves** e transições

## 🐳 Executando com Docker

```bash
# Clone o repositório
git clone [URL_DO_REPO]
cd fenix-crm

# Execute o ambiente completo
docker-compose up -d

# O sistema estará disponível em:
# - Frontend: http://localhost:3900
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5433 (para evitar conflitos)
```

## 🔑 Credenciais de Acesso

### Usuários Pré-configurados

| Usuário | E-mail | Senha | Função |
|---------|--------|-------|--------|
| **Admin** | admin@fenixcrm.com | admin123 | Administrador |
| **Manager** | manager@fenixcrm.com | manager123 | Gerente |
| **Vendedor** | vendedor@fenixcrm.com | vendedor123 | Vendedor |

### Banco de Dados PostgreSQL

```
Host: localhost
Porta: 5433
Usuário: fenixcrm
Senha: fenixcrm123
Database: fenixcrm_db
```

## 🚀 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL rodando (Docker recomendado)
- Git

### Backend
```bash
cd backend
npm install

# Configurar variáveis de ambiente (.env já configurado)
# DATABASE_PORT=5433 (configurado para evitar conflitos)

npm run start:dev
# Backend rodará em http://localhost:3001
```

### Frontend Web
```bash
cd frontend-web
npm install
npm start
# Frontend rodará em http://localhost:3900
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## ✅ Status de Desenvolvimento

### ✅ Concluído
- [x] **Estrutura completa** do projeto
- [x] **Backend NestJS** com autenticação JWT
- [x] **Frontend React** compilando sem erros
- [x] **PostgreSQL** via Docker configurado
- [x] **Login funcional** com usuários pré-cadastrados
- [x] **Dashboard animado** com KPIs e gráficos
- [x] **Sistema multi-tenant** configurado
- [x] **Documentação Swagger** disponível
- [x] **Sistema de ícones SVG** personalizado
- [x] **Design responsivo** mobile-first
- [x] **Acessibilidade WCAG 2.1** implementada
  - Labels ARIA completos
  - Navegação por teclado
  - Suporte a leitores de tela
  - Estados de loading acessíveis
  - Contraste de cores adequado
  - Estrutura semântica HTML5
- [x] **Módulos CRM funcionais** implementados
  - **Clientes**: Gestão completa com filtros e busca
  - **Produtos**: Catálogo com controle de estoque e vendas
  - **Contas a Receber**: Sistema financeiro completo
  - **Contas a Pagar**: Controle de fornecedores e pagamentos
- [x] **Padrão de Design Crevasse** aplicado consistentemente
- [x] **Navegação integrada** entre módulos e núcleos
- [x] **Dependências corrigidas** e sistema compilando sem erros

### 🔄 Em Desenvolvimento
- [x] **Módulos específicos** (clientes, propostas, produtos, financeiro) - **CONCLUÍDO**
- [ ] **Testes automatizados** (cobertura 80%)
- [ ] **Widgets avançados** do dashboard
- [ ] **Módulos adicionais** (contratos, configurações)
- [ ] Mobile React Native (estrutura criada)
- [ ] Docker Compose completo

## � Acesso ao Sistema

### URLs Principais

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3900 | Interface principal do usuário |
| **Backend API** | http://localhost:3001 | API REST do sistema |
| **Swagger Docs** | http://localhost:3001/api-docs | Documentação interativa da API |
| **PostgreSQL** | localhost:5433 | Banco de dados |

### 🎮 Como Usar

1. **Acesse o frontend**: http://localhost:3900
2. **Faça login** com qualquer credencial da tabela acima
3. **Explore o dashboard** com gráficos e KPIs
4. **Teste a API** através do Swagger: http://localhost:3001/api-docs

## �🌍 Configuração Multi-idioma

O sistema suporta múltiplos idiomas através do i18next:
- Português (pt-BR) - Padrão
- Inglês (en-US)
- Espanhol (es-ES)

## 🎨 Personalização de Temas

Cada empresa cliente pode personalizar:
- Cores primárias e secundárias
- Logo da empresa
- Fontes customizadas
- Layout preferences

## 📐 Padrões de Desenvolvimento

### 🎨 Design System
- **Ícones**: Usar exclusivamente formato SVG
  - Escalabilidade perfeita em qualquer resolução
  - Customização total de cores via CSS
  - Performance superior (não requer bibliotecas externas)
  - Controle completo sobre animações e interações

### 🖌️ UI/UX Guidelines
- **Consistência Visual**: Manter padrão de cores, espaçamentos e tipografia
- **Responsividade**: Design mobile-first obrigatório
- **Acessibilidade**: Seguir padrões WCAG 2.1
- **Performance**: Otimizar imagens e assets

### 🔧 Convenções Técnicas
- **TypeScript**: Tipagem estrita obrigatória
- **Componentes**: Reutilização máxima via design system
- **Estados**: Loading, error e empty states em todos os componentes
- **Testes**: Cobertura mínima de 80%

## 📝 Licença

Este projeto é proprietário e destinado à comercialização como SaaS.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para revolucionar a gestão de relacionamento com clientes.
