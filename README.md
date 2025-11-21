# 🚀 ConectSuite - Sistema CRM Omnichannel

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

**Sistema CRM Multi-tenant com WhatsApp, Triagem Inteligente e Atendimento Omnichannel**

[Documentação](#-documentação) •
[Instalação](#-instalação) •
[Stack](#-stack-tecnológico) •
[Features](#-funcionalidades) •
[Deploy](#-deploy)

</div>

---

## 📋 Sobre o Projeto

ConectSuite é um **sistema CRM completo** desenvolvido para gestão profissional de atendimento ao cliente, com foco em:

- 💬 **Atendimento em tempo real** via WhatsApp Business API
- 🤖 **Triagem inteligente** com IA (Anthropic Claude)
- 🏢 **Multi-tenant** com isolamento total de dados (RLS)
- 📊 **Gestão comercial e financeira** integrada
- 🎨 **Interface moderna** e responsiva

---

## ✨ Funcionalidades

### 💬 Atendimento Omnichannel

- **Chat em tempo real** com WebSocket
- **Integração WhatsApp Business API** nativa
- **Player de áudio** para mensagens de voz
- **Gestão de tickets** com atribuições automáticas
- **Status online/offline** dos atendentes
- **Transferência de atendimentos** entre agentes
- **Foto de perfil** dos contatos (sincronizada com WhatsApp)
- **🆕 Sistema de Filas Inteligente**
  - 3 estratégias de distribuição (Round-Robin, Menor Carga, Por Prioridade)
  - Auto-distribuição configurável
  - Gestão de capacidade por atendente
  - Métricas em tempo real
  - Integração visual no ChatOmnichannel
- **🆕 Fechamento automático por inatividade** (configurável por empresa)
  - Timeout personalizável (minutos/horas/dias)
  - Aviso antes de fechar (opcional)
  - Mensagens customizáveis
  - Filtro por status (AGUARDANDO, EM_ATENDIMENTO)
  - Monitoramento automático a cada 5 minutos

### 🤖 Triagem Inteligente com IA

- **Bot conversacional** configurável
- **Editor visual de fluxos** (drag & drop)
- **7 tipos de blocos**:
  - 🎯 Menu (opções interativas)
  - 💬 Mensagem (texto/mídia)
  - ❓ Pergunta (coleta de dados)
  - 🔀 Condição (lógica IF/ELSE)
  - ⚡ Ação (webhook/integração)
  - 🏁 Início/Fim
- **Integração IA** (Anthropic Claude) para respostas contextuais
- **Versionamento de fluxos** com histórico
- **Preview WhatsApp** em tempo real
- **Sistema de logs** completo

### 🏢 Gestão de Estrutura

- **Núcleos de atendimento** dinâmicos
- **Departamentos** com drag & drop
- **Equipes e atribuições** complexas
- **Matriz de atribuições** (Atendente ↔ Equipe ↔ Núcleo)
- **Gestão de atendentes** com permissões

### 📊 Comercial

- Gestão de **clientes e contatos**
- **Cotações e propostas**
- **Oportunidades** com pipeline visual (Kanban)
- **Produtos e fornecedores**
- Funil de vendas

### 💰 Financeiro

- Gestão de **faturas**
- Integração **Stripe** para pagamentos
- Controle de recebimentos
- Relatórios financeiros

---

## 🛠️ Stack Tecnológico

### Backend

```typescript
NestJS (Framework)
TypeScript (Linguagem)
PostgreSQL (Banco de dados)
TypeORM (ORM)
Redis (Cache)
WebSocket (Tempo real)
class-validator (Validações)
JWT (Autenticação)
```

### Frontend

```typescript
React (Framework)
TypeScript (Linguagem)
Tailwind CSS (Estilização)
React Flow (Editor visual)
Axios (HTTP client)
Lucide React (Ícones)
```

### Infraestrutura

```yaml
Docker & Docker Compose
Nginx (Proxy reverso)
AWS EC2 (Compute)
AWS RDS (PostgreSQL)
AWS ElastiCache (Redis)
Let's Encrypt (SSL/HTTPS)
```

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ e npm
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (opcional)

### 1. Clone o Repositório

```bash
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite
```

### 2. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Executar migrations
npm run migration:run

# Iniciar em desenvolvimento
npm run start:dev
```

**Portas**:
- Backend: `http://localhost:3001`
- WebSocket: `ws://localhost:3001`

### 3. Frontend

```bash
cd frontend-web

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# REACT_APP_API_URL=http://localhost:3001

# Iniciar em desenvolvimento
npm start
```

**Portas**:
- Frontend: `http://localhost:3000`

---

## 🐳 Deploy com Docker

### Desenvolvimento

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Produção (AWS)

```bash
cd .production

# Build das imagens
./scripts/build-all.ps1

# Deploy completo
./scripts/deploy-aws.ps1
```

Consulte [DEPLOY.md](.production/DEPLOY.md) para detalhes.

---

## 📊 Migrations

O sistema possui **11 migrations** implementadas:

```bash
# Ver migrations
npm run migration:show

# Criar nova migration
npm run migration:generate -- src/migrations/NomeMigration

# Executar migrations
npm run migration:run

# Reverter última migration
npm run migration:revert
```

**Migrations Principais**:
1. `CreateDepartamentos` - Estrutura de departamentos
2. `CreateTriagemLogsTable` - Logs de triagem
3. `EnableRowLevelSecurity` - Isolamento multi-tenant (RLS)
4. `CreateTriagemBotNucleosTables` - Sistema de triagem
5. `CreateEquipesAtribuicoesTables` - Equipes e atribuições
6. `AddHistoricoVersoesFluxo` - Versionamento de fluxos

---

## 🔐 Autenticação e Segurança

### Multi-tenancy com RLS

Sistema **100% isolado** por empresa:

```sql
-- Row Level Security (RLS) no PostgreSQL
CREATE POLICY isolamento_empresa ON tabela
  USING (empresa_id = current_setting('app.current_empresa_id')::uuid);
```

### JWT Authentication

```typescript
// Headers obrigatórios
{
  "Authorization": "Bearer <token>",
  "x-empresa-id": "<uuid-empresa>"
}
```

### Variáveis de Ambiente Críticas

```bash
# JWT
JWT_SECRET=sua_chave_super_secreta_aqui
JWT_EXPIRATION=7d

# WhatsApp
WHATSAPP_API_KEY=sua_chave_whatsapp
WHATSAPP_PHONE_NUMBER_ID=seu_numero_id

# IA
ANTHROPIC_API_KEY=sk-ant-api03-...

# Database
DATABASE_PASSWORD=senha_forte
```

⚠️ **NUNCA** commite o arquivo `.env`!

---

## 🧪 Testes

### Backend

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend

```bash
# Testes com Jest
npm test

# Testes e2e (Cypress)
npm run cypress:open
```

---

## 📚 Documentação

### Guias Principais

- [CONTRIBUTING.md](CONTRIBUTING.md) - Como contribuir
- [DESIGN_GUIDELINES.md](frontend-web/DESIGN_GUIDELINES.md) - Design system
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - GitHub Copilot config

### Guias Técnicos

- [GUIA_GESTAO_NUCLEOS_WHATSAPP.md](GUIA_GESTAO_NUCLEOS_WHATSAPP.md) - Gestão de núcleos
- [GUIA_CRIAR_FLUXO_WHATSAPP.md](GUIA_CRIAR_FLUXO_WHATSAPP.md) - Criar fluxos
- [MANUAL_CONSTRUTOR_VISUAL.md](MANUAL_CONSTRUTOR_VISUAL.md) - Editor visual
- [GUIA_TOKEN_WHATSAPP.md](GUIA_TOKEN_WHATSAPP.md) - Configurar WhatsApp
- [QUICKSTART_TESTE_INATIVIDADE.md](QUICKSTART_TESTE_INATIVIDADE.md) - 🆕 Teste de fechamento automático

### Sistema de Fechamento Automático

- [CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md](CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md) - Arquitetura completa
- [TESTE_FECHAMENTO_AUTOMATICO.md](TESTE_FECHAMENTO_AUTOMATICO.md) - Guia detalhado de testes
- [STATUS_FECHAMENTO_AUTOMATICO.md](STATUS_FECHAMENTO_AUTOMATICO.md) - Status da implementação
- [scripts/test-inactivity-system.ps1](scripts/test-inactivity-system.ps1) - Script automatizado de teste
- [scripts/test-inactivity-queries.sql](scripts/test-inactivity-queries.sql) - Queries SQL úteis

### Referências

- 📊 [ANALISE_MODULOS_SISTEMA.md](ANALISE_MODULOS_SISTEMA.md) - Arquitetura
- 🏗️ [CONSOLIDACAO_*.md](.) - Histórico de implementações
- 📝 [docs/](docs/) - Documentação técnica completa

---

## 🎯 Roadmap

### ✅ Versão 1.0 (Atual)

- [x] Sistema multi-tenant com RLS
- [x] Chat omnichannel WhatsApp
- [x] Triagem inteligente com IA
- [x] Editor visual de fluxos
- [x] Gestão de equipes e atribuições
- [x] Dashboard analytics
- [x] Deploy AWS produção

### 🚧 Versão 1.1 (Q1 2025)

- [ ] Integração Telegram
- [ ] Integração Instagram Direct
- [ ] Relatórios avançados (Power BI)
- [ ] App mobile (React Native)
- [ ] API pública (RESTful)

### 🔮 Versão 2.0 (Q2 2025)

- [ ] IA preditiva para vendas
- [ ] Automação de marketing
- [ ] Integrações ERP (SAP, Totvs)
- [ ] Suporte multi-idioma (i18n)

---

## 📚 Documentação Completa

### 🆘 Começando

- **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** - Guia completo de resolução de problemas
  - 30+ problemas comuns com soluções passo a passo
  - Diagnóstico, causas e múltiplas opções de solução
  - Comandos prontos para copiar e executar
  - Seções: Crítico, Auth, Chat, WebSocket, WhatsApp, DB, Docker, Performance

- **[ROADMAP_MELHORIAS.md](ROADMAP_MELHORIAS.md)** - Planejamento de melhorias futuras
  - 47 melhorias identificadas e priorizadas
  - Organizado por: Segurança, Performance, Features, Docs
  - Sugestão de sprints para implementação
  - Métricas de progresso por categoria

### 🎨 Desenvolvimento Frontend

- **[frontend-web/DESIGN_GUIDELINES.md](frontend-web/DESIGN_GUIDELINES.md)** - Guia de design system
  - Tema Crevasse Professional (5 cores oficiais)
  - Componentes prontos copy-paste
  - Padrões de UI/UX obrigatórios

- **[frontend-web/TEMPLATES_GUIDE.md](frontend-web/TEMPLATES_GUIDE.md)** - Sistema de templates
  - Template SIMPLES (sem KPIs) para CRUD básico
  - Template COM KPIs (com métricas) para dashboards
  - Fluxo de decisão: qual template usar?

- **[frontend-web/COMPONENTS_GUIDE.md](frontend-web/COMPONENTS_GUIDE.md)** - Biblioteca de componentes
  - 50+ componentes prontos
  - 13 tipos de componentes documentados
  - Código copy-paste com tema Crevasse

### 🔧 Desenvolvimento Backend

- **[STATUS_BACKEND_ATENDIMENTO.md](STATUS_BACKEND_ATENDIMENTO.md)** - Status do módulo de atendimento
- **[BACKEND_INTEGRATION_README.md](BACKEND_INTEGRATION_README.md)** - Integração com APIs
- **[docs/relatorio-vulnerabilidades.md](docs/relatorio-vulnerabilidades.md)** - Segurança

### 🚀 Deploy e Produção

- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - Checklist de produção
- **[SPRINT_1_COMPLETO_MULTITENANT.md](SPRINT_1_COMPLETO_MULTITENANT.md)** - Deploy AWS EC2
- **[docs/RELATORIO_FINAL.md](docs/RELATORIO_FINAL.md)** - Lições aprendidas

### 📖 Documentação de Features

- **[SISTEMA_WHATSAPP_CONCLUIDO.md](SISTEMA_WHATSAPP_CONCLUIDO.md)** - Integração WhatsApp
- **[CHAT_REALTIME_README.md](CHAT_REALTIME_README.md)** - WebSocket e tempo real
- **[CONSOLIDACAO_CONSTRUTOR_VISUAL.md](CONSOLIDACAO_CONSTRUTOR_VISUAL.md)** - Editor de fluxos
- **[MISSAO_CUMPRIDA_ATENDIMENTO.md](MISSAO_CUMPRIDA_ATENDIMENTO.md)** - Sistema de atendimento completo

### 🧪 Testes

- **[frontend-web/tests/theme-validation.test.ts](frontend-web/tests/theme-validation.test.ts)** - Testes de tema
- **[backend/test/isolamento-multi-tenant.e2e-spec.ts](backend/test/isolamento-multi-tenant.e2e-spec.ts)** - Testes E2E

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'feat(modulo): descrição'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre:
- Padrões de commit (Conventional Commits)
- Code style (ESLint, Prettier)
- Processo de revisão

**📖 Antes de contribuir**:
- Leia [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) se encontrar problemas
- Consulte [ROADMAP_MELHORIAS.md](ROADMAP_MELHORIAS.md) para ver melhorias planejadas
- Verifique [frontend-web/DESIGN_GUIDELINES.md](frontend-web/DESIGN_GUIDELINES.md) para padrões de UI

---

## 📊 Status do Projeto

![GitHub last commit](https://img.shields.io/github/last-commit/Dhonleno/conectsuite)
![GitHub issues](https://img.shields.io/github/issues/Dhonleno/conectsuite)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Dhonleno/conectsuite)

**Branch principal**: `consolidacao-atendimento`

**Últimas atualizações**:
- ✅ Commit inicial completo (490 arquivos, 122k linhas)
- ✅ Sistema 100% funcional em produção
- ✅ Documentação completa (190+ arquivos .md)
- ✅ CI/CD configurado
- ✅ Docker + AWS deploy ready

---

## 📄 Licença

Este é um projeto **privado** desenvolvido para uso interno.

**© 2025 ConectSuite. Todos os direitos reservados.**

---

## 👥 Equipe

Desenvolvido com ❤️ por profissionais dedicados à excelência em atendimento ao cliente.

---

## 📞 Suporte

Para dúvidas ou suporte:

- 📧 Email: suporte@conectsuite.com
- 📖 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/Dhonleno/conectsuite/issues)

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela! ⭐**

[⬆ Voltar ao topo](#-conectsuite---sistema-crm-omnichannel)

</div>
