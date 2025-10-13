# 📚 Índice de Documentação - ConectCRM Omnichannel

Navegue facilmente por toda a documentação do projeto.

---

## 🚀 Início Rápido

| Documento | Descrição | Tempo | Link |
|-----------|-----------|-------|------|
| **QUICKSTART.md** | Guia para começar em 5 minutos | ⚡ 5 min | [Ver](../QUICKSTART.md) |
| **NGROK_README.md** | 🆕 Guia rápido ngrok (webhooks) | ⚡ 3 min | [Ver](../NGROK_README.md) |
| **README.md** | Visão geral do projeto | 📖 10 min | [Ver](../README.md) |
| **RESUMO_COMPLETO_OMNICHANNEL.md** | Resumo de toda implementação | 📊 15 min | [Ver](./RESUMO_COMPLETO_OMNICHANNEL.md) |

---

## 🏗️ Arquitetura e Configuração

| Documento | Descrição | Linhas | Link |
|-----------|-----------|--------|------|
| **OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md** | Configuração de 5 integrações externas | 800+ | [Ver](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) |
| **API_DOCUMENTATION.md** | Todas APIs REST + WebSocket | 800+ | [Ver](./API_DOCUMENTATION.md) |
| **websocket-events.md** | Eventos WebSocket detalhados | 400+ | [Ver](./websocket-events.md) |
| **GUIA_DEPLOY.md** | Deploy em produção (Ubuntu, Nginx, PM2) | 500+ | [Ver](./GUIA_DEPLOY.md) |
| **GUIA_NGROK_WEBHOOKS.md** | 🆕 Configuração ngrok para webhooks | 600+ | [Ver](./GUIA_NGROK_WEBHOOKS.md) |
| **NGROK_REFERENCIA_RAPIDA.md** | 🆕 Referência rápida ngrok | 200+ | [Ver](./NGROK_REFERENCIA_RAPIDA.md) |

---

## 🎨 Frontend

| Documento | Descrição | Linhas | Link |
|-----------|-----------|--------|------|
| **FRONTEND_CHAT_REALTIME.md** | Componentes React de chat em tempo real | 300+ | [Ver](./FRONTEND_CHAT_REALTIME.md) |
| **IntegracoesPage.tsx** | Código da página de configurações | 870 | [Ver](../frontend-web/src/pages/configuracoes/IntegracoesPage.tsx) |
| **useWebSocket.tsx** | Hook customizado para WebSocket | 150+ | [Ver](../frontend-web/src/hooks/useWebSocket.tsx) |
| **useChat.tsx** | Hook customizado para chat | 200+ | [Ver](../frontend-web/src/hooks/useChat.tsx) |

---

## 🤖 Backend

| Documento | Descrição | Linhas | Link |
|-----------|-----------|--------|------|
| **IA_CHATBOT_DOCS.md** | Integração IA (OpenAI + Anthropic) | 400+ | [Ver](./IA_CHATBOT_DOCS.md) |
| **atendimento.gateway.ts** | WebSocket Gateway | 350+ | [Ver](../backend/src/modules/atendimento/atendimento.gateway.ts) |
| **validacao-integracoes.service.ts** | Validação de credenciais (5 APIs) | 425 | [Ver](../backend/src/modules/atendimento/services/validacao-integracoes.service.ts) |
| **ia.service.ts** | Serviço de IA | 300+ | [Ver](../backend/src/modules/atendimento/services/ia.service.ts) |

---

## 🧪 Testes

| Documento | Descrição | Testes | Link |
|-----------|-----------|--------|------|
| **TESTES_INTEGRACOES.md** | Guia completo de testes | - | [Ver](./TESTES_INTEGRACOES.md) |
| **E2E_TESTS_DOCS.md** | Documentação de testes E2E | 36 | [Ver](./E2E_TESTS_DOCS.md) |
| **integracoes.spec.ts** | Testes E2E de integrações | 28 | [Ver](../e2e/integracoes.spec.ts) |
| **atendimento.spec.ts** | Testes E2E de atendimento | 36 | [Ver](../e2e/atendimento.spec.ts) |

---

## 🛠️ Desenvolvimento

| Documento | Descrição | Link |
|-----------|-----------|------|
| **CONVENCOES_DESENVOLVIMENTO.md** | Padrões de código e nomenclatura | [Ver](./CONVENCOES_DESENVOLVIMENTO.md) |
| **COPILOT_DOCUMENTATION_GUIDELINES.md** | Guia para documentar código | [Ver](./COPILOT_DOCUMENTATION_GUIDELINES.md) |
| **GUIA_LIMPEZA_DESENVOLVIMENTO.md** | Manter projeto limpo e organizado | [Ver](./GUIA_LIMPEZA_DESENVOLVIMENTO.md) |
| **SETUP_PADRONIZACAO.md** | Configuração inicial do ambiente | [Ver](./SETUP_PADRONIZACAO.md) |

---

## 📖 Por Categoria

### **1. Começando**
1. [QUICKSTART.md](../QUICKSTART.md) - Iniciar em 5 minutos
2. [README.md](../README.md) - Visão geral
3. [SETUP_PADRONIZACAO.md](./SETUP_PADRONIZACAO.md) - Configuração inicial

### **2. Funcionalidades Omnichannel**
1. [RESUMO_COMPLETO_OMNICHANNEL.md](./RESUMO_COMPLETO_OMNICHANNEL.md) - Resumo completo
2. [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) - Configurar integrações
3. [FRONTEND_CHAT_REALTIME.md](./FRONTEND_CHAT_REALTIME.md) - Chat em tempo real
4. [IA_CHATBOT_DOCS.md](./IA_CHATBOT_DOCS.md) - IA e chatbot

### **3. APIs e WebSocket**
1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Todas APIs REST
2. [websocket-events.md](./websocket-events.md) - Eventos WebSocket
3. Exemplos de uso em cada documento

### **4. Testes**
1. [TESTES_INTEGRACOES.md](./TESTES_INTEGRACOES.md) - Testar integrações
2. [E2E_TESTS_DOCS.md](./E2E_TESTS_DOCS.md) - Testes E2E gerais
3. [integracoes.spec.ts](../e2e/integracoes.spec.ts) - Código dos testes

### **5. Deploy e Produção**
1. [GUIA_DEPLOY.md](./GUIA_DEPLOY.md) - Deploy em produção
2. [GUIA_MIGRACAO_AMBIENTE.md](./GUIA_MIGRACAO_AMBIENTE.md) - Migrar ambiente
3. Configuração de variáveis de ambiente

### **6. Desenvolvimento**
1. [CONVENCOES_DESENVOLVIMENTO.md](./CONVENCOES_DESENVOLVIMENTO.md) - Padrões de código
2. [COPILOT_DOCUMENTATION_GUIDELINES.md](./COPILOT_DOCUMENTATION_GUIDELINES.md) - Documentar código
3. [GUIA_LIMPEZA_DESENVOLVIMENTO.md](./GUIA_LIMPEZA_DESENVOLVIMENTO.md) - Manter projeto limpo

---

## 📊 Por Tipo de Usuário

### **👨‍💻 Desenvolvedor Frontend**
1. [FRONTEND_CHAT_REALTIME.md](./FRONTEND_CHAT_REALTIME.md)
2. [IntegracoesPage.tsx](../frontend-web/src/pages/configuracoes/IntegracoesPage.tsx)
3. [useWebSocket.tsx](../frontend-web/src/hooks/useWebSocket.tsx)
4. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Seção de APIs REST

### **👨‍💻 Desenvolvedor Backend**
1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. [websocket-events.md](./websocket-events.md)
3. [IA_CHATBOT_DOCS.md](./IA_CHATBOT_DOCS.md)
4. [validacao-integracoes.service.ts](../backend/src/modules/atendimento/services/validacao-integracoes.service.ts)

### **🧪 QA / Tester**
1. [TESTES_INTEGRACOES.md](./TESTES_INTEGRACOES.md)
2. [E2E_TESTS_DOCS.md](./E2E_TESTS_DOCS.md)
3. [integracoes.spec.ts](../e2e/integracoes.spec.ts)

### **🚀 DevOps / SysAdmin**
1. [GUIA_DEPLOY.md](./GUIA_DEPLOY.md)
2. [GUIA_MIGRACAO_AMBIENTE.md](./GUIA_MIGRACAO_AMBIENTE.md)
3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Seção de Deploy

### **👔 Product Owner / Manager**
1. [README.md](../README.md)
2. [RESUMO_COMPLETO_OMNICHANNEL.md](./RESUMO_COMPLETO_OMNICHANNEL.md)
3. [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) - Seção de Features

---

## 🔍 Busca Rápida

### **Encontrar informações sobre...**

#### **Integrações:**
- WhatsApp: [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) → Seção WhatsApp
- OpenAI: [IA_CHATBOT_DOCS.md](./IA_CHATBOT_DOCS.md) → Seção OpenAI
- Anthropic: [IA_CHATBOT_DOCS.md](./IA_CHATBOT_DOCS.md) → Seção Anthropic
- Telegram: [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) → Seção Telegram
- Twilio: [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) → Seção Twilio

#### **APIs:**
- REST Endpoints: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) → Seção APIs REST
- WebSocket Events: [websocket-events.md](./websocket-events.md) ou [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) → Seção WebSocket
- Autenticação: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) → Seção Autenticação

#### **Componentes:**
- ChatWindow: [FRONTEND_CHAT_REALTIME.md](./FRONTEND_CHAT_REALTIME.md) → Seção ChatWindow
- IntegracoesPage: [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) → Seção Frontend
- Hooks: [FRONTEND_CHAT_REALTIME.md](./FRONTEND_CHAT_REALTIME.md) → Seção Hooks

#### **Deploy:**
- Ubuntu: [GUIA_DEPLOY.md](./GUIA_DEPLOY.md) → Seção Preparação do Ambiente
- Nginx: [GUIA_DEPLOY.md](./GUIA_DEPLOY.md) → Seção Configurar Nginx
- PM2: [GUIA_DEPLOY.md](./GUIA_DEPLOY.md) → Seção Deploy do Backend
- SSL: [GUIA_DEPLOY.md](./GUIA_DEPLOY.md) → Seção Configurar SSL

#### **Testes:**
- Testes manuais: [TESTES_INTEGRACOES.md](./TESTES_INTEGRACOES.md) → Seção Testes Manuais
- Testes E2E: [E2E_TESTS_DOCS.md](./E2E_TESTS_DOCS.md)
- Playwright: [TESTES_INTEGRACOES.md](./TESTES_INTEGRACOES.md) → Seção Testes E2E

---

## 📈 Estatísticas da Documentação

| Métrica | Valor |
|---------|-------|
| **Total de documentos** | 15+ arquivos MD |
| **Linhas de documentação** | 6.000+ linhas |
| **Exemplos de código** | 100+ snippets |
| **Guias passo-a-passo** | 10+ tutoriais |
| **Diagramas** | 5+ diagramas ASCII |
| **Comandos documentados** | 200+ comandos |

---

## 🎯 Fluxo de Leitura Recomendado

### **Para Novos Desenvolvedores:**

```
1. QUICKSTART.md (5 min)
   ↓
2. README.md (10 min)
   ↓
3. OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md (30 min)
   ↓
4. API_DOCUMENTATION.md (30 min)
   ↓
5. FRONTEND_CHAT_REALTIME.md ou IA_CHATBOT_DOCS.md (30 min)
   ↓
6. TESTES_INTEGRACOES.md (20 min)
   ↓
7. Começar a desenvolver! 🚀
```

### **Para Configuração Rápida:**

```
1. QUICKSTART.md (5 min)
   ↓
2. OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md → Seção "Como Configurar" (10 min)
   ↓
3. Testar no navegador! ✅
```

### **Para Deploy:**

```
1. GUIA_DEPLOY.md → Ler tudo (1h)
   ↓
2. GUIA_MIGRACAO_AMBIENTE.md → Se migrar de outro ambiente (30 min)
   ↓
3. API_DOCUMENTATION.md → Seção de Testes Pós-Deploy (20 min)
   ↓
4. Deploy! 🚀
```

---

## 💡 Dicas de Navegação

### **Atalhos:**
- `Ctrl + F` - Buscar dentro do documento
- `Ctrl + Click` - Abrir link em nova aba
- Use o índice no topo de cada documento

### **Estrutura Padrão dos Documentos:**
```
1. 📋 Índice (links rápidos)
2. 🔧 Pré-requisitos
3. 📖 Conteúdo principal
4. 💡 Exemplos práticos
5. 🐛 Troubleshooting
6. 📚 Links relacionados
```

### **Convenções:**
- ✅ - Concluído / Sucesso
- ⏳ - Em progresso / Aguardando
- ❌ - Erro / Falha
- 📖 - Leitura recomendada
- 🔧 - Ação necessária
- 💡 - Dica / Sugestão
- ⚠️ - Atenção / Cuidado

---

## 🔄 Atualizações

**Última atualização:** 11 de outubro de 2025

### **Versão 1.0.0 (11/10/2025)**
- ✅ Documentação inicial completa
- ✅ 15+ documentos criados
- ✅ 6.000+ linhas de documentação
- ✅ Cobertura de 100% das features

---

## 📞 Suporte

**Dúvidas sobre documentação?**
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

**Documentação desatualizada?**
- Verifique a data de última atualização
- Consulte o README.md para versão mais recente
- Contribua com melhorias via Pull Request

---

**Desenvolvido com ❤️ pela Equipe ConectCRM**
