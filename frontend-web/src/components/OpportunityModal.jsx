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
    { value: 'leads', label: 'Leads', badgeClasses: 'bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]' },
    { value: 'qualification', label: 'Qualificação', badgeClasses: 'bg-[#159A9C]/10 text-[#0F7B7D] border border-[#159A9C]/40' },
    { value: 'proposal', label: 'Proposta', badgeClasses: 'bg-white text-[#002333] border border-[#B4BEC9]' },
    { value: 'negotiation', label: 'Negociação', badgeClasses: 'bg-[#DEEFE7] text-[#0F7B7D] border border-[#159A9C]/40' },
    { value: 'closing', label: 'Fechamento', badgeClasses: 'bg-[#159A9C] text-white border border-transparent' },
    { value: 'won', label: 'Ganho', badgeClasses: 'bg-[#0F7B7D] text-white border border-transparent' },
    { value: 'lost', label: 'Perdido', badgeClasses: 'bg-[#B4BEC9]/40 text-[#002333] border border-[#B4BEC9]' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', badgeClasses: 'bg-[#DEEFE7] text-[#0F7B7D] border border-[#159A9C]/40' },
    { value: 'medium', label: 'Média', badgeClasses: 'bg-white text-[#002333] border border-[#B4BEC9]' },
    { value: 'high', label: 'Alta', badgeClasses: 'bg-[#159A9C] text-white border border-transparent' }
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

  const getPriorityBadgeClasses = (priority) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? option.badgeClasses : 'bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]';
  };

  const getStageBadgeClasses = (stage) => {
    const option = stageOptions.find(s => s.value === stage);
    return option ? option.badgeClasses : 'bg-[#DEEFE7] text-[#002333] border border-[#B4BEC9]';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-[#DEEFE7] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-[#DEEFE7]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#159A9C]/10 text-[#159A9C]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#002333]">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="bg-white border border-[#B4BEC9] rounded-lg px-3 py-2 w-96 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                  />
                ) : (
                  opportunity.title
                )}
              </h2>
              <p className="text-sm text-[#002333]/70">{opportunity.client}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(opportunity);
                  }}
                  className="text-[#002333] hover:text-[#0F7B7D] transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}

            <button
              onClick={onClose}
              className="text-[#002333] hover:text-[#0F7B7D] transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#DEEFE7] bg-[#DEEFE7] px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors rounded-t-lg ${activeTab === tab.id
                    ? 'bg-white text-[#159A9C] border border-[#DEEFE7] border-b-0 shadow-sm'
                    : 'text-[#002333]/60 hover:text-[#002333]'
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
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">Informações Principais</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#002333]/80">Valor</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.value}
                          onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) || 0 })}
                          className="border border-[#B4BEC9] rounded-lg px-3 py-2 w-48 text-right text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-[#159A9C]">
                          {formatCurrency(opportunity.value)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#002333]/80">Probabilidade</label>
                      {isEditing ? (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editData.probability}
                          onChange={(e) => setEditData({ ...editData, probability: parseInt(e.target.value) })}
                          className="w-32"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#DEEFE7] rounded-full h-2">
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
                      <label className="text-sm font-medium text-[#002333]/80">Estágio</label>
                      {isEditing ? (
                        <select
                          value={editData.stage}
                          onChange={(e) => setEditData({ ...editData, stage: e.target.value })}
                          className="border border-[#B4BEC9] rounded-lg px-3 py-2 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        >
                          {stageOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageBadgeClasses(opportunity.stage)}`}
                        >
                          {stageOptions.find(s => s.value === opportunity.stage)?.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#002333]/80">Prioridade</label>
                      {isEditing ? (
                        <select
                          value={editData.priority}
                          onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                          className="border border-[#B4BEC9] rounded-lg px-3 py-2 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeClasses(opportunity.priority)}`}
                        >
                          {priorityOptions.find(p => p.value === opportunity.priority)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div>
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">Datas Importantes</h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#B4BEC9]" />
                      <div>
                        <p className="text-sm text-[#002333]/70">Data de Criação</p>
                        <p className="font-medium text-[#002333]">{formatDate(opportunity.createdDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-[#B4BEC9]" />
                      <div>
                        <p className="text-sm text-[#002333]/70">Fechamento Esperado</p>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.expectedCloseDate}
                            onChange={(e) => setEditData({ ...editData, expectedCloseDate: e.target.value })}
                            className="border border-[#B4BEC9] rounded-lg px-3 py-1 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                          />
                        ) : (
                          <p className="font-medium text-[#002333]">{formatDate(opportunity.expectedCloseDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">Informações do Cliente</h3>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-[#B4BEC9]" />
                      <div>
                        <p className="text-sm text-[#002333]/70">Empresa</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.client}
                            onChange={(e) => setEditData({ ...editData, client: e.target.value })}
                            className="border border-[#B4BEC9] rounded-lg px-3 py-2 w-full text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                          />
                        ) : (
                          <p className="font-medium text-[#002333]">{opportunity.client}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-[#B4BEC9]" />
                      <div>
                        <p className="text-sm text-[#002333]/70">Responsável</p>
                        {isEditing ? (
                          <select
                            value={editData.assignedTo}
                            onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                            className="border border-[#B4BEC9] rounded-lg px-3 py-2 w-full text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                          >
                            <option value="Ana Silva">Ana Silva</option>
                            <option value="Carlos Vendas">Carlos Vendas</option>
                            <option value="João Santos">João Santos</option>
                          </select>
                        ) : (
                          <p className="font-medium text-[#002333]">{opportunity.assignedTo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-[#B4BEC9]" />
                      <div>
                        <p className="text-sm text-[#002333]/70">Origem</p>
                        {isEditing ? (
                          <select
                            value={editData.source}
                            onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                            className="border border-[#B4BEC9] rounded-lg px-3 py-2 w-full text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                          >
                            <option value="Website">Website</option>
                            <option value="Indicação">Indicação</option>
                            <option value="Telefone">Telefone</option>
                            <option value="Email">Email</option>
                            <option value="Redes Sociais">Redes Sociais</option>
                          </select>
                        ) : (
                          <p className="font-medium text-[#002333]">{opportunity.source}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">Tags</h3>
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
                      <button className="px-3 py-1 border-2 border-dashed border-[#B4BEC9] rounded-full text-sm text-[#002333]/70 hover:border-[#159A9C] transition-colors">
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
              <div className="bg-[#DEEFE7] rounded-xl p-4 border border-[#DEEFE7]">
                <h3 className="text-lg font-semibold text-[#002333] mb-4">Nova Atividade</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                    className="border border-[#B4BEC9] rounded-lg px-3 py-2 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
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
                    onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                    className="border border-[#B4BEC9] rounded-lg px-3 py-2 text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
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
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full border border-[#B4BEC9] rounded-lg px-3 py-2 h-24 resize-none text-[#002333] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
              </div>

              {/* Lista de Atividades */}
              <div>
                <h3 className="text-lg font-semibold text-[#002333] mb-4">Histórico de Atividades</h3>

                <div className="space-y-4">
                  {(editData.activities || []).map(activity => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id || activity.date} className="flex gap-4 p-4 bg-white border border-[#DEEFE7] rounded-lg">
                        <div className="p-2 bg-[#DEEFE7] rounded-lg">
                          <Icon className="w-5 h-5 text-[#002333]/70" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-[#002333]">
                              {activityTypes.find(t => t.value === activity.type)?.label}
                            </h4>
                            <span className="text-sm text-[#002333]/60">
                              {formatDate(activity.date)}
                            </span>
                          </div>
                          <p className="text-[#002333]/80">{activity.description}</p>
                        </div>
                      </div>
                    );
                  })}

                  {(!editData.activities || editData.activities.length === 0) && (
                    <div className="text-center py-8 text-[#002333]/60">
                      Nenhuma atividade registrada ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#002333]">Timeline da Oportunidade</h3>

              <div className="relative">
                {/* Timeline vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#DEEFE7]"></div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 w-12 h-12 bg-[#159A9C]/10 rounded-full flex items-center justify-center text-[#159A9C]">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-medium text-[#002333]">Oportunidade Criada</h4>
                      <p className="text-sm text-[#002333]/70">{formatDate(opportunity.createdDate)}</p>
                    </div>
                  </div>

                  {(opportunity.activities || []).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-[#DEEFE7] text-[#002333]">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 pt-2">
                          <h4 className="font-medium text-[#002333]">{activity.description}</h4>
                          <p className="text-sm text-[#002333]/70">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-start gap-4">
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-[#159A9C]/10 text-[#0F7B7D]">
                      <Target className="w-6 h-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-medium text-[#002333]">Fechamento Esperado</h4>
                      <p className="text-sm text-[#002333]/70">{formatDate(opportunity.expectedCloseDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#002333]">Documentos</h3>
                <button className="flex items-center gap-2 bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] transition-colors">
                  <Plus className="w-4 h-4" />
                  Adicionar Documento
                </button>
              </div>

              <div className="text-center py-12 text-[#002333]/60">
                <FileText className="w-12 h-12 text-[#B4BEC9] mx-auto mb-4" />
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
