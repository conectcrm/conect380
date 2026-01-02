# 🚀 GUIA RÁPIDO DE TESTES - 5 Minutos

**Siga este guia passo a passo enquanto interage com o navegador**

---

## ✅ ETAPA 1: Abrir DevTools (10 segundos)

1. No navegador que abriu (http://localhost:3000/chat)
2. Pressione **F12** (ou Ctrl+Shift+I)
3. ✅ **Passa** se painel DevTools aparece

---

## ✅ ETAPA 2: Verificar Store Zustand (20 segundos)

1. Na barra superior do DevTools, procure aba **Redux**
2. Se não aparecer, instale: [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
3. Clique na aba **Redux**
4. ✅ **Passa** se vê "AtendimentoStore" na lista

---

## ✅ ETAPA 3: Verificar Console (10 segundos)

1. Clique na aba **Console** do DevTools
2. Observe se há erros vermelhos
3. ⚠️ Warnings amarelos são OK
4. ✅ **Passa** se não há erros críticos vermelhos

---

## ✅ ETAPA 4: Verificar Tickets Carregando (30 segundos)

1. Olhe para a sidebar esquerda da tela
2. Deve mostrar lista de conversas/tickets
3. Se aparecer loading, aguarde carregar
4. ✅ **Passa** se lista de tickets aparece (mesmo que vazia)

---

## ✅ ETAPA 5: Verificar Network (30 segundos)

1. Clique na aba **Network** do DevTools
2. Clique em **XHR** (filtro de requests)
3. Procure por requisição `tickets`
4. Clique nela
5. Veja o **Status Code**
6. ✅ **Passa** se status é 200 OK ou 304

**Se 404**: Backend pode não ter esse endpoint ainda (não é erro da Store!)

---

## ✅ ETAPA 6: Testar Seleção de Ticket (20 segundos)

1. Clique em qualquer ticket da sidebar
2. ✅ **Passa** se:
   - Ticket fica destacado (cor diferente)
   - Área do chat muda
   - Painel direito (cliente) atualiza

**Se não houver tickets**: OK, pule para Etapa 9

---

## ✅ ETAPA 7: Testar Envio de Mensagem (30 segundos)

1. Com ticket selecionado, digite "Teste de Store" no campo de mensagem
2. Clique em Enviar (ou Enter)
3. ✅ **Passa** se:
   - Mensagem aparece no chat
   - Campo de texto limpa
   - Hora da mensagem está correta

**Se der erro**: Anotar erro do console

---

## ✅ ETAPA 8: Teste Multi-Tab (60 segundos)

**TESTE MAIS IMPORTANTE** (sincronização em tempo real)

1. Pressione **Ctrl+T** (nova aba)
2. Digite `http://localhost:3000/chat` e Enter
3. **ABA 1**: Selecione um ticket
4. **ABA 2**: Selecione o MESMO ticket
5. **ABA 1**: Digite "Teste multi-tab" e envie
6. **ABA 2**: Observe se a mensagem aparece automaticamente

7. ✅ **Passa** se mensagem aparece em ABA 2 em **menos de 1 segundo**

**Se não aparecer**: Verificar console para erro de WebSocket

---

## ✅ ETAPA 9: Teste Persistência (30 segundos)

1. Selecione um ticket qualquer
2. Pressione **F5** (recarregar página)
3. Aguarde página recarregar
4. ✅ **Passa** se:
   - Mesmo ticket continua selecionado
   - Mensagens do ticket carregam automaticamente

**Esperado**: Store usa localStorage para salvar estado

---

## 📊 CALCULAR SCORE FINAL

Conte quantos testes **PASSARAM**:

```
[ ] Etapa 1: DevTools abre
[ ] Etapa 2: Redux mostra store
[ ] Etapa 3: Console sem erros
[ ] Etapa 4: Tickets carregam
[ ] Etapa 5: Network requests OK
[ ] Etapa 6: Seleção funciona
[ ] Etapa 7: Envio funciona
[ ] Etapa 8: Multi-tab sincroniza
[ ] Etapa 9: Persistência funciona

TOTAL: ___/9
```

### Critério de Aprovação

- ✅ **APROVADO**: ≥7/9 (78%) → Store funcionando perfeitamente!
- ⚠️ **APROVADO COM RESSALVAS**: 5-6/9 (56-67%) → Store OK, mas precisa ajustes
- ❌ **REPROVADO**: <5/9 (<56%) → Problemas críticos

---

## 🎯 APÓS CONCLUSÃO

### Se APROVADO (≥7/9):

1. Fechar navegador
2. Informar ao Copilot: **"Testes aprovados! Score: X/9"**
3. Copilot marcará Etapa 2 como 100% completa
4. Começar próxima prioridade: Auto-distribuição de Filas

### Se REPROVADO (<5/9):

1. Anotar quais testes falharam
2. Copiar erros do console
3. Informar ao Copilot: **"Testes falharam. Problemas: [listar]"**
4. Copilot investigará e corrigirá

---

## 🆘 PROBLEMAS COMUNS

### "Redux tab não aparece"
→ Instalar extensão: https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd

### "Tickets não carregam (404)"
→ Endpoint pode não existir no backend ainda. Anotar erro, continuar outros testes.

### "WebSocket não conecta"
→ Console mostrará erro. Copiar mensagem de erro para o Copilot.

### "Multi-tab não sincroniza"
→ Verificar se WebSocket está conectado (console). Se não, backend pode não ter WebSocket.

---

## ⏱️ TEMPO ESTIMADO

- **Testes básicos** (Etapas 1-7): ~3 minutos
- **Teste multi-tab** (Etapa 8): ~1 minuto
- **Teste persistência** (Etapa 9): ~30 segundos
- **TOTAL**: ~5 minutos

---

**BOA SORTE!** 🚀

Quando terminar, volte aqui e me informe o resultado! 😊
