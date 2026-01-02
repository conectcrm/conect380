import React, { useState } from 'react';
import { Clock, Users, Star, Phone, FileText, Presentation, Coffee, Settings } from 'lucide-react';

interface EventTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  duration: number; // em minutos
  type: 'meeting' | 'call' | 'task' | 'event' | 'follow-up';
  priority: 'low' | 'medium' | 'high';
  location?: string;
  defaultParticipants?: string[];
  reminderTime?: number;
  category?: string;
  icon: React.ReactNode;
  color: string;
}

// Templates pré-definidos
const DEFAULT_TEMPLATES: EventTemplate[] = [
  {
    id: 'reuniao-cliente',
    name: 'Reunião com Cliente',
    title: 'Reunião - [Nome do Cliente]',
    description: 'Reunião comercial para apresentação de proposta e negociação.',
    duration: 60,
    type: 'meeting',
    priority: 'high',
    location: 'Sala de Reuniões 1',
    defaultParticipants: [],
    reminderTime: 15,
    category: 'comercial',
    icon: <Users className="w-4 h-4" />,
    color: '#3B82F6',
  },
  {
    id: 'follow-up-comercial',
    name: 'Follow-up Comercial',
    title: 'Follow-up - [Nome do Cliente]',
    description: 'Acompanhamento comercial pós-proposta.',
    duration: 30,
    type: 'call',
    priority: 'medium',
    location: '',
    defaultParticipants: [],
    reminderTime: 10,
    category: 'comercial',
    icon: <Phone className="w-4 h-4" />,
    color: '#10B981',
  },
  {
    id: 'demo-produto',
    name: 'Demo do Produto',
    title: 'Demonstração - [Nome do Produto]',
    description: 'Apresentação detalhada das funcionalidades do sistema.',
    duration: 90,
    type: 'meeting',
    priority: 'high',
    location: 'Sala de Demonstração',
    defaultParticipants: ['suporte@empresa.com'],
    reminderTime: 30,
    category: 'comercial',
    icon: <Presentation className="w-4 h-4" />,
    color: '#8B5CF6',
  },
  {
    id: 'revisao-proposta',
    name: 'Revisão de Proposta',
    title: 'Revisão - Proposta #[Número]',
    description: 'Análise e ajustes na proposta comercial.',
    duration: 45,
    type: 'task',
    priority: 'high',
    location: '',
    defaultParticipants: [],
    reminderTime: 15,
    category: 'interno',
    icon: <FileText className="w-4 h-4" />,
    color: '#F59E0B',
  },
  {
    id: 'reuniao-equipe',
    name: 'Reunião de Equipe',
    title: 'Reunião de Equipe - [Departamento]',
    description: 'Alinhamento semanal da equipe.',
    duration: 60,
    type: 'meeting',
    priority: 'medium',
    location: 'Sala de Reuniões 2',
    defaultParticipants: [],
    reminderTime: 10,
    category: 'interno',
    icon: <Coffee className="w-4 h-4" />,
    color: '#6B7280',
  },
];

interface EventTemplatesSelectorProps {
  onSelectTemplate: (template: EventTemplate) => void;
  onSkip: () => void;
}

export const EventTemplatesSelector: React.FC<EventTemplatesSelectorProps> = ({
  onSelectTemplate,
  onSkip,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'interno', label: 'Interno' },
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? DEFAULT_TEMPLATES
      : DEFAULT_TEMPLATES.filter((t) => t.category === selectedCategory);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'Média';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Escolher Template</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecione um template para agilizar a criação do evento
          </p>
        </div>
        <button onClick={onSkip} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Criar sem template
        </button>
      </div>

      {/* Filtros por categoria */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-[#159A9C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="p-4 border border-gray-200 rounded-lg hover:border-[#159A9C] hover:shadow-md transition-all cursor-pointer group"
          >
            {/* Header do template */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: template.color }}
                >
                  {template.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-[#159A9C]">
                    {template.name}
                  </h4>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}
                  >
                    {getPriorityLabel(template.priority)}
                  </span>
                </div>
              </div>
              <Star className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
            </div>

            {/* Informações do template */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(template.duration)}</span>
              </div>

              {template.location && (
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>{template.location}</span>
                </div>
              )}

              {template.defaultParticipants && template.defaultParticipants.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{template.defaultParticipants.length} participante(s)</span>
                </div>
              )}
            </div>

            {/* Descrição */}
            {template.description && (
              <p className="text-xs text-gray-500 mt-3 line-clamp-2">{template.description}</p>
            )}

            {/* Indicador de hover */}
            <div className="mt-3 text-xs text-[#159A9C] opacity-0 group-hover:opacity-100 transition-opacity">
              Clique para usar este template →
            </div>
          </div>
        ))}
      </div>

      {/* Botão para criar template personalizado */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            /* TODO: Abrir modal de criar template personalizado */
          }}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#159A9C] hover:text-[#159A9C] transition-colors flex items-center justify-center space-x-2"
        >
          <Settings className="w-5 h-5" />
          <span>Criar template personalizado</span>
        </button>
      </div>
    </div>
  );
};

// Hook para aplicar template ao formulário
export const useEventTemplate = () => {
  const applyTemplate = (template: EventTemplate, setValue: Function, selectedDate?: Date) => {
    // Aplicar dados do template ao formulário
    setValue('title', template.title);
    setValue('description', template.description || '');
    setValue('duration', template.duration.toString());
    setValue('location', template.location || '');
    setValue('reminderTime', template.reminderTime || 10);

    // Converter prioridade
    setValue('priority', template.priority);

    // Aplicar participantes padrão
    if (template.defaultParticipants && template.defaultParticipants.length > 0) {
      setValue('participants', template.defaultParticipants);
    }

    // Se tiver data selecionada, manter a data
    if (selectedDate) {
      setValue('startDate', selectedDate.toISOString().split('T')[0]);
    }

    return {
      appliedTemplate: template,
      participantsToAdd: template.defaultParticipants || [],
    };
  };

  return { applyTemplate };
};

export default EventTemplatesSelector;
