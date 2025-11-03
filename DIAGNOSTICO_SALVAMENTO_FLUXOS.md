# 🐛 Diagnóstico: Fluxos Não Estão Salvando

## ❌ Problema Identificado

Os fluxos não estão sendo salvos. Possíveis causas:

### 1️⃣ **ERRO 401 - NÃO AUTENTICADO** (Mais Provável)

**Sintoma**: API retorna `401 Unauthorized`

**Causa**: Token JWT expirado ou usuário não está logado

**Solução**:
```bash
# 1. Abrir navegador em: http://localhost:3000
# 2. Pressionar F12 (DevTools)
# 3. Aba Console
# 4. Verificar erro:
❌ POST http://localhost:3001/fluxos 401 (Unauthorized)

# 5. Fazer login novamente:
- Ir para: http://localhost:3000/login
- Fazer login com usuário válido
- Voltar para construtor de fluxos
- Tentar salvar novamente
```

### 2️⃣ **VALIDAÇÃO FALHANDO**

**Sintoma**: Botão "Salvar" desabilitado ou alert "Corrija os erros antes de salvar"

**Causa**: Fluxo tem erros de validação (blocos desconectados, sem etapa inicial, etc.)

**Solução**:
```
1. Verificar header da página:
   - Se aparecer: "❌ X erro(s)" em vermelho
   - Ler os erros listados abaixo do header

2. Erros comuns:
   ❌ "Bloco X não está conectado"
   → Conectar bloco ao fluxo

   ❌ "Fluxo não tem bloco de início"
   → Adicionar bloco "Início" (Start)

   ❌ "Menu sem opções"
   → Configurar pelo menos 1 opção no menu

   ❌ "Loops detectados"
   → Remover conexões circulares

3. Depois de corrigir, validação atualiza automaticamente
```

### 3️⃣ **BACKEND REJEITANDO ESTRUTURA**

**Sintoma**: Erro 400 ou 500 após clicar "Salvar"

**Causa**: Estrutura JSON inválida ou campos obrigatórios faltando

**Como Diagnosticar no Console do Navegador**:

```javascript
// Abrir DevTools (F12) → Console
// Colar este código:

console.log('🔍 DIAGNÓSTICO DE SALVAMENTO');

// 1. Verificar autenticação
console.log('1️⃣ Token JWT:', localStorage.getItem('token') ? '✅ Presente' : '❌ Ausente');

// 2. Verificar estado do fluxo (precisa colar no console da página)
console.log('2️⃣ Nodes:', window.reactFlowInstance?.getNodes?.()?.length || 'N/A');
console.log('2️⃣ Edges:', window.reactFlowInstance?.getEdges?.()?.length || 'N/A');

// 3. Testar API manualmente
fetch('http://localhost:3001/fluxos', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => console.log('3️⃣ API Status:', r.status, r.ok ? '✅' : '❌'))
.catch(e => console.error('3️⃣ API Erro:', e));
```

---

## ✅ SOLUÇÕES PASSO A PASSO

### Solução 1: Fazer Login Novamente

```
1. Abrir: http://localhost:3000/login
2. Fazer login com credenciais válidas
3. Voltar para: http://localhost:3000/gestao/fluxos
4. Tentar salvar fluxo novamente
```

### Solução 2: Verificar Validação do Fluxo

No construtor visual, verificar:

```
✅ Fluxo tem bloco "Início" (Start)
✅ Todos os blocos estão conectados
✅ Blocos de Menu têm pelo menos 1 opção
✅ Não há loops circulares
✅ Header mostra: "✅ Fluxo válido" (verde)
```

### Solução 3: Ver Logs Detalhados

**No Console do Navegador (F12)**:

Ao clicar em "Salvar", deve aparecer:

```javascript
🖱️ Botão SALVAR clicado!
📊 Estado atual: { totalNodes: 3, totalEdges: 2, validationErrors: 0 }
🔄 Salvando fluxo - estrutura convertida: { etapas: [...] }
📤 Enviando atualização para API: { id: 'uuid', dto: {...} }

// Se sucesso:
✅ Fluxo atualizado com sucesso!

// Se erro:
❌ Erro ao salvar fluxo: <erro detalhado>
❌ Resposta do servidor: { message: '...', statusCode: 401 }
```

### Solução 4: Logs do Backend

**No Terminal do Backend**:

```powershell
cd backend
npm run start:dev

# Verificar logs quando clicar "Salvar":
# Deve aparecer:
[Nest] - LOG [FluxoController] PUT /fluxos/:id
[Nest] - LOG Fluxo atualizado: { id: 'uuid', nome: '...' }

# Se erro:
[Nest] - ERROR [ExceptionsHandler] JWT expired
[Nest] - ERROR [ExceptionsHandler] Validation failed: ...
```

---

## 🧪 TESTE RÁPIDO

### Cenário 1: Criar Fluxo Simples

```
1. Criar novo fluxo
2. Adicionar bloco "Início"
3. Adicionar bloco "Mensagem"
4. Conectar Início → Mensagem
5. Clicar "Salvar"
6. Observar console:
   - Se aparecer "401": PROBLEMA DE LOGIN
   - Se aparecer "Corrija os erros": PROBLEMA DE VALIDAÇÃO
   - Se aparecer "Fluxo criado com sucesso": ✅ FUNCIONOU
```

### Cenário 2: Editar Fluxo Existente

```
1. Ir para: http://localhost:3000/gestao/fluxos
2. Clicar em "Editar" em um fluxo existente
3. Modificar algo (ex: mudar mensagem)
4. Clicar "Salvar"
5. Observar console (mesmos logs acima)
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

Execute nesta ordem:

- [ ] **Backend está rodando?**
  ```powershell
  netstat -ano | findstr :3001
  # Deve retornar: TCP 0.0.0.0:3001 ... LISTENING
  ```

- [ ] **Frontend está rodando?**
  ```powershell
  netstat -ano | findstr :3000
  # Deve retornar: TCP 0.0.0.0:3000 ... LISTENING
  ```

- [ ] **Você está logado?**
  ```
  - Abrir http://localhost:3000
  - F12 → Application → Local Storage
  - Verificar se existe chave "token"
  - Se não existir: FAZER LOGIN
  ```

- [ ] **Fluxo é válido?**
  ```
  - Header mostra "✅ Fluxo válido" (verde)?
  - Se não: corrigir erros listados
  ```

- [ ] **Console mostra erros?**
  ```
  - F12 → Console
  - Clicar "Salvar"
  - Ver logs:
    * 401? → Fazer login
    * 400? → Estrutura inválida
    * 500? → Erro no backend
  ```

---

## 🆘 SOLUÇÃO DEFINITIVA

**Se NADA funcionar, executar:**

```powershell
# 1. Parar tudo
Get-Process -Name node | Stop-Process -Force

# 2. Limpar cache
cd frontend-web
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 3. Reiniciar backend
cd ../backend
npm run start:dev
# Aguardar: "Nest application successfully started"

# 4. Reiniciar frontend (nova janela)
cd ../frontend-web
npm start
# Aguardar: "webpack compiled successfully"

# 5. Fazer login fresco
# Abrir: http://localhost:3000/login
# Login com usuário válido

# 6. Tentar salvar fluxo novamente
```

---

## 🔍 DEBUG AVANÇADO

**Se ainda não funcionar, adicionar logs temporários:**

```typescript
// Arquivo: frontend-web/src/pages/FluxoBuilderPage.tsx
// Linha 492 (função salvarFluxo)

const salvarFluxo = async () => {
  console.log('🖱️ Botão SALVAR clicado!');
  console.log('📊 Estado:', { nodes: nodes.length, edges: edges.length });
  console.log('🔑 Token:', localStorage.getItem('token')?.substring(0, 20) + '...');
  
  // ... resto do código
  
  try {
    console.log('📤 Enviando para API...');
    const response = isEditing 
      ? await fluxoService.atualizar(id, dto)
      : await fluxoService.criar(dto);
    console.log('✅ Resposta:', response);
  } catch (err: any) {
    console.error('❌ ERRO COMPLETO:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack
    });
    throw err;
  }
};
```

---

## 📞 RESULTADO ESPERADO

**Quando funcionar corretamente:**

1. **Console do Navegador**:
   ```
   🖱️ Botão SALVAR clicado!
   📊 Estado atual: { totalNodes: 3, totalEdges: 2, validationErrors: 0 }
   🔄 Salvando fluxo - estrutura convertida: { etapas: [...] }
   📤 Enviando atualização para API: { id: 'uuid-123', dto: {...} }
   ```

2. **Alert no Navegador**:
   ```
   ✅ Fluxo atualizado com sucesso!
   ```

3. **Console do Backend**:
   ```
   [Nest] LOG [FluxoController] PUT /fluxos/uuid-123
   [Nest] LOG [FluxoService] Fluxo atualizado: { id: 'uuid-123', nome: 'Meu Fluxo' }
   ```

4. **Banco de Dados**:
   ```sql
   SELECT nome, updated_at FROM fluxos_triagem WHERE id = 'uuid-123';
   -- updated_at deve ter timestamp recente
   ```

---

**Próximo passo**: Execute o diagnóstico acima e me informe qual erro você está vendo! 🔍
