# 🧪 Testes E2E - Omnichannel

**Criado em**: 11 de dezembro de 2025  
**Prioridade**: CRÍTICA (Week 1)  
**Status**: ✅ Implementado

---

## 📋 Casos de Teste Implementados

### TC004: Selecionar ticket e enviar mensagem
- **Arquivo**: `chat-flow.spec.ts`
- **Descrição**: Fluxo completo de login → selecionar ticket → enviar mensagem → verificar entrega
- **Cobertura**: Login, navegação, seleção de ticket, envio de mensagem, validação de UI

### TC007: Indicador de digitando
- **Arquivo**: `chat-flow.spec.ts`
- **Descrição**: Verificar se evento de "digitando" é disparado via WebSocket
- **Cobertura**: Typing indicator, eventos WebSocket

### TC008: Histórico de mensagens
- **Arquivo**: `chat-flow.spec.ts`
- **Descrição**: Validar carregamento de mensagens antigas e scroll automático
- **Cobertura**: Histórico, scroll, UI de mensagens

### TC009: Status de conexão WebSocket
- **Arquivo**: `chat-flow.spec.ts`
- **Descrição**: Verificar indicador de conexão e estado do WebSocket
- **Cobertura**: WebSocket, indicadores de status

### TC010: Múltiplas mensagens sequenciais
- **Arquivo**: `chat-flow.spec.ts`
- **Descrição**: Enviar 3 mensagens seguidas e validar entrega de todas
- **Cobertura**: Performance, race conditions, UI updates

---

## 🚀 Como Executar

### Pré-requisitos

1. **Backend rodando**:
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Frontend rodando**:
   ```powershell
   cd frontend-web
   npm start
   ```

3. **Playwright instalado**:
   ```powershell
   npx playwright install
   ```

### Executar Testes

```powershell
# Todos os testes E2E
npm run test:e2e

# Apenas testes de chat
npx playwright test e2e/omnichannel/chat-flow.spec.ts

# Modo UI (debug visual)
npx playwright test --ui

# Com navegador visível
npx playwright test --headed

# Específico por teste
npx playwright test --grep "TC004"
```

---

## 📊 Resultados Esperados

### ✅ Sucesso
- Login completa sem erros
- Ticket selecionado e chat carregado
- Mensagem enviada e visível na UI
- Indicadores de status corretos
- WebSocket conectado

### ⚠️ Avisos Comuns
- **Nenhum ticket disponível**: Criar tickets de teste no banco
- **WebSocket não conectou**: Verificar se backend está rodando
- **Campo de mensagem não encontrado**: Verificar seletores no código

---

## 🔧 Configuração

### Seletores Utilizados

| Elemento | Seletor |
|----------|---------|
| Ticket | `[data-testid^="ticket-"]`, `.ticket-item` |
| Chat Area | `[data-testid="chat-area"]`, `.chat-messages` |
| Input Mensagem | `input[placeholder*="mensagem" i]` |
| Botão Enviar | `button[type="submit"]`, `[data-testid="send-button"]` |
| Mensagem | `[data-testid^="message-"]`, `.message-item` |

### Credenciais de Teste

```typescript
{
  email: 'atendente@conectsuite.com.br',
  password: 'senha123'
}
```

**Fonte**: `docs/CREDENCIAIS_PADRAO.md`

---

## 📈 Próximos Passos

### Week 2 - Expandir Cobertura
- [ ] TC005: Upload de arquivo
- [ ] TC006: Transferir ticket
- [ ] TC011: Múltiplos usuários (2 atendentes)
- [ ] TC012: Notificações em tempo real

### Week 3 - Performance
- [ ] Teste de carga (100+ mensagens)
- [ ] Teste de reconexão WebSocket
- [ ] Teste de latência
- [ ] Teste de memória (vazamentos)

### Week 4 - Integração
- [ ] Testes com bot/IA
- [ ] Testes com WhatsApp mock
- [ ] Testes multi-tenant
- [ ] Testes de permissões

---

## 🐛 Troubleshooting

### Erro: "Timeout waiting for element"
**Solução**: Aumentar timeout ou verificar se elemento existe
```typescript
await expect(element).toBeVisible({ timeout: 10000 });
```

### Erro: "WebSocket não conectou"
**Solução**: 
1. Verificar backend rodando (`netstat -ano | findstr :3001`)
2. Verificar URL WebSocket no frontend (`ws://localhost:3001`)
3. Verificar CORS habilitado no backend

### Erro: "Login failed"
**Solução**:
1. Verificar credenciais em `CREDENCIAIS_PADRAO.md`
2. Verificar usuário existe no banco
3. Verificar JWT_SECRET configurado

---

## 📚 Referências

- **OMNICHANNEL_GUIA_TESTES.md**: Guia completo de testes
- **playwright.config.ts**: Configuração do Playwright
- **e2e/fixtures.ts**: Helpers e fixtures compartilhados
- **CREDENCIAIS_PADRAO.md**: Credenciais para desenvolvimento

---

**Última atualização**: 11 de dezembro de 2025  
**Responsável**: Equipe QA + Desenvolvimento
