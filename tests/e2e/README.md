# 🧪 Testes E2E - Playwright

Testes end-to-end automatizados para validar o fluxo completo do Conect CRM.

---

## 📋 **Pré-requisitos**

1. **Backend rodando**: `http://localhost:3001`
2. **Frontend rodando**: `http://localhost:3000`
3. **Navegador Chromium instalado**: `npx playwright install chromium`

---

## 🚀 **Como Executar**

### **1. Executar todos os testes (headless)**

```powershell
npm run test:e2e
```

### **2. Executar com interface visual (recomendado para debug)**

```powershell
npm run test:e2e:ui
```

### **3. Executar com navegador visível**

```powershell
npm run test:e2e:headed
```

### **4. Modo debug (pausa em cada step)**

```powershell
npm run test:e2e:debug
```

### **5. Ver relatório HTML dos últimos testes**

```powershell
npm run test:e2e:report
```

---

## 📁 **Estrutura dos Testes**

```
tests/e2e/
├── auth.spec.ts         # Autenticação e Login (6 testes)
├── tickets.spec.ts      # Tickets e Mensagens (6 testes)
└── websocket.spec.ts    # WebSocket Tempo Real (4 testes)
```

### **Total: 16 testes E2E**

---

## 🧪 **Casos de Teste**

### **auth.spec.ts** (Autenticação)

| # | Teste | Descrição |
|---|-------|-----------|
| 1 | Carregar página de login | Verifica campos email, senha e botão |
| 2 | Erro com credenciais inválidas | Valida mensagem de erro |
| 3 | Login com sucesso | Verifica redirecionamento e token JWT |
| 4 | Persistir autenticação após reload | Token permanece no localStorage |
| 5 | Logout com sucesso | Remove token e redireciona para login |
| 6 | Bloquear acesso sem autenticação | Redireciona para login |

### **tickets.spec.ts** (Tickets e Mensagens)

| # | Teste | Descrição |
|---|-------|-----------|
| 1 | Carregar lista de tickets | Verifica presença da lista |
| 2 | Filtrar tickets por status | Testa filtros (Abertos, Pendentes, Fechados) |
| 3 | Selecionar ticket e carregar mensagens | Valida carregamento do histórico |
| 4 | Enviar mensagem em um ticket | Envia mensagem e verifica aparição |
| 5 | Exibir histórico de mensagens | Conta mensagens carregadas |
| 6 | Navegar entre múltiplos tickets | Alterna entre tickets diferentes |

### **websocket.spec.ts** (Tempo Real)

| # | Teste | Descrição |
|---|-------|-----------|
| 1 | Conectar WebSocket | Verifica badge de conexão (Wifi icon) |
| 2 | **Receber mensagem em tempo real** | 2 navegadores, mensagem instantânea |
| 3 | **Indicador "digitando..."** | Usuário 1 digita, Usuário 2 vê indicador |
| 4 | Manter conexão após reload | WebSocket reconecta automaticamente |

---

## 🎯 **Fluxo do Teste WebSocket (Mais Importante)**

```
┌─────────────┐                  ┌─────────────┐
│  Navegador 1│                  │  Navegador 2│
│  (Usuário 1)│                  │  (Usuário 2)│
└──────┬──────┘                  └──────┬──────┘
       │                                │
       │ 1. Login                       │ 1. Login
       ├───────────────────────────────>├
       │                                │
       │ 2. Selecionar Ticket A         │ 2. Selecionar Ticket A
       ├───────────────────────────────>├
       │                                │
       │ 3. Enviar mensagem             │
       ├────────────────────────────────┤
       │           WebSocket            │
       │         ┌──────────┐           │
       │         │ Backend  │           │
       │         │ Gateway  │           │
       │         └────┬─────┘           │
       │              │                 │
       │              └────────────────>│ 4. Recebe mensagem
       │                                │    INSTANTANEAMENTE! ✅
```

---

## ⚙️ **Configuração**

### **playwright.config.ts**

- **Timeout por teste**: 30 segundos
- **Workers**: 1 (serial, evita conflitos WebSocket)
- **Retry**: 2x apenas no CI
- **Reporter**: HTML + JSON + Lista

### **Variáveis de Ambiente**

```env
FRONTEND_URL=http://localhost:3000  # URL do frontend
```

---

## 📊 **Relatórios**

Após executar os testes, os relatórios são gerados em:

```
playwright-report/
├── index.html         # Relatório visual (abrir no navegador)
├── results.json       # Resultados em JSON
└── screenshots/       # Screenshots de falhas
```

### **Ver relatório:**

```powershell
npm run test:e2e:report
```

---

## 🐛 **Debug de Testes**

### **1. Ver o que está acontecendo**

```powershell
npm run test:e2e:headed
```

### **2. Pausar em cada passo**

```powershell
npm run test:e2e:debug
```

### **3. Executar apenas um arquivo**

```powershell
npx playwright test auth.spec.ts
```

### **4. Executar apenas um teste específico**

```powershell
npx playwright test -g "deve fazer login com sucesso"
```

### **5. Ver console.log dos testes**

Os `console.log()` dentro dos testes aparecem no terminal durante a execução.

---

## ✅ **Checklist de Validação**

Após executar `npm run test:e2e`, verifique:

- [ ] **16 testes passaram** (ou pelo menos 12+)
- [ ] **0 testes falharam**
- [ ] **Relatório HTML gerado** (`playwright-report/index.html`)
- [ ] **Screenshots apenas de falhas** (se houver)
- [ ] **Tempo total < 2 minutos**

---

## 🔧 **Troubleshooting**

### **Problema: "Timeout exceeded"**

**Causa**: Backend ou frontend não está rodando

**Solução**:
```powershell
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend-web
npm start

# Terminal 3: Testes
npm run test:e2e
```

---

### **Problema: "Browser not found"**

**Causa**: Chromium não instalado

**Solução**:
```powershell
npx playwright install chromium
```

---

### **Problema: "Cannot find module '@playwright/test'"**

**Causa**: Dependência não instalada

**Solução**:
```powershell
npm install
```

---

### **Problema: "WebSocket test failed"**

**Causa**: WebSocket não está propagando mensagens

**Debug**:
1. Verificar se `AtendimentoGateway` está ativo
2. Abrir console do navegador (F12)
3. Ver erros de WebSocket
4. Verificar URL do WebSocket: `ws://localhost:3001/atendimento`

---

## 📈 **CI/CD Integration**

Para executar no GitHub Actions:

```yaml
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install chromium
    npm run test:e2e
```

---

## 🎉 **Próximos Passos**

Após validar todos os testes:

1. ✅ **FASE 5.4: Docker e CI/CD**
   - Criar Dockerfiles
   - Configurar docker-compose
   - Setup GitHub Actions
   - Deploy automatizado

---

## 📞 **Suporte**

Se encontrar problemas:

1. Execute com `--headed` para ver o navegador
2. Verifique logs do backend e frontend
3. Use `--debug` para pausar e inspecionar
4. Veja screenshots em `playwright-report/`

---

**Documentação Playwright**: https://playwright.dev/
