import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { iaService } from '../../services/iaService';

interface MetricasIA {
  totalPerguntas: number;
  respostasComSucesso: number;
  transferenciasParaAgente: number;
  satisfacaoMedia: number;
  taxaSucesso: number;
  taxaTransferencia: number;
  sessoesAtivas: number;
}

export const MetricasSuporteIA: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [perguntasFrequentes, setPerguntasFrequentes] = useState<any[]>([]);
  const [intervaloAtualizacao, setIntervaloAtualizacao] = useState<'realtime' | '5min' | '1hour'>('realtime');

  useEffect(() => {
    carregarMetricas();
    carregarPerguntasFrequentes();

    // Atualização automática baseada no intervalo
    let interval: NodeJS.Timeout;
    
    if (intervaloAtualizacao === 'realtime') {
      interval = setInterval(carregarMetricas, 5000); // 5 segundos
    } else if (intervaloAtualizacao === '5min') {
      interval = setInterval(carregarMetricas, 5 * 60 * 1000); // 5 minutos
    } else if (intervaloAtualizacao === '1hour') {
      interval = setInterval(carregarMetricas, 60 * 60 * 1000); // 1 hora
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [intervaloAtualizacao]);

  const carregarMetricas = async () => {
    try {
      setLoading(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const metricasIA = iaService.obterMetricas();
      setMetricas(metricasIA);
    } catch (error) {
      console.error('Erro ao carregar métricas da IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarPerguntasFrequentes = () => {
    const perguntas = iaService.obterPerguntasFrequentes();
    setPerguntasFrequentes(perguntas);
  };

  const formatarNumero = (numero: number): string => {
    if (numero >= 1000) {
      return `${(numero / 1000).toFixed(1)}k`;
    }
    return numero.toString();
  };

  const formatarPorcentagem = (valor: number): string => {
    return `${valor.toFixed(1)}%`;
  };

  if (loading && !metricas) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Métricas da IA de Suporte</h2>
              <p className="text-sm text-gray-600">Desempenho e eficiência do assistente virtual</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={intervaloAtualizacao}
              onChange={(e) => setIntervaloAtualizacao(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="realtime">Tempo Real</option>
              <option value="5min">5 minutos</option>
              <option value="1hour">1 hora</option>
            </select>
            
            <button
              onClick={carregarMetricas}
              className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2 text-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Perguntas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Perguntas</p>
              <p className="text-2xl font-bold text-gray-900">{formatarNumero(metricas?.totalPerguntas || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+12% hoje</span>
          </div>
        </div>

        {/* Taxa de Sucesso */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">{formatarPorcentagem(metricas?.taxaSucesso || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Meta: 85%</span>
          </div>
        </div>

        {/* Transferências */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Transferência</p>
              <p className="text-2xl font-bold text-gray-900">{formatarPorcentagem(metricas?.taxaTransferencia || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">{metricas?.transferenciasParaAgente || 0} hoje</span>
          </div>
        </div>

        {/* Satisfação */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
              <p className="text-2xl font-bold text-gray-900">{(metricas?.satisfacaoMedia || 0).toFixed(1)}/5</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-3 h-3 rounded-full ${
                    star <= (metricas?.satisfacaoMedia || 0) ? 'bg-yellow-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">Muito bom</span>
          </div>
        </div>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Categorias */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Categorias Mais Consultadas</h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            {[
              { categoria: 'Clientes', porcentagem: 35, cor: 'bg-blue-500' },
              { categoria: 'Propostas', porcentagem: 28, cor: 'bg-green-500' },
              { categoria: 'Agenda', porcentagem: 20, cor: 'bg-purple-500' },
              { categoria: 'Dashboard', porcentagem: 10, cor: 'bg-orange-500' },
              { categoria: 'Problemas', porcentagem: 7, cor: 'bg-red-500' }
            ].map((item) => (
              <div key={item.categoria} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${item.cor}`} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.categoria}</span>
                  <span className="text-sm font-medium text-gray-900">{item.porcentagem}%</span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.cor}`}
                    style={{ width: `${item.porcentagem}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horários de Pico */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Horários de Maior Uso</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-3">
            {[
              { horario: '09:00 - 10:00', atividade: 85 },
              { horario: '14:00 - 15:00', atividade: 72 },
              { horario: '11:00 - 12:00', atividade: 68 },
              { horario: '16:00 - 17:00', atividade: 55 },
              { horario: '08:00 - 09:00', atividade: 42 }
            ].map((item) => (
              <div key={item.horario} className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.horario}</span>
                  <span className="text-sm font-medium text-gray-900">{item.atividade}%</span>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-[#159A9C]"
                    style={{ width: `${item.atividade}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perguntas Frequentes por Categoria */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Perguntas Mais Frequentes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {perguntasFrequentes.map((categoria) => (
            <div key={categoria.categoria} className="space-y-3">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                {categoria.categoria}
              </h4>
              <div className="space-y-2">
                {categoria.perguntas.map((pergunta: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-[#159A9C] rounded-full" />
                    <span>{pergunta}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status da IA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900">IA Online e Operacional</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Sessões ativas: {metricas?.sessoesAtivas || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
