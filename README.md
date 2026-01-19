# 🚀 Conect360 - Suite All-in-One para PMEs

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

**Suite CRM Multi-tenant que integra CRM, Vendas, Atendimento (Omnichannel) e Gestão Financeira**

> Escopo: o Conect360 é uma **suite all-in-one** (CRM, Vendas, Financeiro, Contratos, etc.).
> **Atendimento (Omnichannel)** é um dos módulos — não o produto inteiro.
>
> Comece por: [VISAO_SISTEMA_2025.md](VISAO_SISTEMA_2025.md) e [docs/INDICE_DOCUMENTACAO.md](docs/INDICE_DOCUMENTACAO.md)

[Visão do Sistema](VISAO_SISTEMA_2025.md) •
[Documentação](#-documentação) •
[Instalação](#-instalação) •
[Stack](#-stack-tecnológico) •
[Deploy](#-deploy-com-docker)

</div>

---

## 📋 Sobre o Projeto

Conect360 é uma **suite CRM all-in-one** desenvolvida para PMEs brasileiras, que integra nativamente:

- 🎯 **CRM & Pipeline de Vendas** - Oportunidades, propostas, forecast
- 💬 **Atendimento (Omnichannel)** - WhatsApp, Email, Chat em tempo real
- 💰 **Gestão Financeira** - Faturas, cobranças, Mercado Pago integrado
- 📄 **Contratos** - Geração automática, templates, assinaturas
- 🤖 **Bot de Triagem Inteligente** - IA (Anthropic Claude) para classificação
- 🏢 **Multi-tenant** - Isolamento total de dados (RLS)
- 📊 **Analytics** - Dashboards, relatórios, métricas de vendas e atendimento

### 💡 Por que Conect360?

**Substitua 5-7 ferramentas** (Zendesk + HubSpot + Pipedrive + ContaAzul + Vindi) por uma **suite integrada**:

```
❌ Stack Fragmentado:          ✅ Conect360 All-in-One:
├─ Zendesk: R$ 299/mês         ├─ Atendimento (omnichannel)
├─ HubSpot: R$ 399/mês         ├─ CRM & Pipeline completo
├─ Pipedrive: R$ 199/mês       ├─ Gestão financeira
├─ ContaAzul: R$ 299/mês       ├─ Cobranças (Mercado Pago)
├─ Vindi: R$ 149/mês           ├─ Contratos e propostas
└─ Total: R$ 1.345/mês         └─ Total: R$ 297/mês
   + 8h/semana integrando         (Economia: 78%)
```

📖 **Leia mais**: [VISAO_SISTEMA_2025.md](VISAO_SISTEMA_2025.md) - Posicionamento completo e diferenciais

---

## ✨ Módulos do Sistema

### 1️⃣ Módulo CRM & Vendas

- **Pipeline Visual (Kanban)** - Gestão de oportunidades com drag & drop
- **Propostas Comerciais** - Geração automática (PDF) com templates
- **Cotações e Orçamentos** - Sistema completo de precificação
- **Gestão de Leads** - Captura, qualificação e conversão
- **Catálogo de Produtos** - Produtos e fornecedores integrados
- **Forecast de Receita** - Previsão de vendas por etapa
- **Métricas de Vendas** - Dashboard executivo com KPIs

### 2️⃣ Módulo Atendimento (Omnichannel)

- **Chat Real-time (WebSocket)** - Atendimento em tempo real
- **WhatsApp Business API** - Integração nativa com botões interativos
- **Email** - Canal de atendimento (roadmap Q1 2026)
- **Gestão de Tickets** - SLA, priorização, escalonamento
- **Sistema de Filas Inteligente** - 3 estratégias de distribuição automática
- **Bot de Triagem** - Classificação automática com IA
- **Transferências** - Entre atendentes, equipes e núcleos
- **Player de Áudio** - Mensagens de voz do WhatsApp
- **Status de Presença** - Online/offline/ausente dos atendentes
- **Fechamento Automático** - Por inatividade (configurável)

### 3️⃣ Módulo Financeiro

- **Gestão de Faturas** - Criação, emissão, controle de pagamentos
- **Integração Mercado Pago** - Boleto, PIX, cartão de crédito
- **Integração Stripe** - Pagamentos internacionais
- **Notas Fiscais** - NFe/NFSe (roadmap)
- **Controle de Recebíveis** - Acompanhamento de cobranças
- **Relatórios Financeiros** - Fluxo de caixa, inadimplência
- **Cobranças Automáticas** - Recorrência e renovação

### 4️⃣ Módulo Contratos

- **Geração Automática (PDF)** - Templates customizáveis
- **Versionamento** - Histórico completo de alterações
- **Assinatura Eletrônica** - Integração com plataformas (roadmap)
- **Renovação Automática** - Contratos recorrentes
- **Templates Brasileiros** - Modelos prontos para PMEs

### 5️⃣ Módulo Gestão de Clientes

- **Cadastro Completo (PF/PJ)** - CNPJ, CPF, documentos
- **Múltiplos Contatos** - Por empresa/cliente
- **Timeline 360°** - Histórico unificado (tickets + vendas + faturas)
- **Tags e Segmentação** - Organização por categorias
- **Documentos e Anexos** - Repositório centralizado
- **Sincronização WhatsApp** - Foto de perfil automática

### 6️⃣ Bot de Triagem Inteligente

- **Editor Visual de Fluxos** - Drag & drop sem código
- **7 Tipos de Blocos** - Menu, Mensagem, Pergunta, Condição, Ação, Início, Fim
- **Botões Interativos WhatsApp** - Reply buttons e list messages
- **IA (Anthropic Claude)** - Classificação inteligente de intenções
- **Versionamento** - Histórico completo de fluxos
- **Preview WhatsApp** - Teste em tempo real
- **Logs Completos** - Auditoria de conversas

### 7️⃣ Módulo Calendário & Agenda

- **Agendamentos** - Reuniões e follow-ups
- **Sincronização Google Calendar** - Integração nativa
- **Notificações Automáticas** - Lembretes por email/WhatsApp
- **Agenda de Equipe** - Visualização compartilhada

### 8️⃣ Módulo Analytics & Relatórios

- **Dashboard Executivo** - Visão geral da empresa
- **Métricas de Vendas** - Pipeline, taxa de conversão, ticket médio
- **Métricas de Atendimento** - SLA, tempo médio, satisfação
- **Forecast** - Previsão de receita e demanda
- **Relatórios Customizados** - Exportação CSV/PDF (roadmap)

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

- Node.js 22.16+ e npm 10+ (frontend usa `craco start` com `NODE_OPTIONS=--max_old_space_size=4096`)
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (opcional)

> Observação: o backend compila com Node 18+, mas mantenha 22.16+ também nele para evitar diferenças de runtime entre os pacotes.

### 1. Clone o Repositório

```bash
git clone https://github.com/Dhonleno/conect360.git
cd conect360
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

O backend mantém **dezenas de migrations** (50+ arquivos versionados em `backend/src/migrations`, revisado em 01/12/2025). Sempre consulte o estado real antes de executar comandos:

```bash
# Listar migrations
npm run migration:show

# Criar nova migration
npm run migration:generate -- src/migrations/NomeMigration

# Executar/Reverter
npm run migration:run
npm run migration:revert
```

### Blocos principais

- **Base multi-tenant**: `1700000000000-InitialSchema`, `1730476887000-EnableRowLevelSecurity`, `1762212773553-AddPhase1ConfigFields`
- **Atendimento e filas**: `1736380000000-CreateSistemaFilas`, `1762531500000-CreateDistribuicaoAutomaticaTables`, `1762962000000-CreateLeadsTable`
- **Segurança e credenciais**: `1760816700000-AddPrimeiraSenhaToUsersSimple`, `1762216500000-AddDeveTrocarSenhaFlagToUsers`, `1762220000000-CreatePasswordResetTokens`
- **Comercial e financeiro**: `1763062900000-AddEmpresaIdToContratosEFaturas`, `1763275000000-AddEmpresaIdToPagamentos`, `1774300000000-CreatePagamentosGatewayTables`

> Para um panorama completo e justificativas de cada etapa, consulte `CONSOLIDACAO_VALIDACAO_MIGRATIONS_01DEZ2025.md`.

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

# Feature Flags (Sprint 1 - Unificação Tickets+Demandas)
USE_UNIFIED_TICKETS=true  # Ativar modelo unificado de tickets
```

⚠️ **NUNCA** commite o arquivo `.env`!

### E-mail (pipeline oficial)

- O envio de e-mails agora passa pela fila `notifications` (`send-email` via `notifications.processor.ts`).
- O servidor legado `backend/email-server.js` e o `package-email.json` foram removidos; use apenas a fila. Se houver fluxo antigo, migre para o producer `enqueueSendEmail`.

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
- [docs/CREDENCIAIS_PADRAO.md](docs/CREDENCIAIS_PADRAO.md) - Credenciais padrão para ambientes locais

### Guias Técnicos

- [GUIA_GESTAO_NUCLEOS_WHATSAPP.md](docs/handbook/GUIA_GESTAO_NUCLEOS_WHATSAPP.md) - Gestão de núcleos
- [GUIA_CRIAR_FLUXO_WHATSAPP.md](docs/handbook/GUIA_CRIAR_FLUXO_WHATSAPP.md) - Criar fluxos
- [MANUAL_CONSTRUTOR_VISUAL.md](MANUAL_CONSTRUTOR_VISUAL.md) - Editor visual
- [GUIA_TOKEN_WHATSAPP.md](docs/handbook/GUIA_TOKEN_WHATSAPP.md) - Configurar WhatsApp
- [QUICKSTART_TESTE_INATIVIDADE.md](QUICKSTART_TESTE_INATIVIDADE.md) - 🆕 Teste de fechamento automático
- [DLQ_REPROCESSAMENTO.md](backend/DLQ_REPROCESSAMENTO.md) - Reprocessar DLQs (webhooks/messages/notifications)

### Sistema de Fechamento Automático

- [CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md](docs/archive/2025/CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md) - Arquitetura completa
- [TESTE_FECHAMENTO_AUTOMATICO.md](docs/runbooks/TESTE_FECHAMENTO_AUTOMATICO.md) - Guia detalhado de testes
- [STATUS_FECHAMENTO_AUTOMATICO.md](docs/archive/2025/STATUS_FECHAMENTO_AUTOMATICO.md) - Status da implementação
- [scripts/test-inactivity-system.ps1](scripts/test-inactivity-system.ps1) - Script automatizado de teste
- [scripts/test-inactivity-queries.sql](scripts/test-inactivity-queries.sql) - Queries SQL úteis

### Referências

- 📊 [ANALISE_MODULOS_SISTEMA.md](docs/archive/2025/ANALISE_MODULOS_SISTEMA.md) - Arquitetura
- 🏗️ [CONSOLIDACAO\_\*.md](.) - Histórico de implementações
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

- **[ROADMAP_MELHORIAS.md](docs/handbook/ROADMAP_MELHORIAS.md)** - Planejamento de melhorias futuras
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

- **[STATUS_BACKEND_ATENDIMENTO.md](docs/archive/2025/STATUS_BACKEND_ATENDIMENTO.md)** - Status do módulo de atendimento
- **[BACKEND_INTEGRATION_README.md](BACKEND_INTEGRATION_README.md)** - Integração com APIs
- **[docs/relatorio-vulnerabilidades.md](docs/relatorio-vulnerabilidades.md)** - Segurança

### 🚀 Deploy e Produção

- **[PRODUCTION_READY.md](PRODUCTION_READY.md)** - Checklist de produção
- **[SPRINT_1_COMPLETO_MULTITENANT.md](docs/archive/2025/SPRINT_1_COMPLETO_MULTITENANT.md)** - Deploy AWS EC2
- **[docs/RELATORIO_FINAL.md](docs/RELATORIO_FINAL.md)** - Lições aprendidas

### 📖 Documentação de Features

- **[SISTEMA_WHATSAPP_CONCLUIDO.md](docs/archive/2025/SISTEMA_WHATSAPP_CONCLUIDO.md)** - Integração WhatsApp
- **[CHAT_REALTIME_README.md](CHAT_REALTIME_README.md)** - WebSocket e tempo real
- **[CONSOLIDACAO_CONSTRUTOR_VISUAL.md](docs/archive/2025/CONSOLIDACAO_CONSTRUTOR_VISUAL.md)** - Editor de fluxos
- **[MISSAO_CUMPRIDA_ATENDIMENTO.md](docs/archive/2025/MISSAO_CUMPRIDA_ATENDIMENTO.md)** - Sistema de atendimento completo

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
- Consulte [ROADMAP_MELHORIAS.md](docs/handbook/ROADMAP_MELHORIAS.md) para ver melhorias planejadas
- Verifique [frontend-web/DESIGN_GUIDELINES.md](frontend-web/DESIGN_GUIDELINES.md) para padrões de UI

---

## 📊 Status do Projeto

![GitHub last commit](https://img.shields.io/github/last-commit/Dhonleno/conect360)
![GitHub issues](https://img.shields.io/github/issues/Dhonleno/conect360)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Dhonleno/conect360)

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

**© 2026 Conect360. Todos os direitos reservados.**

---

## 👥 Equipe

Desenvolvido com ❤️ por profissionais dedicados à excelência em atendimento ao cliente.

---

## 📞 Suporte

Para dúvidas ou suporte:

- 📧 Email: suporte@conect360.com.br
- 📖 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/Dhonleno/conect360/issues)

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela! ⭐**

[⬆ Voltar ao topo](#-conect360---suite-all-in-one-para-pmes)

</div>
