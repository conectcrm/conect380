# 🎨 GUIA DE VALIDAÇÃO FRONTEND - GESTÃO DE FILAS
## Passo a passo para testar a interface do usuário

**Data**: 10 de novembro de 2025  
**URLs para testar**:
- Página Depreciada: http://localhost:3000/configuracoes/gestao-equipes
- Nova Página: http://localhost:3000/configuracoes/gestao-filas

---

## 📋 CHECKLIST DE VALIDAÇÃO

### ✅ ETAPA 1: Verificar Backend e Frontend Rodando

Antes de começar, confirme que ambos os servidores estão ativos:

```powershell
# Verificar backend (porta 3001)
netstat -ano | findstr ":3001"
# Esperado: TCP 0.0.0.0:3001 LISTENING

# Verificar frontend (porta 3000)
netstat -ano | findstr ":3000"
# Esperado: TCP 0.0.0.0:3000 LISTENING
```

**Status Atual**:
- [x] Backend rodando na porta 3001 ✅
- [x] Frontend rodando na porta 3000 ✅

---

### 🔴 ETAPA 2: Validar Página Depreciada (GestaoEquipesPage)

#### 2.1. Abrir no navegador:
```
http://localhost:3000/configuracoes/gestao-equipes
```

#### 2.2. Verificações visuais:

**Banner de Depreciação**:
- [ ] Banner amarelo aparece no topo da página
- [ ] Ícone de alerta (⚠️) visível
- [ ] Texto correto:
  ```
  Página Obsoleta - Equipes Consolidadas em Filas
  
  Esta página está depreciada. As equipes foram consolidadas no conceito de 
  Filas de Atendimento para melhorar a gestão e distribuição de tickets. 
  Por favor, utilize a nova página para gerenciar suas filas.
  ```
- [ ] Botão "Ir para Gestão de Filas" presente
- [ ] Botão tem cor amarela (bg-yellow-600)
- [ ] Botão tem ícone de seta (→)

**Screenshot esperado**:
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Página Obsoleta - Equipes Consolidadas...   │
│                                                  │
│ Esta página está depreciada...                  │
│                                                  │
│ [→ Ir para Gestão de Filas]                    │
└─────────────────────────────────────────────────┘
```

#### 2.3. Testar interação:
- [ ] Clicar no botão "Ir para Gestão de Filas"
- [ ] Navegador redireciona para `/configuracoes/gestao-filas`
- [ ] URL muda corretamente na barra de endereço

#### 2.4. Verificar lista de equipes:
- [ ] Lista de equipes antigas aparece abaixo do banner
- [ ] Lista está desabilitada visualmente (opacity reduzida)
- [ ] Não é possível clicar/interagir com equipes antigas

---

### 🟢 ETAPA 3: Validar Nova Página (GestaoFilasPage)

#### 3.1. Abrir no navegador:
```
http://localhost:3000/configuracoes/gestao-filas
```

#### 3.2. Verificar listagem de filas:

**Cabeçalho da página**:
- [ ] Título "Gestão de Filas" visível
- [ ] Ícone de fila/usuários ao lado do título
- [ ] Botão "Nova Fila" no canto superior direito
- [ ] Cor do botão: #159A9C (tema Crevasse)

**Cards de filas**:
- [ ] 7 filas aparecem na listagem
- [ ] Cada card mostra:
  - [ ] Barra lateral colorida (cor personalizada)
  - [ ] Ícone personalizado
  - [ ] Nome da fila
  - [ ] Descrição (se houver)
  - [ ] Núcleo atribuído (se houver)
  - [ ] Departamento atribuído (se houver)
  - [ ] Estratégia de distribuição
  - [ ] Capacidade máxima
  - [ ] Status (Ativo/Inativo)
  - [ ] Botões de ação (Editar, Deletar)

**Exemplo visual esperado**:
```
┌──────────────────────────────────────────────┐
│ ║ 🏢 Confinamento                            │
│ ║                                            │
│ ║ Núcleo: CSI                               │
│ ║ Estratégia: ROUND_ROBIN                   │
│ ║ Capacidade: 10                             │
│ ║                                            │
│ ║ [✏️ Editar] [🗑️ Deletar]                 │
└──────────────────────────────────────────────┘
```

#### 3.3. Testar criação de nova fila:

**Abrir modal**:
- [ ] Clicar em "Nova Fila"
- [ ] Modal de criação abre centralmente
- [ ] Título do modal: "Nova Fila"
- [ ] Botão X para fechar visível no canto

**Campos do formulário** (⭐ = novo campo):
- [ ] Nome (input text, obrigatório)
- [ ] Descrição (textarea, opcional)
- [ ] Cor (color picker) ⭐
- [ ] Ícone (dropdown com opções: Users, Headphones, etc.) ⭐
- [ ] **Núcleo de Atendimento (dropdown)** ⭐⭐ CAMPO NOVO!
- [ ] **Departamento (dropdown)** ⭐⭐ CAMPO NOVO!
- [ ] Estratégia de distribuição (dropdown: ROUND_ROBIN, MENOR_CARGA, PRIORIDADE)
- [ ] Capacidade máxima (input number)
- [ ] Distribuição automática (checkbox)
- [ ] Ativo (checkbox)

**Dropdown de Núcleo**:
- [ ] Abre ao clicar
- [ ] Mostra 4 opções de núcleos
- [ ] Primeira opção: "Selecione um núcleo (opcional)"
- [ ] Exemplo de núcleo: "CSI"
- [ ] Possível selecionar um núcleo

**Dropdown de Departamento**:
- [ ] Abre ao clicar
- [ ] Mostra opções de departamentos
- [ ] Primeira opção: "Selecione um departamento (opcional)"
- [ ] Possível selecionar um departamento

**Criar fila**:
- [ ] Preencher nome: "Teste Validação"
- [ ] Selecionar cor: #FF5733
- [ ] Selecionar ícone: Headphones
- [ ] Selecionar núcleo: CSI
- [ ] Selecionar departamento: (qualquer)
- [ ] Clicar em "Salvar"
- [ ] Modal fecha
- [ ] Nova fila aparece na listagem
- [ ] Fila criada tem núcleo e departamento atribuídos

#### 3.4. Testar edição de fila existente:

**Abrir edição**:
- [ ] Clicar em "Editar" em uma fila existente
- [ ] Modal de edição abre
- [ ] Título do modal: "Editar Fila"
- [ ] Campos pré-preenchidos com dados atuais
- [ ] Dropdown de núcleo mostra núcleo atual selecionado (se houver)
- [ ] Dropdown de departamento mostra departamento atual (se houver)

**Atribuir núcleo a fila sem núcleo**:
- [ ] Escolher fila que não tem núcleo (nucleoId = null)
- [ ] Abrir edição
- [ ] Selecionar um núcleo no dropdown
- [ ] Salvar
- [ ] Modal fecha
- [ ] Fila agora exibe "Núcleo: [Nome do núcleo]"

**Mudar núcleo de fila**:
- [ ] Escolher fila com núcleo atribuído
- [ ] Abrir edição
- [ ] Mudar para outro núcleo
- [ ] Salvar
- [ ] Fila atualiza núcleo corretamente

---

### 🔍 ETAPA 4: Validar Console do Navegador (DevTools)

#### 4.1. Abrir DevTools:
```
Pressionar F12 ou Ctrl+Shift+I
```

#### 4.2. Aba Console:

**Verificar erros**:
- [ ] Nenhum erro em vermelho
- [ ] Nenhum warning crítico (amarelo)
- [ ] Mensagens de log normais são ok

**Erros comuns a evitar**:
```javascript
❌ TypeError: Cannot read property 'nucleoId' of undefined
❌ 404 Not Found: /api/filas
❌ 500 Internal Server Error
❌ Uncaught ReferenceError: nucleos is not defined
```

#### 4.3. Aba Network:

**Verificar requisições**:
- [ ] GET /api/filas → Status 200 OK
- [ ] GET /nucleos → Status 200 OK
- [ ] GET /departamentos → Status 200 OK (se aplicável)
- [ ] POST /api/filas (ao criar) → Status 201 Created
- [ ] PUT /api/filas/:id (ao editar) → Status 200 OK
- [ ] PATCH /api/filas/:id/nucleo → Status 200 OK

**Tempo de resposta**:
- [ ] Requisições GET retornam em <500ms
- [ ] Requisições POST/PUT retornam em <1s

**Payload de resposta** (exemplo):
```json
{
  "id": "...",
  "nome": "Confinamento",
  "cor": "#27ed0c",
  "icone": "users",
  "nucleoId": "525cd442-6229-4372-9847-30b04b6443e8",
  "departamentoId": null,
  "estrategia_distribuicao": "ROUND_ROBIN",
  ...
}
```

---

### ✅ ETAPA 5: Testes de Responsividade

#### 5.1. Mobile (375px):
- [ ] Pressionar F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Selecionar "iPhone SE" ou "375px"
- [ ] Banner de depreciação visível e legível
- [ ] Cards de filas empilham verticalmente
- [ ] Botões de ação acessíveis
- [ ] Modal de criação/edição responsivo

#### 5.2. Tablet (768px):
- [ ] Selecionar "iPad" ou "768px"
- [ ] Layout se adapta corretamente
- [ ] Grid de filas: 2 colunas

#### 5.3. Desktop (1920px):
- [ ] Selecionar "Desktop 1920x1080"
- [ ] Grid de filas: 3 colunas
- [ ] Espaçamento adequado
- [ ] Modal centralizado

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

### ✅ Aprovação Total (Produção-Ready)

**Requisitos obrigatórios**:
- [x] Backend API funcionando (4/4 endpoints testados) ✅
- [ ] Banner de depreciação visível
- [ ] Campos nucleoId/departamentoId no formulário
- [ ] Criar fila com núcleo funciona
- [ ] Editar fila e atribuir núcleo funciona
- [ ] Console sem erros críticos
- [ ] Responsividade funcional

**Se TODOS os itens acima estiverem marcados** → ✅ **APROVADO PARA PRODUÇÃO**

---

### ⚠️ Aprovação Parcial (Correções Necessárias)

**Se encontrar problemas**:
1. Documentar erro específico
2. Capturar screenshot
3. Copiar mensagem de erro do console
4. Reportar no issue tracker

**Exemplos de problemas**:
- ❌ Campos novos não aparecem no formulário
- ❌ Dropdown de núcleos vazio (não carrega opções)
- ❌ Erro 404 ao salvar fila com núcleo
- ❌ Modal não abre ao clicar em "Nova Fila"

---

## 📸 Evidências de Teste

**Capture screenshots de**:
1. Banner de depreciação (GestaoEquipesPage)
2. Modal de criação com campos novos (nucleoId/departamentoId)
3. Fila criada com núcleo atribuído (card na listagem)
4. Console do navegador sem erros (F12)
5. Network tab mostrando status 200 OK

---

## 🚀 Após Validação

**Se tudo estiver OK**:
1. Marcar todos os checkboxes como ✅
2. Atualizar `AUDITORIA_PROGRESSO_REAL.md` com "Frontend validado"
3. Atualizar `CHECKLIST_VALIDACAO_FILAS.md` com resultados
4. Criar tag de release: `v1.0.0-consolidacao-equipe-fila`
5. Fazer merge na branch `main`

**Se houver problemas**:
1. Documentar issues encontrados
2. Criar tasks de correção
3. Corrigir problemas
4. Re-testar

---

**Tempo estimado**: 15-20 minutos  
**Testador**: [Seu Nome]  
**Data/Hora**: [Preencher ao testar]
