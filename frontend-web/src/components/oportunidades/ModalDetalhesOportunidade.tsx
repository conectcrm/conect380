import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Calendar,
  DollarSign,
  Users,
  Phone,
  Mail,
  Building,
  Tag,
  TrendingUp,
  Clock,
  MessageSquare,
  FileText,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Send,
  User,
  Copy,
} from 'lucide-react';
import {
  Oportunidade,
  Atividade,
  EstagioOportunidade,
  PrioridadeOportunidade,
} from '../../types/oportunidades';
import { oportunidadesService } from '../../services/oportunidadesService';
import { differenceInDays } from 'date-fns';

interface ModalDetalhesOportunidadeProps {
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onEditar: (oportunidade: Oportunidade) => void;
  onClonar?: (oportunidade: Oportunidade) => void;
}

const ModalDetalhesOportunidade: React.FC<ModalDetalhesOportunidadeProps> = ({
  oportunidade,
  onClose,
  onEditar,
  onClonar,
}) => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<'detalhes' | 'atividades'>('detalhes');

  useEffect(() => {
    if (oportunidade?.id) {
      carregarAtividades();
    }
  }, [oportunidade?.id]);

  const carregarAtividades = async () => {
    if (!oportunidade) return;

    try {
      setLoadingAtividades(true);
      const dados = await oportunidadesService.listarAtividades(oportunidade.id);
      setAtividades(dados);
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setLoadingAtividades(false);
    }
  };

  if (!oportunidade) return null;

  // Calcular dias até vencimento
  const diasAteVencimento = oportunidade.dataFechamentoEsperado
    ? differenceInDays(new Date(oportunidade.dataFechamentoEsperado), new Date())
    : null;

  // Cor da probabilidade
  const prob = oportunidade.probabilidade || 0;
  const probColor =
    prob <= 20
      ? 'bg-red-100 text-red-700 border-red-200'
      : prob <= 40
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : prob <= 60
          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
          : prob <= 80
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-green-200 text-green-800 border-green-300';
  const probEmoji =
    prob <= 20 ? '❄️' : prob <= 40 ? '🌤️' : prob <= 60 ? '☀️' : prob <= 80 ? '🔥' : '🚀';

  // Ícone por tipo de atividade
  const getIconeAtividade = (tipo: string) => {
    switch (tipo) {
      case 'call':
        return <PhoneCall className="h-4 w-4 text-blue-600" />;
      case 'email':
        return <Send className="h-4 w-4 text-indigo-600" />;
      case 'meeting':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'note':
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
      case 'task':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Nome do estágio em português
  const getNomeEstagio = (estagio: EstagioOportunidade) => {
    const estagios = {
      [EstagioOportunidade.LEADS]: 'Leads',
      [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
      [EstagioOportunidade.PROPOSTA]: 'Proposta',
      [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
      [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
      [EstagioOportunidade.GANHO]: 'Ganho',
      [EstagioOportunidade.PERDIDO]: 'Perdido',
    };
    return estagios[estagio] || estagio;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: Date | string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[calc(100%-2rem)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] px-6 py-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <TrendingUp className="h-7 w-7" />
              {oportunidade.titulo}
            </h2>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {oportunidade.responsavel?.nome || 'Sem responsável'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Criado em {new Date(oportunidade.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEditar(oportunidade);
                onClose();
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Editar"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            {onClonar && (
              <button
                onClick={() => {
                  onClonar(oportunidade);
                  onClose();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Duplicar"
              >
                <Copy className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="border-b bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setAbaSelecionada('detalhes')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                abaSelecionada === 'detalhes'
                  ? 'border-[#159A9C] text-[#159A9C] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setAbaSelecionada('atividades')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                abaSelecionada === 'atividades'
                  ? 'border-[#159A9C] text-[#159A9C] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Atividades
              {atividades.length > 0 && (
                <span className="px-2 py-0.5 bg-[#159A9C] text-white text-xs rounded-full font-semibold">
                  {atividades.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {abaSelecionada === 'detalhes' ? (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Valor */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm font-medium">Valor</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatarMoeda(Number(oportunidade.valor || 0))}
                  </p>
                </div>

                {/* Probabilidade */}
                <div className={`border rounded-xl p-4 ${probColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Probabilidade</span>
                  </div>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <span>{probEmoji}</span>
                    <span>{oportunidade.probabilidade}%</span>
                  </p>
                </div>

                {/* Estágio */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Estágio</span>
                  </div>
                  <p className="text-xl font-bold text-blue-700">
                    {getNomeEstagio(oportunidade.estagio)}
                  </p>
                </div>
              </div>

              {/* Alerta de SLA */}
              {diasAteVencimento !== null && (
                <>
                  {diasAteVencimento < 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900">Oportunidade Atrasada</h4>
                        <p className="text-red-700 text-sm">
                          Esta oportunidade está atrasada há {Math.abs(diasAteVencimento)} dias
                        </p>
                      </div>
                    </div>
                  )}
                  {diasAteVencimento >= 0 && diasAteVencimento < 7 && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-900">
                          Atenção: Vencimento Próximo
                        </h4>
                        <p className="text-yellow-700 text-sm">
                          Esta oportunidade vence em {diasAteVencimento}{' '}
                          {diasAteVencimento === 1 ? 'dia' : 'dias'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Informações de Contato */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-bold text-[#002333] flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-[#159A9C]" />
                  Informações de Contato
                </h3>

                {oportunidade.nomeContato && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Nome do Contato</p>
                      <p className="font-semibold text-[#002333]">{oportunidade.nomeContato}</p>
                    </div>
                  </div>
                )}

                {oportunidade.empresaContato && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="font-semibold text-[#002333]">{oportunidade.empresaContato}</p>
                    </div>
                  </div>
                )}

                {oportunidade.emailContato && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a
                        href={`mailto:${oportunidade.emailContato}`}
                        className="font-semibold text-[#159A9C] hover:underline"
                      >
                        {oportunidade.emailContato}
                      </a>
                    </div>
                  </div>
                )}

                {oportunidade.telefoneContato && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <a
                        href={`tel:${oportunidade.telefoneContato}`}
                        className="font-semibold text-[#159A9C] hover:underline"
                      >
                        {oportunidade.telefoneContato}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Detalhes Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oportunidade.prioridade && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Prioridade</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          oportunidade.prioridade === PrioridadeOportunidade.ALTA
                            ? 'bg-red-100 text-red-700'
                            : oportunidade.prioridade === PrioridadeOportunidade.MEDIA
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {oportunidade.prioridade === PrioridadeOportunidade.ALTA
                          ? 'Alta'
                          : oportunidade.prioridade === PrioridadeOportunidade.MEDIA
                            ? 'Média'
                            : 'Baixa'}
                      </span>
                    </div>
                  </div>
                )}

                {oportunidade.origem && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Origem</p>
                      <p className="font-semibold text-[#002333] capitalize">
                        {oportunidade.origem}
                      </p>
                    </div>
                  </div>
                )}

                {oportunidade.dataFechamentoEsperado && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#159A9C] mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Data Esperada</p>
                      <p className="font-semibold text-[#002333]">
                        {new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {oportunidade.descricao && (
                <div>
                  <h3 className="text-lg font-bold text-[#002333] mb-3">Descrição</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[#002333]/80 whitespace-pre-wrap">
                      {oportunidade.descricao}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {oportunidade.tags && oportunidade.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#002333] mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-[#159A9C]" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {oportunidade.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-lg text-sm font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Aba de Atividades
            <div>
              <h3 className="text-lg font-bold text-[#002333] mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                Timeline de Atividades
              </h3>

              {loadingAtividades ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C] mx-auto"></div>
                  <p className="text-gray-600 mt-2 text-sm">Carregando atividades...</p>
                </div>
              ) : atividades.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Nenhuma atividade registrada</p>
                  <p className="text-gray-500 text-sm mt-1">
                    As atividades aparecerão aqui conforme forem criadas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {atividades.map((atividade, index) => (
                    <div key={atividade.id} className="flex gap-4">
                      {/* Linha vertical */}
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center shadow-sm">
                          {getIconeAtividade(atividade.tipo)}
                        </div>
                        {index < atividades.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 my-2 min-h-[30px]" />
                        )}
                      </div>

                      {/* Conteúdo da atividade */}
                      <div className="flex-1 pb-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#159A9C]/30 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-[#002333] capitalize">
                                {atividade.tipo.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {atividade.criadoPor?.nome || 'Sistema'} •{' '}
                                {formatarData(atividade.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[#002333]/80 text-sm whitespace-pre-wrap">
                            {atividade.descricao}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onEditar(oportunidade);
              onClose();
            }}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Edit2 className="h-4 w-4" />
            Editar Oportunidade
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalhesOportunidade;
