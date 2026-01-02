# 🎯 GUIA DE TESTE MANUAL - PASSO A PASSO

## ✅ Status: IMPLEMENTAÇÃO COMPLETA - PRONTO PARA TESTAR

---

## 📋 CHECKLIST PRÉ-TESTE

- ✅ Backend rodando (6 processos Node.js detectados)
- ✅ Frontend compilando sem erros
- ✅ OnlineIndicator.tsx criado
- ✅ AvatarWithStatus integrado no TicketList
- ✅ WebSocket listener configurado
- ✅ Interface Ticket atualizada com campos de status

---

## 🚀 PASSO 1: ABRIR A APLICAÇÃO

1. **Abra o navegador** (Chrome, Edge ou Firefox)
2. **Digite na barra de endereços:** `http://localhost:3000`
3. **Aguarde** a página carregar

**O que esperar:**
- Tela de login deve aparecer
- Sem erros no console (F12)

---

## 🔐 PASSO 2: FAZER LOGIN

1. **Abra o DevTools** (pressione `F12`)
2. **Vá para a aba "Console"**
3. **Digite suas credenciais** na tela de login
4. **Clique em "Entrar"**

**O que esperar:**
- Login bem-sucedido
- Redirecionamento para dashboard
- Logs no console: `[Auth] Login realizado com sucesso`

---

## 💬 PASSO 3: NAVEGAR PARA ATENDIMENTO

1. **No menu lateral**, clique em **"Atendimento"**
2. **Selecione** a opção **"WhatsApp"**
3. **Aguarde** a lista de tickets carregar

**O que esperar:**
- Lista de tickets aparecer à esquerda
- Cada ticket deve mostrar:
  - ✅ **Avatar circular** com iniciais do contato
  - ✅ **Bolinha verde ou cinza** no canto do avatar
  - ✅ **Badge vermelho** se houver mensagens não lidas
  - ✅ Número do ticket, assunto, status

---

## 🔍 PASSO 4: INSPECIONAR INDICADORES VISUAIS

**No DevTools (aba "Elements" ou "Elementos"):**

1. **Clique no ícone de seleção** (canto superior esquerdo do DevTools)
2. **Passe o mouse** sobre um avatar na lista
3. **Observe** a estrutura HTML:

```html
<!-- Deve aparecer algo assim: -->
<div class="relative inline-block">
  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
    AB  <!-- Iniciais do contato -->
  </div>
  <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500 animate-pulse">
    <!-- Bolinha de status -->
  </div>
</div>
```

**Validações:**
- [ ] Avatar tem borda arredondada (`rounded-full`)
- [ ] Bolinha de status está no canto inferior direito
- [ ] Cor é verde (`bg-green-500`) ou cinza (`bg-gray-400`)
- [ ] Se verde, tem animação pulse (`animate-pulse`)

---

## 📡 PASSO 5: TESTAR ATUALIZAÇÃO DE STATUS (CRÍTICO!)

### 5.1 - Preparar Console

**No DevTools (aba "Console"):**

1. **Limpe o console** (ícone de lixeira ou `Ctrl + L`)
2. **Digite no filtro:** `[WhatsApp]`
3. **Deixe o console visível** ao lado da aplicação

### 5.2 - Enviar Mensagem de Teste

1. **Selecione um ticket** da lista
2. **Observe o status atual** do contato (verde ou cinza)
3. **Digite uma mensagem** no campo de texto (ex: "teste")
4. **Clique em "Enviar"** ou pressione `Enter`
5. **AGUARDE 2-3 SEGUNDOS**

### 5.3 - Verificar Logs no Console

**Logs esperados:**

```javascript
// 1. Mensagem enviada
[WhatsApp] Enviando mensagem para ticket abc-123...

// 2. Backend processa e emite evento WebSocket
[WhatsApp] Status de contato atualizado via WebSocket: {
  telefone: "5511999999999",
  online: true,
  lastActivity: "2025-10-16T14:30:00.000Z"
}

// 3. Estado atualizado no frontend
[WhatsApp] Tickets atualizados: 5 tickets
```

### 5.4 - Validar Mudança Visual

**O que deve acontecer:**

- ✅ Bolinha de status **MUDA PARA VERDE** (se estava cinza)
- ✅ Animação **pulse começa** (bolinha "pulsa" suavemente)
- ✅ Nenhum erro no console
- ✅ Apenas o ticket correto é atualizado (outros não mudam)

**Se a bolinha NÃO mudar:**
- ❌ Verifique os logs do console
- ❌ Veja se há erros em vermelho
- ❌ Confira se o WebSocket está conectado

---

## ⏱️ PASSO 6: TESTAR TIMEOUT (OPCIONAL - 5+ MINUTOS)

**Este teste demora, mas é importante:**

1. **Envie uma mensagem** para deixar contato verde (online)
2. **Aguarde 5 minutos** SEM enviar mais nada
3. **Observe** se a bolinha muda para cinza automaticamente

**O que esperar:**
- Após ~5 minutos: bolinha muda de verde para cinza
- Log no console: `online: false`
- Pulse para de animar

---

## 📸 PASSO 7: COLETAR EVIDÊNCIAS

### Screenshots Necessários:

1. **Lista de tickets** com avatares e status visíveis
2. **Console aberto** mostrando log de WebSocket
3. **Antes e depois** de enviar mensagem (se possível)

### Como tirar screenshot:
- Windows: `Win + Shift + S`
- Ou use ferramenta de screenshot do navegador

---

## ✅ CHECKLIST DE VALIDAÇÃO FINAL

Marque cada item após validar:

### Carregamento Inicial:
- [ ] Avatares aparecem em todos os tickets
- [ ] Iniciais do nome estão corretas
- [ ] Bolinhas de status são visíveis
- [ ] Cores são verde (online) ou cinza (offline)
- [ ] Badge vermelho mostra mensagens não lidas

### Envio de Mensagem:
- [ ] Mensagem é enviada com sucesso
- [ ] Log WebSocket aparece no console
- [ ] Objeto contém `telefone`, `online`, `lastActivity`
- [ ] Bolinha muda para verde
- [ ] Animação pulse é ativada
- [ ] Apenas o ticket correto é atualizado

### Performance:
- [ ] Sem lag ao renderizar lista
- [ ] Não há erros no console
- [ ] WebSocket conectado (`connected: true`)
- [ ] Re-renderização é instantânea

### Layout:
- [ ] Avatar tem tamanho adequado (~40x40px)
- [ ] Bolinha não fica cortada
- [ ] Badge não sobrepõe outros elementos
- [ ] Layout responsivo (redimensione janela)

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: Bolinhas não aparecem
**Solução:**
1. Verifique se `OnlineIndicator.tsx` existe
2. Veja se há erros de importação no console
3. Confirme que TailwindCSS está compilado

### Problema 2: Status não atualiza ao enviar mensagem
**Solução:**
1. Verifique logs: `[WhatsApp] Status de contato atualizado`
2. Confirme WebSocket conectado: procure por `connected: true`
3. Veja se backend está emitindo evento correto

### Problema 3: Erros no console
**Solução:**
1. Copie o erro completo
2. Verifique se é erro de TypeScript ou runtime
3. Veja stack trace para identificar arquivo

### Problema 4: Badge de mensagens não aparece
**Solução:**
1. Confirme que ticket tem `mensagensNaoLidas > 0`
2. Veja se campo está na interface Ticket
3. Verifique CSS do badge (`bg-red-500`)

---

## 📊 RESULTADO ESPERADO

### ✅ CENÁRIO DE SUCESSO:

```
┌─────────────────────────────────┐
│ 🎯 TESTE APROVADO               │
├─────────────────────────────────┤
│ ✅ Avatares visíveis            │
│ ✅ Status indicado (verde/cinza)│
│ ✅ WebSocket funcional          │
│ ✅ Atualização em tempo real    │
│ ✅ Sem erros                    │
│ ✅ Performance OK               │
└─────────────────────────────────┘
```

### ❌ CENÁRIO DE FALHA:

```
┌─────────────────────────────────┐
│ ⚠️ TESTE COM PROBLEMAS          │
├─────────────────────────────────┤
│ ❌ [Descreva o problema aqui]   │
│ 📋 Logs: [Cole logs relevantes] │
│ 🔍 Screenshot anexado           │
└─────────────────────────────────┘
```

---

## 📝 RELATÓRIO DE TESTE

**Após completar todos os passos, preencha:**

```
Data/Hora: _______________
Navegador: _______________
Resolução: _______________

RESULTADOS:
[ ] ✅ Todos os testes passaram
[ ] ⚠️ Alguns testes falharam
[ ] ❌ Maioria dos testes falhou

OBSERVAÇÕES:
_______________________________
_______________________________
_______________________________

SCREENSHOTS ANEXADOS:
[ ] Lista de tickets com avatares
[ ] Console com logs WebSocket
[ ] Demonstração de atualização

PRÓXIMAS AÇÕES:
_______________________________
_______________________________
```

---

## 🎓 DICAS FINAIS

1. **Sempre teste com DevTools aberto** - logs são essenciais
2. **Limpe o cache** se algo parecer estranho (`Ctrl + Shift + Delete`)
3. **Teste com múltiplos tickets** para validar isolamento de estado
4. **Documente problemas** com screenshots e logs completos
5. **Seja paciente** - aguarde 2-3 segundos após enviar mensagem

---

**Documentação criada por:** GitHub Copilot  
**Versão:** 1.0  
**Última atualização:** 16 de outubro de 2025
