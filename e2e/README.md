# 🧪 Testes E2E - ConectCRM

Testes End-to-End (E2E) usando **Playwright** para validar o fluxo completo do sistema.

## 📊 Resumo

- **36 testes** implementados
- **4 categorias**: Autenticação, WebSocket, API REST, IA/Chatbot
- **Cobertura**: Fluxo completo do sistema

## 🚀 Quick Start

### Executar todos os testes
```bash
npx playwright test
```

### Executar categoria específica
```bash
npx playwright test auth.spec.ts
npx playwright test chat-realtime.spec.ts
npx playwright test api-rest.spec.ts
npx playwright test ia-integration.spec.ts
```

### Modo debug
```bash
npx playwright test --ui
npx playwright test --debug
```

### Ver relatório
```bash
npx playwright show-report
```

## 📁 Estrutura

```
e2e/
├── fixtures.ts              # Helpers e fixtures customizadas
├── auth.spec.ts             # 8 testes de autenticação
├── chat-realtime.spec.ts    # 10 testes de WebSocket
├── api-rest.spec.ts         # 10 testes de API REST
└── ia-integration.spec.ts   # 8 testes de IA/Chatbot
```

## 📝 Categorias de Teste

### 1. auth.spec.ts (8 testes)
- Login/logout
- Validações
- Sessão persistente
- Proteção de rotas

### 2. chat-realtime.spec.ts (10 testes)
- Conexão WebSocket
- Envio/recebimento de mensagens
- Indicadores (online, digitando...)
- Filtros de tickets

### 3. api-rest.spec.ts (10 testes)
- Autenticação via API
- CRUD de tickets e mensagens
- Validações de payload
- Endpoints de IA

### 4. ia-integration.spec.ts (8 testes)
- Geração de respostas automáticas
- Cache de respostas
- Detecção de atendimento humano
- Integração completa IA + Chat

## 🔧 Fixtures Disponíveis

```typescript
// Usuários de teste
test('exemplo', async ({ adminUser, atendenteUser }) => {
  // adminUser = { email: 'admin@conectcrm.com', senha: 'admin123' }
  // atendenteUser = { email: 'atendente@conectcrm.com', senha: 'atend123' }
});

// Página já autenticada
test('exemplo', async ({ authenticatedPage }) => {
  // Já está logado como admin!
  await authenticatedPage.goto('/dashboard');
});
```

## 🛠️ Helpers Úteis

```typescript
import { 
  login,
  waitForWebSocketConnection,
  createTestTicket,
  makeAuthenticatedRequest 
} from './fixtures';

// Login manual
await login(page, 'email@test.com', 'senha');

// Aguardar WebSocket conectar
await waitForWebSocketConnection(page, 10000);

// Request autenticada
const result = await makeAuthenticatedRequest(
  page,
  'http://localhost:3001/tickets',
  'GET'
);
```

## 📖 Documentação Completa

Para documentação detalhada, consulte:
- [docs/E2E_TESTS_DOCS.md](../docs/E2E_TESTS_DOCS.md) - Guia completo
- [docs/TASK_8_TESTES_E2E_RESUMO.md](../docs/TASK_8_TESTES_E2E_RESUMO.md) - Resumo da implementação

## ⚙️ Configuração

### Variáveis de Ambiente (opcional)

Crie `.env.test`:
```env
API_URL=http://localhost:3001
TEST_ADMIN_EMAIL=admin@conectcrm.com
TEST_ADMIN_PASSWORD=admin123
```

### Requisitos

- Backend rodando em `http://localhost:3001`
- Frontend rodando em `http://localhost:3000`
- Node.js 18+

## 🐛 Debug

### Ver logs detalhados
```bash
DEBUG=pw:api npx playwright test
```

### Gerar código automaticamente
```bash
npx playwright codegen http://localhost:3000
```

### Ver trace de teste
```bash
npx playwright show-trace test-results/.../trace.zip
```

## 🚦 CI/CD

Testes rodam automaticamente em:
- Push para `main`/`master`
- Pull Requests

Arquivo: `.github/workflows/playwright.yml`

## ✅ Boas Práticas

1. **Use fixtures** para evitar repetição
2. **Use seletores robustos** (`data-testid`, `hasText`)
3. **Aguarde elementos** antes de interagir
4. **Use `test.skip()`** para testes condicionais
5. **Adicione logs** para debug (`console.log`)

## 📊 Métricas

| Categoria | Testes | Cobertura |
|-----------|--------|-----------|
| Autenticação | 8 | Login, logout, validações |
| WebSocket | 10 | Conexão, mensagens, indicadores |
| API REST | 10 | Endpoints, auth, validação |
| IA/Chatbot | 8 | Respostas, cache, integração |
| **Total** | **36** | ✅ Fluxo completo |

## 🔗 Links Úteis

- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**✅ Testes prontos para uso!** 🚀
