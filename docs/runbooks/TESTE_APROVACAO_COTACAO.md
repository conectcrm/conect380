# 🧪 Teste de Fluxo de Aprovação de Cotações

**Data**: 15 de novembro de 2025  
**Funcionalidade**: Sistema de aprovação/reprovação de cotações

---

## ✅ Pré-requisitos

- [x] Backend rodando na porta 3001
- [x] Frontend rodando na porta 3000
- [x] Navegador aberto em http://localhost:3000/comercial/minhas-aprovacoes
- [ ] Cotações pendentes de aprovação disponíveis

---

## 🎯 Cenários de Teste

### 1️⃣ Teste de Aprovação COM Justificativa

**Objetivo**: Verificar fluxo completo de aprovação com observação opcional

**Passos**:
1. [ ] Identificar uma cotação na lista de "Minhas Aprovações"
2. [ ] Clicar no botão verde "Aprovar"
3. [ ] Verificar que modal abre com 2 etapas
4. [ ] **Etapa 1**: Verificar exibição dos dados da cotação (número, fornecedor, título, valor)
5. [ ] **Etapa 1**: Clicar no card verde "Aprovar Cotação"
6. [ ] **Etapa 2**: Digitar justificativa opcional (ex: "Aprovado conforme orçamento")
7. [ ] Clicar em "Confirmar Aprovação"
8. [ ] Verificar toast de sucesso: "Cotação aprovada com sucesso!"
9. [ ] Verificar que modal fecha automaticamente
10. [ ] Verificar que cotação desaparece da lista
11. [ ] Verificar no banco: `statusAprovacao = 'aprovado'`
12. [ ] Verificar no banco: `status = 'aprovada'`
13. [ ] Verificar no banco: `dataAprovacao` preenchida
14. [ ] Verificar no banco: `justificativaAprovacao` com texto digitado

**Resultado Esperado**: ✅ Aprovação registrada com sucesso

---

### 2️⃣ Teste de Aprovação SEM Justificativa

**Objetivo**: Verificar que justificativa é opcional para aprovação

**Passos**:
1. [ ] Clicar em "Aprovar" em outra cotação
2. [ ] **Etapa 1**: Clicar no card verde "Aprovar Cotação"
3. [ ] **Etapa 2**: NÃO digitar nada no campo de justificativa
4. [ ] Clicar em "Confirmar Aprovação" diretamente
5. [ ] Verificar toast de sucesso
6. [ ] Verificar que cotação desaparece
7. [ ] Verificar no banco: `justificativaAprovacao = NULL`

**Resultado Esperado**: ✅ Aprovação sem justificativa aceita

---

### 3️⃣ Teste de Reprovação SEM Justificativa (Validação)

**Objetivo**: Verificar que justificativa é OBRIGATÓRIA para reprovação

**Passos**:
1. [ ] Clicar em "Rejeitar" em uma cotação
2. [ ] **Etapa 1**: Clicar no card vermelho "Reprovar Cotação"
3. [ ] **Etapa 2**: NÃO digitar nada no campo de justificativa
4. [ ] Tentar clicar em "Confirmar Reprovação"
5. [ ] Verificar que botão está desabilitado OU
6. [ ] Verificar mensagem de erro: "Justificativa obrigatória para reprovação"
7. [ ] Verificar que modal NÃO fecha

**Resultado Esperado**: ✅ Validação impede reprovação sem justificativa

---

### 4️⃣ Teste de Reprovação COM Justificativa

**Objetivo**: Verificar fluxo completo de reprovação

**Passos**:
1. [ ] Clicar em "Rejeitar" em uma cotação
2. [ ] **Etapa 1**: Clicar no card vermelho "Reprovar Cotação"
3. [ ] **Etapa 2**: Digitar justificativa (ex: "Valor acima do orçamento aprovado")
4. [ ] Clicar em "Confirmar Reprovação"
5. [ ] Verificar toast: "Cotação reprovada"
6. [ ] Verificar que modal fecha
7. [ ] Verificar que cotação desaparece da lista
8. [ ] Verificar no banco: `statusAprovacao = 'reprovado'`
9. [ ] Verificar no banco: `status = 'rejeitada'`
10. [ ] Verificar no banco: `dataAprovacao` preenchida
11. [ ] Verificar no banco: `justificativaAprovacao` com texto digitado

**Resultado Esperado**: ✅ Reprovação registrada com sucesso

---

### 5️⃣ Teste de Cancelamento do Modal

**Objetivo**: Verificar que cancelar não executa ação

**Passos**:
1. [ ] Clicar em "Aprovar" em uma cotação
2. [ ] **Etapa 1**: Clicar no card "Aprovar Cotação"
3. [ ] **Etapa 2**: Digitar alguma justificativa
4. [ ] Clicar no botão "Voltar"
5. [ ] Verificar que volta para **Etapa 1**
6. [ ] Clicar no X (fechar) no canto superior direito
7. [ ] Verificar que modal fecha
8. [ ] Verificar que cotação PERMANECE na lista (sem alteração)

**Resultado Esperado**: ✅ Cancelamento não altera banco de dados

---

### 6️⃣ Teste de Validação de Permissão (Backend)

**Objetivo**: Verificar que apenas o aprovador designado pode aprovar

**Passos**:
1. [ ] Fazer login com usuário diferente do aprovadorId
2. [ ] Tentar acessar "Minhas Aprovações"
3. [ ] Verificar se lista está vazia (sem cotações para este usuário)
4. [ ] OU: Tentar aprovar via API direta (Postman):
   ```
   POST http://localhost:3001/cotacao/{id}/aprovar
   Headers: Authorization: Bearer {token-usuario-nao-aprovador}
   Body: { "justificativa": "teste" }
   ```
5. [ ] Verificar erro 403 Forbidden ou mensagem:
   "Você não tem permissão para aprovar esta cotação"

**Resultado Esperado**: ✅ Validação de permissão funcionando

---

### 7️⃣ Teste de Dupla Aprovação (Backend)

**Objetivo**: Verificar que não pode aprovar 2x a mesma cotação

**Passos**:
1. [ ] Aprovar uma cotação normalmente
2. [ ] Tentar aprovar novamente via API:
   ```
   POST http://localhost:3001/cotacao/{id}/aprovar
   Body: { "justificativa": "teste duplo" }
   ```
3. [ ] Verificar erro 400 Bad Request ou mensagem:
   "Esta cotação já foi aprovada/reprovada"

**Resultado Esperado**: ✅ Dupla aprovação bloqueada

---

## 📊 Consultas SQL para Verificação

### Antes de Testar (Ver cotações pendentes)
```sql
SELECT 
  id, 
  numero, 
  titulo, 
  status, 
  aprovador_id,
  status_aprovacao,
  data_aprovacao,
  justificativa_aprovacao
FROM cotacoes 
WHERE status = 'aguardando_aprovacao' 
  AND aprovador_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### Durante Teste (Acompanhar mudanças em tempo real)
```sql
-- Substituir {id} pelo ID da cotação testada
SELECT 
  numero,
  titulo,
  status,
  status_aprovacao,
  data_aprovacao,
  justificativa_aprovacao,
  updated_at
FROM cotacoes 
WHERE id = '{id}';
```

### Após Testes (Ver histórico de aprovações)
```sql
SELECT 
  c.numero,
  c.titulo,
  c.status,
  c.status_aprovacao,
  c.data_aprovacao,
  c.justificativa_aprovacao,
  u.nome as aprovador_nome
FROM cotacoes c
LEFT JOIN users u ON c.aprovador_id = u.id
WHERE c.status_aprovacao IN ('aprovado', 'reprovado')
ORDER BY c.data_aprovacao DESC
LIMIT 10;
```

---

## 🐛 Problemas Encontrados

### Lista de Bugs/Issues
- [ ] Nenhum problema encontrado (esperado) ✅

---

## ✅ Critérios de Sucesso

- [ ] Modal abre corretamente ao clicar em Aprovar/Rejeitar
- [ ] Fluxo de 2 etapas funciona (escolha → justificativa)
- [ ] Dados da cotação exibidos corretamente no modal
- [ ] Aprovação COM justificativa funciona
- [ ] Aprovação SEM justificativa funciona
- [ ] Reprovação SEM justificativa é bloqueada (validação)
- [ ] Reprovação COM justificativa funciona
- [ ] Toast de sucesso aparece
- [ ] Modal fecha após confirmar
- [ ] Lista atualiza automaticamente (cotação desaparece)
- [ ] Banco de dados atualiza: status_aprovacao
- [ ] Banco de dados atualiza: status (aprovada/rejeitada)
- [ ] Banco de dados atualiza: data_aprovacao
- [ ] Banco de dados atualiza: justificativa_aprovacao
- [ ] Validação de permissão funciona
- [ ] Dupla aprovação é bloqueada

---

## 📝 Observações

*(Anotar qualquer comportamento inesperado ou sugestão de melhoria)*

