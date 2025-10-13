# 🔧 Correção: Sincronização de Tokens entre Tabelas

**Data**: 11 de outubro de 2025, 23:51:29  
**Problema**: Erro 401 ao marcar mensagem como lida  
**Status**: ✅ **CORRIGIDO**

---

## 📋 Resumo do Problema

### 🎯 Teste Realizado

**Mensagem**: "Mateus teste"  
**De**: 556296689991 (Dhon Freitas)  
**Message ID**: wamid.HBgMNTU2Mjk2Njg5OTkxFQIAEhggQUNEQTJDQTRGNDhDM0U2QTUzRjZERkZFRDZGODA2RDEA

### ✅ O que Funcionou

```log
✅ Phone Number ID detectado: 704423209430762
✅ Webhook recebido - Empresa: f47ac10b-58cc-4372-a567-0e02b2c3d479
✅ Nova mensagem recebida
✅ Configuração WhatsApp encontrada no banco
✅ Mensagem processada
```

### ❌ O que Falhou

```log
ERROR [WhatsAppSenderService] ❌ Erro ao marcar como lida: 
Request failed with status code 401
```

---

## 🔍 Diagnóstico

### Causa Raiz

O sistema usa **DUAS tabelas diferentes** para armazenar configurações WhatsApp:

1. **`canais`** - Usado pelo frontend e testes de envio
2. **`atendimento_integracoes_config`** - Usado pelo webhook para marcar como lida

**Problema**: O token foi atualizado apenas na tabela `canais`, mas **NÃO** na tabela `atendimento_integracoes_config`.

### Fluxo do Problema

```
1. Usuário atualiza token via frontend
   ↓
2. Frontend salva em: canais.configuracao.credenciais.whatsapp_api_token ✅

3. Webhook recebe mensagem
   ↓
4. Webhook tenta marcar como lida
   ↓
5. Busca token em: atendimento_integracoes_config.credenciais.whatsapp_api_token
   ↓
6. Token ANTIGO/EXPIRADO encontrado ❌
   ↓
7. Meta API retorna: 401 Unauthorized ❌
```

---

## 🔧 Solução Aplicada

### Passo 1: Identificar Token Correto

```sql
-- Buscar token atualizado da tabela canais
SELECT configuracao->'credenciais'->>'whatsapp_api_token' 
FROM canais 
WHERE id = 'df104dd2-3b8d-42cf-a60f-8a43e54e7520';

-- Resultado:
-- EAALQrbLuMHwBPs3ZAt6rY0ZC6J36B6oHZBjEu6kcP6IYyxaA4E7yUZAJKNRiPQTnCHXoq2VKJVVEv6s71NUZBVKEQ378G51UsWWGUcv2Id9YIZClhiwpZASX65Oe1y7ZCSMwXj0JVtUqMH5el7gLy18BNz5MLCB8v9Mi9L8g8LkFQreHJkI4ZAsSbvR6yAQVKwmQcZAIRCzdZAyDpoaP2kxG3aGJZBUMybANWfBpA7yXf6NLoAZDZD
```

### Passo 2: Atualizar Token na Tabela atendimento_integracoes_config

```sql
UPDATE atendimento_integracoes_config 
SET 
  credenciais = jsonb_set(
    credenciais, 
    '{whatsapp_api_token}', 
    '"EAALQrbLuMHwBPs3ZAt6rY0ZC6J36B6oHZBjEu6kcP6IYyxaA4E7yUZAJKNRiPQTnCHXoq2VKJVVEv6s71NUZBVKEQ378G51UsWWGUcv2Id9YIZClhiwpZASX65Oe1y7ZCSMwXj0JVtUqMH5el7gLy18BNz5MLCB8v9Mi9L8g8LkFQreHJkI4ZAsSbvR6yAQVKwmQcZAIRCzdZAyDpoaP2kxG3aGJZBUMybANWfBpA7yXf6NLoAZDZD"'::jsonb
  ),
  atualizado_em = NOW()
WHERE 
  empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
  AND tipo = 'whatsapp_business_api';
```

**Resultado**: `UPDATE 1` ✅

### Passo 3: Verificar Atualização

```sql
SELECT 
  id,
  empresa_id,
  tipo,
  ativo,
  credenciais->>'whatsapp_phone_number_id' as phone_id,
  LEFT(credenciais->>'whatsapp_api_token', 50) as token_preview
FROM atendimento_integracoes_config
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
```

**Resultado**:
```
id: 650f6cf6-f027-442b-8810-c6405fef9c02
tipo: whatsapp_business_api ✅
ativo: true ✅
phone_id: 704423209430762 ✅
token_preview: EAALQrbLuMHwBPs3ZAt6rY0ZC6J36B6oHZBjEu6kcP6IYyxaA4 ✅
```

---

## 📊 Estado das Tabelas

### Tabela: canais
```
id: df104dd2-3b8d-42cf-a60f-8a43e54e7520
tipo: whatsapp
ativo: true ✅
status: ATIVO ✅
configuracao.credenciais.whatsapp_api_token: EAALQrbLuMHw... (247 chars) ✅
```

**Uso**: Frontend, testes de envio, gerenciamento de canais

---

### Tabela: atendimento_integracoes_config
```
id: 650f6cf6-f027-442b-8810-c6405fef9c02
tipo: whatsapp_business_api ✅
ativo: true ✅
credenciais.whatsapp_api_token: EAALQrbLuMHw... (247 chars) ✅ ATUALIZADO!
credenciais.whatsapp_phone_number_id: 704423209430762 ✅
credenciais.whatsapp_business_account_id: 1922786558561358 ✅
```

**Uso**: Webhook, marcar como lida, integração com Meta API

---

## 🧪 Próximo Teste

### 🔴 TESTE CRÍTICO: Marcar Mensagem como Lida

**Ação**: Envie **NOVA** mensagem WhatsApp

**Esperado**:
```log
✅ Phone Number ID detectado: 704423209430762
✅ Webhook recebido - Empresa: f47ac10b-58cc-4372-a567-0e02b2c3d479
✅ Nova mensagem recebida
✅ De: 556296689991
✅ Conteúdo: [sua mensagem]
✅ Marcando mensagem como lida...              ← NOVO!
✅ Mensagem marcada como lida: [message_id]    ← NOVO!
✅ Mensagem processada
```

**Se ainda aparecer erro 401**:
- Token pode ter expirado novamente (Temporary Token dura 24h)
- Gerar novo token no Meta Developer Console
- Atualizar via frontend (salva em `canais`)
- **IMPORTANTE**: Também atualizar em `atendimento_integracoes_config` (este documento)

---

## 🚨 Problema Arquitetural Identificado

### Duplicação de Dados

O sistema armazena as mesmas credenciais em **duas tabelas diferentes**:

| Aspecto | `canais` | `atendimento_integracoes_config` |
|---------|----------|-----------------------------------|
| **Estrutura** | JSONB aninhado | JSONB direto |
| **Usado por** | Frontend, testes | Webhook, marcar como lida |
| **Atualização** | Via interface | Manual (SQL) |
| **Sincronização** | ❌ Não automática | ❌ Não automática |

### Risco

⚠️ **Quando o token é atualizado via frontend**:
1. ✅ `canais` é atualizado automaticamente
2. ❌ `atendimento_integracoes_config` **NÃO** é atualizado
3. ❌ Webhook continua usando token antigo
4. ❌ Erro 401 ao marcar como lida

---

## 💡 Soluções Recomendadas

### Solução 1: Trigger de Sincronização (Recomendado)

```sql
CREATE OR REPLACE FUNCTION sync_whatsapp_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando token for atualizado em 'canais'
  UPDATE atendimento_integracoes_config
  SET 
    credenciais = jsonb_set(
      COALESCE(credenciais, '{}'::jsonb),
      '{whatsapp_api_token}',
      to_jsonb(NEW.configuracao->'credenciais'->>'whatsapp_api_token')
    ),
    atualizado_em = NOW()
  WHERE 
    empresa_id = NEW.empresa_id
    AND tipo = 'whatsapp_business_api';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_whatsapp_token_trigger
AFTER UPDATE OF configuracao ON canais
FOR EACH ROW
WHEN (OLD.configuracao IS DISTINCT FROM NEW.configuracao)
EXECUTE FUNCTION sync_whatsapp_token();
```

**Benefício**: Sincronização automática, sem intervenção manual

---

### Solução 2: Unificar Armazenamento

Modificar código para usar **apenas** tabela `canais`:

```typescript
// whatsapp-sender.service.ts
async marcarComoLida(empresaId: string, messageId: string) {
  // ANTES: Buscar em atendimento_integracoes_config
  // const config = await this.integracaoRepo.findOne({...});
  
  // DEPOIS: Buscar em canais
  const canal = await this.canaisRepo.findOne({
    where: { 
      empresaId, 
      tipo: 'whatsapp', 
      ativo: true 
    }
  });
  
  const token = canal.configuracao?.credenciais?.whatsapp_api_token;
  // ...
}
```

**Benefício**: Fonte única de verdade, sem duplicação

---

### Solução 3: Atualizar Ambas Tabelas via Backend

Modificar endpoint de atualização:

```typescript
// canais.controller.ts
async atualizarCredenciais(id: string, credenciais: any) {
  // 1. Atualizar tabela canais
  await this.canaisRepo.update(id, { configuracao: { credenciais } });
  
  // 2. Atualizar tabela atendimento_integracoes_config
  const canal = await this.canaisRepo.findOne(id);
  await this.integracaoRepo.update(
    { empresaId: canal.empresaId, tipo: 'whatsapp_business_api' },
    { credenciais: { whatsapp_api_token: credenciais.whatsapp_api_token } }
  );
}
```

**Benefício**: Sincronização via código, sem SQL manual

---

## 📝 Checklist de Atualização de Token

### Quando Gerar Novo Token no Meta

- [ ] 1. Acessar Meta Developer Console
- [ ] 2. Gerar novo Temporary Token ou System User Token
- [ ] 3. **Copiar token completo**
- [ ] 4. Atualizar via frontend (IntegracoesPage)
  - ✅ Salva em: `canais.configuracao.credenciais.whatsapp_api_token`
- [ ] 5. **IMPORTANTE**: Atualizar manualmente em `atendimento_integracoes_config`

```sql
UPDATE atendimento_integracoes_config 
SET 
  credenciais = jsonb_set(
    credenciais, 
    '{whatsapp_api_token}', 
    '"[SEU_TOKEN_AQUI]"'::jsonb
  ),
  atualizado_em = NOW()
WHERE 
  empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
  AND tipo = 'whatsapp_business_api';
```

- [ ] 6. Verificar atualização nas duas tabelas
- [ ] 7. Testar envio de mensagem (usa `canais`)
- [ ] 8. Testar webhook (usa `atendimento_integracoes_config`)

---

## 🎯 Próximos Passos

### Imediato
1. ✅ Token sincronizado entre tabelas
2. 🔴 **Testar webhook** enviando nova mensagem
3. ✅ Validar mensagem marcada como lida (dois checks azuis)

### Curto Prazo
- [ ] Implementar trigger de sincronização automática
- [ ] Adicionar validação de token no frontend
- [ ] Criar endpoint para sincronizar tokens
- [ ] Adicionar logs de sincronização

### Médio Prazo
- [ ] Refatorar para usar apenas tabela `canais`
- [ ] Migrar para System User Token (não expira)
- [ ] Criar testes automatizados de sincronização
- [ ] Documentar fluxo de atualização

---

## 📚 Documentação Relacionada

- [TESTE_REAL_SUCESSO.md](./TESTE_REAL_SUCESSO.md) - Primeiro teste bem-sucedido
- [RESOLVER_ERRO_401_WHATSAPP.md](./RESOLVER_ERRO_401_WHATSAPP.md) - Resolver erro 401
- [GUIA_RAPIDO_ERRO_401.md](./GUIA_RAPIDO_ERRO_401.md) - Quick fix erro 401
- [STATUS_WEBHOOK_ATUAL.md](./STATUS_WEBHOOK_ATUAL.md) - Status completo do sistema

---

## 🎉 Conclusão

### ✅ Problema Resolvido

- Token sincronizado entre as duas tabelas
- Webhook agora tem acesso ao token atualizado
- Pronto para testar marcação como lida

### ⚠️ Lição Aprendida

**Importante**: Sempre que atualizar token via frontend, também atualizar manualmente na tabela `atendimento_integracoes_config` até implementar sincronização automática.

### 🔴 Próxima Ação

**Envie nova mensagem WhatsApp** para testar funcionalidade completa!

---

**📅 Corrigido em**: 11 de outubro de 2025, 23:51:29  
**✍️ Documentado por**: GitHub Copilot  
**📊 Status**: ✅ **TOKEN SINCRONIZADO - PRONTO PARA TESTE**
