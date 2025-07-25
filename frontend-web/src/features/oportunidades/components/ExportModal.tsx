import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Calendar, Filter } from 'lucide-react';
import { FiltrosOportunidade } from '../../../types/oportunidades/index';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: FiltrosOportunidade;
  totalOportunidades: number;
}

type FormatoExport = 'csv' | 'excel' | 'pdf';
type TipoExport = 'todos' | 'filtrados' | 'selecionados';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filtros,
  totalOportunidades
}) => {
  const [formato, setFormato] = useState<FormatoExport>('excel');
  const [tipo, setTipo] = useState<TipoExport>('filtrados');
  const [incluirCampos, setIncluirCampos] = useState({
    informacoesBasicas: true,
    informacoesContato: true,
    informacoesVenda: true,
    informacoesAdicionais: true,
    informacoesSistema: false
  });
  const [periodoCustomizado, setPeriodoCustomizado] = useState({
    ativo: false,
    dataInicio: '',
    dataFim: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  const formatosDisponiveis = [
    {
      value: 'excel' as FormatoExport,
      label: 'Excel (.xlsx)',
      icon: FileSpreadsheet,
      description: 'Melhor para análise de dados'
    },
    {
      value: 'csv' as FormatoExport,
      label: 'CSV (.csv)',
      icon: FileText,
      description: 'Compatível com qualquer planilha'
    },
    {
      value: 'pdf' as FormatoExport,
      label: 'PDF (.pdf)',
      icon: FileText,
      description: 'Ideal para relatórios'
    }
  ];

  const tiposExport = [
    {
      value: 'filtrados' as TipoExport,
      label: 'Dados Filtrados',
      description: `Exportar ${totalOportunidades} oportunidades com os filtros atuais`
    },
    {
      value: 'todos' as TipoExport,
      label: 'Todos os Dados',
      description: 'Exportar todas as oportunidades do sistema'
    },
    {
      value: 'selecionados' as TipoExport,
      label: 'Itens Selecionados',
      description: 'Exportar apenas os itens selecionados (0 selecionados)',
      disabled: true
    }
  ];

  const camposDisponiveis = [
    {
      key: 'informacoesBasicas' as keyof typeof incluirCampos,
      label: 'Informações Básicas',
      description: 'Título, descrição, valor, estágio, probabilidade'
    },
    {
      key: 'informacoesContato' as keyof typeof incluirCampos,
      label: 'Informações de Contato',
      description: 'Nome, email, telefone, empresa do contato'
    },
    {
      key: 'informacoesVenda' as keyof typeof incluirCampos,
      label: 'Informações de Venda',
      description: 'Prioridade, data de fechamento, origem'
    },
    {
      key: 'informacoesAdicionais' as keyof typeof incluirCampos,
      label: 'Informações Adicionais',
      description: 'Observações, origem, dados complementares'
    },
    {
      key: 'informacoesSistema' as keyof typeof incluirCampos,
      label: 'Informações do Sistema',
      description: 'Responsável, datas de criação e atualização'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui seria implementada a lógica real de exportação
      console.log('Exportando dados:', {
        formato,
        tipo,
        incluirCampos,
        periodoCustomizado,
        filtros
      });
      
      // Simular download
      const filename = `oportunidades_${new Date().toISOString().split('T')[0]}.${formato}`;
      alert(`Arquivo ${filename} seria baixado aqui!`);
      
      onClose();
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCampo = (campo: keyof typeof incluirCampos) => {
    setIncluirCampos(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Download className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Exportar Oportunidades
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Formato de Exportação */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Formato do Arquivo
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {formatosDisponiveis.map((fmt) => {
                  const IconComponent = fmt.icon;
                  return (
                    <label
                      key={fmt.value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        formato === fmt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={fmt.value}
                        checked={formato === fmt.value}
                        onChange={(e) => setFormato(e.target.value as FormatoExport)}
                        className="sr-only"
                      />
                      <IconComponent className="w-5 h-5 text-gray-600 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {fmt.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fmt.description}
                        </div>
                      </div>
                      {formato === fmt.value && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tipo de Exportação */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Dados para Exportar
              </h4>
              <div className="space-y-2">
                {tiposExport.map((t) => (
                  <label
                    key={t.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      tipo === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    } ${t.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      value={t.value}
                      checked={tipo === t.value}
                      onChange={(e) => setTipo(e.target.value as TipoExport)}
                      disabled={t.disabled}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {t.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.description}
                      </div>
                    </div>
                    {tipo === t.value && !t.disabled && (
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Período Customizado */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="periodo-customizado"
                  checked={periodoCustomizado.ativo}
                  onChange={(e) => setPeriodoCustomizado(prev => ({ 
                    ...prev, 
                    ativo: e.target.checked 
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="periodo-customizado" className="ml-2 text-sm font-medium text-gray-900">
                  Filtrar por período customizado
                </label>
              </div>
              
              {periodoCustomizado.ativo && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={periodoCustomizado.dataInicio}
                      onChange={(e) => setPeriodoCustomizado(prev => ({
                        ...prev,
                        dataInicio: e.target.value
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={periodoCustomizado.dataFim}
                      onChange={(e) => setPeriodoCustomizado(prev => ({
                        ...prev,
                        dataFim: e.target.value
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Campos para Incluir */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Campos para Incluir
              </h4>
              <div className="space-y-2">
                {camposDisponiveis.map((campo) => (
                  <label
                    key={campo.key}
                    className="flex items-start p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={incluirCampos[campo.key]}
                      onChange={() => toggleCampo(campo.key)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {campo.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campo.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Resumo da Exportação */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                Resumo da Exportação
              </h5>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• Formato: {formatosDisponiveis.find(f => f.value === formato)?.label}</div>
                <div>• Dados: {tiposExport.find(t => t.value === tipo)?.label}</div>
                <div>• Campos incluídos: {Object.values(incluirCampos).filter(Boolean).length} de {Object.keys(incluirCampos).length}</div>
                {periodoCustomizado.ativo && (
                  <div>• Período: {periodoCustomizado.dataInicio || 'N/A'} até {periodoCustomizado.dataFim || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar Dados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
