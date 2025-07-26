# Correção do Comportamento dos Campos Numéricos - Modal Nova Conta a Pagar

## 🐛 **PROBLEMA IDENTIFICADO**

### **Sintoma:**

No modal de Nova Conta a Pagar, quando o usuário tentava apagar valores dos campos numéricos (Valor Original, Valor de Desconto), o valor automaticamente voltava para "0", impedindo a digitação fluida.

### **Comportamento Problemático:**

1. ✅ Usuário clica no campo
2. ❌ Usuário seleciona o texto e aperta DELETE
3. ❌ Campo volta automaticamente para "0"
4. ❌ Usuário precisa selecionar novamente para digitar

### **Causa Raiz:**

```typescript
// ANTES - Problemático
onChange={(e) => handleInputChange('valorOriginal', parseFloat(e.target.value) || 0)}
```

**Análise:**

- `parseFloat('')` retorna `NaN`
- `NaN || 0` resulta em `0`
- Campo sempre volta para 0 quando vazio

## 🔧 **SOLUÇÃO IMPLEMENTADA**

### **1. Novo Handler para Campos Numéricos**

```typescript
// Handler específico para campos numéricos que permite valores vazios
const handleNumericChange = (campo: keyof NovaContaPagar, value: string) => {
  if (value === "") {
    // Permitir campo vazio durante a edição
    setFormData((prev) => ({
      ...prev,
      [campo]: "" as any,
    }));
  } else {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setFormData((prev) => ({
        ...prev,
        [campo]: numericValue,
      }));
    }
  }

  // Limpar erro do campo
  if (errors[campo]) {
    setErrors((prev) => ({
      ...prev,
      [campo]: "",
    }));
  }
};
```

### **2. Handler para Campos Inteiros**

```typescript
// Handler específico para campos inteiros
const handleIntegerChange = (
  campo: keyof NovaContaPagar,
  value: string,
  defaultValue: number = 1
) => {
  if (value === "") {
    setFormData((prev) => ({
      ...prev,
      [campo]: defaultValue as any,
    }));
  } else {
    const intValue = parseInt(value);
    if (!isNaN(intValue) && intValue > 0) {
      setFormData((prev) => ({
        ...prev,
        [campo]: intValue,
      }));
    }
  }
  // ... limpar erros
};
```

### **3. Atualização dos Inputs**

**ANTES:**

```typescript
<input
  type="number"
  value={formData.valorOriginal}
  onChange={(e) =>
    handleInputChange("valorOriginal", parseFloat(e.target.value) || 0)
  }
/>
```

**DEPOIS:**

```typescript
<input
  type="number"
  value={formData.valorOriginal === 0 ? "" : formData.valorOriginal}
  onChange={(e) => handleNumericChange("valorOriginal", e.target.value)}
/>
```

### **4. Ajustes nas Validações**

**ANTES:**

```typescript
if (formData.valorOriginal <= 0) {
  novosErros.valorOriginal = "Valor deve ser maior que zero";
}
```

**DEPOIS:**

```typescript
if (!formData.valorOriginal || Number(formData.valorOriginal) <= 0) {
  novosErros.valorOriginal = "Valor deve ser maior que zero";
}

const valorOriginalNum = Number(formData.valorOriginal) || 0;
const valorDescontoNum = Number(formData.valorDesconto) || 0;
```

### **5. Cálculo do Valor Total Ajustado**

**ANTES:**

```typescript
value={`R$ ${(formData.valorOriginal - formData.valorDesconto).toFixed(2)}`}
```

**DEPOIS:**

```typescript
value={`R$ ${((Number(formData.valorOriginal) || 0) - (Number(formData.valorDesconto) || 0)).toFixed(2)}`}
```

## ✅ **CAMPOS CORRIGIDOS**

1. **Valor Original** - Permite apagar e digitar livremente
2. **Valor de Desconto** - Permite apagar e digitar livremente
3. **Número de Parcelas** - Usa handler específico para inteiros
4. **Valor Total** - Cálculo robusto com valores vazios

## 🎯 **RESULTADO ESPERADO**

### **Novo Comportamento:**

1. ✅ Usuário clica no campo
2. ✅ Usuário seleciona o texto e aperta DELETE
3. ✅ Campo fica vazio (não volta para "0")
4. ✅ Usuário digita diretamente o novo valor
5. ✅ Validação só ocorre no blur/submit

### **Experiência Melhorada:**

- **Digitação Fluida**: Sem interrupções durante a edição
- **Comportamento Intuitivo**: Como esperado em qualquer input numérico
- **Validação Adequada**: Ainda mantém as validações necessárias
- **Cálculo Dinâmico**: Valor total atualiza corretamente

## 🔍 **TESTES RECOMENDADOS**

1. **Teste de Limpeza**: Apagar valores e verificar se ficam vazios
2. **Teste de Digitação**: Digitar valores novos sem seleção prévia
3. **Teste de Validação**: Submeter com campos vazios e ver erros apropriados
4. **Teste de Cálculo**: Verificar se valor total atualiza corretamente
5. **Teste de Edição**: Editar conta existente e verificar valores carregados

---

**Data da Correção:** 25/07/2025  
**Status:** ✅ Resolvido  
**Componente:** `ModalContaPagarNovo.tsx`  
**Impacto:** Alto - UX crítica para entrada de dados financeiros
