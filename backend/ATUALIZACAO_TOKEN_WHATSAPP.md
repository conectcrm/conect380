# 🔧 Atualização de Token WhatsApp - Documentação

## 📋 Problema Resolvido

Quando o token do Meta/WhatsApp era atualizado pela interface de integração, apenas o campo `whatsapp_api_token` era atualizado, mas as outras propriedades essenciais não eram preservadas corretamente, causando quebra na integração.

## ✅ Solução Implementada

### 1. **Merge Inteligente na Atualização** (`PUT /api/atendimento/canais/:id`)

O método `atualizar()` agora faz um **merge inteligente** das configurações do WhatsApp:

```typescript
// Antes (❌ PROBLEMA):
canal.configuracao = dto.configuracao; // Sobrescrevia tudo

// Depois (✅ SOLUÇÃO):
const credenciaisMerged = {
  whatsapp_api_token: novasCredenciais.whatsapp_api_token || credenciaisExistentes.whatsapp_api_token,
  whatsapp_phone_number_id: novasCredenciais.whatsapp_phone_number_id || credenciaisExistentes.whatsapp_phone_number_id,
  whatsapp_business_account_id: novasCredenciais.whatsapp_business_account_id || credenciaisExistentes.whatsapp_business_account_id,
  whatsapp_webhook_verify_token: novasCredenciais.whatsapp_webhook_verify_token || credenciaisExistentes.whatsapp_webhook_verify_token,
};
```

**Comportamento**:
- ✅ Preserva campos existentes que não foram enviados na atualização
- ✅ Atualiza apenas os campos enviados
- ✅ Remove propriedades `undefined` para manter o objeto limpo
- ✅ Logs detalhados do merge para debugging

### 2. **Normalização na Criação** (`POST /api/atendimento/canais`)

O método `criar()` agora normaliza automaticamente a estrutura das credenciais do WhatsApp:

```typescript
// Aceita variações de nomes de campos:
{
  token: "..." → whatsapp_api_token
  phone_number_id: "..." → whatsapp_phone_number_id
  business_account_id: "..." → whatsapp_business_account_id
  webhook_verify_token: "..." → whatsapp_webhook_verify_token (com fallback padrão)
}
```

## 🔑 Propriedades Essenciais do WhatsApp

Todas as 4 propriedades são necessárias e agora são preservadas corretamente:

| Propriedade | Descrição | Usado em |
|-------------|-----------|----------|
| `whatsapp_api_token` | Token de acesso da API do Meta | Autenticação nas chamadas à API |
| `whatsapp_phone_number_id` | ID do número de telefone WhatsApp | Envio de mensagens |
| `whatsapp_business_account_id` | ID da conta Business | Configuração da conta |
| `whatsapp_webhook_verify_token` | Token de verificação do webhook | Validação de webhooks recebidos |

## 📊 Exemplo de Uso

### Atualizar apenas o Token:

```json
PUT /api/atendimento/canais/{id}
{
  "configuracao": {
    "credenciais": {
      "whatsapp_api_token": "NOVO_TOKEN_AQUI"
    }
  }
}
```

**Resultado**: O novo token será atualizado, mas `whatsapp_phone_number_id`, `whatsapp_business_account_id` e `whatsapp_webhook_verify_token` serão **preservados** da configuração anterior! ✅

### Atualizar múltiplos campos:

```json
PUT /api/atendimento/canais/{id}
{
  "configuracao": {
    "credenciais": {
      "whatsapp_api_token": "NOVO_TOKEN_AQUI",
      "whatsapp_phone_number_id": "NOVO_PHONE_ID"
    }
  }
}
```

**Resultado**: Token e Phone ID atualizados, demais campos preservados! ✅

## 🐛 Debugging

Os logs agora mostram claramente o processo de merge:

```
🔄 [CanaisController] Merge WhatsApp - Credenciais antes: {...}
🔄 [CanaisController] Merge WhatsApp - Credenciais novas: {...}
✅ [CanaisController] Merge WhatsApp - Credenciais mescladas: {...}
```

## 🚀 Impacto

- ✅ Atualização de token não quebra mais a integração
- ✅ Todas as propriedades são preservadas automaticamente
- ✅ Interface mais robusta e à prova de erros
- ✅ Compatível com diferentes formatos de entrada
- ✅ Logs detalhados para troubleshooting

## 📝 Notas Técnicas

- **Tipo de Canal**: A verificação funciona com `'whatsapp'` (enum) ou qualquer variação case-insensitive
- **Fallback**: Se `whatsapp_webhook_verify_token` não for fornecido na criação, usa `'conectcrm_webhook_token_123'` como padrão
- **Outros Canais**: A lógica especial de merge só se aplica ao WhatsApp; outros tipos de canal continuam com sobrescrita direta

## 🔗 Arquivos Modificados

- `backend/src/modules/atendimento/controllers/canais.controller.ts`
  - Método `criar()` - linhas ~225-255
  - Método `atualizar()` - linhas ~258-320

---

**Última atualização**: 12 de outubro de 2025
**Versão**: 1.0.0
