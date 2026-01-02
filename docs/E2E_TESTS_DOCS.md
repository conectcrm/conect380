# 📋 Documentação de Testes E2E - ConectCRM

## 📌 Visão Geral

Este documento descreve os testes End-to-End (E2E) do sistema ConectCRM usando **Playwright**.

Os testes validam o fluxo completo:
- ✅ Autenticação e segurança
- ✅ Chat em tempo real (WebSocket)
- ✅ API REST
- ✅ Integração com IA/Chatbot

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- Backend rodando em `http://localhost:3001`
- Frontend rodando em `http://localhost:3000`

### Instalar Playwright

```bash
npm init playwright@latest --yes
```

Isso irá:
- Instalar `@playwright/test`
- Baixar browsers (Chromium, Firefox, WebKit)
- Criar estrutura de testes em `e2e/`
- Configurar GitHub Actions (`.github/workflows/playwright.yml`)

---

## 📂 Estrutura de Testes

```
e2e/
├── fixtures.ts              # Helpers e fixtures customizadas
├── auth.spec.ts             # Testes de autenticação (8 testes)
├── chat-realtime.spec.ts    # Testes de WebSocket (10 testes)
├── api-rest.spec.ts         # Testes de API REST (10 testes)
├── ia-integration.spec.ts   # Testes de IA/Chatbot (8 testes)
└── example.spec.ts          # Exemplo do Playwright (pode deletar)

playwright.config.ts         # Configuração global
playwright-report/           # Relatórios HTML (gerado após testes)
```

---

## ⚙️ Configuração

### `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  fullyParallel: false,      // ⚠️ Crítico para WebSocket
  workers: 1,                // Apenas 1 worker para evitar conflitos
  
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Por que `workers: 1` e `fullyParallel: false`?**

Testes de WebSocket não podem rodar em paralelo porque:
- Compartilham mesma conexão WebSocket
- Podem causar race conditions
- Mensagens podem cruzar entre testes

---

## 🧪 Fixtures Customizadas

### `e2e/fixtures.ts`

Fornece helpers para os testes:

#### 1. **Usuários de Teste**

```typescript
test('deve fazer login como admin', async ({ adminUser }) => {
  // adminUser = { email: 'admin@conectsuite.com.br', senha: 'admin123' }
});

test('deve fazer login como atendente', async ({ atendenteUser }) => {
  // atendenteUser = { email: 'atendente@conectcrm.com', senha: 'atend123' }
});
```

#### 2. **Página Autenticada**

```typescript
test('deve acessar dashboard', async ({ authenticatedPage }) => {
  // Já está logado automaticamente!
  await authenticatedPage.goto('/dashboard');
});
```

#### 3. **Helpers**

```typescript
// Login manual
await login(page, 'admin@test.com', 'senha123');

// Aguardar WebSocket conectar
await waitForWebSocketConnection(page, 10000);

// Criar ticket de teste
await createTestTicket(page, { titulo: 'Teste', status: 'aberto' });

// Fazer requisição autenticada
const result = await makeAuthenticatedRequest(
  page,
  'http://localhost:3001/tickets',
  'GET'
);
```

---

## 📝 Testes Disponíveis

### 1. **auth.spec.ts** - Autenticação (8 testes)

| Teste | Descrição |
|-------|-----------|
| `deve carregar página de login` | Verifica se inputs estão visíveis |
| `deve fazer login com credenciais válidas` | Login + token JWT no localStorage |
| `deve mostrar erro com credenciais inválidas` | Exibe mensagem de erro |
| `deve validar campos obrigatórios` | Campos vazios bloqueiam submit |
| `deve redirecionar se já autenticado` | Redireciona `/login` → `/dashboard` |
| `deve fazer logout com sucesso` | Limpa token e redireciona |
| `deve bloquear rotas protegidas` | Redireciona para login se não autenticado |
| `deve manter sessão após refresh` | Token persiste no localStorage |

---

### 2. **chat-realtime.spec.ts** - WebSocket (10 testes)

| Teste | Descrição |
|-------|-----------|
| `deve carregar página de atendimento` | Página renderiza corretamente |
| `deve conectar ao WebSocket automaticamente` | Flag `wsConnected = true` |
| `deve exibir lista de tickets` | Lista de tickets aparece |
| `deve selecionar ticket e exibir mensagens` | Clica ticket → mostra histórico |
| `deve enviar mensagem via WebSocket` | Envia e aparece na lista |
| `deve exibir indicador "digitando..."` | Mostra quando alguém está digitando |
| `deve receber mensagem em tempo real` | Simula recebimento via WebSocket |
| `deve exibir indicador offline` | Mostra "desconectado" quando WebSocket cai |
| `deve filtrar tickets por status` | Filtro "aberto", "fechado" funciona |

**Como funciona o monitoring de WebSocket:**

```typescript
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    (window as any).wsConnected = false;
    (window as any).wsMessages = [];
    
    // Override window.WebSocket para interceptar eventos
    const original = window.WebSocket;
    window.WebSocket = class extends original {
      constructor(url, protocols) {
        super(url, protocols);
        
        this.addEventListener('open', () => {
          (window as any).wsConnected = true;
        });
        
        this.addEventListener('message', (event) => {
          (window as any).wsMessages.push(event.data);
        });
      }
    };
  });
});
```

---

### 3. **api-rest.spec.ts** - API REST (10 testes)

| Teste | Descrição |
|-------|-----------|
| `deve autenticar via API` | POST `/auth/login` → token JWT |
| `deve retornar erro 401 com credenciais inválidas` | Autenticação falha |
| `deve listar tickets autenticado` | GET `/tickets` com token |
| `deve bloquear acesso sem autenticação` | 401 sem token |
| `deve criar mensagem via API` | POST `/mensagens` |
| `deve listar mensagens de um ticket` | GET `/mensagens?ticketId=...` |
| `deve obter estatísticas da IA` | GET `/ia/stats` |
| `deve validar formato de dados` | Dados inválidos → erro 400 |
| `deve retornar perfil do usuário` | GET `/users/me` |
| `deve listar eventos do sistema` | GET `/eventos` |

---

### 4. **ia-integration.spec.ts** - IA/Chatbot (8 testes)

| Teste | Descrição |
|-------|-----------|
| `deve verificar status da IA` | GET `/ia/status` |
| `deve gerar resposta automática` | POST `/ia/resposta` → resposta gerada |
| `deve detectar necessidade de atendimento humano` | Baixa confiança → transferir |
| `deve usar cache de respostas` | Perguntas frequentes → cache |
| `deve retornar fallback quando IA indisponível` | Graceful degradation |
| `deve processar múltiplas mensagens` | Histórico de conversação |
| `deve validar entrada de dados` | Payload inválido → erro 400 |
| `deve integrar IA com chat em tempo real` | Fluxo completo UI → IA → resposta |

**Exemplo de request para IA:**

```json
POST http://localhost:3001/ia/resposta
{
  "ticketId": "abc123",
  "historico": [
    { "role": "user", "content": "Como funciona o sistema?" }
  ],
  "contexto": {
    "clienteNome": "João Silva",
    "ticketStatus": "aberto"
  }
}
```

**Resposta esperada:**

```json
{
  "resposta": "O sistema ConectCRM funciona...",
  "confianca": 0.85,
  "transferirParaHumano": false,
  "provider": "openai"
}
```

---

## 🎯 Como Executar Testes

### Executar Todos os Testes

```bash
npx playwright test
```

### Executar Arquivo Específico

```bash
npx playwright test auth.spec.ts
npx playwright test chat-realtime.spec.ts
npx playwright test api-rest.spec.ts
npx playwright test ia-integration.spec.ts
```

### Executar Teste Específico

```bash
npx playwright test -g "deve fazer login com credenciais válidas"
```

### Modo Debug (UI Mode)

```bash
npx playwright test --ui
```

Abre interface gráfica interativa.

### Modo Debug (Passo a Passo)

```bash
npx playwright test --debug
```

Abre Playwright Inspector.

### Executar em Browser Visível

```bash
npx playwright test --headed
```

---

## 📊 Relatórios

### Ver Relatório HTML

```bash
npx playwright show-report
```

Abre relatório HTML em `playwright-report/index.html`.

### Relatório JSON

```bash
cat playwright-report/results.json
```

---

## 🐛 Debug e Troubleshooting

### Ver Logs Detalhados

```bash
DEBUG=pw:api npx playwright test
```

### Capturar Screenshot

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Capturar Vídeo

```typescript
// Vídeos são salvos automaticamente em test-results/
// quando teste falha (configurado em playwright.config.ts)
```

### Ver Trace

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Verificar Seletores

```bash
npx playwright codegen http://localhost:3000
```

Abre browser e gera código automaticamente.

---

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Crie `.env.test`:

```env
API_URL=http://localhost:3001
TEST_ADMIN_EMAIL=admin@conectsuite.com.br
TEST_ADMIN_PASSWORD=admin123
TEST_ATENDENTE_EMAIL=atendente@conectcrm.com
TEST_ATENDENTE_PASSWORD=atend123
```

### Carregar no Teste

```typescript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const API_URL = process.env.API_URL || 'http://localhost:3001';
```

---

## 🚦 CI/CD - GitHub Actions

Arquivo: `.github/workflows/playwright.yml`

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Start Backend
        run: npm run start:backend &
        
      - name: Start Frontend
        run: npm run start:frontend &
      
      - name: Wait for services
        run: npx wait-on http://localhost:3000 http://localhost:3001
      
      - name: Run Playwright tests
        run: npx playwright test
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Como Criar Novos Testes

### 1. Criar arquivo `e2e/meu-teste.spec.ts`

```typescript
import { test, expect } from './fixtures';

test.describe('Minha Feature', () => {
  test('deve fazer algo', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/minha-pagina');
    
    const button = authenticatedPage.locator('button:has-text("Clique")');
    await button.click();
    
    await expect(authenticatedPage.locator('text=Sucesso')).toBeVisible();
  });
});
```

### 2. Executar teste

```bash
npx playwright test meu-teste.spec.ts
```

### 3. Adicionar ao CI/CD

Testes são executados automaticamente em pull requests.

---

## ✅ Boas Práticas

### ✅ Use Fixtures

```typescript
// ❌ Ruim
test('deve fazer login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'senha');
  await page.click('button[type="submit"]');
  // ... resto do teste
});

// ✅ Bom
test('deve acessar dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Já está logado!
});
```

### ✅ Use Seletores Robustos

```typescript
// ❌ Ruim (frágil)
await page.click('.btn-primary');

// ✅ Bom (robusto)
await page.click('button[data-testid="submit-button"]');
await page.click('button:has-text("Enviar")');
```

### ✅ Aguarde Elementos

```typescript
// ❌ Ruim
await page.click('button');

// ✅ Bom
await page.waitForSelector('button', { state: 'visible' });
await page.click('button');
```

### ✅ Use test.skip() para Testes Condicionais

```typescript
test('deve fazer algo', async ({ page }) => {
  const feature = await page.locator('.feature').count();
  
  if (feature === 0) {
    console.log('⚠️ Feature não disponível');
    test.skip();
    return;
  }
  
  // ... resto do teste
});
```

---

## 📊 Métricas dos Testes

| Categoria | Qtd | Cobertura |
|-----------|-----|-----------|
| Autenticação | 8 testes | Login, logout, sessão, validações |
| WebSocket | 10 testes | Conexão, mensagens, indicadores |
| API REST | 10 testes | Endpoints, autenticação, validação |
| IA/Chatbot | 8 testes | Respostas, cache, fallback, integração |
| **Total** | **36 testes** | ✅ Fluxo completo validado |

---

## 🔗 Links Úteis

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)

---

## 📞 Suporte

Se tiver dúvidas sobre os testes:

1. Consulte a [documentação do Playwright](https://playwright.dev)
2. Veja exemplos em `e2e/*.spec.ts`
3. Use `npx playwright codegen` para gerar código

---

**✅ Testes E2E configurados e prontos para uso!**
