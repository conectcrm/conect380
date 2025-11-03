# 🧪 Guia de Teste - WebSocket Real-Time

## ✅ **Status da Implementação**

- ✅ **Backend Gateway**: `AtendimentoGateway` com Socket.io (313 linhas)
- ✅ **Frontend Hook**: `useMessagesRealtime` integrado com `useWebSocket` (345 linhas)
- ✅ **UI Indicators**: Badge de conexão (Wifi/WifiOff) + Indicador de digitação (3 pontos animados)
- ✅ **Zero Erros TypeScript**: Todos os arquivos compilando sem erros
- ⏳ **Testes Manuais**: Pendente validação

---

## 🎯 Objetivo dos Testes

Validar a comunicação em tempo real entre múltiplos usuários através de WebSocket:

1. **Mensagens instantâneas**: Enviar mensagem em um navegador e ver aparecer no outro instantaneamente
2. **Indicador de digitação**: Quando um usuário digita, o outro vê "digitando..."
3. **Conexão WebSocket**: Badge verde indica conexão ativa, amarelo indica reconexão
4. **Som de notificação**: Toca um bipe ao receber nova mensagem

---

## 🚀 Preparação

### 1. Verificar se os serviços estão rodando

```powershell
# Backend (porta 3001)
curl http://localhost:3001/health

# Frontend (porta 3000)
curl http://localhost:3000
```

### 2. Obter tokens de autenticação

Você precisa de **2 usuários diferentes** para testar a comunicação em tempo real.

**Opção A: Usar usuários existentes**
```powershell
# Listar usuários no banco
cd c:\Projetos\conectcrm\backend
node -e "const { Pool } = require('pg'); const pool = new Pool({ host: 'localhost', port: 5432, database: 'conectcrm', user: 'postgres', password: 'postgres' }); pool.query('SELECT id, nome, email FROM usuarios LIMIT 5').then(r => console.log(r.rows)).catch(console.error).finally(() => pool.end());"
```

**Opção B: Criar usuários de teste**
```sql
-- No PostgreSQL
INSERT INTO usuarios (nome, email, senha_hash, papel, ativo) VALUES
  ('Atendente 1', 'atendente1@test.com', '$2b$10$hashedpassword', 'atendente', true),
  ('Atendente 2', 'atendente2@test.com', '$2b$10$hashedpassword', 'atendente', true);
```

### 3. Fazer login no frontend

1. Abra dois navegadores diferentes (ex: Chrome + Firefox) ou duas janelas anônimas
2. Acesse `http://localhost:3000` em ambos
3. Faça login com usuários diferentes em cada navegador
4. Abra o DevTools (F12) > Console

---

## 🧪 Casos de Teste

### **Teste 1: Conexão WebSocket**

**Objetivo**: Verificar se o WebSocket conecta corretamente

**Passos**:
1. Faça login no frontend
2. Navegue até a página de Atendimento
3. Verifique o badge no canto superior direito da lista de tickets

**Resultado Esperado**:
- ✅ Badge **verde** aparece indicando conexão ativa
- ✅ Console do navegador mostra: `✅ WebSocket conectado ao servidor`

**Debug**:
```javascript
// No console do navegador
localStorage.getItem('token') // Deve retornar um token JWT
```

---

### **Teste 2: Mensagem em Tempo Real**

**Objetivo**: Enviar mensagem de um navegador e ver aparecer no outro instantaneamente

**Passos**:
1. **Navegador 1**: Selecione um ticket
2. **Navegador 2**: Selecione o **mesmo ticket**
3. **Navegador 1**: Envie uma mensagem (ex: "Teste de tempo real")
4. **Navegador 2**: Observe a lista de mensagens

**Resultado Esperado**:
- ✅ Mensagem aparece **instantaneamente** no Navegador 2
- ✅ Sem necessidade de atualizar a página
- ✅ Som de notificação toca no Navegador 2 (bipe de 800Hz)

**Debug**:
```javascript
// No console do Navegador 2, deve aparecer:
📨 Nova mensagem recebida via WebSocket: { id, texto, ... }
```

---

### **Teste 3: Indicador de Digitação**

**Objetivo**: Mostrar "digitando..." quando outro usuário está digitando

**Passos**:
1. **Navegador 1** e **Navegador 2**: Selecionem o mesmo ticket
2. **Navegador 1**: Clique no campo de mensagem e **comece a digitar** (não envie)
3. **Navegador 2**: Observe a área de mensagens

**Resultado Esperado**:
- ✅ Aparece "Atendente está digitando..." no Navegador 2
- ✅ 3 pontos animados (bounce animation)
- ✅ Indicador some após 3 segundos de inatividade

**Debug**:
```javascript
// No console do Navegador 2, deve aparecer:
⌨️ Alguém está digitando: { ticketId, atendenteId }
```

---

### **Teste 4: Múltiplas Salas (Tickets)**

**Objetivo**: Verificar isolamento entre diferentes tickets

**Passos**:
1. **Navegador 1**: Selecione Ticket A
2. **Navegador 2**: Selecione Ticket B (diferente)
3. **Navegador 1**: Envie mensagem no Ticket A
4. **Navegador 2**: Verifique se a mensagem **não aparece** no Ticket B

**Resultado Esperado**:
- ✅ Mensagem só aparece no ticket correto
- ✅ Tickets diferentes não recebem mensagens uns dos outros

---

### **Teste 5: Reconexão Automática**

**Objetivo**: Verificar recuperação de conexão após desconexão

**Passos**:
1. Faça login e acesse a página de Atendimento
2. **Simule desconexão**: Pare o backend (`Ctrl+C` no terminal do backend)
3. Observe o badge de conexão
4. **Reconecte**: Inicie o backend novamente
5. Observe o badge novamente

**Resultado Esperado**:
- ✅ Badge fica **amarelo** quando backend cai
- ✅ Console mostra tentativas de reconexão
- ✅ Badge volta para **verde** quando backend sobe
- ✅ Funcionalidade retorna normalmente sem refresh da página

---

## 🐛 Troubleshooting

### Problema: Badge não fica verde

**Causa**: WebSocket não está conectando

**Debug**:
```javascript
// No console do navegador
const token = localStorage.getItem('token');
console.log('Token:', token);

// Verificar URL do WebSocket
console.log('WS URL:', process.env.REACT_APP_WS_URL || 'http://localhost:3001');
```

**Solução**:
1. Verifique se o token está presente: `localStorage.getItem('token')`
2. Verifique se o backend está rodando: `curl http://localhost:3001`
3. Verifique se há erros no console do backend

---

### Problema: Mensagens não aparecem em tempo real

**Causa**: Navegadores não estão na mesma sala de ticket

**Debug**:
```javascript
// No console do navegador, verificar ID do ticket selecionado
// Ambos devem ter o mesmo ticketId
```

**Solução**:
1. Certifique-se de que ambos os navegadores selecionaram o **mesmo ticket**
2. Verifique no console se há mensagem: `🎫 Entrando na sala do ticket...`
3. Tente sair e entrar no ticket novamente

---

### Problema: Indicador de digitação não aparece

**Causa**: Evento `mensagem:digitando` não está sendo enviado

**Debug**:
```javascript
// No console do backend, deve aparecer:
⌨️ mensagem:digitando recebida: { ticketId, atendenteId }
```

**Solução**:
1. Verifique se a função `notificarDigitando` está sendo chamada no `onKeyDown`
2. Verifique se há debounce impedindo muitos eventos (normal, máximo 1 por segundo)
3. Tente digitar várias letras rapidamente

---

### Problema: Som de notificação não toca

**Causa**: Navegador bloqueou autoplay de áudio

**Debug**:
```javascript
// No console do navegador
// Tente tocar manualmente
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
};
playNotificationSound();
```

**Solução**:
1. Clique em qualquer lugar da página antes de receber mensagem (ativa autoplay)
2. Verifique configurações de som do navegador
3. Use fones de ouvido para ouvir melhor (800Hz é agudo)

---

## 📊 Checklist de Validação

Use este checklist para marcar os testes realizados:

- [ ] **Conexão WebSocket**: Badge verde aparece ao entrar na página
- [ ] **Mensagem instantânea**: Mensagem aparece no outro navegador sem delay
- [ ] **Indicador de digitação**: Aparece "digitando..." ao digitar
- [ ] **Isolamento de salas**: Mensagens só aparecem no ticket correto
- [ ] **Som de notificação**: Bipe toca ao receber mensagem
- [ ] **Reconexão automática**: Badge volta para verde após backend reiniciar
- [ ] **Múltiplos usuários**: 3+ navegadores podem conversar no mesmo ticket
- [ ] **Performance**: Sem lag ou delay perceptível (<100ms)

---

## 🎉 Próximos Passos

Após validar todos os testes manuais:

1. ✅ **Testes E2E com Playwright** (automatizar estes testes)
2. ✅ **Monitoramento**: Adicionar métricas de latência do WebSocket
3. ✅ **Escalabilidade**: Testar com 10+ usuários simultâneos
4. ✅ **Docker**: Containerizar aplicação para deploy
5. ✅ **CI/CD**: Pipeline de build e deploy automatizado

---

## 📝 Registro de Testes

Use este template para documentar seus testes:

```markdown
## Teste Realizado em: [DATA]

### Ambiente:
- Backend: ✅ Rodando | ❌ Com problemas
- Frontend: ✅ Rodando | ❌ Com problemas
- Navegadores: Chrome + Firefox | Edge + Chrome | Etc.

### Resultados:
- [ ] Teste 1: Conexão WebSocket - ✅ Passou | ❌ Falhou
- [ ] Teste 2: Mensagem em Tempo Real - ✅ Passou | ❌ Falhou
- [ ] Teste 3: Indicador de Digitação - ✅ Passou | ❌ Falhou
- [ ] Teste 4: Múltiplas Salas - ✅ Passou | ❌ Falhou
- [ ] Teste 5: Reconexão Automática - ✅ Passou | ❌ Falhou

### Observações:
[Descreva problemas encontrados, comportamentos inesperados, etc.]

### Screenshots:
[Cole screenshots do badge, indicador de digitação, etc.]
```

---

## 🤝 Contato

Se encontrar problemas ou bugs, documente com:
- Screenshots do console (F12)
- Mensagens de erro
- Passos para reproduzir
- Ambiente (navegador, SO, etc.)
