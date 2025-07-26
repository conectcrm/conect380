# Correção do Erro 400 - Oportunidades Métricas

## 🐛 **PROBLEMA IDENTIFICADO**

### **Erro Original:**

```
GET http://localhost:3001/oportunidades/metricas?queryKey=metrics&signal=%5Bobject+AbortSignal%5D 400 (Bad Request)
```

### **Causa Raiz:**

O React Query v3 automaticamente passa metadados extras (`queryKey`, `signal`) como parâmetros da query function, que o backend estava rejeitando como parâmetros inválidos.

## 🔧 **SOLUÇÃO IMPLEMENTADA**

### **1. Correção no Service (opportunitiesService.ts)**

**ANTES:**

```typescript
async getMetrics(filters?: { dataInicio?: string; dataFim?: string }): Promise<PipelineMetrics> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
  }

  const response = await api.get(`/oportunidades/metricas?${params.toString()}`);
  return response.data;
}
```

**DEPOIS:**

```typescript
async getMetrics(params?: any): Promise<PipelineMetrics> {
  try {
    // Filtrar metadados do React Query (queryKey, signal)
    let filters: { dataInicio?: string; dataFim?: string } | undefined;

    if (params && typeof params === 'object' && !params.queryKey && !params.signal) {
      filters = params;
    }

    let url = '/oportunidades/metricas';

    if (filters && Object.keys(filters).length > 0) {
      const urlParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.append(key, String(value));
        }
      });

      const queryString = urlParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    console.log('Fazendo requisição para:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    throw error;
  }
}
```

### **2. Correção no Componente (FunilVendas.jsx)**

**ANTES:**

```javascript
const {
  data: metrics,
  isLoading: loadingMetrics,
  error: metricsError,
} = useQuery(
  "metrics",
  opportunitiesService.getMetrics, // ❌ Referência direta
  {
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
  }
);
```

**DEPOIS:**

```javascript
const {
  data: metrics,
  isLoading: loadingMetrics,
  error: metricsError,
} = useQuery(
  "metrics",
  () => opportunitiesService.getMetrics(), // ✅ Arrow function wrapper
  {
    refetchInterval: 30000,
    retry: 3,
    retryDelay: 1000,
  }
);
```

## 📋 **DETALHES TÉCNICOS**

### **Por que aconteceu?**

1. **React Query v3 Behavior**: O React Query passa automaticamente metadados (`queryKey`, `signal`) para a query function
2. **Backend Validation**: O backend NestJS estava rejeitando parâmetros não esperados com erro 400
3. **URL Malformada**: A URL resultante ficava: `/oportunidades/metricas?queryKey=metrics&signal=[object AbortSignal]`

### **Estratégias de Correção:**

1. **Filtro de Parâmetros**: Detectar e ignorar metadados do React Query
2. **Wrapper Function**: Usar arrow function para controlar parâmetros passados
3. **URL Building**: Construir URL limpa apenas com filtros válidos
4. **Error Handling**: Adicionar logs para debug

## ✅ **RESULTADO**

### **Antes da Correção:**

- ❌ Erro 400 constante
- ❌ Métricas não carregavam
- ❌ Console spam com erros
- ❌ Retry infinito

### **Após a Correção:**

- ✅ Requisições limpa: `/oportunidades/metricas`
- ✅ Métricas carregam corretamente
- ✅ Sem erros no console
- ✅ Performance melhorada

## 🔄 **APLICAÇÃO EM OUTROS SERVIÇOS**

Esta correção deve ser aplicada em outros serviços que usam React Query:

```typescript
// ❌ Evitar - referência direta
useQuery("key", service.method);

// ✅ Usar - wrapper function
useQuery("key", () => service.method());

// ✅ Ou com parâmetros específicos
useQuery("key", () => service.method(specificParams));
```

## 🎯 **LIÇÕES APRENDIDAS**

1. **React Query Metadados**: Sempre considerar que o React Query passa metadados extras
2. **Backend Validation**: Validações rígidas podem quebrar integrações
3. **URL Construction**: Construir URLs de forma defensiva
4. **Error Logging**: Logs detalhados ajudam no debug
5. **Wrapper Functions**: Usar wrappers para controlar parâmetros

---

**Data da Correção:** 25/07/2025  
**Status:** ✅ Resolvido  
**Impacto:** Alto - Funcionalidade crítica do sistema
