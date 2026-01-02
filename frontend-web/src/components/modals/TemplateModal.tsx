/**
 * Template de Modal Padronizado
 * Use este template como base para criar novos modais
 * ou refatorar modais existentes
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Save, FileText, DollarSign, User, Tag } from 'lucide-react';
import {
  BaseModal,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  ModalButton,
  ModalCard,
} from './BaseModal';

// 1. INTERFACES E TIPOS
interface FormData {
  campo1: string;
  campo2: string;
  campo3: number;
  categoria: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  data?: Partial<FormData>;
  isLoading?: boolean;
}

// 2. SCHEMA DE VALIDAÇÃO
const schema = yup.object({
  campo1: yup.string().required('Campo 1 é obrigatório').min(3, 'Mínimo 3 caracteres'),
  campo2: yup.string().required('Campo 2 é obrigatório'),
  campo3: yup.number().required('Campo 3 é obrigatório').min(0, 'Valor deve ser positivo'),
  categoria: yup.string().required('Categoria é obrigatória'),
});

// 3. DADOS MOCK/OPÇÕES
const categorias = [
  { value: 'categoria1', label: 'Categoria 1' },
  { value: 'categoria2', label: 'Categoria 2' },
  { value: 'categoria3', label: 'Categoria 3' },
];

// 4. ETAPAS (se for um modal com wizard)
const etapas = [
  { id: 'basicas', titulo: 'Informações Básicas', icone: FileText },
  { id: 'valores', titulo: 'Valores', icone: DollarSign },
  { id: 'classificacao', titulo: 'Classificação', icone: Tag },
];

// 5. COMPONENTE PRINCIPAL
export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  data,
  isLoading = false,
}) => {
  // 6. ESTADO LOCAL (se necessário)
  const [etapaAtual, setEtapaAtual] = useState(0);

  // 7. FORM HOOK
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      campo1: '',
      campo2: '',
      campo3: 0,
      categoria: '',
    },
  });

  // 8. EFFECTS
  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset(data as FormData);
      } else {
        reset({
          campo1: '',
          campo2: '',
          campo3: 0,
          categoria: '',
        });
      }
    }
  }, [data, reset, isOpen]);

  // 9. HANDLERS
  const onSubmit = async (formData: FormData) => {
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleClose = () => {
    reset();
    setEtapaAtual(0);
    onClose();
  };

  const handleProximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // 10. RENDER CONDICIONAL
  if (!isOpen) return null;

  // 11. FOOTER CUSTOMIZADO
  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex gap-2">
        {etapaAtual > 0 && (
          <ModalButton type="button" variant="secondary" onClick={handleEtapaAnterior}>
            Anterior
          </ModalButton>
        )}
      </div>

      <div className="flex gap-2">
        <ModalButton type="button" variant="secondary" onClick={handleClose}>
          Cancelar
        </ModalButton>

        {etapaAtual < etapas.length - 1 ? (
          <ModalButton type="button" variant="primary" onClick={handleProximaEtapa}>
            Próximo
          </ModalButton>
        ) : (
          <ModalButton
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            variant="primary"
            icon={Save}
            loading={isLoading}
          >
            {data ? 'Atualizar' : 'Salvar'}
          </ModalButton>
        )}
      </div>
    </div>
  );

  // 12. RENDER CONTEÚDO POR ETAPA
  const renderEtapaConteudo = () => {
    switch (etapaAtual) {
      case 0:
        return (
          <div className="space-y-4">
            <FormField
              label="Campo 1"
              helpText="Texto de ajuda para o campo"
              required
              error={errors.campo1?.message}
            >
              <FormInput
                {...register('campo1')}
                placeholder="Digite o valor"
                error={!!errors.campo1}
              />
            </FormField>

            <FormField label="Campo 2" required error={errors.campo2?.message}>
              <FormTextarea
                {...register('campo2')}
                placeholder="Digite uma descrição"
                rows={3}
                error={!!errors.campo2}
              />
            </FormField>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <FormField label="Campo 3 (Numérico)" required error={errors.campo3?.message}>
              <FormInput
                {...register('campo3', { valueAsNumber: true })}
                type="number"
                placeholder="0"
                error={!!errors.campo3}
              />
            </FormField>

            <ModalCard variant="info">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-700">Informação adicional sobre valores</p>
              </div>
            </ModalCard>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField label="Categoria" required error={errors.categoria?.message}>
              <FormSelect
                {...register('categoria')}
                options={categorias}
                placeholder="Selecione uma categoria"
                error={!!errors.categoria}
              />
            </FormField>

            <ModalCard variant="default">
              <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Campo 1:</strong> {watch('campo1') || 'Não informado'}
                </p>
                <p>
                  <strong>Campo 3:</strong> {watch('campo3') || 0}
                </p>
                <p>
                  <strong>Categoria:</strong>{' '}
                  {categorias.find((c) => c.value === watch('categoria'))?.label ||
                    'Não selecionada'}
                </p>
              </div>
            </ModalCard>
          </div>
        );

      default:
        return null;
    }
  };

  // 13. RENDER PRINCIPAL
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={data ? 'Editar Item' : 'Novo Item'}
      subtitle={data ? 'Atualize as informações' : 'Preencha os dados do novo item'}
      size="large"
      steps={etapas}
      currentStep={etapaAtual}
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)}>{renderEtapaConteudo()}</form>
    </BaseModal>
  );
};

// 14. EXEMPLO DE USO
/*
// Em um componente pai:

const [modalAberto, setModalAberto] = useState(false);
const [itemEditando, setItemEditando] = useState(null);

const handleSalvar = async (data: FormData) => {
  // Lógica de salvamento
  console.log('Salvando:', data);
};

return (
  <>
    <button onClick={() => setModalAberto(true)}>
      Abrir Modal
    </button>
    
    <TemplateModal
      isOpen={modalAberto}
      onClose={() => {
        setModalAberto(false);
        setItemEditando(null);
      }}
      onSave={handleSalvar}
      data={itemEditando}
      isLoading={false}
    />
  </>
);
*/
