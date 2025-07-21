# Componente SelectField - Guia de Uso

## Visão Geral

O componente `SelectField` foi criado para resolver problemas de visibilidade de texto em campos de seleção (select), onde o texto aparecia com a mesma cor do fundo, dificultando a leitura.

## Características

- ✅ **Texto sempre visível**: Cor de texto definida como `text-gray-900` sobre fundo branco
- ✅ **Ícone de dropdown personalizado**: Usa `ChevronDown` do Lucide React
- ✅ **Estados visuais claros**: Bordas vermelhas para erro, azuis para foco
- ✅ **Aparência consistente**: Remove a aparência padrão do navegador
- ✅ **Placeholder configurável**: Opção padrão "Selecione..." customizável
- ✅ **ForwardRef**: Compatível com react-hook-form

## Importação

```tsx
import { SelectField } from '../components/common/SelectField';
```

## Interface

```tsx
interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'ref'> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}
```

## Uso Básico

### 1. Com react-hook-form

```tsx
import { SelectField } from '../components/common/SelectField';

const MyComponent = () => {
  const { register, formState: { errors } } = useForm();

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'descontinuado', label: 'Descontinuado' }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Status *
      </label>
      <SelectField
        {...register('status')}
        options={statusOptions}
        error={!!errors.status}
      />
      {errors.status && (
        <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
      )}
    </div>
  );
};
```

### 2. Com estado local

```tsx
const [selectedValue, setSelectedValue] = useState('');

const categorias = [
  { value: 'categoria1', label: 'Categoria 1' },
  { value: 'categoria2', label: 'Categoria 2' }
];

return (
  <SelectField
    value={selectedValue}
    onChange={(e) => setSelectedValue(e.target.value)}
    options={categorias}
    placeholder="Escolha uma categoria..."
  />
);
```

### 3. Opções dinâmicas

```tsx
const modulosDisponiveis = ['Módulo A', 'Módulo B', 'Módulo C'];
const modulosSelecionados = ['Módulo A'];

return (
  <SelectField
    value={moduloInput}
    onChange={(e) => setModuloInput(e.target.value)}
    options={modulosDisponiveis
      .filter(modulo => !modulosSelecionados.includes(modulo))
      .map(modulo => ({ value: modulo, label: modulo }))}
    placeholder="Selecione um módulo..."
    className="flex-1"
  />
);
```

## Propriedades

| Prop | Tipo | Padrão | Descrição |
|------|------|---------|-----------|
| `options` | `SelectOption[]` | **obrigatório** | Array de opções para o select |
| `placeholder` | `string` | `"Selecione..."` | Texto do placeholder |
| `error` | `boolean` | `false` | Define se o campo tem erro (borda vermelha) |
| `className` | `string` | `''` | Classes CSS adicionais |

## Estados Visuais

### Normal
```tsx
<SelectField
  options={options}
  placeholder="Selecione uma opção..."
/>
```

### Com Erro
```tsx
<SelectField
  options={options}
  error={true}
  placeholder="Campo obrigatório"
/>
```

### Personalizado
```tsx
<SelectField
  options={options}
  className="flex-1 bg-gray-50"
  placeholder="Opção personalizada..."
/>
```

## Estilos CSS Aplicados

```css
.select-field {
  /* Layout */
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.5rem;
  
  /* Aparência */
  background-color: white;
  color: #111827; /* text-gray-900 */
  appearance: none;
  cursor: pointer;
  
  /* Transições */
  transition: colors 200ms;
  
  /* Estados */
  &:focus {
    outline: none;
    border-color: #3b82f6; /* focus:border-blue-500 */
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* focus:ring-2 focus:ring-blue-500 */
  }
  
  &.error {
    border-color: #fca5a5; /* border-red-300 */
  }
}

.select-options {
  color: #111827; /* text-gray-900 */
  background-color: white;
}
```

## Migração de select HTML para SelectField

### Antes (problemático)
```tsx
<select
  {...register('categoria')}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    errors.categoria ? 'border-red-300' : 'border-gray-300'
  }`}
>
  <option value="">Selecione...</option>
  {categorias.map(cat => (
    <option key={cat.value} value={cat.value}>{cat.label}</option>
  ))}
</select>
```

### Depois (corrigido)
```tsx
<SelectField
  {...register('categoria')}
  options={categorias}
  placeholder="Selecione..."
  error={!!errors.categoria}
/>
```

## Benefícios da Migração

1. **Visibilidade garantida**: Texto sempre legível com cor adequada
2. **Menos código**: Não precisa mapear options manualmente
3. **Consistência**: Aparência uniforme em todos os navegadores
4. **Manutenibilidade**: Mudanças de estilo centralizadas
5. **Acessibilidade**: Melhor contraste e navegação por teclado

## Problemas Resolvidos

- ❌ **Texto invisível**: Cor do texto igual ao fundo
- ❌ **Inconsistência visual**: Aparência diferente entre navegadores
- ❌ **Código repetitivo**: Mapeamento manual de options
- ❌ **Falta de feedback visual**: Estados não claros

## Recomendações

1. **Use sempre** `SelectField` em novos modais
2. **Migre gradualmente** selects antigos conforme necessário
3. **Mantenha opções simples**: `{ value, label }` apenas
4. **Combine com validação**: Use com react-hook-form para melhor UX
5. **Teste em diferentes navegadores**: Garanta consistência visual

## Arquivo de Localização

```
src/components/common/SelectField.tsx
```

Este componente está pronto para uso em todos os modais futuros e resolve definitivamente o problema de visibilidade dos campos de seleção.
