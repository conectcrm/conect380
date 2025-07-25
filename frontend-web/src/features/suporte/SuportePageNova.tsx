import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Video, 
  Search, 
  Filter,
  Phone,
  Mail,
  Clock,
  Star,
  User,
  FileText,
  Headphones,
  ExternalLink,
  ChevronRight,
  Plus,
  Send,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Brain,
  BarChart3
} from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { SuporteMetrics } from '../../components/suporte/SuporteMetrics';
import { FAQSection } from '../../components/suporte/FAQSection';
import { TutoriaisSection } from '../../components/suporte/TutoriaisSection';
import { ChatSuporte } from '../../components/suporte/ChatSuporte';
import { TicketSuporte } from '../../components/suporte/TicketSuporte';
import { DocumentacaoSection } from '../../components/suporte/DocumentacaoSection';
import { ChatBotIA } from '../../components/suporte/ChatBotIA';
import { MetricasSuporteIA } from '../../components/suporte/MetricasSuporteIA';

type TabType = 'overview' | 'faq' | 'tutoriais' | 'documentacao' | 'chat' | 'tickets' | 'ia' | 'metricas-ia';

interface StatusSuporteType {
  sistema: 'online' | 'manutencao' | 'instavel';
  chat: 'disponivel' | 'ocupado' | 'offline';
  tempoResposta: string;
  ticketsAbertos: number;
}

export const SuportePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusSupporte, setStatusSupporte] = useState<StatusSuporteType>({
    sistema: 'online',
    chat: 'disponivel',
    tempoResposta: '< 2h',
    ticketsAbertos: 3
  });

  // Métricas de exemplo
  const [metrics] = useState({
    ticketsAtivos: 12,
    ticketsResolvidos: 48,
    tempoMedioResposta: 1.2,
    satisfacaoMedia: 4.7,
    baseConhecimento: 156,
    tutoriaisDisponiveis: 89,
    horasSuporteDisponivel: 12,
    especialistasOnline: 5
  });

  // Carregar dados de suporte
  useEffect(() => {
    const loadSuporteData = async () => {
      try {
        setLoading(true);
        // Simular carregamento de dados
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simular diferentes estados baseados no horário
        const hour = new Date().getHours();
        const isBusinessHours = hour >= 8 && hour <= 18;
        
        setStatusSupporte(prev => ({
          ...prev,
          chat: isBusinessHours ? 'disponivel' : 'offline'
        }));
        
      } catch (error) {
        console.error('Erro ao carregar dados de suporte:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuporteData();
    
    // Atualizar status a cada 30 segundos
    const interval = setInterval(loadSuporteData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Visão Geral',
      icon: HelpCircle,
      description: 'Status geral e acesso rápido'
    },
    {
      id: 'faq' as TabType,
      label: 'FAQ',
      icon: MessageSquare,
      description: 'Perguntas frequentes'
    },
    {
      id: 'tutoriais' as TabType,
      label: 'Tutoriais',
      icon: Video,
      description: 'Guias em vídeo e texto'
    },
    {
      id: 'documentacao' as TabType,
      label: 'Documentação',
      icon: Book,
      description: 'Manuais e referências'
    },
    {
      id: 'chat' as TabType,
      label: 'Chat',
      icon: Headphones,
      description: 'Suporte em tempo real'
    },
    {
      id: 'tickets' as TabType,
      label: 'Tickets',
      icon: FileText,
      description: 'Abrir e acompanhar tickets'
    },
    {
      id: 'ia' as TabType,
      label: 'IA Assistente',
      icon: Brain,
      description: 'Assistente virtual especializado'
    },
    {
      id: 'metricas-ia' as TabType,
      label: 'Métricas IA',
      icon: BarChart3,
      description: 'Desempenho do assistente virtual'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'disponivel':
        return 'text-green-600 bg-green-100';
      case 'ocupado':
      case 'instavel':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
      case 'manutencao':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'disponivel': return 'Disponível';
      case 'ocupado': return 'Ocupado';
      case 'instavel': return 'Instável';
      case 'offline': return 'Offline';
      case 'manutencao': return 'Manutenção';
      default: return status;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 p-6">
            {/* Status do Sistema */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#002333] mb-4">Status do Sistema</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Sistema</p>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(statusSupporte.sistema)}`}>
                      {getStatusLabel(statusSupporte.sistema)}
                    </span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Chat</p>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(statusSupporte.chat)}`}>
                      {getStatusLabel(statusSupporte.chat)}
                    </span>
                  </div>
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Resposta</p>
                    <span className="text-sm font-medium text-gray-900">{statusSupporte.tempoResposta}</span>
                  </div>
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Tickets Abertos</p>
                    <span className="text-sm font-medium text-gray-900">{statusSupporte.ticketsAbertos}</span>
                  </div>
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Acesso Rápido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#002333] mb-4">Acesso Rápido</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('ia')}
                  className="flex items-center p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-all group bg-gradient-to-r from-purple-50 to-blue-50"
                >
                  <Brain className="w-6 h-6 mr-3 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-purple-900">IA Assistente</p>
                    <p className="text-sm text-purple-700">Respostas instantâneas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-purple-600" />
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all group"
                >
                  <Headphones className="w-6 h-6 mr-3 text-blue-600 group-hover:text-white" />
                  <div className="text-left">
                    <p className="font-medium">Chat ao Vivo</p>
                    <p className="text-sm text-gray-600 group-hover:text-gray-200">Suporte em tempo real</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveTab('faq')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-600 hover:text-white transition-all group"
                >
                  <MessageSquare className="w-6 h-6 mr-3 text-green-600 group-hover:text-white" />
                  <div className="text-left">
                    <p className="font-medium">FAQ</p>
                    <p className="text-sm text-gray-600 group-hover:text-gray-200">Perguntas frequentes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveTab('tutoriais')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-600 hover:text-white transition-all group"
                >
                  <Video className="w-6 h-6 mr-3 text-orange-600 group-hover:text-white" />
                  <div className="text-left">
                    <p className="font-medium">Tutoriais</p>
                    <p className="text-sm text-gray-600 group-hover:text-gray-200">Guias passo a passo</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveTab('tickets')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-600 hover:text-white transition-all group"
                >
                  <FileText className="w-6 h-6 mr-3 text-purple-600 group-hover:text-white" />
                  <div className="text-left">
                    <p className="font-medium">Abrir Ticket</p>
                    <p className="text-sm text-gray-600 group-hover:text-gray-200">Suporte personalizado</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto" />
                </button>

                <a
                  href="tel:+5511999999999"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-600 hover:text-white transition-all group"
                >
                  <Phone className="w-6 h-6 mr-3 text-green-600 group-hover:text-white" />
                  <div className="text-left">
                    <p className="font-medium">Ligar</p>
                    <p className="text-sm text-gray-600 group-hover:text-gray-200">(11) 99999-9999</p>
                  </div>
                  <ExternalLink className="w-5 h-5 ml-auto" />
                </a>
              </div>
            </div>

            {/* Contatos de Emergência */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-[#002333] mb-4">Contatos de Emergência</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-900">Suporte Crítico 24h</p>
                      <p className="text-sm text-red-700">Para problemas urgentes que afetam operação</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a href="tel:+551140028922" className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                      (11) 4002-8922
                    </a>
                    <a href="mailto:urgente@conectcrm.com.br" className="px-3 py-1 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm">
                      Email
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <Info className="w-6 h-6 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-yellow-900">Suporte Comercial</p>
                      <p className="text-sm text-yellow-700">Segunda a Sexta, 8h às 18h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a href="tel:+5511999999999" className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                      (11) 99999-9999
                    </a>
                    <a href="mailto:comercial@conectcrm.com.br" className="px-3 py-1 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-600 hover:text-white transition-colors text-sm">
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return <FAQSection searchTerm={searchTerm} />;

      case 'tutoriais':
        return <TutoriaisSection searchTerm={searchTerm} />;

      case 'documentacao':
        return <DocumentacaoSection searchTerm={searchTerm} />;

      case 'chat':
        return <ChatSuporte searchTerm={searchTerm} />;

      case 'tickets':
        return <TicketSuporte searchTerm={searchTerm} />;

      case 'ia':
        return (
          <div className="p-6">
            <ChatBotIA 
              onTransferirParaAgente={(contexto, historico) => {
                console.log('Transferindo para agente:', { contexto, historico });
                setActiveTab('chat');
              }}
            />
          </div>
        );

      case 'metricas-ia':
        return <MetricasSuporteIA />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando suporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackToNucleus nucleusName="Central de Suporte" nucleusPath="/suporte" />
      
      <div className="p-4 md:p-6">
        {/* Métricas */}
        <SuporteMetrics metrics={metrics} />

        {/* Header com ações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-[#002333]">Central de Suporte ConectCRM</h1>
              <p className="text-gray-600">Encontre respostas, tutoriais e entre em contato com nossa equipe</p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar em toda a central..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent w-full sm:w-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Container principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs de navegação */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-[#159A9C] text-[#159A9C]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 w-4 h-4 ${
                      isActive ? 'text-[#159A9C]' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conteúdo da tab ativa */}
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
