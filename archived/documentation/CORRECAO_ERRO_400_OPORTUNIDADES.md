# Correção de Erro 400 - Sistema de Oportunidades

## Problema Identificado

O usuário relatou que ao criar oportunidades, recebia simultaneamente:
- ✅ Toast verde: "Oportunidade criada com sucesso!"
- ❌ Toast vermelho: "Request failed with status code 400"

Adicionalmente, aparecia o erro no console:
```
GET http://localhost:3001/oportunidades/:1 Failed to load resource: the server responded with a status of 400 (Bad Request)
```

## Análise da Causa Raiz

O problema estava relacionado ao **recarregamento desnecessário** após a criação de oportunidades:

### Fluxo Problemático:
1. **Usuário cria oportunidade** através do modal
2. **Modal chama `criarOportunidade`** (hook que já adiciona a oportunidade no estado local)
3. **Modal chama `onSuccess()`** 
4. **`onSuccess()` executava `carregarOportunidades(false)`** (nova requisição para buscar todas as oportunidades)
5. **Durante esse recarregamento, o React Query fazia invalidações automáticas** 
6. **Essas invalidações ocasionalmente geravam requisições com IDs malformados** (como `:1`)

### Código Problemático:

No arquivo `frontend-web/src/features/oportunidades/OportunidadesPage.tsx`:

```tsx
// ANTES - Problemático
<ModalOportunidadeAvancado
  isOpen={mostrarNovaOportunidade}
  onClose={() => setMostrarNovaOportunidade(false)}
  onSuccess={() => {
    carregarOportunidades(false); // ❌ Recarregamento desnecessário
    setMostrarNovaOportunidade(false);
  }}
/>
```

## Solução Implementada

### 1. Removido Recarregamento Desnecessário

Removemos as chamadas para `carregarOportunidades(false)` no callback `onSuccess` dos modais, pois:

- O hook `useOportunidades` já **adiciona automaticamente** a nova oportunidade no estado local
- O hook `useOportunidades` já **atualiza automaticamente** oportunidades editadas no estado local
- **Não há necessidade de recarregar** todos os dados do servidor

### 2. Código Corrigido:

```tsx
// DEPOIS - Corrigido
<ModalOportunidadeAvancado
  isOpen={mostrarNovaOportunidade}
  onClose={() => setMostrarNovaOportunidade(false)}
  onSuccess={() => {
    // ✅ Não recarrega as oportunidades pois o hook já adiciona no estado local
    setMostrarNovaOportunidade(false);
  }}
/>

{oportunidadeSelecionada && (
  <ModalOportunidadeAvancado
    oportunidade={oportunidadeSelecionada}
    isOpen={!!oportunidadeSelecionada}
    onClose={() => setOportunidadeSelecionada(null)}
    onSuccess={() => {
      // ✅ Não recarrega as oportunidades pois o hook já atualiza no estado local
      setOportunidadeSelecionada(null);
    }}
  />
)}
```

## Benefícios da Correção

### ✅ Performance Melhorada
- **Eliminou requisições desnecessárias** ao servidor
- **Redução significativa de tráfego de rede**
- **Interface mais responsiva** (sem delay de recarregamento)

### ✅ UX Melhorada
- **Apenas toast verde** de sucesso é exibido
- **Sem mais toasts vermelhos** de erro 400
- **Atualização instantânea** da lista de oportunidades

### ✅ Estabilidade do Sistema
- **Eliminação dos erros 400** relacionados às invalidações
- **Menos carga no backend**
- **Comportamento mais previsível**

## Validação da Correção

### Testes Realizados:
1. ✅ **Criação de oportunidade**: Apenas toast verde, sem erros 400
2. ✅ **Edição de oportunidade**: Atualização imediata, sem recarregamentos
3. ✅ **Lista de oportunidades**: Atualizada automaticamente no estado local
4. ✅ **Logs do backend**: Sem requisições com IDs malformados

### Endpoints Testados:
- ✅ `GET /oportunidades/:id` com ID válido: Status 200
- ✅ `GET /oportunidades/:1` com ID inválido: Status 400 (esperado, mas não chamado automaticamente)
- ✅ `GET /oportunidades/metricas`: Funcionando com DTO de validação

## Arquivos Modificados

### 1. `frontend-web/src/features/oportunidades/OportunidadesPage.tsx`
- **Linha ~307-309**: Removido `carregarOportunidades(false)` do callback de nova oportunidade
- **Linha ~316-318**: Removido `carregarOportunidades(false)` do callback de edição de oportunidade

### 2. Mantidas as Correções Anteriores:
- `backend/src/modules/oportunidades/dto/oportunidade.dto.ts`: MetricasQueryDto para validação
- `backend/src/modules/oportunidades/oportunidades.controller.ts`: Uso do DTO no endpoint `/metricas`

## Comportamento Esperado (Pós-Correção)

### Criar Nova Oportunidade:
1. Usuário preenche e salva oportunidade
2. Requisição POST é enviada ao backend
3. Backend retorna a oportunidade criada
4. Hook adiciona a oportunidade no estado local
5. Toast verde "Oportunidade criada com sucesso!" é exibido
6. Modal é fechado
7. **Lista é atualizada instantaneamente** (sem requisições extras)

### Editar Oportunidade:
1. Usuário edita e salva oportunidade
2. Requisição PATCH é enviada ao backend  
3. Backend retorna a oportunidade atualizada
4. Hook atualiza a oportunidade no estado local
5. Toast verde de sucesso é exibido
6. Modal é fechado
7. **Lista reflete as mudanças instantaneamente**

## Conclusão

A correção resolveu completamente o problema dos erros 400 misturados com toasts de sucesso, melhorando significativamente a performance e experiência do usuário. O sistema agora opera de forma mais eficiente, fazendo apenas as requisições necessárias e mantendo o estado local sincronizado automaticamente.
