# 🔌 Padrão de Integrações - ConectCRM

## ⚠️ REGRA FUNDAMENTAL

**O banco de dados (`atendimento_integracoes_config`) é a ÚNICA fonte de verdade para credenciais de integrações.**

❌ **NÃO USE** `process.env` para credenciais de integrações (WhatsApp, Meta, Instagram, etc.)  
❌ **NÃO USE** `configService.get('WHATSAPP_*')`  
✅ **USE** `WhatsAppConfigService.getCredentials(empresaId)`

## 🎯 Por Que Essa Mudança?

### Problema do Padrão Antigo

```typescript
// ❌ PADRÃO ANTIGO (ERRADO)
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Problemas:
// 1. Credenciais fixas no .env não suportam multi-tenant
// 2. Múltiplos clientes compartilham as mesmas credenciais (GRAVE!)
// 3. Atualizar credenciais requer restart do backend
// 4. Credenciais ficam duplicadas (banco + .env)
// 5. Sincronização manual propensa a erros
```

### Solução: Banco de Dados como Fonte Única

```typescript
// ✅ NOVO PADRÃO (CORRETO)
const credentials = await this.whatsappConfigService.getCredentials(empresaId);
const token = credentials.accessToken;
const phoneId = credentials.phoneNumberId;

// Vantagens:
// 1. Cada empresa tem suas próprias credenciais (multi-tenant)
// 2. Atualizar credenciais em tempo real (sem restart)
// 3. Fonte única de verdade (sem duplicação)
// 4. Validações centralizadas
// 5. Cache inteligente por empresa (5 minutos TTL)
```

## 📐 Arquitetura

```
┌─────────────────────┐
│   Frontend Web      │
│ (Tela Integrações)  │
└──────────┬──────────┘
           │ POST /integracoes
           ▼
┌─────────────────────────────────────┐
│     Backend API                     │
│  ┌──────────────────────────────┐  │
│  │ IntegracoesController         │  │
│  └────────────┬─────────────────┘  │
│               │                     │
│  ┌────────────▼─────────────────┐  │
│  │ WhatsAppConfigService         │  │◄─── ÚNICA FONTE DE VERDADE
│  │ (getCredentials, cache)       │  │
│  └────────────┬─────────────────┘  │
│               │                     │
└───────────────┼─────────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│   PostgreSQL                       │
│  ┌────────────────────────────┐   │
│  │ atendimento_integracoes_   │   │
│  │ config                      │   │
│  │ - empresa_id               │   │
│  │ - tipo                     │   │
│  │ - credenciais (JSONB)      │   │
│  │   • whatsapp_api_token     │   │
│  │   • whatsapp_phone_id      │   │
│  │   • whatsapp_app_secret    │   │
│  └────────────────────────────┘   │
└───────────────────────────────────┘
```

## 🔧 Como Usar

### 1. Injetar o Serviço

```typescript
import { WhatsAppConfigService } from './services/whatsapp-config.service';

@Injectable()
export class MeuService {
  constructor(
    private readonly whatsappConfigService: WhatsAppConfigService,
  ) {}
}
```

### 2. Buscar Credenciais

```typescript
async enviarMensagem(empresaId: string, para: string, texto: string) {
  // Buscar credenciais do banco (com cache de 5 minutos)
  const credentials = await this.whatsappConfigService.getCredentialsOrFail(
    empresaId,
    'envio de mensagem'
  );
  
  // Usar credenciais
  const response = await axios.post(
    `https://graph.facebook.com/v23.0/${credentials.phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to: para,
      type: 'text',
      text: { body: texto },
    },
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}
```

### 3. Validação de Configuração

```typescript
// Verificar se empresa tem WhatsApp configurado
const isConfigured = await this.whatsappConfigService.isConfigured(empresaId);

if (!isConfigured) {
  throw new Error('WhatsApp não configurado. Configure na tela de Integrações.');
}
```

### 4. Limpar Cache (Após Atualização)

```typescript
// Quando usuário atualiza credenciais na interface
await this.integracoesService.atualizarCredenciais(empresaId, novasCredenciais);

// Limpar cache para forçar reload
this.whatsappConfigService.clearCache(empresaId);
```

## 📊 Estrutura do Banco

### Tabela: `atendimento_integracoes_config`

```sql
CREATE TABLE atendimento_integracoes_config (
  id UUID PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'whatsapp_business_api'
  ativo BOOLEAN DEFAULT false,
  credenciais JSONB, -- JSON com todas as credenciais
  webhook_secret VARCHAR(255),
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP,
  
  UNIQUE(empresa_id, tipo)
);

CREATE INDEX idx_integracoes_config_empresa_tipo 
  ON atendimento_integracoes_config(empresa_id, tipo);
```

### Estrutura do JSONB `credenciais`

```json
{
  "whatsapp_api_token": "EAALQrbLuMHw...",
  "whatsapp_phone_number_id": "704423209430762",
  "whatsapp_business_account_id": "1922786558561358",
  "whatsapp_app_secret": "abc123...",
  "whatsapp_webhook_verify_token": "meu_token_seguro"
}
```

## 🚀 Migração do Código Legado

### Antes (Código Antigo)

```typescript
// ❌ NÃO FAÇA MAIS ASSIM
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

await axios.post(
  `https://graph.facebook.com/v23.0/${phoneId}/messages`,
  payload,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### Depois (Código Novo)

```typescript
// ✅ FAÇA ASSIM
const credentials = await this.whatsappConfigService.getCredentialsOrFail(
  empresaId,
  'envio de mensagem'
);

await axios.post(
  `https://graph.facebook.com/v23.0/${credentials.phoneNumberId}/messages`,
  payload,
  { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
);
```

## ⚡ Cache e Performance

### Como Funciona o Cache

- **TTL**: 5 minutos por padrão
- **Scope**: Por empresa (não global)
- **Invalidação**: Manual via `clearCache(empresaId)` ou automática após TTL

### Quando o Cache é Usado

```typescript
// 1ª chamada: Busca do banco
const creds1 = await service.getCredentials(empresaId);
// LOG: 🔍 Buscando credenciais WhatsApp do banco...

// 2ª chamada (dentro de 5 min): Usa cache
const creds2 = await service.getCredentials(empresaId);
// LOG: 💾 Credenciais retornadas do cache

// 6 minutos depois: Cache expirado, busca do banco novamente
const creds3 = await service.getCredentials(empresaId);
// LOG: 🔍 Buscando credenciais WhatsApp do banco...
```

### Forçar Refresh

```typescript
// Ignorar cache e buscar direto do banco
const credentials = await service.getCredentials(empresaId, true); // forceRefresh = true
```

## 🔐 Segurança

### O Que NÃO Fazer

❌ Logar credenciais completas:
```typescript
// NUNCA:
this.logger.log(`Token: ${credentials.accessToken}`);
```

✅ Logar apenas preview:
```typescript
// SEMPRE:
this.logger.log(`Token: ${credentials.accessToken.substring(0, 20)}...`);
```

### Validações Obrigatórias

1. **Empresa existe?**
2. **Integração está ativa?**
3. **Token e Phone Number ID estão preenchidos?**
4. **Token não está expirado?** (verificar via Meta API se necessário)

## 🧪 Testando

### Script para Atualizar Credenciais

Use o script criado:

```powershell
.\atualizar-credenciais-whatsapp.ps1 -Token "EAALQrbLuMHw..."
```

Ou SQL direto:

```sql
UPDATE atendimento_integracoes_config 
SET credenciais = jsonb_set(
  credenciais,
  '{whatsapp_api_token}',
  '"EAALQrbLuMHwBQdbaAre..."'
)
WHERE tipo = 'whatsapp_business_api' 
  AND empresa_id = '11111111-1111-1111-1111-111111111111';
```

### Verificar Configuração

```sql
SELECT 
  empresa_id,
  tipo,
  ativo,
  credenciais->>'whatsapp_phone_number_id' as phone_id,
  substring(credenciais->>'whatsapp_api_token', 1, 20) || '...' as token_preview,
  (credenciais->>'whatsapp_app_secret' IS NOT NULL) as has_app_secret
FROM atendimento_integracoes_config
WHERE tipo = 'whatsapp_business_api';
```

## 📝 Checklist de Migração

Para migrar código legado:

- [ ] Identificar todas as referências a `process.env.WHATSAPP_*`
- [ ] Injetar `WhatsAppConfigService` no construtor do service
- [ ] Substituir `process.env.*` por `await whatsappConfigService.getCredentials(empresaId)`
- [ ] Adicionar `empresaId` como parâmetro se não existir
- [ ] Validar que método recebe empresaId de forma confiável (JWT, contexto, etc.)
- [ ] Remover imports de `ConfigService` se não for mais usado
- [ ] Adicionar logs de debug
- [ ] Testar com múltiplas empresas
- [ ] Verificar que cache está funcionando
- [ ] Remover variáveis do `.env` (deixar apenas configurações de ambiente, não credenciais)

## 🎯 Resumo Executivo

| Aspecto | Antes (.env) | Depois (Banco) |
|---------|--------------|----------------|
| **Multi-tenant** | ❌ Impossível | ✅ Nativo |
| **Atualização** | ⚠️ Requer restart | ✅ Tempo real |
| **Sincronização** | ⚠️ Manual | ✅ Automática |
| **Fonte de verdade** | ⚠️ Duplicada | ✅ Única |
| **Segurança** | ⚠️ Exposto em logs | ✅ Controlada |
| **Performance** | ⚠️ Sem cache | ✅ Cache por empresa |
| **Escalabilidade** | ❌ Limitada | ✅ Ilimitada |

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0  
**Status**: ✅ Produção
