# 📦 Guia de Commit Profissional - ConectCRM

Este guia fornece comandos práticos para organizar commits de forma profissional.

## 🎯 Estratégia de Commit

### 1️⃣ **Commit por Categoria**

Organize seus commits em categorias lógicas, não em um único commit gigante.

### 2️⃣ **Ordem Recomendada**

```
1. Configuração (gitignore, editorconfig, etc.)
2. Documentação (README, guias, consolidações)
3. Backend - Migrations e Entities
4. Backend - Services e Controllers
5. Frontend - Services e Hooks
6. Frontend - Páginas e Componentes
7. Testes
```

---

## 📋 **Comandos Práticos para Este Projeto**

### Commit 1: Configuração do Repositório

```powershell
# Adicionar arquivos de configuração
git add .gitignore
git add .gitattributes
git add .editorconfig
git add CONTRIBUTING.md

# Commit
git commit -m "chore: configurar repositório profissionalmente

- Atualizar .gitignore para permitir documentação
- Adicionar .gitattributes para normalização de arquivos
- Criar .editorconfig para padronização de código
- Adicionar CONTRIBUTING.md com guias completos"
```

### Commit 2: Documentação Principal

```powershell
# Adicionar documentação estrutural
git add README.md
git add .github/copilot-instructions.md
git add .copilot-instructions.md
git add INDICE_DOCUMENTACAO_IA.md
git add GUIA_RAPIDO_AGENTE_IA.md

# Commit
git commit -m "docs: adicionar documentação principal do projeto

- Atualizar README com índice completo
- Copilot instructions para padronização
- Guias rápidos para desenvolvimento
- Índice de documentação para IA"
```

### Commit 3: Documentação de Features (Sprint 1)

```powershell
# Consolidações de features implementadas
git add CONSOLIDACAO_*.md
git add IMPLEMENTACAO_*.md
git add MISSAO_CUMPRIDA_*.md
git add SPRINT1_*.md
git add SISTEMA_*_COMPLETO.md

# Commit
git commit -m "docs(features): documentar implementações da Sprint 1

- Consolidação do sistema de atendimento
- Implementação de chat omnichannel
- Sistema de triagem inteligente
- Gestão de equipes e departamentos
- Sistema WhatsApp completo

Refs #sprint1"
```

### Commit 4: Guias e Manuais

```powershell
# Guias operacionais
git add GUIA_*.md
git add MANUAL_*.md
git add CHECKLIST_*.md
git add QUICK_REFERENCE.md

# Commit
git commit -m "docs(guides): adicionar guias operacionais

- Guias de configuração (WhatsApp, Deploy, SSL)
- Manuais de uso (Construtor Visual, Testes)
- Checklists de validação
- Referências rápidas"
```

### Commit 5: Backend - Migrations

```powershell
# Adicionar todas as migrations
git add backend/src/migrations/

# Commit
git commit -m "feat(database): adicionar migrations do sistema

Migrations incluídas:
- CreateDepartamentos (1729180000000)
- CreateTriagemLogsTable (1730224800000)
- EnableRowLevelSecurity (1730476887000)
- AddContatoFotoToAtendimentoTickets (1744828200000)
- CreateTriagemBotNucleosTables (1745017600000)
- CreateEquipesAtribuicoesTables (1745022000000)
- AddPrimeiraSenhaToUsersSimple (1760816700000)
- CreateNotasClienteClean (1761180000000)
- CreateDemandasClean (1761180100000)
- AddHistoricoVersoes (1761582305362)
- AddHistoricoVersoesFluxo (1761582400000)"
```

### Commit 6: Backend - Módulo de Triagem

```powershell
# Módulo completo de triagem
git add backend/src/modules/triagem/

# Commit
git commit -m "feat(triagem): implementar sistema de triagem inteligente

- Entities: Equipe, Atribuição, Núcleo, Fluxo
- Services: Triagem dinâmica, Bot WhatsApp
- Controllers: Gestão de equipes e departamentos
- DTOs: Validação completa com class-validator

Features:
- Triagem automática por IA
- Distribuição inteligente de atendimentos
- Gestão visual de fluxos
- Integração WhatsApp Business API"
```

### Commit 7: Backend - Módulo de Atendimento

```powershell
# Módulo de atendimento
git add backend/src/modules/atendimento/controllers/
git add backend/src/modules/atendimento/services/
git add backend/src/modules/atendimento/entities/
git add backend/src/modules/atendimento/dto/
git add backend/src/modules/atendimento/gateways/

# Commit
git commit -m "feat(atendimento): implementar sistema omnichannel

- Controllers: Tickets, Mensagens, Atendentes
- Services: WhatsApp sender/webhook, Contexto cliente
- Entities: Ticket, Mensagem, Nota, Demanda
- Gateway: WebSocket para tempo real

Features:
- Chat omnichannel em tempo real
- Integração WhatsApp com IA
- Gestão de tickets e histórico
- Status online/offline de atendentes
- Player de áudio para mensagens de voz"
```

### Commit 8: Backend - Melhorias e Ajustes

```powershell
# Arquivos modificados do backend
git add backend/src/app.module.ts
git add backend/src/config/database.config.ts
git add backend/src/modules/auth/
git add backend/src/modules/users/
git add backend/package.json

# Commit
git commit -m "refactor(backend): melhorias e otimizações

- Registrar novos módulos (Triagem, Atendimento)
- Atualizar configuração de banco (entities)
- Melhorar autenticação JWT
- Otimizar serviços de usuários
- Atualizar dependências"
```

### Commit 9: Frontend - Services

```powershell
# Services do frontend
git add frontend-web/src/services/atendenteService.ts
git add frontend-web/src/services/equipeService.ts
git add frontend-web/src/services/nucleoService.ts
git add frontend-web/src/services/fluxoService.ts
git add frontend-web/src/services/departamentoService.ts
git add frontend-web/src/services/triagemDinamicaService.ts
git add frontend-web/src/services/atendimentoService.ts
git add frontend-web/src/services/contatosService.ts

# Commit
git commit -m "feat(frontend): adicionar services de integração

Services implementados:
- atendenteService: Gestão de atendentes
- equipeService: Gerenciamento de equipes
- nucleoService: Núcleos de atendimento
- fluxoService: Construtor visual de fluxos
- departamentoService: Departamentos dinâmicos
- triagemDinamicaService: Triagem inteligente
- atendimentoService: Chat omnichannel
- contatosService: Gestão de contatos

Todas com TypeScript types e error handling completo"
```

### Commit 10: Frontend - Páginas Principais

```powershell
# Páginas novas
git add frontend-web/src/pages/GestaoEquipesPage.tsx
git add frontend-web/src/pages/GestaoNucleosPage.tsx
git add frontend-web/src/pages/GestaoDepartamentosPage.tsx
git add frontend-web/src/pages/GestaoFluxosPage.tsx
git add frontend-web/src/pages/FluxoBuilderPage.tsx
git add frontend-web/src/pages/GestaoAtendentesPage.tsx
git add frontend-web/src/pages/GestaoAtribuicoesPage.tsx
git add frontend-web/src/pages/GestaoTriagemDinamicaPage.tsx
git add frontend-web/src/pages/AtendimentoDashboard.tsx
git add frontend-web/src/pages/_TemplatePage.tsx

# Commit
git commit -m "feat(frontend): adicionar páginas de gestão

Páginas implementadas:
- Gestão de Equipes
- Gestão de Núcleos
- Gestão de Departamentos
- Gestão de Fluxos
- Construtor Visual de Fluxos (Drag & Drop)
- Gestão de Atendentes
- Matriz de Atribuições
- Triagem Dinâmica
- Dashboard de Atendimento
- Template base para novas páginas

Todos seguindo design system e padrões do projeto"
```

### Commit 11: Frontend - Chat Omnichannel

```powershell
# Chat completo
git add frontend-web/src/features/atendimento/omnichannel/

# Commit
git commit -m "feat(frontend): implementar chat omnichannel completo

Componentes:
- ChatOmnichannel: Container principal
- AtendimentosSidebar: Lista de tickets
- ChatArea: Área de mensagens
- ClientePanel: Painel de contexto
- PopupNotifications: Notificações em tempo real
- TypingIndicator: Indicador de digitação
- SkeletonLoaders: Loading states

Hooks:
- useAtendimentos: Gerenciamento de tickets
- useMensagens: Envio/recebimento de mensagens
- useWebSocket: Conexão tempo real
- useContextoCliente: Dados do cliente
- useHistoricoCliente: Histórico de interações

Features:
- Tempo real via WebSocket
- Player de áudio para voz
- Upload de arquivos
- Histórico completo
- Estados loading/error/empty"
```

### Commit 12: Frontend - Componentes e Hooks

```powershell
# Componentes reutilizáveis
git add frontend-web/src/components/navigation/
git add frontend-web/src/components/chat/
git add frontend-web/src/components/modals/
git add frontend-web/src/hooks/

# Commit
git commit -m "feat(frontend): adicionar componentes e hooks reutilizáveis

Componentes:
- HierarchicalNavGroup: Navegação hierárquica
- OnlineIndicator: Status online/offline
- ModalCadastroDepartamento: Modal de departamentos

Hooks:
- useNucleos: Gestão de núcleos
- useDemandas: Gerenciamento de demandas
- useNotas: Notas de clientes

Contextos:
- MenuContext: Estado do menu lateral
- ToastContext: Notificações toast"
```

### Commit 13: Frontend - Configuração

```powershell
# Arquivos de configuração do frontend
git add frontend-web/src/App.tsx
git add frontend-web/src/config/menuConfig.ts
git add frontend-web/DESIGN_GUIDELINES.md
git add frontend-web/README.md
git add frontend-web/package.json
git add frontend-web/tailwind.config.js

# Commit
git commit -m "chore(frontend): atualizar configurações

- Registrar novas rotas em App.tsx
- Configurar menu dinâmico (menuConfig.ts)
- Adicionar Design Guidelines
- Atualizar README com quick start
- Atualizar dependências
- Configurar Tailwind com paleta personalizada"
```

### Commit 14: Deploy e DevOps

```powershell
# Arquivos de deploy
git add backend/Dockerfile
git add frontend-web/Dockerfile
git add docker-compose.prod.yml
git add nginx.conf
git add deploy-aws.sh
git add setup-ec2.sh
git add setup-ssl.sh
git add docs/AWS_DEPLOY_GUIDE.md
git add DEPLOY_*.md

# Commit
git commit -m "ci: adicionar configuração de deploy

Docker:
- Dockerfile otimizado para backend (NestJS)
- Dockerfile otimizado para frontend (React)
- docker-compose para produção

Nginx:
- Configuração SSL/HTTPS
- Proxy reverso
- Compressão gzip

Scripts:
- Deploy automatizado AWS
- Setup de EC2
- Configuração SSL com Let's Encrypt

Documentação:
- Guia completo de deploy AWS
- Instruções de SSL
- Troubleshooting"
```

### Commit 15: Testes

```powershell
# Arquivos de teste
git add backend/test/
git add backend/src/**/*.spec.ts
git add frontend-web/test-*.js

# Commit (se houver testes)
git commit -m "test: adicionar testes automatizados

Backend:
- Testes E2E para isolamento multi-tenant
- Testes unitários de services

Frontend:
- Testes de integração WebSocket
- Testes de componentes React"
```

---

## 🚀 **Fluxo Completo - Executar em Ordem**

```powershell
# 1. Configuração do repositório
git add .gitignore .gitattributes .editorconfig CONTRIBUTING.md
git commit -m "chore: configurar repositório profissionalmente"

# 2. Documentação principal
git add README.md .github/ INDICE_*.md GUIA_*.md
git commit -m "docs: adicionar documentação principal"

# 3. Consolidações de features
git add CONSOLIDACAO_*.md IMPLEMENTACAO_*.md SPRINT1_*.md
git commit -m "docs(features): documentar Sprint 1"

# 4. Guias operacionais
git add MANUAL_*.md CHECKLIST_*.md
git commit -m "docs(guides): adicionar guias operacionais"

# 5. Backend - Migrations
git add backend/src/migrations/
git commit -m "feat(database): adicionar migrations"

# 6. Backend - Módulo Triagem
git add backend/src/modules/triagem/
git commit -m "feat(triagem): implementar sistema inteligente"

# 7. Backend - Módulo Atendimento
git add backend/src/modules/atendimento/
git commit -m "feat(atendimento): implementar omnichannel"

# 8. Backend - Melhorias
git add backend/src/app.module.ts backend/src/config/ backend/src/modules/auth/
git commit -m "refactor(backend): melhorias e otimizações"

# 9. Frontend - Services
git add frontend-web/src/services/
git commit -m "feat(frontend): adicionar services"

# 10. Frontend - Páginas
git add frontend-web/src/pages/
git commit -m "feat(frontend): adicionar páginas de gestão"

# 11. Frontend - Chat
git add frontend-web/src/features/atendimento/omnichannel/
git commit -m "feat(frontend): implementar chat omnichannel"

# 12. Frontend - Componentes
git add frontend-web/src/components/ frontend-web/src/hooks/
git commit -m "feat(frontend): adicionar componentes reutilizáveis"

# 13. Frontend - Configuração
git add frontend-web/src/App.tsx frontend-web/src/config/ frontend-web/DESIGN_GUIDELINES.md
git commit -m "chore(frontend): atualizar configurações"

# 14. Deploy
git add backend/Dockerfile frontend-web/Dockerfile docker-compose.prod.yml nginx.conf *.sh docs/AWS_DEPLOY_GUIDE.md
git commit -m "ci: adicionar configuração de deploy"

# 15. Push tudo
git push origin consolidacao-atendimento
```

---

## 📊 **Verificação Antes do Push**

```powershell
# Ver resumo dos commits
git log --oneline -15

# Ver estatísticas
git diff --stat origin/consolidacao-atendimento

# Ver quais arquivos serão enviados
git diff --name-only origin/consolidacao-atendimento

# Verificar se não há arquivos sensíveis
git diff origin/consolidacao-atendimento | Select-String ".env|password|secret|key"
```

---

## ⚠️ **Checklist Final Antes do Push**

- [ ] ✅ Nenhum arquivo `.env` será commitado
- [ ] ✅ Nenhum `node_modules/` será enviado
- [ ] ✅ Nenhuma credencial no código
- [ ] ✅ Todos os commits têm mensagens descritivas
- [ ] ✅ Commits organizados por categoria
- [ ] ✅ Branch atualizada com base (main/develop)
- [ ] ✅ Testes locais passando
- [ ] ✅ Build local sem erros

---

## 🎯 **Após o Push**

1. Criar Pull Request no GitHub
2. Preencher template de PR
3. Aguardar CI/CD passar
4. Solicitar code review
5. Merge após aprovação

---

**Última atualização**: Novembro 2025
