# 🔧 SOLUÇÃO: Configuração WhatsApp não encontrada

**Data**: 09/12/2025 09:35  
**Erro**: `Configuração WhatsApp não encontrada`  
**Serviço**: WhatsAppSenderService

---

## 🔍 Diagnóstico

### Erro Original
```
[Nest] 4760 - 09/12/2025, 09:31:54 ERROR [WhatsAppSenderService]
❌ Erro ao enviar mensagem: Configuração WhatsApp não encontrada

Error: Configuração WhatsApp não encontrada
  at WhatsAppSenderService.prepararEnvioWhatsApp (whatsapp-sender.service.ts:49:13)
```

### Causa Raiz
O `WhatsAppSenderService` busca configuração na tabela `atendimento_integracoes_config` com:
```typescript
const config = await this.integracaoRepo.findOne({
  where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
});
```

**Problema**: O registro existia mas estava com `ativo = false` (inativo)!

---

## ✅ Solução Aplicada

### 1. Verificação
```sql
SELECT id, empresa_id, tipo, ativo, whatsapp_phone_number_id 
FROM atendimento_integracoes_config 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111' 
  AND tipo = 'whatsapp_business_api';
```

**Resultado**: Registro existia mas `ativo = f`

### 2. Atualização
```sql
UPDATE atendimento_integracoes_config 
SET 
    ativo = true,
    whatsapp_ativo = true,
    whatsapp_api_token = 'EAANdXajZCWZBwBO0zUZBLZCtgMeNL4dqLQZCvz3uGGsyMxC8MgYBB1xAkAhGxFJNxACKjHsZCtF3KHd8N1a8o5mZAvpAm0BPqxsZBr3b5QmUmY9GsIDZBsXDdDFcOLQpQNRIaqiE7Df8hIL1WcWg6K2mMFI5OIiKPWvTvZACxS1YtQXwcMxbWCBZBZB86GGZCivJD06Nzg0UomwGewZDZD',
    credenciais = jsonb_build_object(
        'whatsapp_api_token', 'EAANdXajZCWZBwBO0zUZBLZCtgMeNL4dqLQZCvz3uGGsyMxC8MgYBB1xAkAhGxFJNxACKjHsZCtF3KHd8N1a8o5mZAvpAm0BPqxsZBr3b5QmUmY9GsIDZBsXDdDFcOLQpQNRIaqiE7Df8hIL1WcWg6K2mMFI5OIiKPWvTvZACxS1YtQXwcMxbWCBZBZB86GGZCivJD06Nzg0UomwGewZDZD',
        'whatsapp_phone_number_id', '704423209430762',
        'whatsapp_business_account_id', '1922786558561358'
    ),
    atualizado_em = NOW()
WHERE empresa_id = '11111111-1111-1111-1111-111111111111' 
  AND tipo = 'whatsapp_business_api';
```

**Resultado**: `UPDATE 1` ✅

### 3. Verificação Final
```sql
SELECT 
    id, 
    tipo, 
    ativo, 
    whatsapp_ativo, 
    whatsapp_phone_number_id, 
    LEFT(whatsapp_api_token, 50) || '...' as token 
FROM atendimento_integracoes_config 
WHERE empresa_id = '11111111-1111-1111-1111-111111111111';
```

**Resultado**:
- ✅ `ativo = true`
- ✅ `whatsapp_ativo = true`
- ✅ `whatsapp_phone_number_id = 704423209430762`
- ✅ Token presente (50 primeiros caracteres visíveis)

---

## 📋 Estrutura da Tabela

### Tabela: `atendimento_integracoes_config`

**Colunas principais**:
- `id` (uuid, PK)
- `empresa_id` (uuid)
- `tipo` (varchar) - Ex: 'whatsapp_business_api'
- `ativo` (boolean) - **Importante**: Service filtra por isso
- `credenciais` (jsonb) - Armazena configurações sensíveis
- `whatsapp_api_token` (varchar) - Coluna dedicada para token
- `whatsapp_phone_number_id` (varchar)
- `whatsapp_business_account_id` (varchar)
- `whatsapp_webhook_verify_token` (varchar)
- `whatsapp_ativo` (boolean)
- `criado_em` (timestamp)
- `atualizado_em` (timestamp)

**Nota**: A entidade tem colunas **duplicadas**:
- Token pode estar em `credenciais.whatsapp_api_token` (jsonb) E em `whatsapp_api_token` (coluna)
- O service busca em `credenciais` primeiro

---

## 🎯 Resultado

### Antes
```typescript
// Query retornava null porque ativo=false
const config = await this.integracaoRepo.findOne({
  where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
});
// config = null ❌
```

### Depois
```typescript
// Query retorna registro porque ativo=true
const config = await this.integracaoRepo.findOne({
  where: { empresaId, tipo: 'whatsapp_business_api', ativo: true },
});
// config = { id: '...', credenciais: {...}, ... } ✅
```

### Validação no Service
```typescript
const { whatsapp_api_token, whatsapp_phone_number_id } = config.credenciais || {};
// whatsapp_api_token = 'EAANdXajZCWZBwBO0zU...' ✅
// whatsapp_phone_number_id = '704423209430762' ✅
```

---

## 🚨 Pontos de Atenção

### 1. Token Expira
O token da Meta pode expirar! Se o erro voltar com:
```
❌ Credenciais WhatsApp incompletas
```

Verifique se o token ainda é válido:
```bash
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=SEU_TOKEN"
```

### 2. Como Atualizar Token
```sql
UPDATE atendimento_integracoes_config 
SET 
    whatsapp_api_token = 'NOVO_TOKEN_AQUI',
    credenciais = jsonb_set(
        credenciais, 
        '{whatsapp_api_token}', 
        '"NOVO_TOKEN_AQUI"'
    ),
    atualizado_em = NOW()
WHERE empresa_id = '11111111-1111-1111-1111-111111111111' 
  AND tipo = 'whatsapp_business_api';
```

### 3. Verificação Rápida
```sql
-- Ver se configuração está ativa
SELECT ativo, whatsapp_ativo, whatsapp_phone_number_id
FROM atendimento_integracoes_config
WHERE empresa_id = '11111111-1111-1111-1111-111111111111';
```

Se retornar `ativo = f`, o service NÃO encontrará a configuração!

---

## 📚 Arquivos Relacionados

### Backend
- `backend/src/modules/atendimento/services/whatsapp-sender.service.ts` (linha 49)
  - Método: `prepararEnvioWhatsApp()`
  - Busca: `{ empresaId, tipo: 'whatsapp_business_api', ativo: true }`

- `backend/src/modules/atendimento/entities/integracoes-config.entity.ts`
  - Entidade TypeORM
  - Tabela: `atendimento_integracoes_config`

### Scripts Criados
- `c:\Projetos\conectcrm\fix-whatsapp-config.sql` - Verificações SQL
- `c:\Projetos\conectcrm\EXECUTAR_AGORA_fix-whatsapp-config.sql` - Script completo
- `c:\Projetos\conectcrm\setup-whatsapp-config.ps1` - Script PowerShell (via API)

---

## ✅ Status Final

- ✅ Configuração existe no banco
- ✅ Campo `ativo = true`
- ✅ Campo `whatsapp_ativo = true`
- ✅ Token WhatsApp presente
- ✅ Phone Number ID configurado (704423209430762)
- ✅ Service deve encontrar configuração agora

**Próximo teste**: Enviar mensagem via WhatsApp e verificar se erro desapareceu.

---

**Gerado por**: GitHub Copilot  
**Data**: 09/12/2025 09:35  
**Contexto**: Correção de configuração inativa após integração Meta WhatsApp
