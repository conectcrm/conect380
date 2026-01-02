# 🔧 CORREÇÃO: Envio de Mensagens - Conteúdo NULL

## 🚨 PROBLEMA IDENTIFICADO

**Erro:** `null value in column "conteudo" of relation "atendimento_mensagens" violates not-null constraint`

**Quando ocorre:** Ao tentar enviar mensagem do frontend para o backend

**Causa raiz:** O campo `conteudo` não está sendo recebido corretamente pelo backend quando enviado via FormData

## 🔍 ANÁLISE DO FLUXO

### ✅ Frontend (CORRETO)
```typescript
// frontend-web/src/features/atendimento/omnichannel/services/atendimentoService.ts
async enviarMensagem(params: EnviarMensagemParams): Promise<Mensagem> {
  const formData = new FormData();
  formData.append('conteudo', params.conteudo); // ✅ Enviando corretamente
  
  const response = await api.post<Mensagem>(
    `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
    formData
  );
}
```

### ❌ Backend (PROBLEMA)
```typescript
// backend/src/modules/atendimento/controllers/ticket.controller.ts
@Post(':id/mensagens')
@UseInterceptors(FilesInterceptor('anexos', 5))
async enviarMensagem(
  @Param('id') ticketId: string,
  @Body() dados: any, // ❌ FormData pode não ser parseado corretamente
  @UploadedFiles() arquivos?: Express.Multer.File[],
) {
  // dados.conteudo pode estar undefined
}
```

### 🔧 Problema com FormData
O NestJS com `FilesInterceptor` pode não parsear corretamente o campo `conteudo` do FormData quando há expectativa de arquivos, mesmo que nenhum arquivo seja enviado.

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. **Validação Robusta no Service**
```typescript
// mensagem.service.ts
async enviar(dados: any, arquivos?: Express.Multer.File[]): Promise<Mensagem> {
  this.logger.log(`📤 Enviando mensagem para ticket ${dados.ticketId}`);
  this.logger.debug(`📋 Dados recebidos: ${JSON.stringify(dados)}`);

  // ✅ Validar se conteudo existe
  if (!dados.conteudo || dados.conteudo.trim() === '') {
    this.logger.error(`❌ Conteúdo da mensagem está vazio ou ausente!`);
    throw new Error('Conteúdo da mensagem é obrigatório');
  }

  const mensagemData: any = {
    conteudo: dados.conteudo.trim(), // ✅ Garantir trim
    // ...
  };
}
```

### 2. **Fallback no Controller**
```typescript
// ticket.controller.ts
async enviarMensagem(...) {
  this.logger.debug(`📋 Body recebido: ${JSON.stringify(dados)}`);
  
  // ✅ Garantir que conteudo existe
  let conteudo = dados.conteudo;
  
  // Se dados é uma string, tentar parsear
  if (typeof dados === 'string') {
    try {
      const parsed = JSON.parse(dados);
      conteudo = parsed.conteudo;
    } catch {
      conteudo = dados;
    }
  }

  const dadosCompletos = { 
    ...dados, 
    ticketId,
    conteudo // ✅ Garante que está presente
  };
}
```

### 3. **Logging Detalhado**
Adicionado logs em 3 pontos:
- Controller: Ver o que chega na requisição
- Service: Ver o que é processado
- Erro: Mensagem clara se faltar conteúdo

## 🧪 TESTES NECESSÁRIOS

### 1. Envio de Mensagem Simples
```bash
curl -X POST http://localhost:3001/api/atendimento/tickets/[TICKET_ID]/mensagens \
  -F "conteudo=Teste de mensagem" \
  -H "Authorization: Bearer [TOKEN]"
```

**Esperado:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "conteudo": "Teste de mensagem",
    "tipo": "TEXTO"
  }
}
```

### 2. Envio com Anexo
```bash
curl -X POST http://localhost:3001/api/atendimento/tickets/[TICKET_ID]/mensagens \
  -F "conteudo=Imagem anexada" \
  -F "anexos=@imagem.jpg" \
  -H "Authorization: Bearer [TOKEN]"
```

### 3. Frontend - ChatArea
1. Digitar mensagem no campo de texto
2. Clicar em "Enviar" ou pressionar Enter
3. Verificar:
   - ✅ Mensagem aparece na interface
   - ✅ Backend recebe corretamente
   - ✅ Logs mostram `conteudo` presente

## 🔍 VERIFICAÇÃO DOS LOGS

### ✅ Logs Corretos (Sucesso)
```
[Nest] LOG [TicketController] 📤 [POST /tickets/XXX/mensagens]
[Nest] DEBUG [TicketController] 📋 Body recebido: {"conteudo":"Olá!"}
[Nest] DEBUG [TicketController] 📎 Arquivos: 0
[Nest] LOG [MensagemService] 📤 Enviando mensagem para ticket XXX
[Nest] DEBUG [MensagemService] 📋 Dados recebidos: {"conteudo":"Olá!","ticketId":"XXX"}
[Nest] LOG [MensagemService] ✅ Mensagem salva no banco de dados
```

### ❌ Logs de Erro (Problema)
```
[Nest] LOG [TicketController] 📤 [POST /tickets/XXX/mensagens]
[Nest] DEBUG [TicketController] 📋 Body recebido: {}  ❌ Vazio!
[Nest] ERROR [MensagemService] ❌ Conteúdo da mensagem está vazio ou ausente!
[Nest] ERROR [TicketController] ❌ Erro ao enviar mensagem: Conteúdo da mensagem é obrigatório
```

## 🚀 ALTERNATIVA: Mudar para JSON

Se o problema persistir, podemos mudar o frontend para enviar JSON puro em vez de FormData para mensagens de texto simples:

```typescript
// atendimentoService.ts
async enviarMensagem(params: EnviarMensagemParams): Promise<Mensagem> {
  // Se NÃO tem anexos, usar JSON
  if (!params.anexos && !params.audio) {
    const response = await api.post<Mensagem>(
      `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
      { conteudo: params.conteudo }, // JSON puro
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }
  
  // Se TEM anexos, usar FormData
  const formData = new FormData();
  formData.append('conteudo', params.conteudo);
  // ...
}
```

## 📋 CHECKLIST DE DEPLOY

- [x] Validação adicionada no service
- [x] Fallback implementado no controller
- [x] Logging detalhado adicionado
- [x] Backend recompilado
- [ ] Testar envio via frontend
- [ ] Testar envio via curl
- [ ] Verificar logs do backend
- [ ] Se necessário, implementar alternativa JSON

## 📊 STATUS

**Data:** 14/10/2025 12:07  
**Status:** ⚠️ EM TESTE  
**Próximo passo:** Aguardar nova tentativa de envio e verificar logs
