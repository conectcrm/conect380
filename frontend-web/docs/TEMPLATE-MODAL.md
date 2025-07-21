# 🚀 Template de Modal - Fênix CRM

## 📁 Arquivo de Template

Use este template como ponto de partida para criar novos modais no sistema.

```tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  BaseModal,
  ThreeColumnLayout,
  FormField,
  BaseInput,
  BaseSelect,
  BaseTextarea,
  BaseButton,
  ModalFooter,
  StatusPanel,
  StatusBadge
} from '@/components/base';
import { Save, X } from 'lucide-react';

// 1. DEFINIR TIPOS
interface MeuFormData {
  campo1: string;
  campo2: string;
  campo3?: string;
  // ... outros campos
}

interface MeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MeuFormData) => void;
  data?: MeuFormData | null;
  isLoading?: boolean;
}

// 2. SCHEMA DE VALIDAÇÃO
const schema = yup.object({
  campo1: yup
    .string()
    .required('Campo 1 é obrigatório')
    .min(3, 'Mínimo 3 caracteres'),
    
  campo2: yup
    .string()
    .required('Campo 2 é obrigatório')
    .email('Email inválido'), // exemplo para email
    
  campo3: yup
    .string()
    .optional(),
    
  // ... outras validações
});

// 3. COMPONENTE PRINCIPAL
export const MeuModal: React.FC<MeuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  data,
  isLoading = false
}) => {
  // 4. SETUP DO FORMULÁRIO
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue
  } = useForm<MeuFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: {
      campo1: '',
      campo2: '',
      campo3: '',
      // ... valores padrão
    }
  });

  // 5. EFEITOS
  useEffect(() => {
    if (isOpen) {
      if (data) {
        // Modo edição
        reset(data);
      } else {
        // Modo criação
        reset({
          campo1: '',
          campo2: '',
          campo3: '',
        });
      }
    }
  }, [data, reset, isOpen]);

  // 6. HANDLERS
  const onSubmit = (formData: MeuFormData) => {
    onSave(formData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // 7. RENDER
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={data ? 'Editar Registro' : 'Novo Registro'}
      subtitle="Preencha as informações abaixo"
      maxWidth="4xl" // Ajustar conforme necessário
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ThreeColumnLayout
          leftTitle="Dados Básicos"
          centerTitle="Informações Complementares"
          rightTitle="Observações"
          
          leftColumn={
            <div className="space-y-4">
              <FormField
                label="Campo 1"
                error={errors.campo1?.message}
                required
                hint="Dica sobre o campo 1"
              >
                <BaseInput
                  {...register('campo1')}
                  placeholder="Digite o valor..."
                  error={!!errors.campo1}
                />
              </FormField>

              <FormField
                label="Campo 2"
                error={errors.campo2?.message}
                required
              >
                <BaseInput
                  {...register('campo2')}
                  type="email"
                  placeholder="exemplo@email.com"
                  error={!!errors.campo2}
                />
              </FormField>

              {/* Exemplo de Select */}
              <FormField
                label="Tipo"
                error={errors.tipo?.message}
              >
                <BaseSelect
                  {...register('tipo')}
                  error={!!errors.tipo}
                  options={[
                    { value: 'tipo1', label: 'Tipo 1' },
                    { value: 'tipo2', label: 'Tipo 2' },
                  ]}
                  placeholder="Selecione o tipo..."
                />
              </FormField>
            </div>
          }
          
          centerColumn={
            <div className="space-y-4">
              <FormField
                label="Campo 3"
                error={errors.campo3?.message}
              >
                <BaseInput
                  {...register('campo3')}
                  placeholder="Opcional..."
                  error={!!errors.campo3}
                />
              </FormField>

              {/* Adicionar mais campos conforme necessário */}
            </div>
          }
          
          rightColumn={
            <div className="space-y-4">
              <FormField
                label="Observações"
                error={errors.observacoes?.message}
              >
                <BaseTextarea
                  {...register('observacoes')}
                  rows={4}
                  placeholder="Informações adicionais..."
                  error={!!errors.observacoes}
                />
              </FormField>

              {/* Status Panel (opcional) */}
              <StatusPanel title="Status">
                <div className="space-y-2">
                  <StatusBadge
                    status={data ? 'active' : 'pending'}
                    text={data ? 'Existente' : 'Novo'}
                  />
                  
                  {data && (
                    <div className="text-xs text-gray-500">
                      Última atualização: {new Date().toLocaleDateString()}
                    </div>
                  )}
                </div>
              </StatusPanel>
            </div>
          }
        />

        <ModalFooter>
          <BaseButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            icon={<X />}
          >
            Cancelar
          </BaseButton>
          
          <BaseButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!isValid}
            icon={<Save />}
          >
            {data ? 'Atualizar' : 'Salvar'}
          </BaseButton>
        </ModalFooter>
      </form>
    </BaseModal>
  );
};
```

## 📝 Instruções de Uso

### 1. Copiar o Template
1. Copie o código acima
2. Renomeie para seu modal específico (ex: `ModalCadastroProduto.tsx`)
3. Substitua todos os `Meu` por nomes específicos

### 2. Personalizar Tipos
```tsx
interface ProdutoFormData {
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
}
```

### 3. Ajustar Validação
```tsx
const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório'),
  preco: yup.number().required('Preço é obrigatório').min(0, 'Preço deve ser positivo'),
  categoria: yup.string().required('Categoria é obrigatória'),
});
```

### 4. Configurar Campos
- Ajustar campos de acordo com seu formulário
- Remover colunas desnecessárias (pode usar 1 ou 2 colunas)
- Adicionar validações específicas

### 5. Layout Alternativo (1 coluna)
```tsx
<div className="p-6 space-y-6">
  <ModalSection title="Informações Básicas">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Campos */}
    </div>
  </ModalSection>
</div>
```

## 🔧 Variações Comuns

### Modal Simples (1 coluna)
- Remover `ThreeColumnLayout`
- Usar `ModalSection` para organizar
- Ideal para formulários pequenos

### Modal com Tabs
- Adicionar estado para tab ativa
- Usar condicional para mostrar conteúdo
- Baseado no padrão do modal de clientes

### Modal com Busca Externa
- Adicionar `useEffect` para APIs
- Implementar debounce para performance
- Exemplo: busca de CEP, validação de CNPJ

### Modal Read-Only
- Desabilitar todos os campos
- Remover botão de salvar
- Adicionar botão de editar

## 📚 Próximos Passos

1. **Teste o Template**: Implemente um modal simples primeiro
2. **Customize**: Ajuste para suas necessidades específicas  
3. **Valide**: Teste validações e responsividade
4. **Documente**: Adicione comentários específicos do seu caso

---

**💡 Lembre-se**: Este template segue todos os padrões estabelecidos no `PADRAO-MODAIS.md`. Para casos específicos, consulte o `ModalCadastroCliente.tsx` como referência completa.
