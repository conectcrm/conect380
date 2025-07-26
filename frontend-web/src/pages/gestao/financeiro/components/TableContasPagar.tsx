import React from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  MoreHorizontal 
} from 'lucide-react';
import { ContaPagar, StatusContaPagar, STATUS_LABELS, CATEGORIA_LABELS } from '../../../../types/financeiro';

interface TableContasPagarProps {
  contas: ContaPagar[];
  contasSelecionadas: string[];
  onContasSelecionadasChange: (selecionadas: string[]) => void;
  onEditarConta: (conta: ContaPagar) => void;
  onRegistrarPagamento: (conta: ContaPagar) => void;
  onExcluirConta: (contaId: string) => void;
}

const TableContasPagar: React.FC<TableContasPagarProps> = ({
  contas,
  contasSelecionadas,
  onContasSelecionadasChange,
  onEditarConta,
  onRegistrarPagamento,
  onExcluirConta
}) => {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = (status: StatusContaPagar) => {
    switch (status) {
      case StatusContaPagar.PAGO:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case StatusContaPagar.VENCIDO:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case StatusContaPagar.AGENDADO:
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: StatusContaPagar) => {
    switch (status) {
      case StatusContaPagar.PAGO:
        return 'bg-green-100 text-green-800';
      case StatusContaPagar.VENCIDO:
        return 'bg-red-100 text-red-800';
      case StatusContaPagar.AGENDADO:
        return 'bg-blue-100 text-blue-800';
      case StatusContaPagar.CANCELADO:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const handleSelecionarTodos = (checked: boolean) => {
    if (checked) {
      onContasSelecionadasChange(contas.map(c => c.id));
    } else {
      onContasSelecionadasChange([]);
    }
  };

  const handleSelecionarConta = (contaId: string, checked: boolean) => {
    if (checked) {
      onContasSelecionadasChange([...contasSelecionadas, contaId]);
    } else {
      onContasSelecionadasChange(contasSelecionadas.filter(id => id !== contaId));
    }
  };

  const todasSelecionadas = contas.length > 0 && contasSelecionadas.length === contas.length;
  const algumasSelecionadas = contasSelecionadas.length > 0;

  if (contas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Nenhuma conta encontrada</div>
        <p className="text-gray-400">Crie sua primeira conta a pagar ou ajuste os filtros</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={todasSelecionadas}
                ref={(el) => {
                  if (el) el.indeterminate = algumasSelecionadas && !todasSelecionadas;
                }}
                onChange={(e) => handleSelecionarTodos(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Número
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fornecedor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descrição
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vencimento
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contas.map((conta) => {
            const isVencida = new Date(conta.dataVencimento) < new Date() && conta.status === StatusContaPagar.EM_ABERTO;
            const isVencendoHoje = new Date(conta.dataVencimento).toDateString() === new Date().toDateString();
            
            return (
              <tr 
                key={conta.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  isVencida ? 'bg-red-50' : isVencendoHoje ? 'bg-orange-50' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={contasSelecionadas.includes(conta.id)}
                    onChange={(e) => handleSelecionarConta(conta.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{conta.numero}</div>
                    {conta.recorrente && (
                      <div className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Recorrente
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{conta.fornecedor.nome}</div>
                  <div className="text-sm text-gray-500">{conta.fornecedor.cnpjCpf}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={conta.descricao}>
                    {conta.descricao}
                  </div>
                  {conta.numeroDocumento && (
                    <div className="text-sm text-gray-500">Doc: {conta.numeroDocumento}</div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {CATEGORIA_LABELS[conta.categoria] || conta.categoria}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className={`text-sm ${
                    isVencida ? 'text-red-600 font-medium' : 
                    isVencendoHoje ? 'text-orange-600 font-medium' : 
                    'text-gray-900'
                  }`}>
                    {formatarData(conta.dataVencimento)}
                  </div>
                  {(isVencida || isVencendoHoje) && (
                    <div className="text-xs text-gray-500">
                      {isVencida ? 'Vencida' : 'Vence hoje'}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatarMoeda(conta.valorTotal)}
                  </div>
                  {conta.valorPago > 0 && (
                    <div className="text-xs text-green-600">
                      Pago: {formatarMoeda(conta.valorPago)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(conta.status)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conta.status)}`}>
                      {STATUS_LABELS[conta.status]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {conta.status === StatusContaPagar.EM_ABERTO && (
                      <button
                        onClick={() => onRegistrarPagamento(conta)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Registrar Pagamento"
                      >
                        <CreditCard size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onEditarConta(conta)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onExcluirConta(conta.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="relative group">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                        <MoreHorizontal size={16} />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                        <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                          Ver Detalhes
                        </button>
                        <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                          Duplicar
                        </button>
                        {conta.anexos.length > 0 && (
                          <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            Ver Anexos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableContasPagar;
