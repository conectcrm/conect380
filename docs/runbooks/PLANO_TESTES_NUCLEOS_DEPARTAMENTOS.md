# 🧪 Plano de Testes - Núcleos e Departamentos

**Data**: 28 de outubro de 2025  
**Versão**: 1.0  
**Status**: Em Execução

---

## 📋 Objetivo

Validar completamente o sistema de **Núcleos → Departamentos → Agentes**, incluindo:
- Criação e vinculação
- Drag-and-drop
- 3 cenários de roteamento
- Estados vazios
- Error handling

---

## 🎯 Cenários de Teste

### 1. Gestão de Departamentos

#### 1.1. Criação de Departamento
- [ ] **TC001**: Criar departamento SEM núcleo vinculado
  - **Passos**:
    1. Acessar `/gestao/departamentos`
    2. Clicar "Novo Departamento"
    3. Preencher: Nome, Descrição, Status Ativo
    4. NÃO selecionar núcleo
    5. Clicar "Salvar"
  - **Resultado Esperado**: Departamento criado, `nucleoId = null`
  - **Status**: ⏳ Pendente

- [ ] **TC002**: Criar departamento COM núcleo vinculado
  - **Passos**:
    1. Acessar `/gestao/departamentos`
    2. Clicar "Novo Departamento"
    3. Preencher: Nome, Descrição, Status Ativo
    4. Selecionar núcleo no dropdown
    5. Clicar "Salvar"
  - **Resultado Esperado**: Departamento criado, `nucleoId = [id do núcleo]`
  - **Status**: ⏳ Pendente

- [ ] **TC003**: Validação de campos obrigatórios
  - **Passos**:
    1. Clicar "Novo Departamento"
    2. Deixar Nome em branco
    3. Tentar salvar
  - **Resultado Esperado**: Mensagem de erro, formulário não submete
  - **Status**: ⏳ Pendente

#### 1.2. Edição de Departamento
- [ ] **TC004**: Editar nome e descrição
  - **Passos**:
    1. Clicar no ícone de editar (✏️)
    2. Alterar nome e descrição
    3. Salvar
  - **Resultado Esperado**: Dados atualizados, toast de sucesso
  - **Status**: ⏳ Pendente

- [ ] **TC005**: Alterar status (Ativo → Inativo)
  - **Passos**:
    1. Clicar no toggle de status
  - **Resultado Esperado**: Status alterado, badge atualizado, toast de sucesso
  - **Status**: ⏳ Pendente

#### 1.3. Vinculação de Agentes
- [ ] **TC006**: Vincular agentes ao departamento
  - **Passos**:
    1. Clicar "Gerenciar Agentes"
    2. Buscar e selecionar 3 agentes
    3. Salvar
  - **Resultado Esperado**: Agentes vinculados, contador atualizado (+3)
  - **Status**: ⏳ Pendente

- [ ] **TC007**: Desvincular agente
  - **Passos**:
    1. Abrir "Gerenciar Agentes"
    2. Desmarcar 1 agente já selecionado
    3. Salvar
  - **Resultado Esperado**: Agente desvinculado, contador atualizado (-1)
  - **Status**: ⏳ Pendente

#### 1.4. Drag-and-Drop
- [ ] **TC008**: Reordenar departamentos (arrastar para cima)
  - **Passos**:
    1. Ter pelo menos 3 departamentos criados
    2. Arrastar departamento da posição 3 para posição 1
    3. Soltar
  - **Resultado Esperado**: 
    - Ordem atualizada visualmente (imediato)
    - Requisição PUT `/departamentos/reordenar` enviada
    - Ordem persiste após refresh (F5)
  - **Status**: ⏳ Pendente

- [ ] **TC009**: Reordenar departamentos (arrastar para baixo)
  - **Passos**:
    1. Arrastar departamento da posição 1 para posição 3
    2. Soltar
  - **Resultado Esperado**: Ordem atualizada e persistida
  - **Status**: ⏳ Pendente

- [ ] **TC010**: Erro durante reordenação (simular falha de rede)
  - **Passos**:
    1. Desconectar backend (parar npm run start:dev)
    2. Arrastar departamento
    3. Soltar
  - **Resultado Esperado**: 
    - Rollback automático (volta para ordem original)
    - Toast de erro
    - Console log com mensagem de erro
  - **Status**: ⏳ Pendente

#### 1.5. Deleção de Departamento
- [ ] **TC011**: Deletar departamento SEM agentes vinculados
  - **Passos**:
    1. Clicar no ícone de deletar (🗑️)
    2. Confirmar no dialog
  - **Resultado Esperado**: Departamento removido, toast de sucesso
  - **Status**: ⏳ Pendente

- [ ] **TC012**: Deletar departamento COM agentes vinculados
  - **Passos**:
    1. Clicar no ícone de deletar
    2. Confirmar
  - **Resultado Esperado**: 
    - Backend pode retornar erro (se implementado constraint)
    - OU departamento deletado e agentes desvinculados
  - **Status**: ⏳ Pendente

---

### 2. Gestão de Núcleos

#### 2.1. Vinculação de Departamentos via Modal

- [ ] **TC013**: Vincular departamentos existentes ao núcleo
  - **Passos**:
    1. Acessar `/gestao/nucleos`
    2. Expandir um núcleo (▼)
    3. Clicar "Vincular Departamentos"
    4. Selecionar 2 departamentos (checkbox)
    5. Salvar
  - **Resultado Esperado**: 
    - Departamentos aparecem na lista do núcleo
    - Requisição PUT para atualizar `nucleoId` de cada departamento
    - Modal fecha
    - Toast de sucesso
  - **Status**: ⏳ Pendente

- [ ] **TC014**: Desvincular departamento do núcleo
  - **Passos**:
    1. Abrir "Vincular Departamentos"
    2. Desmarcar 1 departamento já selecionado
    3. Salvar
  - **Resultado Esperado**: 
    - Departamento removido da lista do núcleo
    - `nucleoId = null` no departamento
    - Modal fecha
  - **Status**: ⏳ Pendente

- [ ] **TC015**: Buscar departamento no modal
  - **Passos**:
    1. Abrir modal
    2. Digitar nome parcial no campo de busca
  - **Resultado Esperado**: Lista filtrada em tempo real
  - **Status**: ⏳ Pendente

- [ ] **TC016**: Criar primeiro departamento (empty state)
  - **Passos**:
    1. Sistema sem nenhum departamento criado
    2. Expandir núcleo
    3. Clicar "Vincular Departamentos"
    4. Ver empty state
    5. Clicar "Criar Primeiro Departamento"
  - **Resultado Esperado**: 
    - Redirecionar para `/gestao/departamentos`
    - Modal fecha
  - **Status**: ⏳ Pendente

#### 2.2. Vinculação de Agentes Diretamente ao Núcleo

- [ ] **TC017**: Vincular agentes ao núcleo (sem departamentos)
  - **Passos**:
    1. Expandir núcleo SEM departamentos
    2. Ver badge "Agentes Destinados"
    3. Clicar no badge ou botão "Gerenciar Agentes"
    4. Selecionar 2 agentes
    5. Salvar
  - **Resultado Esperado**: 
    - Agentes vinculados diretamente ao núcleo
    - Contador atualizado
    - Toast de sucesso
  - **Status**: ⏳ Pendente

- [ ] **TC018**: Desvincular agente do núcleo
  - **Passos**:
    1. Abrir "Gerenciar Agentes"
    2. Desmarcar agente
    3. Salvar
  - **Resultado Esperado**: Agente desvinculado, contador atualizado
  - **Status**: ⏳ Pendente

---

### 3. Cenários de Roteamento (Backend Logic)

#### 3.1. Cenário 1: Núcleo COM Departamentos

- [ ] **TC019**: GET `/nucleos/:id` retorna departamentos
  - **Passos**:
    1. Criar núcleo
    2. Vincular 2 departamentos
    3. Chamar API: `GET /nucleos/:id`
  - **Resultado Esperado**:
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
  - **Status**: ⏳ Pendente

#### 3.2. Cenário 2: Núcleo SEM Departamentos, MAS COM Agentes

- [ ] **TC020**: GET `/nucleos/:id` retorna agentes destinados
  - **Passos**:
    1. Criar núcleo
    2. NÃO vincular departamentos
    3. Vincular 3 agentes diretamente ao núcleo
    4. Chamar API: `GET /nucleos/:id`
  - **Resultado Esperado**:
    ```json
    {
      "nucleo": { "id": "...", "nome": "Vendas" },
      "agentesDestinados": [
        { "id": "...", "nome": "João", "status": "disponivel" },
        { "id": "...", "nome": "Maria", "status": "ocupado" }
      ],
      "totalAtendentes": 3
    }
    ```
  - **Status**: ⏳ Pendente

#### 3.3. Cenário 3: Núcleo Vazio (Sem Departamentos e Sem Agentes)

- [ ] **TC021**: GET `/nucleos/:id` retorna vazio
  - **Passos**:
    1. Criar núcleo
    2. NÃO vincular nada
    3. Chamar API: `GET /nucleos/:id`
  - **Resultado Esperado**:
    ```json
    {
      "nucleo": { "id": "...", "nome": "Marketing" },
      "departamentos": [],
      "agentesDestinados": [],
      "totalAtendentes": 0
    }
    ```
  - **Status**: ⏳ Pendente

---

### 4. Filtros e Busca

#### 4.1. Filtro por Núcleo (em Departamentos)

- [ ] **TC022**: Filtrar departamentos por núcleo
  - **Passos**:
    1. Acessar `/gestao/departamentos`
    2. Selecionar núcleo no dropdown "Filtrar por Núcleo"
  - **Resultado Esperado**: Apenas departamentos daquele núcleo aparecem
  - **Status**: ⏳ Pendente

- [ ] **TC023**: Filtro "Sem Núcleo"
  - **Passos**:
    1. Selecionar "Sem Núcleo" no dropdown
  - **Resultado Esperado**: Apenas departamentos com `nucleoId = null`
  - **Status**: ⏳ Pendente

#### 4.2. Filtro por Status

- [ ] **TC024**: Filtrar por "Ativos"
  - **Passos**:
    1. Selecionar "Ativos" no dropdown de status
  - **Resultado Esperado**: Apenas departamentos ativos
  - **Status**: ⏳ Pendente

- [ ] **TC025**: Filtrar por "Inativos"
  - **Passos**:
    1. Selecionar "Inativos"
  - **Resultado Esperado**: Apenas departamentos inativos
  - **Status**: ⏳ Pendente

#### 4.3. Busca por Nome/Descrição

- [ ] **TC026**: Buscar departamento por nome
  - **Passos**:
    1. Digitar nome parcial no campo de busca
  - **Resultado Esperado**: Filtragem em tempo real (case-insensitive)
  - **Status**: ⏳ Pendente

---

### 5. Responsividade e UX

#### 5.1. Mobile (375px)

- [ ] **TC027**: Testar grid em mobile
  - **Passos**:
    1. Abrir DevTools (F12)
    2. Modo responsivo: 375px
    3. Navegar por `/gestao/departamentos` e `/gestao/nucleos`
  - **Resultado Esperado**: 
    - Grid 1 coluna
    - Cards legíveis
    - Botões acessíveis
  - **Status**: ⏳ Pendente

#### 5.2. Tablet (768px)

- [ ] **TC028**: Testar grid em tablet
  - **Passos**: Modo responsivo 768px
  - **Resultado Esperado**: Grid 2 colunas
  - **Status**: ⏳ Pendente

#### 5.3. Desktop (1920px)

- [ ] **TC029**: Testar grid em desktop
  - **Passos**: Tela cheia 1920px
  - **Resultado Esperado**: Grid 3 colunas
  - **Status**: ⏳ Pendente

#### 5.4. Drag-and-Drop em Touch Devices

- [ ] **TC030**: Testar drag-and-drop em mobile (simulado)
  - **Passos**:
    1. Modo responsivo mobile
    2. Tentar arrastar card
  - **Resultado Esperado**: 
    - react-beautiful-dnd suporta touch (deve funcionar)
    - OU mostrar mensagem de "arraste indisponível em mobile"
  - **Status**: ⏳ Pendente

---

### 6. Error Handling

#### 6.1. Erros de Rede

- [ ] **TC031**: Criar departamento com backend offline
  - **Passos**:
    1. Parar backend
    2. Tentar criar departamento
  - **Resultado Esperado**: 
    - Toast de erro
    - Mensagem clara (ex: "Erro de conexão com servidor")
    - Modal NÃO fecha
  - **Status**: ⏳ Pendente

- [ ] **TC032**: Salvar vinculação com backend offline
  - **Passos**:
    1. Parar backend
    2. Abrir modal de departamentos
    3. Selecionar e tentar salvar
  - **Resultado Esperado**: Toast de erro, modal permanece aberto
  - **Status**: ⏳ Pendente

#### 6.2. Dados Inválidos

- [ ] **TC033**: Nome de departamento muito longo (>255 chars)
  - **Passos**:
    1. Tentar criar departamento com nome > 255 caracteres
  - **Resultado Esperado**: 
    - Frontend: campo limitado (maxLength)
    - Backend: retorna 400 Bad Request se passar
  - **Status**: ⏳ Pendente

---

### 7. Performance

#### 7.1. Muitos Departamentos

- [ ] **TC034**: Criar 50+ departamentos e testar scroll/drag
  - **Passos**:
    1. Criar 50 departamentos
    2. Testar scroll
    3. Testar drag-and-drop
  - **Resultado Esperado**: 
    - Sem lag
    - Drag smooth
    - Reordenação rápida
  - **Status**: ⏳ Pendente

#### 7.2. Modal com Muitos Itens

- [ ] **TC035**: Modal com 100+ departamentos
  - **Passos**:
    1. Ter 100+ departamentos
    2. Abrir modal "Vincular Departamentos"
    3. Testar busca
  - **Resultado Esperado**: 
    - Lista renderiza rápido
    - Busca sem lag
    - Scroll suave
  - **Status**: ⏳ Pendente

---

## 🐛 Bugs Encontrados

### Bug #001: [Descrição]
- **Severidade**: Alta / Média / Baixa
- **Passos para Reproduzir**: 
- **Resultado Esperado**: 
- **Resultado Obtido**: 
- **Screenshot/Log**: 
- **Status**: 🔴 Aberto / 🟡 Em Correção / 🟢 Resolvido

---

## 📊 Métricas de Cobertura

| Módulo | Testes Planejados | Executados | Passaram | Falharam | Cobertura |
|--------|-------------------|------------|----------|----------|-----------|
| Gestão de Departamentos | 12 | 0 | 0 | 0 | 0% |
| Gestão de Núcleos | 6 | 0 | 0 | 0 | 0% |
| Roteamento (Backend) | 3 | 0 | 0 | 0 | 0% |
| Filtros e Busca | 5 | 0 | 0 | 0 | 0% |
| Responsividade | 4 | 0 | 0 | 0 | 0% |
| Error Handling | 3 | 0 | 0 | 0 | 0% |
| Performance | 2 | 0 | 0 | 0 | 0% |
| **TOTAL** | **35** | **0** | **0** | **0** | **0%** |

---

## 🚀 Ambiente de Testes

### Backend
- **URL**: http://localhost:3001
- **Status**: 🔴 Parado / 🟢 Rodando
- **Versão**: NestJS 10.x
- **Banco**: PostgreSQL

### Frontend
- **URL**: http://localhost:3000
- **Status**: 🔴 Parado / 🟢 Rodando
- **Versão**: React 18.x

### Ferramentas
- **Browser**: Chrome DevTools
- **API Testing**: Thunder Client / Postman
- **Network Simulation**: DevTools (Offline mode)

---

## ✅ Checklist de Execução

**Antes de Começar**:
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 3000)
- [ ] Banco de dados com dados de teste
- [ ] Console aberto (F12) para ver erros
- [ ] Network tab aberta para ver requisições

**Durante os Testes**:
- [ ] Marcar cada TC como ✅ (passou) ou ❌ (falhou)
- [ ] Registrar bugs na seção "Bugs Encontrados"
- [ ] Tirar screenshots de erros
- [ ] Copiar mensagens de erro do console
- [ ] Atualizar métricas de cobertura

**Após os Testes**:
- [ ] Calcular % de sucesso
- [ ] Priorizar bugs por severidade
- [ ] Criar issues no GitHub (se aplicável)
- [ ] Documentar melhorias identificadas
- [ ] Atualizar este documento com resultados

---

## 📝 Observações Importantes

1. **Ordem de Execução**: Seguir a ordem numérica dos TCs para manter consistência
2. **Dados de Teste**: Usar nomes descritivos (ex: "Departamento Teste TC001")
3. **Limpeza**: Apagar dados de teste após cada seção
4. **Logs**: Sempre verificar console e Network tab
5. **Rollback**: Testar funcionalidade de rollback em drag-and-drop

---

## 🎯 Próximos Passos Após Testes

1. **Se Cobertura > 90%**: 
   - ✅ Sistema validado
   - Prosseguir para Opção C (Bot/Triagem Integration)

2. **Se Bugs Críticos Encontrados**:
   - 🔴 Corrigir antes de prosseguir
   - Re-executar testes afetados

3. **Se Performance Ruim**:
   - 🔧 Otimizar queries
   - Adicionar paginação
   - Implementar virtualização de listas

---

**Última Atualização**: 28 de outubro de 2025  
**Responsável**: Equipe ConectCRM
