import React, { useState } from 'react';
import { GoogleEventModal } from '@/components/calendar/GoogleEventModalOptimized';
import { Calendar, Sparkles, Settings, Users, Clock, MapPin } from 'lucide-react';

/**
 * Demonstração do Google Event Modal
 * 
 * Esta página demonstra todas as funcionalidades do novo modal de eventos
 * estilo Google Calendar, incluindo:
 * - Interface moderna com tabs
 * - Gestão avançada de participantes
 * - Notificações personalizáveis
 * - Videoconferência integrada
 * - Controle de visibilidade
 * - Cores e categorias
 * - Recorrência de eventos
 */
export const GoogleEventDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [demoEvent, setDemoEvent] = useState<any>(null);

  // Dados de demonstração
  const mockCalendars = [
    { id: 'primary', name: 'Principal', color: '#159A9C' },
    { id: 'work', name: 'Trabalho', color: '#137333' },
    { id: 'personal', name: 'Pessoal', color: '#9334e6' },
    { id: 'meetings', name: 'Reuniões', color: '#d93025' },
    { id: 'events', name: 'Eventos', color: '#f57c00' },
    { id: 'team', name: 'Equipe', color: '#00acc1' }
  ];

  const mockCurrentUser = {
    id: 'current-user',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    status: 'accepted' as const,
    role: 'organizer' as const,
    canModifyEvent: true,
    canInviteOthers: true,
    canSeeGuestList: true,
    avatar: undefined
  };

  // Eventos de demonstração
  const demoEvents = [
    {
      title: 'Reunião de Vendas',
      description: 'Discussão sobre metas do trimestre e estratégias de vendas para o próximo período.',
      start: new Date(2024, 11, 20, 14, 0).toISOString().slice(0, 16),
      end: new Date(2024, 11, 20, 15, 30).toISOString().slice(0, 16),
      location: 'Sala de Reuniões A',
      collaborator: 'Maria Santos',
      category: 'reuniao',
      participants: [
        { ...mockCurrentUser },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria.santos@empresa.com',
          status: 'accepted',
          role: 'attendee',
          canModifyEvent: false,
          canInviteOthers: false,
          canSeeGuestList: true
        },
        {
          id: '3',
          name: 'Carlos Lima',
          email: 'carlos.lima@empresa.com',
          status: 'pending',
          role: 'attendee',
          canModifyEvent: false,
          canInviteOthers: false,
          canSeeGuestList: true
        }
      ]
    },
    {
      title: 'Apresentação do Produto',
      description: 'Demonstração das novas funcionalidades para clientes.',
      start: new Date(2024, 11, 22, 10, 0).toISOString().slice(0, 16),
      end: new Date(2024, 11, 22, 12, 0).toISOString().slice(0, 16),
      location: 'Auditório Principal',
      collaborator: 'Ana Costa',
      category: 'apresentacao',
      conferenceLink: 'https://meet.google.com/abc-defg-hij',
      participants: [
        { ...mockCurrentUser },
        {
          id: '4',
          name: 'Ana Costa',
          email: 'ana.costa@empresa.com',
          status: 'accepted',
          role: 'organizer',
          canModifyEvent: true,
          canInviteOthers: true,
          canSeeGuestList: true
        }
      ]
    }
  ];

  const handleSaveEvent = async (eventData: any) => {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Evento salvo:', eventData);
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Simular exclusão
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Evento excluído:', eventId);
  };

  const openNewEvent = () => {
    setDemoEvent(null);
    setShowModal(true);
  };

  const openEditEvent = (eventIndex: number) => {
    setDemoEvent(demoEvents[eventIndex]);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Google Event Modal Demo
              </h1>
              <p className="text-gray-600">
                Modal de eventos estilo Google Calendar com funcionalidades avançadas
              </p>
            </div>
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Participantes</p>
                <p className="text-sm text-blue-700">Gestão avançada</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Notificações</p>
                <p className="text-sm text-green-700">Personalizáveis</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Videoconferência</p>
                <p className="text-sm text-purple-700">Integrada</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Settings className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Configurações</p>
                <p className="text-sm text-orange-700">Avançadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Demonstrações
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={openNewEvent}
              className="p-4 bg-[#159A9C] text-white rounded-lg hover:bg-[#138A8C] transition-colors flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Novo Evento</p>
                <p className="text-sm opacity-90">Criar evento do zero</p>
              </div>
            </button>

            <button
              onClick={() => openEditEvent(0)}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3"
            >
              <Users className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Reunião de Vendas</p>
                <p className="text-sm opacity-90">Editar evento existente</p>
              </div>
            </button>

            <button
              onClick={() => openEditEvent(1)}
              className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Apresentação</p>
                <p className="text-sm opacity-90">Com videoconferência</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recursos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recursos Implementados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Interface</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Layout com tabs navegáveis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Design responsivo
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Cores personalizáveis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Validação em tempo real
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Funcionalidades</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Múltiplos participantes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Status de participação
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Notificações personalizadas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Links de videoconferência
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Recorrência de eventos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Controle de visibilidade
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <GoogleEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={demoEvent}
        isLoading={false}
        availableCalendars={mockCalendars}
        currentUser={mockCurrentUser}
      />
    </div>
  );
};

export default GoogleEventDemo;
