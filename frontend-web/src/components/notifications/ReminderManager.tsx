import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import type { ReminderEntityType } from '../../contexts/NotificationContext';
import {
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit,
  User,
  FileText,
  CheckSquare,
  Repeat,
  Bell,
  Save,
  X
} from 'lucide-react';

interface ReminderManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NewReminderForm {
  title: string;
  message: string;
  scheduledFor: string;
  entityType: ReminderEntityType;
  entityId: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
}

export const ReminderManager: React.FC<ReminderManagerProps> = ({ isOpen, onClose }) => {
  const { reminders, addReminder, updateReminder, removeReminder, showSuccess } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewReminderForm>({
    title: '',
    message: '',
    scheduledFor: '',
    entityType: 'cliente',
    entityId: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reminderData = {
      ...formData,
      scheduledFor: new Date(formData.scheduledFor),
      active: true,
    };

    if (editingId) {
      updateReminder(editingId, reminderData);
      showSuccess('Lembrete Atualizado', 'O lembrete foi atualizado com sucesso.');
    } else {
      addReminder(reminderData);
      showSuccess('Lembrete Criado', 'Novo lembrete adicionado com sucesso.');
    }

    // Reset form
    setFormData({
      title: '',
      message: '',
      scheduledFor: '',
      entityType: 'cliente',
      entityId: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (reminder: any) => {
    setFormData({
      title: reminder.title,
      message: reminder.message,
      scheduledFor: reminder.scheduledFor.toISOString().slice(0, 16),
      entityType: reminder.entityType,
      entityId: reminder.entityId,
      recurring: reminder.recurring,
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lembrete?')) {
      removeReminder(id);
      showSuccess('Lembrete Excluído', 'O lembrete foi removido.');
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'cliente':
        return <User className="w-4 h-4" />;
      case 'proposta':
        return <FileText className="w-4 h-4" />;
      case 'tarefa':
        return <CheckSquare className="w-4 h-4" />;
      case 'agenda':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Gerenciar Lembretes</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lembrete</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulário de Novo/Editar Lembrete */}
        {showForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Ligar para cliente João"
                    required
                  />
                </div>

                {/* Data e Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    min={getMinDateTime()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Tipo de Entidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relacionado a
                  </label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value as ReminderEntityType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="proposta">Proposta</option>
                    <option value="tarefa">Tarefa</option>
                    <option value="agenda">Agenda</option>
                  </select>
                </div>

                {/* ID da Entidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Entidade
                  </label>
                  <input
                    type="text"
                    value={formData.entityId}
                    onChange={(e) => setFormData(prev => ({ ...prev, entityId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ID do cliente, proposta, etc."
                    required
                  />
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descrição detalhada do lembrete..."
                  required
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      title: '',
                      message: '',
                      scheduledFor: '',
                      entityType: 'cliente',
                      entityId: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Atualizar' : 'Criar'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Lembretes */}
        <div className="flex-1 overflow-y-auto">
          {reminders.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lembrete configurado</h3>
              <p className="text-gray-500 mb-4">Crie lembretes para não perder compromissos importantes.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Lembrete</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reminders.map((reminder) => {
                const isOverdue = reminder.scheduledFor < new Date();
                const isUpcoming = reminder.scheduledFor <= new Date(Date.now() + 24 * 60 * 60 * 1000); // próximas 24h

                return (
                  <div
                    key={reminder.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${!reminder.active ? 'opacity-50' : ''
                      } ${isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''} ${isUpcoming && !isOverdue ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getEntityIcon(reminder.entityType)}
                          <h3 className="text-lg font-medium text-gray-900">
                            {reminder.title}
                          </h3>
                          {reminder.recurring && (
                            <span className="flex items-center" aria-label="Recorrente">
                              <Repeat className="w-4 h-4 text-purple-500" aria-hidden="true" />
                            </span>
                          )}
                          {!reminder.active && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{reminder.message}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(reminder.scheduledFor)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getEntityIcon(reminder.entityType)}
                            <span className="capitalize">{reminder.entityType}</span>
                            <span>#{reminder.entityId}</span>
                          </div>
                        </div>

                        {isOverdue && (
                          <div className="mt-2 text-sm text-red-600 font-medium">
                            ⚠️ Atrasado
                          </div>
                        )}

                        {isUpcoming && !isOverdue && (
                          <div className="mt-2 text-sm text-yellow-600 font-medium">
                            🔔 Próximo
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateReminder(reminder.id, { active: !reminder.active })}
                          className={`p-2 rounded-lg transition-colors ${reminder.active
                            ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          title={reminder.active ? 'Desativar' : 'Ativar'}
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderManager;
