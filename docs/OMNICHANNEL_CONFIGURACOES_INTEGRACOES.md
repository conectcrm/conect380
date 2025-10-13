# 🔧 Configurações de Integrações - Sistema Omnichannel

## 📍 **Onde Ficam as Configurações?**

### **1. 🗄️ Banco de Dados - Tabela Principal**

```sql
-- Tabela: atendimento_integracoes_config
-- Armazena todas as configurações de integrações por empresa

CREATE TABLE atendimento_integracoes_config (
    id UUID PRIMARY KEY,
    empresa_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'whatsapp', 'telegram', 'email', 'openai', 'anthropic'
    ativo BOOLEAN DEFAULT FALSE,
    credenciais JSONB, -- Chaves de API, tokens, etc
    webhook_secret VARCHAR(255),
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);
```

**Entity TypeORM:**
```typescript
// backend/src/modules/atendimento/entities/integracoes-config.entity.ts

@Entity('atendimento_integracoes_config')
export class IntegracoesConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @Column({ name: 'tipo', length: 50 })
  tipo: string; // 'whatsapp', 'openai', 'anthropic', etc

  @Column({ name: 'ativo', default: false })
  ativo: boolean;

  @Column({ name: 'credenciais', type: 'jsonb', nullable: true })
  credenciais: Record<string, any>;

  @Column({ name: 'webhook_secret', length: 255, nullable: true })
  webhookSecret: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
```

---

## 🔌 **2. Tipos de Integrações e Credenciais**

### **A) WhatsApp Business API**

**Credenciais necessárias:**
```json
{
  "tipo": "whatsapp",
  "ativo": true,
  "credenciais": {
    "whatsapp_api_token": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "whatsapp_phone_number_id": "123456789012345",
    "whatsapp_business_account_id": "123456789012345",
    "whatsapp_webhook_verify_token": "seu-token-secreto-webhook-aqui"
  }
}
```

**Onde obter:**
- **Facebook Developer Console**: https://developers.facebook.com/apps
- **WhatsApp Business API**: https://business.facebook.com/wa/manage/phone-numbers/

**Código usado:**
```typescript
// backend/src/modules/atendimento/channels/adapters/whatsapp-business-api.adapter.ts

const { whatsapp_api_token, whatsapp_phone_number_id } = config.credenciais;

await axios.post(
  `https://graph.facebook.com/v21.0/${whatsapp_phone_number_id}/messages`,
  payload,
  {
    headers: {
      'Authorization': `Bearer ${whatsapp_api_token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

---

### **B) OpenAI (IA/Chatbot)**

**Credenciais necessárias:**
```json
{
  "tipo": "ia_config",
  "credenciais": {
    "ia_provider": "openai",
    "openai_api_key": "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "openai_model": "gpt-4o-mini",
    "openai_max_tokens": 2000,
    "openai_temperature": 0.7
  }
}
```

**Onde obter:**
- **OpenAI Platform**: https://platform.openai.com/api-keys

**Variáveis de ambiente (fallback):**
```bash
# backend/.env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

**Código usado:**
```typescript
// backend/src/modules/atendimento/ai/services/ai.service.ts

if (iaConfig.ia_provider === 'openai' && iaConfig.openai_api_key) {
  return new OpenAIProvider(
    iaConfig.openai_api_key,
    iaConfig.openai_model || 'gpt-4o-mini'
  );
}
```

---

### **C) Anthropic Claude (IA alternativa)**

**Credenciais necessárias:**
```json
{
  "tipo": "ia_config",
  "credenciais": {
    "ia_provider": "anthropic",
    "anthropic_api_key": "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "anthropic_model": "claude-3-5-sonnet-20241022",
    "anthropic_max_tokens": 2000
  }
}
```

**Onde obter:**
- **Anthropic Console**: https://console.anthropic.com/

**Variáveis de ambiente (fallback):**
```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=2000
```

---

### **D) Telegram Bot**

**Credenciais necessárias:**
```json
{
  "tipo": "telegram",
  "ativo": true,
  "credenciais": {
    "telegram_bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz012345678"
  }
}
```

**Onde obter:**
- **@BotFather no Telegram**: Envie `/newbot` e siga instruções

---

### **E) Twilio (SMS + WhatsApp)**

**Credenciais necessárias:**
```json
{
  "tipo": "twilio",
  "ativo": true,
  "credenciais": {
    "twilio_account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "twilio_auth_token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "twilio_phone_number": "+5511999999999",
    "twilio_whatsapp_number": "whatsapp:+14155238886"
  }
}
```

**Onde obter:**
- **Twilio Console**: https://www.twilio.com/console

---

## 📡 **3. Endpoints da API Backend**

### **🔹 Listar Canais Configurados**
```http
GET /api/atendimento/canais
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "WhatsApp Principal",
      "tipo": "whatsapp",
      "ativo": true,
      "empresaId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### **🔹 Criar Novo Canal**
```http
POST /api/atendimento/canais
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "WhatsApp Principal",
  "tipo": "whatsapp",
  "config": {
    "credenciais": {
      "whatsapp_api_token": "EAAxxxxxxxxx",
      "whatsapp_phone_number_id": "123456789012345"
    }
  }
}
```

### **🔹 Atualizar Canal**
```http
PUT /api/atendimento/canais/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "ativo": true,
  "config": {
    "credenciais": {
      "whatsapp_api_token": "EAAxxxxxxxxx"
    }
  }
}
```

### **🔹 Webhook WhatsApp (receber mensagens)**
```http
POST /api/webhooks/whatsapp/:empresaId
Content-Type: application/json
X-Hub-Signature-256: sha256=xxxxx

{
  "object": "whatsapp_business_account",
  "entry": [...]
}
```

---

## 🖥️ **4. Interface Frontend (PLANEJADO)**

### **📍 Localização Planejada:**
```
/atendimento/configuracoes
ou
/configuracoes/omnichannel
```

### **🎨 Estrutura da Página (Planejado):**

```tsx
// frontend-web/src/pages/atendimento/ConfiguracoesIntegracoes.tsx

export function ConfiguracoesIntegracoes() {
  const [integracoes, setIntegracoes] = useState<IntegracoesConfig[]>([]);
  
  return (
    <div className="p-6">
      <h1>🔧 Configurações de Integrações</h1>
      
      {/* Card WhatsApp */}
      <Card>
        <CardHeader>
          <h3>📱 WhatsApp Business API</h3>
        </CardHeader>
        <CardContent>
          <Input 
            label="Phone Number ID"
            value={whatsappConfig.phone_number_id}
            onChange={...}
          />
          <Input 
            label="Access Token"
            type="password"
            value={whatsappConfig.api_token}
            onChange={...}
          />
          <Button onClick={salvarWhatsApp}>Salvar</Button>
          <Button onClick={testarWhatsApp}>Testar Conexão</Button>
        </CardContent>
      </Card>

      {/* Card OpenAI */}
      <Card>
        <CardHeader>
          <h3>🤖 OpenAI (IA/Chatbot)</h3>
        </CardHeader>
        <CardContent>
          <Input 
            label="API Key"
            type="password"
            value={openaiConfig.api_key}
            onChange={...}
          />
          <Select 
            label="Modelo"
            value={openaiConfig.model}
            options={['gpt-4o', 'gpt-4o-mini', 'gpt-4']}
          />
          <Button onClick={salvarOpenAI}>Salvar</Button>
        </CardContent>
      </Card>

      {/* Card Anthropic Claude */}
      <Card>
        <CardHeader>
          <h3>🧠 Anthropic Claude</h3>
        </CardHeader>
        <CardContent>
          <Input 
            label="API Key"
            type="password"
            value={anthropicConfig.api_key}
            onChange={...}
          />
          <Select 
            label="Modelo"
            value={anthropicConfig.model}
            options={['claude-3-5-sonnet', 'claude-3-opus']}
          />
          <Button onClick={salvarAnthropic}>Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔐 **5. Segurança e Boas Práticas**

### **✅ FAZER:**
1. **Armazenar credenciais no banco de dados** (campo JSONB criptografado)
2. **Usar variáveis de ambiente como fallback** (backend/.env)
3. **Validar tokens antes de salvar**
4. **Implementar rate limiting** para endpoints de configuração
5. **Usar HTTPS** para todas as requisições
6. **Implementar webhook signature validation** (WhatsApp)

### **❌ NÃO FAZER:**
1. **Nunca** commitar chaves de API no GitHub
2. **Nunca** expor credenciais em logs
3. **Nunca** armazenar em plaintext no frontend
4. **Nunca** compartilhar tokens entre empresas

### **🔒 Criptografia Recomendada:**
```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

// Criptografar antes de salvar no banco
function encryptCredentials(data: any): string {
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  return cipher.update(JSON.stringify(data), 'utf8', 'hex') + cipher.final('hex');
}

// Descriptografar ao buscar do banco
function decryptCredentials(encrypted: string): any {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  return JSON.parse(decrypted);
}
```

---

## 📚 **6. Documentação Oficial das APIs**

| Serviço | Documentação | Como Obter Credenciais |
|---------|-------------|------------------------|
| **WhatsApp Business** | [Meta Developers](https://developers.facebook.com/docs/whatsapp) | [Console](https://developers.facebook.com/apps) |
| **OpenAI** | [OpenAI Docs](https://platform.openai.com/docs) | [API Keys](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | [Anthropic Docs](https://docs.anthropic.com/) | [Console](https://console.anthropic.com/) |
| **Telegram** | [Bot API](https://core.telegram.org/bots/api) | @BotFather no Telegram |
| **Twilio** | [Twilio Docs](https://www.twilio.com/docs) | [Console](https://www.twilio.com/console) |

---

## 🚀 **7. Exemplo Prático - Configurar WhatsApp**

### **Passo 1: Obter Credenciais no Facebook**
1. Acesse: https://developers.facebook.com/apps
2. Crie um novo app → Tipo: "Business"
3. Adicione o produto "WhatsApp"
4. Configure um número de telefone
5. Copie:
   - **Phone Number ID** (ex: 123456789012345)
   - **Access Token** (ex: EAAxxxxxxxxx)
   - **Webhook Verify Token** (crie um aleatório)

### **Passo 2: Inserir no Banco de Dados**
```sql
INSERT INTO atendimento_integracoes_config (
  id, empresa_id, tipo, ativo, credenciais, webhook_secret
) VALUES (
  gen_random_uuid(),
  'sua-empresa-uuid',
  'whatsapp',
  true,
  '{
    "whatsapp_api_token": "EAAxxxxxxxxx",
    "whatsapp_phone_number_id": "123456789012345",
    "whatsapp_webhook_verify_token": "meu-token-secreto-123"
  }'::jsonb,
  'webhook-secret-256-bits'
);
```

### **Passo 3: Configurar Webhook no Facebook**
1. Vá em WhatsApp → Configuration → Webhook
2. **Callback URL**: `https://seu-dominio.com/api/webhooks/whatsapp/sua-empresa-uuid`
3. **Verify Token**: `meu-token-secreto-123` (mesmo do banco)
4. **Webhook Fields**: `messages`, `message_status`
5. Clique em "Verify and Save"

### **Passo 4: Testar**
```bash
# Enviar mensagem de teste via API
curl -X POST https://seu-backend.com/api/atendimento/canais/test \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "canalId": "canal-uuid",
    "destinatario": "+5511999999999",
    "mensagem": "Teste de integração WhatsApp!"
  }'
```

---

## ✅ **8. Checklist de Configuração**

### **WhatsApp Business API**
- [ ] Criar app no Facebook Developers
- [ ] Adicionar produto WhatsApp
- [ ] Configurar número de telefone
- [ ] Obter Phone Number ID
- [ ] Obter Access Token
- [ ] Criar Webhook Verify Token
- [ ] Inserir credenciais no banco
- [ ] Configurar webhook no Facebook
- [ ] Testar envio de mensagem
- [ ] Testar recebimento de mensagem

### **OpenAI**
- [ ] Criar conta na OpenAI
- [ ] Gerar API Key
- [ ] Inserir no banco ou .env
- [ ] Escolher modelo (gpt-4o-mini recomendado)
- [ ] Configurar max_tokens e temperature
- [ ] Testar geração de resposta

### **Anthropic Claude**
- [ ] Criar conta na Anthropic
- [ ] Gerar API Key
- [ ] Inserir no banco ou .env
- [ ] Escolher modelo (claude-3-5-sonnet recomendado)
- [ ] Testar geração de resposta

---

## 🎯 **Próximos Passos**

1. ✅ **Backend já pronto** - Entity e controllers criados
2. ⏳ **Frontend pendente** - Criar página de configurações UI
3. ⏳ **Documentação** - Adicionar guias de configuração para cada serviço
4. ⏳ **Testes** - Criar testes E2E para fluxo de configuração
5. ⏳ **Validação** - Implementar validação de credenciais antes de salvar

---

## 📞 **Suporte**

Se precisar de ajuda para configurar alguma integração:

- **Documentação interna**: `/docs/OMNICHANNEL_*.md`
- **Logs do sistema**: `backend/logs/`
- **Testes**: `backend/test-*.js`

---

**Última atualização**: 11 de outubro de 2025  
**Versão**: 1.0.0
