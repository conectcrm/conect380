import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

// ========================================
// INTERFACES E TIPOS
// ========================================

interface InputMoedaProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  name?: string;
}

// ========================================
// COMPONENTE INPUT MOEDA
// ========================================

/**
 * InputMoeda - Componente padrão para campos de valor monetário
 *
 * Características:
 * - Formatação automática em tempo real (padrão brasileiro)
 * - Separador de milhares: ponto (.)
 * - Separador decimal: vírgula (,)
 * - Sempre exibe 2 casas decimais
 * - inputMode="numeric" para mobile
 * - Conversão transparente para número
 *
 * Exemplos de uso:
 *
 * ```tsx
 * // Básico
 * <InputMoeda
 *   value={valor}
 *   onChange={setValor}
 *   label="Valor"
 * />
 *
 * // Completo
 * <InputMoeda
 *   value={formData.valor}
 *   onChange={(val) => setFormData(prev => ({ ...prev, valor: val }))}
 *   label="Valor Estimado"
 *   placeholder="0,00"
 *   required
 *   error={errors.valor}
 *   hint="Digite apenas números • Formatação automática"
 * />
 * ```
 *
 * @param value - Valor numérico (ex: 1234.56)
 * @param onChange - Callback com o valor numérico atualizado
 * @param label - Label do campo
 * @param placeholder - Placeholder (padrão: "0,00")
 * @param required - Se o campo é obrigatório
 * @param disabled - Se o campo está desabilitado
 * @param error - Mensagem de erro de validação
 * @param hint - Texto de ajuda abaixo do campo
 * @param className - Classes CSS adicionais para o container
 * @param name - Nome do campo (para forms)
 */
const InputMoeda: React.FC<InputMoedaProps> = ({
  value,
  onChange,
  label,
  placeholder = '0,00',
  required = false,
  disabled = false,
  error,
  hint = 'Digite apenas números • Formatação automática',
  className = '',
  name,
}) => {
  const [valorFormatado, setValorFormatado] = useState<string>('');

  // ========================================
  // FORMATAÇÃO DE MOEDA
  // ========================================

  const formatarValorInput = (inputValue: string): string => {
    // Remove tudo exceto números
    const numeros = inputValue.replace(/\D/g, '');

    if (!numeros) return '';

    // Converte para número (centavos)
    const valorEmCentavos = parseInt(numeros, 10);

    // Converte para reais
    const valorEmReais = valorEmCentavos / 100;

    // Formata com separadores brasileiros
    return valorEmReais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseValorInput = (inputValue: string): number => {
    // Remove tudo exceto números
    const numeros = inputValue.replace(/\D/g, '');

    if (!numeros) return 0;

    // Converte para número (centavos) e depois para reais
    return parseInt(numeros, 10) / 100;
  };

  // Atualizar valor formatado quando prop value mudar
  useEffect(() => {
    if (value > 0) {
      setValorFormatado(
        value.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    } else {
      setValorFormatado('');
    }
  }, [value]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Formata o valor para exibição
    const valorFormatadoNovo = formatarValorInput(inputValue);
    setValorFormatado(valorFormatadoNovo);

    // Converte para número e notifica o pai
    const valorNumerico = parseValorInput(inputValue);
    onChange(valorNumerico);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[#002333] mb-2">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-sm font-medium text-[#002333]/60">R$</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={valorFormatado}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm font-medium transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-[#B4BEC9] bg-white'
          }`}
          required={required}
          disabled={disabled}
        />
      </div>

      {hint && !error && <p className="mt-1 text-xs text-[#002333]/60">{hint}</p>}

      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default InputMoeda;

// ========================================
// EXEMPLO DE USO
// ========================================

/**
 * EXEMPLO 1: Formulário de Oportunidade
 *
 * ```tsx
 * import InputMoeda from '../components/common/InputMoeda';
 *
 * const [valor, setValor] = useState(0);
 *
 * <InputMoeda
 *   value={valor}
 *   onChange={setValor}
 *   label="Valor Estimado"
 *   required
 *   error={errors.valor}
 * />
 * ```
 */

/**
 * EXEMPLO 2: Formulário de Produto
 *
 * ```tsx
 * import InputMoeda from '../components/common/InputMoeda';
 *
 * const [formData, setFormData] = useState({ preco: 0 });
 *
 * <InputMoeda
 *   value={formData.preco}
 *   onChange={(val) => setFormData(prev => ({ ...prev, preco: val }))}
 *   label="Preço de Venda"
 *   required
 * />
 * ```
 */

/**
 * EXEMPLO 3: Formulário de Fatura
 *
 * ```tsx
 * import InputMoeda from '../components/common/InputMoeda';
 *
 * const [valorTotal, setValorTotal] = useState(0);
 *
 * <InputMoeda
 *   value={valorTotal}
 *   onChange={setValorTotal}
 *   label="Valor Total"
 *   hint="Valor total da fatura com impostos"
 *   disabled={calculandoTotal}
 * />
 * ```
 */
