import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalContato } from '../../components/contatos/ModalContato';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import { ContatoCard } from '../../components/contatos/ContatoCard';
import { ContatoFilters } from '../../components/contatos/ContatoFilters';
import { ContatoMetrics } from '../../components/contatos/ContatoMetrics';
import { contatosService, Contato } from './services/contatosService';
import { safeRender, validateAndSanitizeContact } from '../../utils/safeRender';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Star,
  UserPlus,
  Import,
  FileText,
  Grid3X3,
  List,
  SortAsc,
  Settings,
  Tag,
  Activity,
  TrendingUp,
} from 'lucide-react';

// Interface para o contato da UI
interface ContatoUI {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  status: 'ativo' | 'inativo' | 'prospecto' | 'cliente' | 'ex-cliente';
  tipo: 'lead' | 'cliente' | 'parceiro' | 'fornecedor' | 'outro';
  fonte: string;
  proprietario: string;
  data_criacao: string;
  data_ultima_interacao: string;
  data_nascimento?: string;
  endereco?: {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
    pais: string;
  };
  redes_sociais?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  tags: string[];
  pontuacao_lead: number;
  valor_potencial: number;
  notas: string;
  anexos: any[];
  atividades_recentes: number;
  oportunidades_abertas: number;
  vendas_realizadas: number;
  valor_total_vendas: number;
  categoria: string;
}

// Dados mock para desenvolvimento - inspirados nos CRMs líderes
const mockContatos: ContatoUI[] = [
  {
    id: '001',
    nome: 'João Silva Santos',
    email: 'joao.santos@techsolutions.com.br',
    telefone: '+55 11 99999-8888',
    empresa: 'Tech Solutions Ltda',
    cargo: 'Diretor de TI',
    status: 'cliente',
    tipo: 'cliente',
    fonte: 'Website',
    proprietario: 'Maria Santos',
    data_criacao: '2024-11-15',
    data_ultima_interacao: '2025-01-20',
    data_nascimento: '1985-06-15',
    endereco: {
      rua: 'Av. Paulista, 1000',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      pais: 'Brasil',
    },
    redes_sociais: {
      linkedin: 'https://linkedin.com/in/joaosantos',
      twitter: '@joaosantos',
    },
    tags: ['VIP', 'Tecnologia', 'Decisor'],
    pontuacao_lead: 95,
    valor_potencial: 150000,
    notas:
      'Cliente estratégico com alto potencial de crescimento. Interessado em soluções de automação.',
    anexos: [],
    atividades_recentes: 12,
    oportunidades_abertas: 2,
    vendas_realizadas: 3,
    valor_total_vendas: 285000,
    categoria: 'enterprise',
  },
  {
    id: '002',
    nome: 'Maria Oliveira Costa',
    email: 'maria.costa@startupxyz.com',
    telefone: '+55 11 98888-7777',
    empresa: 'StartupXYZ',
    cargo: 'CEO & Founder',
    status: 'prospecto',
    tipo: 'lead',
    fonte: 'LinkedIn',
    proprietario: 'Pedro Costa',
    data_criacao: '2025-01-10',
    data_ultima_interacao: '2025-01-21',
    data_nascimento: '1990-03-22',
    endereco: {
      rua: 'Rua das Startups, 500',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04567-890',
      pais: 'Brasil',
    },
    redes_sociais: {
      linkedin: 'https://linkedin.com/in/mariacosta',
      instagram: '@mariacosta_ceo',
    },
    tags: ['Startup', 'CEO', 'Inovação', 'Quente'],
    pontuacao_lead: 85,
    valor_potencial: 75000,
    notas:
      'Founder de startup em crescimento. Muito interessada em soluções de CRM e automação de vendas.',
    anexos: [],
    atividades_recentes: 8,
    oportunidades_abertas: 1,
    vendas_realizadas: 0,
    valor_total_vendas: 0,
    categoria: 'startup',
  },
  {
    id: '003',
    nome: 'Carlos Roberto Mendes',
    email: 'carlos.mendes@empresaabc.com.br',
    telefone: '+55 11 97777-6666',
    empresa: 'Empresa ABC Ltda',
    cargo: 'Gerente de Vendas',
    status: 'ativo',
    tipo: 'cliente',
    fonte: 'Indicação',
    proprietario: 'Ana Silva',
    data_criacao: '2024-09-05',
    data_ultima_interacao: '2025-01-19',
    data_nascimento: '1982-11-08',
    endereco: {
      rua: 'Rua do Comércio, 1500',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20040-020',
      pais: 'Brasil',
    },
    redes_sociais: {
      linkedin: 'https://linkedin.com/in/carlosmendes',
    },
    tags: ['Vendas', 'Tradicional', 'Confiável'],
    pontuacao_lead: 70,
    valor_potencial: 45000,
    notas:
      'Cliente tradicional com processo de vendas bem estruturado. Busca melhorias incrementais.',
    anexos: [],
    atividades_recentes: 5,
    oportunidades_abertas: 1,
    vendas_realizadas: 2,
    valor_total_vendas: 89000,
    categoria: 'tradicional',
  },
  {
    id: '004',
    nome: 'Ana Paula Rodrigues',
    email: 'ana.rodrigues@inovacorp.com',
    telefone: '+55 11 96666-5555',
    empresa: 'InovaCorp',
    cargo: 'Diretora de Marketing',
    status: 'prospecto',
    tipo: 'lead',
    fonte: 'Google Ads',
    proprietario: 'Lucas Oliveira',
    data_criacao: '2025-01-18',
    data_ultima_interacao: '2025-01-21',
    data_nascimento: '1988-07-12',
    endereco: {
      rua: 'Av. Inovação, 800',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30140-070',
      pais: 'Brasil',
    },
    redes_sociais: {
      linkedin: 'https://linkedin.com/in/anapaula',
      instagram: '@anapaula_mkt',
      twitter: '@anapaula_mkt',
    },
    tags: ['Marketing', 'Digital', 'Inovação', 'Novo'],
    pontuacao_lead: 78,
    valor_potencial: 92000,
    notas: 'Diretora de marketing em empresa inovadora. Foco em soluções digitais e automação.',
    anexos: [],
    atividades_recentes: 3,
    oportunidades_abertas: 1,
    vendas_realizadas: 0,
    valor_total_vendas: 0,
    categoria: 'digital',
  },
  {
    id: '005',
    nome: 'Fernando Silva Lopes',
    email: 'fernando.lopes@comercialmax.com.br',
    telefone: '+55 11 95555-4444',
    empresa: 'Comercial Max',
    cargo: 'Proprietário',
    status: 'ex-cliente',
    tipo: 'cliente',
    fonte: 'Feira/Evento',
    proprietario: 'Carla Santos',
    data_criacao: '2023-03-20',
    data_ultima_interacao: '2024-12-15',
    data_nascimento: '1975-09-30',
    endereco: {
      rua: 'Rua do Comércio Popular, 300',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '03020-010',
      pais: 'Brasil',
    },
    redes_sociais: {
      facebook: 'https://facebook.com/fernandolopes',
    },
    tags: ['PME', 'Tradicional', 'Reativar'],
    pontuacao_lead: 45,
    valor_potencial: 25000,
    notas:
      'Ex-cliente que cancelou por questões financeiras. Empresa em recuperação, possível reativação.',
    anexos: [],
    atividades_recentes: 1,
    oportunidades_abertas: 0,
    vendas_realizadas: 1,
    valor_total_vendas: 35000,
    categoria: 'reativacao',
  },
  {
    id: '006',
    nome: 'Juliana Freitas Santos',
    email: 'juliana.santos@consultoriaplus.com',
    telefone: '+55 11 94444-3333',
    empresa: 'Consultoria Plus',
    cargo: 'Sócia-Diretora',
    status: 'ativo',
    tipo: 'parceiro',
    fonte: 'Networking',
    proprietario: 'Roberto Lima',
    data_criacao: '2024-08-12',
    data_ultima_interacao: '2025-01-22',
    data_nascimento: '1983-12-05',
    endereco: {
      rua: 'Av. das Nações, 1200',
      cidade: 'Brasília',
      estado: 'DF',
      cep: '70040-010',
      pais: 'Brasil',
    },
    redes_sociais: {
      linkedin: 'https://linkedin.com/in/julianasantos',
      twitter: '@juliana_plus',
    },
    tags: ['Parceiro', 'Consultoria', 'B2B', 'Referência'],
    pontuacao_lead: 90,
    valor_potencial: 120000,
    notas: 'Parceira estratégica com excelente rede de contatos. Fonte importante de indicações.',
    anexos: [],
    atividades_recentes: 15,
    oportunidades_abertas: 3,
    vendas_realizadas: 4,
    valor_total_vendas: 156000,
    categoria: 'parceiro',
  },
];

const ContatosPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Estados principais
  const [contatos, setContatos] = useState<ContatoUI[]>(mockContatos);
  const [filteredContatos, setFilteredContatos] = useState<ContatoUI[]>(mockContatos);
  const [selectedContato, setSelectedContato] = useState<ContatoUI | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [proprietarioFilter, setProprietarioFilter] = useState<string>('todos');
  const [fonteFilter, setFonteFilter] = useState<string>('todas');
  const [showFilters, setShowFilters] = useState(false);

  // Estados de visualização
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados de seleção em massa
  const [selectedContatos, setSelectedContatos] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = contatos.length;
    const ativos = contatos.filter((c) => c.status === 'ativo' || c.status === 'cliente').length;
    const prospectos = contatos.filter((c) => c.status === 'prospecto').length;
    const leads = contatos.filter((c) => c.tipo === 'lead').length;
    const valorPotencial = contatos.reduce((sum, c) => sum + c.valor_potencial, 0);
    const pontuacaoMedia = contatos.reduce((sum, c) => sum + c.pontuacao_lead, 0) / total;
    const novosMes = contatos.filter((c) => {
      const dataContato = new Date(c.data_criacao);
      const agora = new Date();
      return (
        dataContato.getMonth() === agora.getMonth() &&
        dataContato.getFullYear() === agora.getFullYear()
      );
    }).length;

    return {
      total,
      ativos,
      prospectos,
      leads,
      valorPotencial,
      pontuacaoMedia: Math.round(pontuacaoMedia),
      novosMes,
      taxaConversao: total > 0 ? Math.round((ativos / total) * 100) : 0,
    };
  }, [contatos]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...contatos];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contato) =>
          contato.nome.toLowerCase().includes(term) ||
          contato.email.toLowerCase().includes(term) ||
          contato.empresa.toLowerCase().includes(term) ||
          contato.telefone.includes(term) ||
          contato.cargo.toLowerCase().includes(term) ||
          contato.tags.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    // Filtros específicos
    if (statusFilter !== 'todos') {
      filtered = filtered.filter((contato) => contato.status === statusFilter);
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter((contato) => contato.tipo === tipoFilter);
    }

    if (proprietarioFilter !== 'todos') {
      filtered = filtered.filter((contato) => contato.proprietario === proprietarioFilter);
    }

    if (fonteFilter !== 'todas') {
      filtered = filtered.filter((contato) => contato.fonte === fonteFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case 'nome':
          valueA = a.nome;
          valueB = b.nome;
          break;
        case 'empresa':
          valueA = a.empresa;
          valueB = b.empresa;
          break;
        case 'data_criacao':
          valueA = new Date(a.data_criacao);
          valueB = new Date(b.data_criacao);
          break;
        case 'pontuacao_lead':
          valueA = a.pontuacao_lead;
          valueB = b.pontuacao_lead;
          break;
        case 'valor_potencial':
          valueA = a.valor_potencial;
          valueB = b.valor_potencial;
          break;
        default:
          valueA = a.nome;
          valueB = b.nome;
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredContatos(filtered);
  }, [
    contatos,
    searchTerm,
    statusFilter,
    tipoFilter,
    proprietarioFilter,
    fonteFilter,
    sortBy,
    sortOrder,
  ]);

  // Funções de manipulação
  const handleSelectContato = (contato: ContatoUI) => {
    setSelectedContato(contato);
    setShowModal(true);
  };

  const handleEditContato = (contato: ContatoUI) => {
    setSelectedContato(contato);
    setShowNewModal(true);
  };

  const handleDeleteContato = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      setContatos((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'delete':
        if (window.confirm(`Tem certeza que deseja excluir ${selectedContatos.length} contatos?`)) {
          setContatos((prev) => prev.filter((c) => !selectedContatos.includes(c.id)));
          setSelectedContatos([]);
        }
        break;
      case 'export':
        // Implementar exportação
        console.log('Exportando contatos:', selectedContatos);
        break;
      case 'assign':
        // Implementar atribuição
        console.log('Atribuindo contatos:', selectedContatos);
        break;
    }
    setShowBulkActions(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setTipoFilter('todos');
    setProprietarioFilter('todos');
    setFonteFilter('todas');
  };

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      {/* Header com Back to Nucleus */}
      <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" currentModuleName="Contatos" />

      <div className="p-6">
        {/* Métricas de Contatos */}
        <ContatoMetrics metrics={metrics} />

        {/* Header da Lista */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[#B4BEC9]">Gerencie todos os seus contatos e relacionamentos</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>

              <button className="flex items-center gap-2 px-4 py-2 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button className="flex items-center gap-2 px-4 py-2 border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-[#DEEFE7] transition-colors">
                <Import className="w-4 h-4" />
                Importar
              </button>

              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Novo Contato
              </button>
            </div>
          </div>

          {/* Barra de Pesquisa e Controles */}
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            {/* Pesquisa */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email, empresa, telefone ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              />
            </div>

            {/* Controles de Visualização */}
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-[#159A9C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-[#159A9C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                <option value="nome">Nome</option>
                <option value="empresa">Empresa</option>
                <option value="data_criacao">Data de Criação</option>
                <option value="pontuacao_lead">Pontuação</option>
                <option value="valor_potencial">Valor Potencial</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SortAsc
                  className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <ContatoFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tipoFilter={tipoFilter}
            setTipoFilter={setTipoFilter}
            proprietarioFilter={proprietarioFilter}
            setProprietarioFilter={setProprietarioFilter}
            fonteFilter={fonteFilter}
            setFonteFilter={setFonteFilter}
            onReset={resetFilters}
          />
        )}

        {/* Ações em Massa */}
        {selectedContatos.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedContatos.length} contatos selecionados
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('assign')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Atribuir
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Exportar
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Contatos */}
        <div className="bg-white rounded-lg shadow-sm">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredContatos.map((contato) => (
                <ContatoCard
                  key={contato.id}
                  contato={contato}
                  onSelect={handleSelectContato}
                  onEdit={handleEditContato}
                  onDelete={handleDeleteContato}
                  isSelected={selectedContatos.includes(contato.id)}
                  onSelectToggle={(id, selected) => {
                    if (selected) {
                      setSelectedContatos((prev) => [...prev, id]);
                    } else {
                      setSelectedContatos((prev) => prev.filter((cId) => cId !== id));
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContatos.map((contato) => (
                <div key={contato.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Implementar vista em lista */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedContatos.includes(contato.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContatos((prev) => [...prev, contato.id]);
                          } else {
                            setSelectedContatos((prev) => prev.filter((cId) => cId !== contato.id));
                          }
                        }}
                        className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {(() => {
                            try {
                              const safeContato = validateAndSanitizeContact(contato);
                              return safeRender(safeContato.nome);
                            } catch {
                              return 'Nome não disponível';
                            }
                          })()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {safeRender(contato.empresa)} • {safeRender(contato.cargo)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          contato.status === 'cliente'
                            ? 'bg-green-100 text-green-800'
                            : contato.status === 'prospecto'
                              ? 'bg-blue-100 text-blue-800'
                              : contato.status === 'ativo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(() => {
                          try {
                            const safeContato = validateAndSanitizeContact(contato);
                            return safeRender(safeContato.status);
                          } catch {
                            return 'Status não disponível';
                          }
                        })()}
                      </span>
                      <button
                        onClick={() => handleSelectContato(contato)}
                        className="p-1 text-gray-400 hover:text-[#159A9C]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredContatos.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contato encontrado</h3>
              <p className="text-gray-500 mb-4">
                Tente ajustar os filtros ou adicionar um novo contato.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Contato
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {showModal && selectedContato && (
        <ModalContato
          contato={selectedContato}
          onClose={() => {
            setShowModal(false);
            setSelectedContato(null);
          }}
          onEdit={handleEditContato}
          onDelete={handleDeleteContato}
        />
      )}

      {showNewModal && (
        <ModalNovoContato
          contato={selectedContato}
          onClose={() => {
            setShowNewModal(false);
            setSelectedContato(null);
          }}
          onSave={(contato) => {
            if (selectedContato) {
              // Editar
              setContatos((prev) => prev.map((c) => (c.id === contato.id ? contato : c)));
            } else {
              // Criar
              setContatos((prev) => [...prev, { ...contato, id: Date.now().toString() }]);
            }
            setShowNewModal(false);
            setSelectedContato(null);
          }}
        />
      )}
    </div>
  );
};

export default ContatosPage;
