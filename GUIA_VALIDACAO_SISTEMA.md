# 🧪 Guia de Validação do Sistema - ConectCRM

**Objetivo**: Validar que o sistema multi-tenant está 100% funcional  
**Tempo estimado**: 15-20 minutos  
**Data**: 2 de novembro de 2025

---

## 📋 Pré-requisitos

- ✅ Sistema rodando em http://56.124.63.239:3000
- ✅ Navegador moderno (Chrome, Firefox, Edge)
- ✅ Ferramenta de API (opcional): Postman, Thunder Client, ou curl

---

## 🎯 Checklist de Validação

### ✅ Etapa 1: Validação de Infraestrutura (5 min)

#### 1.1. Verificar Containers Rodando

```powershell
# Conectar na AWS
ssh -i "C:\Users\mults\Downloads\conect-crm-key.pem" ubuntu@56.124.63.239

# Ver status dos containers
sudo docker ps

# ✅ Resultado esperado: 3 containers UP
# - conectcrm-postgres-prod
# - conectcrm-backend-prod  
# - conectcrm-frontend-prod
```

#### 1.2. Testar Endpoints HTTP

```bash
# Frontend (deve retornar HTML)
curl -I http://56.124.63.239:3000
# ✅ Esperado: HTTP/1.1 200 OK, Content-Type: text/html

# Backend API (deve retornar 404 ou redirect para /api)
curl -I http://56.124.63.239:3500
# ✅ Esperado: HTTP/1.1 404 (normal) ou 302 redirect

# Swagger Docs (deve retornar HTML do Swagger)
curl -I http://56.124.63.239:3500/api
# ✅ Esperado: HTTP/1.1 200 OK, Content-Type: text/html
```

#### 1.3. Verificar PostgreSQL

```bash
# Entrar no container
sudo docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod

# Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('atendimentos', 'clientes', 'usuarios')
ORDER BY tablename, cmd;

# ✅ Esperado: 12 políticas (SELECT, INSERT, UPDATE, DELETE em 12 tabelas)

# Sair
\q
exit
```

**Status Etapa 1**: [ ] Concluído

---

### 🌐 Etapa 2: Validação Frontend (5 min)

#### 2.1. Abrir Sistema no Browser

```
1. Abrir: http://56.124.63.239:3000
2. ✅ Esperado: Tela de login do ConectCRM carrega
3. ✅ Esperado: Sem erros no console (F12 → Console)
```

#### 2.2. Verificar Assets Carregados

```javascript
// Abrir DevTools (F12) → Network tab
// Filtrar por JS/CSS

// ✅ Verificar que carregou:
// - main.99750f62.js (Status 200, Size ~886KB gzip)
// - main.2748f189.css (Status 200, Size ~28KB gzip)
```

#### 2.3. Inspecionar HTML

```javascript
// F12 → Elements → <head>
// ✅ Verificar:
// <script defer src="/static/js/main.99750f62.js"></script>
// <link href="/static/css/main.2748f189.css" rel="stylesheet">
// <div id="root"> (deve ter conteúdo React dentro)
```

**Status Etapa 2**: [ ] Concluído

---

### 🔐 Etapa 3: Validação de Autenticação (5 min)

#### 3.1. Login via API (Empresa A)

```bash
# Fazer login como Empresa A
curl -X POST http://56.124.63.239:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usera@test.com",
    "senha": "123456"
  }'

# ✅ Resultado esperado:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-user-a",
    "email": "usera@test.com",
    "nome": "Usuário A",
    "empresa_id": "empresa-a-uuid"  // ⚡ CRÍTICO - deve ter empresa_id
  }
}

# Copiar o token para os próximos testes
```

#### 3.2. Login via API (Empresa B)

```bash
# Fazer login como Empresa B
curl -X POST http://56.124.63.239:3500/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "userb@test.com",
    "senha": "123456"
  }'

# ✅ Resultado esperado:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-user-b",
    "email": "userb@test.com",
    "nome": "Usuário B",
    "empresa_id": "empresa-b-uuid"  // ⚡ Diferente da Empresa A
  }
}
```

#### 3.3. Login via Browser

```
1. Acessar: http://56.124.63.239:3000
2. Preencher formulário de login:
   - Email: usera@test.com
   - Senha: 123456
3. Clicar em "Entrar"

✅ Esperado: Redireciona para dashboard/home
✅ Esperado: Token salvo no localStorage (F12 → Application → Local Storage)
❌ Se falhar: Ver console (F12) para erros
```

**Status Etapa 3**: [ ] Concluído

---

### 🔒 Etapa 4: Validação de Isolamento Multi-Tenant (CRÍTICO - 10 min)

#### 4.1. Preparar Dados de Teste

```sql
-- Conectar no PostgreSQL
ssh ... "sudo docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod"

-- Verificar empresas existentes
SELECT id, nome, cnpj FROM empresas;

-- Se não existir, criar empresas de teste
INSERT INTO empresas (id, nome, cnpj) VALUES 
  ('empresa-a-uuid', 'Empresa A Teste', '11111111000111'),
  ('empresa-b-uuid', 'Empresa B Teste', '22222222000122')
ON CONFLICT (id) DO NOTHING;

-- Criar atendimentos para Empresa A
INSERT INTO atendimentos (id, titulo, descricao, cliente_id, empresa_id) VALUES
  (gen_random_uuid(), 'Atendimento A1', 'Teste isolamento A1', NULL, 'empresa-a-uuid'),
  (gen_random_uuid(), 'Atendimento A2', 'Teste isolamento A2', NULL, 'empresa-a-uuid');

-- Criar atendimentos para Empresa B
INSERT INTO atendimentos (id, titulo, descricao, cliente_id, empresa_id) VALUES
  (gen_random_uuid(), 'Atendimento B1', 'Teste isolamento B1', NULL, 'empresa-b-uuid'),
  (gen_random_uuid(), 'Atendimento B2', 'Teste isolamento B2', NULL, 'empresa-b-uuid');

-- Verificar dados criados
SELECT titulo, empresa_id FROM atendimentos 
WHERE titulo LIKE 'Atendimento%' 
ORDER BY empresa_id, titulo;

\q
exit
```

#### 4.2. Teste de Isolamento - Empresa A

```bash
# Login Empresa A (pegar token do passo 3.1)
TOKEN_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Token da Empresa A

# Buscar atendimentos
curl http://56.124.63.239:3500/atendimentos \
  -H "Authorization: Bearer $TOKEN_A"

# ✅ RESULTADO ESPERADO:
# Deve retornar APENAS:
# - Atendimento A1
# - Atendimento A2
# 
# ❌ NÃO deve retornar:
# - Atendimento B1
# - Atendimento B2
```

#### 4.3. Teste de Isolamento - Empresa B

```bash
# Login Empresa B (pegar token do passo 3.2)
TOKEN_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Token da Empresa B

# Buscar atendimentos
curl http://56.124.63.239:3500/atendimentos \
  -H "Authorization: Bearer $TOKEN_B"

# ✅ RESULTADO ESPERADO:
# Deve retornar APENAS:
# - Atendimento B1
# - Atendimento B2
# 
# ❌ NÃO deve retornar:
# - Atendimento A1
# - Atendimento A2
```

#### 4.4. Teste de Criação com Isolamento

```bash
# Empresa A: Criar atendimento
curl -X POST http://56.124.63.239:3500/atendimentos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Novo Atendimento A3",
    "descricao": "Criado via API",
    "status": "aberto"
  }'

# ✅ Esperado: Retorna 201 Created com empresa_id = empresa-a-uuid

# Empresa B: Buscar atendimentos (não deve ver o A3)
curl http://56.124.63.239:3500/atendimentos \
  -H "Authorization: Bearer $TOKEN_B"

# ✅ Esperado: NÃO inclui "Novo Atendimento A3"
```

**Status Etapa 4**: [ ] Concluído

---

### 🚀 Etapa 5: Validação de Funcionalidades (5 min)

#### 5.1. Testar Endpoints Principais

```bash
# Usar token de qualquer empresa (ex: Empresa A)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Listar clientes
curl http://56.124.63.239:3500/clientes \
  -H "Authorization: Bearer $TOKEN"
# ✅ Esperado: Array de clientes (pode estar vazio)

# Listar usuários
curl http://56.124.63.239:3500/usuarios \
  -H "Authorization: Bearer $TOKEN"
# ✅ Esperado: Array de usuários da empresa

# Listar núcleos
curl http://56.124.63.239:3500/nucleos \
  -H "Authorization: Bearer $TOKEN"
# ✅ Esperado: Array de núcleos

# Buscar chamados
curl http://56.124.63.239:3500/chamados \
  -H "Authorization: Bearer $TOKEN"
# ✅ Esperado: Array de chamados (pode estar vazio)
```

#### 5.2. Testar via Browser (UI)

```
1. Login no sistema (http://56.124.63.239:3000)
2. Navegar para módulos:
   - ✅ Dashboard (deve carregar sem erros)
   - ✅ Atendimento (listar atendimentos)
   - ✅ Clientes (listar clientes)
   - ✅ Chat (se disponível)
   
3. Verificar console (F12):
   - ✅ Sem erros de CORS
   - ✅ Requisições retornando 200 OK
   - ✅ Sem erros JavaScript
```

**Status Etapa 5**: [ ] Concluído

---

## 📊 Resultado Final da Validação

### Checklist Geral

- [ ] **Infraestrutura**: 3 containers rodando (postgres, backend, frontend)
- [ ] **Frontend**: Carrega corretamente com React app (não nginx default)
- [ ] **Backend API**: Endpoints respondendo (Swagger acessível)
- [ ] **Autenticação**: Login funciona (via API e browser)
- [ ] **JWT**: Token gerado com `empresa_id` presente
- [ ] **RLS**: 12 políticas ativas no PostgreSQL
- [ ] **Isolamento**: Empresa A NÃO vê dados da Empresa B (e vice-versa)
- [ ] **CRUD**: Create, Read, Update, Delete funcionando
- [ ] **Console**: Sem erros JavaScript ou CORS

### Status Geral

```
🟢 SISTEMA APROVADO: Todos os testes passaram
🟡 SISTEMA PARCIAL: Alguns testes falharam (ver detalhes abaixo)
🔴 SISTEMA REPROVADO: Testes críticos falharam (não usar em produção)
```

**Meu resultado**: [ ] 🟢 [ ] 🟡 [ ] 🔴

---

## 🐛 Troubleshooting

### Problema 1: Frontend Mostra Página Nginx Default

**Sintoma**: `curl http://56.124.63.239:3000` retorna "Welcome to nginx!"

**Diagnóstico**:
```bash
# Verificar conteúdo do container
ssh ... "sudo docker exec conectcrm-frontend-prod ls -la /usr/share/nginx/html/"

# ✅ Se tem pasta static/ → Build foi copiado
# ❌ Se NÃO tem pasta static/ → Rebuild necessário
```

**Solução**:
```powershell
# Local
cd C:\Projetos\conectcrm
cd frontend-web
npx react-scripts build

# Rebuild Docker image
cd ..
docker build -f .production/docker/Dockerfile.frontend-simple -t conectcrm-frontend:latest .

# Redeploy
.\.production\scripts\deploy-frontend.ps1
```

### Problema 2: Backend Retorna 401 Unauthorized

**Sintoma**: Todas as requisições retornam `{"statusCode":401,"message":"Unauthorized"}`

**Diagnóstico**:
```bash
# Verificar se JWT_SECRET está correto
ssh ... "sudo docker exec conectcrm-backend-prod env | grep JWT"

# ✅ Deve mostrar: JWT_SECRET=conectcrm_jwt_secret_2024_production
```

**Solução**: Verificar que o token foi gerado corretamente no login

### Problema 3: Empresa A Vê Dados da Empresa B

**Sintoma**: Teste de isolamento FALHOU ❌

**Diagnóstico**:
```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'atendimentos';

-- ✅ Esperado: rowsecurity = TRUE
-- ❌ Se FALSE: RLS não está habilitado!
```

**Solução**:
```bash
# Aplicar migration RLS novamente
ssh ... "sudo docker exec -it conectcrm-postgres-prod psql -U conectcrm -d conectcrm_prod"

-- Habilitar RLS em todas as tabelas
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ... (mais 9 tabelas)

-- Verificar políticas
SELECT * FROM pg_policies;
```

### Problema 4: CORS Error no Browser

**Sintoma**: Console mostra "blocked by CORS policy"

**Diagnóstico**:
```bash
# Verificar config CORS no backend
ssh ... "sudo docker exec conectcrm-backend-prod cat /app/dist/main.js | grep -i cors"
```

**Solução**: Verificar `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: 'http://56.124.63.239:3000',  // ⚡ Deve estar correto
  credentials: true,
});
```

---

## ✅ Aprovação Final

**Testado por**: _________________  
**Data**: ___/___/_____  
**Status**: [ ] Aprovado [ ] Reprovado  

**Observações**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🎯 Próximos Passos Após Validação

Se todos os testes passaram:

1. ✅ **Documentar em produção** (este arquivo)
2. 🌐 **Configurar domínio** (apontar DNS para 56.124.63.239)
3. 🔒 **Adicionar SSL** (certificado Let's Encrypt)
4. 📊 **Implementar monitoramento** (logs, métricas, alertas)
5. 🚀 **Vender para clientes** (sistema pronto!)

---

**Última atualização**: 2 de novembro de 2025  
**Versão do documento**: 1.0
