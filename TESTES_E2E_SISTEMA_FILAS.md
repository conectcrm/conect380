# 🧪 Testes E2E - Sistema de Filas

**Data**: Novembro 2025  
**Sprint**: Sistema de Filas - Etapa 5.9  
**Objetivo**: Validar funcionamento completo do Sistema de Filas (Backend + Frontend)

---

## 📋 Checklist de Testes

### ✅ Backend - Testes via Postman/Thunder Client

#### 1. CRUD de Filas

- [ ] **POST /api/filas** - Criar fila
  ```json
  {
    "nome": "Suporte Técnico",
    "descricao": "Fila para atendimentos de suporte técnico",
    "ativo": true,
    "estrategiaDistribuicao": "ROUND_ROBIN",
    "distribuicaoAutomatica": true,
    "empresaId": "uuid-empresa"
  }
  ```
  - ✅ Espera: Status 201, retorna fila criada com ID
  - ✅ Validar: Campos corretos, estratégia padrão ROUND_ROBIN

- [ ] **GET /api/filas** - Listar todas as filas
  - ✅ Espera: Status 200, array com filas
  - ✅ Validar: Paginação, filtros (ativo=true/false)

- [ ] **GET /api/filas/:id** - Buscar fila por ID
  - ✅ Espera: Status 200, retorna fila específica
  - ❌ Erro esperado: 404 se ID não existir

- [ ] **PATCH /api/filas/:id** - Atualizar fila
  ```json
  {
    "nome": "Suporte Técnico VIP",
    "estrategiaDistribuicao": "MENOR_CARGA"
  }
  ```
  - ✅ Espera: Status 200, retorna fila atualizada

- [ ] **DELETE /api/filas/:id** - Deletar fila
  - ✅ Espera: Status 204 (No Content)
  - ❌ Erro esperado: 404 se ID não existir

---

#### 2. Gestão de Atendentes na Fila

- [ ] **POST /api/filas/:id/atendentes** - Adicionar atendente
  ```json
  {
    "atendenteId": "uuid-atendente",
    "capacidadeMaxima": 5,
    "prioridade": 1
  }
  ```
  - ✅ Espera: Status 201, atendente adicionado
  - ❌ Erro esperado: 409 se atendente já está na fila

- [ ] **GET /api/filas/:id/atendentes** - Listar atendentes da fila
  - ✅ Espera: Status 200, array com atendentes + métricas (disponibilidade, atendimentos atuais)

- [ ] **PATCH /api/filas/:id/atendentes/:atendenteId** - Atualizar capacidade/prioridade
  ```json
  {
    "capacidadeMaxima": 10,
    "prioridade": 2
  }
  ```
  - ✅ Espera: Status 200, dados atualizados

- [ ] **DELETE /api/filas/:id/atendentes/:atendenteId** - Remover atendente
  - ✅ Espera: Status 204
  - ❌ Erro esperado: 404 se atendente não estiver na fila

---

#### 3. Distribuição de Tickets (3 Estratégias)

**Setup**: Criar fila com 3 atendentes (capacidades diferentes)

##### **Estratégia 1: ROUND_ROBIN**
- [ ] **POST /api/filas/:id/distribuir** - Distribuir 6 tickets
  ```json
  { "ticketId": "ticket-1" }
  ```
  - ✅ Validar: Distribuição circular (A → B → C → A → B → C)
  - ✅ Verificar: Campo `atendenteId` preenchido em cada ticket

##### **Estratégia 2: MENOR_CARGA**
- [ ] Mudar estratégia da fila para `MENOR_CARGA`
- [ ] Atribuir 2 tickets manualmente ao Atendente A
- [ ] **POST /api/filas/:id/distribuir** - Distribuir novo ticket
  - ✅ Validar: Ticket vai para atendente com MENOS atendimentos atuais (B ou C)
  - ✅ Verificar: Atendente A (com 2 tickets) não recebe novo

##### **Estratégia 3: POR_PRIORIDADE**
- [ ] Mudar estratégia da fila para `POR_PRIORIDADE`
- [ ] Definir prioridades: A=3 (alta), B=2 (média), C=1 (baixa)
- [ ] **POST /api/filas/:id/distribuir** - Distribuir 3 tickets
  - ✅ Validar: Atendente A (prioridade 3) recebe primeiro
  - ✅ Validar: Depois B (prioridade 2), depois C (prioridade 1)

---

#### 4. Métricas da Fila

- [ ] **GET /api/filas/:id/metricas** - Obter métricas
  - ✅ Espera: Status 200, objeto com:
    ```json
    {
      "totalAtendentes": 3,
      "atendentesDisponiveis": 2,
      "ticketsNaFila": 5,
      "capacidadeTotal": 15,
      "capacidadeUtilizada": 5,
      "percentualUtilizacao": 33.33,
      "tempoMedioAtendimento": 180
    }
    ```

---

#### 5. Testes de Erro (Error Handling)

- [ ] **POST /api/filas** - Criar fila sem nome
  - ❌ Espera: Status 400, erro de validação

- [ ] **POST /api/filas/:id/distribuir** - Distribuir sem ticket ID
  - ❌ Espera: Status 400, "ticketId é obrigatório"

- [ ] **POST /api/filas/:id/distribuir** - Fila sem atendentes
  - ❌ Espera: Status 400, "Nenhum atendente disponível"

- [ ] **POST /api/filas/:id/atendentes** - Capacidade negativa
  - ❌ Espera: Status 400, erro de validação

- [ ] **PATCH /api/filas/uuid-invalido** - ID inválido
  - ❌ Espera: Status 400, "UUID inválido"

---

### 🎨 Frontend - Testes de UI

#### 1. Gestão de Filas (Página /nuclei/configuracoes/filas)

- [ ] **Navegação**
  - Abrir menu Núcleo > Configurações > Filas
  - ✅ Validar: URL correta, página carrega sem erros

- [ ] **KPI Cards**
  - ✅ Validar: 4 cards visíveis (Total, Ativas, Inativas, Atendentes)
  - ✅ Validar: Números corretos (bater com backend)

- [ ] **Criar Fila**
  - Clicar "Nova Fila"
  - Preencher formulário:
    - Nome: "Vendas Premium"
    - Descrição: "Fila para clientes premium"
    - Estratégia: ROUND_ROBIN
    - Distribuição Automática: ✅
    - Status: Ativo
  - Salvar
  - ✅ Validar: Toast de sucesso, fila aparece na lista

- [ ] **Editar Fila**
  - Clicar em fila existente
  - Alterar estratégia para MENOR_CARGA
  - Salvar
  - ✅ Validar: Toast de sucesso, mudança refletida

- [ ] **Adicionar Atendentes**
  - Abrir modal "Adicionar Atendente"
  - Selecionar atendente
  - Capacidade: 8
  - Prioridade: 2
  - Salvar
  - ✅ Validar: Atendente aparece na lista da fila

- [ ] **Remover Atendente**
  - Clicar no X de um atendente
  - Confirmar
  - ✅ Validar: Toast de sucesso, atendente removido

- [ ] **Inativar Fila**
  - Toggle "Ativo/Inativo"
  - ✅ Validar: Status muda, badge atualiza

- [ ] **Deletar Fila**
  - Clicar botão deletar
  - Confirmar
  - ✅ Validar: Fila removida da lista

---

#### 2. Integração com ChatOmnichannel

- [ ] **Criar Ticket Sem Fila**
  - Abrir ChatOmnichannel
  - Criar novo atendimento
  - ✅ Validar: Ticket criado sem filaId

- [ ] **Botão Selecionar Fila**
  - Selecionar ticket sem fila
  - ✅ Validar: Botão Users (ícone) visível no header
  - Clicar no botão
  - ✅ Validar: Modal SelecionarFilaModal abre

- [ ] **Selecionar Fila no Ticket**
  - No modal:
    - Selecionar fila "Suporte Técnico"
    - ✅ Validar: Lista de atendentes aparece
    - Escolher opção "Distribuir Automaticamente"
  - Confirmar
  - ✅ Validar:
    - Toast de sucesso
    - Botão Users desaparece
    - FilaIndicator aparece no header

- [ ] **FilaIndicator (Badge)**
  - ✅ Validar: Badge com nome da fila
  - Hover no badge
  - ✅ Validar: Tooltip com detalhes (atendente, estratégia)
  - Clicar no X do badge
  - Confirmar remoção
  - ✅ Validar: Fila removida, botão Users volta

---

#### 3. Auto-Distribuição

- [ ] **Criar Fila com Auto-Distribuição**
  - Criar fila "Suporte Rápido"
  - Distribuição Automática: ✅
  - Estratégia: ROUND_ROBIN
  - Adicionar 2 atendentes

- [ ] **Testar Auto-Distribuição**
  - Criar novo ticket
  - Selecionar fila "Suporte Rápido"
  - ✅ Validar:
    - Toast: "Ticket distribuído para {atendente}"
    - Atendente preenchido automaticamente
    - FilaIndicator mostra atendente

---

#### 4. Responsividade

- [ ] **Desktop (1920px)**
  - ✅ Grid de filas: 3 colunas
  - ✅ KPI cards: 4 colunas
  - ✅ Todos os botões visíveis

- [ ] **Tablet (768px)**
  - ✅ Grid de filas: 2 colunas
  - ✅ KPI cards: 2 colunas
  - ✅ Layout ajustado, sem scroll horizontal

- [ ] **Mobile (375px)**
  - ✅ Grid de filas: 1 coluna
  - ✅ KPI cards: 1 coluna
  - ✅ Botões empilhados verticalmente

---

#### 5. Estados de Loading e Erro

- [ ] **Loading States**
  - ✅ Validar: Skeleton/spinner ao carregar filas
  - ✅ Validar: Botões desabilitados durante salvamento

- [ ] **Empty States**
  - Deletar todas as filas
  - ✅ Validar: Mensagem "Nenhuma fila encontrada"
  - ✅ Validar: CTA "Criar primeira fila"

- [ ] **Error States**
  - Simular erro de rede (desligar backend)
  - Tentar criar fila
  - ✅ Validar: Toast de erro com mensagem clara
  - ✅ Validar: Formulário não reseta

---

## 🎯 Cenários de Teste Completos

### Cenário 1: Atendimento com Round-Robin

1. ✅ Criar fila "Suporte Nível 1" (ROUND_ROBIN, auto=true)
2. ✅ Adicionar 3 atendentes (capacidade 5 cada)
3. ✅ Criar 6 tickets
4. ✅ Atribuir fila aos tickets
5. ✅ Verificar: Distribuição circular (1→A, 2→B, 3→C, 4→A, 5→B, 6→C)

### Cenário 2: Balanceamento por Carga

1. ✅ Criar fila "Comercial" (MENOR_CARGA, auto=true)
2. ✅ Adicionar 2 atendentes (capacidade 10 cada)
3. ✅ Atendente A já tem 3 tickets
4. ✅ Criar novo ticket e atribuir fila
5. ✅ Verificar: Ticket vai para Atendente B (menor carga)

### Cenário 3: Priorização de Especialistas

1. ✅ Criar fila "Suporte Avançado" (POR_PRIORIDADE, auto=true)
2. ✅ Adicionar atendentes:
   - Senior (prioridade 3)
   - Pleno (prioridade 2)
   - Júnior (prioridade 1)
3. ✅ Criar 5 tickets e atribuir fila
4. ✅ Verificar: Senior recebe mais tickets (respeitando capacidade)

---

## 📊 Métricas de Sucesso

- [ ] ✅ Backend: 0 erros de compilação TypeScript
- [ ] ✅ Backend: Todos os endpoints retornam status HTTP corretos
- [ ] ✅ Frontend: 0 erros no console (F12)
- [ ] ✅ Frontend: Todas as ações geram feedback visual (toast/loading)
- [ ] ✅ Distribuição: Estratégias funcionam conforme especificado
- [ ] ✅ Performance: Tempo de resposta < 500ms (endpoints)
- [ ] ✅ Responsividade: Layout OK em 3 breakpoints

---

## 🐛 Bugs Encontrados

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| 1 | - | - | - |

---

## ✅ Aprovação Final

- [ ] Todos os testes backend passaram
- [ ] Todos os testes frontend passaram
- [ ] Responsividade validada
- [ ] Error handling funciona corretamente
- [ ] Performance aceitável
- [ ] Código pronto para produção

**Testado por**: [Nome]  
**Data**: [Data]  
**Aprovado**: ☐ Sim ☐ Não

---

## 📝 Observações

[Espaço para notas adicionais sobre os testes]
