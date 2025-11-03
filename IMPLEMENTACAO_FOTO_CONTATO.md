# 🖼️ Implementação: Fotos de Perfil dos Contatos WhatsApp

## 📋 Contexto

**Problema Identificado:** As fotos dos contatos não estavam aparecendo no sistema de atendimento.

**Data:** 15/10/2025 14:30

---

## 🔍 Diagnóstico

### Verificação Inicial

Ao consultar a API `/api/atendimento/tickets`, o campo `contatoFoto` estava retornando `null`:

```json
{
  "id": "284a17a0-dbbc-499d-a342-dcd822e24e5f",
  "contatoNome": "Dhon Freitas",
  "contatoTelefone": "556296689991",
  "contatoFoto": null  // ❌ NULL!
}
```

### Causa Raiz

A **API do WhatsApp Business não envia automaticamente a foto do perfil** nos webhooks de mensagens. O webhook apenas inclui:

```json
{
  "contacts": [
    {
      "profile": {
        "name": "Nome do Contato"
        // ❌ photo_url NÃO é incluído automaticamente
      }
    }
  ]
}
```

---

## ✅ Solução Implementada

### 1️⃣ Novo Método: `buscarFotoPerfilContato()`

Adicionado ao serviço `WhatsAppSenderService`:

```typescript
/**
 * 🖼️ Busca a foto do perfil do contato do WhatsApp
 * 
 * Faz uma requisição à Graph API do Facebook para obter
 * a URL da foto de perfil do contato.
 */
async buscarFotoPerfilContato(
  empresaId: string,
  telefone: string,
): Promise<string | null> {
  // GET https://graph.facebook.com/v21.0/{phone_number_id}/contacts?wa_id={telefone}
  // Retorna: URL da foto ou null
}
```

**Endpoint da API:**
```
GET https://graph.facebook.com/v21.0/{phone_number_id}/contacts?wa_id={telefone}
Authorization: Bearer {whatsapp_api_token}
```

**Resposta Esperada:**
```json
{
  "contacts": [
    {
      "profile": {
        "picture_url": "https://pps.whatsapp.net/..."
      }
    }
  ]
}
```

---

### 2️⃣ Atualização do Webhook

O serviço `WhatsAppWebhookService` agora busca a foto quando processa mensagens:

```typescript
// 1. Tentar extrair foto do payload (raramente vem)
let fotoCliente = contatoProfile?.photo_url || null;

// 2. Se não veio no payload, buscar na API
if (!fotoCliente) {
  fotoCliente = await this.senderService.buscarFotoPerfilContato(empresaId, from);
}

// 3. Passar foto para o ticket
const ticket = await this.ticketService.buscarOuCriarTicket({
  clienteFoto: fotoCliente || undefined,
  // ...
});
```

**Fluxo:**
1. Mensagem chega via webhook ✅
2. Extrai nome do contato ✅
3. **Busca foto na API do WhatsApp** ✅ NOVO
4. Cria/atualiza ticket com foto ✅
5. Foto aparece no frontend ✅

---

### 3️⃣ Script de Migração: `atualizar-fotos-contatos.ts`

Para tickets existentes sem foto, criamos um script que:

1. Busca todos os tickets com `contatoFoto = NULL`
2. Para cada ticket, busca a foto na API do WhatsApp
3. Atualiza o campo `contatoFoto` no banco

**Como executar:**

```bash
cd backend
npm run build
node dist/src/scripts/atualizar-fotos-contatos.js
```

**Saída esperada:**
```
🖼️ Iniciando atualização de fotos dos contatos...

📊 Total de tickets sem foto: 15

🔍 Processando ticket #4 (Dhon Freitas)...
   Telefone: 556296689991
   ✅ Foto atualizada: https://pps.whatsapp.net/...

═══════════════════════════════════════════════════════════
📊 RESUMO DA ATUALIZAÇÃO
═══════════════════════════════════════════════════════════
✅ Tickets atualizados: 12
ℹ️ Sem foto disponível: 3
❌ Erros: 0
📊 Total processado: 15
═══════════════════════════════════════════════════════════
```

---

## 🧪 Como Testar

### Teste 1: Nova Mensagem do WhatsApp

1. Envie uma mensagem do WhatsApp para o número conectado
2. Verifique nos logs do backend:
   ```
   🖼️ Buscando foto do perfil do contato: 556296689991
   ✅ Foto do perfil encontrada: https://pps.whatsapp.net/...
   ```
3. Abra o frontend e verifique que a foto aparece na lista de atendimentos
4. Abra o chat e verifique que a foto aparece nas mensagens do cliente

### Teste 2: Tickets Existentes

1. Execute o script de atualização:
   ```bash
   cd backend
   npm run build
   node dist/src/scripts/atualizar-fotos-contatos.js
   ```
2. Verifique o resumo da execução
3. No frontend, dê refresh e confirme que as fotos aparecem

### Teste 3: Verificar no Banco

```sql
-- Ver tickets com foto
SELECT 
  numero, 
  contato_nome, 
  contato_telefone,
  SUBSTRING(contato_foto, 1, 50) as foto_preview
FROM atendimento_tickets
WHERE contato_foto IS NOT NULL
LIMIT 10;
```

---

## 🎯 Comportamento Esperado

### No Frontend

**Lista de Atendimentos (Sidebar):**
- ✅ Foto do perfil do WhatsApp aparece ao lado do nome
- ✅ Fallback para avatar com iniciais se não houver foto

**Área de Chat:**
- ✅ Foto do contato aparece no cabeçalho
- ✅ Foto do contato aparece nas mensagens do cliente
- ✅ Foto do atendente aparece nas mensagens do atendente

**DevTools Console (Debug):**
```
🖼️ [WEBHOOK DEBUG] Foto extraída do payload: nenhuma
🔍 [WEBHOOK DEBUG] Foto não veio no payload - buscando na API...
✅ [WEBHOOK DEBUG] Foto obtida da API: https://pps.whatsapp.net/...
```

---

## ⚠️ Limitações Conhecidas

### 1. **Rate Limit da API**

A Graph API do Facebook tem limite de requisições. O script de migração aguarda 500ms entre cada requisição para evitar bloqueio.

**Solução:** Executar script fora do horário de pico.

### 2. **Contatos sem Foto**

Se o contato não tiver foto de perfil no WhatsApp, a API retorna 404.

**Solução:** Sistema usa avatar com iniciais como fallback.

### 3. **Foto Desatualizada**

Se o contato mudar a foto no WhatsApp, o sistema não atualiza automaticamente.

**Solução Futura:** Implementar atualização periódica (ex: a cada 30 dias) ou quando detectar que a URL retorna 404.

---

## 📊 Impacto

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Foto no Webhook | ❌ Não vinha | ✅ Busca ativa na API |
| Tickets Novos | ❌ Sem foto | ✅ Com foto |
| Tickets Existentes | ❌ Sem foto | ✅ Script de migração |
| Performance | - | ✅ +500ms no webhook (aceitável) |
| UX | ⚠️ Avatares genéricos | ✅ Fotos reais |

---

## 🔄 Próximos Passos (Opcional)

1. **Atualização Automática:** Criar job agendado para atualizar fotos desatualizadas
2. **Cache:** Cachear URLs de fotos para reduzir requisições
3. **Retry:** Implementar retry automático se foto retornar 404 (pode ser temporário)
4. **Logs:** Adicionar métricas de quantas fotos são buscadas vs. quantas falham

---

## 📝 Arquivos Modificados

### Backend
- ✅ `backend/src/modules/atendimento/services/whatsapp-sender.service.ts`
  - Adicionado método `buscarFotoPerfilContato()`
  
- ✅ `backend/src/modules/atendimento/services/whatsapp-webhook.service.ts`
  - Integrado busca de foto no fluxo de processamento

- ✅ `backend/src/scripts/atualizar-fotos-contatos.ts`
  - Novo script para atualizar tickets existentes

### Frontend
- ✅ Nenhuma alteração necessária (já estava preparado para receber fotos)

---

## ✅ Validação Final

- [x] Método `buscarFotoPerfilContato()` implementado
- [x] Webhook atualizado para buscar foto
- [x] Script de migração criado
- [x] Documentação completa
- [ ] **Pendente:** Executar script de migração em produção
- [ ] **Pendente:** Testar com mensagem real do WhatsApp

---

**Última atualização:** 15/10/2025 14:35 (BRT)
