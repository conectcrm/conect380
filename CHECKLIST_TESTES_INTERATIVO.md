# ✅ Checklist de Testes em Execução - 28/10/2025

**Status**: 🔄 EM ANDAMENTO  
**Início**: ${new Date().toLocaleTimeString('pt-BR')}  
**Navegador**: Aberto em http://localhost:3000/gestao/departamentos

---

## 🎯 Teste 1: Visualização Inicial da Página

### Verificações Visuais:
- [ ] Página carregou sem erros?
- [ ] Header com título "Gestão de Departamentos" visível?
- [ ] BackToNucleus (voltar para Atendimento) aparece no topo?
- [ ] Dashboard com 4 cards de métricas visível?
  - [ ] Card 1: Total de Departamentos
  - [ ] Card 2: Departamentos Ativos
  - [ ] Card 3: Departamentos Inativos
  - [ ] Card 4: Total de Atendentes
- [ ] Barra de busca visível?
- [ ] Filtros (Núcleo, Status) visíveis?
- [ ] Botão "Novo Departamento" (roxo) visível?

### Console (F12):
- [ ] Sem erros vermelhos?
- [ ] Warning do react-beautiful-dnd DESAPARECEU? ✅

**📝 Observações**:
```
[Anote aqui qualquer comportamento estranho ou erro]
```

---

## 🎯 Teste 2: Criar Novo Departamento (TC001)

### Passos:
1. ✅ Clicar no botão **"Novo Departamento"**
2. ✅ Preencher formulário:
   - Nome: `Teste Copilot ${new Date().getHours()}${new Date().getMinutes()}`
   - Descrição: `Departamento criado para teste automatizado`
   - Núcleo: Deixar em branco (testar sem núcleo)
   - Status: ✓ Ativo
3. ✅ Clicar "Salvar"

### Resultados Esperados:
- [ ] Modal fecha automaticamente?
- [ ] Toast verde de sucesso aparece?
- [ ] Novo card aparece no grid?
- [ ] Badge "Sem Núcleo" visível no card?
- [ ] Badge verde "Ativo" visível?
- [ ] Contador de agentes mostra "0"?

### Network Tab (F12 → Network):
- [ ] Requisição POST /departamentos?
- [ ] Status: 201 Created?
- [ ] Response tem ID do departamento?

**✅ PASSOU** | **❌ FALHOU**

**📝 Observações**:
```
[Anote aqui]
```

---

## 🎯 Teste 3: Verificar Drag-and-Drop (TC008)

**Pré-requisito**: Ter pelo menos 2 departamentos visíveis

### Passos:
1. ✅ Localizar ícone **⋮⋮** no canto superior esquerdo de um card
2. ✅ Clicar e **segurar** o mouse no ícone ⋮⋮
3. ✅ Arrastar o card para outra posição
4. ✅ Soltar o mouse

### Resultados Esperados:
- [ ] Durante arrasto: Card "levanta" com sombra roxa?
- [ ] Durante arrasto: Anel roxo (ring) ao redor do card?
- [ ] Ao soltar: Posição muda instantaneamente?
- [ ] Toast verde "Departamentos reordenados com sucesso"?
- [ ] Network: Requisição PUT /departamentos/reordenar?

### Teste de Persistência:
5. ✅ Pressionar **F5** (refresh da página)
6. ✅ Verificar se ordem foi **mantida**

- [ ] Ordem permaneceu igual após F5?

**✅ PASSOU** | **❌ FALHOU**

**📝 Observações**:
```
[Anote aqui]
```

---

## 🎯 Teste 4: Editar Departamento (TC004)

### Passos:
1. ✅ Clicar no ícone **✏️ (editar)** de um departamento
2. ✅ Alterar o nome para: `Departamento EDITADO ${new Date().getSeconds()}`
3. ✅ Alterar descrição
4. ✅ Clicar "Salvar"

### Resultados Esperados:
- [ ] Modal fecha?
- [ ] Toast de sucesso?
- [ ] Nome do card atualizado instantaneamente?
- [ ] Network: PUT /departamentos/:id com status 200?

**✅ PASSOU** | **❌ FALHOU**

---

## 🎯 Teste 5: Alterar Status (TC005)

### Passos:
1. ✅ Encontrar departamento com badge **verde "Ativo"**
2. ✅ Clicar no **toggle/switch** de status

### Resultados Esperados:
- [ ] Badge muda de verde "Ativo" → vermelho "Inativo"?
- [ ] Card fica com opacidade reduzida (60%)?
- [ ] Toast de sucesso?
- [ ] Network: PATCH /departamentos/:id/status?

### Reverter:
3. ✅ Clicar no toggle novamente

- [ ] Badge volta para verde "Ativo"?
- [ ] Opacidade volta ao normal?

**✅ PASSOU** | **❌ FALHOU**

---

## 🎯 Teste 6: Filtros (TC022-TC026)

### Teste 6.1: Filtro por Núcleo
1. ✅ Dropdown "Filtrar por Núcleo" → Selecionar um núcleo

- [ ] Apenas departamentos daquele núcleo aparecem?

2. ✅ Selecionar "Todos"

- [ ] Todos os departamentos voltam a aparecer?

### Teste 6.2: Filtro por Status
1. ✅ Dropdown "Status" → Selecionar "Inativos"

- [ ] Apenas departamentos com badge vermelho aparecem?

2. ✅ Selecionar "Ativos"

- [ ] Apenas departamentos com badge verde aparecem?

3. ✅ Selecionar "Todos"

- [ ] Todos aparecem novamente?

### Teste 6.3: Busca por Nome
1. ✅ Digitar no campo de busca: "teste"

- [ ] Filtragem em tempo real funciona?
- [ ] Apenas departamentos com "teste" no nome aparecem?
- [ ] Case-insensitive (ignora maiúsculas/minúsculas)?

2. ✅ Limpar campo de busca

- [ ] Todos os departamentos voltam?

**✅ PASSOU** | **❌ FALHOU**

---

## 🎯 Teste 7: Responsividade (TC027-TC029)

### Passos:
1. ✅ Abrir DevTools (F12)
2. ✅ Clicar no ícone "Toggle Device Toolbar" (Ctrl+Shift+M)

### Teste 7.1: Mobile (375px)
1. ✅ Selecionar "iPhone SE" ou definir 375px

**Verificar**:
- [ ] Grid tem **1 coluna** apenas?
- [ ] Cards são legíveis (texto não cortado)?
- [ ] Botões acessíveis (não sobrepostos)?
- [ ] Modal responsivo?

### Teste 7.2: Tablet (768px)
1. ✅ Definir largura: 768px

**Verificar**:
- [ ] Grid tem **2 colunas**?
- [ ] Layout bem distribuído?

### Teste 7.3: Desktop (1920px)
1. ✅ Maximizar janela ou definir 1920px

**Verificar**:
- [ ] Grid tem **3 colunas**?
- [ ] Uso eficiente do espaço?

**✅ PASSOU** | **❌ FALHOU**

---

## 🎯 Teste 8: Navegação para Núcleos (TC013)

### Passos:
1. ✅ Clicar em **"Voltar para Atendimento"** (BackToNucleus)
2. ✅ Ou navegar manualmente para: http://localhost:3000/gestao/nucleos

**Verificar**:
- [ ] Página de Núcleos carrega?
- [ ] Lista de núcleos visível?
- [ ] Possível expandir núcleo (ícone ▼)?

### Teste 8.1: Vincular Departamento a Núcleo
1. ✅ Expandir um núcleo (clicar ▼)
2. ✅ Clicar **"Vincular Departamentos"**
3. ✅ Marcar checkbox de 1 ou 2 departamentos
4. ✅ Clicar "Salvar"

**Verificar**:
- [ ] Modal fecha?
- [ ] Departamentos aparecem listados no núcleo?
- [ ] Cada card mostra nome, descrição, badge do núcleo?
- [ ] Toast de sucesso?

### Teste 8.2: Desvincular Departamento
1. ✅ Abrir "Vincular Departamentos" novamente
2. ✅ **Desmarcar** um departamento
3. ✅ Salvar

**Verificar**:
- [ ] Departamento removido da lista?
- [ ] Toast de sucesso?

**✅ PASSOU** | **❌ FALHOU**

---

## 📊 Resumo Final

### Testes Executados:
- Teste 1 (Visualização): ⏳
- Teste 2 (Criar): ⏳
- Teste 3 (Drag-and-Drop): ⏳
- Teste 4 (Editar): ⏳
- Teste 5 (Status): ⏳
- Teste 6 (Filtros): ⏳
- Teste 7 (Responsividade): ⏳
- Teste 8 (Navegação/Vínculo): ⏳

### Resultado Geral:
- ✅ Passaram: 0
- ❌ Falharam: 0
- ⏭️ Pulados: 0
- ⏳ Pendentes: 8

### Taxa de Sucesso: 0% (aguardando execução)

---

## 🐛 Bugs Encontrados

### Bug #1:
**Descrição**: [Descreva o bug]

**Passos para reproduzir**:
1. [Passo 1]
2. [Passo 2]

**Esperado**: [O que deveria acontecer]

**Obtido**: [O que aconteceu]

**Console**: [Mensagem de erro]

**Network**: [Status HTTP]

**Screenshot**: [Se possível]

---

## 📝 Observações Gerais

```
[Adicione observações gerais sobre os testes aqui]
```

---

## ✅ Conclusão

**Data de Conclusão**: ___/___/___  
**Tempo Total**: ___ minutos  

**Sistema está pronto para produção?**  
[ ] ✅ Sim - Todos os testes passaram  
[ ] ⚠️ Com ressalvas - Alguns bugs encontrados  
[ ] ❌ Não - Bugs críticos impedem uso  

---

**Testado por**: [Seu Nome]  
**Última atualização**: 28/10/2025
