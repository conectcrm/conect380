# 🚀 Quick Start - Conect360 (Suite All-in-One)

Guia rápido para subir o Conect360 localmente em **5–10 minutos**.

## Aviso de escopo

Este guia cobre setup tecnico rapido do ambiente.

Ele NAO significa que todos os modulos prometidos no produto estejam igualmente maduros, homologados ou com requisito formal fechado.

Para entender escopo de produto e cobertura real de requisitos, consulte antes ou depois do setup:

1. `README.md`
2. `VISAO_SISTEMA_2025.md`
3. `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`

---

## 📋 Pré-requisitos

- ✅ Node.js v22.16+ instalado
- ✅ PostgreSQL rodando
- ✅ Redis rodando (opcional, mas recomendado)
- ✅ Git instalado

**Nota (frontend)**: em algumas máquinas o React pode precisar de `NODE_OPTIONS=--max_old_space_size=4096`.

---

## 🏁 Passo 1: Clonar e Instalar (2 min)

```bash
# Clonar repositório
git clone https://github.com/Dhonleno/conect360.git
cd conect360

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend-web
npm install
```

---

## 🔧 Passo 2: Configurar Backend (1 min)

```bash
cd backend

# Copiar .env de exemplo
cp .env.example .env

# Editar .env (valores mínimos necessários)
notepad .env
```

**Configuração mínima do `.env`:**

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=conectcrm

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Criar database:**

```bash
# Windows (PowerShell)
psql -U postgres -c "CREATE DATABASE conectcrm;"

# Linux/Mac
sudo -u postgres psql -c "CREATE DATABASE conectcrm;"
```

---

## 🎨 Passo 3: Configurar Frontend (1 min)

```bash
cd frontend-web

# Copiar .env de exemplo
cp .env.example .env

# Editar .env
notepad .env
```

**Configuração mínima do `.env`:**

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

---

## 🚀 Passo 4: Iniciar Sistema (1 min)

### **Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

**Aguardar mensagem:**

```
✅ Nest application successfully started
🚀 Servidor rodando em: http://localhost:3001
```

### **Terminal 2 - Frontend:**

```bash
cd frontend-web
npm start
```

**Aguardar mensagem:**

```
webpack compiled successfully
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
```

---

## 🎯 Passo 5: Acessar Sistema

### **1. Fazer Login**

```
URL: http://localhost:3000/login

Credenciais padrão:
Email: admin@conectsuite.com.br
Senha: admin123
```

### **2. Acessar Configurações de Integrações**

```
URL: http://localhost:3000/configuracoes/integracoes

Ou:
Menu lateral > "Configurações" > "Integrações"
```

### **3. Configurar uma Integração (Exemplo: OpenAI)**

```
1. Preencher campos:
   - API Key: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   - Modelo: gpt-4-turbo

2. Clicar em "Testar Conexão"
   ✅ Deve aparecer: "Credenciais válidas! Modelo gpt-4-turbo disponível"

3. Clicar em "Salvar Configuração"
   ✅ Badge "Ativo" (verde) deve aparecer no card
```

---

## 🧪 Passo Bônus: Executar Testes E2E

```bash
# Terminal 3
cd C:\Projetos\conectcrm

# Instalar browsers do Playwright (primeira vez)
npx playwright install chromium

# Executar testes
npx playwright test e2e/integracoes.spec.ts --headed
```

**Resultado esperado:**

```
✅ 28 passed (28/28)
```

---

## 📊 Verificação de Status

### **Backend Health Check:**

```bash
curl http://localhost:3001/health
# ou no navegador: http://localhost:3001/health
```

**Resposta esperada:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

### **Frontend:**

```
Abrir no navegador: http://localhost:3000
✅ Página de login deve carregar
✅ Sem erros no console (F12)
```

### **WebSocket:**

```javascript
// Console do navegador (F12)
localStorage.getItem("authToken"); // Deve retornar um token

// Verificar conexão WebSocket na aba "Network" > "WS"
// Deve haver conexão com: ws://localhost:3001/socket.io/
```

---

## 🎨 Próximos Passos

Agora que o sistema está rodando, você pode:

1. **Explorar o Atendimento:**
   - Menu > "Atendimento"
   - Criar tickets
   - Enviar mensagens
   - Testar WebSocket em tempo real

2. **Configurar Integrações:**
   - WhatsApp Business API (requer conta Meta Business)
   - OpenAI GPT (requer API key)
   - Anthropic Claude (requer API key)
   - Telegram Bot (requer bot token do BotFather)
   - Twilio (requer conta Twilio)

3. **Ler Documentação:**
   - [API Documentation](./docs/API_DOCUMENTATION.md)
   - [Guia de Testes](./docs/TESTES_INTEGRACOES.md)
   - [Configurações de Integrações](./docs/OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md)
   - [Guia de Deploy](./docs/GUIA_DEPLOY.md)

---

## 🐛 Troubleshooting Rápido

### **Backend não inicia:**

```bash
# Verificar se porta 3001 está ocupada
netstat -ano | findstr :3001

# Verificar PostgreSQL rodando
psql -U postgres -c "SELECT version();"

# Verificar logs de erro
cd backend
npm run start:dev
# Ler mensagens de erro no terminal
```

### **Frontend não inicia:**

```bash
# Verificar se porta 3000 está ocupada
netstat -ano | findstr :3000

# Limpar cache e reinstalar
cd frontend-web
rm -rf node_modules package-lock.json
npm install
npm start
```

### **Erro de conexão WebSocket:**

```bash
# Verificar CORS no backend (src/main.ts)
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});

# Verificar URL no frontend (.env)
REACT_APP_WS_URL=ws://localhost:3001
```

### **Erro ao testar integração:**

```bash
# Verificar credenciais no .env do backend
# Ou usar a interface para testar (mais fácil)

# Verificar logs do backend no terminal:
# Deve aparecer: "🔍 [CanaisController] POST /atendimento/canais/validar chamado"
```

---

## 📞 Suporte

**Documentação Geral (suite):** [docs/INDICE_DOCUMENTACAO.md](./docs/INDICE_DOCUMENTACAO.md)  
**Documentação (pasta):** [docs/](./docs/)  
**README Principal:** [README.md](./README.md)  
**Resumo (módulo Atendimento / Omnichannel):** [docs/RESUMO_COMPLETO_OMNICHANNEL.md](./docs/RESUMO_COMPLETO_OMNICHANNEL.md)

---

## 🎉 Parabéns!

Você configurou com sucesso o Conect360 (Suite All-in-One)! 🚀

**O que você tem agora:**

- ✅ Backend rodando com APIs REST + WebSocket
- ✅ Frontend React com interface completa
- ✅ Sistema de integrações funcionando
- ✅ Chat em tempo real
- ✅ IA/Chatbot pronto para uso
- ✅ 5 integrações configuráveis

**Tempo total:** ~5 minutos ⚡

---

**Desenvolvido com ❤️ pela Equipe Conect360**
