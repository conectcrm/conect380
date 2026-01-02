import React from 'react';
import { AlertTriangle, DollarSign, FileText, Clock } from 'lucide-react';

interface FornecedorDependencyDetails {
  totalContas: number;
  contasAbertas: number;
  contasPagas: number;
  valorEmAberto: number;
  valorPago: number;
  contasDetalhes?: Array<{
    descricao: string;
    valor: number;
    status: string;
    vencimento: Date;
  }>;
}

interface FornecedorRemovalErrorProps {
  message: string;
  details: FornecedorDependencyDetails;
  fornecedorNome: string;
  onDesativar: () => void;
  onCancelar: () => void;
  onVerContas: () => void;
}

export const FornecedorRemovalError: React.FC<FornecedorRemovalErrorProps> = ({
  message,
  details,
  fornecedorNome,
  onDesativar,
  onCancelar,
  onVerContas,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Exclusão não permitida</h3>
            <p className="text-sm text-gray-600">{fornecedorNome}</p>
          </div>
        </div>

        {/* Resumo das contas */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contas vinculadas ao fornecedor
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de contas:</span>
              <span className="font-semibold">{details.totalContas}</span>
            </div>

            {details.contasAbertas > 0 && (
              <>
                <div className="flex justify-between text-red-700">
                  <span>Contas em aberto:</span>
                  <span className="font-semibold">{details.contasAbertas}</span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>Valor em aberto:</span>
                  <span className="font-semibold">
                    R$ {details.valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            {details.contasPagas > 0 && (
              <>
                <div className="flex justify-between text-green-700">
                  <span>Contas pagas:</span>
                  <span className="font-semibold">{details.contasPagas}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Valor pago:</span>
                  <span className="font-semibold">
                    R$ {details.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contas em destaque */}
        {details.contasDetalhes && details.contasDetalhes.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Principais contas em aberto:
            </h5>
            <div className="space-y-1">
              {details.contasDetalhes.slice(0, 3).map((conta, index) => (
                <div
                  key={index}
                  className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400"
                >
                  <div className="font-medium">{conta.descricao}</div>
                  <div className="flex justify-between text-gray-600">
                    <span>
                      R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Por que não posso excluir?</strong>
            <br />
            Para manter a integridade financeira, fornecedores com contas vinculadas não podem ser
            excluídos. Isso preserva o histórico de pagamentos e evita inconsistências nos
            relatórios.
          </p>
        </div>

        {/* Opções de ação */}
        <div className="space-y-3">
          <button
            onClick={onVerContas}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Ver contas a pagar
          </button>

          <button
            onClick={onDesativar}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Desativar fornecedor
          </button>

          <button
            onClick={onCancelar}
            className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Dica */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 Dica: Desativar o fornecedor o remove da lista ativa mas preserva o histórico
        </div>
      </div>
    </div>
  );
};

export default FornecedorRemovalError;
