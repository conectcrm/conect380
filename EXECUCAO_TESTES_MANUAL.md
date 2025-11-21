# 🧪 Execução Manual de Testes - Núcleos e Departamentos

**Data**: 28 de outubro de 2025  
**Ambiente**: Desenvolvimento Local  
**Backend**: http://localhost:3001 ✅ RODANDO  
**Frontend**: http://localhost:3000 ✅ RODANDO

---

## ✅ Checklist Pré-Teste

- [x] Backend rodando (porta 3001)
- [x] Frontend rodando (porta 3000)
- [ ] Fazer login no sistema
- [ ] Abrir DevTools (F12)
- [ ] Abrir Network tab
- [ ] Navegar para `/gestao/departamentos`

---

## 📋 Roteiro de Execução

### **Preparação Inicial**

1. **Abrir Browser**:
   - URL: http://localhost:3000
   - Abrir DevTools: `F12`
   - Ir para aba `Network`

2. **Fazer Login**:
   - Email: [seu-email-teste]
   - Senha: [sua-senha-teste]
   - Verificar se login foi bem-sucedido

3. **Navegar para Gestão de Departamentos**:
   - Menu lateral → Gestão → Departamentos
   - OU acessar diretamente: http://localhost:3000/gestao/departamentos

---

## 🎯 Teste 1: Criação de Departamento SEM Núcleo (TC001)

### Passos:
1. ✅ Acessar `/gestao/departamentos`
2. ✅ Clicar no botão "Novo Departamento" (roxo, canto superior direito)
3. ✅ Preencher formulário:
   - **Nome**: `Departamento Teste TC001`
   - **Descrição**: `Departamento de teste sem vínculo com núcleo`
   - **Núcleo**: Deixar em branco (sem seleção)
   - **Status**: Ativo ✓
4. ✅ Clicar "Salvar"

### Resultado Esperado:
- ✅ Modal fecha
- ✅ Toast de sucesso aparece
- ✅ Novo card aparece no grid
- ✅ Badge "Sem Núcleo" visível
- ✅ Badge verde "Ativo"
- ✅ Contador de agentes: 0

### Verificações Técnicas:
- **Network Tab**: 
  - Requisição: `POST /departamentos`
  - Status: `201 Created`
  - Response Body: `{ id: "...", nome: "Departamento Teste TC001", nucleoId: null }`
- **Console**: Sem erros

### Status: ⏳ PENDENTE

---

## 🎯 Teste 2: Criação de Departamento COM Núcleo (TC002)

### Passos:
1. ✅ Clicar "Novo Departamento"
2. ✅ Preencher:
   - **Nome**: `Departamento Teste TC002`
   - **Descrição**: `Departamento vinculado a um núcleo`
   - **Núcleo**: Selecionar qualquer núcleo do dropdown
   - **Status**: Ativo ✓
3. ✅ Salvar

### Resultado Esperado:
- ✅ Departamento criado
- ✅ Badge mostra nome do núcleo selecionado (não "Sem Núcleo")
- ✅ Response: `nucleoId: "[id-do-nucleo]"`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 3: Validação de Campos Obrigatórios (TC003)

### Passos:
1. ✅ Clicar "Novo Departamento"
2. ✅ **NÃO** preencher o campo "Nome"
3. ✅ Tentar clicar "Salvar"

### Resultado Esperado:
- ✅ Campo "Nome" fica com borda vermelha
- ✅ Mensagem de erro: "Nome é obrigatório" (ou similar)
- ✅ Modal **NÃO** fecha
- ✅ **NÃO** faz requisição HTTP

### Status: ⏳ PENDENTE

---

## 🎯 Teste 4: Editar Departamento (TC004)

### Passos:
1. ✅ Encontrar card do "Departamento Teste TC001"
2. ✅ Clicar no ícone de editar (✏️ lápis)
3. ✅ Alterar:
   - **Nome**: `Departamento TC001 EDITADO`
   - **Descrição**: `Descrição atualizada`
4. ✅ Salvar

### Resultado Esperado:
- ✅ Modal fecha
- ✅ Card atualizado com novo nome
- ✅ Toast de sucesso
- ✅ Network: `PUT /departamentos/:id` → 200 OK

### Status: ⏳ PENDENTE

---

## 🎯 Teste 5: Alterar Status (TC005)

### Passos:
1. ✅ Encontrar departamento com status "Ativo" (badge verde)
2. ✅ Clicar no toggle/switch de status

### Resultado Esperado:
- ✅ Badge muda: Verde "Ativo" → Vermelho "Inativo"
- ✅ Toast de sucesso
- ✅ Network: `PATCH /departamentos/:id/status` → 200 OK
- ✅ Card fica com opacidade reduzida (60%)

### Status: ⏳ PENDENTE

---

## 🎯 Teste 6: Vincular Agentes ao Departamento (TC006)

### Passos:
1. ✅ No card do departamento, clicar "Gerenciar Agentes"
2. ✅ No modal que abre:
   - Buscar e selecionar **3 agentes** (usar checkboxes)
3. ✅ Clicar "Salvar"

### Resultado Esperado:
- ✅ Modal fecha
- ✅ Contador de agentes no card: `0 → 3`
- ✅ Toast de sucesso
- ✅ Network: 3 requisições `PUT /atendentes/:id` com `departamentoId`

### Observação:
- Se não houver agentes cadastrados, criar alguns primeiro em `/gestao/atendentes`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 7: Desvincular Agente (TC007)

### Passos:
1. ✅ Abrir "Gerenciar Agentes" do departamento com agentes vinculados
2. ✅ **Desmarcar** 1 agente que estava selecionado
3. ✅ Salvar

### Resultado Esperado:
- ✅ Contador: `3 → 2`
- ✅ Toast de sucesso
- ✅ Network: `PUT /atendentes/:id` com `departamentoId: null`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 8: Drag-and-Drop (Arrastar para Cima) (TC008)

### Pré-requisito:
- Ter **pelo menos 3 departamentos** criados

### Passos:
1. ✅ Identificar ordem atual (ex: A, B, C)
2. ✅ Clicar e **segurar** no ícone `⋮⋮` do departamento **C** (terceiro)
3. ✅ **Arrastar** para cima até a posição 1
4. ✅ **Soltar**

### Resultado Esperado:
- ✅ **Animação visual**: card "levanta" (shadow-2xl), anel roxo (ring-2)
- ✅ **Ordem atualizada instantaneamente**: C, A, B
- ✅ **Network**: `PUT /departamentos/reordenar`
  - Request Body: `{ departamentosIds: ["id-C", "id-A", "id-B"] }`
  - Status: 200 OK
- ✅ **Persistência**: Fazer refresh (F5) → ordem **mantida** como C, A, B

### Status: ⏳ PENDENTE

---

## 🎯 Teste 9: Drag-and-Drop (Arrastar para Baixo) (TC009)

### Passos:
1. ✅ Arrastar departamento da **posição 1** para **posição 3**
2. ✅ Soltar

### Resultado Esperado:
- ✅ Ordem atualizada: A, B, C → B, C, A
- ✅ Requisição enviada e persistida
- ✅ F5 mantém nova ordem

### Status: ⏳ PENDENTE

---

## 🎯 Teste 10: Erro no Drag-and-Drop (TC010)

### Passos:
1. ✅ **PARAR o backend**: No terminal, `Ctrl+C` no processo do backend
2. ✅ Tentar arrastar um departamento
3. ✅ Soltar

### Resultado Esperado:
- ✅ **Animação de drag funciona**
- ✅ **Rollback automático**: Cards voltam para posição original (não persiste a mudança)
- ✅ **Toast de ERRO** aparece: "Erro ao reordenar departamentos" (ou similar)
- ✅ **Console log**: Mensagem de erro com detalhes
- ✅ **Network**: `PUT /departamentos/reordenar` → Status `ERR_CONNECTION_REFUSED` ou `500`

### Ação Pós-Teste:
- ✅ **RELIGAR o backend**: `npm run start:dev` na pasta `backend`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 11: Deletar Departamento SEM Agentes (TC011)

### Passos:
1. ✅ Criar novo departamento de teste (sem vincular agentes)
2. ✅ Clicar no ícone de **deletar** (🗑️ lixeira)
3. ✅ **Confirmar** no dialog de confirmação

### Resultado Esperado:
- ✅ Departamento **removido** do grid
- ✅ Toast de sucesso
- ✅ Network: `DELETE /departamentos/:id` → 200 OK
- ✅ Dashboard atualizado (contador "Total" diminui)

### Status: ⏳ PENDENTE

---

## 🎯 Teste 12: Deletar Departamento COM Agentes (TC012)

### Passos:
1. ✅ Departamento com agentes vinculados
2. ✅ Clicar em deletar (🗑️)
3. ✅ Confirmar

### Resultado Esperado (2 possibilidades):

**Cenário A** (se backend bloqueia):
- ❌ Erro 400/409
- ❌ Toast: "Não é possível deletar departamento com agentes vinculados"
- ❌ Departamento **permanece** no grid

**Cenário B** (se backend permite):
- ✅ Departamento deletado
- ✅ Agentes desvinculados (`departamentoId = null`)
- ✅ Toast de sucesso

### Status: ⏳ PENDENTE

---

## 🎯 Teste 13: Vincular Departamentos ao Núcleo (TC013)

### Passos:
1. ✅ Navegar para `/gestao/nucleos`
2. ✅ Expandir um núcleo (clicar no ícone `▼`)
3. ✅ Clicar botão "**Vincular Departamentos**"
4. ✅ No modal:
   - Selecionar **2 departamentos** (checkbox)
5. ✅ Clicar "Salvar"

### Resultado Esperado:
- ✅ Modal fecha
- ✅ **2 departamentos aparecem** na lista expandida do núcleo
- ✅ Cada card de departamento mostra:
   - Nome
   - Descrição
   - Badge do núcleo
   - Contador de agentes
- ✅ Toast de sucesso
- ✅ Network: 2 requisições `PUT /departamentos/:id` com `{ nucleoId: "[id-do-nucleo]" }`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 14: Desvincular Departamento do Núcleo (TC014)

### Passos:
1. ✅ Abrir modal "Vincular Departamentos"
2. ✅ **Desmarcar** 1 departamento que estava selecionado
3. ✅ Salvar

### Resultado Esperado:
- ✅ Departamento **removido** da lista do núcleo
- ✅ Network: `PUT /departamentos/:id` com `{ nucleoId: null }`
- ✅ Toast de sucesso

### Status: ⏳ PENDENTE

---

## 🎯 Teste 15: Buscar Departamento no Modal (TC015)

### Passos:
1. ✅ Abrir modal "Vincular Departamentos"
2. ✅ Digitar nome parcial no campo de busca (ex: "tec" para encontrar "Técnico")

### Resultado Esperado:
- ✅ Lista **filtrada em tempo real** (sem delay)
- ✅ Apenas departamentos com nome/descrição contendo "tec" aparecem
- ✅ Busca **case-insensitive** (maiúsculas/minúsculas ignoradas)

### Status: ⏳ PENDENTE

---

## 🎯 Teste 16: Empty State - Criar Primeiro Departamento (TC016)

### Pré-requisito:
- Sistema **SEM nenhum departamento** criado (apagar todos para teste)

### Passos:
1. ✅ Expandir um núcleo
2. ✅ Clicar "Vincular Departamentos"
3. ✅ Ver **empty state** com mensagem: "Nenhum departamento cadastrado"
4. ✅ Clicar botão "**Criar Primeiro Departamento**"

### Resultado Esperado:
- ✅ **Redireciona** para `/gestao/departamentos`
- ✅ Modal **fecha**
- ✅ URL muda (verificar na barra de endereço)

### Status: ⏳ PENDENTE

---

## 🎯 Teste 17: Vincular Agentes Diretamente ao Núcleo (TC017)

### Pré-requisito:
- Núcleo **SEM departamentos** vinculados

### Passos:
1. ✅ Expandir núcleo **sem departamentos**
2. ✅ Ver badge "**Agentes Destinados: 0**"
3. ✅ Clicar no badge ou botão "Gerenciar Agentes"
4. ✅ Selecionar **2 agentes**
5. ✅ Salvar

### Resultado Esperado:
- ✅ Badge atualizado: "Agentes Destinados: **2**"
- ✅ Lista de agentes aparece (avatar, nome, status)
- ✅ Toast de sucesso
- ✅ Network: 2 requisições `PUT /atendentes/:id` com `{ nucleoId: "[id]" }`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 18: Desvincular Agente do Núcleo (TC018)

### Passos:
1. ✅ Abrir "Gerenciar Agentes" do núcleo
2. ✅ **Desmarcar** 1 agente
3. ✅ Salvar

### Resultado Esperado:
- ✅ Badge: `2 → 1`
- ✅ Agente removido da lista visual
- ✅ Network: `PUT /atendentes/:id` com `{ nucleoId: null }`

### Status: ⏳ PENDENTE

---

## 🎯 Teste 19-21: Cenários de Roteamento (Backend API)

### Teste com Thunder Client / Postman:

**TC019 - Núcleo COM Departamentos**:
```http
GET http://localhost:3001/nucleos/[id-do-nucleo]
Authorization: Bearer [seu-token-jwt]
```

**Resultado Esperado**:
```json
{
  "nucleo": { "id": "...", "nome": "Suporte" },
  "departamentos": [
    { "id": "...", "nome": "Técnico", "agentes": 3 },
    { "id": "...", "nome": "Financeiro", "agentes": 2 }
  ],
  "totalAtendentes": 5
}
```

**TC020 - Núcleo SEM Departamentos, COM Agentes**:
```json
{
  "nucleo": { "id": "...", "nome": "Vendas" },
  "agentesDestinados": [
    { "id": "...", "nome": "João", "status": "disponivel" }
  ],
  "totalAtendentes": 3
}
```

**TC021 - Núcleo Vazio**:
```json
{
  "nucleo": { "id": "...", "nome": "Marketing" },
  "departamentos": [],
  "agentesDestinados": [],
  "totalAtendentes": 0
}
```

### Status: ⏳ PENDENTE

---

## 🎯 Teste 22-26: Filtros e Busca

### TC022: Filtrar por Núcleo
1. ✅ Acessar `/gestao/departamentos`
2. ✅ Dropdown "Filtrar por Núcleo" → Selecionar núcleo
3. ✅ **Resultado**: Apenas departamentos daquele núcleo

### TC023: Filtrar "Sem Núcleo"
1. ✅ Selecionar "Sem Núcleo"
2. ✅ **Resultado**: Apenas departamentos com `nucleoId = null`

### TC024: Filtrar por "Ativos"
1. ✅ Dropdown "Status" → "Ativos"
2. ✅ **Resultado**: Apenas departamentos com badge verde

### TC025: Filtrar por "Inativos"
1. ✅ Selecionar "Inativos"
2. ✅ **Resultado**: Apenas departamentos com badge vermelho

### TC026: Buscar por Nome
1. ✅ Digitar no campo de busca
2. ✅ **Resultado**: Filtragem em tempo real

### Status: ⏳ PENDENTE

---

## 🎯 Teste 27-29: Responsividade

### TC027: Mobile (375px)
1. ✅ DevTools (F12) → Toggle device toolbar (`Ctrl+Shift+M`)
2. ✅ Selecionar "iPhone SE" ou definir 375px
3. ✅ Verificar:
   - Grid: **1 coluna**
   - Cards: legíveis
   - Botões: acessíveis (não cortados)
   - Modal: responsivo

### TC028: Tablet (768px)
1. ✅ Definir 768px
2. ✅ Grid: **2 colunas**

### TC029: Desktop (1920px)
1. ✅ Tela cheia
2. ✅ Grid: **3 colunas**

### Status: ⏳ PENDENTE

---

## 🎯 Teste 30: Drag-and-Drop em Touch (TC030)

### Passos:
1. ✅ Modo responsivo mobile (375px)
2. ✅ Tentar arrastar card (simular touch)

### Resultado Esperado:
- ✅ react-beautiful-dnd **suporta touch** (deve funcionar)
- OU ❌ Mensagem de "arraste indisponível em mobile"

### Status: ⏳ PENDENTE

---

## 🎯 Teste 31-32: Error Handling

### TC031: Criar com Backend Offline
1. ✅ **PARAR backend**
2. ✅ Tentar criar departamento
3. ✅ **Resultado**: Toast de erro, modal permanece aberto

### TC032: Salvar Vinculação com Backend Offline
1. ✅ Backend offline
2. ✅ Tentar salvar vinculação
3. ✅ **Resultado**: Toast de erro, modal aberto

### Status: ⏳ PENDENTE

---

## 📊 Progresso Atual

| Testes Executados | Passaram | Falharam | Pendentes |
|-------------------|----------|----------|-----------|
| 0 / 35            | 0        | 0        | 35        |

**Próximo Teste**: TC001 - Criar Departamento Sem Núcleo

---

## 📝 Instruções Finais

1. **Execute um teste por vez** seguindo a ordem
2. **Marque ✅ ou ❌** em cada "Status:"
3. **Anote bugs** na seção de bugs do PLANO_TESTES
4. **Tire screenshots** de erros
5. **Copie mensagens** do console
6. **Verifique Network tab** em cada ação

**Boa sorte nos testes! 🚀**
