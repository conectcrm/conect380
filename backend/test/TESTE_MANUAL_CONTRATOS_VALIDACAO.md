# 🧪 Teste Manual - Validação Multi-Tenancy em Contratos

**Data**: 13 de novembro de 2025  
**Objetivo**: Validar que um usuário não pode criar contrato referenciando proposta de outra empresa

---

## 🎯 Cenário de Teste

Um usuário malicioso da **Empresa 1** tenta criar um contrato usando uma proposta da **Empresa 2**.

**Resultado esperado**: Sistema deve **rejeitar** com erro `403 Forbidden`.

---

## 🔧 Setup Inicial

### 1. Preparar Dados de Teste

Execute no banco de dados:

```sql
-- Criar/verificar Empresas
INSERT INTO empresas (id, nome, cnpj) VALUES 
  ('empresa-1-uuid', 'Empresa Teste 1', '11111111000111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO empresas (id, nome, cnpj) VALUES 
  ('empresa-2-uuid', 'Empresa Teste 2', '22222222000122')
ON CONFLICT (id) DO NOTHING;

-- Criar Usuários (senha: senha123)
INSERT INTO users (id, nome, email, password, empresa_id, role) VALUES 
  (uuid_generate_v4(), 'Admin Empresa 1', 'admin1@test.com', '$2b$10$hashed...', 'empresa-1-uuid', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, nome, email, password, empresa_id, role) VALUES 
  (uuid_generate_v4(), 'Admin Empresa 2', 'admin2@test.com', '$2b$10$hashed...', 'empresa-2-uuid', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Criar Proposta na Empresa 2
INSERT INTO propostas (
  id, 
  numero, 
  titulo, 
  cliente, 
  produtos, 
  total, 
  status, 
  empresa_id
) VALUES (
  'proposta-empresa-2-uuid',
  'PROP-2025-001',
  'Proposta para Cliente XYZ',
  '{"id":"cliente-1","nome":"Cliente XYZ","email":"cliente@xyz.com"}'::jsonb,
  '[]'::jsonb,
  5000.00,
  'aprovada',
  'empresa-2-uuid'  -- ← Proposta pertence à Empresa 2
);
```

### 2. Iniciar Backend

```powershell
cd backend
npm run start:dev
```

Aguarde mensagem: `🚀 Servidor rodando na porta 3001`

---

## 📋 Testes com Postman/Thunder Client

### ✅ Teste 1: Login na Empresa 1

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin1@test.com",
  "password": "senha123"
}
```

**Espera**: Status `200 OK`

**Resposta**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin1@test.com",
    "empresa_id": "empresa-1-uuid"  // ← Empresa 1
  }
}
```

**Ação**: Copiar o `access_token` para usar nos próximos testes.

---

### ❌ Teste 2: Tentar Criar Contrato com Proposta de Outra Empresa (DEVE FALHAR)

```http
POST http://localhost:3001/contratos
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "propostaId": "proposta-empresa-2-uuid",
  "clienteId": "cliente-1-uuid",
  "dataInicio": "2025-11-15",
  "dataFim": "2026-11-15",
  "valor": 5000.00,
  "formaPagamento": "boleto",
  "diaVencimento": 10
}
```

**Espera**: Status `403 Forbidden` ⛔

**Resposta esperada**:
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para criar contrato com esta proposta",
  "error": "Forbidden"
}
```

**Validação no Console Backend**:
```
[Nest] WARN [ContratosService] Tentativa de criar contrato com proposta de outra empresa. 
       Empresa do token: empresa-1-uuid, Empresa da proposta: empresa-2-uuid
```

---

### ✅ Teste 3: Criar Proposta na Empresa 1 Primeiro

```http
POST http://localhost:3001/propostas
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "titulo": "Proposta Válida Empresa 1",
  "cliente": {
    "id": "cliente-test-uuid",
    "nome": "Cliente Teste",
    "email": "cliente@test.com"
  },
  "produtos": [],
  "total": 3000.00,
  "status": "aprovada"
}
```

**Espera**: Status `201 Created`

**Resposta**:
```json
{
  "id": "nova-proposta-uuid",
  "numero": "PROP-2025-002",
  "empresa_id": "empresa-1-uuid",  // ← Mesma empresa do token
  ...
}
```

**Ação**: Copiar o `id` da proposta criada.

---

### ✅ Teste 4: Criar Contrato com Proposta da Própria Empresa (DEVE FUNCIONAR)

```http
POST http://localhost:3001/contratos
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "propostaId": "nova-proposta-uuid",  // ← Proposta da Empresa 1
  "clienteId": "cliente-test-uuid",
  "dataInicio": "2025-11-15",
  "dataFim": "2026-11-15",
  "valor": 3000.00,
  "formaPagamento": "boleto",
  "diaVencimento": 10
}
```

**Espera**: Status `201 Created` ✅

**Resposta esperada**:
```json
{
  "id": "contrato-uuid",
  "numero": "CONT-2025-001",
  "propostaId": "nova-proposta-uuid",
  "status": "aguardando_assinatura",
  ...
}
```

**Validação no Console Backend**:
```
[Nest] LOG [ContratosService] Contrato criado: CONT-2025-001
```

---

## 🎭 Cenários de Teste Completos

### Cenário A: Bypass via Proposta Inexistente

```http
POST http://localhost:3001/contratos
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "propostaId": "proposta-que-nao-existe-uuid",
  ...
}
```

**Espera**: Status `404 Not Found`  
**Mensagem**: `"Proposta não encontrada"`

---

### Cenário B: Criar Sem Autenticação

```http
POST http://localhost:3001/contratos
Content-Type: application/json
# SEM header Authorization

{
  "propostaId": "proposta-empresa-2-uuid",
  ...
}
```

**Espera**: Status `401 Unauthorized`  
**Mensagem**: `"Unauthorized"`

---

### Cenário C: Token Inválido

```http
POST http://localhost:3001/contratos
Authorization: Bearer token-invalido-fake
Content-Type: application/json

{
  "propostaId": "proposta-empresa-2-uuid",
  ...
}
```

**Espera**: Status `401 Unauthorized`  
**Mensagem**: `"Unauthorized"` ou `"Invalid token"`

---

## 📊 Checklist de Validação

Execute os testes na ordem e marque os resultados:

- [ ] ✅ **Teste 1**: Login Empresa 1 → Status 200 + token recebido
- [ ] ❌ **Teste 2**: Criar contrato com proposta de outra empresa → Status 403
- [ ] ✅ **Teste 3**: Criar proposta na Empresa 1 → Status 201
- [ ] ✅ **Teste 4**: Criar contrato com proposta própria → Status 201
- [ ] ❌ **Cenário A**: Proposta inexistente → Status 404
- [ ] ❌ **Cenário B**: Sem autenticação → Status 401
- [ ] ❌ **Cenário C**: Token inválido → Status 401

**Critério de Sucesso**: Todos os testes devem passar conforme esperado.

---

## 🔍 Validação no Banco de Dados

Após executar os testes, verificar no PostgreSQL:

```sql
-- Verificar que contrato NÃO foi criado no Teste 2 (403)
SELECT COUNT(*) as tentativas_bloqueadas 
FROM contratos 
WHERE proposta_id = 'proposta-empresa-2-uuid';
-- Espera: 0

-- Verificar que contrato FOI criado no Teste 4 (201)
SELECT * 
FROM contratos 
WHERE proposta_id = 'nova-proposta-uuid';
-- Espera: 1 registro
```

---

## 🐛 Troubleshooting

### Erro: "Proposta não encontrada" quando deveria retornar 403

**Causa**: UUID da proposta não existe no banco  
**Solução**: Executar novamente o script SQL de setup

### Erro: "Cannot read property 'empresa_id' of undefined"

**Causa**: Query não retornou a proposta (WHERE incorreto)  
**Solução**: Verificar que `propostaRepository.findOne()` está funcionando

### Erro: Backend não inicia

**Causa**: Porta 3001 já em uso  
**Solução**: Matar processo `npx kill-port 3001` e reiniciar

---

## ✅ Resultado Esperado Final

**SUCESSO**: Sistema está protegido contra cross-empresa access! 🎉

- ✅ Validação de `empresa_id` implementada
- ✅ ForbiddenException retornada corretamente
- ✅ Log de segurança registrado
- ✅ Contrato só criado quando proposta pertence à mesma empresa

---

## 📝 Próximos Passos

Após validação manual bem-sucedida:

1. ✅ Implementar teste E2E automatizado (já criado em `multi-tenancy.e2e-spec.ts`)
2. ⏳ Adicionar mesma validação em outros módulos (se aplicável)
3. ⏳ Configurar alertas de segurança (monitoramento de tentativas de bypass)
4. ⏳ Documentar no Swagger/OpenAPI

---

**Última atualização**: 13 de novembro de 2025  
**Status**: 🟢 Validação implementada e testável
