# 📱 Notificação de Agente ao Aceitar Atendimento

## ✅ Implementações Concluídas

### 1. Fluxo de Transferência Corrigido
- ✅ Quando usuário seleciona um departamento, vai direto para `transferir-atendimento`
- ✅ Mensagem de encaminhamento é exibida
- ✅ Posição na fila é informada (simulada: 1º)
- ✅ Tempo estimado é mostrado (simulado: 2 minutos)

### 2. Mensagem de Transferência
```
⏳ Encaminhando você para [Nome do Departamento]...

👤 Em instantes um de nossos especialistas irá atendê-lo(a)!

⏱️ Tempo médio de espera: 2 minutos

Aguarde na linha, por favor.

📊 Informações da fila:
👥 Posição: 1º na fila
⏱️ Tempo estimado: ~2 minutos
```

---

## ⚠️ PRÓXIMA IMPLEMENTAÇÃO NECESSÁRIA

### Notificação quando Agente Aceitar

**Objetivo**: Quando um agente aceitar o atendimento, enviar mensagem automática para o cliente informando:
- Nome do agente
- Cargo/Função (opcional)
- Mensagem de boas-vindas

**Exemplo de mensagem:**
```
👤 Olá! Você foi atendido por:

🧑‍💼 João Silva
Especialista em Suporte Técnico

Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje? 😊
```

---

## 🔧 Como Implementar

### Opção 1: Webhook/Event Listener (Recomendado)

**Onde implementar**: `backend/src/modules/atendimento/services/atendimento.service.ts`

**Evento a escutar**: Quando `status` do atendimento muda para `"em_atendimento"`

```typescript
// backend/src/modules/atendimento/services/atendimento.service.ts

async aceitarAtendimento(atendimentoId: string, atendenteId: string) {
  // 1. Buscar atendimento
  const atendimento = await this.atendimentoRepository.findOne({
    where: { id: atendimentoId },
    relations: ['contato', 'atendente', 'departamento', 'nucleo']
  });

  if (!atendimento) {
    throw new NotFoundException('Atendimento não encontrado');
  }

  // 2. Buscar atendente
  const atendente = await this.atendenteRepository.findOne({
    where: { id: atendenteId },
    relations: ['usuario']
  });

  if (!atendente) {
    throw new NotFoundException('Atendente não encontrado');
  }

  // 3. Atualizar status
  atendimento.status = 'em_atendimento';
  atendimento.atendente = atendente;
  atendimento.iniciadoEm = new Date();
  await this.atendimentoRepository.save(atendimento);

  // 4. 🆕 ENVIAR NOTIFICAÇÃO AO CLIENTE
  await this.enviarNotificacaoAgenteAceitou(atendimento, atendente);

  return atendimento;
}

// 🆕 NOVO MÉTODO
private async enviarNotificacaoAgenteAceitou(
  atendimento: Atendimento,
  atendente: Atendente
) {
  const nomeAtendente = atendente.usuario?.nome || atendente.nome || 'Atendente';
  const cargoAtendente = atendente.cargo || 'Especialista';
  const departamentoNome = atendimento.departamento?.nome || 'Atendimento';

  const mensagem = `👤 *Olá!* Você foi atendido(a) por:\n\n` +
    `🧑‍💼 *${nomeAtendente}*\n` +
    `📋 ${cargoAtendente} - ${departamentoNome}\n\n` +
    `Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje? 😊`;

  // Enviar via WhatsApp (usar service existente)
  await this.whatsappService.enviarMensagem({
    numeroDestino: atendimento.contato.telefoneWhatsApp,
    mensagem: mensagem,
    empresaId: atendimento.empresaId
  });

  // Log da notificação
  this.logger.log(
    `📤 [NOTIFICAÇÃO] Enviado para ${atendimento.contato.telefoneWhatsApp}: Agente ${nomeAtendente} aceitou`
  );
}
```

### Opção 2: Frontend (Chat Interface)

**Onde implementar**: `frontend-web/src/pages/chat/ChatPage.tsx`

**Quando executar**: Quando receber evento WebSocket de `atendimento_aceito`

```typescript
// frontend-web/src/pages/chat/ChatPage.tsx

useEffect(() => {
  // Escutar eventos WebSocket
  socket.on('atendimento_aceito', (data) => {
    const { atendenteNome, atendenteCargo, departamentoNome } = data;
    
    // Enviar mensagem automática via API
    enviarMensagemAutomatica({
      atendimentoId: data.atendimentoId,
      mensagem: `👤 Você foi atendido por ${atendenteNome} (${atendenteCargo} - ${departamentoNome})`,
      tipoMensagem: 'sistema'
    });
  });
}, []);
```

---

## 📊 Dados Necessários

Para implementar a notificação, você precisa ter acesso a:

### Do Atendimento:
- `atendimento.contato.telefoneWhatsApp` (para enviar mensagem)
- `atendimento.departamento.nome` (para informar departamento)
- `atendimento.nucleo.nome` (opcional)

### Do Atendente:
- `atendente.nome` ou `atendente.usuario.nome`
- `atendente.cargo` (opcional, ex: "Especialista em Suporte")
- `atendente.email` (opcional)

### Onde Buscar:
```sql
SELECT 
  a.id as atendimento_id,
  a.status,
  c.nome as contato_nome,
  c.telefone_whatsapp,
  at.nome as atendente_nome,
  at.cargo as atendente_cargo,
  d.nome as departamento_nome,
  n.nome as nucleo_nome
FROM atendimentos a
JOIN contatos c ON a.contato_id = c.id
LEFT JOIN atendentes at ON a.atendente_id = at.id
LEFT JOIN departamentos d ON a.departamento_id = d.id
LEFT JOIN nucleos_atendimento n ON a.nucleo_id = n.id
WHERE a.id = 'seu-atendimento-id';
```

---

## 🧪 Como Testar

### 1. Teste Manual
1. Cliente envia "Olá" no WhatsApp
2. Escolhe núcleo (ex: "Suporte Técnico")
3. Escolhe departamento (ex: "Infraestrutura")
4. **Recebe mensagem de transferência** ✅ (já implementado)
5. Atendente aceita o atendimento no painel
6. **Cliente recebe mensagem com nome do agente** ⏳ (próxima implementação)

### 2. Teste Automatizado
```typescript
// backend/src/modules/atendimento/services/atendimento.service.spec.ts

describe('aceitarAtendimento', () => {
  it('deve enviar notificação ao cliente quando agente aceitar', async () => {
    // Mock do WhatsApp service
    const whatsappServiceMock = {
      enviarMensagem: jest.fn().mockResolvedValue(true)
    };

    // Executar aceite
    await atendimentoService.aceitarAtendimento(
      'atendimento-id', 
      'atendente-id'
    );

    // Verificar se mensagem foi enviada
    expect(whatsappServiceMock.enviarMensagem).toHaveBeenCalledWith(
      expect.objectContaining({
        mensagem: expect.stringContaining('Você foi atendido por')
      })
    );
  });
});
```

---

## 📝 Próximos Passos

1. **Implementar método `enviarNotificacaoAgenteAceitou`** no `AtendimentoService`
2. **Chamar método quando status mudar para `em_atendimento`**
3. **Testar fluxo completo**: Triagem → Fila → Aceite → Notificação
4. **Adicionar variáveis no template** da mensagem (configurável no admin)
5. **Criar tabela de templates** para customizar mensagem por departamento/núcleo

---

## 🎯 Resultado Esperado

**Antes** (situação atual):
```
[Cliente] Escolhe departamento
[Sistema] "Encaminhando você para Infraestrutura..."
[Sistema] "📊 Posição: 1º na fila"
[Atendente] Aceita no painel
[Cliente] ... (sem feedback) ❌
```

**Depois** (com implementação):
```
[Cliente] Escolhe departamento
[Sistema] "Encaminhando você para Infraestrutura..."
[Sistema] "📊 Posição: 1º na fila"
[Atendente] Aceita no painel
[Sistema] "👤 Você foi atendido por João Silva" ✅
[Cliente] Sabe que está sendo atendido!
```

---

**Data**: 29/10/2025  
**Status**: ✅ Mensagem de transferência implementada | ⏳ Notificação de aceite pendente
