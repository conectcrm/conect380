import React from 'react';
import { 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  User,
  Tag,
  Clock
} from 'lucide-react';
import { Contato } from '../../features/contatos/services/contatosService';

interface ContatoCardProps {
  contato: Contato;
  onView: (contato: Contato) => void;
  onEdit: (contato: Contato) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const ContatoCard: React.FC<ContatoCardProps> = ({
  contato,
  onView,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect
}) => {
  const [showActions, setShowActions] = React.useState(false);

  // Fechar menu quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = () => setShowActions(false);
    
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActions]);

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

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'lead':
        return <Star className="w-4 h-4" />;
      case 'cliente':
        return <User className="w-4 h-4" />;
      case 'parceiro':
        return <Building className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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

  const calcularDiasDesdeUltimoContato = (data: string) => {
    const hoje = new Date();
    const ultimoContato = new Date(data);
    const diffTime = Math.abs(hoje.getTime() - ultimoContato.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div 
      className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isSelected ? 'border-[#159A9C] shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onView(contato)}
    >
      {/* Header do Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Checkbox de Seleção */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(contato.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
            />

            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-[#159A9C] to-[#0d7a7d] rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {contato.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            {/* Informações Principais */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-[#002333] truncate">
                  {contato.nome}
                </h3>
                {contato.tipo && (
                  <div className="flex items-center gap-1 text-gray-500">
                    {getTipoIcon(contato.tipo)}
                  </div>
                )}
              </div>
              
              {contato.empresa && (
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {contato.empresa}
                </p>
              )}

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(contato.status)}`}>
                  {contato.status}
                </span>
                
                {contato.pontuacao_lead && contato.pontuacao_lead > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3" />
                    {contato.pontuacao_lead}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Ações */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showActions && (
              <div 
                className="absolute right-0 top-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(contato);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contato);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>

                <hr className="my-1" />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(contato.id);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-4">
        {/* Informações de Contato */}
        <div className="space-y-2 mb-4">
          {contato.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <a 
                href={`mailto:${contato.email}`} 
                onClick={(e) => e.stopPropagation()}
                className="hover:text-[#159A9C] transition-colors"
              >
                {contato.email}
              </a>
            </div>
          )}

          {contato.telefone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <a 
                href={`tel:${contato.telefone}`} 
                onClick={(e) => e.stopPropagation()}
                className="hover:text-[#159A9C] transition-colors"
              >
                {formatarTelefone(contato.telefone)}
              </a>
            </div>
          )}

          {contato.endereco && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {`${contato.endereco.rua}, ${contato.endereco.cidade} - ${contato.endereco.estado}`}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {contato.tags && contato.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {contato.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {contato.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{contato.tags.length - 3} mais
              </span>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {contato.proprietario}
          </div>

          {contato.data_ultima_interacao && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {calcularDiasDesdeUltimoContato(contato.data_ultima_interacao)}d atrás
            </div>
          )}
        </div>

        {/* Valor Potencial */}
        {contato.valor_potencial && contato.valor_potencial > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-sm font-medium text-[#002333]">
              Valor Potencial: <span className="text-[#159A9C]">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(contato.valor_potencial)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
