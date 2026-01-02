# 🧪 Teste BUG-003: WebSocket Reconnection - GUIA COMPLETO

**Data**: 11/12/2025  
**Status**: 🎯 Pronto para executar  
**Pré-requisitos**: ✅ WhatsApp funcionando, ✅ Backend rodando, ✅ Frontend rodando

---

## 📋 Cenários de Teste

### ✅ TC008: WebSocket Connected (Conexão Inicial)
**Objetivo**: Verificar se WebSocket conecta ao abrir chat

**Passos**:
1. Abrir: http://localhost:3000/atendimento/omnichannel
2. Abrir DevTools Console (F12)
3. Observar logs de conexão

**Resultado Esperado**:
```
✅ WebSocket conectado
🔌 Socket ID: <socket-id>
```

**Critérios de Sucesso**:
- ✅ Conexão estabelecida em <500ms
- ✅ Socket ID presente
- ✅ Sem erros no console
- ✅ Badge "🟢 Online" aparece na UI

---

### ✅ TC009: Reconnection After Network Drop (Reconexão)
**Objetivo**: Verificar reconexão automática após queda de rede

**Passos**:
1. Com chat aberto e conectado
2. **Desconectar Wi-Fi** ou **Desabilitar adaptador de rede**
3. Observar console - deve detectar desconexão
4. Aguardar tentativas de reconexão (1/5, 2/5, 3/5...)
5. **Reconectar Wi-Fi** ou **Habilitar adaptador**
6. Observar reconexão automática

**Resultado Esperado**:
```
⚠️ WebSocket desconectado
🔄 Tentativa de reconexão 1/5...
🔄 Tentativa de reconexão 2/5...
🔄 Tentativa de reconexão 3/5...
✅ WebSocket reconectado
📡 Sincronizando mensagens perdidas...
```

**Critérios de Sucesso**:
- ✅ Desconexão detectada em <2 segundos
- ✅ Exponential backoff (1s → 2s → 4s → 8s → 16s)
- ✅ Máximo 5 tentativas
- ✅ Reconexão automática após rede voltar
- ✅ Badge muda: 🟢 → 🔴 → 🟢
- ✅ Sem erros fatais no console

---

### ✅ TC010: Messages After Reconnection (Mensagens pós-reconexão)
**Objetivo**: Verificar sincronização de mensagens após reconexão

**Passos**:
1. Com chat conectado
2. Desconectar rede
3. **Enviar mensagem WhatsApp do celular** (enquanto desconectado)
4. Aguardar 5-10 segundos
5. Reconectar rede
6. Aguardar reconexão WebSocket
7. Verificar se mensagem aparece no chat

**Resultado Esperado**:
```
✅ WebSocket reconectado
📡 Sincronizando mensagens perdidas...
💬 Nova mensagem recebida: <texto>
```

**Critérios de Sucesso**:
- ✅ Mensagens enviadas durante downtime aparecem
- ✅ Sincronização automática (sem refresh manual)
- ✅ Ordem cronológica mantida
- ✅ Sem mensagens duplicadas
- ✅ Notificação de nova mensagem (popup)

---

## 🎬 Roteiro de Execução Completo

### Preparação (2 min)

1. **Verificar Backend**:
```powershell
# Deve estar rodando na porta 3001
netstat -ano | Select-String ":3001" | Select-String "LISTENING"
```

2. **Verificar Frontend**:
```powershell
# Deve estar rodando na porta 3000
netstat -ano | Select-String ":3000" | Select-String "LISTENING"
```

3. **Abrir Chat**:
- URL: http://localhost:3000/atendimento/omnichannel
- Selecionar qualquer ticket ativo

4. **Abrir DevTools**:
- Pressionar F12
- Aba Console
- Limpar console (Ctrl+L)

---

### Teste 1: TC008 - Conexão Inicial (3 min)

**Ação**:
```
1. Refresh da página (F5)
2. Observar console durante carregamento
3. Aguardar ~2 segundos
```

**O que deve aparecer no console**:
```javascript
[WebSocket] 🔌 Inicializando conexão...
[WebSocket] ✅ WebSocket conectado
[WebSocket] 🔌 Socket ID: abc123xyz
[Notifications] 🔔 Sistema de notificações iniciado
```

**Validação Visual (UI)**:
- [ ] Badge "🟢 Online" no header
- [ ] Mensagens carregam normalmente
- [ ] Botão de envio habilitado
- [ ] Sem spinners de loading infinitos

**Status**: 
- [ ] ✅ PASSOU
- [ ] ❌ FALHOU (anotar motivo abaixo)

**Observações**:
```
[Escreva aqui qualquer comportamento inesperado]
```

---

### Teste 2: TC009 - Reconexão (10 min)

**Preparação**:
```
1. Garantir que está conectado (badge verde)
2. Ter console DevTools visível
3. Preparar para desconectar rede rapidamente
```

**Ação 1 - Desconectar**:
```
Windows:
- Clicar no ícone de rede (systray)
- Desativar Wi-Fi ou "Desconectar"

Ou no CMD (executar como Admin):
netsh interface set interface "Wi-Fi" disable
```

**Observar Console (10-15 segundos)**:
```javascript
⚠️ WebSocket desconectado (código: xxx)
🔄 Tentativa de reconexão 1/5... (aguardando 1000ms)
🔄 Tentativa de reconexão 2/5... (aguardando 2000ms)
🔄 Tentativa de reconexão 3/5... (aguardando 4000ms)
```

**Validação Durante Desconexão**:
- [ ] Badge muda para "🔴 Offline"
- [ ] Mensagem "Reconectando..." aparece
- [ ] Contador de tentativas visível (1/5, 2/5...)
- [ ] Delays aumentam exponencialmente
- [ ] Botão de envio desabilitado

**Ação 2 - Reconectar**:
```
Windows:
- Ativar Wi-Fi novamente

Ou no CMD (executar como Admin):
netsh interface set interface "Wi-Fi" enable
```

**Observar Console (5 segundos)**:
```javascript
✅ WebSocket reconectado
📡 Sincronizando mensagens perdidas...
🔔 Sistema de notificações restaurado
```

**Validação Após Reconexão**:
- [ ] Badge volta para "🟢 Online"
- [ ] Mensagem "Conectado" aparece
- [ ] Botão de envio habilitado
- [ ] Chat carrega mensagens recentes
- [ ] Sem erros no console

**Métricas de Performance**:
- Tempo de detecção de desconexão: _____ segundos
- Número de tentativas até reconectar: _____ de 5
- Tempo total de downtime: _____ segundos
- Tempo de sincronização: _____ segundos

**Status**:
- [ ] ✅ PASSOU
- [ ] ❌ FALHOU (anotar motivo abaixo)

**Observações**:
```
[Anotar:
- Quantas tentativas foram necessárias?
- Delays respeitaram backoff exponencial?
- Algum erro inesperado?]
```

---

### Teste 3: TC010 - Mensagens Perdidas (10 min)

**Preparação**:
```
1. Ter chat aberto e conectado
2. Ter celular com WhatsApp do número de teste
3. Console DevTools visível
```

**Ação 1 - Simular Downtime com Mensagens**:
```
1. Desconectar rede (mesmo método TC009)
2. Aguardar badge ficar vermelho (🔴 Offline)
3. No celular: Enviar mensagem WhatsApp para o número do sistema
   Exemplo: "Teste de mensagem durante downtime - 14:30"
4. Aguardar 5-10 segundos
5. Reconectar rede
```

**Observar Console**:
```javascript
✅ WebSocket reconectado
📡 Sincronizando mensagens perdidas...
🔄 Buscando mensagens desde: 2025-12-11T14:30:00Z
💬 Nova mensagem recebida: "Teste de mensagem durante downtime - 14:30"
🔔 Notificação: Nova mensagem de <nome-cliente>
```

**Validação**:
- [ ] Mensagem aparece no chat automaticamente
- [ ] Popup de notificação exibido
- [ ] Som de notificação (se configurado)
- [ ] Mensagem na ordem cronológica correta
- [ ] Hora/data corretas
- [ ] Avatar do remetente correto
- [ ] Sem duplicação de mensagens

**Ação 2 - Testar Múltiplas Mensagens**:
```
1. Desconectar novamente
2. Enviar 3 mensagens seguidas do celular:
   - "Mensagem 1"
   - "Mensagem 2"
   - "Mensagem 3"
3. Reconectar
4. Verificar se TODAS aparecem
```

**Validação Múltiplas Mensagens**:
- [ ] Todas 3 mensagens aparecem
- [ ] Ordem correta (1, 2, 3)
- [ ] Sem mensagens faltando
- [ ] Sem duplicações

**Ação 3 - Testar Mídia**:
```
1. Desconectar
2. Enviar imagem ou áudio do celular
3. Reconectar
4. Verificar se mídia carrega
```

**Validação Mídia**:
- [ ] Mídia aparece após reconexão
- [ ] Thumbnail carrega corretamente
- [ ] Clique para abrir funciona
- [ ] Download funciona

**Status**:
- [ ] ✅ PASSOU
- [ ] ❌ FALHOU (anotar motivo abaixo)

**Observações**:
```
[Anotar:
- Todas mensagens foram sincronizadas?
- Quanto tempo demorou a sincronização?
- Alguma mídia não carregou?]
```

---

## 📊 Resumo dos Resultados

### Estatísticas

| Cenário | Status | Tempo | Tentativas | Observações |
|---------|--------|-------|------------|-------------|
| TC008 - Conexão | ⬜ | ___s | N/A | |
| TC009 - Reconexão | ⬜ | ___s | ___/5 | |
| TC010 - Mensagens | ⬜ | ___s | N/A | |

**Legenda**: ✅ Passou | ❌ Falhou | ⚠️ Parcial

---

### Taxa de Sucesso

```
Total de Testes: 3
Passou: ___ de 3
Falhou: ___ de 3
Taxa: ____%
```

---

## 🐛 Bugs Encontrados (Se houver)

### Bug 1: [Título]
**Cenário**: TC0XX  
**Gravidade**: 🔴 Crítico | 🟠 Alto | 🟡 Médio | 🟢 Baixo  
**Descrição**:
```
[Descrever o comportamento inesperado]
```

**Passos para Reproduzir**:
1. 
2. 
3. 

**Resultado Esperado**:
```
[O que deveria acontecer]
```

**Resultado Obtido**:
```
[O que realmente aconteceu]
```

**Logs do Console**:
```javascript
[Copiar logs relevantes]
```

---

## ✅ Checklist Final

Após completar TODOS os testes:

- [ ] TC008 testado e documentado
- [ ] TC009 testado e documentado
- [ ] TC010 testado e documentado
- [ ] Screenshots/vídeos capturados (se necessário)
- [ ] Bugs reportados (se houver)
- [ ] Atualizar `RESULTADOS_TESTE_BUGS_OMNICHANNEL.md`
- [ ] Atualizar `OMNICHANNEL_ACOES_IMEDIATAS.md`
- [ ] Commit dos resultados

---

## 🎉 Após Testes Bem-Sucedidos

Se TODOS os 3 cenários passarem:

```markdown
## 🏆 MISSÃO COMPLETA!

✅ BUG-001: Smart scroll (3/3 cenários)
✅ BUG-002: Progress bar (2/2 cenários)
✅ BUG-003: WebSocket (3/3 cenários) ← AGORA!

**Taxa de Sucesso**: 100% (8/8 cenários)
**Tempo Total**: ~5 horas (estimado 15h)
**Eficiência**: 66% mais rápido que estimativa

🎊 TODOS OS BUGS UX VALIDADOS COM SUCESSO!
```

---

**Criado**: 11/12/2025  
**Testador**: [Seu nome]  
**Versão**: 1.0  
**Status**: 🎯 Aguardando execução
