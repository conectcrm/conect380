import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Settings,
  Package,
  Layers,
  Users,
  BarChart3,
  Shield,
  DollarSign,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { PlanosAdmin } from './PlanosAdmin';
import { ModulosAdmin } from './ModulosAdmin';

type TabAtiva = 'dashboard' | 'planos' | 'modulos';

interface AdminDashboardProps {
  onBack?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('dashboard');

  const estatisticas = [
    {
      titulo: 'Planos Ativos',
      valor: '4',
      icone: Package,
      cor: 'text-blue-600',
      bgCor: 'bg-blue-100',
    },
    {
      titulo: 'Módulos Disponíveis',
      valor: '12',
      icone: Layers,
      cor: 'text-green-600',
      bgCor: 'bg-green-100',
    },
    {
      titulo: 'Empresas Assinantes',
      valor: '156',
      icone: Users,
      cor: 'text-purple-600',
      bgCor: 'bg-purple-100',
    },
    {
      titulo: 'Receita Mensal',
      valor: 'R$ 47.850',
      icone: DollarSign,
      cor: 'text-yellow-600',
      bgCor: 'bg-yellow-100',
    },
  ];

  const atividades = [
    {
      tipo: 'plano_criado',
      descricao: 'Novo plano "Enterprise Plus" criado',
      timestamp: '2 horas atrás',
      icone: Package,
      cor: 'text-green-600',
    },
    {
      tipo: 'modulo_atualizado',
      descricao: 'Módulo "Relatórios" atualizado',
      timestamp: '4 horas atrás',
      icone: Layers,
      cor: 'text-blue-600',
    },
    {
      tipo: 'empresa_subscrita',
      descricao: 'Nova empresa assinou plano Professional',
      timestamp: '6 horas atrás',
      icone: Users,
      cor: 'text-purple-600',
    },
    {
      tipo: 'pagamento_recebido',
      descricao: 'Pagamento de R$ 299,90 processado',
      timestamp: '1 dia atrás',
      icone: DollarSign,
      cor: 'text-yellow-600',
    },
  ];

  const tabs = [
    {
      id: 'dashboard' as TabAtiva,
      label: 'Dashboard',
      icone: BarChart3,
      descricao: 'Visão geral do sistema',
    },
    {
      id: 'planos' as TabAtiva,
      label: 'Planos',
      icone: Package,
      descricao: 'Gerenciar planos de assinatura',
    },
    {
      id: 'modulos' as TabAtiva,
      label: 'Módulos',
      icone: Layers,
      descricao: 'Configurar módulos do sistema',
    },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {estatisticas.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
                </div>
                <div className={`${stat.bgCor} p-3 rounded-full`}>
                  <stat.icone className={`h-6 w-6 ${stat.cor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {atividades.map((atividade, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="bg-gray-100 p-2 rounded-full">
                  <atividade.icone className={`h-4 w-4 ${atividade.cor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{atividade.descricao}</p>
                  <p className="text-xs text-gray-500">{atividade.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ações Administrativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setTabAtiva('planos')}
              className="justify-start h-auto p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              variant="outline"
            >
              <Package className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Gerenciar Planos</div>
                <div className="text-xs opacity-75">Criar, editar e configurar planos</div>
              </div>
            </Button>

            <Button
              onClick={() => setTabAtiva('modulos')}
              className="justify-start h-auto p-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              variant="outline"
            >
              <Layers className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Configurar Módulos</div>
                <div className="text-xs opacity-75">Adicionar e organizar módulos</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConteudo = () => {
    switch (tabAtiva) {
      case 'planos':
        return <PlanosAdmin />;
      case 'modulos':
        return <ModulosAdmin />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {onBack && (
              <Button onClick={onBack} variant="outline" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <div className="bg-blue-600 p-3 rounded-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administração</h1>
              <p className="text-gray-600">Configure planos, módulos e gerencie o sistema</p>
            </div>
          </div>

          {/* Navegação por Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabAtiva(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      tabAtiva === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icone
                    className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors
                    ${tabAtiva === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  />
                  <span>{tab.label}</span>
                  {tabAtiva === tab.id && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                      Ativo
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo */}
        {renderConteudo()}
      </div>
    </div>
  );
};
