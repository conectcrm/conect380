# 🧪 Teste Manual - Indicador "Digitando"

**Data**: 10/12/2025  
**Feature**: Indicador de digitação em tempo real via WebSocket

## 📋 Pré-requisitos

- ✅ Backend rodando na porta 3001
- ✅ Frontend rodando na porta 3000
- ✅ Dois navegadores/abas diferentes (ou modo anônimo)

## 🎯 Cenário de Teste

### Teste 1: Indicador Básico
1. **Abrir duas janelas do navegador**:
   - Navegador A: http://localhost:3000
   - Navegador B: http://localhost:3000 (modo anônimo ou perfil diferente)

2. **Fazer login em ambos** (usuários diferentes ou mesmo usuário):
   - Usuário A: `admin@conectsuite.com.br` / `admin123`
   - Usuário B: Outro atendente (se tiver) ou mesma conta em navegador diferente

3. **Abrir o mesmo ticket nos dois navegadores**:
   - Navegador A: Ir para Chat Omnichannel → Selecionar um ticket
   - Navegador B: Ir para Chat Omnichannel → Selecionar o MESMO ticket

4. **Testar digitação**:
   - No **Navegador A**: Começar a digitar no campo de mensagem
   - No **Navegador B**: Deve aparecer o indicador:
     ```
     ┌─────────────────────────────────────┐
     │ [Avatar] Nome do Usuário A          │
     │          • • •  (pontos animados)   │
     └─────────────────────────────────────┘
     ```

### Teste 2: Debounce (1 segundo)
1. **Digitar rapidamente** no Navegador A
2. **Verificar** que o evento não é enviado a cada tecla
3. **Resultado esperado**: Indicador aparece após parar de digitar por ~1s

### Teste 3: Timeout (3 segundos)
1. **Digitar** no Navegador A
2. **Parar de digitar** completamente
3. **Aguardar 3 segundos**
4. **Resultado esperado**: Indicador desaparece automaticamente

### Teste 4: Não Mostrar Próprio Indicador
1. **Digitar** no Navegador A
2. **Verificar** no próprio Navegador A
3. **Resultado esperado**: NÃO deve aparecer seu próprio indicador

### Teste 5: Múltiplos Tickets
1. **Abrir ticket diferente** no Navegador B
2. **Digitar** no Navegador A (ticket 1)
3. **Verificar** Navegador B (ticket 2)
4. **Resultado esperado**: Indicador NÃO aparece (tickets diferentes)

## 🔍 Checklist de Validação

### Visual
- [ ] Indicador aparece suavemente (animação fade-in)
- [ ] Avatar do usuário é exibido corretamente
- [ ] Nome do usuário é exibido
- [ ] 3 pontos fazem animação bounce sequencial
- [ ] Design está alinhado com o tema Crevasse

### Comportamento
- [ ] Indicador só aparece no ticket correto
- [ ] Indicador não aparece para o próprio usuário
- [ ] Debounce funciona (não spamma servidor)
- [ ] Timeout funciona (remove após 3s)
- [ ] Múltiplos usuários podem digitar simultaneamente

### Performance
- [ ] Sem lag ao digitar
- [ ] Console sem erros
- [ ] Network tab mostra eventos WebSocket (não HTTP)
- [ ] CPU não sobrecarrega

## 🐛 Debugging

### Abrir DevTools (F12)
```javascript
// No Console, verificar logs:
// ✅ Deve aparecer ao digitar:
"⌨️ Usuário digitando: {ticketId, usuarioId, usuarioNome}"

// ✅ Ao receber evento:
"💬 mensagem:digitando"
```

### Network Tab
1. Filtrar por `WS` (WebSocket)
2. Clicar na conexão WebSocket
3. Ver aba "Messages"
4. **Ao digitar**, deve aparecer:
   ```json
   {
     "event": "mensagem:digitando",
     "data": {
       "ticketId": "uuid-aqui",
       "usuarioId": "uuid-usuario",
       "usuarioNome": "Nome do Usuário"
     }
   }
   ```

## 🎉 Resultado Esperado

✅ **SUCESSO**: Indicador aparece, anima e desaparece corretamente  
❌ **FALHA**: Indicador não aparece ou comportamento incorreto

## 📸 Evidências

Capture screenshots:
1. Indicador visível com animação
2. Console sem erros
3. WebSocket messages no Network tab

---

**Status**: ⏳ Aguardando teste manual  
**Testador**: [Seu Nome]  
**Versão**: v1.0 - Initial Release
