import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, DollarSign, Calendar, Users, Zap } from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorCompletoBRL, converterParaNumero } from '../../utils/formatacao';

interface PrevisaoIA {
  proximoMes: {
    faturamentoEstimado: number;
    confianca: number;
    tendencia: 'alta' | 'baixa' | 'estavel';
  };
  inadimplencia: {
    riscoPorcentagem: number;
    faturas: Fatura[];
    acoesSugeridas: string[];
  };
  oportunidades: {
    melhorDiaCobranca: number;
    clientesPropensos: string[];
    valorPotencial: number;
  };
}

interface AlertaInteligente {
  id: string;
  tipo: 'critico' | 'atencao' | 'oportunidade';
  titulo: string;
  descricao: string;
  acao: string;
  impacto: number; // valor monetário
  prioridade: 1 | 2 | 3;
}

interface DashboardIAProps {
  faturas: Fatura[];
  onExecutarAcao: (acao: string, dados: any) => void;
}

export default function DashboardIA({ faturas, onExecutarAcao }: DashboardIAProps) {
  const [previsoes, setPrevisoes] = useState<PrevisaoIA | null>(null);
  const [alertas, setAlertas] = useState<AlertaInteligente[]>([]);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [modoAvancado, setModoAvancado] = useState(false);

  // Simula análise de IA/ML
  const processarAnaliseIA = async () => {
    setCarregandoIA(true);

    // Simula processamento de ML
    await new Promise(resolve => setTimeout(resolve, 2000));

    const faturasPagas = faturas.filter(f => f.status === StatusFatura.PAGA);
    const faturasVencidas = faturas.filter(f => {
      const dataVencimento = new Date(f.dataVencimento);
      return dataVencimento < new Date() && f.status !== StatusFatura.PAGA;
    });

    const faturamentoMedio = faturasPagas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0) / Math.max(faturasPagas.length, 1);
    const taxaInadimplencia = (faturasVencidas.length / Math.max(faturas.length, 1)) * 100;

    // Simula previsões baseadas em padrões históricos
    const previsao: PrevisaoIA = {
      proximoMes: {
        faturamentoEstimado: faturamentoMedio * faturas.length * 1.15, // Crescimento de 15%
        confianca: 85,
        tendencia: faturamentoMedio > 50000 ? 'alta' : 'estavel'
      },
      inadimplencia: {
        riscoPorcentagem: taxaInadimplencia,
        faturas: faturasVencidas.slice(0, 5),
        acoesSugeridas: [
          'Enviar cobrança personalizada para clientes com maior valor em atraso',
          'Ofertar desconto de 5% para pagamento à vista',
          'Implementar parcelamento para valores acima de R$ 1.000'
        ]
      },
      oportunidades: {
        melhorDiaCobranca: 15, // Dia do mês com maior taxa de conversão
        clientesPropensos: ['Empresa ABC', 'Tech Solutions', 'Marketing Pro'],
        valorPotencial: faturamentoMedio * 2.3
      }
    };

    setPrevisoes(previsao);

    // Gera alertas inteligentes
    const novosAlertas: AlertaInteligente[] = [
      {
        id: '1',
        tipo: 'critico',
        titulo: 'Alto Risco de Inadimplência',
        descricao: `${faturasVencidas.length} faturas vencidas representam ${taxaInadimplencia.toFixed(1)}% do total`,
        acao: 'executar_cobranca_automatica',
        impacto: faturasVencidas.reduce((acc, f) => acc + converterParaNumero(f.valorTotal), 0),
        prioridade: 1
      },
      {
        id: '2',
        tipo: 'oportunidade',
        titulo: 'Oportunidade de Cross-selling',
        descricao: '3 clientes têm potencial para upgrade de plano',
        acao: 'enviar_proposta_upgrade',
        impacto: 15000,
        prioridade: 2
      },
      {
        id: '3',
        tipo: 'atencao',
        titulo: 'Padrão Sazonal Detectado',
        descricao: 'Faturamento tende a cair 20% no próximo mês',
        acao: 'campanha_promocional',
        impacto: faturamentoMedio * 0.2,
        prioridade: 2
      }
    ];

    setAlertas(novosAlertas);
    setCarregandoIA(false);
  };

  useEffect(() => {
    if (faturas.length > 0) {
      processarAnaliseIA();
    }
  }, [faturas]);

  const getCorAlerta = (tipo: string) => {
    switch (tipo) {
      case 'critico': return 'border-red-500 bg-red-50';
      case 'atencao': return 'border-yellow-500 bg-yellow-50';
      case 'oportunidade': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getIconeAlerta = (tipo: string) => {
    switch (tipo) {
      case 'critico': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'atencao': return <Calendar className="w-5 h-5 text-yellow-600" />;
      case 'oportunidade': return <Target className="w-5 h-5 text-green-600" />;
      default: return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  if (carregandoIA) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
            <div className="ml-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">IA Analisando Dados</h3>
          <p className="text-gray-600">Processando padrões e gerando insights inteligentes...</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header IA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-semibold">Dashboard Inteligente</h2>
              <p className="text-blue-100">Insights gerados por IA para otimizar seu faturamento</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModoAvancado(!modoAvancado)}
              className={`px-4 py-2 rounded-lg transition-colors ${modoAvancado ? 'bg-white text-blue-600' : 'bg-blue-700 text-white'
                }`}
            >
              {modoAvancado ? 'Modo Simples' : 'Modo Avançado'}
            </button>
            <button
              onClick={processarAnaliseIA}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Atualizar IA
            </button>
          </div>
        </div>
      </div>

      {/* Previsões Principais */}
      {previsoes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Previsão de Faturamento */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Previsão Próximo Mês</h3>
                <p className="text-sm text-gray-600">Confiança: {previsoes.proximoMes.confianca}%</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatarValorCompletoBRL(previsoes.proximoMes.faturamentoEstimado)}
            </div>
            <div className="flex items-center gap-2">
              {previsoes.proximoMes.tendencia === 'alta' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${previsoes.proximoMes.tendencia === 'alta' ? 'text-green-600' : 'text-red-600'}`}>
                Tendência {previsoes.proximoMes.tendencia}
              </span>
            </div>
          </div>

          {/* Análise de Inadimplência */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Risco de Inadimplência</h3>
                <p className="text-sm text-gray-600">{previsoes.inadimplencia.faturas.length} faturas em risco</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">
              {previsoes.inadimplencia.riscoPorcentagem.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${Math.min(previsoes.inadimplencia.riscoPorcentagem, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Oportunidades */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Oportunidades</h3>
                <p className="text-sm text-gray-600">Potencial identificado</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {formatarValorCompletoBRL(previsoes.oportunidades.valorPotencial)}
            </div>
            <div className="text-sm text-gray-600">
              Melhor dia para cobrança: <span className="font-semibold">{previsoes.oportunidades.melhorDiaCobranca}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alertas Inteligentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Alertas Inteligentes</h3>
        </div>

        <div className="space-y-4">
          {alertas.map(alerta => (
            <div
              key={alerta.id}
              className={`border-l-4 rounded-lg p-4 ${getCorAlerta(alerta.tipo)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getIconeAlerta(alerta.tipo)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{alerta.titulo}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alerta.descricao}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Impacto: {formatarValorCompletoBRL(alerta.impacto)}</span>
                      <span>Prioridade: {alerta.prioridade}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onExecutarAcao(alerta.acao, { alertaId: alerta.id })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${alerta.tipo === 'critico'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : alerta.tipo === 'oportunidade'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                >
                  Executar Ação
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Avançados */}
      {modoAvancado && previsoes && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações Sugeridas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Sugeridas pela IA</h3>
            <div className="space-y-3">
              {previsoes.inadimplencia.acoesSugeridas.map((acao, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{acao}</p>
                  <button
                    onClick={() => onExecutarAcao('implementar_sugestao', { acao, index })}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Implementar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes Estratégicos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes Estratégicos</h3>
            <div className="space-y-3">
              {previsoes.oportunidades.clientesPropensos.map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 font-medium">+87% propensão</span>
                    <button
                      onClick={() => onExecutarAcao('abordar_cliente', { cliente })}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      Abordar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
