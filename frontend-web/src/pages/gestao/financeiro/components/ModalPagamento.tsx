import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Upload, 
  DollarSign,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { 
  ContaPagar, 
  RegistrarPagamento, 
  FormaPagamento,
  FORMA_PAGAMENTO_LABELS
} from '../../../../types/financeiro';

interface ModalPagamentoProps {
  conta: ContaPagar;
  onClose: () => void;
  onSave: (pagamento: RegistrarPagamento) => void;
}

const ModalPagamento: React.FC<ModalPagamentoProps> = ({
  conta,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<RegistrarPagamento>({
    contaId: conta.id,
    valorPago: conta.valorRestante,
    dataPagamento: new Date().toISOString().split('T')[0],
    tipoPagamento: FormaPagamento.PIX,
    contaBancariaId: '',
    observacoes: ''
  });

  const [comprovante, setComprovante] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const handleInputChange = <K extends keyof RegistrarPagamento>(
    campo: K, 
    valor: RegistrarPagamento[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpar erro do campo
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const handleComprovanteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          comprovante: 'Arquivo deve ter no máximo 5MB'
        }));
        return;
      }

      // Validar tipo do arquivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          comprovante: 'Formato não permitido. Use JPEG, PNG ou PDF'
        }));
        return;
      }

      setComprovante(file);
      if (errors.comprovante) {
        setErrors(prev => ({
          ...prev,
          comprovante: ''
        }));
      }
    }
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (formData.valorPago <= 0) {
      novosErros.valorPago = 'Valor deve ser maior que zero';
    }

    if (formData.valorPago > conta.valorRestante) {
      novosErros.valorPago = 'Valor não pode ser maior que o valor restante';
    }

    if (!formData.dataPagamento) {
      novosErros.dataPagamento = 'Data de pagamento é obrigatória';
    }

    if (!formData.tipoPagamento) {
      novosErros.tipoPagamento = 'Forma de pagamento é obrigatória';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);
    try {
      const dadosParaSalvar = {
        ...formData,
        comprovante: comprovante || undefined
      };

      await onSave(dadosParaSalvar);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setErrors({ geral: 'Erro ao registrar pagamento. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  const valorRestanteAposPagamento = conta.valorRestante - formData.valorPago;
  const isPagamentoTotal = formData.valorPago === conta.valorRestante;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Registrar Pagamento
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Conta: {conta.numero} - {conta.fornecedor.nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações da Conta */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Original
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {formatarMoeda(conta.valorOriginal)}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Pago
              </label>
              <div className="text-lg font-semibold text-green-600">
                {formatarMoeda(conta.valorPago)}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Restante
              </label>
              <div className="text-lg font-semibold text-red-600">
                {formatarMoeda(conta.valorRestante)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Vencimento
              </label>
              <div className="text-sm text-gray-900">
                {formatarData(conta.dataVencimento)}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </label>
              <div className="text-sm text-gray-900 truncate" title={conta.descricao}>
                {conta.descricao}
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Pagamento */}
        <div className="p-6">
          {errors.geral && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.geral}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor do Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Valor do Pagamento *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={conta.valorRestante}
                value={formData.valorPago}
                onChange={(e) => handleInputChange('valorPago', Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.valorPago ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.valorPago && (
                <p className="text-red-600 text-sm mt-1">{errors.valorPago}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('valorPago', conta.valorRestante)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Valor Total
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('valorPago', conta.valorRestante / 2)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  50%
                </button>
              </div>
            </div>

            {/* Data do Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data do Pagamento *
              </label>
              <input
                type="date"
                value={formData.dataPagamento}
                onChange={(e) => handleInputChange('dataPagamento', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dataPagamento ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dataPagamento && (
                <p className="text-red-600 text-sm mt-1">{errors.dataPagamento}</p>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento *
              </label>
              <select
                value={formData.tipoPagamento}
                onChange={(e) => handleInputChange('tipoPagamento', e.target.value as FormaPagamento)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tipoPagamento ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {Object.values(FormaPagamento).map(forma => (
                  <option key={forma} value={forma}>
                    {FORMA_PAGAMENTO_LABELS[forma]}
                  </option>
                ))}
              </select>
              {errors.tipoPagamento && (
                <p className="text-red-600 text-sm mt-1">{errors.tipoPagamento}</p>
              )}
            </div>

            {/* Conta Bancária */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Conta Bancária
              </label>
              <select
                value={formData.contaBancariaId}
                onChange={(e) => handleInputChange('contaBancariaId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma conta</option>
                <option value="conta1">Conta Corrente - Banco do Brasil</option>
                <option value="conta2">Conta Poupança - Caixa</option>
                <option value="conta3">Conta Empresarial - Santander</option>
              </select>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                placeholder="Observações sobre o pagamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Comprovante */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-1" />
                Comprovante de Pagamento
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={handleComprovanteChange}
                  className="hidden"
                  id="comprovante"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="comprovante"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {comprovante ? comprovante.name : 'Clique para adicionar comprovante'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPEG, PNG ou PDF (máx. 5MB)
                  </span>
                </label>
              </div>
              {errors.comprovante && (
                <p className="text-red-600 text-sm mt-1">{errors.comprovante}</p>
              )}
            </div>
          </div>

          {/* Resumo do Pagamento */}
          {formData.valorPago > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Resumo do Pagamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Valor a ser pago:</span>
                  <div className="text-blue-900 font-bold text-lg">
                    {formatarMoeda(formData.valorPago)}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Valor restante:</span>
                  <div className={`font-bold text-lg ${
                    valorRestanteAposPagamento === 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {formatarMoeda(valorRestanteAposPagamento)}
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Status após pagamento:</span>
                  <div className={`font-bold ${
                    isPagamentoTotal ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isPagamentoTotal ? 'PAGO' : 'PARCIALMENTE PAGO'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            * Campos obrigatórios
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando || formData.valorPago <= 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CreditCard size={16} />
              {salvando ? 'Registrando...' : 'Registrar Pagamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPagamento;
