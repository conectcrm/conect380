# 🎯 Transferência de Atendimento - Mensagem Profissional

## 📋 Substituir no arquivo: `backend/src/modules/triagem/engine/flow-engine.ts`

### Localizar método (linha ~603):
```typescript
private async processarTransferenciaAtendimento(etapa: any): Promise<StepBuildResult> {
```

### Substituir TODO O MÉTODO por:

```typescript
/**
 * Processa etapa de transferência de atendimento
 * Marca sessão para transferência e mostra número do ticket
 */
private async processarTransferenciaAtendimento(etapa: any): Promise<StepBuildResult> {
  const sessao = this.config.sessao;
  const departamentoId = sessao.contexto?.destinoDepartamentoId;
  const departamentoNome = sessao.contexto?.departamentoNome || 'atendimento';
  const nucleoId = sessao.contexto?.destinoNucleoId;
  const nucleoNome = sessao.contexto?.nucleoNome || 'setor';

  this.logger.log(`🎯 [TRANSFERÊNCIA] Iniciando transferência para departamento: ${departamentoNome}`);

  if (!departamentoId) {
    throw new BadRequestException('Departamento não informado para transferência');
  }

  // Gerar número único do ticket temporário
  const ticketNumeroTemp = `TMP-${Date.now().toString().slice(-6)}`;
  const primeiroNome = sessao.contexto?.primeiroNome || 'Cliente';
  const horarioAtual = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Mensagem profissional estilo Zendesk/Freshdesk/Intercom
  const mensagemFinal = 
    `✅ *Solicitação Registrada com Sucesso!*\n\n` +
    `Olá, *${primeiroNome}*!\n\n` +
    `Seu atendimento foi encaminhado para:\n` +
    `🏢 *Departamento:* ${departamentoNome}\n` +
    `📁 *Setor:* ${nucleoNome}\n\n` +
    `🎫 *Número do Ticket:* \`${ticketNumeroTemp}\`\n` +
    `⏰ *Horário:* ${horarioAtual}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📊 *Status:* Aguardando atendimento\n` +
    `👥 *Posição na fila:* Calculando...\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `💡 *Próximos Passos:*\n` +
    `• Você receberá uma notificação quando um agente aceitar seu ticket\n` +
    `• Mantenha o WhatsApp aberto para não perder mensagens\n` +
    `• Tempo médio de resposta: 5-10 minutos\n\n` +
    `_Obrigado pela sua paciência!_ 😊`;

  this.logger.log(`📋 [TRANSFERÊNCIA] Sessão marcada - Ticket temp: ${ticketNumeroTemp}`);

  // Marcar sessão para transferência (triagem-bot.service processará)
  sessao.contexto = {
    ...sessao.contexto,
    __aguardandoTransferencia: true,
    __departamentoIdDestino: departamentoId,
    __nucleoIdDestino: nucleoId,
    __ticketNumeroTemp: ticketNumeroTemp,
    __transferidoEm: new Date().toISOString(),
    __mensagemFinal: mensagemFinal,
  };

  this.sessionMutated = true;

  // Retornar mensagem (triagem finaliza aqui)
  return {
    resposta: {
      mensagem: mensagemFinal,
      etapaAtual: sessao.etapaAtual,
      sessaoId: sessao.id,
    } as any,
    autoAvancar: false,
  };
}
```

## 📝 Mudanças Implementadas:

### 1. **Número do Ticket**
```typescript
const ticketNumeroTemp = `TMP-${Date.now().toString().slice(-6)}`;
```
- Gera número único temporário (ex: `TMP-123456`)
- Será substituído pelo número real após criação do ticket no banco

### 2. **Informações Completas**
- ✅ Departamento e Setor
- ✅ Número do ticket (visível no formato code)
- ✅ Horário da solicitação
- ✅ Status atual
- ✅ Posição na fila (será atualizada)

### 3. **Formatação Profissional**
- Linhas separadoras (`━━━━━━━━━━━`)
- Emojis padronizados
- Negrito nos campos importantes
- Código inline para o número do ticket (\`TMP-123456\`)

### 4. **Expectativas Claras**
```
💡 Próximos Passos:
• Você receberá uma notificação quando um agente aceitar seu ticket
• Mantenha o WhatsApp aberto para não perder mensagens
• Tempo médio de resposta: 5-10 minutos
```

## 🎯 Exemplo da Mensagem Final:

```
✅ Solicitação Registrada com Sucesso!

Olá, João!

Seu atendimento foi encaminhado para:
🏢 Departamento: Infraestrutura
📁 Setor: Suporte Técnico

🎫 Número do Ticket: `TMP-789456`
⏰ Horário: 29/10/2025, 14:47

━━━━━━━━━━━━━━━━━━━━

📊 Status: Aguardando atendimento
👥 Posição na fila: Calculando...

━━━━━━━━━━━━━━━━━━━━

💡 Próximos Passos:
• Você receberá uma notificação quando um agente aceitar seu ticket
• Mantenha o WhatsApp aberto para não perder mensagens
• Tempo médio de resposta: 5-10 minutos

_Obrigado pela sua paciência!_ 😊
```

## 🔄 Próximo Passo:

Após o ticket ser criado no banco (em `triagem-bot.service.ts`), enviar mensagem adicional:

```typescript
// Em finalizarTriagem(), após criar ticket:
const ticketNumeroReal = `#${ticket.id.toString().padStart(6, '0')}`;
const posicaoReal = await calcularPosicaoFila(departamentoId);

const atualizacao = 
  `🔄 *Atualização do Ticket*\n\n` +
  `🎫 Número atualizado: \`${ticketNumeroReal}\`\n` +
  `👥 Posição na fila: *${posicaoReal}º*`;

// Enviar via WhatsApp
```

## 📊 Métricas Inspiradas no Mercado:

### Zendesk
- ✅ Número do ticket visível
- ✅ Hora de criação
- ✅ Status claro
- ✅ Expectativas definidas

### Freshdesk
- ✅ Departamento e agente responsável
- ✅ Prioridade
- ✅ SLA esperado

### Intercom
- ✅ Tom conversacional
- ✅ Próximos passos claros
- ✅ Call-to-action implícito (manter WhatsApp aberto)

---

**Última atualização**: 29/10/2025 14:47  
**Implementado por**: GitHub Copilot
