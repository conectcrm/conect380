# 🎯 Onde Definir Núcleos no Menu de Atendimento

## 📍 Localização Atual (Hardcoded)

Atualmente, os núcleos estão **HARDCODED** (fixos no código) em **2 arquivos diferentes**:

---

## 1️⃣ DepartamentosPage.tsx

**Arquivo**: `frontend-web/src/pages/DepartamentosPage.tsx`  
**Linha**: 50-57

```typescript
// Lista de núcleos disponíveis (pode vir de API também)
const nucleosDisponiveis = [
  { id: 'todos', nome: 'Todos os Núcleos' },
  { id: 'vendas', nome: 'Vendas' },
  { id: 'suporte', nome: 'Suporte' },
  { id: 'financeiro', nome: 'Financeiro' },
  { id: 'comercial', nome: 'Comercial' },
  { id: 'operacoes', nome: 'Operações' },
];
```

**Uso**: Filtro de núcleos na página de departamentos

---

## 2️⃣ ModalCadastroDepartamento.tsx

**Arquivo**: `frontend-web/src/components/modals/ModalCadastroDepartamento.tsx`  
**Linha**: 48-53

```typescript
// Nucleos disponíveis
const nucleos = [
  { id: 'vendas', nome: 'Vendas' },
  { id: 'suporte', nome: 'Suporte' },
  { id: 'financeiro', nome: 'Financeiro' },
  { id: 'comercial', nome: 'Comercial' },
  { id: 'operacoes', nome: 'Operações' },
];
```

**Uso**: Dropdown de seleção de núcleo ao criar/editar departamento

---

## ⚠️ PROBLEMA ATUAL

### Os núcleos estão duplicados em 2 lugares:
1. ❌ **Hardcoded** em cada arquivo
2. ❌ **IDs fixos** ('vendas', 'suporte', etc.)
3. ❌ **Não sincronizado** com o banco de dados
4. ❌ **Diferentes** dos núcleos criados via Gestão de Núcleos

### Os núcleos REAIS no banco:
- Estão na tabela `nucleos`
- Podem ser gerenciados via **Gestão de Núcleos** (`/gestao/nucleos`)
- Têm IDs UUID (não 'vendas', 'suporte', etc.)
- São dinâmicos (criados pelo usuário)

---

## ✅ SOLUÇÃO RECOMENDADA

### Opção 1: Buscar da API (Recomendado) 🌟

Modificar os 2 arquivos para buscar núcleos da API:

#### 1. Criar Hook Compartilhado
```typescript
// frontend-web/src/hooks/useNucleos.ts
import { useState, useEffect } from 'react';
import nucleoService, { Nucleo } from '../services/nucleoService';

export function useNucleos() {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarNucleos() {
      try {
        setLoading(true);
        const dados = await nucleoService.listar({ ativo: true });
        setNucleos(Array.isArray(dados) ? dados : []);
      } catch (err) {
        console.error('Erro ao carregar núcleos:', err);
        setError('Erro ao carregar núcleos');
        setNucleos([]);
      } finally {
        setLoading(false);
      }
    }
    carregarNucleos();
  }, []);

  return { nucleos, loading, error };
}
```

#### 2. Usar no DepartamentosPage.tsx
```typescript
import { useNucleos } from '../hooks/useNucleos';

export default function DepartamentosPage() {
  const { nucleos: nucleosDisponiveis, loading: loadingNucleos } = useNucleos();
  
  // Adicionar opção "Todos"
  const nucleosComTodos = [
    { id: 'todos', nome: 'Todos os Núcleos' },
    ...nucleosDisponiveis
  ];

  // Resto do código...
}
```

#### 3. Usar no ModalCadastroDepartamento.tsx
```typescript
import { useNucleos } from '../../hooks/useNucleos';

export default function ModalCadastroDepartamento() {
  const { nucleos, loading: loadingNucleos } = useNucleos();

  // Resto do código...
  
  return (
    <select value={nucleoId} onChange={(e) => setNucleoId(e.target.value)}>
      <option value="">Selecione um núcleo</option>
      {loadingNucleos ? (
        <option disabled>Carregando...</option>
      ) : (
        nucleos.map(nucleo => (
          <option key={nucleo.id} value={nucleo.id}>
            {nucleo.nome}
          </option>
        ))
      )}
    </select>
  );
}
```

---

### Opção 2: Configuração Global

Criar arquivo de configuração centralizado:

```typescript
// frontend-web/src/config/nucleos.config.ts
export const NUCLEOS_PADRAO = [
  { id: 'vendas', nome: 'Vendas', cor: '#10B981', icone: '💰' },
  { id: 'suporte', nome: 'Suporte', cor: '#3B82F6', icone: '🛠️' },
  { id: 'financeiro', nome: 'Financeiro', cor: '#F59E0B', icone: '💵' },
  { id: 'comercial', nome: 'Comercial', cor: '#8B5CF6', icone: '📊' },
  { id: 'operacoes', nome: 'Operações', cor: '#EF4444', icone: '⚙️' },
];
```

E importar nos 2 arquivos:
```typescript
import { NUCLEOS_PADRAO } from '../config/nucleos.config';
```

---

## 🎯 RECOMENDAÇÃO FINAL

### Implementar Opção 1 (API) porque:
1. ✅ **Sincronizado** com banco de dados
2. ✅ **Dinâmico** - núcleos criados aparecem automaticamente
3. ✅ **Consistente** - mesma fonte de dados
4. ✅ **Escalável** - novos núcleos sem alterar código
5. ✅ **Multi-tenant** - cada empresa tem seus núcleos

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Passo 1: Criar Hook
- [ ] Criar arquivo `frontend-web/src/hooks/useNucleos.ts`
- [ ] Implementar hook `useNucleos()`
- [ ] Testar hook individualmente

### Passo 2: Atualizar DepartamentosPage
- [ ] Importar `useNucleos`
- [ ] Substituir array hardcoded
- [ ] Adicionar opção "Todos os Núcleos"
- [ ] Testar filtro de núcleos

### Passo 3: Atualizar ModalCadastroDepartamento
- [ ] Importar `useNucleos`
- [ ] Substituir array hardcoded
- [ ] Adicionar loading state no select
- [ ] Testar criação de departamento

### Passo 4: Validar Backend
- [ ] Confirmar endpoint `GET /nucleos` funcional
- [ ] Verificar filtro `?ativo=true`
- [ ] Testar retorno com núcleos reais

### Passo 5: Testes End-to-End
- [ ] Criar núcleo via Gestão de Núcleos
- [ ] Verificar aparece em Departamentos
- [ ] Verificar aparece no modal
- [ ] Testar vínculo departamento-núcleo

---

## 🔗 Arquivos Relacionados

### Backend (API)
- ✅ `backend/src/modulos/triagem/controllers/nucleo.controller.ts`
- ✅ `backend/src/modulos/triagem/services/nucleo.service.ts`
- ✅ `backend/src/modulos/triagem/entities/nucleo.entity.ts`

### Frontend (Serviço)
- ✅ `frontend-web/src/services/nucleoService.ts` (já existe!)

### Frontend (Páginas)
- ⚠️ `frontend-web/src/pages/DepartamentosPage.tsx` (ATUALIZAR)
- ⚠️ `frontend-web/src/components/modals/ModalCadastroDepartamento.tsx` (ATUALIZAR)

### Frontend (Novo)
- 🆕 `frontend-web/src/hooks/useNucleos.ts` (CRIAR)

---

## 💡 EXEMPLO COMPLETO

### Hook Completo (useNucleos.ts)
```typescript
import { useState, useEffect } from 'react';
import nucleoService, { Nucleo } from '../services/nucleoService';

interface UseNucleosOptions {
  apenasAtivos?: boolean;
  incluirTodos?: boolean;
}

export function useNucleos(options: UseNucleosOptions = {}) {
  const { apenasAtivos = true, incluirTodos = false } = options;
  
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarNucleos() {
      try {
        setLoading(true);
        setError(null);
        
        const filtros = apenasAtivos ? { ativo: true } : {};
        const dados = await nucleoService.listar(filtros);
        
        let nucleosCarregados = Array.isArray(dados) ? dados : [];
        
        // Adicionar opção "Todos" se solicitado
        if (incluirTodos) {
          nucleosCarregados = [
            { id: 'todos', nome: 'Todos os Núcleos' } as any,
            ...nucleosCarregados
          ];
        }
        
        setNucleos(nucleosCarregados);
      } catch (err) {
        console.error('Erro ao carregar núcleos:', err);
        setError('Erro ao carregar núcleos');
        setNucleos([]);
      } finally {
        setLoading(false);
      }
    }
    
    carregarNucleos();
  }, [apenasAtivos, incluirTodos]);

  const recarregar = async () => {
    setLoading(true);
    // Reexecuta o carregamento
  };

  return { 
    nucleos, 
    loading, 
    error,
    recarregar 
  };
}
```

### Uso no DepartamentosPage.tsx
```typescript
import { useNucleos } from '../hooks/useNucleos';

export default function DepartamentosPage() {
  const { 
    nucleos: nucleosDisponiveis, 
    loading: loadingNucleos 
  } = useNucleos({ 
    apenasAtivos: true, 
    incluirTodos: true 
  });

  return (
    <select 
      value={filtroNucleo} 
      onChange={(e) => setFiltroNucleo(e.target.value)}
      disabled={loadingNucleos}
    >
      {nucleosDisponiveis.map(nucleo => (
        <option key={nucleo.id} value={nucleo.id}>
          {nucleo.nome}
        </option>
      ))}
    </select>
  );
}
```

---

## 🚀 Próximos Passos

1. **Criar hook `useNucleos`** ← Começar aqui!
2. **Atualizar DepartamentosPage**
3. **Atualizar ModalCadastroDepartamento**
4. **Testar fluxo completo**
5. **Remover arrays hardcoded**

---

**Quer que eu implemente essa solução agora?** 🎯

---

**Data**: 17/10/2025
**Status**: 📋 Documentação Técnica
**Prioridade**: 🔥 Alta (Remove duplicação, sincroniza com DB)
