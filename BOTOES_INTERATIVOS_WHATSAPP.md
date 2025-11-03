# 🔘 Botões Interativos no WhatsApp - ConectCRM

## O que mudou?

O bot de triagem agora envia **botões interativos** em vez de solicitar que o usuário digite números.

## Tipos de Botões

### 1. Reply Buttons (1-3 opções)
- Aparecem como botões clicáveis abaixo da mensagem
- Máximo de 3 botões por mensagem
- Ideal para confirmações simples (Sim/Não/Cancelar)

### 2. List Messages (4-10 opções)
- Lista suspensa com até 10 opções
- Mostra título e descrição de cada opção
- Ideal para menus com várias escolhas

### 3. Texto tradicional (11+ opções)
- Fallback automático quando há muitas opções
- Usuário digita o número da opção

## Como funciona

### Para o Usuário
1. Recebe mensagem com botões visuais
2. Clica no botão desejado
3. Sistema processa automaticamente

### Tecnicamente
- **Envio**: Sistema detecta quantidade de opções e escolhe formato automaticamente
- **Recepção**: Webhook processa tipo `interactive` e extrai o `id` do botão
- **Compatibilidade**: Se falhar, volta para texto normal

## Estrutura da API

### Envio de Reply Buttons
```typescript
await whatsAppInteractiveService.enviarMensagemComBotoes(
  empresaId,
  numeroWhatsApp,
  'Escolha uma opção:',
  [
    { id: '1', titulo: 'Suporte' },
    { id: '2', titulo: 'Financeiro' },
    { id: '3', titulo: 'Comercial' },
  ]
);
```

### Envio de List Message
```typescript
await whatsAppInteractiveService.enviarMensagemComLista(
  empresaId,
  numeroWhatsApp,
  'Escolha um departamento:',
  'Ver opções',
  [
    { 
      id: '1', 
      titulo: 'Suporte Técnico',
      descricao: 'Problemas técnicos e dúvidas'
    },
    { 
      id: '2', 
      titulo: 'Financeiro',
      descricao: 'Boletos e cobranças'
    },
    // ... até 10 opções
  ]
);
```

### Recebimento de Resposta
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button_reply", // ou "list_reply"
    "button_reply": {
      "id": "1",
      "title": "Suporte"
    }
  }
}
```

## Limitações do WhatsApp

- **Reply Buttons**: máximo 3 botões, 20 caracteres por título
- **List Messages**: máximo 10 opções, 24 caracteres por título, 72 por descrição
- **Botão da lista**: máximo 20 caracteres

## Fluxo de Triagem Atualizado

O fluxo padrão já está configurado para usar botões:

1. **Menu inicial** (6 opções) → Lista interativa
2. **Confirmação** (2-3 opções) → Reply Buttons
3. **Coleta de dados** → Texto livre (com opção "SAIR")

## Testes

Para testar, basta enviar uma mensagem para o WhatsApp configurado. O bot vai:
1. Mostrar menu com lista interativa
2. Aguardar seleção
3. Processar a escolha automaticamente
4. Continuar fluxo com botões quando aplicável

## Benefícios

✅ **UX melhorada** - Cliente clica em vez de digitar
✅ **Menos erros** - Não há digitação incorreta
✅ **Visual profissional** - Aparência moderna e clean
✅ **Acessibilidade** - Mais fácil em dispositivos móveis
✅ **Compatível** - Fallback para texto se necessário

## Arquivos Modificados

- `whatsapp-interactive.service.ts` (novo)
- `whatsapp-webhook.service.ts` (processamento de respostas interativas)
- `triagem-bot.service.ts` (detecção automática de tipo de botão)
- `atendimento.module.ts` (registro do novo serviço)
