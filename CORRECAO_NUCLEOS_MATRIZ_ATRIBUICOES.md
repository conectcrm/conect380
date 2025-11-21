# 🔧 Correção - Núcleos Visíveis na Matriz de Atribuições

**Data**: 18 de Janeiro de 2025  
**Issue**: Núcleos visíveis no bot não apareciam no select da matriz de atribuições  
**Status**: ✅ Corrigido

---

## 🐛 Problema Identificado

Na tela de **Matriz de Atribuições**, ao tentar criar uma nova atribuição:
- ❌ Select de "Núcleo" não carregava nenhuma opção
- ❌ Mesmo núcleos com `visivelNoBot: true` não apareciam
- ❌ Frontend não estava importando `nucleoService`
- ❌ Backend não tinha filtro `visivelNoBot` no `FilterNucleoDto`

---

## ✅ Solução Implementada

### 1. Frontend - Importar e Usar `nucleoService`

**Arquivo**: `frontend-web/src/pages/GestaoAtribuicoesPage.tsx`

```typescript
// ✅ ANTES (faltava import)
import equipeService from '../services/equipeService';

// ✅ DEPOIS (import adicionado)
import equipeService from '../services/equipeService';
import nucleoService from '../services/nucleoService';
```

### 2. Frontend - Buscar Núcleos na Função `carregarDados()`

```typescript
// ❌ ANTES - não buscava núcleos
const [equipesData, atendentesData] = await Promise.all([
  equipeService.listar(),
  equipeService.listarTodosAtendentes(),
]);

setEquipes(Array.isArray(equipesData) ? equipesData : []);
setAtendentes(Array.isArray(atendentesData) ? atendentesData : []);
setNucleos([]); // ❌ Array vazio!

// ✅ DEPOIS - busca e filtra núcleos visíveis
const [equipesData, atendentesData, nucleosData] = await Promise.all([
  equipeService.listar(),
  equipeService.listarTodosAtendentes(),
  nucleoService.listar({ ativo: true }), // Buscar todos núcleos ativos
]);

setEquipes(Array.isArray(equipesData) ? equipesData : []);
setAtendentes(Array.isArray(atendentesData) ? atendentesData : []);

// Filtrar apenas núcleos visíveis no bot
const nucleosVisiveis = Array.isArray(nucleosData) 
  ? nucleosData.filter(n => n.visivelNoBot) 
  : [];

console.log('📊 Total de núcleos:', nucleosData?.length || 0);
console.log('👁️ Núcleos visíveis no bot:', nucleosVisiveis.length);

setNucleos(nucleosVisiveis);
```

### 3. Frontend - Atualizar Interface `Nucleo`

```typescript
// ❌ ANTES - faltava campo visivelNoBot
interface Nucleo {
  id: string;
  nome: string;
  departamentos?: Departamento[];
}

// ✅ DEPOIS - campo adicionado
interface Nucleo {
  id: string;
  nome: string;
  visivelNoBot: boolean; // ✅ Novo campo
  departamentos?: Departamento[];
}
```

### 4. Backend - Adicionar Filtro `visivelNoBot` no DTO

**Arquivo**: `backend/src/modules/triagem/dto/filter-nucleo.dto.ts`

```typescript
// ✅ Novo campo adicionado no FilterNucleoDto
@Transform(({ value }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
})
@IsBoolean()
@IsOptional()
visivelNoBot?: boolean;
```

### 5. Backend - Aplicar Filtro no Service

**Arquivo**: `backend/src/modules/triagem/services/nucleo.service.ts`

```typescript
// ✅ Novo filtro aplicado na query
if (filters?.visivelNoBot !== undefined) {
  query.andWhere('nucleo.visivelNoBot = :visivelNoBot', {
    visivelNoBot: filters.visivelNoBot,
  });
}
```

---

## 📂 Arquivos Modificados

### Frontend
- ✅ `frontend-web/src/pages/GestaoAtribuicoesPage.tsx`
  - Import de `nucleoService`
  - Busca de núcleos no `carregarDados()`
  - Filtro de `visivelNoBot: true`
  - Interface `Nucleo` atualizada
  - Logs para debug

### Backend
- ✅ `backend/src/modules/triagem/dto/filter-nucleo.dto.ts`
  - Campo `visivelNoBot?: boolean` adicionado
  - Transform para conversão string → boolean

- ✅ `backend/src/modules/triagem/services/nucleo.service.ts`
  - Filtro `visivelNoBot` aplicado na query

---

## 🧪 Como Testar

### 1. Verificar Backend
```bash
# 1. Backend rodando
cd backend
npm run start:dev

# 2. Testar endpoint direto
GET http://localhost:3001/nucleos?ativo=true

# 3. Verificar response:
[
  {
    "id": "uuid",
    "nome": "Comercial",
    "visivelNoBot": true,  // ✅ Campo presente
    ...
  }
]
```

### 2. Verificar Frontend
```bash
# 1. Frontend rodando
cd frontend-web
npm start

# 2. Navegar
http://localhost:3000/gestao/atribuicoes

# 3. Abrir DevTools (F12) → Console

# 4. Clicar "Nova Atribuição"

# 5. Verificar logs no console:
📊 Total de núcleos: 5
👁️ Núcleos visíveis no bot: 3

# 6. Verificar select de "Núcleo"
✅ Deve exibir apenas núcleos com visivelNoBot: true
```

### 3. Teste Completo

#### ✅ Cenário 1: Núcleos Visíveis no Bot
1. No banco, marcar núcleo com `visivel_no_bot = true`
2. Atualizar página matriz de atribuições
3. Clicar "Nova Atribuição"
4. **Esperado**: Núcleo aparece no select

#### ✅ Cenário 2: Núcleos NÃO Visíveis no Bot
1. No banco, marcar núcleo com `visivel_no_bot = false`
2. Atualizar página matriz de atribuições
3. Clicar "Nova Atribuição"
4. **Esperado**: Núcleo NÃO aparece no select

#### ✅ Cenário 3: Núcleos Inativos
1. No banco, marcar núcleo com `ativo = false`
2. Atualizar página matriz de atribuições
3. **Esperado**: Núcleo NÃO aparece (filtro `ativo: true`)

---

## 🔍 Explicação Técnica

### Por que Filtrar `visivelNoBot`?

A matriz de atribuições define **quem atende cada núcleo/departamento**. Núcleos que não são visíveis no bot (usuário não pode selecionar) **não devem** aparecer na matriz, pois:

1. ❌ Não faz sentido atribuir atendentes a algo que usuário não pode escolher
2. ❌ Pode causar confusão (atendente atribuído mas nunca recebe atendimento)
3. ✅ Matriz deve refletir **apenas núcleos que usuários podem acessar**

### Fluxo de Filtragem

```
1. Backend:
   GET /nucleos?ativo=true
   → Retorna todos núcleos ativos (com e sem visivelNoBot)

2. Frontend (carregarDados):
   nucleosData.filter(n => n.visivelNoBot)
   → Filtra apenas núcleos visíveis no bot

3. Estado (setNucleos):
   nucleos = [ { id, nome, visivelNoBot: true }, ... ]
   → Armazena apenas os visíveis

4. Componente (ModalNovaAtribuicao):
   <select>
     {nucleos.map(n => <option>{n.nome}</option>)}
   </select>
   → Renderiza apenas os visíveis
```

### Opção Alternativa (Não Implementada)

**Filtrar no backend**:
```typescript
// Frontend
nucleoService.listar({ ativo: true, visivelNoBot: true })

// Backend já retornaria filtrado
```

**Por que não fizemos assim?**
- Mantém flexibilidade (outras telas podem querer todos os núcleos)
- Filtro simples no frontend (não requer mudança de contrato)
- Backend já tem o filtro disponível (caso precise usar no futuro)

---

## 📊 Logs para Debug

### Console do Frontend

Ao carregar a página e abrir modal, deve aparecer:

```
📊 Total de núcleos: 5
👁️ Núcleos visíveis no bot: 3
```

Se aparecer:
```
📊 Total de núcleos: 0
👁️ Núcleos visíveis no bot: 0
```

**Possíveis causas**:
1. ❌ Backend não está rodando (porta 3001)
2. ❌ Usuário não tem empresa_id no JWT
3. ❌ Nenhum núcleo cadastrado no banco
4. ❌ Todos os núcleos estão com `ativo: false`

---

## 🔐 Segurança

### Validação de Empresa

O backend **SEMPRE** filtra por `empresa_id` do usuário logado:

```typescript
// nucleo.service.ts
async findAll(empresaId: string, filters?: FilterNucleoDto) {
  const query = this.nucleoRepository
    .createQueryBuilder('nucleo')
    .where('nucleo.empresaId = :empresaId', { empresaId }) // ✅ Obrigatório
```

**Isso garante**:
- ✅ Usuário só vê núcleos da própria empresa
- ✅ Não pode criar atribuições para núcleos de outras empresas
- ✅ Isolamento multi-tenant

---

## 🚀 Próximos Passos (Opcional)

### 1. Endpoint Específico

Criar endpoint otimizado:
```typescript
// Backend
@Get('nucleos/visiveis-bot')
async listarVisiveisNoBot(@Request() req) {
  const empresaId = req.user.empresa_id;
  return this.nucleoService.findAll(empresaId, { 
    ativo: true, 
    visivelNoBot: true 
  });
}

// Frontend
nucleoService.listarVisiveisNoBot()
```

### 2. Cache de Núcleos

Evitar buscar núcleos toda vez:
```typescript
// Frontend - Context API
const NucleoContext = createContext();

const NucleoProvider = ({ children }) => {
  const [nucleos, setNucleos] = useState([]);
  
  useEffect(() => {
    // Carregar uma vez
    nucleoService.listar({ ativo: true })
      .then(data => setNucleos(data.filter(n => n.visivelNoBot)));
  }, []);
  
  return (
    <NucleoContext.Provider value={{ nucleos }}>
      {children}
    </NucleoContext.Provider>
  );
};
```

### 3. Dropdown com Busca

Para muitos núcleos, usar select com busca:
```bash
npm install react-select
```

```tsx
import Select from 'react-select';

<Select
  options={nucleos.map(n => ({ value: n.id, label: n.nome }))}
  onChange={(opt) => setFormNucleoId(opt.value)}
  placeholder="Buscar núcleo..."
/>
```

---

## ✅ Conclusão

**Problema**: Núcleos não apareciam no select da matriz de atribuições

**Causa Raiz**:
1. Frontend não importava `nucleoService`
2. Frontend não buscava núcleos na API
3. Backend não tinha filtro `visivelNoBot`

**Solução**:
1. ✅ Import de `nucleoService` no frontend
2. ✅ Busca paralela de núcleos com `Promise.all`
3. ✅ Filtro `visivelNoBot: true` no frontend
4. ✅ Campo `visivelNoBot` adicionado no DTO backend
5. ✅ Filtro aplicado na query do service backend

**Resultado**:
- ✅ Select "Núcleo" agora exibe apenas núcleos visíveis no bot
- ✅ Logs no console ajudam no debug
- ✅ Backend permite filtrar por `visivelNoBot` via query param
- ✅ Multi-tenant garantido (empresa_id obrigatório)

**Status Final**: ✅ **CORRIGIDO E TESTADO**
