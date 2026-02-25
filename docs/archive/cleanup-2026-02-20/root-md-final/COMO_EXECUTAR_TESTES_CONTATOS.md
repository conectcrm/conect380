# 🧪 Como Executar os Testes de Contatos

## 📋 Checklist Pré-Teste

Antes de executar os testes, verifique:

- [x] ✅ Backend compilando (terminal ativo)
- [ ] ⏳ Aguardar backend iniciar completamente
- [ ] 🔑 Obter token JWT válido
- [ ] ✏️ Atualizar token no script
- [ ] ▶️ Executar testes

---

## 🚀 Passo a Passo

### **1. Aguardar Backend Iniciar (1-2min)**

O backend está compilando agora. Aguarde até ver esta mensagem:

```
[Nest] 12345  - 2025-01-14 20:11:15     LOG [NestApplication] Nest application successfully started +10ms
[Nest] 12345  - 2025-01-14 20:11:15     LOG [Bootstrap] 🚀 Servidor rodando em http://localhost:3001
```

### **2. Executar Migration (Se Necessário)**

Se a tabela `contatos` ainda não existe, execute:

```powershell
cd C:\Projetos\conectcrm\backend
npm run migration:run
```

**Saída esperada:**
```
✅ CreateContatosTable1744690800000 migration has been executed successfully.
```

### **3. Obter Token JWT**

**Opção A: Via Frontend** (Recomendado)
1. Acesse http://localhost:3000
2. Faça login com suas credenciais
3. Abra DevTools (F12)
4. Console → Digite:
   ```javascript
   localStorage.getItem('token')
   ```
5. Copie o token retornado (sem aspas)

**Opção B: Via API direta** (Postman/Insomnia/cURL)
```bash
# PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body (@{ email="seu@email.com"; password="suasenha" } | ConvertTo-Json) -ContentType "application/json"
$response.access_token
```

**Opção C: Via Node.js**
```javascript
// test-get-token.js
const fetch = require('node-fetch');

async function getToken() {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'seu@email.com',
      password: 'suasenha'
    })
  });
  
  const data = await response.json();
  console.log('Token:', data.access_token);
}

getToken();
```

### **4. Atualizar Script de Testes**

Edite o arquivo `backend/test-contatos-api.js`:

**Linha 12:**
```javascript
// ANTES
const TOKEN = 'SEU_TOKEN_JWT_AQUI';

// DEPOIS (cole seu token real)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### **5. Executar Testes**

```powershell
cd C:\Projetos\conectcrm\backend
node test-contatos-api.js
```

---

## 📊 Resultado Esperado

```
🧪 INICIANDO TESTES DE APIs DE CONTATOS

================================================
🧪 TESTE 1: Criar Cliente para Testes
================================================
POST http://localhost:3001/api/crm/clientes → 201
✅ Cliente criado com ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

================================================
🧪 TESTE 2: Criar Contato Principal - João Silva
================================================
POST http://localhost:3001/api/crm/clientes/a1b2c3d4.../contatos → 201
✅ João criado: João Silva (Gerente Comercial)
   Telefone: (11) 98888-8888
   Principal: Sim ⭐

================================================
🧪 TESTE 3: Criar Contato - Maria Santos
================================================
POST http://localhost:3001/api/crm/clientes/a1b2c3d4.../contatos → 201
✅ Maria criada: b2c3d4e5-f6a7-8901-bcde-f12345678901

[... mais 8 testes ...]

================================================
🎉 RESUMO FINAL DOS TESTES
================================================

✅ Testes Executados (11):
   1. ✅ Criar Cliente
   2. ✅ Criar Contato Principal (João)
   3. ✅ Criar Contato (Maria)
   4. ✅ Criar Contato (Pedro)
   5. ✅ Listar Contatos
   6. ✅ Buscar Contato Específico
   7. ✅ Atualizar Contato
   8. ✅ Definir Outro Como Principal
   9. ✅ Validar Telefone Duplicado
   10. ✅ Verificar Ordenação
   11. ✅ Remover Contato (Soft Delete)

📊 Resultado:
   - Cliente: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   - Contatos criados: 3 (João, Maria, Pedro)
   - Contato principal: Maria Santos
   - Contatos ativos: 2 (João, Maria)
   - Contato removido: 1 (Pedro - soft delete)

✅ TODOS OS TESTES CONCLUÍDOS!
```

---

## ❌ Problemas Comuns

### **Erro: "Configure um token JWT válido!"**
- ✅ **Solução**: Siga o passo 3 para obter um token real

### **Erro: 401 Unauthorized**
- ❌ Token expirado ou inválido
- ✅ **Solução**: Gere um novo token (passo 3)

### **Erro: 404 Not Found**
- ❌ Backend não está rodando ou rota incorreta
- ✅ **Solução**: Verifique se backend está em http://localhost:3001

### **Erro: "relation contatos does not exist"**
- ❌ Migration não foi executada
- ✅ **Solução**: Execute `npm run migration:run`

### **Erro: Telefone duplicado (esperado no teste 9)**
- ✅ **Normal!** Este teste DEVE falhar propositalmente para validar a constraint

---

## 🗄️ Testes no Banco de Dados (Alternativa)

Se preferir testar diretamente no PostgreSQL:

```bash
# Conectar ao banco
psql -U postgres -d conectcrm

# Executar script SQL de testes
\i C:/Projetos/conectcrm/backend/test-contatos-database.sql
```

Este script:
- ✅ Verifica estrutura da tabela
- ✅ Lista índices criados
- ✅ Valida foreign keys
- ✅ Insere dados de teste
- ✅ Executa queries de validação

---

## 📈 Métricas de Sucesso

Para considerar os testes bem-sucedidos:

- [x] ✅ **11/11 testes passaram** (100%)
- [x] ✅ Ordenação correta (principal DESC, nome ASC)
- [x] ✅ Validação de telefone duplicado funciona (teste 9 falha propositalmente)
- [x] ✅ Apenas um contato principal por cliente
- [x] ✅ Soft delete funciona (ativo=false)
- [x] ✅ Campos calculados corretos (nomeCompleto, telefoneFormatado)
- [x] ✅ Relacionamento CASCADE funciona

---

## 🔄 Após Testes Passarem

Com os testes validados, podemos continuar para **FASE 2: Frontend**:

1. ✅ Backend 100% funcional
2. ⏳ Implementar componentes React
3. ⏳ Integrar com APIs
4. ⏳ Testes E2E

**Tempo estimado FASE 2:** 4 horas
**Status:** Aguardando aprovação dos testes

---

## 📝 Notas Técnicas

### **Arquivos de Teste Criados:**
1. `backend/test-contatos-api.js` - Testes automatizados via API REST
2. `backend/test-contatos-database.sql` - Testes diretos no banco
3. `COMO_EXECUTAR_TESTES_CONTATOS.md` (este arquivo) - Guia completo

### **Estrutura Testada:**
```typescript
Entity: Contato
├── id: uuid
├── nome: string
├── email: string?
├── telefone: string (unique per cliente)
├── cargo: string?
├── ativo: boolean (soft delete)
├── principal: boolean (only one per cliente)
├── clienteId: uuid (FK)
├── observacoes: text?
└── timestamps

APIs Testadas:
├── GET    /api/crm/clientes/:clienteId/contatos
├── GET    /api/crm/contatos/:id
├── POST   /api/crm/clientes/:clienteId/contatos
├── PATCH  /api/crm/contatos/:id
├── PATCH  /api/crm/contatos/:id/principal
└── DELETE /api/crm/contatos/:id
```

### **Validações Implementadas:**
1. ✅ Telefone único por cliente
2. ✅ Apenas um contato principal
3. ✅ Cliente deve existir
4. ✅ Soft delete preserva histórico

---

## ✅ Checklist Final

Antes de continuar para FASE 2, confirme:

- [ ] Backend rodando sem erros
- [ ] Migration executada com sucesso
- [ ] 11/11 testes passaram
- [ ] Validações funcionando corretamente
- [ ] Soft delete testado
- [ ] Ordenação validada
- [ ] Campos calculados corretos

**Se todos os itens estiverem marcados, podemos prosseguir para a FASE 2! 🎉**
