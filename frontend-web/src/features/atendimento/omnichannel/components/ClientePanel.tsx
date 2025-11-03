import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText,
  Trash2,
  Star
} from 'lucide-react';
import { Contato, HistoricoAtendimento, Demanda, NotaCliente } from '../types';
import { formatarTempoDecorrido, getIconeCanal, resolverNomeExibicao } from '../utils';
import { resolveAvatarUrl } from '../../../../utils/avatar';
import { ThemePalette } from '../../../../contexts/ThemeContext';

interface ClientePanelProps {
  contato: Contato;
  historico: HistoricoAtendimento[];
  demandas: Demanda[];
  notas: NotaCliente[];
  onEditarContato: () => void;
  onVincularCliente: () => void;
  onAbrirDemanda: (tipo: string, descricao: string) => void;
  onAdicionarNota: (conteudo: string, importante: boolean) => void;
  onExcluirNota: (notaId: string) => void;
  theme: ThemePalette;
}

export const ClientePanel: React.FC<ClientePanelProps> = ({
  contato,
  historico,
  demandas,
  notas,
  onEditarContato,
  onVincularCliente,
  onAbrirDemanda,
  onAdicionarNota,
  onExcluirNota,
  theme
}) => {
  const [expandido, setExpandido] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'demandas' | 'notas'>('historico');
  const [tipoDemanda, setTipoDemanda] = useState('');
  const [descricaoDemanda, setDescricaoDemanda] = useState('');
  const [novaNota, setNovaNota] = useState('');
  const [notaImportante, setNotaImportante] = useState(false);

  const handleAbrirDemanda = () => {
    if (tipoDemanda.trim() && descricaoDemanda.trim()) {
      onAbrirDemanda(tipoDemanda, descricaoDemanda);
      setTipoDemanda('');
      setDescricaoDemanda('');
    }
  };

  const handleAdicionarNota = () => {
    if (novaNota.trim()) {
      onAdicionarNota(novaNota, notaImportante);
      setNovaNota('');
      setNotaImportante(false);
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

  const avatarContato = resolveAvatarUrl(contato?.foto || null);

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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">Informações do Cliente</h3>
        <button
          onClick={() => setExpandido(false)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Minimizar painel"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Informações do Contato */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <img
                src={avatarContato || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolverNomeExibicao(contato))}&background=random`}
                alt={resolverNomeExibicao(contato)}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm text-gray-900">{resolverNomeExibicao(contato)}</h4>
                <p className="text-xs text-gray-500">
                  {contato?.online ? 'Online agora' : 'Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={onEditarContato}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Editar contato"
            >
              <Edit className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          {/* Dados de Contato */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Telefone</label>
              <p className="text-sm text-gray-900 mt-0.5">{contato?.telefone || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">E-mail</label>
              <p className="text-sm text-gray-900 mt-0.5">{contato?.email || 'Não informado'}</p>
            </div>
          </div>

          {/* Cliente Vinculado */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {contato?.clienteVinculado ? (
              <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded">
                    <LinkIcon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Vinculado a</p>
                    <p className="text-xs text-green-900 font-semibold">
                      {contato.clienteVinculado?.nome || 'Cliente'}
                    </p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-700">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onVincularCliente}
                style={{
                  borderColor: theme.colors.border,
                  color: theme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
                  e.currentTarget.style.color = theme.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.colors.textSecondary;
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Vincular Cliente</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs: Histórico, Demandas e Notas */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setAbaAtiva('historico')}
              style={{
                color: abaAtiva === 'historico' ? theme.colors.primary : '',
                borderBottomColor: abaAtiva === 'historico' ? theme.colors.primary : ''
              }}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${abaAtiva === 'historico'
                ? 'border-b-2'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Histórico ({Array.isArray(historico) ? historico.length : 0})
            </button>
            <button
              onClick={() => setAbaAtiva('demandas')}
              style={{
                color: abaAtiva === 'demandas' ? theme.colors.primary : '',
                borderBottomColor: abaAtiva === 'demandas' ? theme.colors.primary : ''
              }}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${abaAtiva === 'demandas'
                ? 'border-b-2'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Demandas ({Array.isArray(demandas) ? demandas.length : 0})
            </button>
            <button
              onClick={() => setAbaAtiva('notas')}
              style={{
                color: abaAtiva === 'notas' ? theme.colors.primary : '',
                borderBottomColor: abaAtiva === 'notas' ? theme.colors.primary : ''
              }}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${abaAtiva === 'notas'
                ? 'border-b-2'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Notas ({Array.isArray(notas) ? notas.length : 0})
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-3">
          {abaAtiva === 'historico' ? (
            <div className="space-y-2">
              {!Array.isArray(historico) || historico.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                  Nenhum histórico encontrado
                </p>
              ) : (
                <>
                  {historico.slice(0, 5).map(item => {
                    const IconeCanal = getIconeCanal(item.canal);
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 rounded-full ${item.canal === 'whatsapp' ? 'bg-green-100' :
                              item.canal === 'telegram' ? 'bg-blue-100' :
                                item.canal === 'email' ? 'bg-red-100' :
                                  'bg-gray-100'
                              }`}>
                              <IconeCanal className={`w-2.5 h-2.5 ${item.canal === 'whatsapp' ? 'text-green-600' :
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
                        <p className="text-xs text-gray-900 mb-1">{item.resumo}</p>
                        <p className="text-xs text-gray-500">
                          Atendido por {item.atendente}
                        </p>
                      </div>
                    );
                  })}
                  {historico.length > 5 && (
                    <button
                      className="w-full py-1.5 text-xs font-medium"
                      style={{ color: theme.colors.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primaryHover}
                      onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.primary}
                    >
                      Ver histórico completo ({historico.length} atendimentos)
                    </button>
                  )}
                </>
              )}
            </div>
          ) : abaAtiva === 'demandas' ? (
            <div className="space-y-3">
              {/* Formulário Nova Demanda */}
              <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: theme.colors.primaryLight }}>
                <h4 className="text-xs font-semibold text-gray-900">Nova Demanda</h4>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={tipoDemanda}
                    onChange={(e) => setTipoDemanda(e.target.value)}
                    style={{ borderColor: theme.colors.border }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${theme.colors.primary}`;
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs transition-all"
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
                    rows={2}
                    placeholder="Descreva a demanda..."
                    style={{ borderColor: theme.colors.border }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${theme.colors.primary}`;
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs resize-none transition-all"
                  />
                </div>

                <button
                  onClick={handleAbrirDemanda}
                  disabled={!tipoDemanda.trim() || !descricaoDemanda.trim()}
                  style={{
                    backgroundColor: (!tipoDemanda.trim() || !descricaoDemanda.trim()) ? '#D1D5DB' : theme.colors.primary,
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    if (tipoDemanda.trim() && descricaoDemanda.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tipoDemanda.trim() && descricaoDemanda.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.primary;
                    }
                  }}
                  className="w-full py-1.5 rounded-lg disabled:cursor-not-allowed transition-colors text-xs font-medium"
                >
                  Abrir Demanda
                </button>
              </div>

              {/* Lista de Demandas */}
              <div className="space-y-2">
                {!Array.isArray(demandas) || demandas.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">
                    Nenhuma demanda aberta
                  </p>
                ) : (
                  demandas.map(demanda => (
                    <div
                      key={demanda.id}
                      className="p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-900">
                          {demanda.tipo}
                        </span>
                        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusDemandaStyle(demanda.status)
                          }`}>
                          {getStatusDemandaIcon(demanda.status)}
                          {demanda.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1.5">{demanda.descricao}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Aberta {formatarTempoDecorrido(demanda.dataAbertura)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Aba de Notas */
            <div className="space-y-3">
              {/* Formulário Nova Nota */}
              <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: theme.colors.primaryLight }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Nova Nota
                  </h4>
                  <button
                    onClick={() => setNotaImportante(!notaImportante)}
                    className={`p-1 rounded transition-colors ${notaImportante ? 'bg-yellow-100' : 'hover:bg-gray-100'
                      }`}
                    title={notaImportante ? 'Remover marcação importante' : 'Marcar como importante'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${notaImportante ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>

                <div>
                  <textarea
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    rows={3}
                    placeholder="Nota sobre o cliente..."
                    style={{ borderColor: theme.colors.border }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${theme.colors.primary}`;
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                    className="w-full px-2.5 py-1.5 border rounded-lg text-xs resize-none transition-all"
                  />
                </div>

                <button
                  onClick={handleAdicionarNota}
                  disabled={!novaNota.trim()}
                  style={{
                    backgroundColor: !novaNota.trim() ? '#D1D5DB' : theme.colors.primary,
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => {
                    if (novaNota.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (novaNota.trim()) {
                      e.currentTarget.style.backgroundColor = theme.colors.primary;
                    }
                  }}
                  className="w-full py-1.5 rounded-lg disabled:cursor-not-allowed transition-colors text-xs font-medium"
                >
                  Adicionar Nota
                </button>
              </div>

              {/* Lista de Notas */}
              <div className="space-y-2">
                {!Array.isArray(notas) || notas.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-500">Nenhuma nota adicionada</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Adicione notas importantes
                    </p>
                  </div>
                ) : (
                  [...notas]
                    .sort((a, b) => {
                      // Importante primeiro, depois por data
                      if (a.importante && !b.importante) return -1;
                      if (!a.importante && b.importante) return 1;
                      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
                    })
                    .map(nota => (
                      <div
                        key={nota.id}
                        className={`p-2.5 rounded-lg transition-colors relative group ${nota.importante
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                      >
                        {/* Badge Importante */}
                        {nota.importante && (
                          <div className="absolute top-1.5 right-1.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}

                        {/* Autor e Data */}
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <img
                            src={
                              nota.autor.foto ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(nota.autor.nome)}&background=random&size=24`
                            }
                            alt={nota.autor.nome}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-900">
                                {nota.autor.nome}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatarTempoDecorrido(nota.dataCriacao)}
                              </span>
                            </div>
                            {nota.dataEdicao && (
                              <span className="text-xs text-gray-400">
                                (editado)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo da Nota */}
                        <p className="text-xs text-gray-700 whitespace-pre-wrap mb-1.5 pr-6">
                          {nota.conteudo}
                        </p>

                        {/* Botão Excluir (aparece no hover) */}
                        <button
                          onClick={() => onExcluirNota(nota.id)}
                          className="absolute bottom-1.5 right-1.5 p-1 bg-white border border-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
                          title="Excluir nota"
                        >
                          <Trash2 className="w-3 h-3 text-gray-600 hover:text-red-600" />
                        </button>
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
