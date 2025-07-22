import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveDashboardLayout } from '../components/layout/ResponsiveDashboardLayout';
import ClienteModal from '../components/modals/ClienteModal';
import { ModalCadastroProduto } from '../components/modals/ModalCadastroProdutoLandscape';
import { 
  Users, Package, FileText, ShoppingCart, 
  TrendingUp, Target, ArrowRight, Plus,
  CheckCircle, Clock, AlertTriangle, DollarSign,
  Calendar, MessageSquare, Settings, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'current' | 'upcoming';
  action?: string;
  progress?: number;
}

const CentralOperacoesPage: React.FC = () => {
  const navigate = useNavigate();
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Workflow de exemplo para demonstrar o fluxo completo
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'cliente',
      title: 'Cadastrar Cliente',
      description: 'Criar perfil completo do cliente com dados e documentos',
      icon: Users,
      status: 'current',
      action: 'Novo Cliente',
      progress: 75
    },
    {
      id: 'produtos',
      title: 'Configurar Produtos',
      description: 'Definir catálogo de produtos e serviços disponíveis',
      icon: Package,
      status: 'upcoming',
      action: 'Gerenciar Produtos'
    },
    {
      id: 'proposta',
      title: 'Criar Proposta',
      description: 'Montar proposta comercial personalizada',
      icon: FileText,
      status: 'upcoming',
      action: 'Nova Proposta'
    },
    {
      id: 'negociacao',
      title: 'Negociação',
      description: 'Acompanhar o processo de negociação e follow-up',
      icon: MessageSquare,
      status: 'upcoming',
      action: 'Acompanhar'
    },
    {
      id: 'fechamento',
      title: 'Fechamento',
      description: 'Finalizar venda e gerar documentos contratuais',
      icon: CheckCircle,
      status: 'upcoming',
      action: 'Finalizar Venda'
    }
  ];

  // Métricas de exemplo
  const metricas = [
    {
      title: 'Clientes Ativos',
      valor: '1,247',
      variacao: '+12%',
      icone: Users,
      cor: 'blue',
      meta: 'Meta: 1,500'
    },
    {
      title: 'Produtos Cadastrados',
      valor: '89',
      variacao: '+5',
      icone: Package,
      cor: 'green',
      meta: 'Meta: 100'
    },
    {
      title: 'Propostas Ativas',
      valor: '34',
      variacao: '+8',
      icone: FileText,
      cor: 'orange',
      meta: 'Em negociação'
    },
    {
      title: 'Taxa de Conversão',
      valor: '67%',
      variacao: '+3%',
      icone: TrendingUp,
      cor: 'purple',
      meta: 'Meta: 70%'
    }
  ];

  // Atividades recentes
  const atividadesRecentes = [
    {
      id: 1,
      tipo: 'cliente',
      descricao: 'Cliente "Tech Solutions Ltd" cadastrado com sucesso',
      tempo: '5 min atrás',
      usuario: 'Ana Silva',
      status: 'success'
    },
    {
      id: 2,
      tipo: 'produto',
      descricao: 'Produto "Sistema CRM Premium" atualizado',
      tempo: '12 min atrás',
      usuario: 'Carlos Santos',
      status: 'info'
    },
    {
      id: 3,
      tipo: 'proposta',
      descricao: 'Proposta #2024-001 enviada para aprovação',
      tempo: '25 min atrás',
      usuario: 'Maria Costa',
      status: 'warning'
    },
    {
      id: 4,
      tipo: 'venda',
      descricao: 'Venda de R$ 45.000 confirmada',
      tempo: '1h atrás',
      usuario: 'João Oliveira',
      status: 'success'
    }
  ];

  // Handlers para ações
  const handleSaveCliente = async (clienteData: any) => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Cliente cadastrado com sucesso!', {
        icon: '👤',
        duration: 4000,
      });
      
      setShowClienteModal(false);
      
      // Atualizar progress do workflow
      toast.success('Próximo passo: Configurar produtos', {
        icon: '📦',
        duration: 6000,
      });
      
    } catch (error) {
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduto = async (produtoData: any) => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Produto cadastrado com sucesso!', {
        icon: '📦',
        duration: 4000,
      });
      
      setShowProdutoModal(false);
      
      // Sugerir próximo passo
      toast.success('Próximo passo: Criar proposta comercial', {
        icon: '📄',
        duration: 6000,
      });
      
    } catch (error) {
      toast.error('Erro ao cadastrar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (stepId: string) => {
    switch (stepId) {
      case 'cliente':
        setShowClienteModal(true);
        break;
      case 'produtos':
        setShowProdutoModal(true);
        break;
      case 'proposta':
        navigate('/propostas/nova');
        break;
      case 'negociacao':
        toast('Módulo de negociação em desenvolvimento', {
          icon: '🔄',
          duration: 3000,
        });
        break;
      case 'fechamento':
        toast('Módulo de fechamento em desenvolvimento', {
          icon: '✅',
          duration: 3000,
        });
        break;
      default:
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'upcoming':
        return <ArrowRight className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'cliente':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'produto':
        return <Package className="w-4 h-4 text-green-600" />;
      case 'proposta':
        return <FileText className="w-4 h-4 text-orange-600" />;
      case 'venda':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <>
      <ResponsiveDashboardLayout
        title="Central de Operações"
        subtitle="Fluxo completo de vendas - Do cliente à proposta"
      >
        <div className="space-y-8">
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricas.map((metrica, index) => {
              const IconComponent = metrica.icone;
              const corClasses = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                orange: 'bg-orange-50 text-orange-600',
                purple: 'bg-purple-50 text-purple-600'
              }[metrica.cor];

              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${corClasses}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-green-600">{metrica.variacao}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
                    <p className="text-sm text-gray-600 mt-1">{metrica.title}</p>
                    <p className="text-xs text-gray-500 mt-2">{metrica.meta}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow Principal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Fluxo de Vendas</h2>
                <p className="text-gray-600">Acompanhe todas as etapas do processo comercial</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Progresso geral:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">25%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {workflowSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = step.status === 'current';
                const isCompleted = step.status === 'completed';
                
                return (
                  <div 
                    key={step.id}
                    className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : isCompleted 
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Connector Line */}
                    {index < workflowSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-6 right-0 w-4 h-0.5 bg-gray-300 translate-x-2"></div>
                    )}
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${
                        isActive 
                          ? 'bg-blue-100' 
                          : isCompleted 
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          isActive 
                            ? 'text-blue-600' 
                            : isCompleted 
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`} />
                      </div>
                      {getStatusIcon(step.status)}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                    
                    {step.progress && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${step.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{step.progress}% completo</span>
                      </div>
                    )}
                    
                    {step.action && (
                      <button
                        onClick={() => handleActionClick(step.id)}
                        disabled={step.status === 'upcoming' && step.id !== 'produtos'}
                        className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive || step.id === 'produtos'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : isCompleted
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{step.action}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid com Atividades e Ações Rápidas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Atividades Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-4">
                {atividadesRecentes.map((atividade) => (
                  <div key={atividade.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                      {getActivityIcon(atividade.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{atividade.descricao}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{atividade.tempo}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{atividade.usuario}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Ações Rápidas</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowClienteModal(true)}
                  className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Novo Cliente</p>
                    <p className="text-sm text-blue-600">Cadastrar novo cliente no sistema</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowProdutoModal(true)}
                  className="w-full flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
                >
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Novo Produto</p>
                    <p className="text-sm text-green-600">Adicionar produto ao catálogo</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/propostas/nova')}
                  className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Nova Proposta</p>
                    <p className="text-sm text-orange-600">Criar proposta comercial</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Dashboard</p>
                    <p className="text-sm text-purple-600">Ver métricas e relatórios</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </ResponsiveDashboardLayout>

      {/* Modais */}
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSave={handleSaveCliente}
        isLoading={isLoading}
      />

      <ModalCadastroProduto
        isOpen={showProdutoModal}
        onClose={() => setShowProdutoModal(false)}
        onSubmit={handleSaveProduto}
        loading={isLoading}
      />
    </>
  );
};

export default CentralOperacoesPage;
