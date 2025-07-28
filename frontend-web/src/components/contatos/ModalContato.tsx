import React from 'react';
import {
  X,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Star,
  Edit,
  User,
  Globe,
  Tag,
  FileText,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Linkedin,
  Twitter,
  Facebook,
  Instagram
} from 'lucide-react';
import { Contato } from '../../features/contatos/services/contatosService';
import { safeRender, validateAndSanitizeContact } from '../../utils/safeRender';

interface ModalContatoProps {
  contato: Contato | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contato: Contato) => void;
}

export const ModalContato: React.FC<ModalContatoProps> = ({
  contato,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !contato) return null;

  // Validar e sanitizar dados do contato
  const safeContato = validateAndSanitizeContact(contato);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cliente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospecto':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inativo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ex-cliente':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatarTelefone = (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return telefone;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularDiasDesdeUltimoContato = (data: string) => {
    const hoje = new Date();
    const ultimoContato = new Date(data);
    const diffTime = Math.abs(hoje.getTime() - ultimoContato.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0d7a7d]">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {safeRender(safeContato.nome).split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">{safeRender(safeContato.nome)}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white bg-opacity-20 backdrop-blur-sm text-white border-white border-opacity-30`}>
                  {safeRender(safeContato.status)}
                </span>
                {safeContato.pontuacao_lead > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                    <Star className="w-4 h-4" />
                    {safeRender(safeContato.pontuacao_lead)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(contato)}
              className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all backdrop-blur-sm"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Coluna Principal */}
              <div className="lg:col-span-2 space-y-6">

                {/* Informações de Contato */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Informações de Contato
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${safeRender(safeContato.email)}`} className="text-[#159A9C] hover:underline">
                          {safeRender(safeContato.email)}
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefone</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${safeRender(safeContato.telefone)}`} className="text-[#159A9C] hover:underline">
                          {formatarTelefone(safeRender(safeContato.telefone))}
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Empresa</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{safeRender(safeContato.empresa)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Cargo</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{safeRender(safeContato.cargo)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  {safeContato.endereco && typeof safeContato.endereco === 'object' && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">Endereço</label>
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div>{safeRender(safeContato.endereco.rua)}</div>
                          <div>{safeRender(safeContato.endereco.cidade)} - {safeRender(safeContato.endereco.estado)}</div>
                          <div>{safeRender(safeContato.endereco.cep)} - {safeRender(safeContato.endereco.pais)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Redes Sociais */}
                {safeContato.redes_sociais && typeof safeContato.redes_sociais === 'object' && Object.keys(safeContato.redes_sociais).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Redes Sociais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(safeContato.redes_sociais).map(([platform, url]) => (
                        url && (
                          <a
                            key={platform}
                            href={safeRender(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {getSocialIcon(platform)}
                            <span className="capitalize">{safeRender(platform)}</span>
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {safeContato.notas && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notas
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{safeRender(safeContato.notas)}</p>
                  </div>
                )}

                {/* Tags */}
                {safeContato.tags && Array.isArray(safeContato.tags) && safeContato.tags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {safeContato.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          <Tag className="w-3 h-3" />
                          {safeRender(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">

                {/* Informações do Sistema */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4">Informações do Sistema</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Proprietário</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{safeRender(safeContato.proprietario)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Fonte</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span>{safeRender(safeContato.fonte)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatarData(safeRender(safeContato.data_criacao))}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Última Interação</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatarData(safeRender(safeContato.data_ultima_interacao))}
                          <span className="text-gray-500 text-sm ml-1">
                            ({calcularDiasDesdeUltimoContato(safeRender(safeContato.data_ultima_interacao))} dias atrás)
                          </span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Categoria</label>
                      <span className="block mt-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        {safeRender(safeContato.categoria)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Métricas
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Pontuação Lead</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{safeRender(safeContato.pontuacao_lead)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Valor Potencial</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(safeContato.valor_potencial) || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Atividades</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{safeRender(safeContato.atividades_recentes)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Oportunidades</span>
                      </div>
                      <span className="text-lg font-bold text-orange-600">{safeRender(safeContato.oportunidades_abertas)}</span>
                    </div>
                  </div>
                </div>

                {/* Histórico de Vendas */}
                {((Number(safeContato.vendas_realizadas) || 0) > 0 || (Number(safeContato.valor_total_vendas) || 0) > 0) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Histórico de Vendas
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Vendas Realizadas</span>
                        <span className="font-semibold">{safeRender(safeContato.vendas_realizadas)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valor Total</span>
                        <span className="font-semibold text-[#159A9C]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(Number(safeContato.valor_total_vendas) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
