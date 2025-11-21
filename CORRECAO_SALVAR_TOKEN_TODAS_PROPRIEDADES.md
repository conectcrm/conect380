# 🔧 CORREÇÃO: Salvar Token em Todas as Propriedades

**Data**: 12 de outubro de 2025, 16:40  
**Status**: ✅ **CORRIGIDO**

---

## 🐛 Problema Identificado

Quando o usuário salvava o token pela tela de integração:
- ✅ Tabela `atendimento_canais` era atualizada
- ❌ Tabela `atendimento_integracoes_config` **NÃO** era atualizada

**Resultado**: 
- `whatsapp-sender.service.ts` busca credenciais de `atendimento_integracoes_config`
- Token no banco estava desatualizado
- Erro 401 Unauthorized persistia

---

## 🔧 Correção Aplicada

### 1️⃣ Atualizada Entidade `IntegracoesConfig`

**Arquivo**: `backend/src/modules/atendimento/entities/integracoes-config.entity.ts`

**Adicionadas colunas**:
```typescript
@Column({ name: 'whatsapp_api_token', length: 500, nullable: true })
whatsappApiToken: string;

@Column({ name: 'whatsapp_phone_number_id', length: 100, nullable: true })
whatsappPhoneNumberId: string;

@Column({ name: 'whatsapp_business_account_id', length: 100, nullable: true })
whatsappBusinessAccountId: string;

@Column({ name: 'whatsapp_webhook_verify_token', length: 255, nullable: true })
whatsappWebhookVerifyToken: string;

@Column({ name: 'whatsapp_ativo', default: false, nullable: true })
whatsappAtivo: boolean;
```

### 2️⃣ Corrigido Controller `CanaisController.atualizar()`

**Arquivo**: `backend/src/modules/atendimento/controllers/canais.controller.ts`

**Método**: `@Put(':id')`

**Mudança**: Após salvar na tabela `canais`, agora também atualiza `atendimento_integracoes_config`:

```typescript
// 🔧 CRÍTICO: Se for WhatsApp, atualizar TAMBÉM atendimento_integracoes_config
const tipoCanal = canal.tipo?.toString().toLowerCase();
if (tipoCanal === 'whatsapp' || tipoCanal === 'whatsapp_business_api') {
  console.log('🔄 [CanaisController] Atualizando atendimento_integracoes_config...');
  
  let integracao = await this.integracaoRepo.findOne({
    where: { empresaId, tipo: 'whatsapp_business_api' },
  });

  const credenciais = canal.configuracao?.credenciais || {};
  
  if (integracao) {
    // Atualizar AMBOS: campo JSONB E colunas diretas
    integracao.credenciais = {
      ...integracao.credenciais,
      ...credenciais,
    };
    
    integracao.whatsappApiToken = credenciais.whatsapp_api_token;
    integracao.whatsappPhoneNumberId = credenciais.whatsapp_phone_number_id;
    integracao.whatsappBusinessAccountId = credenciais.whatsapp_business_account_id;
    integracao.whatsappWebhookVerifyToken = credenciais.whatsapp_webhook_verify_token;
    integracao.ativo = canal.ativo;
    integracao.whatsappAtivo = canal.ativo;
    
    await this.integracaoRepo.save(integracao);
    console.log('✅ [CanaisController] Integração atualizada!');
  }
}
```

---

## 📊 Resultado da Correção

### Antes da Correção:
```
User salva token → atendimento_canais ✅
                 → atendimento_integracoes_config ❌ (não atualizado)
                 
whatsapp-sender busca → atendimento_integracoes_config
                     → Token antigo
                     → Erro 401 ❌
```

### Depois da Correção:
```
User salva token → atendimento_canais ✅
                 → atendimento_integracoes_config ✅ (NOVO!)
                 
whatsapp-sender busca → atendimento_integracoes_config
                     → Token novo
                     → Envio OK ✅
```

---

## 🎯 Campos Atualizados Simultaneamente

Quando o usuário clicar em **"Salvar"** na tela de integração:

1. **Campo JSONB `credenciais`**:
   ```json
   {
     "whatsapp_api_token": "EAAL...",
     "whatsapp_phone_number_id": "704423209430762",
     "whatsapp_business_account_id": "1922786558561358",
     "whatsapp_webhook_verify_token": "..."
   }
   ```

2. **Colunas Diretas** (backup/compatibilidade):
   - `whatsapp_api_token`
   - `whatsapp_phone_number_id`
   - `whatsapp_business_account_id`
   - `whatsapp_webhook_verify_token`
   - `whatsapp_ativo`

---

## 📋 Passos para Testar a Correção

### 1️⃣ Reiniciar Backend
```bash
cd backend
node dist/src/main.js
```

### 2️⃣ Gerar Token NOVO
- Acesse: https://business.facebook.com/settings
- System Users → Generate New Token
- Permissões: `whatsapp_business_messaging` + `whatsapp_business_management`
- Copie o token

### 3️⃣ Salvar no Sistema
- http://localhost:3000/configuracoes/integracoes
- Card "WhatsApp Business API"
- Cole o token NOVO
- **Clique em "Salvar"** ⚠️

### 4️⃣ Verificar se Salvou nas Duas Tabelas
```bash
cd C:\Projetos\conectcrm
node test-verificar-token-banco.js
```

**Resultado Esperado**:
```
🔑 Token JSONB: EAALQrb... (241 chars) ✅
🔑 Token Coluna: EAALQrb... (241 chars) ✅
   → AMBOS os tokens devem ser IGUAIS agora!
```

### 5️⃣ Validar Token com WhatsApp API
```bash
node test-validar-token-banco.js
```

**Resultado Esperado**:
```
✅ TOKEN VÁLIDO!
📱 Phone Number verificado com sucesso
📞 Número: +55 62 9966-89991
```

### 6️⃣ Testar Envio de Mensagem
- http://localhost:3000/atendimento
- Selecione ticket #2
- Envie mensagem de teste
- **Deve funcionar! 🚀**

---

## 🔍 Logs de Debug (Backend)

Após reiniciar o backend, ao salvar o token você verá:

```
🔍 [CanaisController] PUT /atendimento/canais/:id chamado
✅ [CanaisController] Canal atualizado
🔄 [CanaisController] Atualizando atendimento_integracoes_config para WhatsApp...
📝 [CanaisController] Credenciais a salvar: { ... }
🔄 [CanaisController] Atualizando integração existente: [UUID]
✅ [CanaisController] Integração atualizada com sucesso!
✅ [CanaisController] Credenciais JSONB: { ... }
✅ [CanaisController] Token coluna: EAALQrbLuMHwBP...
```

---

## 📚 Arquivos Modificados

1. `backend/src/modules/atendimento/entities/integracoes-config.entity.ts`
   - Adicionadas 5 colunas WhatsApp

2. `backend/src/modules/atendimento/controllers/canais.controller.ts`
   - Método `@Put(':id')` atualizado para salvar em ambas as tabelas

---

## ✅ Checklist de Validação

- [x] Entidade IntegracoesConfig atualizada
- [x] Controller CanaisController corrigido
- [x] Backend recompilado
- [ ] Backend reiniciado
- [ ] Token novo gerado
- [ ] Token salvo pela tela de integração
- [ ] Verificado que salvou nas duas tabelas
- [ ] Token validado com WhatsApp API
- [ ] Mensagem enviada com sucesso

---

**Próxima Ação**: Reiniciar backend, gerar token novo e testar!
