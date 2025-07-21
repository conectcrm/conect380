#!/usr/bin/env node

/**
 * Script para criar novos modais baseados no template padrão do Fênix CRM
 * 
 * Uso: node scripts/create-modal.js NomeDoModal
 * Exemplo: node scripts/create-modal.js Produto
 * 
 * Isso criará:
 * - src/components/modals/ModalCadastroProduto.tsx
 * - Interface ProdutoFormData
 * - Schema de validação personalizado
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Uso: node scripts/create-modal.js NomeDoModal');
  console.error('📝 Exemplo: node scripts/create-modal.js Produto');
  process.exit(1);
}

const modalName = args[0];
const modalNameLower = modalName.toLowerCase();
const modalNameCapitalized = modalName.charAt(0).toUpperCase() + modalName.slice(1);

const templateContent = `import React, { useEffect } from 'react';
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

// Tipos
interface ${modalNameCapitalized}FormData {
  nome: string;
  // TODO: Adicionar campos específicos do ${modalNameLower}
  // exemplo: codigo?: string;
  // exemplo: descricao?: string;
}

interface ModalCadastro${modalNameCapitalized}Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ${modalNameCapitalized}FormData) => void;
  ${modalNameLower}?: ${modalNameCapitalized}FormData | null;
  isLoading?: boolean;
}

// Schema de validação
const schema = yup.object({
  nome: yup
    .string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    
  // TODO: Adicionar validações específicas
  // exemplo: codigo: yup.string().required('Código é obrigatório'),
});

/**
 * ModalCadastro${modalNameCapitalized} - Modal para cadastro/edição de ${modalNameLower}
 * 
 * Criado automaticamente usando o template base do Fênix CRM.
 * 
 * TODO: Personalizar conforme necessidades específicas:
 * 1. Ajustar interface ${modalNameCapitalized}FormData
 * 2. Personalizar schema de validação
 * 3. Configurar campos do formulário
 * 4. Ajustar layout (1, 2 ou 3 colunas)
 */
export const ModalCadastro${modalNameCapitalized}: React.FC<ModalCadastro${modalNameCapitalized}Props> = ({
  isOpen,
  onClose,
  onSave,
  ${modalNameLower},
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<${modalNameCapitalized}FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      nome: '',
      // TODO: Adicionar valores padrão
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (${modalNameLower}) {
        reset(${modalNameLower});
      } else {
        reset({
          nome: '',
          // TODO: Resetar outros campos
        });
      }
    }
  }, [${modalNameLower}, reset, isOpen]);

  const onSubmit = (data: ${modalNameCapitalized}FormData) => {
    onSave(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={${modalNameLower} ? 'Editar ${modalNameCapitalized}' : 'Novo ${modalNameCapitalized}'}
      subtitle="Preencha as informações do ${modalNameLower}"
      maxWidth="4xl" // TODO: Ajustar tamanho conforme necessário
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TODO: Escolher layout apropriado */}
        
        {/* Opção 1: Layout 3 colunas (complexo) */}
        <ThreeColumnLayout
          leftTitle="Dados Básicos"
          centerTitle="Detalhes" 
          rightTitle="Observações"
          
          leftColumn={
            <div className="space-y-4">
              <FormField
                label="Nome"
                error={errors.nome?.message}
                required
              >
                <BaseInput
                  {...register('nome')}
                  placeholder="Digite o nome do ${modalNameLower}..."
                  error={!!errors.nome}
                />
              </FormField>

              {/* TODO: Adicionar mais campos da coluna esquerda */}
            </div>
          }
          
          centerColumn={
            <div className="space-y-4">
              {/* TODO: Adicionar campos da coluna central */}
              <p className="text-sm text-gray-500">
                Adicione campos específicos aqui
              </p>
            </div>
          }
          
          rightColumn={
            <div className="space-y-4">
              {/* TODO: Adicionar campos da coluna direita */}
              
              {/* Status Panel (opcional) */}
              <StatusPanel title="Status">
                <div className="space-y-2">
                  <StatusBadge
                    status={${modalNameLower} ? 'success' : 'pending'}
                    text={${modalNameLower} ? 'Existente' : 'Novo'}
                  />
                </div>
              </StatusPanel>
            </div>
          }
        />

        {/* 
        Opção 2: Layout simples (1 coluna)
        Descomente e use se preferir um layout mais simples:
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nome" error={errors.nome?.message} required>
              <BaseInput {...register('nome')} placeholder="Nome..." />
            </FormField>
            // Adicionar mais campos...
          </div>
        </div>
        */}

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
            {${modalNameLower} ? 'Atualizar' : 'Salvar'}
          </BaseButton>
        </ModalFooter>
      </form>
    </BaseModal>
  );
};

/**
 * Exemplo de uso:
 * 
 * \`\`\`tsx
 * const [show${modalNameCapitalized}Modal, setShow${modalNameCapitalized}Modal] = useState(false);
 * const [${modalNameLower}Selecionado, set${modalNameCapitalized}Selecionado] = useState(null);
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * const handleSave${modalNameCapitalized} = async (data) => {
 *   setIsLoading(true);
 *   try {
 *     if (${modalNameLower}Selecionado) {
 *       await ${modalNameLower}Service.update(${modalNameLower}Selecionado.id, data);
 *     } else {
 *       await ${modalNameLower}Service.create(data);
 *     }
 *     setShow${modalNameCapitalized}Modal(false);
 *     // Recarregar lista...
 *   } catch (error) {
 *     // Tratar erro...
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={() => setShow${modalNameCapitalized}Modal(true)}>
 *       Novo ${modalNameCapitalized}
 *     </button>
 *     
 *     <ModalCadastro${modalNameCapitalized}
 *       isOpen={show${modalNameCapitalized}Modal}
 *       onClose={() => setShow${modalNameCapitalized}Modal(false)}
 *       onSave={handleSave${modalNameCapitalized}}
 *       ${modalNameLower}={${modalNameLower}Selecionado}
 *       isLoading={isLoading}
 *     />
 *   </>
 * );
 * \`\`\`
 * 
 * Próximos passos:
 * 1. ✅ Arquivo criado
 * 2. 📝 Personalizar interface ${modalNameCapitalized}FormData
 * 3. 🔧 Ajustar schema de validação
 * 4. 📋 Configurar campos do formulário
 * 5. 🎨 Ajustar layout conforme necessário
 * 6. ✨ Testar e validar funcionamento
 */
`;

const outputDir = path.join(process.cwd(), 'src', 'components', 'modals');
const outputFile = path.join(outputDir, `ModalCadastro${modalNameCapitalized}.tsx`);

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Verificar se arquivo já existe
if (fs.existsSync(outputFile)) {
  console.error(`❌ Arquivo já existe: ${outputFile}`);
  console.error('💡 Use um nome diferente ou remova o arquivo existente');
  process.exit(1);
}

// Criar arquivo
fs.writeFileSync(outputFile, templateContent);

console.log(`✅ Modal criado com sucesso!`);
console.log(`📁 Arquivo: ${outputFile}`);
console.log(``);
console.log(`🚀 Próximos passos:`);
console.log(`1. Abra o arquivo criado`);
console.log(`2. Procure por comentários "TODO" e personalize conforme necessário`);
console.log(`3. Ajuste a interface ${modalNameCapitalized}FormData`);
console.log(`4. Configure o schema de validação`);
console.log(`5. Adicione os campos específicos do formulário`);
console.log(`6. Teste o modal na sua aplicação`);
console.log(``);
console.log(`📚 Documentação:`);
console.log(`- Padrões: frontend-web/docs/PADRAO-MODAIS.md`);
console.log(`- Template: frontend-web/docs/TEMPLATE-MODAL.md`);
console.log(`- Exemplo: frontend-web/src/examples/ModalCadastroProduto.tsx`);
console.log(`- Referência: frontend-web/src/components/modals/ModalCadastroCliente.tsx`);
