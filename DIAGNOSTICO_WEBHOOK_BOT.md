# 🔍 DIAGNÓSTICO: Webhook Aceito mas Não Processa

**Data**: 10 de novembro de 2025  
**Problema**: Webhook retorna 200 OK mas não cria dados no banco  
**Status**: Investigando causa raiz

---

## ✅ O Que Está Funcionando

### 1. Infraestrutura
- ✅ Backend rodando (porta 3001)
- ✅ Banco de dados acessível (porta 5434)
- ✅ Webhook endpoint respondendo

### 2. Configuração do Canal
```sql
Canal WhatsApp: ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7
Phone Number ID: 704423209430762
Status: ATIVO ✅
```

### 3. Fluxo de Triagem
```sql
ID: ce74c2f3-b5d3-46dd-96f1-5f88339b9061
Nome: Fluxo Padrão - Triagem Inteligente v3.0
Ativo: true ✅
Publicado: true ✅
Canal: whatsapp ✅
Prioridade: 10 (mais alta)
Publicado em: 05/11/2025 13:09
```

### 4. Correções Aplicadas
- ✅ NucleoService.findOpcoesParaBot() - removida busca de departamentos
- ✅ NucleoService.findOpcoesParaBot() - removido filtro de departamentos
- ✅ Núcleos agora retornam corretamente para o bot

---

## ❌ O Que NÃO Está Funcionando

### Webhook Processado Mas Sem Efeito

#### Teste 1:
```bash
curl -X POST http://localhost:3001/api/atendimento/webhooks/whatsapp
  -H "Content-Type: application/json"
  -d '{"object": "whatsapp_business_account", ...}'

# Resposta:
{"success":true,"message":"Webhook recebido"}
```

#### Verificação no Banco:
```sql
SELECT COUNT(*) FROM contatos WHERE telefone LIKE '%5511999887766%';
-- Resultado: 0 (ZERO contatos criados)
```

**Conclusão**: O webhook é **aceito** mas não **processa** até o fim.

---

## 🔍 ANÁLISE DO FLUXO DE PROCESSAMENTO

### Caminho do Webhook

```
1. WhatsAppWebhookController.processar()
   ↓
2. WhatsAppWebhookService.processar()
   ↓
3. WhatsAppWebhookService.processarMensagem()
   ↓
4. TriagemBotService.processarMensagemWhatsApp()
   ↓
5. TriagemBotService.extrairDadosWebhook()
   ↓
6. TriagemBotService.buscarSessaoAtiva()
   ↓
7. TriagemBotService.buscarFluxoPadrao()
   ↓
8. TriagemBotService.iniciarNovaSessao()
   ↓
9. (DEVERIA) Criar contato, conversa, ticket
```

### Onde o Fluxo Pode Estar Parando

#### Possibilidade 1: Extração de Dados Falha
```typescript
// Em triagem-bot.service.ts linha 74
const dadosMensagem = this.extrairDadosWebhook(payload);

if (!dadosMensagem?.telefone || !dadosMensagem?.texto) {
  // ❌ Retorna aqui se dados inválidos
  return { ignorado: true, motivo: '...' };
}
```

**Hipótese**: O payload pode não estar sendo extraído corretamente.

#### Possibilidade 2: Processamento Assíncrono
```typescript
// Em whatsapp-webhook.controller.ts
setImmediate(() => {
  this.webhookService.processar(empresaId, req.body)
    .catch(error => {
      this.logger.error('Erro no processamento assíncrono:', error);
    });
});

return { success: true, message: 'Webhook recebido' };
```

**Hipótese**: O erro pode estar acontecendo no `setImmediate()` e sendo silenciado.

#### Possibilidade 3: Estrutura do Payload
O webhook está sendo chamado assim:

```typescript
const triagemPayload = {
  from, // ← Telefone
  body: conteudo, // ← Texto da mensagem
  name: nomeCliente, // ← Nome
  messageId, // ← ID da mensagem
  canalId: canal.id, // ← UUID do canal
};

await this.triagemBotService.processarMensagemWhatsApp(empresaId, triagemPayload);
```

Mas o método `extrairDadosWebhook()` pode esperar estrutura diferente:

```typescript
// O que o método espera?
const dadosMensagem = this.extrairDadosWebhook(payload);
// Procura por: payload.from? payload.body? payload.messages[0].text.body?
```

---

## 🎯 PRÓXIMOS PASSOS DE DIAGNÓSTICO

### 1. Verificar Método `extrairDadosWebhook()`
Ler o código para entender estrutura esperada do payload.

### 2. Adicionar Logs Detalhados
```typescript
// No início de processarMensagemWhatsApp
console.log('🔍 [BOT DEBUG] Payload recebido:', JSON.stringify(payload, null, 2));

const dadosMensagem = this.extrairDadosWebhook(payload);
console.log('🔍 [BOT DEBUG] Dados extraídos:', JSON.stringify(dadosMensagem, null, 2));

if (!dadosMensagem?.telefone || !dadosMensagem?.texto) {
  console.log('❌ [BOT DEBUG] ABORTADO - telefone ou texto ausente');
  // ...
}
```

### 3. Verificar Logs do Backend em Tempo Real
```bash
# Ver logs do terminal onde backend está rodando
# Procurar por:
# - "WEBHOOK RECEBIDO"
# - "DADOS EXTRAÍDOS"
# - "Fluxo padrão encontrado"
# - Qualquer erro
```

### 4. Testar Endpoint Diretamente
```typescript
// Criar script de teste que chama o método diretamente
const resultado = await triagemBotService.processarMensagemWhatsApp(
  'empresa-id',
  {
    from: '5511999887766',
    body: 'Olá',
    name: 'Cliente Teste',
    messageId: 'test123',
    canalId: 'ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7'
  }
);

console.log('Resultado:', resultado);
```

---

## 🔬 TESTES REALIZADOS

### Teste 1: Webhook Via curl
```bash
curl -X POST http://localhost:3001/api/atendimento/webhooks/whatsapp
# Resultado: {"success":true,"message":"Webhook recebido"}
# Banco: 0 contatos criados ❌
```

### Teste 2: Compilação do Backend
```bash
npm run build
# Resultado: Sucesso ✅
```

### Teste 3: Reinício Limpo
```bash
# Matou todos os Node.js
# Iniciou apenas o backend
# Enviou webhook novamente
# Resultado: Mesmo problema ❌
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

- [x] Backend compilando sem erros
- [x] Backend rodando e respondendo
- [x] Banco de dados acessível
- [x] Canal WhatsApp ativo
- [x] Fluxo de triagem publicado
- [x] Webhook endpoint respondendo 200 OK
- [x] NucleoService corrigido (núcleos retornados)
- [ ] Webhook processando até o fim (FALHANDO)
- [ ] Contato sendo criado (FALHANDO)
- [ ] Conversa sendo criada (FALHANDO)
- [ ] Ticket sendo criado (FALHANDO)
- [ ] Bot respondendo ao cliente (FALHANDO)

---

## 🚨 HIPÓTESE PRINCIPAL

**O método `extrairDadosWebhook()` pode esperar estrutura de payload diferente da que está sendo enviada.**

O WhatsAppWebhookService monta o payload assim:
```typescript
{
  from: '5511999887766',
  body: 'Olá',
  name: 'Cliente Teste',
  messageId: 'test123',
  canalId: 'ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7'
}
```

Mas o `extrairDadosWebhook()` pode esperar:
```typescript
{
  object: 'whatsapp_business_account',
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: '...',
          text: { body: '...' }
        }]
      }
    }]
  }]
}
```

**Ação necessária**: Ler o código de `extrairDadosWebhook()` para confirmar.

---

## 🎯 AÇÃO IMEDIATA

1. Ler `triagem-bot.service.ts` método `extrairDadosWebhook()`
2. Verificar se estrutura do payload está compatível
3. Se não estiver, ajustar para esperar payload simplificado do WhatsAppWebhookService
4. Testar novamente

**Status**: Aguardando análise do código
