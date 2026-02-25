# 🐛 Etapa 3 - Bugs Críticos Corrigidos

**Data**: 6 de novembro de 2025  
**Status**: ✅ RESOLVIDO  
**Tempo Total**: ~5h (estimado 6h)

---

## 📊 Resumo Executivo

Durante a implementação da Etapa 3 (Zustand com Persist + DevTools), **3 bugs críticos de loop infinito** foram identificados e corrigidos em sequência:

| Bug | Arquivo | Causa | Impacto | Status |
|-----|---------|-------|---------|--------|
| **#1** | `useAtendimentos.ts` | Composite selectors | Loop infinito "Maximum update depth exceeded" | ✅ CORRIGIDO |
| **#2** | `useHistoricoCliente.ts`<br>`useContextoCliente.ts` | Função em useEffect deps | Múltiplas chamadas API duplicadas | ✅ CORRIGIDO |
| **#3** | `ChatOmnichannel.tsx` | Referência instável de objeto aninhado | 2x chamadas por ação | ✅ CORRIGIDO |

---

## 🐛 Bug #1: Loop Infinito em Composite Selectors

### Problema

Tentativa de "otimização" com selectors compostos quebrou o sistema:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO (useAtendimentos.ts ~285)
import { selectListaTicketsData, selectTicketActions } from '../stores/atendimentoSelectors';

const { tickets, ticketSelecionado, ticketsLoading, ticketsError } = useAtendimentoStore(selectListaTicketsData);
const { setTickets, selecionarTicket, ... } = useAtendimentoStore(selectTicketActions);
```

**Por que quebrou?**
- Selector `selectListaTicketsData` retorna **novo objeto literal** a cada chamada
- Zustand compara por **referência**
- Nova referência → Zustand detecta "mudança" → Re-render → Novo objeto → Loop infinito!

### Sintomas

```
❌ Warning: Maximum update depth exceeded. This can happen when a component 
   calls setState inside useEffect, but useEffect doesn't have a dependency array,
   or one of the dependencies changes on every render.
```

### Solução

Revertido para **individual selectors** (padrão Zustand):

```typescript
// ✅ CÓDIGO CORRIGIDO
const tickets = useAtendimentoStore((state) => state.tickets);
const ticketSelecionado = useAtendimentoStore((state) => state.ticketSelecionado);
const ticketsLoading = useAtendimentoStore((state) => state.ticketsLoading);
const ticketsError = useAtendimentoStore((state) => state.ticketsError);
const selecionarTicketStore = useAtendimentoStore((state) => state.selecionarTicket);
const setTickets = useAtendimentoStore((state) => state.setTickets);
const setTicketsLoading = useAtendimentoStore((state) => state.setTicketsLoading);
const setTicketsError = useAtendimentoStore((state) => state.setTicketsError);
```

**Por que funciona?**
- Zustand faz **shallow comparison** automaticamente em selectors individuais
- Mesmo valor → Mesma referência → Sem re-render desnecessário

### Lição Aprendida

> ⚠️ **IMPORTANTE**: Em Zustand, composite selectors que retornam objetos literais 
> devem usar `useShallow` (Zustand v4+) ou serem evitados. Individual selectors 
> são mais verbosos mas **100% seguros**.

---

## 🐛 Bug #2: Função em Dependências do useEffect

### Problema

Hooks `useHistoricoCliente` e `useContextoCliente` tinham **dependência circular**:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO (useHistoricoCliente.ts ~62)
const carregarHistorico = useCallback(async () => {
  // ... código
}, [clienteId]);

useEffect(() => {
  if (autoLoad && clienteId) {
    carregarHistorico();
  }
}, [autoLoad, clienteId, carregarHistorico]); // ← carregarHistorico na deps!
```

**Por que quebrou?**
1. `clienteId` muda → `carregarHistorico` recriado (useCallback)
2. `useEffect` vê nova função → Dispara novamente
3. **Loop**: função recriada → useEffect dispara → função recriada → infinito!

### Sintomas

```
❌ Console cheio de logs duplicados:
📜 Carregando histórico do cliente: 11870d4f-...
📜 Carregando histórico do cliente: 11870d4f-...  ← DUPLICADO
📜 Buscando histórico do cliente: 11870d4f-...
📜 Buscando histórico do cliente: 11870d4f-...    ← DUPLICADO
✅ Histórico carregado: 5 atendimentos
✅ Histórico carregado: 5 atendimentos            ← DUPLICADO
```

### Solução

Remover função das dependências do `useEffect`:

```typescript
// ✅ CÓDIGO CORRIGIDO
const carregarHistorico = useCallback(async () => {
  // ... código
}, [clienteId]);

useEffect(() => {
  if (autoLoad && clienteId) {
    carregarHistorico();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoLoad, clienteId]); // ✅ Sem carregarHistorico!
```

**Por que funciona?**
- `carregarHistorico` JÁ tem `clienteId` nas dependências do `useCallback`
- Quando `clienteId` muda, `useEffect` dispara e usa versão atualizada da função
- Sem dependência da função = Sem loop!

### Arquivos Corrigidos

- ✅ `frontend-web/src/features/atendimento/omnichannel/hooks/useHistoricoCliente.ts` (linha 62)
- ✅ `frontend-web/src/features/atendimento/omnichannel/hooks/useContextoCliente.ts` (linha 101)

---

## 🐛 Bug #3: Referência Instável de Objeto Aninhado

### Problema

Mesmo após Bug #2, **ainda havia 2x chamadas** porque `clienteId` vinha de **objeto aninhado**:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO (ChatOmnichannel.tsx ~505)
useHistoricoCliente({
  clienteId: ticketSelecionado?.contato?.clienteVinculado?.id || null,
  autoLoad: true
});

useContextoCliente({
  clienteId: ticketSelecionado?.contato?.clienteVinculado?.id || null,
  telefone: ticketSelecionado?.contato?.telefone || null,
  autoLoad: true
});
```

**Por que quebrou?**
- Mesmo que o **valor** do ID seja o mesmo (`"11870d4f-0059-4466-a546-1c878d1330a2"`)
- O objeto `ticketSelecionado` pode ter **nova referência** a cada render
- React compara por **referência**, não por valor profundo
- Nova referência → `useEffect` pensa que mudou → Dispara novamente!

### Sintomas

```
❌ Ainda 2x chamadas (menos que antes, mas não ideal):
📜 Carregando histórico do cliente: 11870d4f-...
📜 Carregando histórico do cliente: 11870d4f-...  ← AINDA DUPLICADO
```

### Solução

Criar **valores estáveis** com `useMemo`:

```typescript
// ✅ CÓDIGO CORRIGIDO (ChatOmnichannel.tsx ~500)
const clienteIdEstavel = useMemo(
  () => ticketSelecionado?.contato?.clienteVinculado?.id || null,
  [ticketSelecionado?.contato?.clienteVinculado?.id]
);

const telefoneEstavel = useMemo(
  () => ticketSelecionado?.contato?.telefone || null,
  [ticketSelecionado?.contato?.telefone]
);

useHistoricoCliente({
  clienteId: clienteIdEstavel, // ✅ Valor estável
  autoLoad: true
});

useContextoCliente({
  clienteId: clienteIdEstavel, // ✅ Valor estável
  telefone: telefoneEstavel,   // ✅ Valor estável
  autoLoad: true
});
```

**Por que funciona?**
- `useMemo` compara **valor** (string do ID) nas dependências
- Se ID for igual → Retorna **mesma referência** do valor anterior
- Mesma referência → `useEffect` não dispara → **Sem duplicação!**

### Resultado Final

```
✅ APENAS 1x CHAMADA (PERFEITO):
📜 Carregando histórico do cliente: 11870d4f-...  ← 1x apenas!
📜 Buscando histórico do cliente: 11870d4f-...   ← 1x apenas!
✅ Histórico carregado: 5 atendimentos            ← 1x apenas!
```

---

## 📚 Lições Aprendidas - Padrões React/Zustand

### ✅ DO: Boas Práticas

1. **Individual Selectors em Zustand**
   ```typescript
   const value = useStore((state) => state.value);
   ```

2. **useCallback sem função nas deps do useEffect**
   ```typescript
   const fn = useCallback(() => {...}, [dep]);
   useEffect(() => { fn(); }, [dep]); // Sem fn nas deps!
   ```

3. **useMemo para valores derivados de objetos**
   ```typescript
   const id = useMemo(() => obj?.nested?.id, [obj?.nested?.id]);
   ```

4. **Logs de debug para identificar loops**
   ```typescript
   console.log('📜 Carregando...'); // Útil para ver duplicações
   ```

### ❌ DON'T: Anti-Padrões

1. **Composite selectors sem useShallow**
   ```typescript
   // ❌ Cria novo objeto toda vez
   const data = useStore(state => ({ a: state.a, b: state.b }));
   ```

2. **Função de useCallback nas deps de useEffect**
   ```typescript
   // ❌ Loop garantido
   const fn = useCallback(..., [dep]);
   useEffect(() => fn(), [fn]); // ← Loop!
   ```

3. **Objetos aninhados direto em props/deps**
   ```typescript
   // ❌ Nova referência toda vez
   useHook({ id: obj?.nested?.id });
   ```

4. **Ignorar warnings do React**
   ```typescript
   // ❌ "Maximum update depth" = Loop infinito, não ignore!
   ```

---

## 🎯 Impacto das Correções

### Antes (com bugs)
- ❌ Console cheio de erros "Maximum update depth exceeded"
- ❌ 2-3x chamadas API duplicadas por ação
- ❌ Performance ruim (CPU 100%, app travado)
- ❌ Impossível usar a aplicação

### Depois (bugs corrigidos)
- ✅ Console limpo, sem erros
- ✅ 1x chamada API por ação (otimizado)
- ✅ Performance fluida (CPU normal)
- ✅ UX perfeita, tudo funcionando

---

## 📁 Arquivos Modificados

### Corrigidos para resolver bugs:

1. **`frontend-web/src/features/atendimento/omnichannel/hooks/useAtendimentos.ts`**
   - Linha ~285: Revertido composite selectors para individual selectors

2. **`frontend-web/src/features/atendimento/omnichannel/hooks/useHistoricoCliente.ts`**
   - Linha 62: Removido `carregarHistorico` das deps do useEffect

3. **`frontend-web/src/features/atendimento/omnichannel/hooks/useContextoCliente.ts`**
   - Linha 101: Removido `carregarContexto` das deps do useEffect

4. **`frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`**
   - Linha 1: Adicionado `useMemo` aos imports
   - Linha ~500: Criado `clienteIdEstavel` e `telefoneEstavel` com useMemo

### Criados como parte da solução:

5. **`frontend-web/src/features/atendimento/omnichannel/stores/atendimentoSelectors.ts`**
   - ⚠️ **ATENÇÃO**: Selectors criados, mas composite selectors NÃO devem ser usados!
   - Mantido como **referência/documentação** apenas

---

## 🚀 Status Final

| Item | Status | Observações |
|------|--------|-------------|
| Loop infinito #1 | ✅ RESOLVIDO | Individual selectors são o padrão |
| Loop infinito #2 | ✅ RESOLVIDO | useEffect deps corretas |
| Loop infinito #3 | ✅ RESOLVIDO | useMemo para estabilizar referências |
| Console limpo | ✅ VALIDADO | Sem erros, sem warnings |
| Performance | ✅ VALIDADO | 1x chamada por ação |
| UX/Funcionalidade | ✅ VALIDADO | Tudo funciona perfeitamente |
| Persistência (localStorage) | ✅ FUNCIONANDO | Ticket persiste após F5 |
| DevTools (Redux) | ✅ FUNCIONANDO | Time-travel debug OK |
| Webhook Meta WhatsApp | ✅ FUNCIONANDO | Integração OK |

---

## 📖 Documentação Relacionada

- ✅ `CONSOLIDACAO_ETAPA2_ZUSTAND.md` - Resolução do loop inicial
- ✅ `CONSOLIDACAO_ETAPA3_COMPLETA.md` - Documentação completa da Etapa 3
- ✅ `ETAPA3_BUGS_CORRIGIDOS.md` - Este documento (bugs durante implementação)
- ✅ `PLANO_ETAPA3_OTIMIZACOES.md` - Planejamento original da Etapa 3

---

## 🎓 Próximos Passos

Agora que **Etapa 3 está 100% estável**, podemos:

### Opção A: Etapa 4 - Testes E2E
- Cypress ou Playwright
- Fluxo completo: Login → Criar ticket → Enviar mensagem → Encerrar
- Cobertura de casos críticos

### Opção B: Etapa 4 - Monitoramento e Logs
- Sentry para error tracking
- Performance monitoring (Lighthouse)
- Analytics de uso

### Opção C: Etapa 4 - Acessibilidade
- WCAG 2.1 AA compliance
- Screen reader testing
- Keyboard navigation

### Opção D: Etapa 4 - Documentação para Equipe
- Guia de contribuição
- Padrões de código
- Troubleshooting comum

---

**Decisão pendente**: Aguardando escolha do próximo passo! 🎯
