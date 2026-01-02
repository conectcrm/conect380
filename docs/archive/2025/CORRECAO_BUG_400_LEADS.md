# 🐛 Correção Bug 400 - Modal de Leads

**Data**: 12 de novembro de 2025  
**Status**: ✅ **RESOLVIDO**

---

## 📋 Problema Identificado

Após refatoração dos modais com react-hook-form + yup, ao tentar criar/editar lead, o sistema retornava:

```
POST http://localhost:3001/leads 400 (Bad Request)
AxiosError: Request failed with status code 400
```

---

## 🔍 Análise da Causa Raiz

### Discrepâncias Backend ↔ Frontend

| Campo | Frontend (antes) | Backend (Entity/DTO) | Status |
|-------|------------------|----------------------|--------|
| `cargo` | ✅ Enviado | ❌ **Não existe** | **ERRO** |
| `email` | ✅ Obrigatório | ⚠️ Opcional (mas validado) | **CONFLITO** |

### Detalhamento:

1. **Campo `cargo` inexistente no backend**:
   - ✅ Frontend: Schema yup tinha `cargo: yup.string().optional()`
   - ❌ Backend: `CreateLeadDto` **NÃO** possui campo `cargo`
   - ❌ Backend: Entity `Lead` **NÃO** possui coluna `cargo`
   - **Resultado**: Backend rejeitava requisição com campo desconhecido

2. **Email obrigatório no frontend vs opcional no backend**:
   - ✅ Frontend: `email: yup.string().required('Email é obrigatório')`
   - ⚠️ Backend: `@IsEmail() @IsOptional() email?: string`
   - **Impacto**: Inconsistência de validação (frontend mais restritivo)

---

## ✅ Correções Aplicadas

### 1. Removido Campo `cargo` do Frontend

#### `frontend-web/src/services/leadsService.ts`

```typescript
// ❌ ANTES
export interface Lead {
  cargo?: string;  // REMOVIDO
}

export interface CreateLeadDto {
  cargo?: string;  // REMOVIDO
}

export interface UpdateLeadDto {
  cargo?: string;  // REMOVIDO
}

// ✅ DEPOIS (sem campo cargo)
export interface Lead {
  id: string;
  nome: string;
  email: string;  // Agora opcional
  telefone?: string;
  empresa_nome?: string;
  // cargo removido ✅
  status: StatusLead;
  origem: OrigemLead;
  // ...
}
```

#### `frontend-web/src/pages/LeadsPage.tsx`

**Schema de Validação:**
```typescript
// ❌ ANTES
const leadSchema = yup.object().shape({
  email: yup.string().required('Email é obrigatório'),
  cargo: yup.string().optional(),  // REMOVIDO
});

// ✅ DEPOIS
const leadSchema = yup.object().shape({
  email: yup.string().optional().email('Email inválido'),  // Agora opcional ✅
  // cargo removido ✅
});
```

**Default Values:**
```typescript
// ❌ ANTES
defaultValues: {
  cargo: '',  // REMOVIDO
}

// ✅ DEPOIS (sem cargo)
```

**Reset Form (Edição):**
```typescript
// ❌ ANTES
resetLeadForm({
  cargo: lead.cargo ?? '',  // REMOVIDO
});

// ✅ DEPOIS (sem cargo)
```

**Formulário JSX:**
```tsx
{/* ❌ REMOVIDO - Campo Cargo */}
<div>
  <label>Cargo</label>
  <input {...register('cargo')} />
</div>
```

**Modal de Conversão (Display Lead Info):**
```tsx
{/* ❌ REMOVIDO */}
{leadToConvert.cargo && (
  <div><strong>Cargo:</strong> {leadToConvert.cargo}</div>
)}
```

### 2. Email Agora é Opcional no Frontend

Alinhado com backend:
```typescript
// Backend CreateLeadDto
@IsEmail()
@IsOptional()  // ← Email opcional
email?: string;

// Frontend yup schema
email: yup.string().optional().email('Email inválido')  // ← Alinhado ✅
```

---

## 🧪 Como Testar a Correção

### Backend (já está correto, não precisa alteração)
```bash
# 1. Backend rodando
cd backend
npm run start:dev
```

### Frontend (com correções aplicadas)
```bash
# 2. Frontend recompila automaticamente (React hot reload)
cd frontend-web
npm start
```

### Cenários de Teste

#### ✅ Cenário 1: Criar Lead SEM Email (agora válido)
1. Abrir http://localhost:3000/leads
2. Clicar "Novo Lead"
3. Preencher:
   - Nome: "João Silva"
   - Telefone: "(11) 98765-4321"
   - Origem: "Formulário"
4. Deixar **email vazio**
5. Clicar "Criar Lead"
6. **Resultado esperado**: ✅ Lead criado com sucesso, toast verde aparece

#### ✅ Cenário 2: Criar Lead COM Email
1. Preencher:
   - Nome: "Maria Santos"
   - Email: "maria@empresa.com"
   - Empresa: "Empresa XYZ"
   - Origem: "Site"
2. Clicar "Criar Lead"
3. **Resultado esperado**: ✅ Lead criado com sucesso

#### ✅ Cenário 3: Email Inválido
1. Preencher:
   - Nome: "Pedro Costa"
   - Email: "emailinvalido" (sem @)
2. **Resultado esperado**: ❌ Validação inline "Email inválido"

#### ✅ Cenário 4: Editar Lead
1. Clicar no botão "Editar" de um lead existente
2. Modal abre com dados preenchidos (sem campo Cargo)
3. Modificar nome ou telefone
4. Clicar "Salvar"
5. **Resultado esperado**: ✅ Lead atualizado com sucesso

---

## 📊 Resumo das Alterações

### Arquivos Modificados

| Arquivo | Linhas Alteradas | Mudanças |
|---------|------------------|----------|
| `frontend-web/src/services/leadsService.ts` | ~10 linhas | Removido `cargo` de 3 interfaces, ajustado `email` para opcional em CreateLeadDto |
| `frontend-web/src/pages/LeadsPage.tsx` | ~30 linhas | Removido campo `cargo` do schema yup, defaultValues, resetForm, JSX formulário, modal conversão |

### Impacto

- ✅ **Bug 400 resolvido**: Backend agora aceita requisições do frontend
- ✅ **Consistência Backend ↔ Frontend**: Interfaces TypeScript espelham DTOs do NestJS
- ✅ **Validação alinhada**: Email opcional em ambos os lados
- ✅ **Enums alinhados**: `StatusLead` e `OrigemLead` agora usam exatamente os mesmos valores do backend
- ✅ **Integração robusta**: `LeadEstatisticas` e helpers tratados para dados legados (`origem` nula ou valores antigos)
- ✅ **Zero erros TypeScript**: Compilação limpa
- ✅ **UX melhorada**: Toast notifications funcionando corretamente

---

### 🔁 Atualização 12/11/2025 (tarde) — Alinhamento de enumerações

**Novo sintoma**: Mesmo após remover o campo `cargo`, a API continuou respondendo `400 Bad Request`.

**Nova causa raiz**:

1. `OrigemLead` divergia entre front e back (frontend enviava `site`, backend aceitava apenas `manual`, `formulario`, `api`, `whatsapp`, `indicacao`, `importacao`, `outro`).
2. `StatusLead` também usava labels diferentes (`contato_realizado`, `nao_qualificado` vs `contatado`, `desqualificado`).
3. Interface `LeadEstatisticas` no frontend esperava campos snake_case (`taxa_conversao`, `score_medio`), enquanto o backend devolvia camelCase (`taxaConversao`, `scoreMedio`).

**Ajustes implementados**:

- Atualizado `frontend-web/src/services/leadsService.ts`:
  - `StatusLead` → `{ NOVO, CONTATADO, QUALIFICADO, DESQUALIFICADO, CONVERTIDO }`
  - `OrigemLead` → `{ FORMULARIO, IMPORTACAO, API, WHATSAPP, MANUAL, INDICACAO, OUTRO }`
  - `Lead.orig`em agora aceita `OrigemLead | string | null` para lidar com registros antigos
  - `LeadEstatisticas` atualizado para camelCase e estrutura idêntica ao backend
- Atualizado `frontend-web/src/pages/LeadsPage.tsx`:
  - Default/form reset de origem passa a usar `MANUAL` e normaliza valores legados
  - Select de origem/labels refletindo novas opções (Manual, Formulário, Importação, API, WhatsApp, Indicação, Outro)
  - Labels/cores/filtro de status ajustados para os novos valores
  - Cartões de métricas lendo `taxaConversao` e `scoreMedio`
  - Helper `getOrigemLabel` aceita `undefined`/strings antigas e exibe fallback "Origem não informada"

**Estado após ajustes**: `POST /leads` concluindo com 201 sempre que os campos obrigatórios (`nome` + `origem`) estão corretos, nenhuma validação extra acusa valores inválidos.

---

### 🔁 Atualização 12/11/2025 (noite) — Erro 500 ao criar lead

**Sintoma**: Após corrigir o 400, o formulário ainda retornava `500 Internal Server Error` esporadicamente. Logs do NestJS mostravam falha dentro de `LeadsService.create` durante `repository.save`.

**Causa raiz**: Campos opcionais enviados pelo frontend como string vazia (`""`) chegavam ao backend e eram persistidos diretamente. Quando `responsavel_id` vinha vazio, o Postgres rejeitava o insert com `invalid input syntax for type uuid: ""`.

**Correções aplicadas**:

- Frontend
  - `LeadsPage` agora normaliza os campos opcionais via `yup.transform`, convertendo strings vazias para `undefined`.
  - `leadsService` sanitiza o payload antes do POST/PATCH, removendo chaves com `''`, `undefined` ou `null`.
- Backend
  - `LeadsService` sanitiza DTOs antes de criar/atualizar entidades, ignorando strings vazias para `email`, `telefone`, `empresa_nome`, `responsavel_id`, etc.
  - Logs de erro passaram a registrar `message`, `code` e `detail`, facilitando diagnóstico futuro.

**Resultado**: `POST /leads` volta a retornar 201, mesmo quando usuário deixa campos opcionais em branco. Nenhum erro 500 reproduzido após sanitização.

---

## 🎯 Resultado Final

### Antes (❌ ERRO)
```
POST /leads → 400 Bad Request
{
  "statusCode": 400,
  "message": ["cargo should not exist"],  // Campo desconhecido
  "error": "Bad Request"
}
```

### Depois (✅ SUCESSO)
```
POST /leads → 201 Created
{
  "id": "uuid-123",
  "nome": "João Silva",
  "email": null,  // Opcional ✅
  "telefone": "(11) 98765-4321",
  "empresa_nome": null,
  // cargo removido ✅
  "origem": "formulario",
  "status": "novo",
  "score": 0,
  // ...
}
```

---

## 📝 Lições Aprendidas

1. **SEMPRE verificar DTOs do backend antes de criar schemas frontend**
   - Ler `*.dto.ts` para saber campos exatos e validações
   - Confirmar se campos existem na entity (`*.entity.ts`)

2. **Alinhar validações frontend ↔ backend**:
   - Campo obrigatório no backend → obrigatório no frontend
   - Campo opcional no backend → opcional no frontend
   - Validações específicas (@IsEmail, @Min, @Max) → espelhar no yup

3. **Testar imediatamente após refatoração**:
   - Refatoração grande = testar CRUD completo antes de dar concluído
   - Verificar Network tab (F12) para ver requisições e respostas

4. **TypeScript não pega tudo**:
   - TypeScript garante tipos corretos no frontend
   - MAS não valida se tipos batem com backend
   - Sempre validar runtime (testar API calls)

---

## 🚀 Próximos Passos

- [x] ✅ Bug 400 corrigido
- [x] ✅ Testes manuais realizados
- [ ] ⏳ Opcional: Adicionar campo `cargo` ao backend (se for requisito de negócio)
  - Adicionar coluna na entity `Lead`
  - Adicionar campo no `CreateLeadDto` e `UpdateLeadDto`
  - Criar migration: `npm run migration:generate`
  - Re-adicionar ao frontend

---

**Autor**: GitHub Copilot  
**Revisado por**: Equipe ConectCRM
