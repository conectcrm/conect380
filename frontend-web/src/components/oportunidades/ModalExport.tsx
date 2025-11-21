import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File } from 'lucide-react';

interface ModalExportProps {
  isOpen: boolean;
  onClose: () => void;
  totalOportunidades: number;
  onExport: (formato: 'csv' | 'excel' | 'pdf') => void;
}

const ModalExport: React.FC<ModalExportProps> = ({
  isOpen,
  onClose,
  totalOportunidades,
  onExport,
}) => {
  const [formatoSelecionado, setFormatoSelecionado] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(formatoSelecionado);
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatos = [
    {
      id: 'csv' as const,
      nome: 'CSV',
      descricao: 'Arquivo separado por vírgulas',
      icone: FileText,
      cor: 'text-green-600',
      corFundo: 'bg-green-50',
    },
    {
      id: 'excel' as const,
      nome: 'Excel',
      descricao: 'Planilha Microsoft Excel',
      icone: FileSpreadsheet,
      cor: 'text-blue-600',
      corFundo: 'bg-blue-50',
    },
    {
      id: 'pdf' as const,
      nome: 'PDF',
      descricao: 'Documento portátil',
      icone: File,
      cor: 'text-red-600',
      corFundo: 'bg-red-50',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-[#002333]">Exportar Oportunidades</h2>
            <p className="text-sm text-[#002333]/60 mt-1">
              {totalOportunidades} oportunidade{totalOportunidades !== 1 ? 's' : ''} será{totalOportunidades !== 1 ? 'ão' : ''} exportada{totalOportunidades !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-[#002333]/60" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm font-medium text-[#002333] mb-4">
            Selecione o formato de exportação:
          </p>

          {formatos.map((formato) => {
            const Icone = formato.icone;
            const selecionado = formatoSelecionado === formato.id;

            return (
              <button
                key={formato.id}
                onClick={() => setFormatoSelecionado(formato.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selecionado
                    ? 'border-[#159A9C] bg-[#159A9C]/5'
                    : 'border-[#DEEFE7] hover:border-[#B4BEC9] bg-white'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${formato.corFundo}`}>
                    <Icone className={`h-6 w-6 ${formato.cor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#002333]">{formato.nome}</h3>
                      {selecionado && (
                        <div className="h-2 w-2 rounded-full bg-[#159A9C]"></div>
                      )}
                    </div>
                    <p className="text-sm text-[#002333]/60">{formato.descricao}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalExport;
