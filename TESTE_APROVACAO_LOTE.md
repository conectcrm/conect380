# 🧪 Roteiro de Testes - Aprovação em Lote

## ✅ Status da Implementação

**Backend**: 100% Completo
- ✅ DTOs criados (AprovarLoteDto, ReprovarLoteDto, ResultadoLoteDto)
- ✅ Service methods (aprovarLote, reprovarLote)
- ✅ Controller endpoints (POST /cotacao/aprovar-lote, /cotacao/reprovar-lote)
- ✅ Validações implementadas
- ✅ Error handling robusto
- ✅ Audit logging incluído

**Frontend**: 100% Completo
- ✅ Service methods (cotacaoService.aprovarLote, reprovarLote)
- ✅ State management (Set de seleção)
- ✅ Handler functions
- ✅ Botões de ação condicional
- ✅ Checkbox "Selecionar todas"
- ✅ Checkboxes individuais
- ✅ Visual feedback (ring quando selecionado)
- ✅ Modal de confirmação (ModalAcaoLote)
- ✅ Toast notifications

---

## 📋 Pré-requisitos para Teste

1. **Backend rodando** na porta 3001
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Frontend rodando** na porta 3000
   ```powershell
   cd frontend-web
   npm start
   ```

3. **Dados de teste**:
   - Pelo menos 3 cotações criadas com status RASCUNHO
   - Cotações devem ter o mesmo `aprovadorId`
   - Usuário aprovador deve estar logado

4. **Criar cotações de teste** (se necessário):
   - Navegar para `/comercial/cotacoes`
   - Criar 3 cotações diferentes
   - Definir o mesmo aprovador para todas

---

## 🎯 Casos de Teste

### Teste 1: Selecionar e Aprovar 2 Cotações

**Passos**:
1. Acessar `/comercial/minhas-aprovacoes`
2. Verificar que aparecem pelo menos 3 cotações
3. Clicar no checkbox da primeira cotação
4. Clicar no checkbox da segunda cotação
5. Verificar que apareceram os botões "Aprovar Selecionadas (2)" e "Reprovar Selecionadas (2)"
6. Clicar em "Aprovar Selecionadas (2)"
7. No modal, preencher justificativa (opcional): "Aprovado em lote para teste"
8. Clicar em "Aprovar 2"

**Resultado Esperado**:
- ✅ Modal abre com título "Aprovar 2 Cotação(ões)"
- ✅ Alerta mostra mensagem sobre aprovação em lote
- ✅ Campo justificativa é opcional
- ✅ Botão "Aprovar 2" fica habilitado
- ✅ Toast aparece: "2 cotação(ões) aprovada(s) com sucesso!"
- ✅ Modal fecha automaticamente
- ✅ Seleção é limpa
- ✅ Lista é recarregada
- ✅ As 2 cotações não aparecem mais na lista (status mudou para APROVADA)
- ✅ Backend log mostra: `[AUDIT] APROVACAO LOTE - Total: 2, Sucessos: 2, Falhas: 0`
- ✅ 2 emails são enviados para os criadores das cotações

**Validações no Backend**:
```powershell
# Ver logs do backend
# Deve mostrar:
# [AUDIT] APROVACAO LOTE - Total: 2, Sucessos: 2, Falhas: 0, Aprovador: {userId}
# Email enviado para: {email} - {cotacaoNumero}
# Email enviado para: {email} - {cotacaoNumero}
```

---

### Teste 2: Selecionar e Reprovar 1 Cotação

**Passos**:
1. Acessar `/comercial/minhas-aprovacoes`
2. Clicar no checkbox de 1 cotação
3. Clicar em "Reprovar Selecionadas (1)"
4. No modal, deixar justificativa vazia
5. Tentar clicar em "Reprovar 1" (deve estar desabilitado)
6. Preencher justificativa com menos de 10 caracteres: "Teste"
7. Clicar em "Reprovar 1" (deve mostrar erro)
8. Preencher justificativa válida: "Reprovado devido a valores incorretos no orçamento"
9. Clicar em "Reprovar 1"

**Resultado Esperado**:
- ✅ Modal abre com título "Reprovar 1 Cotação(ões)"
- ✅ Alerta mostra aviso sobre ação não reversível
- ✅ Campo justificativa é obrigatório (marcado com *)
- ✅ Botão "Reprovar 1" fica desabilitado enquanto justificativa < 10 chars
- ✅ Erro aparece se tentar confirmar com justificativa curta
- ✅ Com justificativa válida, botão habilita
- ✅ Toast aparece: "1 cotação(ões) reprovada(s) com sucesso!"
- ✅ Modal fecha
- ✅ Seleção é limpa
- ✅ Cotação não aparece mais na lista
- ✅ Backend log mostra: `[AUDIT] REPROVACAO LOTE - Total: 1, Sucessos: 1, Falhas: 0`
- ✅ 1 email é enviado

---

### Teste 3: Selecionar Todas

**Passos**:
1. Acessar `/comercial/minhas-aprovacoes`
2. Verificar que há múltiplas cotações na lista
3. Clicar no checkbox "Selecionar todas" (acima da lista)
4. Verificar que todos os checkboxes individuais ficam marcados
5. Verificar que botões mostram o total: "Aprovar Selecionadas (X)"
6. Clicar novamente em "Selecionar todas"
7. Verificar que todos os checkboxes desmarcam
8. Botões de ação devem desaparecer

**Resultado Esperado**:
- ✅ Checkbox "Selecionar todas" só aparece se houver > 1 cotação
- ✅ Ao clicar, TODOS os checkboxes individuais são marcados
- ✅ Contadores nos botões refletem o total correto
- ✅ Visual feedback (ring azul) em todos os cards
- ✅ Ao desmarcar "todas", todos os checkboxes desmarcam
- ✅ Botões de ação desaparecem quando seleção = 0

---

### Teste 4: Falha Parcial (Cotação Já Aprovada)

**Passos**:
1. Criar 2 cotações de teste
2. Aprovar manualmente 1 delas (ação individual)
3. Selecionar ambas (incluindo a já aprovada)
4. Clicar em "Aprovar Selecionadas (2)"
5. Confirmar no modal

**Resultado Esperado**:
- ✅ Backend processa ambas (loop continua mesmo com erro)
- ✅ 1 sucesso, 1 falha
- ✅ Toast aparece: "1 aprovadas, 1 falharam" (cor de erro)
- ✅ Backend log mostra: `Total: 2, Sucessos: 1, Falhas: 1`
- ✅ Array erros contém: `[{ cotacaoId: "...", erro: "Cotação já está aprovada" }]`
- ✅ Apenas 1 email é enviado (da que foi aprovada com sucesso)

---

### Teste 5: Visual Feedback e Estados

**Passos**:
1. Acessar `/comercial/minhas-aprovacoes`
2. Selecionar 1 cotação
3. Observar visual do card
4. Selecionar mais 2 cotações
5. Observar botões no header
6. Clicar em "Aprovar Selecionadas"
7. Observar modal e loading states

**Resultado Esperado**:
- ✅ Card selecionado tem `ring-2 ring-[#159A9C]` (borda azul)
- ✅ Checkbox visual: marcado quando selecionado
- ✅ Header mostra: "{X} cotação(ões) selecionada(s)"
- ✅ Botões aparecem apenas quando seleção > 0
- ✅ Botão verde "Aprovar" com ícone CheckCircle
- ✅ Botão vermelho "Reprovar" com ícone XCircle
- ✅ Contador nos botões é dinâmico
- ✅ Modal mostra loading durante processamento
- ✅ Botões desabilitam enquanto processa
- ✅ Spinner aparece no botão "Processando..."

---

### Teste 6: Aprovação com Justificativa Opcional

**Passos**:
1. Selecionar 2 cotações
2. Clicar em "Aprovar Selecionadas"
3. Deixar justificativa em branco
4. Clicar em "Aprovar 2"

**Resultado Esperado**:
- ✅ Botão "Aprovar 2" fica habilitado mesmo sem justificativa
- ✅ Aprovação processa normalmente
- ✅ Backend recebe justificativa como `undefined`
- ✅ Toast sucesso aparece
- ✅ Emails são enviados normalmente

---

### Teste 7: Reprovação com Validação Rigorosa

**Passos**:
1. Selecionar 3 cotações
2. Clicar em "Reprovar Selecionadas"
3. Preencher justificativa: "abc" (3 caracteres)
4. Tentar clicar em "Reprovar 3"
5. Preencher: "abcdefghij" (10 caracteres)
6. Clicar em "Reprovar 3"

**Resultado Esperado**:
- ✅ Com justificativa < 10 chars, botão fica desabilitado
- ✅ Contador de caracteres mostra: "3 / 1000"
- ✅ Erro aparece: "Justificativa deve ter no mínimo 10 caracteres"
- ✅ Com 10+ chars, botão habilita
- ✅ Validação passa e reprovação processa
- ✅ Toast sucesso aparece

---

### Teste 8: Cancelamento e Fechamento

**Passos**:
1. Selecionar 2 cotações
2. Clicar em "Aprovar Selecionadas"
3. Preencher justificativa
4. Clicar em "Cancelar"
5. Verificar estado
6. Abrir modal novamente
7. Clicar no X (fechar) no canto superior direito

**Resultado Esperado**:
- ✅ Ao clicar "Cancelar", modal fecha
- ✅ Nenhuma ação é processada
- ✅ Seleção permanece ativa (checkboxes ainda marcados)
- ✅ Ao reabrir, campo justificativa está vazio (novo estado)
- ✅ X (fechar) funciona igual ao cancelar
- ✅ Nenhuma requisição HTTP é feita ao cancelar

---

### Teste 9: Responsividade

**Passos**:
1. Acessar página em desktop (1920px)
2. Redimensionar para tablet (768px)
3. Redimensionar para mobile (375px)
4. Testar seleção e ações em cada tamanho

**Resultado Esperado**:
- ✅ Desktop: Botões lado a lado no header
- ✅ Tablet: Botões empilham se necessário
- ✅ Mobile: Layout vertical, checkboxes visíveis
- ✅ Modal responsivo em todos os tamanhos
- ✅ Textarea legível em mobile
- ✅ Botões do modal acessíveis

---

### Teste 10: Notificações por Email

**Pré-requisitos**:
- Email configurado no `.env` backend
- SMTP funcionando

**Passos**:
1. Selecionar 3 cotações de criadores diferentes
2. Aprovar em lote
3. Verificar emails recebidos

**Resultado Esperado**:
- ✅ 3 emails enviados (1 por criador)
- ✅ Cada email contém:
  - Número da cotação
  - Status "APROVADA"
  - Nome do aprovador
  - Data/hora da aprovação
  - Justificativa (se fornecida)
  - Link para visualizar cotação
- ✅ Formato HTML correto
- ✅ Emails chegam em até 5 segundos

---

## 🐛 Checklist de Bugs Potenciais

Durante os testes, verificar:

- [ ] ❌ Seleção não é limpa após ação
- [ ] ❌ Modal não fecha após sucesso
- [ ] ❌ Botões não desaparecem quando seleção = 0
- [ ] ❌ Validação de justificativa não funciona
- [ ] ❌ Toast não mostra estatísticas corretas
- [ ] ❌ Emails não são enviados
- [ ] ❌ Backend log não mostra audit
- [ ] ❌ Falha parcial não é tratada
- [ ] ❌ Loading state não funciona
- [ ] ❌ Checkbox "todas" não sincroniza

---

## 📊 Métricas de Sucesso

Para considerar a feature **100% funcional**, todos os testes devem passar:

- ✅ 10/10 casos de teste passando
- ✅ 0 erros no console do navegador
- ✅ 0 erros no log do backend
- ✅ Emails enviados corretamente
- ✅ Audit logs registrados
- ✅ UI responsiva e intuitiva
- ✅ Validações funcionando
- ✅ Error handling robusto

---

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:

1. **Atualizar Documentação**:
   - Marcar "Aprovação em Lote" como ✅ IMPLEMENTADO
   - Atualizar SISTEMA_APROVACAO_COMPLETO.md

2. **Commit & Push**:
   ```powershell
   git add .
   git commit -m "feat(comercial): implementar aprovação em lote de cotações"
   git push origin main
   ```

3. **Próxima Enhancement** (opcional):
   - Dashboard de Analytics (2-3h)
   - Workflow Multi-Nível (4-6h)
   - Sistema de Comentários (2-3h)

---

## 📝 Notas Técnicas

**Performance**:
- Operação em lote processa sequencialmente (for loop)
- Cada cotação envia email assíncrono
- Tempo estimado: ~500ms por cotação
- Para 10 cotações: ~5 segundos

**Segurança**:
- Validação de UUID nos IDs
- Validação de justificativa no backend
- Autenticação via JWT (req.user)
- Apenas aprovador pode processar suas cotações

**Escalabilidade**:
- Set para seleção (O(1) lookup)
- Imutável updates no React (performance)
- Batch endpoint pode ser otimizado com Promise.all() no futuro

---

**Documento criado em**: 2025-01-18  
**Feature**: Aprovação em Lote v1.0  
**Autor**: GitHub Copilot
