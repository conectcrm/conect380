import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, FileText, DollarSign } from 'lucide-react';
import { NovaFatura, ItemFatura, TipoFatura, FormaPagamento, Fatura } from '../../services/faturamentoService';
import ClienteSelect, { ClienteSelectValue } from '../../components/selects/ClienteSelect';
import ContratoSelect from '../../components/selects/ContratoSelect';
import MoneyInput from '../../components/inputs/MoneyInput';
import MoneyInputNoPrefix from '../../components/inputs/MoneyInputNoPrefix';
import NumberInput from '../../components/inputs/NumberInput';
import PercentInput from '../../components/inputs/PercentInput';
import { formatarValorMonetario } from '../../utils/formatacao';

interface ModalFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dadosFatura: NovaFatura) => void;
  fatura?: Fatura | null;
  isLoading?: boolean;
}

export default function ModalFatura({ isOpen, onClose, onSave, fatura, isLoading = false }: ModalFaturaProps) {
  const [formData, setFormData] = useState<NovaFatura>({
    contratoId: '',
    clienteId: '', // UUID string, não número
    usuarioResponsavelId: 'a47ac10b-58cc-4372-a567-0e02b2c3d480', // UUID do usuário admin teste
    tipo: TipoFatura.UNICA,
    dataVencimento: '',
    formaPagamento: FormaPagamento.PIX,
    observacoes: '',
    percentualDesconto: 0,
    valorDesconto: 0,
    itens: []
  });

  const [novoItem, setNovoItem] = useState<Omit<ItemFatura, 'id' | 'valorTotal'>>({
    descricao: '',
    quantidade: 0,
    valorUnitario: 0,
    unidade: 'un',
    codigoProduto: '',
    percentualDesconto: 0,
    valorDesconto: 0
  });

  const [totais, setTotais] = useState({
    subtotal: 0,
    desconto: 0,
    total: 0
  });

  const [erros, setErros] = useState<{
    clienteId?: string;
    dataVencimento?: string;
    itens?: string;
    geral?: string;
  }>({});

  const [salvando, setSalvando] = useState(false);

  // Estados para os selects de cliente e contrato
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteSelectValue | null>(null);

  const [contratoSelecionado, setContratoSelecionado] = useState<{
    id: string;
    numero: string;
    cliente?: {
      id?: string;
      nome: string;
      email: string;
    };
    valor?: number;
    status?: string;
    dataEmissao?: Date;
    dataVencimento?: Date;
    descricao?: string;
  } | null>(null);

  useEffect(() => {
    if (fatura) {
      setFormData({
        contratoId: fatura.contratoId ? String(fatura.contratoId) : '',
        clienteId: fatura.clienteId ? String(fatura.clienteId) : '',
        usuarioResponsavelId: fatura.usuarioResponsavelId,
        tipo: fatura.tipo,
        dataVencimento: fatura.dataVencimento.split('T')[0],
        formaPagamento: fatura.formaPagamento || FormaPagamento.PIX,
        observacoes: fatura.observacoes || '',
        percentualDesconto: fatura.percentualDesconto || 0,
        valorDesconto: fatura.valorDesconto || 0,
        itens: fatura.itens.map(item => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          unidade: item.unidade,
          codigoProduto: item.codigoProduto,
          percentualDesconto: item.percentualDesconto,
          valorDesconto: item.valorDesconto
        }))
      });

      // TODO: Carregar dados do cliente e contrato quando editando
      if (fatura.clienteId) {
        setClienteSelecionado({
          id: String(fatura.clienteId),
          nome: fatura.cliente?.nome || `Cliente ID: ${fatura.clienteId}`,
          email: fatura.cliente?.email,
          telefone: fatura.cliente?.telefone,
          documento: fatura.cliente?.documento,
          tipo: fatura.cliente?.tipo
        });
      }

      if (fatura.contratoId) {
        setContratoSelecionado({
          id: String(fatura.contratoId),
          numero: `CT${fatura.contratoId}`,
          cliente: fatura.cliente
        });
      }
    } else {
      // Reset para nova fatura
      setFormData({
        contratoId: '',
        clienteId: '',
        usuarioResponsavelId: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
        tipo: TipoFatura.UNICA,
        dataVencimento: '',
        formaPagamento: FormaPagamento.PIX,
        observacoes: '',
        percentualDesconto: 0,
        valorDesconto: 0,
        itens: []
      });
      setClienteSelecionado(null);
      setContratoSelecionado(null);
    }
  }, [fatura, isOpen]);

  // Handlers para mudança dos selects
  const handleClienteChange = (cliente: typeof clienteSelecionado) => {
    setClienteSelecionado(cliente);
    setFormData(prev => ({
      ...prev,
      clienteId: cliente?.id || '' // UUID string
    }));

    // Limpar contrato se mudou o cliente
    if (contratoSelecionado && cliente?.id !== contratoSelecionado.cliente?.id) {
      setContratoSelecionado(null);
      setFormData(prev => ({
        ...prev,
        contratoId: ''
      }));
    }
  };

  const handleContratoChange = (contrato: typeof contratoSelecionado) => {
    setContratoSelecionado(contrato);
    setFormData(prev => ({
      ...prev,
      contratoId: contrato ? contrato.id : ''
    }));
  };

  useEffect(() => {
    calcularTotais();
  }, [formData.itens, formData.percentualDesconto, formData.valorDesconto]);

  const calcularTotais = () => {
    const subtotal = formData.itens.reduce((acc, item) => {
      return acc + (item.quantidade * item.valorUnitario);
    }, 0);

    const descontoItens = formData.itens.reduce((acc, item) => {
      const subtotalItem = item.quantidade * item.valorUnitario;
      const descontoItem = item.valorDesconto || (subtotalItem * (item.percentualDesconto || 0)) / 100;
      return acc + descontoItem;
    }, 0);

    const descontoGeral = formData.valorDesconto || (subtotal * (formData.percentualDesconto || 0)) / 100;
    const descontoTotal = descontoItens + descontoGeral;
    const total = subtotal - descontoTotal;

    setTotais({
      subtotal,
      desconto: descontoTotal,
      total: Math.max(0, total)
    });
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0 || novoItem.valorUnitario <= 0) {
      alert('Preencha todos os campos obrigatórios do item');
      return;
    }

    const item = { ...novoItem };
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, item]
    }));

    setNovoItem({
      descricao: '',
      quantidade: 0,
      valorUnitario: 0,
      unidade: 'un',
      codigoProduto: '',
      percentualDesconto: 0,
      valorDesconto: 0
    });
  };

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const atualizarItem = (index: number, campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) =>
        i === index ? { ...item, [campo]: valor } : item
      )
    }));
  };

  const validarFormulario = (): boolean => {
    const novosErros: typeof erros = {};

    // Validar cliente
    if (!formData.clienteId || formData.clienteId.trim() === '') {
      novosErros.clienteId = 'Cliente é obrigatório';
    }

    // Validar data de vencimento
    if (!formData.dataVencimento) {
      novosErros.dataVencimento = 'Data de vencimento é obrigatória';
    } else {
      const dataVencimento = new Date(formData.dataVencimento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataVencimento < hoje) {
        novosErros.dataVencimento = 'Data de vencimento não pode ser anterior a hoje';
      }
    }

    // Validar itens
    if (formData.itens.length === 0) {
      novosErros.itens = 'Pelo menos um item é obrigatório';
    } else {
      const itemInvalido = formData.itens.find(item =>
        !item.descricao.trim() || item.quantidade <= 0 || item.valorUnitario <= 0
      );
      if (itemInvalido) {
        novosErros.itens = 'Todos os itens devem ter descrição, quantidade e valor válidos';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);
    setErros({});

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      setErros({ geral: 'Erro ao salvar fatura. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px] max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#159A9C]/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#159A9C]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {fatura ? 'Editar Fatura' : 'Nova Fatura'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensagem de erro geral */}
          {erros.geral && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro ao salvar fatura
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {erros.geral}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Cliente e Contrato */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClienteSelect
                value={clienteSelecionado}
                onChange={handleClienteChange}
                required={true}
                className="w-full"
              />
              {erros.clienteId && (
                <p className="text-sm text-red-600 mt-1">{erros.clienteId}</p>
              )}

              <ContratoSelect
                value={contratoSelecionado}
                onChange={handleContratoChange}
                clienteId={clienteSelecionado?.id}
                required={false}
                className="w-full"
              />
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.dataVencimento ? 'border-red-300' : 'border-gray-300'
                  }`}
                required
              />
              {erros.dataVencimento && (
                <p className="text-sm text-red-600 mt-1">{erros.dataVencimento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Fatura *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as TipoFatura }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TipoFatura.UNICA}>Única</option>
                <option value={TipoFatura.RECORRENTE}>Recorrente</option>
                <option value={TipoFatura.PARCELA}>Parcela</option>
                <option value={TipoFatura.ADICIONAL}>Adicional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formData.formaPagamento}
                onChange={(e) => setFormData(prev => ({ ...prev, formaPagamento: e.target.value as FormaPagamento }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={FormaPagamento.PIX}>PIX</option>
                <option value={FormaPagamento.CARTAO_CREDITO}>Cartão de Crédito</option>
                <option value={FormaPagamento.CARTAO_DEBITO}>Cartão de Débito</option>
                <option value={FormaPagamento.BOLETO}>Boleto</option>
                <option value={FormaPagamento.TRANSFERENCIA}>Transferência</option>
                <option value={FormaPagamento.DINHEIRO}>Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Itens da Fatura */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Itens da Fatura
              {erros.itens && (
                <span className="text-sm text-red-600 font-normal">* {erros.itens}</span>
              )}
            </h3>

            {/* Lista de Itens */}
            {formData.itens.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-center py-2">Qtd</th>
                      <th className="text-right py-2">Valor Unit.</th>
                      <th className="text-right py-2">Desconto</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-center py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.itens.map((item, index) => {
                      const subtotal = item.quantidade * item.valorUnitario;
                      const desconto = item.valorDesconto || (subtotal * (item.percentualDesconto || 0)) / 100;
                      const total = subtotal - desconto;

                      return (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <NumberInput
                              value={item.quantidade}
                              onValueChange={(value) => atualizarItem(index, 'quantidade', value)}
                              allowDecimals={false}
                              className="w-16 text-sm text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <MoneyInputNoPrefix
                              value={item.valorUnitario}
                              onValueChange={(value) => atualizarItem(index, 'valorUnitario', value)}
                              className="w-24 text-sm text-right px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <MoneyInputNoPrefix
                              value={item.valorDesconto || 0}
                              onValueChange={(value) => atualizarItem(index, 'valorDesconto', value)}
                              className="w-20 text-sm text-right px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-right font-medium">
                            R$ {formatarValorMonetario(total)}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removerItem(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Adicionar Novo Item */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              {/* Descrição - col-span-2 em md, col-span-1 em mobile */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Ex: Produto/Serviço"
                />
              </div>

              {/* Quantidade - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quantidade *
                </label>
                <NumberInput
                  value={novoItem.quantidade}
                  onValueChange={(value) => setNovoItem(prev => ({ ...prev, quantidade: value || 0 }))}
                  allowDecimals={false}
                  placeholder="1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Valor Unitário - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor Unitário *
                </label>
                <MoneyInputNoPrefix
                  value={novoItem.valorUnitario}
                  onValueChange={(value) => setNovoItem(prev => ({ ...prev, valorUnitario: value }))}
                  placeholder="0,00"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Unidade - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <input
                  type="text"
                  value={novoItem.unidade}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, unidade: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="un"
                />
              </div>

              {/* Desconto - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Desconto
                </label>
                <MoneyInputNoPrefix
                  value={novoItem.valorDesconto || 0}
                  onValueChange={(value) => setNovoItem(prev => ({ ...prev, valorDesconto: value }))}
                  placeholder="0,00"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Botão Adicionar - col-span-1 em md, centralizado em mobile */}
              <div className="md:col-span-1 flex justify-center md:justify-start items-end">
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white rounded px-4 py-2 transition-colors flex items-center justify-center gap-1 text-sm"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Desconto Geral e Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais sobre a fatura..."
              />
            </div>

            <div className="space-y-4">
              <div>
                <MoneyInput
                  label="Desconto Geral (R$)"
                  value={formData.valorDesconto || 0}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, valorDesconto: value, percentualDesconto: 0 }))}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <PercentInput
                  label="Ou Desconto Geral (%)"
                  value={formData.percentualDesconto || 0}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, percentualDesconto: value, valorDesconto: 0 }))}
                  placeholder="0%"
                  max={100}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {formatarValorMonetario(totais.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto:</span>
                  <span className="text-red-600">- R$ {formatarValorMonetario(totais.desconto)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    R$ {formatarValorMonetario(totais.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || formData.itens.length === 0}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-md hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {fatura ? 'Atualizar Fatura' : 'Criar Fatura'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
