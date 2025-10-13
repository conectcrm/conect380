import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Contato, HistoricoAtendimento, Demanda } from '../types';
import { formatarTempoDecorrido, getIconeCanal } from '../utils';

interface ClientePanelProps {
  contato: Contato;
  historico: HistoricoAtendimento[];
  demandas: Demanda[];
  onEditarContato: () => void;
  onVincularCliente: () => void;
  onAbrirDemanda: (tipo: string, descricao: string) => void;
}

export const ClientePanel: React.FC<ClientePanelProps> = ({
  contato,
  historico,
  demandas,
  onEditarContato,
  onVincularCliente,
  onAbrirDemanda
}) => {
  const [expandido, setExpandido] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'demandas'>('historico');
  const [tipoDemanda, setTipoDemanda] = useState('');
  const [descricaoDemanda, setDescricaoDemanda] = useState('');

  const handleAbrirDemanda = () => {
    if (tipoDemanda.trim() && descricaoDemanda.trim()) {
      onAbrirDemanda(tipoDemanda, descricaoDemanda);
      setTipoDemanda('');
      setDescricaoDemanda('');
    }
  };

  const getStatusDemandaStyle = (status: Demanda['status']) => {
    switch (status) {
      case 'aberta':
        return 'bg-yellow-100 text-yellow-700';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-700';
      case 'concluida':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDemandaIcon = (status: Demanda['status']) => {
    switch (status) {
      case 'aberta':
        return <AlertCircle className="w-3 h-3" />;
      case 'em_andamento':
        return <Clock className="w-3 h-3" />;
      case 'concluida':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (!expandido) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setExpandido(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expandir painel"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
        <button
          onClick={() => setExpandido(false)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Minimizar painel"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Informações do Contato */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={contato.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(contato.nome)}&background=random`}
                alt={contato.nome}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-900">{contato.nome}</h4>
                <p className="text-sm text-gray-500">
                  {contato.online ? 'Online agora' : 'Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={onEditarContato}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar contato"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Dados de Contato */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Telefone</label>
              <p className="text-sm text-gray-900 mt-0.5">{contato.telefone}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">E-mail</label>
              <p className="text-sm text-gray-900 mt-0.5">{contato.email}</p>
            </div>
          </div>

          {/* Cliente Vinculado */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {contato.clienteVinculado ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded">
                    <LinkIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Vinculado a</p>
                    <p className="text-sm text-green-900 font-semibold">
                      {contato.clienteVinculado.nome}
                    </p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-700">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onVincularCliente}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Vincular Cliente</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Histórico e Demandas */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setAbaAtiva('historico')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                abaAtiva === 'historico'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Histórico ({historico.length})
            </button>
            <button
              onClick={() => setAbaAtiva('demandas')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                abaAtiva === 'demandas'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Demandas ({demandas.length})
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-4">
          {abaAtiva === 'historico' ? (
            <div className="space-y-3">
              {historico.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhum histórico encontrado
                </p>
              ) : (
                <>
                  {historico.slice(0, 5).map(item => {
                    const IconeCanal = getIconeCanal(item.canal);
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${
                              item.canal === 'whatsapp' ? 'bg-green-100' :
                              item.canal === 'telegram' ? 'bg-blue-100' :
                              item.canal === 'email' ? 'bg-red-100' :
                              'bg-gray-100'
                            }`}>
                              <IconeCanal className={`w-3 h-3 ${
                                item.canal === 'whatsapp' ? 'text-green-600' :
                                item.canal === 'telegram' ? 'text-blue-600' :
                                item.canal === 'email' ? 'text-red-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {item.numero}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatarTempoDecorrido(item.dataAbertura)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{item.resumo}</p>
                        <p className="text-xs text-gray-500">
                          Atendido por {item.atendente}
                        </p>
                      </div>
                    );
                  })}
                  {historico.length > 5 && (
                    <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Ver histórico completo ({historico.length} atendimentos)
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Formulário Nova Demanda */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Nova Demanda</h4>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={tipoDemanda}
                    onChange={(e) => setTipoDemanda(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="Suporte Técnico">Suporte Técnico</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Reclamação">Reclamação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={descricaoDemanda}
                    onChange={(e) => setDescricaoDemanda(e.target.value)}
                    rows={3}
                    placeholder="Descreva a demanda..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleAbrirDemanda}
                  disabled={!tipoDemanda.trim() || !descricaoDemanda.trim()}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Abrir Demanda
                </button>
              </div>

              {/* Lista de Demandas */}
              <div className="space-y-3">
                {demandas.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma demanda aberta
                  </p>
                ) : (
                  demandas.map(demanda => (
                    <div
                      key={demanda.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {demanda.tipo}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          getStatusDemandaStyle(demanda.status)
                        }`}>
                          {getStatusDemandaIcon(demanda.status)}
                          {demanda.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{demanda.descricao}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Aberta {formatarTempoDecorrido(demanda.dataAbertura)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
