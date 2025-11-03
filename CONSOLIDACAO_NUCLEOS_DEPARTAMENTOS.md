# ✅ CONSOLIDAÇÃO: Núcleos com Departamentos e Atendentes Diretos

**Data**: 28/10/2025  
**Feature**: Suporte para núcleos COM departamentos ou atendentes diretos  
**Status**: ✅ Backend Implementado | 🎨 Frontend UI Completo | ⏳ Ações Pendentes

---

## 📋 Problema Resolvido

Antes da implementação, todos os núcleos funcionavam da mesma forma:
- Cliente escolhe núcleo → Bot sempre pergunta o departamento
- Não havia suporte para atendentes diretos no núcleo

**Agora temos 3 cenários:**

1. **Núcleo COM departamentos** → Bot mostra menu de departamentos
2. **Núcleo SEM departamentos + COM atendentes** → Transfere direto para atendente do núcleo
3. **Núcleo SEM departamentos + SEM atendentes** → Cria ticket na fila manual

---

## 🔧 Backend - Alterações Implementadas

### 1️⃣ `flow-engine.ts`

**Arquivo**: `backend/src/modules/triagem/engine/flow-engine.ts`

**Mudança**: Método `resolverMenuDepartamentos()` agora detecta núcleos sem departamentos

```typescript
private async resolverMenuDepartamentos(): Promise<...> {
  const departamentos = this.config.sessao.contexto?.__departamentosDisponiveis || [];
  const nucleoId = this.config.sessao.contexto?.destinoNucleoId;
  const temAtendentesNoNucleo = this.config.sessao.contexto?.__nucleoTemAtendentes;

  // 🎯 Cenário 1: Núcleo SEM departamentos, mas COM atendentes diretos
  if ((!Array.isArray(departamentos) || departamentos.length === 0) && temAtendentesNoNucleo) {
    this.logger.log('[FLOW ENGINE] 🎯 Núcleo sem departamentos, mas com atendentes diretos. Transferindo...');
    
    this.config.sessao.contexto = {
      ...this.config.sessao.contexto,
      __transferirParaNucleoSemDepartamento: true,
    };
    
    return {
      autoAvancar: true,
      proximaEtapaId: 'coleta-nome',
    };
  }

  // 🎯 Cenário 2: Núcleo SEM departamentos e SEM atendentes
  if (!Array.isArray(departamentos) || departamentos.length === 0) {
    this.logger.warn('[FLOW ENGINE] ⚠️ Núcleo sem departamentos e sem atendentes.');
    return {
      autoAvancar: true,
      proximaEtapaId: 'coleta-nome',
    };
  }
  
  // ... resto do código (menu de departamentos)
}
```

**Resultado**: Bot pula automaticamente o menu de departamentos quando não há nenhum.

---

### 2️⃣ `flow-options.util.ts`

**Arquivo**: `backend/src/modules/triagem/utils/flow-options.util.ts`

**Mudança**: Função `criarOpcoesNucleos()` agora adiciona informações de atendentes

```typescript
export function criarOpcoesNucleos(
  sessao: SessaoTriagem,
  nucleos: NucleoBotOption[],
): BotOption[] {
  return nucleos.map((nucleo, index) => {
    const departamentosDisponiveis = Array.isArray(nucleo.departamentos)
      ? nucleo.departamentos
      : [];
    const temDepartamentos = departamentosDisponiveis.length > 0;
    
    // 🎯 Verificar se núcleo tem atendentes diretos
    const atendentesNucleo = Array.isArray(nucleo.atendentesIds) 
      ? nucleo.atendentesIds 
      : [];
    const nucleoTemAtendentes = atendentesNucleo.length > 0;

    return {
      // ... campos existentes
      salvarContexto: {
        areaTitulo: String(nucleo.nome || '').toLowerCase(),
        destinoNucleoId: nucleo.id,
        __mensagemFinal: nucleo.mensagemBoasVindas || null,
        __departamentosDisponiveis: departamentosDisponiveis,
        __temDepartamentos: temDepartamentos,
        __nucleoTemAtendentes: nucleoTemAtendentes, // 🆕 Novo
        __atendentesNucleoIds: atendentesNucleo,     // 🆕 Novo
      },
    } as BotOption;
  });
}
```

**Resultado**: Contexto da sessão agora contém informações sobre atendentes do núcleo.

---

### 3️⃣ `triagem-bot.types.ts`

**Arquivo**: `backend/src/modules/triagem/types/triagem-bot.types.ts`

**Mudança**: Interface `NucleoBotOption` agora tem campo `atendentesIds`

```typescript
export interface NucleoBotOption {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  mensagemBoasVindas?: string;
  mensagemForaHorario?: string;
  horarioFuncionamento?: HorarioFuncionamento | null;
  timezone?: string | null;
  departamentos?: DepartamentoBotOption[];
  atendentesIds?: string[]; // 🆕 IDs dos atendentes vinculados ao núcleo
  [key: string]: any;
}
```

**Resultado**: TypeScript reconhece atendentesIds como propriedade válida.

---

### 4️⃣ `nucleo.service.ts`

**Arquivo**: `backend/src/modules/triagem/services/nucleo.service.ts`

**Mudança**: Método `findOpcoesParaBot()` retorna `atendentesIds`

```typescript
async findOpcoesParaBot(empresaId: string): Promise<any[]> {
  // ... busca núcleos do banco

  const resultado = await Promise.all(
    nucleos.map(async (nucleo) => {
      // ... busca departamentos

      return {
        id: nucleo.id,
        nome: nucleo.nome,
        descricao: nucleo.descricao,
        cor: nucleo.cor,
        icone: nucleo.icone,
        mensagemBoasVindas: nucleo.mensagemBoasVindas,
        mensagemForaHorario: nucleo.mensagemForaHorario,
        horarioFuncionamento: nucleo.horarioFuncionamento,
        disponivel: verificacaoHorario.estaAberto,
        motivoIndisponivel: verificacaoHorario.motivoFechado,
        proximaAbertura: verificacaoHorario.proximaAbertura,
        atendentesIds: nucleo.atendentesIds || [], // 🆕 Incluir atendentes
        departamentos: departamentos.map((dep: any) => ({
          id: dep.id,
          nome: dep.nome,
          descricao: dep.descricao,
          cor: dep.cor,
          icone: dep.icone,
        })),
      };
    }),
  );

  return resultado;
}
```

**Resultado**: API retorna atendentes do núcleo junto com departamentos.

---

## 🎨 Frontend - Alterações Implementadas

### 1️⃣ Novo Layout de Cards Expansíveis

**Arquivo**: `frontend-web/src/pages/GestaoNucleosPage.tsx`

**Mudanças**:
- ✅ Substituiu tabela por grid de cards (2 colunas em telas grandes)
- ✅ Cada card mostra:
  - Ícone colorido do núcleo
  - Nome, descrição, código
  - Badges: Ativo/Inativo, Visível WhatsApp, Prioridade
  - **🆕 Contadores**: X departamentos, Y atendentes
  - Botões: Editar, Deletar, **🆕 Expandir/Recolher**

**Código Adicionado**:

```typescript
const [expandedNucleos, setExpandedNucleos] = useState<Set<string>>(new Set());

const toggleNucleoExpansao = (nucleoId: string) => {
  setExpandedNucleos(prev => {
    const newSet = new Set(prev);
    if (newSet.has(nucleoId)) {
      newSet.delete(nucleoId);
    } else {
      newSet.add(nucleoId);
    }
    return newSet;
  });
};
```

---

### 2️⃣ Área Expansível - Departamentos

**Cenário 1**: Núcleo COM departamentos

```tsx
{temDepartamentos && (
  <div className="mb-6">
    <h4>Departamentos ({numDepartamentos})</h4>
    <div className="space-y-2">
      {nucleo.departamentos?.map((dept) => (
        <div key={dept.id} className="p-3 bg-white rounded-lg">
          {/* Mini-card do departamento */}
          <div>{dept.nome}</div>
          <span>{dept.ativo ? 'Ativo' : 'Inativo'}</span>
          <button>Editar</button>
        </div>
      ))}
    </div>
    <button>Gerenciar Departamentos Completo</button>
  </div>
)}
```

**Visual**:
```
┌─────────────────────────────────────┐
│ Departamentos (3)       [+ Adicionar│
├─────────────────────────────────────┤
│ 🔵 Cobrança           [Ativo] [✏️]  │
│ 🟣 Contas a Pagar     [Ativo] [✏️]  │
│ 🟢 Análise Crédito    [Ativo] [✏️]  │
│                                      │
│ [🏢 Gerenciar Departamentos Completo]│
└─────────────────────────────────────┘
```

---

### 3️⃣ Área Expansível - Atendentes Diretos

**Cenário 2**: Núcleo SEM departamentos + COM atendentes

```tsx
{!temDepartamentos && temAtendentes && (
  <div>
    <h4>Atendentes Diretos ({numAtendentes})</h4>
    <div className="space-y-2">
      {nucleo.atendentes?.map((atendenteId) => (
        <div key={atendenteId} className="p-3 bg-white rounded-lg">
          <div>Atendente {atendenteId.slice(0, 8)}</div>
          <p>ID: {atendenteId}</p>
          <button>Remover</button>
        </div>
      ))}
    </div>
  </div>
)}
```

**Visual**:
```
┌─────────────────────────────────────┐
│ Atendentes Diretos (2)   [+ Adicionar│
├─────────────────────────────────────┤
│ 👤 Atendente abc123de     [🗑️]     │
│    ID: abc123de-45...                │
│                                      │
│ 👤 Atendente fgh456ij     [🗑️]     │
│    ID: fgh456ij-78...                │
└─────────────────────────────────────┘
```

---

### 4️⃣ Área Expansível - Alerta de Fila Manual

**Cenário 3**: Núcleo SEM departamentos + SEM atendentes

```tsx
{!temDepartamentos && !temAtendentes && (
  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
    <p className="text-xs text-yellow-800">
      ⚠️ <strong>Atenção:</strong> Este núcleo não tem departamentos nem atendentes.
      Tickets criados ficarão na fila manual.
    </p>
  </div>
)}
```

**Visual**:
```
┌─────────────────────────────────────┐
│ ⚠️ Atenção                          │
│ Este núcleo não tem departamentos   │
│ nem atendentes. Tickets ficarão na  │
│ fila manual.                         │
│                                      │
│ [+ Criar Primeiro Departamento]     │
│ [+ Adicionar Atendente]             │
└─────────────────────────────────────┘
```

---

## 🧪 Como Testar

### Backend

1. **Reiniciar backend**:
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Criar núcleo sem departamentos via SQL**:
   ```sql
   -- Exemplo: Suporte Técnico com atendentes diretos
   UPDATE nucleos_atendimento 
   SET atendentes_ids = ARRAY['uuid-atendente-1', 'uuid-atendente-2']::uuid[]
   WHERE codigo = 'SUPORTE';
   ```

3. **Testar no WhatsApp**:
   - Enviar: `Olá`
   - Escolher: `1. Suporte Técnico`
   - **Resultado esperado**: Bot pula menu de departamentos e transfere direto

### Frontend

1. **Abrir página**:
   ```
   http://localhost:3000/gestao/nucleos
   ```

2. **Verificar cards**:
   - Cada núcleo aparece em card separado
   - Contadores mostram: "X departamentos, Y atendentes"

3. **Expandir card**:
   - Clicar no botão ▼
   - Ver lista de departamentos (se houver)
   - Ver lista de atendentes diretos (se não houver departamentos)
   - Ver alerta amarelo (se não houver nem um nem outro)

---

## ⏳ Próximos Passos (Funcionalidades Pendentes)

### 1. Implementar Botões de Ação

- [ ] **"+ Adicionar Departamento"** → Abrir modal para criar departamento
- [ ] **"+ Adicionar Atendente"** → Abrir seletor de atendentes
- [ ] **"Remover Atendente"** → Confirmar e remover do array
- [ ] **"Editar Departamento"** → Abrir modal com dados preenchidos
- [ ] **"Gerenciar Departamentos Completo"** → Navegar para página dedicada

### 2. Criar Modais

- [ ] **Modal de Adicionar Departamento**:
  - Formulário com: Nome, Descrição, Código, Cor, Ícone
  - Select para escolher núcleo pai
  - Checkbox "Visível no Bot"

- [ ] **Modal de Selecionar Atendentes**:
  - Lista de atendentes disponíveis
  - Busca por nome
  - Checkbox para selecionar múltiplos
  - Salvar alterações

### 3. Página Dedicada de Departamentos (Opcional)

Se houver necessidade de gestão avançada:
- Criar `GestaoDepartamentosPage.tsx`
- Filtros avançados (por núcleo, status, supervisor)
- CRUD completo de departamentos
- Gestão de atendentes vinculados
- Configurações de SLA e horário

---

## 📊 Comparação Antes/Depois

### Antes
```
WhatsApp Bot:
  Cliente: Olá
  Bot: Escolha o núcleo: 1. Suporte
  Cliente: 1
  Bot: Escolha departamento: [ERRO - sem departamentos]
```

### Depois
```
WhatsApp Bot:
  Cliente: Olá
  Bot: Escolha o núcleo: 1. Suporte
  Cliente: 1
  Bot: 🎯 Conectando você ao Suporte Técnico...
      → Transfere direto para atendente do núcleo
```

---

## 🔗 Arquivos Modificados

### Backend
1. `backend/src/modules/triagem/engine/flow-engine.ts`
2. `backend/src/modules/triagem/utils/flow-options.util.ts`
3. `backend/src/modules/triagem/types/triagem-bot.types.ts`
4. `backend/src/modules/triagem/services/nucleo.service.ts`

### Frontend
1. `frontend-web/src/pages/GestaoNucleosPage.tsx`

---

## 📝 Comandos Úteis

### Adicionar atendentes a um núcleo via SQL
```sql
-- Adicionar atendentes diretos ao núcleo
UPDATE nucleos_atendimento 
SET atendentes_ids = ARRAY['abc-123', 'def-456']::uuid[]
WHERE codigo = 'SUPORTE';

-- Ver núcleos com atendentes
SELECT 
  id, 
  nome, 
  codigo,
  array_length(atendentes_ids, 1) as num_atendentes,
  atendentes_ids
FROM nucleos_atendimento;
```

### Ver departamentos de um núcleo
```sql
SELECT 
  d.id,
  d.nome,
  d.codigo,
  d.ativo,
  d.visivel_no_bot,
  n.nome as nucleo_nome
FROM departamentos d
JOIN nucleos_atendimento n ON d.nucleo_id = n.id
WHERE n.codigo = 'FINANCEIRO';
```

---

## ✅ Conclusão

✅ **Backend**: Totalmente funcional  
✅ **Frontend UI**: Layout completo  
⏳ **Interações**: Pendentes (botões de ação)

A base está pronta! Agora é só implementar os modais e ações dos botões conforme necessidade do usuário.

---

**Mantido por**: Equipe ConectCRM  
**Última atualização**: 28/10/2025
