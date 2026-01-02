import React from 'react';
import {
  Edit2,
  DollarSign,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  Calendar,
  FileText,
} from 'lucide-react';

interface ContaPagar {
  id: string;
  numero: string;
  fornecedor: { nome: string };
  descricao: string;
  dataVencimento: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  status: string;
  numeroDocumento?: string;
  dataPagamento?: string;
}

interface AcoesContaProps {
  conta: ContaPagar;
  onEditar: (conta: ContaPagar) => void;
  onPagar: (conta: ContaPagar) => void;
  onExcluir: (contaId: string) => void;
  onVisualizar?: (conta: ContaPagar) => void;
  onDuplicar?: (conta: ContaPagar) => void;
}

export const AcoesConta: React.FC<AcoesContaProps> = ({
  conta,
  onEditar,
  onPagar,
  onExcluir,
  onVisualizar,
  onDuplicar,
}) => {
  const [menuAberto, setMenuAberto] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const podeSerPago = !conta.dataPagamento && conta.valorRestante > 0;
  const podeSerEditado = !conta.dataPagamento;

  return (
    <div className="flex items-center gap-1">
      {/* Ações Principais (sempre visíveis) */}
      <div className="flex items-center gap-1">
        {onVisualizar && (
          <button
            onClick={() => onVisualizar(conta)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Visualizar detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        {podeSerEditado && (
          <button
            onClick={() => onEditar(conta)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Editar conta"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        {podeSerPago && (
          <button
            onClick={() => onPagar(conta)}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Registrar pagamento"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu de Mais Opções */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          title="Mais opções"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuAberto && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {onDuplicar && (
                <button
                  onClick={() => {
                    onDuplicar(conta);
                    setMenuAberto(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar conta
                </button>
              )}

              {conta.numeroDocumento && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(conta.numeroDocumento || '');
                    setMenuAberto(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copiar nº documento
                </button>
              )}

              {!conta.dataPagamento && (
                <button
                  onClick={() => {
                    // Implementar agendamento
                    setMenuAberto(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar pagamento
                </button>
              )}

              <div className="border-t border-gray-100 my-1"></div>

              <button
                onClick={() => {
                  // Remover confirmação aqui - será tratada pela página principal
                  onExcluir(conta.id);
                  setMenuAberto(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcoesConta;
