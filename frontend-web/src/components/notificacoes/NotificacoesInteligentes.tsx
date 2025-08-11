import React, { useState, useEffect } from 'react';
import {
  Bell, X, Check, Clock, AlertTriangle, Info, CheckCircle,
  Settings, Filter, Search, BellRing, Volume2, VolumeX,
  Star, Archive, Trash2, Eye, Users, Calendar
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';

type TipoNotificacao =
  | 'fatura_vencendo'
  | 'pagamento_recebido'
  | 'cliente_inadimplente'
  | 'meta_atingida'
  | 'sistema_alerta'
  | 'workflow_executado'
  | 'relatorio_disponivel'
  | 'backup_concluido';

type PrioridadeNotificacao = 'baixa' | 'media' | 'alta' | 'critica';

interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  prioridade: PrioridadeNotificacao;
  titulo: string;
  mensagem: string;
  dados?: Record<string, any>;
  lida: boolean;
  arquivada: boolean;
  favorita: boolean;
  criadaEm: Date;
  agendadaPara?: Date;
  acoes?: AcaoNotificacao[];
  remetente?: {
    nome: string;
    tipo: 'sistema' | 'usuario' | 'workflow';
  };
}

interface AcaoNotificacao {
  id: string;
  label: string;
  tipo: 'primary' | 'secondary' | 'danger';
  acao: string;
  parametros?: Record<string, any>;
}

interface ConfigNotificacao {
  tipos: Record<TipoNotificacao, boolean>;
  prioridades: Record<PrioridadeNotificacao, boolean>;
  horarioSilencioso: {
    ativo: boolean;
    inicio: string;
    fim: string;
  };
  gruposPorTipo: boolean;
  limiteHistorico: number;
  somAtivo: boolean;
  emailAtivo: boolean;
  pushAtivo: boolean;
}

interface NotificacoesInteligentesProps {
  faturas: Fatura[];
  onAcaoNotificacao: (acao: string, dados: any) => Promise<void>;
}

const NOTIFICACOES_MOCKADAS: Notificacao[] = [
  {
    id: '1',
    tipo: 'fatura_vencendo',
    prioridade: 'alta',
    titulo: '5 faturas vencendo em 3 dias',
    mensagem: 'Existem 5 faturas que vencem nos próximos 3 dias, totalizando R$ 12.450,00',
    dados: { quantidade: 5, valor: 12450, diasParaVencimento: 3 },
    lida: false,
    arquivada: false,
    favorita: false,
    criadaEm: new Date(Date.now() - 300000), // 5 min atrás
    remetente: { nome: 'Sistema de Faturamento', tipo: 'sistema' },
    acoes: [
      { id: 'ver_faturas', label: 'Ver Faturas', tipo: 'primary', acao: 'navegar_faturas' },
      { id: 'enviar_cobranca', label: 'Enviar Cobrança', tipo: 'secondary', acao: 'enviar_cobranca_lote' }
    ]
  },
  {
    id: '2',
    tipo: 'pagamento_recebido',
    prioridade: 'media',
    titulo: 'Pagamento recebido - Tech Solutions',
    mensagem: 'Pagamento de R$ 2.500,00 da fatura #1234 foi confirmado',
    dados: { valor: 2500, faturaId: '1234', clienteNome: 'Tech Solutions' },
    lida: false,
    arquivada: false,
    favorita: true,
    criadaEm: new Date(Date.now() - 600000), // 10 min atrás
    remetente: { nome: 'Gateway de Pagamento', tipo: 'sistema' },
    acoes: [
      { id: 'ver_fatura', label: 'Ver Fatura', tipo: 'primary', acao: 'abrir_fatura' },
      { id: 'baixar_comprovante', label: 'Baixar Comprovante', tipo: 'secondary', acao: 'download_comprovante' }
    ]
  },
  {
    id: '3',
    tipo: 'cliente_inadimplente',
    prioridade: 'critica',
    titulo: 'Cliente com 30+ dias em atraso',
    mensagem: 'Marketing Pro possui R$ 8.900,00 em atraso há mais de 30 dias',
    dados: { clienteNome: 'Marketing Pro', valor: 8900, diasAtraso: 35 },
    lida: true,
    arquivada: false,
    favorita: false,
    criadaEm: new Date(Date.now() - 1800000), // 30 min atrás
    remetente: { nome: 'Análise de Risco', tipo: 'sistema' },
    acoes: [
      { id: 'ver_cliente', label: 'Ver Cliente', tipo: 'primary', acao: 'abrir_cliente' },
      { id: 'iniciar_cobranca', label: 'Iniciar Cobrança', tipo: 'danger', acao: 'workflow_cobranca' }
    ]
  },
  {
    id: '4',
    tipo: 'meta_atingida',
    prioridade: 'baixa',
    titulo: 'Meta mensal atingida! 🎉',
    mensagem: 'Parabéns! A meta de faturamento de R$ 50.000,00 foi atingida com 5 dias de antecedência',
    dados: { meta: 50000, atual: 52300, diasRestantes: 5 },
    lida: false,
    arquivada: false,
    favorita: true,
    criadaEm: new Date(Date.now() - 900000), // 15 min atrás
    remetente: { nome: 'Dashboard Analytics', tipo: 'sistema' }
  },
  {
    id: '5',
    tipo: 'workflow_executado',
    prioridade: 'media',
    titulo: 'Workflow de cobrança executado',
    mensagem: '3 emails de cobrança foram enviados automaticamente',
    dados: { workflowNome: 'Cobrança Automática - 3 Dias', execucoes: 3 },
    lida: true,
    arquivada: false,
    favorita: false,
    criadaEm: new Date(Date.now() - 3600000), // 1 hora atrás
    remetente: { nome: 'Automação de Workflows', tipo: 'workflow' }
  }
];

const CONFIG_INICIAL: ConfigNotificacao = {
  tipos: {
    fatura_vencendo: true,
    pagamento_recebido: true,
    cliente_inadimplente: true,
    meta_atingida: true,
    sistema_alerta: true,
    workflow_executado: false,
    relatorio_disponivel: true,
    backup_concluido: false
  },
  prioridades: {
    baixa: true,
    media: true,
    alta: true,
    critica: true
  },
  horarioSilencioso: {
    ativo: false,
    inicio: '22:00',
    fim: '07:00'
  },
  gruposPorTipo: true,
  limiteHistorico: 100,
  somAtivo: true,
  emailAtivo: false,
  pushAtivo: true
};

export default function NotificacoesInteligentes({ faturas, onAcaoNotificacao }: NotificacoesInteligentesProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_MOCKADAS);
  const [config, setConfig] = useState<ConfigNotificacao>(CONFIG_INICIAL);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'favoritas' | 'arquivadas'>('todas');
  const [busca, setBusca] = useState('');
  const [modalConfig, setModalConfig] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<Notificacao | null>(null);

  // Simula chegada de novas notificações
  useEffect(() => {
    const interval = setInterval(() => {
      // Simula 30% de chance de nova notificação a cada 30 segundos
      if (Math.random() < 0.3) {
        const tiposDisponiveis: TipoNotificacao[] = ['fatura_vencendo', 'pagamento_recebido', 'sistema_alerta'];
        const tipo = tiposDisponiveis[Math.floor(Math.random() * tiposDisponiveis.length)];

        const novaNotificacao: Notificacao = {
          id: Date.now().toString(),
          tipo,
          prioridade: 'media',
          titulo: `Nova notificação: ${tipo}`,
          mensagem: `Notificação simulada do tipo ${tipo}`,
          lida: false,
          arquivada: false,
          favorita: false,
          criadaEm: new Date(),
          remetente: { nome: 'Sistema', tipo: 'sistema' }
        };

        setNotificacoes(prev => [novaNotificacao, ...prev.slice(0, 49)]);

        // Toca som se habilitado
        if (config.somAtivo) {
          // Aqui você adicionaria o código para tocar um som
          console.log('🔊 Nova notificação recebida!');
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [config.somAtivo]);

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev => prev.map(n =>
      n.id === id ? { ...n, lida: true } : n
    ));
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const toggleFavorita = (id: string) => {
    setNotificacoes(prev => prev.map(n =>
      n.id === id ? { ...n, favorita: !n.favorita } : n
    ));
  };

  const arquivar = (id: string) => {
    setNotificacoes(prev => prev.map(n =>
      n.id === id ? { ...n, arquivada: true } : n
    ));
  };

  const excluir = (id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  };

  const executarAcao = async (acao: AcaoNotificacao, notificacao: Notificacao) => {
    try {
      await onAcaoNotificacao(acao.acao, {
        ...acao.parametros,
        notificacaoId: notificacao.id,
        dadosNotificacao: notificacao.dados
      });
      marcarComoLida(notificacao.id);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeNotificacao) => {
    switch (prioridade) {
      case 'baixa': return 'border-l-gray-400 bg-gray-50';
      case 'media': return 'border-l-blue-400 bg-blue-50';
      case 'alta': return 'border-l-yellow-400 bg-yellow-50';
      case 'critica': return 'border-l-red-400 bg-red-50';
    }
  };

  const getTipoIcon = (tipo: TipoNotificacao) => {
    switch (tipo) {
      case 'fatura_vencendo': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'pagamento_recebido': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cliente_inadimplente': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'meta_atingida': return <Star className="w-5 h-5 text-purple-600" />;
      case 'sistema_alerta': return <Info className="w-5 h-5 text-blue-600" />;
      case 'workflow_executado': return <Settings className="w-5 h-5 text-gray-600" />;
      case 'relatorio_disponivel': return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'backup_concluido': return <Archive className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const notificacoesFiltradas = notificacoes.filter(notificacao => {
    // Filtro por status
    if (filtro === 'nao_lidas' && notificacao.lida) return false;
    if (filtro === 'favoritas' && !notificacao.favorita) return false;
    if (filtro === 'arquivadas' && !notificacao.arquivada) return false;
    if (filtro === 'todas' && notificacao.arquivada) return false;

    // Filtro por busca
    if (busca && !notificacao.titulo.toLowerCase().includes(busca.toLowerCase()) &&
      !notificacao.mensagem.toLowerCase().includes(busca.toLowerCase())) {
      return false;
    }

    // Filtro por configuração de tipos
    if (!config.tipos[notificacao.tipo]) return false;
    if (!config.prioridades[notificacao.prioridade]) return false;

    return true;
  });

  const contadorNaoLidas = notificacoes.filter(n => !n.lida && !n.arquivada).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notificações Inteligentes</h2>
              <p className="text-gray-600">Central de alertas e notificações em tempo real</p>
            </div>
            {contadorNaoLidas > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {contadorNaoLidas}
              </span>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button
              onClick={marcarTodasComoLidas}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Marcar todas como lidas
            </button>
            <button
              onClick={() => setModalConfig(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas as notificações</option>
            <option value="nao_lidas">Não lidas ({contadorNaoLidas})</option>
            <option value="favoritas">Favoritas</option>
            <option value="arquivadas">Arquivadas</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {filtro === 'todas' && 'Todas as Notificações'}
            {filtro === 'nao_lidas' && `Não Lidas (${contadorNaoLidas})`}
            {filtro === 'favoritas' && 'Favoritas'}
            {filtro === 'arquivadas' && 'Arquivadas'}
          </h3>
        </div>

        {notificacoesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
            <p className="text-gray-600">
              {filtro === 'nao_lidas' ? 'Todas as notificações foram lidas!' : 'Não há notificações para exibir.'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notificacoesFiltradas.map(notificacao => (
              <div
                key={notificacao.id}
                className={`p-6 border-l-4 ${getPrioridadeColor(notificacao.prioridade)} ${!notificacao.lida ? 'bg-blue-25' : ''
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTipoIcon(notificacao.tipo)}
                      <h4 className={`font-medium ${!notificacao.lida ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                        {notificacao.titulo}
                      </h4>
                      {!notificacao.lida && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      {notificacao.favorita && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    <p className="text-gray-600 mb-3">{notificacao.mensagem}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span>{notificacao.criadaEm.toLocaleString('pt-BR')}</span>
                      {notificacao.remetente && (
                        <span>• {notificacao.remetente.nome}</span>
                      )}
                      <span className="capitalize">• {notificacao.prioridade}</span>
                    </div>

                    {/* Ações da Notificação */}
                    {notificacao.acoes && notificacao.acoes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {notificacao.acoes.map(acao => (
                          <button
                            key={acao.id}
                            onClick={() => executarAcao(acao, notificacao)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${acao.tipo === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                acao.tipo === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                                  'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            {acao.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações de Gerenciamento */}
                  <div className="flex items-center gap-2 ml-4">
                    {!notificacao.lida && (
                      <button
                        onClick={() => marcarComoLida(notificacao.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Marcar como lida"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => toggleFavorita(notificacao.id)}
                      className={`p-2 rounded-lg transition-colors ${notificacao.favorita
                          ? 'text-yellow-500 hover:bg-yellow-50'
                          : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      title={notificacao.favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star className={`w-4 h-4 ${notificacao.favorita ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => arquivar(notificacao.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Arquivar"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => excluir(notificacao.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Configuração */}
      {modalConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Configurações de Notificação</h3>
                <button
                  onClick={() => setModalConfig(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Tipos de Notificação */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tipos de Notificação</h4>
                <div className="space-y-2">
                  {Object.entries(config.tipos).map(([tipo, ativo]) => (
                    <label key={tipo} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          tipos: { ...prev.tipos, [tipo]: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      <span className="capitalize">{tipo.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Configurações de Som */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Preferências de Notificação</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.somAtivo}
                      onChange={(e) => setConfig(prev => ({ ...prev, somAtivo: e.target.checked }))}
                      className="rounded"
                    />
                    <Volume2 className="w-4 h-4" />
                    <span>Som de notificação</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.emailAtivo}
                      onChange={(e) => setConfig(prev => ({ ...prev, emailAtivo: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Notificações por email</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.pushAtivo}
                      onChange={(e) => setConfig(prev => ({ ...prev, pushAtivo: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Notificações push</span>
                  </label>
                </div>
              </div>

              {/* Horário Silencioso */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Horário Silencioso</h4>
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={config.horarioSilencioso.ativo}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      horarioSilencioso: { ...prev.horarioSilencioso, ativo: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span>Ativar horário silencioso</span>
                </label>

                {config.horarioSilencioso.ativo && (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={config.horarioSilencioso.inicio}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        horarioSilencioso: { ...prev.horarioSilencioso, inicio: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={config.horarioSilencioso.fim}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        horarioSilencioso: { ...prev.horarioSilencioso, fim: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalConfig(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setModalConfig(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
