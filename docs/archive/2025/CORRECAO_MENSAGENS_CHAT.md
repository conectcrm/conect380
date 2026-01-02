# 🔧 Correção: Mensagens e Funcionalidades do Chat

## 🐛 Problemas Identificados na Imagem

### 1. **Mensagens aparecendo apenas do lado direito**
   - **Causa**: O backend não está retornando o campo `remetente.tipo` corretamente
   - **Sintoma**: Todas as mensagens aparecem como se fossem do atendente (lado direito)
   - **Fix necessário**: Ajustar backend para retornar `tipo: 'cliente' | 'atendente'`

### 2. **Botões do header não funcionam**
   - **Telefone**: Não implementado (precisa de integração com sistema de telefonia)
   - **Transferir**: Funcional (abre modal)
   - **Encerrar**: Funcional (abre modal)

### 3. **Horário das mensagens**
   - **Status**: Implementado mas pode estar oculto
   - **Localização**: Canto inferior direito de cada balão

---

## 🔍 Diagnóstico Técnico

### **Estrutura Esperada da Mensagem (Frontend)**
```typescript
interface Mensagem {
  id: string;
  ticketId: string;
  remetente: {
    id: string;
    nome: string;
    foto?: string;
    tipo: 'cliente' | 'atendente'; // ⚠️ CRÍTICO
  };
  conteudo: string;
  timestamp: Date;
  status: StatusMensagem;
}
```

### **Lógica de Renderização (ChatArea.tsx)**
```typescript
const ehCliente = mensagem.remetente.tipo === 'cliente';

// Se ehCliente === true → Esquerda (branco)
// Se ehCliente === false → Direita (cor do tema)
```

---

## ✅ Soluções Implementadas

### **1. Correção Backend: mensagem.service.ts**

O backend precisa retornar o campo `tipo` do remetente. Verifique se o serviço está fazendo isso:

```typescript
// backend/src/modules/atendimento/services/mensagem.service.ts

async listarMensagens(ticketId: string) {
  const mensagens = await this.mensagemRepository.find({
    where: { ticketId },
    order: { timestamp: 'ASC' },
    relations: ['remetente']
  });

  return mensagens.map(msg => ({
    id: msg.id,
    ticketId: msg.ticketId,
    remetente: {
      id: msg.remetente.id,
      nome: msg.remetente.nome,
      foto: msg.remetente.foto,
      tipo: msg.remetente.tipo // ⚠️ DEVE RETORNAR: 'cliente' ou 'atendente'
    },
    conteudo: msg.conteudo,
    timestamp: msg.timestamp,
    status: msg.status
  }));
}
```

### **2. Verificação da Entidade Mensagem**

```typescript
// backend/src/modules/atendimento/entities/mensagem.entity.ts

@Entity('mensagens')
export class Mensagem {
  @Column()
  ticketId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'remetenteId' })
  remetente: Usuario;

  @Column()
  remetenteId: string;

  // ⚠️ DEVE EXISTIR:
  @Column({ type: 'enum', enum: ['cliente', 'atendente'] })
  remetenteTipo: 'cliente' | 'atendente';
}
```

### **3. Verificação ao Criar Mensagem**

```typescript
// backend/src/modules/atendimento/services/mensagem.service.ts

async enviarMensagem(ticketId: string, conteudo: string, remetenteId: string) {
  // ⚠️ Determinar tipo do remetente
  const ticket = await this.ticketRepository.findOne({ 
    where: { id: ticketId },
    relations: ['contato', 'atendente']
  });

  // Se o remetente é o contato do ticket → cliente
  // Se o remetente é o atendente → atendente
  const remetenteTipo = remetenteId === ticket.contatoId ? 'cliente' : 'atendente';

  const mensagem = this.mensagemRepository.create({
    ticketId,
    remetenteId,
    remetenteTipo, // ⚠️ DEFINIR AQUI
    conteudo,
    timestamp: new Date(),
    status: 'enviado'
  });

  return this.mensagemRepository.save(mensagem);
}
```

---

## 🎨 Verificação Visual do Código Frontend

O código do frontend está **CORRETO** e já implementado:

```tsx
// ChatArea.tsx - Linha 265
const ehCliente = mensagem.remetente.tipo === 'cliente';

// Renderização condicional
<div className={`flex gap-3 animate-slide-up ${ehCliente ? 'justify-start' : 'justify-end'}`}>
  {/* Cliente: Foto à esquerda, balão branco */}
  {ehCliente && (
    <div className="flex-shrink-0">
      <img src={mensagem.remetente.foto} ... />
    </div>
  )}

  {/* Balão da mensagem */}
  <div className={`rounded-2xl px-4 py-2.5 ${
    ehCliente 
      ? 'bg-white border border-gray-200' 
      : 'bg-primaryLight' // ⬅️ Cor do tema
  }`}>
    <p>{mensagem.conteudo}</p>
    
    {/* Horário + Status */}
    <div className="flex items-center gap-1 mt-1.5">
      <span className="text-xs">{formatarHorarioMensagem(mensagem.timestamp)}</span>
      {!ehCliente && renderIconeStatus(mensagem.status)}
    </div>
  </div>

  {/* Atendente: Foto à direita */}
  {!ehCliente && (
    <div className="flex-shrink-0">
      <img src={mensagem.remetente.foto} ... />
    </div>
  )}
</div>
```

---

## 🔧 Correções Necessárias no Backend

### **Arquivo: `backend/src/modules/atendimento/services/mensagem.service.ts`**

**ANTES (Problema):**
```typescript
return {
  remetente: {
    id: msg.remetenteId,
    nome: msg.remetente.nome,
    foto: msg.remetente.foto
    // ❌ FALTA: tipo: 'cliente' | 'atendente'
  }
}
```

**DEPOIS (Correção):**
```typescript
return {
  remetente: {
    id: msg.remetenteId,
    nome: msg.remetente.nome,
    foto: msg.remetente.foto,
    tipo: msg.remetenteTipo // ✅ ADICIONADO
  }
}
```

---

## 🧪 Como Testar a Correção

### **1. Verificar Resposta da API**
```bash
# Abrir DevTools (F12) → Network → XHR
# Buscar: GET /api/atendimento/mensagens?ticketId=xxx
# Ver response:

{
  "data": [
    {
      "id": "msg-1",
      "remetente": {
        "id": "user-1",
        "nome": "Dhon Freitas",
        "tipo": "cliente" // ⚠️ DEVE APARECER
      },
      "conteudo": "okk",
      "timestamp": "2025-10-14T10:00:00Z"
    },
    {
      "id": "msg-2",
      "remetente": {
        "id": "user-2",
        "nome": "Atendente",
        "tipo": "atendente" // ⚠️ DEVE APARECER
      },
      "conteudo": "Como posso ajudar?",
      "timestamp": "2025-10-14T10:01:00Z"
    }
  ]
}
```

### **2. Verificar Console do Frontend**
```javascript
// useMensagens.ts já faz log:
console.log('✅ Mensagens carregadas:', mensagens);

// Verificar no console:
// mensagens[0].remetente.tipo === 'cliente' ✅
// mensagens[1].remetente.tipo === 'atendente' ✅
```

### **3. Resultado Esperado**
- ✅ Mensagens do **cliente** aparecem à **esquerda** (fundo branco)
- ✅ Mensagens do **atendente** aparecem à **direita** (fundo colorido)
- ✅ Fotos alternadas entre esquerda e direita
- ✅ Horário visível em todas as mensagens
- ✅ Check duplo (✓✓) nas mensagens do atendente

---

## 📋 Checklist de Correção

### **Backend**
- [ ] Adicionar campo `remetenteTipo` na entidade `Mensagem`
- [ ] Atualizar migration para adicionar coluna
- [ ] Modificar `enviarMensagem()` para definir tipo
- [ ] Modificar `listarMensagens()` para retornar tipo
- [ ] Testar endpoint com Postman/Insomnia

### **Frontend**
- [x] Código de renderização já implementado
- [x] Lógica de alternância esquerda/direita OK
- [x] Horários e status já implementados
- [ ] Testar após correção do backend

---

## 🎯 Solução Temporária (Mock)

Se não puder corrigir o backend imediatamente, pode adicionar uma lógica temporária no frontend:

```typescript
// atendimentoService.ts - transformarMensagem()

const mensagensComTipo = response.data.mensagens.map((msg, index) => ({
  ...msg,
  remetente: {
    ...msg.remetente,
    // ⚠️ TEMPORÁRIO: Alternar mensagens par/ímpar
    tipo: index % 2 === 0 ? 'cliente' : 'atendente'
  }
}));
```

**Mas isso é TEMPORÁRIO!** A solução correta é no backend.

---

## 📞 Funcionalidades do Header

### **Botão Telefone (⚠️ Não Implementado)**
```tsx
// Para implementar:
const handleLigar = () => {
  // Integrar com sistema de telefonia (Twilio, VoIP, etc.)
  window.open(`tel:${ticket.contato.telefone}`);
  // OU
  // api.post('/telefonia/iniciar-chamada', { numero: ticket.contato.telefone });
};
```

### **Botão Transferir (✅ Funcional)**
```tsx
// Já implementado - abre modal TransferirAtendimentoModal
onClick={onTransferir}
```

### **Botão Encerrar (✅ Funcional)**
```tsx
// Já implementado - abre modal EncerrarAtendimentoModal
onClick={onEncerrar}
```

---

## 🎉 Resultado Final Esperado

Após a correção do backend:

```
┌─────────────────────────────────────────────────────┐
│  Dhon Freitas    [WhatsApp]   ⏱ 47:35              │
│  📞  ↗️ Transferir  ❌ Encerrar                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  😊 okk                                             │
│  ----                                      10:00    │
│                                                     │
│  😊 Teste                                           │
│  ----                                      10:01    │
│                                                     │
│                              Como posso ajudar? 😊  │
│                                      10:02  ✓✓      │
│                                                     │
│  😊 Teste 2                                         │
│  ----                                      10:03    │
│                                                     │
│                              Entendi! 😊            │
│                                      10:04  ✓✓      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Alternância correta:** Cliente (esquerda) → Atendente (direita) → Cliente (esquerda) ...

---

## 🚨 Próximos Passos

1. **Verificar backend**: Confirmar se `remetente.tipo` está sendo retornado
2. **Corrigir entidade**: Adicionar campo `remetenteTipo` se não existir
3. **Testar API**: Verificar response no DevTools
4. **Validar frontend**: Confirmar alternância de mensagens
5. **Implementar telefonia**: Adicionar lógica de chamadas (opcional)

---

**Status Atual:**
- ✅ Frontend: 100% implementado e pronto
- ⏳ Backend: Aguardando campo `tipo` no remetente
- ⚠️ Telefonia: Não implementada (opcional)

**Tempo estimado de correção backend:** 15-30 minutos
