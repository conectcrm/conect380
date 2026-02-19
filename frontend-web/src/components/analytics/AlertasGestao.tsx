import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  Bell,
  ArrowRight,
} from 'lucide-react';

interface Alerta {
  id: string;
  tipo: 'critico' | 'atencao' | 'oportunidade';
  titulo: string;
  descricao: string;
  quantidade?: number;
  acao_sugerida: string;
  link_acao?: string;
  timestamp: string;
  lido: boolean;
}

interface AlertasGestaoProps {
  onAlertaClick?: (alerta: Alerta) => void;
  maxAlertas?: number;
}

const formatarTipo = (tipo: string) =>
  tipo
    .split('_')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');

const getTituloAlerta = (tipo: string) => {
  switch (tipo) {
    case 'prazo_vencido':
      return 'Propostas sem avanço';
    case 'baixa_conversao':
      return 'Baixa conversão';
    case 'tempo_resposta':
      return 'Tempo de resposta alto';
    default:
      return `Alerta: ${formatarTipo(tipo)}`;
  }
};

const getTituloOportunidade = (tipo: string) => {
  switch (tipo) {
    case 'conversao_leads':
      return 'Leads qualificados para conversão';
    case 'upsell':
      return 'Oportunidades de upsell';
    case 'reengajamento':
      return 'Clientes para reengajar';
    default:
      return `Oportunidade: ${formatarTipo(tipo)}`;
  }
};

const AlertasGestao: React.FC<AlertasGestaoProps> = ({ onAlertaClick, maxAlertas = 5 }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAlertas();

    // Atualizar alertas a cada 5 minutos
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const carregarAlertas = async () => {
    try {
      const response = await fetch('/api/analytics/alertas-gestao', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const alertasCriticos = Array.isArray(data.alertas_criticos) ? data.alertas_criticos : [];
        const alertasAtencao = Array.isArray(data.alertas_atencao) ? data.alertas_atencao : [];
        const oportunidades = Array.isArray(data.oportunidades) ? data.oportunidades : [];

        const todosAlertas: Alerta[] = [
          ...alertasCriticos.map((alerta: any) => ({
            id: `critico-${alerta.tipo}`,
            tipo: 'critico' as const,
            titulo: getTituloAlerta(alerta.tipo),
            descricao: alerta.descricao,
            quantidade: alerta.quantidade,
            acao_sugerida: alerta.acao_sugerida,
            timestamp: new Date().toISOString(),
            lido: false,
          })),
          ...alertasAtencao.map((alerta: any) => ({
            id: `atencao-${alerta.tipo}`,
            tipo: 'atencao' as const,
            titulo: getTituloAlerta(alerta.tipo),
            descricao: alerta.descricao,
            quantidade: alerta.quantidade,
            acao_sugerida: alerta.acao_sugerida,
            timestamp: new Date().toISOString(),
            lido: false,
          })),
          ...oportunidades.map((oportunidade: any) => ({
            id: `oportunidade-${oportunidade.tipo}`,
            tipo: 'oportunidade' as const,
            titulo: getTituloOportunidade(oportunidade.tipo),
            descricao: oportunidade.descricao,
            quantidade: oportunidade.quantidade,
            acao_sugerida:
              oportunidade.acao_sugerida ||
              `Potencial estimado: ${formatarMoeda(oportunidade.potencial_receita || 0)}`,
            timestamp: new Date().toISOString(),
            lido: false,
          })),
        ];

        setAlertas(todosAlertas.slice(0, maxAlertas));
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconeAlerta = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'atencao':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'oportunidade':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCorAlerta = (tipo: string) => {
    switch (tipo) {
      case 'critico':
        return 'border-l-red-500 bg-red-50';
      case 'atencao':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'oportunidade':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const marcarComoLido = (alertaId: string) => {
    setAlertas((prev) =>
      prev.map((alerta) => (alerta.id === alertaId ? { ...alerta, lido: true } : alerta)),
    );
  };

  const handleAlertaClick = (alerta: Alerta) => {
    marcarComoLido(alerta.id);
    onAlertaClick?.(alerta);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarTempo = (timestamp: string) => {
    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h`;
    }
    return `${Math.floor(diffMins / 1440)}d`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Gestão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Gestão
          </div>
          {alertas.filter((a) => !a.lido).length > 0 && (
            <Badge variant="destructive">{alertas.filter((a) => !a.lido).length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">Nenhum alerta no momento</p>
            <p className="text-sm text-gray-500">Tudo funcionando normalmente.</p>
          </div>
        ) : (
          alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`border-l-4 p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${getCorAlerta(
                alerta.tipo,
              )} ${!alerta.lido ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => handleAlertaClick(alerta)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getIconeAlerta(alerta.tipo)}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{alerta.titulo}</h4>
                      {alerta.quantidade && (
                        <Badge variant="outline" className="text-xs">
                          {alerta.quantidade}
                        </Badge>
                      )}
                      {!alerta.lido && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{alerta.descricao}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 italic">Dica: {alerta.acao_sugerida}</p>
                      <span className="text-xs text-gray-500">{formatarTempo(alerta.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}

        {alertas.length > 0 && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('/alertas-completos', '_blank')}
            >
              Ver todos os alertas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertasGestao;
