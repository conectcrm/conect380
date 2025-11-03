# 🔧 Correção: Configuração de Proxy Frontend → Backend

**Data**: 11 de outubro de 2025  
**Problema**: Frontend recebendo HTML ao invés de JSON nas chamadas API  
**Causa Raiz**: Ausência de configuração de proxy no React  
**Status**: ✅ RESOLVIDO

---

## 📋 Índice
- [O Problema](#o-problema)
- [Causa Raiz](#causa-raiz)
- [Solução Aplicada](#solução-aplicada)
- [Validação](#validação)
- [Contexto Técnico](#contexto-técnico)

---

## 🐛 O Problema

### Erro Observado no Console

```
IntegracoesPage.tsx:144 Erro ao carregar configurações: 
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### O Que Estava Acontecendo

1. **Frontend** fazia requisição: `fetch('/api/atendimento/canais')`
2. **URL real** ficava: `http://localhost:3000/api/atendimento/canais`
3. **React Dev Server** não encontrava a rota (era rota do backend!)
4. **React** retornava página HTML 404
5. **Frontend** tentava fazer `JSON.parse(HTML)` → **ERRO!**

### Fluxo do Erro

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Frontend (React)                                               │
│  http://localhost:3000                                          │
│                                                                 │
│  Código:                                                        │
│  fetch('/api/atendimento/canais')                              │
│         ↓                                                       │
│  URL Final: http://localhost:3000/api/atendimento/canais       │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Requisição HTTP GET
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  React Dev Server (webpack-dev-server)                          │
│  Porta: 3000                                                    │
│                                                                 │
│  Procura rota: /api/atendimento/canais                         │
│  Resultado: ❌ NÃO ENCONTRADO                                   │
│  Retorna: HTML da página 404 do React                          │
│                                                                 │
│  <!DOCTYPE html>                                                │
│  <html lang="en">                                               │
│  <head>...</head>                                               │
│  <body>404 Not Found</body>                                     │
│  </html>                                                        │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Resposta: 404 + HTML
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Frontend (React) - Processamento                               │
│                                                                 │
│  Código:                                                        │
│  const data = await response.json();                           │
│                ↓                                                │
│  JSON.parse("<!DOCTYPE html>...")                              │
│                ↓                                                │
│  💥 SyntaxError: Unexpected token '<'                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Causa Raiz

### Problema Principal

**Faltava configuração de proxy no `package.json` do frontend!**

Quando você faz `fetch('/api/...')` no React:
- React precisa saber que deve **encaminhar** essa requisição para o backend
- Sem proxy, React tenta servir a rota localmente
- Como a rota não existe no frontend, retorna 404 HTML

### Por Que Isso Acontece?

Em desenvolvimento, temos **dois servidores**:

1. **Frontend (React)**: `http://localhost:3000`
   - Serve arquivos estáticos (HTML, CSS, JS)
   - Gerencia rotas do React Router
   - **NÃO** tem as rotas da API

2. **Backend (NestJS)**: `http://localhost:3001`
   - Serve API REST
   - Tem as rotas `/api/...`
   - **NÃO** serve arquivos do frontend

### O Proxy Resolve Como?

```javascript
// package.json
{
  "proxy": "http://localhost:3001"
}
```

Agora quando você faz `fetch('/api/atendimento/canais')`:
1. React Dev Server intercepta a requisição
2. Vê que começa com `/api`
3. **Redireciona** para `http://localhost:3001/api/atendimento/canais`
4. Backend processa e retorna JSON
5. Frontend recebe o JSON corretamente! ✅

---

## ✅ Solução Aplicada

### Arquivo Modificado

**Arquivo**: `frontend-web/package.json`

**Mudança**:

```diff
{
  "dependencies": {
    ...
    "yup": "0.32.11"
  },
+ "proxy": "http://localhost:3001",
  "scripts": {
    "start": "...",
    ...
  }
}
```

### Passo a Passo da Correção

```powershell
# 1. Adicionar proxy ao package.json
# (Feito via editor)

# 2. Parar processos Node antigos
Get-Process -Name node | Stop-Process -Force

# 3. Reiniciar frontend
cd C:\Projetos\conectcrm\frontend-web
npm start

# 4. Aguardar compilação (~30-60 segundos)

# 5. Testar no navegador
# Abrir: http://localhost:3000
# Login → Configurações → Integrações
```

---

## ✅ Validação

### Teste 1: Rota Backend Direta

```bash
# Antes da correção (chamada direta ao backend - OK)
curl http://localhost:3001/api/atendimento/canais
# Resposta: HTTP 401 Unauthorized (rota existe!)
# {"message":"Unauthorized","statusCode":401}
```

### Teste 2: Rota Através do Frontend

```bash
# Antes da correção (através do React Dev Server - FALHA)
curl http://localhost:3000/api/atendimento/canais
# Resposta: HTTP 404 Not Found
# <!DOCTYPE html>...

# Depois da correção (com proxy configurado - OK)
curl http://localhost:3000/api/atendimento/canais
# Resposta: HTTP 401 Unauthorized (proxy funcionando!)
# {"message":"Unauthorized","statusCode":401}
```

### Teste 3: Página de Integrações

**Antes**:
```
Console do navegador:
❌ SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Depois**:
```
Console do navegador:
✅ Sem erros de parsing JSON
✅ Página carrega normalmente
✅ (Pode mostrar 401 se não estiver autenticado, mas é esperado)
```

---

## 🔧 Contexto Técnico

### Por Que Duas Portas?

#### Porta 3000 (Frontend - React Dev Server)
- **Responsabilidade**: Servir arquivos do React
- **Tecnologia**: webpack-dev-server
- **Features**:
  - Hot Module Replacement (HMR)
  - Proxy para backend
  - Serve `index.html` e assets
- **Não faz**: Processar lógica de negócio, acessar banco de dados

#### Porta 3001 (Backend - NestJS)
- **Responsabilidade**: API REST
- **Tecnologia**: Express.js (por baixo do NestJS)
- **Features**:
  - Rotas `/api/...`
  - Autenticação JWT
  - Acesso ao PostgreSQL
  - WebSockets para real-time
- **Não faz**: Servir arquivos estáticos do React

### Como Funciona o Proxy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ANTES (SEM PROXY)                                              │
│                                                                 │
│  Browser → http://localhost:3000/api/atendimento/canais        │
│              ↓                                                  │
│  React Dev Server (porta 3000)                                  │
│              ↓                                                  │
│  ❌ 404 Not Found (HTML)                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  DEPOIS (COM PROXY)                                             │
│                                                                 │
│  Browser → http://localhost:3000/api/atendimento/canais        │
│              ↓                                                  │
│  React Dev Server (porta 3000)                                  │
│              ↓ (detecta /api)                                   │
│  Proxy → http://localhost:3001/api/atendimento/canais          │
│              ↓                                                  │
│  NestJS Backend (porta 3001)                                    │
│              ↓                                                  │
│  ✅ JSON Response                                               │
│              ↓                                                  │
│  React Dev Server                                               │
│              ↓                                                  │
│  Browser recebe JSON                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Configurações Alternativas

#### Opção 1: Proxy Simples (Usada)

```json
{
  "proxy": "http://localhost:3001"
}
```

**Prós**:
- ✅ Simples e direto
- ✅ Funciona para a maioria dos casos
- ✅ Encaminha todas as requisições que não são de assets estáticos

**Contras**:
- ❌ Menos controle granular

#### Opção 2: setupProxy.js (Avançada)

```javascript
// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};
```

**Prós**:
- ✅ Controle granular de rotas
- ✅ Pode configurar headers, timeout, etc.
- ✅ Suporta WebSockets mais facilmente

**Contras**:
- ❌ Mais complexo
- ❌ Requer `http-proxy-middleware` instalado

#### Opção 3: Variável de Ambiente

```javascript
// frontend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
fetch(`${API_URL}/api/atendimento/canais`);
```

**Prós**:
- ✅ Funciona em produção sem proxy
- ✅ Pode usar URLs diferentes por ambiente

**Contras**:
- ❌ Problemas de CORS em desenvolvimento
- ❌ Precisa configurar CORS no backend
- ❌ Mais verboso

---

## 📚 Documentação de Referência

### Create React App - Proxying API Requests
https://create-react-app.dev/docs/proxying-api-requests-in-development/

### Por Que Usar Proxy?

1. **Evita CORS**: Mesmo domínio para frontend e backend
2. **Simplifica código**: Usa caminhos relativos (`/api/...`)
3. **Ambiente de desenvolvimento**: Simula produção onde tudo está no mesmo domínio
4. **Segurança**: Token JWT em headers funciona sem problemas de CORS

### Como Funciona em Produção?

Em produção, você geralmente:

1. **Build do frontend**: `npm run build` → arquivos estáticos
2. **Serve pelo backend**: NestJS serve tanto API quanto arquivos estáticos
3. **Mesma porta**: Tudo em `http://seudominio.com`

```
Produção:
http://seudominio.com/           → Frontend (HTML/CSS/JS)
http://seudominio.com/api/...    → Backend (API REST)
```

---

## 🎯 Prevenção Futura

### Checklist para Novos Projetos React + Backend

- [ ] Adicionar `"proxy": "http://localhost:PORTA_BACKEND"` no `package.json`
- [ ] Testar chamadas API imediatamente após configurar
- [ ] Documentar portas usadas no `README.md`
- [ ] Criar script `npm run dev:full` que inicia frontend + backend
- [ ] Configurar variáveis de ambiente para produção

### Template package.json

```json
{
  "name": "meu-projeto-frontend",
  "version": "1.0.0",
  "proxy": "http://localhost:3001",
  "scripts": {
    "start": "react-scripts start",
    "dev:backend": "cd ../backend && npm run start:dev",
    "dev:full": "concurrently \"npm start\" \"npm run dev:backend\""
  },
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    ...
  }
}
```

---

## 📝 Lições Aprendidas

### O Que Deu Errado

1. ❌ **Assumimos que o erro era na rota do backend**
   - Gastamos tempo corrigindo `@Controller` decorator
   - Na verdade, o backend estava correto desde o início!

2. ❌ **Não testamos a requisição do ponto de vista do frontend**
   - Testamos `localhost:3001/api/...` (backend direto) ✅
   - Não testamos `localhost:3000/api/...` (através do proxy) ❌

### Como Diagnosticar Melhor da Próxima Vez

```bash
# 1. Testar backend direto
curl http://localhost:3001/api/sua-rota

# 2. Testar através do frontend
curl http://localhost:3000/api/sua-rota

# 3. Se resposta for diferente → problema de proxy!
```

### Sinais de Problema de Proxy

- ✅ Backend responde JSON quando chamado direto
- ❌ Frontend recebe HTML ao fazer fetch
- ❌ Erro: "Unexpected token '<'"
- ❌ Console mostra "<!DOCTYPE html>"

**Diagnóstico**: Falta configuração de proxy!

---

## ✅ Resumo Executivo

| Item | Antes | Depois |
|------|-------|--------|
| **Proxy** | ❌ Não configurado | ✅ Configurado |
| **Requisições** | Falhavam com HTML | Funcionam com JSON |
| **Erro no console** | SyntaxError | ✅ Sem erros |
| **Página Integrações** | Não carregava | ✅ Carrega normal |

### Arquivos Modificados

1. ✅ `frontend-web/package.json` - Adicionado `"proxy": "http://localhost:3001"`

### Próximos Passos

1. ✅ Reiniciar frontend
2. ✅ Testar página de integrações
3. ✅ Configurar WhatsApp Business API
4. ✅ Testar webhooks via ngrok

---

**Status Final**: ✅ **PROBLEMA RESOLVIDO**

**Autor**: GitHub Copilot  
**Data**: 11 de outubro de 2025, 14:22 BRT
