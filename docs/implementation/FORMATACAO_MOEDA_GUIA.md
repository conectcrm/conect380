# Guia de Formatação de Moeda no FenixCRM

## 📋 Visão Geral

O FenixCRM implementa formatação automática de moeda brasileira (R$) seguindo os padrões dos CRMs mais conceituados do mercado. A formatação inclui:

- **Separador de milhares**: ponto (.)
- **Separador decimal**: vírgula (,)  
- **Símbolo**: R$ (Real brasileiro)
- **Formato padrão**: R$ 1.234,56

## 🛠️ Componentes Disponíveis

### 1. Hook `useCurrencyFormat`

Hook principal para formatação de valores monetários:

```typescript
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

const currency = useCurrencyFormat({
  initialValue: 0,
  showSymbol: true,      // Exibe R$
  allowNegative: false,  // Permite valores negativos
  maxDigits: 12          // Máximo de dígitos
});

// Valores disponíveis:
// currency.displayValue  → "R$ 1.234,56" (para exibição)
// currency.numericValue  → 1234.56 (para cálculos)
// currency.formattedValue → "R$ 1.234,56" (formatado)
```

### 2. Componente `MoneyInput`

Input reutilizável com formatação automática:

```tsx
import { MoneyInput } from '../components/common/MoneyInput';

<MoneyInput
  value={valor}
  onChange={(numericValue, formattedValue) => setValor(numericValue)}
  label="Valor da Proposta"
  required={true}
  showSymbol={true}
  placeholder="R$ 0,00"
  error={!!errors.valor}
  errorMessage={errors.valor?.message}
/>
```

### 3. Integração com React Hook Form

Para formulários com validação:

```tsx
import { Controller } from 'react-hook-form';
import { MoneyInput } from '../components/common/MoneyInput';

<Controller
  name="valor"
  control={control}
  render={({ field: { value, onChange } }) => (
    <MoneyInput
      value={value}
      onChange={(numericValue) => onChange(numericValue)}
      error={!!errors.valor}
      errorMessage={errors.valor?.message}
    />
  )}
/>
```

## 📝 Aplicação nas Páginas

### ✅ Já Implementado

1. **Modal de Cadastro de Produtos** (`ModalCadastroProduto.tsx`)
   - Campo: `precoUnitario`
   - Formatação: R$ automática durante digitação
   - Validação: Yup com transform para NaN

2. **Modal de Propostas** (`ModalProposta.tsx`)
   - Campo: `valor`
   - Formatação: Completa com Controller
   - Validação: Número obrigatório > 0

### 🚧 Próximas Implementações

3. **Página Financeiro - Contas a Receber** (`ContasReceberPage.tsx`)
   - Campos: `valor`, `valorPago`
   - Status: Pendente

4. **Página Produtos** (`ProdutosPageNew.tsx`)
   - Campos: `preco`, `custoUnitario`
   - Status: Usando formatCurrency apenas para exibição

5. **Fluxo de Caixa** (`FluxoCaixa.tsx`)
   - Campos: Valores de entrada/saída
   - Status: Valores estáticos, needs dynamic inputs

## 🔧 Padrões de Validação

### Schema Yup para Moeda

```typescript
import * as yup from 'yup';

const schema = yup.object({
  valor: yup
    .number()
    .transform((value, originalValue) => {
      // Trata string vazia como undefined
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      // Converte NaN para undefined
      if (isNaN(value)) {
        return undefined;
      }
      return value;
    })
    .required('Valor é obrigatório')
    .min(0.01, 'Valor deve ser maior que zero')
});
```

### Configuração React Hook Form

```typescript
// Para campos de moeda, sempre usar Controller ao invés de register direto
const preco = useCurrencyFormat({
  initialValue: 0,
  showSymbol: true
});

// No onChange do input
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  preco.handleChange(event);
};

// No onBlur para sincronizar com form
const handleBlur = () => {
  setValue('precoUnitario', preco.numericValue, { shouldValidate: true });
};
```

## 🎯 Benefícios da Implementação

### Para Usuários
- ✅ **Experiência familiar**: Formato brasileiro padrão
- ✅ **Digitação intuitiva**: Formatação automática
- ✅ **Validação em tempo real**: Feedback imediato
- ✅ **Acessibilidade**: Labels e mensagens de erro claras

### Para Desenvolvedores
- ✅ **Componentes reutilizáveis**: MoneyInput, useCurrencyFormat
- ✅ **Tipagem TypeScript**: Validação em tempo de desenvolvimento
- ✅ **Integração fácil**: React Hook Form + Yup
- ✅ **Manutenção simples**: Lógica centralizada

## 📊 Exemplos de Uso

### Caso 1: Modal de Produtos

```tsx
// Antes (com erro NaN)
<input
  {...register('precoUnitario', { valueAsNumber: true })}
  type="number"
  step="0.01"
/>

// Depois (com formatação)
<input
  type="text"
  value={preco.displayValue}
  onChange={preco.handleChange}
  onBlur={() => setValue('precoUnitario', preco.numericValue, { shouldValidate: true })}
  placeholder="R$ 0,00"
  className="text-right"
/>
```

### Caso 2: Página de Propostas

```tsx
// Campo valor com Controller
<Controller
  name="valor"
  control={control}
  render={({ field: { value, onChange } }) => (
    <MoneyInput
      value={value}
      onChange={(numericValue) => onChange(numericValue)}
      label="Valor da Proposta"
      required={true}
      error={!!errors.valor}
      errorMessage={errors.valor?.message}
    />
  )}
/>
```

## 🚀 Roadmap de Implementação

### Fase 1: ✅ Concluída
- [x] Hook `useCurrencyFormat`
- [x] Componente `MoneyInput`
- [x] Modal de Produtos
- [x] Modal de Propostas

### Fase 2: 🎯 Em Andamento
- [ ] Página Contas a Receber
- [ ] Página Produtos (inputs editáveis)
- [ ] Fluxo de Caixa (inputs dinâmicos)

### Fase 3: 📋 Planejada
- [ ] Relatórios financeiros
- [ ] Dashboard (métricas editáveis)
- [ ] Configurações de moeda
- [ ] Múltiplas moedas (futuro)

## 🔍 Debugging e Troubleshooting

### Problema: NaN em campos numéricos
**Solução**: Usar transform no Yup + setValueAs no register

### Problema: Formatação não aparece
**Solução**: Verificar se está usando displayValue no input

### Problema: Validação não funciona
**Solução**: Usar setValue com shouldValidate: true

### Problema: Performance lenta
**Solução**: Debounce na formatação (se necessário)

## 💡 Dicas de Implementação

1. **Sempre use `text` input** para campos formatados
2. **Alinhe à direita** com `text-right` para valores
3. **Use Controller** para React Hook Form
4. **Transform no Yup** para lidar com NaN
5. **Placeholder descritivo** com formato brasileiro

---

**Última atualização**: Janeiro 2025  
**Responsável**: Equipe Frontend FenixCRM
