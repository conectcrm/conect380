# 🧪 Guia de Testes - Configurações de Integrações

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Testes Manuais no Navegador](#testes-manuais-no-navegador)
3. [Testes E2E com Playwright](#testes-e2e-com-playwright)
4. [Testes de API com cURL](#testes-de-api-com-curl)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### 1. Backend Rodando
```bash
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

**Servidor deve estar em:** `http://localhost:3001`

### 2. Frontend Rodando
```bash
cd C:\Projetos\conectcrm\frontend-web
npm start
```

**Aplicação deve estar em:** `http://localhost:3000`

### 3. Token de Autenticação
- Faça login no sistema
- Token será armazenado automaticamente no `localStorage`
- Verificar no console: `localStorage.getItem('authToken')`

---

## 🌐 Testes Manuais no Navegador

### Passo 1: Acessar a Página de Integrações

**URL:** `http://localhost:3000/configuracoes/integracoes`

**Validações:**
- [ ] Página carrega sem erros no console
- [ ] Título "Integrações Omnichannel" está visível
- [ ] 5 cards de integração são exibidos
- [ ] Card de segurança (Shield Alert) está presente
- [ ] Botão "Recarregar Configurações" está visível

---

### Passo 2: Testar WhatsApp Business API

#### 2.1. Preencher Formulário
```
API Token: EAAxxxxxxxxxxxxxxxxxxxxxxxx (formato Facebook)
Phone Number ID: 123456789012345
Business Account ID: 987654321098765
```

#### 2.2. Toggle Show/Hide
- [ ] Clicar no ícone de olho ao lado do API Token
- [ ] Token deve alternar entre `***` e texto visível

#### 2.3. Testar Conexão
- [ ] Clicar em "Testar Conexão"
- [ ] Spinner deve aparecer no botão
- [ ] Aguardar resposta da API (pode demorar 2-5 segundos)
- [ ] Toast de sucesso ✅ ou erro ❌ deve aparecer

**Respostas Esperadas:**

✅ **Sucesso:**
```
"Credenciais válidas! Número: +551199999999 (Verified Name: MinhaEmpresa)"
```

❌ **Erro - Credenciais Inválidas:**
```
"WhatsApp: Credenciais inválidas: Invalid OAuth access token"
```

❌ **Erro - Formato Inválido:**
```
"WhatsApp: Phone Number ID é obrigatório"
```

#### 2.4. Salvar Configuração
- [ ] Clicar em "Salvar Configuração"
- [ ] Toast de sucesso deve aparecer
- [ ] Badge "Ativo" (verde) deve aparecer no card

---

### Passo 3: Testar OpenAI

#### 3.1. Preencher Formulário
```
API Key: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx (deve começar com "sk-")
Modelo: gpt-4-turbo (ou gpt-4, gpt-3.5-turbo)
```

#### 3.2. Testar Conexão
- [ ] Clicar em "Testar Conexão"
- [ ] Sistema valida formato da API key (`sk-`)
- [ ] Sistema consulta `/v1/models` da OpenAI
- [ ] Verifica se o modelo escolhido existe

**Respostas Esperadas:**

✅ **Sucesso:**
```
"Credenciais válidas! Modelo gpt-4-turbo disponível. 50+ modelos encontrados"
```

❌ **Erro - API Key Inválida:**
```
"OpenAI: Credenciais inválidas: Incorrect API key provided"
```

❌ **Erro - Formato Inválido:**
```
"OpenAI: API Key inválida (deve começar com 'sk-')"
```

---

### Passo 4: Testar Anthropic Claude

#### 4.1. Preencher Formulário
```
API Key: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxx (deve começar com "sk-ant-")
Modelo: claude-3-5-sonnet-20241022 (ou claude-3-opus-20240229)
```

#### 4.2. Testar Conexão
- [ ] Sistema valida formato da API key (`sk-ant-`)
- [ ] Envia mensagem de teste para Anthropic
- [ ] Verifica resposta da IA

**Respostas Esperadas:**

✅ **Sucesso:**
```
"Credenciais válidas! Modelo respondendo corretamente"
```

❌ **Erro - API Key Inválida:**
```
"Anthropic: Credenciais inválidas: invalid x-api-key"
```

---

### Passo 5: Testar Telegram Bot

#### 5.1. Preencher Formulário
```
Bot Token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz (formato Telegram)
```

**Como obter Bot Token:**
1. Abrir Telegram
2. Conversar com [@BotFather](https://t.me/BotFather)
3. Comando: `/newbot`
4. Seguir instruções
5. Copiar token fornecido

#### 5.2. Testar Conexão
- [ ] Sistema consulta `https://api.telegram.org/bot{TOKEN}/getMe`
- [ ] Verifica informações do bot

**Respostas Esperadas:**

✅ **Sucesso:**
```
"Credenciais válidas! Bot: @MeuBotNome (ID: 123456789)"
```

❌ **Erro - Token Inválido:**
```
"Telegram: Credenciais inválidas: Not Found"
```

---

### Passo 6: Testar Twilio

#### 6.1. Preencher Formulário
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (começa com "AC")
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Phone Number: +5511999999999
WhatsApp Number: +5511888888888
```

#### 6.2. Testar Conexão
- [ ] Sistema valida formato do Account SID (`AC`)
- [ ] Faz autenticação Basic Auth
- [ ] Consulta API da Twilio

**Respostas Esperadas:**

✅ **Sucesso:**
```
"Credenciais válidas! Conta: Minha Empresa (Status: active)"
```

❌ **Erro - Credenciais Inválidas:**
```
"Twilio: Credenciais inválidas: Authenticate"
```

---

## 🤖 Testes E2E com Playwright

### Executar Todos os Testes
```bash
cd C:\Projetos\conectcrm
npx playwright test e2e/integracoes.spec.ts
```

### Executar com Interface Gráfica
```bash
npx playwright test e2e/integracoes.spec.ts --ui
```

### Executar com Browser Visível
```bash
npx playwright test e2e/integracoes.spec.ts --headed
```

### Executar Teste Específico
```bash
# Teste de carregamento da página
npx playwright test e2e/integracoes.spec.ts -g "deve carregar a página"

# Teste de WhatsApp
npx playwright test e2e/integracoes.spec.ts -g "WhatsApp"

# Teste de performance
npx playwright test e2e/integracoes.spec.ts -g "Performance"
```

### Relatório de Testes
```bash
npx playwright show-report
```

---

## 🔌 Testes de API com cURL

### 1. Obter Token de Autenticação
```bash
# Login
curl -X POST http://localhost:3001/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@conectcrm.com\",\"password\":\"sua_senha\"}"

# Copiar o token da resposta
```

### 2. Validar Integração WhatsApp
```bash
curl -X POST http://localhost:3001/atendimento/canais/validar ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_AQUI" ^
  -d "{\"tipo\":\"whatsapp\",\"credenciais\":{\"whatsapp_api_token\":\"EAAxxxxx\",\"whatsapp_phone_number_id\":\"123456789012345\",\"whatsapp_business_account_id\":\"987654321098765\"}}"
```

### 3. Validar Integração OpenAI
```bash
curl -X POST http://localhost:3001/atendimento/canais/validar ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_AQUI" ^
  -d "{\"tipo\":\"openai\",\"credenciais\":{\"openai_api_key\":\"sk-proj-xxxxx\",\"openai_model\":\"gpt-4\"}}"
```

### 4. Validar Integração Anthropic
```bash
curl -X POST http://localhost:3001/atendimento/canais/validar ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_AQUI" ^
  -d "{\"tipo\":\"anthropic\",\"credenciais\":{\"anthropic_api_key\":\"sk-ant-xxxxx\",\"anthropic_model\":\"claude-3-5-sonnet-20241022\"}}"
```

### 5. Validar Integração Telegram
```bash
curl -X POST http://localhost:3001/atendimento/canais/validar ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_AQUI" ^
  -d "{\"tipo\":\"telegram\",\"credenciais\":{\"telegram_bot_token\":\"1234567890:ABCdefGHIjklMNOpqrsTUVwxyz\"}}"
```

### 6. Validar Integração Twilio
```bash
curl -X POST http://localhost:3001/atendimento/canais/validar ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer SEU_TOKEN_AQUI" ^
  -d "{\"tipo\":\"twilio\",\"credenciais\":{\"twilio_account_sid\":\"ACxxxxx\",\"twilio_auth_token\":\"xxxxx\"}}"
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find name 'ValidacaoIntegracoesService'"

**Solução:**
```bash
cd C:\Projetos\conectcrm\backend
npm run build
```

Verificar se o import está presente em `atendimento.module.ts`:
```typescript
import { ValidacaoIntegracoesService } from './services/validacao-integracoes.service';
```

---

### Problema: Backend não responde ao endpoint `/validar`

**Verificações:**
1. Backend está rodando? `http://localhost:3001`
2. Endpoint registrado?
   ```bash
   # Verificar logs do NestJS no terminal
   # Deve aparecer: "Mapped {/atendimento/canais/validar, POST}"
   ```
3. Token está válido?
   ```javascript
   // No console do navegador:
   localStorage.getItem('authToken')
   ```

---

### Problema: CORS Error no navegador

**Solução:** Verificar `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
});
```

---

### Problema: "API Key inválida" mesmo com credenciais corretas

**Verificações:**

1. **WhatsApp**: Token gerado no Meta Business Suite tem permissões?
   - Acessar: https://business.facebook.com
   - Verificar permissões: `whatsapp_business_management`, `whatsapp_business_messaging`

2. **OpenAI**: API key tem créditos?
   - Verificar: https://platform.openai.com/usage
   - Verificar: https://platform.openai.com/api-keys

3. **Anthropic**: API key ativa?
   - Verificar: https://console.anthropic.com/settings/keys

4. **Telegram**: Bot token está ativo?
   - Conversar com [@BotFather](https://t.me/BotFather)
   - Comando: `/mybots` → Selecionar bot → API Token

5. **Twilio**: Credenciais corretas?
   - Verificar: https://console.twilio.com
   - Account SID e Auth Token na página principal

---

### Problema: Testes E2E falhando

**Solução 1:** Instalar browsers do Playwright
```bash
npx playwright install chromium
```

**Solução 2:** Verificar se frontend/backend estão rodando
```bash
# Terminal 1
cd backend
npm run start:dev

# Terminal 2
cd frontend-web
npm start
```

**Solução 3:** Atualizar `playwright.config.ts` com baseURL correto:
```typescript
use: {
  baseURL: 'http://localhost:3000',
  // ...
}
```

---

### Problema: Toast não aparece após salvar

**Verificações:**
1. `react-hot-toast` instalado?
   ```bash
   cd frontend-web
   npm list react-hot-toast
   ```
2. `<Toaster />` presente em `App.tsx`?
   ```tsx
   import { Toaster } from 'react-hot-toast';
   
   function App() {
     return (
       <>
         <Toaster position="top-right" />
         {/* ... resto do app */}
       </>
     );
   }
   ```

---

## 📊 Checklist de Testes Completo

### Frontend
- [ ] Página carrega sem erros
- [ ] 5 cards de integração visíveis
- [ ] Formulários aceitam input
- [ ] Toggle show/hide funciona
- [ ] Botões "Testar Conexão" funcionam
- [ ] Botões "Salvar" funcionam
- [ ] Toast notifications aparecem
- [ ] Badge "Ativo" aparece após salvar
- [ ] Botão "Recarregar" funciona
- [ ] Responsivo em mobile (< 768px)
- [ ] Links externos abrem em nova aba

### Backend
- [ ] Endpoint `/validar` responde (POST)
- [ ] Autenticação JWT funciona
- [ ] Validação WhatsApp funciona
- [ ] Validação OpenAI funciona
- [ ] Validação Anthropic funciona
- [ ] Validação Telegram funciona
- [ ] Validação Twilio funciona
- [ ] Logs aparecem no console
- [ ] Erros retornam status 200 com `success: false`
- [ ] CORS configurado corretamente

### E2E (Playwright)
- [ ] 28/28 testes passando
- [ ] Tempo de carregamento < 3s
- [ ] Sem erros no console
- [ ] Screenshots geradas em caso de falha
- [ ] Relatório HTML gerado

---

## 🎯 Métricas de Sucesso

| Métrica | Valor Esperado | Status |
|---------|----------------|--------|
| **Tempo de carregamento da página** | < 3 segundos | ⏱️ |
| **Taxa de sucesso dos testes E2E** | 100% (28/28) | 🎯 |
| **Tempo de resposta do endpoint `/validar`** | < 5 segundos | ⚡ |
| **Cobertura de integrações** | 5/5 (100%) | ✅ |
| **Compatibilidade de browsers** | Chrome, Firefox, Safari | 🌐 |

---

## 📚 Documentação Adicional

- [OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md) - Documentação técnica completa
- [E2E_TESTS_DOCS.md](./E2E_TESTS_DOCS.md) - Guia de testes E2E gerais
- [API Documentation](./API.md) - Endpoints REST disponíveis

---

**Data:** 11/10/2025  
**Versão:** 1.0.0  
**Autor:** Equipe ConectCRM
