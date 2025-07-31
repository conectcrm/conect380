import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Progress
} from '../../components/ui';
import { useEmpresas } from '../../contexts/EmpresaContextAPIReal';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface RelatoriosAnalyticsPageProps {
  empresaId?: string;
}

export const RelatoriosAnalyticsPage: React.FC<RelatoriosAnalyticsPageProps> = ({ empresaId }) => {
  const { empresas, empresaAtiva, getEstatisticas } = useEmpresas();
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano'>('mes');
  const [activeTab, setActiveTab] = useState('overview');
  const [estatisticas, setEstatisticas] = useState<any>(null);

  // Empresa para relatórios (passada por parâmetro ou empresa ativa)
  const empresa = empresas.find(e => e.id === empresaId) || empresaAtiva;

  // Carregar estatísticas
  useEffect(() => {
    if (empresa) {
      loadEstatisticas();
    }
  }, [empresa, periodo]);

  const loadEstatisticas = async () => {
    if (!empresa) return;

    try {
      setLoading(true);
      const stats = await getEstatisticas(empresa.id, periodo);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dados mock para demonstração (serão substituídos pelas estatísticas reais)
  const dadosVendas = [
    { mes: 'Jan', vendas: 12000, meta: 15000, clientes: 25 },
    { mes: 'Fev', vendas: 15000, meta: 15000, clientes: 30 },
    { mes: 'Mar', vendas: 18000, meta: 15000, clientes: 35 },
    { mes: 'Abr', vendas: 22000, meta: 20000, clientes: 42 },
    { mes: 'Mai', vendas: 19000, meta: 20000, clientes: 38 },
    { mes: 'Jun', vendas: 25000, meta: 20000, clientes: 48 }
  ];

  const dadosConversao = [
    { nome: 'Leads Qualificados', valor: 245, percentual: 85 },
    { nome: 'Propostas Enviadas', valor: 180, percentual: 73 },
    { nome: 'Propostas Aprovadas', valor: 95, percentual: 53 },
    { nome: 'Contratos Fechados', valor: 67, percentual: 70 }
  ];

  const dadosOrigem = [
    { nome: 'Website', valor: 145, cor: '#3b82f6' },
    { nome: 'Indicação', valor: 89, cor: '#10b981' },
    { nome: 'Redes Sociais', valor: 67, cor: '#f59e0b' },
    { nome: 'Email Marketing', valor: 45, cor: '#ef4444' },
    { nome: 'Outros', valor: 23, cor: '#8b5cf6' }
  ];

  const dadosPerformanceUsuarios = [
    { usuario: 'João Silva', vendas: 12, meta: 15, conversao: 68 },
    { usuario: 'Maria Santos', vendas: 18, meta: 15, conversao: 82 },
    { usuario: 'Pedro Costa', vendas: 9, meta: 12, conversao: 55 },
    { usuario: 'Ana Lima', vendas: 14, meta: 15, conversao: 71 }
  ];

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma empresa selecionada</h3>
          <p className="text-gray-600">Selecione uma empresa para visualizar os relatórios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Relatórios e Analytics - {empresa.nome}
          </h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada de performance e resultados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={(value: any) => setPeriodo(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Últimos 30 dias</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Total</p>
                <p className="text-2xl font-bold text-gray-900">R$ 125.420</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novos Clientes</p>
                <p className="text-2xl font-bold text-gray-900">48</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.7%</span>
                  <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Propostas Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">67</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-3.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">23.4%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+5.1%</span>
                  <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="vendas" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="propostas" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Propostas
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Vendas vs Meta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Vendas vs Meta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosVendas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                    <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funil de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dadosConversao.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.valor}</span>
                        <Badge variant={item.percentual >= 70 ? "default" : "secondary"}>
                          {item.percentual}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={item.percentual} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Origem dos Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Origem dos Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPieChart data={dadosOrigem} cx="50%" cy="50%" outerRadius={100}>
                      {dadosOrigem.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {dadosOrigem.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.cor }}
                        />
                        <span className="text-sm font-medium">{item.nome}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.valor} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Vendas */}
        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução das Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Area
                    type="monotone"
                    dataKey="vendas"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Métricas de Vendas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Ticket Médio</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">R$ 2.847</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+15.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Tempo Médio de Fechamento</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">18 dias</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowDownRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">-2 dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Vendas Recorrentes</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">67%</p>
                  <div className="flex items-center justify-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Novos Clientes por Mês */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Novos Clientes por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosVendas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="clientes"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segmentação de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Segmentação de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pessoa Física</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
                      </div>
                      <span className="text-sm text-gray-600">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pessoa Jurídica</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
                      </div>
                      <span className="text-sm text-gray-600">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top 10 Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{item}</span>
                      </div>
                      <div>
                        <p className="font-medium">Cliente Exemplo {item}</p>
                        <p className="text-sm text-gray-600">cliente{item}@exemplo.com</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {(12000 - item * 1000).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{15 - item} compras</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Propostas */}
        <TabsContent value="propostas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Propostas Enviadas</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">67</p>
                  <p className="text-sm text-gray-600 mt-1">Este mês</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Taxa de Aprovação</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">23.4%</p>
                  <p className="text-sm text-gray-600 mt-1">vs 19.8% mês anterior</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Valor Médio</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">R$ 3.247</p>
                  <p className="text-sm text-gray-600 mt-1">Por proposta</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status das Propostas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Status das Propostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-800">23</p>
                      <p className="text-sm text-yellow-600">Pendentes</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-800">18</p>
                      <p className="text-sm text-blue-600">Em análise</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-800">26</p>
                      <p className="text-sm text-green-600">Aprovadas</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-800">12</p>
                      <p className="text-sm text-red-600">Rejeitadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Performance por Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dadosPerformanceUsuarios.map((usuario, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-600">
                          {usuario.usuario.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{usuario.usuario}</p>
                        <p className="text-sm text-gray-600">
                          {usuario.vendas} de {usuario.meta} vendas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Conversão</p>
                        <p className="font-medium">{usuario.conversao}%</p>
                      </div>

                      <div className="w-32">
                        <Progress value={(usuario.vendas / usuario.meta) * 100} />
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {Math.round((usuario.vendas / usuario.meta) * 100)}% da meta
                        </p>
                      </div>

                      <Badge
                        variant={usuario.vendas >= usuario.meta ? "default" : "secondary"}
                      >
                        {usuario.vendas >= usuario.meta ? "Meta atingida" : "Abaixo da meta"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Performance Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Produtividade</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">87%</p>
                  <p className="text-sm text-gray-600 mt-1">Média da equipe</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Atividades/Dia</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">23</p>
                  <p className="text-sm text-gray-600 mt-1">Por usuário</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Tempo no Sistema</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">6.2h</p>
                  <p className="text-sm text-gray-600 mt-1">Média diária</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Satisfação</h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">4.8/5</p>
                  <p className="text-sm text-gray-600 mt-1">Avaliação média</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
