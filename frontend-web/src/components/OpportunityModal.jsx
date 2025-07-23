import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Tag,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
  Plus,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Target,
  Activity
} from 'lucide-react';

const OpportunityModal = ({ opportunity, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(opportunity);
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const tabs = [
    { id: 'details', label: 'Detalhes', icon: FileText },
    { id: 'activities', label: 'Atividades', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'documents', label: 'Documentos', icon: FileText }
  ];

  const stageOptions = [
    { value: 'leads', label: 'Leads', color: '#6B7280' },
    { value: 'qualification', label: 'Qualificação', color: '#3B82F6' },
    { value: 'proposal', label: 'Proposta', color: '#F59E0B' },
    { value: 'negotiation', label: 'Negociação', color: '#8B5CF6' },
    { value: 'closing', label: 'Fechamento', color: '#06B6D4' },
    { value: 'won', label: 'Ganho', color: '#10B981' },
    { value: 'lost', label: 'Perdido', color: '#EF4444' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: '#10B981' },
    { value: 'medium', label: 'Média', color: '#F59E0B' },
    { value: 'high', label: 'Alta', color: '#EF4444' }
  ];

  const activityTypes = [
    { value: 'call', label: 'Ligação', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'meeting', label: 'Reunião', icon: Users },
    { value: 'note', label: 'Nota', icon: MessageSquare },
    { value: 'task', label: 'Tarefa', icon: CheckCircle }
  ];

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleAddActivity = () => {
    if (!newActivity.description.trim()) return;

    const activity = {
      ...newActivity,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };

    const updatedOpportunity = {
      ...editData,
      activities: [activity, ...(editData.activities || [])],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    setEditData(updatedOpportunity);
    onUpdate(updatedOpportunity);
    setNewActivity({
      type: 'note',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getActivityIcon = (type) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType ? activityType.icon : MessageSquare;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? option.color : '#6B7280';
  };

  const getStageColor = (stage) => {
    const option = stageOptions.find(s => s.value === stage);
    return option ? option.color : '#6B7280';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    className="bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 rounded-lg px-3 py-1 w-96"
                  />
                ) : (
                  opportunity.title
                )}
              </h2>
              <p className="text-white text-opacity-90">{opportunity.client}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-white text-[#159A9C] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(opportunity);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#159A9C] border-b-2 border-[#159A9C] bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informações Principais */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Principais</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Valor</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.value}
                          onChange={(e) => setEditData({...editData, value: parseFloat(e.target.value) || 0})}
                          className="border border-gray-300 rounded-lg px-3 py-2 w-48 text-right"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-[#159A9C]">
                          {formatCurrency(opportunity.value)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Probabilidade</label>
                      {isEditing ? (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editData.probability}
                          onChange={(e) => setEditData({...editData, probability: parseInt(e.target.value)})}
                          className="w-32"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#159A9C] h-2 rounded-full"
                              style={{ width: `${opportunity.probability}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{opportunity.probability}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Estágio</label>
                      {isEditing ? (
                        <select
                          value={editData.stage}
                          onChange={(e) => setEditData({...editData, stage: e.target.value})}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                        >
                          {stageOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: getStageColor(opportunity.stage) }}
                        >
                          {stageOptions.find(s => s.value === opportunity.stage)?.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Prioridade</label>
                      {isEditing ? (
                        <select
                          value={editData.priority}
                          onChange={(e) => setEditData({...editData, priority: e.target.value})}
                          className="border border-gray-300 rounded-lg px-3 py-2"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span 
                          className="px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: getPriorityColor(opportunity.priority) }}
                        >
                          {priorityOptions.find(p => p.value === opportunity.priority)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Datas Importantes</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Data de Criação</p>
                        <p className="font-medium">{formatDate(opportunity.createdDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Fechamento Esperado</p>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.expectedCloseDate}
                            onChange={(e) => setEditData({...editData, expectedCloseDate: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-1"
                          />
                        ) : (
                          <p className="font-medium">{formatDate(opportunity.expectedCloseDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Empresa</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.client}
                            onChange={(e) => setEditData({...editData, client: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          />
                        ) : (
                          <p className="font-medium">{opportunity.client}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Responsável</p>
                        {isEditing ? (
                          <select
                            value={editData.assignedTo}
                            onChange={(e) => setEditData({...editData, assignedTo: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          >
                            <option value="Ana Silva">Ana Silva</option>
                            <option value="Carlos Vendas">Carlos Vendas</option>
                            <option value="João Santos">João Santos</option>
                          </select>
                        ) : (
                          <p className="font-medium">{opportunity.assignedTo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Origem</p>
                        {isEditing ? (
                          <select
                            value={editData.source}
                            onChange={(e) => setEditData({...editData, source: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                          >
                            <option value="Website">Website</option>
                            <option value="Indicação">Indicação</option>
                            <option value="Telefone">Telefone</option>
                            <option value="Email">Email</option>
                            <option value="Redes Sociais">Redes Sociais</option>
                          </select>
                        ) : (
                          <p className="font-medium">{opportunity.source}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.tags?.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#159A9C] text-white rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                    {isEditing && (
                      <button className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm text-gray-600 hover:border-[#159A9C] transition-colors">
                        <Plus className="w-4 h-4 inline mr-1" />
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-6">
              {/* Adicionar Nova Atividade */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Atividade</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {activityTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <button
                    onClick={handleAddActivity}
                    className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
                  >
                    Adicionar
                  </button>
                </div>

                <textarea
                  placeholder="Descreva a atividade..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none"
                />
              </div>

              {/* Lista de Atividades */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atividades</h3>
                
                <div className="space-y-4">
                  {(editData.activities || []).map(activity => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id || activity.date} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {activityTypes.find(t => t.value === activity.type)?.label}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(activity.date)}
                            </span>
                          </div>
                          <p className="text-gray-700">{activity.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!editData.activities || editData.activities.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma atividade registrada ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Timeline da Oportunidade</h3>
              
              <div className="relative">
                {/* Timeline vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-medium text-gray-900">Oportunidade Criada</h4>
                      <p className="text-sm text-gray-600">{formatDate(opportunity.createdDate)}</p>
                    </div>
                  </div>

                  {(opportunity.activities || []).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="relative z-10 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 pt-2">
                          <h4 className="font-medium text-gray-900">{activity.description}</h4>
                          <p className="text-sm text-gray-600">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-start gap-4">
                    <div className="relative z-10 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-medium text-gray-900">Fechamento Esperado</h4>
                      <p className="text-sm text-gray-600">{formatDate(opportunity.expectedCloseDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
                <button className="flex items-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors">
                  <Plus className="w-4 h-4" />
                  Adicionar Documento
                </button>
              </div>
              
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>Nenhum documento anexado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Documento" para fazer upload de arquivos.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityModal;
