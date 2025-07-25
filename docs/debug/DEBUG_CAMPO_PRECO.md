# Debug: Campo Preço Unitário Não Digitável

## 🚨 Problema Relatado

**Sintoma**: Não é possível digitar no campo "Preço Unitário" do modal "Novo Produto"

**Status**: Investigando e aplicando correções

## 🔍 Investigação Realizada

### 1. Verificação do Código Original
- ✅ Hook `useCurrencyFormat` implementado
- ✅ Input configurado corretamente com `onChange`
- ❓ Possível problema na lógica de formatação complexa

### 2. Possíveis Causas Identificadas

#### A) **Lógica de Formatação Muito Complexa**
```typescript
// Problema: Muito processamento durante digitação
const handleChange = useCallback((event) => {
  const inputValue = event.target.value;
  const formatted = formatDuringTyping(inputValue);
  const parsed = parseFromBRL(formatted);
  setNumericValue(parsed);
}, [parseFromBRL, formatDuringTyping]);
```

#### B) **Conflito de Estados**
- Hook `useCurrencyFormat` com estado interno
- React Hook Form com seu próprio estado
- Possível race condition entre os dois

#### C) **Validação Bloqueando Input**
- Yup schema muito restritivo
- Transform que pode estar causando loops

## ✅ Correções Aplicadas

### 1. Hook Simplificado Criado
```typescript
// useSimpleCurrency.ts - Versão debug
export const useSimpleCurrency = (initialValue = 0) => {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback((event) => {
    const inputValue = event.target.value;
    const digits = inputValue.replace(/\D/g, '');
    
    if (!digits) {
      setValue(0);
      return;
    }
    
    const numericValue = parseInt(digits) / 100;
    setValue(numericValue);
  }, []);
  
  // Formatação mais simples
  const displayValue = formatValue(value);
  
  return { value, displayValue, handleChange, setValue };
};
```

### 2. Modal Atualizado
```tsx
// Substituição temporária para debug
import { useSimpleCurrency } from '../hooks/useSimpleCurrency';

const preco = useSimpleCurrency(0);

<input
  value={preco.displayValue}
  onChange={(e) => {
    console.log('Input onChange:', e.target.value);
    preco.handleChange(e);
    console.log('Valor numérico:', preco.value);
  }}
/>
```

### 3. Logs de Debug Adicionados
- ✅ Console.log no onChange
- ✅ Console.log do valor numérico
- ✅ Console.log do displayValue

## 🧪 Como Testar Agora

1. **Abrir aplicação**: http://localhost:3900
2. **Abrir Console do navegador** (F12)
3. **Ir para Produtos** → "Novo Produto"
4. **Tentar digitar no campo Preço**
5. **Verificar logs no console**:
   - `Input recebido: [valor]`
   - `Dígitos extraídos: [números]`
   - `Valor numérico calculado: [resultado]`
   - `Display value: [formatado]`

## 🎯 Resultados Esperados

### Se Funcionar:
- ✅ Console mostra logs de digitação
- ✅ Campo aceita números
- ✅ Formatação R$ automática
- ✅ Validação funciona

### Se Não Funcionar:
- ❌ Console não mostra logs
- ❌ Possível problema mais profundo:
  - CSS impedindo cliques
  - JavaScript com erro
  - React com bug de renderização

## 🔄 Próximos Passos

### Se Hook Simplificado Funcionar:
1. Refinar a formatação
2. Melhorar a experiência
3. Aplicar em outros campos

### Se Ainda Não Funcionar:
1. Verificar CSS `pointer-events`
2. Checar se há overlay invisível
3. Verificar erros JavaScript
4. Testar input básico HTML

---

**Status**: 🔄 Testando hook simplificado  
**Última atualização**: 20 de julho de 2025
