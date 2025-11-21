# 🧪 Guia de Testes - Migração Multi-Tenancy

**Data**: 13 de novembro de 2025  
**Objetivo**: Validar que a migração dos módulos não quebrou funcionalidades e garante isolamento multi-tenant

---

## 📋 Pré-requisitos

Antes de executar os testes, certifique-se de ter:

- ✅ Node.js v18+ instalado
- ✅ PostgreSQL rodando
- ✅ Banco de dados criado e migrado (`npm run migration:run`)
- ✅ Usuários de teste criados em pelo menos 2 empresas diferentes

---

## 🚀 1. Teste de Compilação

Garante que não há erros TypeScript após a migração:

```powershell
cd backend
npm run build
```

**Resultado esperado**: 
```
✔ Build successful
```

**Se falhar**: Verifique os erros TypeScript reportados e corrija antes de prosseguir.

---

## 🧪 2. Testes Unitários

Executar suíte de testes unitários:

```powershell
cd backend
npm test
```

**Resultado esperado**: Todos os testes devem passar (pode haver alguns pendentes/skipped).

---

## 🌐 3. Testes E2E Multi-Tenancy

### 3.1. Preparar Ambiente

Criar usuários de teste no banco:

```sql
-- Criar Empresa 1
INSERT INTO empresas (id, nome, cnpj) VALUES 
  ('1', 'Empresa Teste 1', '11111111000111');

-- Criar Empresa 2
INSERT INTO empresas (id, nome, cnpj) VALUES 
  ('2', 'Empresa Teste 2', '22222222000122');

-- Criar usuário Empresa 1
INSERT INTO users (id, nome, email, password, empresa_id, role) VALUES 
  (uuid_generate_v4(), 'Admin Empresa 1', 'admin@empresa1.com', '$2b$10$hashed...', '1', 'admin');

-- Criar usuário Empresa 2
INSERT INTO users (id, nome, email, password, empresa_id, role) VALUES 
  (uuid_generate_v4(), 'Admin Empresa 2', 'admin@empresa2.com', '$2b$10$hashed...', '2', 'admin');
```

### 3.2. Executar Testes E2E

```powershell
cd backend
npm run test:e2e -- multi-tenancy.e2e-spec
```

**Resultado esperado**:
```
 PASS  test/multi-tenancy.e2e-spec.ts
  Multi-Tenancy Isolation (E2E)
    🔐 Autenticação
      ✓ Deve fazer login na Empresa 1
      ✓ Deve fazer login na Empresa 2
    📊 Leads - Isolamento Multi-Tenancy
      ✓ Empresa 1 deve criar lead
      ✓ Empresa 2 deve criar lead
      ✓ Empresa 1 NÃO deve acessar lead da Empresa 2 (404)
      ✓ Empresa 2 NÃO deve acessar lead da Empresa 1 (404)
      ✓ Empresa 1 deve listar apenas seus próprios leads
    🎯 Oportunidades - Isolamento Multi-Tenancy
      ✓ Empresa 1 deve criar oportunidade
      ✓ Empresa 2 NÃO deve acessar oportunidade da Empresa 1 (404)
    👥 Clientes - Isolamento Multi-Tenancy
      ✓ Empresa 1 deve criar cliente
      ✓ Empresa 2 NÃO deve acessar cliente da Empresa 1 (404)
    🔒 Tentativas de Bypass
      ✓ NÃO deve permitir modificar empresa_id via payload
      ✓ NÃO deve permitir atualizar empresa_id
    🚫 Testes Negativos
      ✓ NÃO deve acessar recursos sem token JWT (401)
      ✓ NÃO deve acessar recursos com token inválido (401)

Tests Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
```

---

## 🔍 4. Testes Manuais (Postman/Thunder Client)

### 4.1. Preparar Collection

Importar arquivo `test/postman/multi-tenancy-tests.json` (a ser criado) ou testar manualmente:

### 4.2. Cenários de Teste

#### ✅ Teste 1: Login e Token

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@empresa1.com",
  "password": "senha123"
}
```

**Espera**: Status 200 + `{ "access_token": "eyJhbGc..." }`

#### ✅ Teste 2: Criar Lead

```http
POST http://localhost:3001/leads
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "nome": "Lead Teste",
  "email": "teste@email.com",
  "telefone": "11999999999",
  "origem": "website"
}
```

**Espera**: Status 201 + Lead criado com `empresa_id` = "1"

#### ✅ Teste 3: Listar Leads (Isolamento)

```http
GET http://localhost:3001/leads
Authorization: Bearer {TOKEN_EMPRESA_1}
```

**Espera**: Status 200 + Array com **apenas** leads da Empresa 1

#### ❌ Teste 4: Tentar Acessar Lead de Outra Empresa

```http
# 1. Criar lead com token da Empresa 1 (pegar ID retornado)
# 2. Fazer login com token da Empresa 2
# 3. Tentar acessar o lead:

GET http://localhost:3001/leads/{ID_LEAD_EMPRESA_1}
Authorization: Bearer {TOKEN_EMPRESA_2}
```

**Espera**: Status 404 ou 403 (Forbidden)

#### ❌ Teste 5: Tentar Bypass via Payload

```http
POST http://localhost:3001/leads
Authorization: Bearer {TOKEN_EMPRESA_1}
Content-Type: application/json

{
  "nome": "Lead Malicioso",
  "email": "hack@test.com",
  "empresa_id": "2"  // ← Tentando criar para outra empresa
}
```

**Espera**: Status 201, mas lead criado com `empresa_id` = "1" (do token, não do payload)

---

## 📊 5. Testes de Performance

### 5.1. Benchmark de Queries

```powershell
cd backend
npm run test:perf
```

Ou manualmente com `k6` ou `artillery`:

```javascript
// benchmark.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10, // 10 usuários virtuais
  duration: '30s',
};

export default function () {
  const token = 'Bearer ...';
  const res = http.get('http://localhost:3001/leads', {
    headers: { Authorization: token },
  });
  
  check(res, {
    'status 200': (r) => r.status === 200,
    'resposta < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Resultado esperado**: 
- p95 < 500ms
- p99 < 1s
- Taxa de erro < 1%

---

## 🐛 6. Troubleshooting

### Erro: "No metadata for Proposta was found"

**Causa**: Entity Proposta não registrada no módulo  
**Solução**: 
```typescript
// contratos.module.ts
TypeOrmModule.forFeature([Contrato, AssinaturaContrato, Proposta]) // ← Adicionar Proposta
```

### Erro: "Cannot read property 'empresa_id' of undefined"

**Causa**: EmpresaGuard não está extraindo empresa_id do JWT  
**Solução**: Verificar se o JWT contém `empresa_id`:
```typescript
// No JwtStrategy, garantir que payload tem empresa_id:
async validate(payload: any) {
  return { 
    id: payload.sub, 
    email: payload.email,
    empresa_id: payload.empresa_id // ← OBRIGATÓRIO
  };
}
```

### Erro: "ForbiddenException: Você não tem permissão..."

**Causa**: Tentativa de acessar recurso de outra empresa (funcionando corretamente!)  
**Ação**: Verificar se o token usado pertence à empresa correta

### Teste E2E falha: "Cannot find module '@nestjs/testing'"

**Solução**:
```powershell
npm install --save-dev @nestjs/testing @types/supertest supertest
```

---

## ✅ Checklist de Validação Final

Antes de fazer deploy em produção:

- [ ] ✅ `npm run build` - Compila sem erros
- [ ] ✅ `npm test` - Testes unitários passam
- [ ] ✅ `npm run test:e2e` - Testes E2E multi-tenancy passam
- [ ] ✅ Teste manual Postman - Isolamento validado
- [ ] ✅ Teste de bypass - Empresa A não acessa dados da B
- [ ] ✅ Teste de performance - p95 < 500ms
- [ ] ✅ Logs revisados - Sem erros no console
- [ ] ✅ Documentação atualizada
- [ ] ✅ Rollback plan documentado

---

## 📝 Logs e Métricas

### Habilitar Logs Detalhados

```typescript
// main.ts
app.useLogger(app.get(AppLogger));

// .env
LOG_LEVEL=debug
```

### Monitorar em Tempo Real

```powershell
# Backend logs
tail -f backend/logs/app.log | grep "empresa_id"

# Queries SQL (development)
LOG_QUERIES=true npm run start:dev
```

---

## 🚀 Próximas Ações

Após validação bem-sucedida:

1. **Deploy em Staging**: Testar em ambiente similar à produção
2. **Smoke Tests**: Rodar subset de testes críticos em staging
3. **Monitoramento**: Configurar alertas para falhas de isolamento
4. **Documentação**: Atualizar Swagger/OpenAPI com exemplos
5. **Treinamento**: Orientar equipe sobre novo padrão

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verificar documentação: `RELATORIO_MIGRACAO_MODULOS.md`
2. Consultar proof of concept: `MIGRACAO_LEADS_PROVA_CONCEITO.md`
3. Revisar guia de infraestrutura: `GUIA_MELHORIAS_IMPLEMENTADAS.md`

---

**Última atualização**: 13 de novembro de 2025  
**Responsável**: GitHub Copilot  
**Status**: 🟢 Pronto para testes
