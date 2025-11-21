# 🧪 Teste Rápido - Auto-Distribuição (5 minutos)

**Data**: 07/11/2025  
**Status**: Frontend rodando (porta 3000) | Backend rodando (porta 3001)

---

## ✅ Checklist de Teste Rápido

### 1️⃣ Acessar a Página (1 minuto)

```
✅ 1. Abrir navegador: http://localhost:3000
✅ 2. Fazer login (usuário com módulo ATENDIMENTO)
✅ 3. Sidebar → Expandir "Atendimento"
✅ 4. Clicar em "Auto-Distribuição" (ícone 🔀)
```

**Esperado**:
- ✅ Página carrega sem erros
- ✅ Aparece seletor de fila
- ✅ Aparece toggle "Auto-Distribuição Ativa"
- ✅ Aparece 3 cards de estratégia

**Console (F12) Deve Mostrar**:
```javascript
// Requisições esperadas:
GET /atendimento/filas - 200 OK
GET /atendimento/distribuicao/configuracao/:filaId - 200 OK (ou 404 se não configurado)
```

---

### 2️⃣ Testar Interações (2 minutos)

#### A. Selecionar Fila
```
1. Clicar no dropdown "Selecionar Fila"
2. Escolher uma fila (ex: "Fila Suporte")
```

**Esperado**:
- ✅ Dropdown abre com lista de filas
- ✅ Ao selecionar, carrega configuração da fila
- ✅ Mostra atendentes da fila na tabela

#### B. Alternar Auto-Distribuição
```
1. Clicar no toggle "Auto-Distribuição Ativa"
2. Ativar/Desativar
```

**Esperado**:
- ✅ Toggle muda de cor (cinza → roxo)
- ✅ Estado salvo ao clicar "Salvar"

#### C. Selecionar Estratégia
```
1. Clicar em um dos 3 cards:
   - 🔄 Round-Robin
   - 📊 Menor Carga
   - ⭐ Prioridade
```

**Esperado**:
- ✅ Card selecionado fica roxo (bg-purple-100)
- ✅ Borda roxa aparece (border-purple-500)
- ✅ Outros cards ficam cinza

#### D. Editar Capacidade
```
1. Na tabela de atendentes, alterar valor de "Capacidade"
2. Ex: mudar de 5 para 10
```

**Esperado**:
- ✅ Input aceita números
- ✅ Valores entre 1-50

#### E. Editar Prioridade
```
1. Na tabela de atendentes, alterar valor de "Prioridade"
2. Ex: mudar de 5 para 8
```

**Esperado**:
- ✅ Input aceita números
- ✅ Valores entre 1-10

#### F. Salvar Configuração
```
1. Após fazer alterações, clicar em "Salvar Configuração"
```

**Esperado**:
- ✅ Botão mostra "Salvando..." (loading)
- ✅ Requisição POST enviada
- ✅ Toast de sucesso: "Configuração salva com sucesso!"
- ✅ Botão volta para "Salvar Configuração"

---

### 3️⃣ Verificar Console (1 minuto)

#### Abrir DevTools (F12) → Console

**Verificar se NÃO tem**:
- ❌ Erros vermelhos (TypeError, ReferenceError, etc.)
- ❌ Warnings de React (useEffect, keys, etc.)

**Verificar se TEM**:
- ✅ Logs de sucesso (se habilitados):
  ```
  [ConfiguracaoDistribuicao] Configuração carregada: {...}
  [ConfiguracaoDistribuicao] Salvando configuração: {...}
  ```

#### Abrir DevTools → Network

**Verificar requisições**:
```
✅ GET /atendimento/filas
   Status: 200 OK
   Response: [{ id, nome, departamentoId, ... }]

✅ GET /atendimento/distribuicao/configuracao/:filaId
   Status: 200 OK (ou 404 se primeira vez)
   Response: { filaId, estrategia, autoDistribuir, ... }

✅ POST /atendimento/distribuicao/configuracao
   Status: 201 Created
   Request: { filaId, estrategia, autoDistribuir, capacidades, ... }
```

---

### 4️⃣ Testar Responsividade (1 minuto)

#### Desktop (1920x1080)
```
✅ Grid de estratégias: 3 colunas
✅ Tabela de atendentes: largura completa
✅ Botões: alinhados à direita
```

#### Tablet (768px)
```
DevTools → Toggle Device Toolbar → iPad
✅ Grid de estratégias: 2 colunas
✅ Tabela: scroll horizontal se necessário
```

#### Mobile (375px)
```
DevTools → Toggle Device Toolbar → iPhone SE
✅ Grid de estratégias: 1 coluna
✅ Tabela: scroll horizontal
✅ Botões: full-width (empilhados)
```

---

## 🐛 Problemas Conhecidos e Soluções

### Problema 1: "Não é possível localizar o módulo"
```
Erro TypeScript: Cannot find module './features/atendimento/pages/ConfiguracaoDistribuicaoPage'
```

**Solução**:
```powershell
# Reiniciar TypeScript Language Server
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### Problema 2: Página não aparece no menu
```
Menu lateral não mostra "Auto-Distribuição"
```

**Verificar**:
```typescript
// 1. menuConfig.ts tem o item?
grep -n "atendimento-distribuicao" frontend-web/src/config/menuConfig.ts

// 2. Usuário tem módulo ATENDIMENTO?
// Verificar no banco: SELECT * FROM usuarios WHERE id = ?

// 3. Limpar cache do React
Remove-Item -Recurse -Force frontend-web/node_modules/.cache
npm start
```

---

### Problema 3: Erro 401 ao carregar configuração
```
GET /atendimento/distribuicao/configuracao/:filaId - 401 Unauthorized
```

**Causa**: Token JWT expirado

**Solução**:
```
1. Fazer logout
2. Fazer login novamente
3. Token será renovado
```

---

### Problema 4: Erro 404 ao salvar
```
POST /atendimento/distribuicao/configuracao - 404 Not Found
```

**Verificar**:
```powershell
# 1. Backend está rodando?
Get-Process -Name node | Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id).LocalPort -eq 3001 }

# 2. Rota registrada no controller?
grep -n "distribuicao/configuracao" backend/src/modules/atendimento/controllers/distribuicao.controller.ts

# 3. Module registrado?
grep -n "DistribuicaoController" backend/src/modules/atendimento/atendimento.module.ts
```

---

## ✅ Checklist Final

Após testar tudo, verificar:

- [ ] Página carrega sem erros (Console limpo)
- [ ] Dropdown de filas funciona
- [ ] Toggle de auto-distribuição funciona
- [ ] Seleção de estratégia funciona
- [ ] Edição de capacidade funciona
- [ ] Edição de prioridade funciona
- [ ] Botão "Salvar" funciona
- [ ] Toast de sucesso aparece
- [ ] Requisições retornam 200/201
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Nenhum erro no console

---

## 🎯 Critérios de Aceitação

### ✅ Teste PASSOU se:
- ✅ Todas as interações funcionam
- ✅ Sem erros no console
- ✅ Requisições retornam sucesso (200/201)
- ✅ Toast de confirmação aparece
- ✅ Configuração é salva no backend

### ❌ Teste FALHOU se:
- ❌ Erro de compilação (TypeScript)
- ❌ Erro no console (JavaScript)
- ❌ Requisição falha (401, 404, 500)
- ❌ Toast de erro aparece
- ❌ Interface não responde

---

## 📊 Resultado Esperado

```
╔════════════════════════════════════════╗
║  TESTE DE AUTO-DISTRIBUIÇÃO            ║
╠════════════════════════════════════════╣
║  ✅ Carregamento da página             ║
║  ✅ Seleção de fila                    ║
║  ✅ Toggle auto-distribuição           ║
║  ✅ Seleção de estratégia              ║
║  ✅ Edição de capacidade               ║
║  ✅ Edição de prioridade               ║
║  ✅ Salvamento de configuração         ║
║  ✅ Responsividade                     ║
╠════════════════════════════════════════╣
║  RESULTADO: ✅ TODOS OS TESTES PASSARAM ║
╚════════════════════════════════════════╝
```

---

## 🚀 Próximo Passo Após Teste

Se todos os testes passaram:
✅ **Criar DashboardDistribuicaoPage.tsx** (KPIs + métricas)

Se algum teste falhou:
❌ **Corrigir bugs** antes de prosseguir

---

**Tempo total**: ~5 minutos  
**Testado por**: [Seu nome]  
**Data/Hora**: _______________  
**Status**: [ ] Passou  [ ] Falhou
