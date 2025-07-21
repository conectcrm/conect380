# 🎨 Padrão de Modais - Fênix CRM

## 📋 Visão Geral

Este documento define o padrão para criação de modais no sistema Fênix CRM, baseado no modal de cadastro de clientes que serve como referência de qualidade e consistência.

## 🏗️ Arquitetura dos Componentes Base

### 1. BaseModal
Componente principal para todos os modais do sistema.

```tsx
import { BaseModal } from '@/components/base';

<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Título do Modal"
  subtitle="Descrição opcional"
  maxWidth="4xl" // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl
>
  {/* Conteúdo do modal */}
</BaseModal>
```

### 2. Layouts Estruturais

#### ThreeColumnLayout
Layout em 3 colunas ideal para formulários complexos:

```tsx
import { ThreeColumnLayout } from '@/components/base';

<ThreeColumnLayout
  leftTitle="Dados Básicos"
  centerTitle="Endereço"  
  rightTitle="Observações"
  leftColumn={<FormularioDados />}
  centerColumn={<FormularioEndereco />}
  rightColumn={<FormularioObservacoes />}
/>
```

#### ModalSection
Para organizar seções dentro do modal:

```tsx
import { ModalSection } from '@/components/base';

<ModalSection
  title="Informações Pessoais"
  subtitle="Dados básicos do cliente"
  icon={<User />}
>
  {/* Campos do formulário */}
</ModalSection>
```

### 3. Componentes de Formulário

#### FormField
Wrapper padronizado para campos:

```tsx
import { FormField, BaseInput } from '@/components/base';

<FormField
  label="Nome completo"
  error={errors.nome?.message}
  required
  hint="Digite o nome completo do cliente"
>
  <BaseInput
    {...register('nome')}
    placeholder="Digite o nome..."
    error={!!errors.nome}
  />
</FormField>
```

#### Outros Componentes
- `BaseInput` - Input padronizado
- `BaseSelect` - Select padronizado  
- `BaseTextarea` - Textarea padronizado

### 4. Componentes de Ação

#### BaseButton
Botões padronizados:

```tsx
import { BaseButton } from '@/components/base';

<BaseButton
  variant="primary" // primary, secondary, danger, success, warning, ghost
  size="md" // sm, md, lg
  loading={isSubmitting}
  icon={<Save />}
>
  Salvar Cliente
</BaseButton>
```

#### StatusBadge
Para indicadores de status:

```tsx
import { StatusBadge } from '@/components/base';

<StatusBadge
  status="active" // active, inactive, pending, success, error, warning
  text="Ativo"
  size="md"
/>
```

## 🎯 Padrões de Implementação

### 1. Estrutura Recomendada para Modais

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  BaseModal,
  ThreeColumnLayout,
  FormField,
  BaseInput,
  BaseButton,
  ModalFooter
} from '@/components/base';

// Schema de validação
const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  // ... outros campos
});

interface MeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  data?: any;
  isLoading?: boolean;
}

export const MeuModal: React.FC<MeuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  data,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: data || {}
  });

  const onSubmit = (formData: any) => {
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Título do Modal"
      subtitle="Descrição do que o modal faz"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ThreeColumnLayout
          leftTitle="Seção 1"
          centerTitle="Seção 2"
          rightTitle="Seção 3"
          leftColumn={
            <div className="space-y-4">
              <FormField
                label="Campo 1"
                error={errors.campo1?.message}
                required
              >
                <BaseInput
                  {...register('campo1')}
                  placeholder="Digite..."
                  error={!!errors.campo1}
                />
              </FormField>
            </div>
          }
          centerColumn={
            <div className="space-y-4">
              {/* Campos da coluna central */}
            </div>
          }
          rightColumn={
            <div className="space-y-4">
              {/* Campos da coluna direita */}
            </div>
          }
        />

        <ModalFooter>
          <BaseButton
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!isValid}
          >
            Salvar
          </BaseButton>
        </ModalFooter>
      </form>
    </BaseModal>
  );
};
```

### 2. React Hook Form + Yup (Obrigatório)

Todos os modais devem usar:
- **React Hook Form** para gerenciamento de estado
- **Yup** para validação
- **Mode: onChange** para validação em tempo real
- **yupResolver** para integração

### 3. Validação Personalizada

```tsx
// Exemplo de validações customizadas
const validarCPF = (cpf: string): boolean => {
  // Implementação da validação de CPF
};

const schema = yup.object({
  documento: yup
    .string()
    .required('Documento é obrigatório')
    .test('cpf-valido', 'CPF inválido', validarCPF),
});
```

### 4. Integração com APIs Externas

```tsx
// Exemplo: Busca de CEP
const buscarCep = async (cep: string) => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (!data.erro) {
      setValue('cidade', data.localidade);
      setValue('estado', data.uf);
      setValue('bairro', data.bairro);
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
  }
};

useEffect(() => {
  const cep = watch('cep');
  if (cep && cep.length === 8) {
    buscarCep(cep);
  }
}, [watch('cep')]);
```

## 🎨 Design System - Cores e Estilos

### Cores Principais
- **Primary**: `#159A9C` (Teal do Fênix)
- **Primary Hover**: `#137B7D`
- **Background Gradient**: `from-[#159A9C] to-[#1BB5B8]`
- **Success**: `#10B981`
- **Error**: `#EF4444`
- **Warning**: `#F59E0B`

### Espaçamentos
- **Padding Modal**: `p-6`
- **Gaps**: `gap-4` ou `gap-6`
- **Spacing**: `space-y-4` ou `space-y-6`

### Tipografia
- **Título Modal**: `text-xl font-bold`
- **Subtítulo**: `text-sm`
- **Labels**: `text-sm font-medium`
- **Texto de Erro**: `text-sm text-red-600`

## ✅ Checklist para Novos Modais

### Obrigatório
- [ ] Usar `BaseModal` como container principal
- [ ] Implementar React Hook Form + Yup
- [ ] Validação em tempo real (`mode: 'onChange'`)
- [ ] Usar componentes base (`FormField`, `BaseInput`, etc.)
- [ ] Botão submit desabilitado até validação completa
- [ ] Loading states nos botões
- [ ] Responsividade (mobile-first)
- [ ] Acessibilidade (ESC para fechar, foco, etc.)

### Recomendado
- [ ] Layout em 3 colunas para formulários complexos
- [ ] Integração com APIs externas quando necessário
- [ ] Máscaras em campos de documento/telefone
- [ ] Hints explicativos nos campos
- [ ] Status panel para informações adicionais
- [ ] Animações suaves de transição

### Estilo
- [ ] Seguir cores do design system
- [ ] Usar ícones do Lucide React
- [ ] Manter consistência visual
- [ ] Padding e margins padronizados

## 📚 Exemplos de Uso

### Modal Simples
```tsx
import { BaseModal, FormField, BaseInput, BaseButton } from '@/components/base';

// Modal básico com 1 coluna
```

### Modal Complexo (3 Colunas)
```tsx
import { BaseModal, ThreeColumnLayout } from '@/components/base';

// Modal com layout em 3 colunas como o de clientes
```

### Modal com Status Panel
```tsx
import { BaseModal, StatusPanel } from '@/components/base';

// Modal com painel lateral de informações
```

## 🔧 Manutenção

### Versionamento
- Componentes base estão em `/src/components/base/`
- Mudanças devem ser backwards-compatible
- Documentar breaking changes

### Testes
- Testar em diferentes resoluções
- Validar acessibilidade
- Verificar integração com formulários

---

**💡 Dica**: Use o `ModalCadastroCliente.tsx` como referência completa de implementação. Ele demonstra todas as melhores práticas e padrões definidos neste documento.
