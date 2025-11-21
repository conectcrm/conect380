# 🧪 TESTE RÁPIDO: Distribuição Automática Avançada

## ✅ Checklist de Validação (5 minutos)

### 1️⃣ Compilação TypeScript

```powershell
cd C:\Projetos\conectcrm\backend
npm run build
```

**Espera**: ✅ Compiled successfully (ignorar warnings de arquivos antigos)

---

### 2️⃣ Iniciar Backend Dev

```powershell
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

**Aguarde**: 30-60 segundos

**Espera no console**:
```
✅ [NestApplication] Nest application successfully started
✅ [RouterExplorer] Mapped {/distribuicao-avancada/configuracoes, POST}
✅ [RouterExplorer] Mapped {/distribuicao-avancada/skills, POST}
✅ [RouterExplorer] Mapped {/distribuicao-avancada/distribuir/:ticketId, POST}
```

---

### 3️⃣ Verificar Swagger (Opcional)

Abrir navegador: `http://localhost:3001/api`

**Buscar**: `DistribuicaoAvancadaController`

**Espera**: 
- ✅ Seção com 14 endpoints visíveis
- ✅ POST /distribuicao-avancada/configuracoes
- ✅ POST /distribuicao-avancada/skills
- ✅ GET /distribuicao-avancada/metricas

---

### 4️⃣ Testar Endpoint no Postman/Thunder Client

#### Endpoint: Listar Configurações (sem autenticação para teste rápido)

```http
GET http://localhost:3001/distribuicao-avancada/configuracoes
```

**Espera**:
- Status: 200 OK (ou 401 se autenticação obrigatória)
- Body: `{ "success": true, "data": [], "total": 0 }`

**Se 401 Unauthorized**:
- ✅ Normal! Significa que JwtAuthGuard está ativo
- Endpoint funciona, só precisa de token JWT válido

#### Endpoint: Métricas

```http
GET http://localhost:3001/distribuicao-avancada/metricas
```

**Espera**:
- Status: 200 OK (ou 401)
- Body: `{ "success": true, "data": { "totalDistribuicoes": 0, ... } }`

---

### 5️⃣ Verificar Banco de Dados

```sql
-- Conectar ao PostgreSQL (porta 5434)
psql -h localhost -p 5434 -U postgres -d conectcrm

-- Verificar tabelas
\dt distribuicao*
\dt atendente_skills

-- Espera:
-- distribuicao_config
-- distribuicao_log
-- atendente_skills

-- Verificar estrutura
\d distribuicao_config
-- Espera: Colunas id, filaId, algoritmo, capacidadeMaxima, etc.

-- Verificar dados (vazio inicialmente)
SELECT COUNT(*) FROM distribuicao_config;  -- Espera: 0
SELECT COUNT(*) FROM atendente_skills;     -- Espera: 0
SELECT COUNT(*) FROM distribuicao_log;     -- Espera: 0
```

---

## 🎯 Teste Completo (Criar Configuração Real)

### Pré-requisito: Ter um JWT válido

```powershell
# 1. Login para obter token (ajuste credenciais)
POST http://localhost:3001/auth/login
Body: { "email": "admin@conectcrm.com", "password": "senha123" }

# Copiar o token do response: { "access_token": "eyJhbG..." }
```

### Teste 1: Criar Configuração

```http
POST http://localhost:3001/distribuicao-avancada/configuracoes
Authorization: Bearer eyJhbG...  (seu token)
Content-Type: application/json

{
  "filaId": "uuid-de-uma-fila-existente",
  "algoritmo": "hibrido",
  "capacidadeMaxima": 10,
  "priorizarOnline": true,
  "considerarSkills": true,
  "tempoTimeoutMin": 5,
  "permitirOverflow": false,
  "ativo": true
}
```

**Espera**:
- Status: 201 Created
- Body: `{ "success": true, "message": "Configuração criada com sucesso", "data": {...} }`

**Verificar no banco**:
```sql
SELECT * FROM distribuicao_config;
-- Espera: 1 registro com algoritmo='hibrido'
```

---

### Teste 2: Adicionar Skill a Atendente

```http
POST http://localhost:3001/distribuicao-avancada/skills
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "atendenteId": "uuid-de-atendente-existente",
  "skill": "vendas",
  "nivel": 5,
  "ativo": true
}
```

**Espera**:
- Status: 201 Created
- Body: `{ "success": true, "message": "Skill criada com sucesso", "data": {...} }`

**Verificar no banco**:
```sql
SELECT * FROM atendente_skills;
-- Espera: 1 registro com skill='vendas', nivel=5
```

---

### Teste 3: Distribuir Ticket (Mock)

**NOTA**: Este teste só funciona se você tiver:
- ✅ Um ticket criado no sistema
- ✅ Uma fila com configuração de distribuição
- ✅ Atendentes vinculados à fila

```http
POST http://localhost:3001/distribuicao-avancada/distribuir/uuid-ticket-existente
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "requiredSkills": ["vendas"]
}
```

**Espera (caso sucesso)**:
- Status: 200 OK
- Body: `{ "success": true, "data": { "ticketId": "...", "atendenteId": "...", "atendenteNome": "João Silva" } }`

**Espera (caso erro - normal em ambiente vazio)**:
- Status: 404 Not Found
- Body: `{ "message": "Ticket ... não encontrado" }`
- ✅ Isso é ESPERADO se não houver tickets ainda!

**Verificar log de auditoria (se distribuiu)**:
```sql
SELECT * FROM distribuicao_log ORDER BY timestamp DESC LIMIT 5;
-- Espera: 1 registro com algoritmo usado, motivo, cargaAtendente
```

---

## 📊 Resultado Esperado

### ✅ SUCESSO se você ver:

1. **Backend compilou sem erros** ✅
2. **Servidor iniciou na porta 3001** ✅
3. **Endpoints aparecem no Swagger** ✅
4. **GET /configuracoes retorna 200 (ou 401 com auth)** ✅
5. **Tabelas existem no banco de dados** ✅
6. **POST /configuracoes cria registro** ✅
7. **POST /skills cria registro** ✅

### ❌ PROBLEMAS comuns:

**Erro 404 ao acessar endpoint**:
- Verificar se backend realmente iniciou
- Checar URL: `http://localhost:3001` (não `3000`)
- Ver se módulo está registrado em app.module.ts

**Erro 401 Unauthorized**:
- ✅ Normal! JWT obrigatório
- Fazer login primeiro em `/auth/login`
- Usar token no header `Authorization: Bearer ...`

**Erro 500 Internal Server Error**:
- Ver logs do backend no terminal
- Verificar se `filaId` fornecido existe na tabela `filas`
- Verificar se `atendenteId` existe na tabela `users`

**Erro "Ticket não encontrado"**:
- ✅ Normal em ambiente vazio!
- Criar ticket primeiro ou usar UUID de ticket existente

---

## 🎉 Conclusão

Se **5 de 7 itens** passaram: **Backend está FUNCIONAL** ✅

Se **7 de 7 itens** passaram: **Backend está 100% OPERACIONAL** 🚀

---

**Próximo passo**: Implementar frontend (3 páginas React) para gerenciar configurações e visualizar métricas.

**Tempo estimado frontend**: 6-8 horas

**Deseja prosseguir com frontend?** Responda "sim" para continuar!
