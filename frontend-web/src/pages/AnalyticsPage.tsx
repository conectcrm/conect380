import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import KpisTempoReal from './KpisTempoReal';
import AlertasGestao from './AlertasGestao';

interface AnalyticsPageProps {
  defaultTab?: string;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  defaultTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleAlertaClick = (alerta: any) => {
    console.log('Alerta clicado:', alerta);

    // Aqui você pode implementar navegação específica baseada no tipo de alerta
    switch (alerta.tipo) {
      case 'critico':
        // Navegar para propostas vencidas
        if (alerta.id.includes('prazo_vencido')) {
          window.open('/propostas?status=vencida', '_blank');
        }
        break;
      case 'atencao':
        // Navegar para propostas pendentes
        window.open('/propostas?status=pendente', '_blank');
        break;
      case 'oportunidade':
        // Navegar para clientes com oportunidades
        window.open('/clientes?oportunidade=upsell', '_blank');
        break;
    }
  };

  const exportarRelatorioCompleto = async () => {
    try {
      const response = await fetch('/api/analytics/export?formato=completo', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-completo-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Relatórios</h1>
            <p className="text-gray-600 mt-1">
              Dashboard completo de performance, métricas e alertas do sistema
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={exportarRelatorioCompleto}
              className="bg-[#159A9C] hover:bg-[#0F7B7D]"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>

            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* KPIs em Tempo Real - Sempre visível */}
        <KpisTempoReal autoRefresh={true} refreshInterval={60000} />

        {/* Alertas de Gestão - Sidebar ou seção destacada */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Tabs principais */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="metas" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Metas & Previsões
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-6">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Detalhada por Vendedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsDashboard />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metas" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Metas e Previsões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Meta Mensal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>Vendas do Mês</span>
                                <span className="font-bold">R$ 450.000</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Meta</span>
                                <span className="font-bold">R$ 500.000</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-[#159A9C] h-3 rounded-full"
                                  style={{ width: '90%' }}
                                ></div>
                              </div>
                              <div className="text-center text-sm text-gray-600">
                                90% da meta - Faltam R$ 50.000
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Previsão de Fechamento</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>Valor Previsto</span>
                                <span className="font-bold text-green-600">R$ 520.000</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Confiança</span>
                                <span className="font-bold">85%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Baseado no pipeline atual e histórico de conversão
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar com Alertas */}
          <div className="lg:col-span-1">
            <AlertasGestao
              onAlertaClick={handleAlertaClick}
              maxAlertas={10}
            />
          </div>
        </div>

        {/* Seção de Insights e Recomendações */}
        <Card className="bg-[#159A9C]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Insights e Recomendações Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">✅ Pontos Fortes</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Taxa de conversão acima da média do setor</li>
                  <li>• Ticket médio crescendo consistentemente</li>
                  <li>• Tempo de resposta excelente (< 2h)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-700">⚠️ Oportunidades</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 12 clientes elegíveis para upsell</li>
                  <li>• Melhorar follow-up em propostas pendentes</li>
                  <li>• Automatizar mais etapas do processo</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-red-700">🎯 Ações Prioritárias</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Revisar 5 propostas com prazo vencido</li>
                  <li>• Treinar vendedores com baixa conversão</li>
                  <li>• Otimizar processo de aprovação</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer com estatísticas gerais */}
        <div className="text-center py-6 border-t">
          <p className="text-gray-600 text-sm">
            Sistema ConectCRM - 100% Automatizado |
            Última atualização: {new Date().toLocaleString('pt-BR')} |
            <span className="text-green-600 font-medium">🟢 Todos os sistemas operacionais</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;


