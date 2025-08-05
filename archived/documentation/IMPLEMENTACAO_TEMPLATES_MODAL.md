// Exemplo de como modificar o CreateEventModal.tsx para incluir templates

// 1. Importações adicionais no topo do arquivo:
import { EventTemplatesSelector, useEventTemplate } from './EventTemplatesSelector';

// 2. Adicionar state para controlar a seleção de template:
const [showTemplateSelector, setShowTemplateSelector] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
const { applyTemplate } = useEventTemplate();

// 3. Modificar o useEffect que inicializa o modal:
useEffect(() => {
  if (isOpen) {
    if (event) {
      // Editando evento existente - não mostrar templates
      setShowTemplateSelector(false);
      // ... resto da lógica existente
    } else {
      // Novo evento - mostrar seletor de templates se não foi selecionado ainda
      if (!selectedTemplate) {
        setShowTemplateSelector(true);
      }
      // ... resto da lógica existente
    }
  }
}, [isOpen, event, selectedDate, reset, selectedTemplate]);

// 4. Função para aplicar template selecionado:
const handleSelectTemplate = (template: any) => {
  const { participantsToAdd } = applyTemplate(template, setValue, selectedDate);
  setParticipants(participantsToAdd);
  setSelectedTemplate(template);
  setShowTemplateSelector(false);
};

const handleSkipTemplate = () => {
  setShowTemplateSelector(false);
  setSelectedTemplate(null);
};

// 5. Modificar o JSX para incluir o seletor de templates:
if (!isOpen) return null;

// Mostrar seletor de templates primeiro
if (showTemplateSelector && !event) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Novo Evento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <EventTemplatesSelector
          onSelectTemplate={handleSelectTemplate}
          onSkip={handleSkipTemplate}
        />
      </div>
    </div>
  );
}

// 6. Adicionar indicador de template usado no header principal:
{/* Header modificado */}
<div className="flex items-center justify-between p-6 border-b">
  <div className="flex items-center space-x-3">
    <h2 className="text-xl font-semibold text-gray-900">
      {event ? 'Editar evento' : 'Criar evento'}
    </h2>
    
    {/* Indicador de template usado */}
    {selectedTemplate && !event && (
      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
        {selectedTemplate.icon}
        <span>{selectedTemplate.name}</span>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setShowTemplateSelector(true);
          }}
          className="text-blue-600 hover:text-blue-800 ml-1"
          title="Alterar template"
        >
          <Edit className="w-3 h-3" />
        </button>
      </div>
    )}
    
    {/* Status do evento existente */}
    {event && (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        watch('status') === 'confirmado' ? 'bg-green-100 text-green-800' :
        watch('status') === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {statusOptions.find(opt => opt.value === watch('status'))?.label || 'Confirmado'}
      </div>
    )}
  </div>
  <button
    onClick={onClose}
    className="text-gray-400 hover:text-gray-600 transition-colors"
  >
    <X className="w-6 h-6" />
  </button>
</div>

// 7. Adicionar função para resetar e escolher novo template:
const handleChangeTemplate = () => {
  // Resetar formulário
  reset({
    title: '',
    isAllDay: false,
    status: 'confirmado',
    responsavel: usuarios[0]?.id || '',
    startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    startTime: '09:00',
    duration: '60',
    customDurationHours: 0,
    customDurationMinutes: 0,
    location: '',
    description: '',
    reminderTime: 10,
    reminderType: 'notification',
    emailOffline: false,
    participants: [],
    attachments: []
  });
  
  // Resetar participantes
  setParticipants([]);
  
  // Mostrar seletor novamente
  setSelectedTemplate(null);
  setShowTemplateSelector(true);
};

// 8. Adicionar na seção de "Ações Rápidas" (coluna 3):
<div className="bg-gray-50 p-4 rounded-lg">
  <h4 className="text-sm font-medium text-gray-700 mb-3">Ações Rápidas</h4>
  <div className="space-y-2">
    {/* Botão para alterar template */}
    {!event && (
      <button
        type="button"
        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        onClick={handleChangeTemplate}
      >
        {selectedTemplate ? 'Alterar template' : 'Escolher template'}
      </button>
    )}
    
    <button
      type="button"
      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      onClick={() => {/* Duplicar evento */ }}
    >
      Duplicar evento
    </button>
    
    <button
      type="button"
      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      onClick={() => {/* Criar série */ }}
    >
      Criar evento recorrente
    </button>
    
    {event && (
      <button
        type="button"
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        onClick={handleDelete}
      >
        Excluir evento
      </button>
    )}
  </div>
</div>

// 9. Limpar template ao fechar modal:
const handleClose = () => {
  setSelectedTemplate(null);
  setShowTemplateSelector(false);
  onClose();
};

// 10. Usar handleClose em vez de onClose diretamente nos botões de fechar
