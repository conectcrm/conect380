import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { EmpresaCard } from '../components/EmpresaCard';
import { EmpresaFilters } from '../components/EmpresaFilters';
import { EmpresaMetrics } from '../components/EmpresaMetrics';
import { ModalCadastroEmpresa } from '../components/ModalCadastroEmpresa';
import { useNotifications } from '../../../contexts/NotificationContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: 'starter' | 'professional' | 'enterprise';
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  usuariosAtivos: number;
  clientesCadastrados: number;
  ultimoAcesso: Date;
  dataExpiracao: Date;
  valorMensal: number;
}

export const EmpresasListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModalCadastro, setShowModalCadastro] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    plano: '',
    dataInicio: '',
    dataFim: ''
  });

  // Dados mock para demonstração
  useEffect(() => {
    const mockEmpresas: Empresa[] = [
      {
        id: '1',
        nome: 'TechCorp Solutions',
        cnpj: '12.345.678/0001-99',
        email: 'contato@techcorp.com',
        plano: 'professional',
        status: 'ativa',
        usuariosAtivos: 8,
        clientesCadastrados: 1250,
        ultimoAcesso: new Date('2025-07-23T10:30:00'),
        dataExpiracao: new Date('2025-12-15'),
        valorMensal: 299
      },
      {
        id: '2',
        nome: 'StartupXYZ',
        cnpj: '98.765.432/0001-11',
        email: 'admin@startupxyz.com',
        plano: 'starter',
        status: 'trial',
        usuariosAtivos: 2,
        clientesCadastrados: 45,
        ultimoAcesso: new Date('2025-07-22T16:45:00'),
        dataExpiracao: new Date('2025-08-05'),
        valorMensal: 0
      },
      {
        id: '3',
        nome: 'Enterprise Corp',
        cnpj: '11.222.333/0001-44',
        email: 'sistemas@enterprise.com.br',
        plano: 'enterprise',
        status: 'ativa',
        usuariosAtivos: 25,
        clientesCadastrados: 5680,
        ultimoAcesso: new Date('2025-07-23T08:15:00'),
        dataExpiracao: new Date('2026-01-20'),
        valorMensal: 899
      }
    ];

    setTimeout(() => {
      setEmpresas(mockEmpresas);
      setLoading(false);
      
      addNotification({
        title: '🏢 Empresas Carregadas',
        message: `${mockEmpresas.length} empresas encontradas`,
        type: 'info',
        priority: 'low'
      });
    }, 1000);
  }, [addNotification]);

  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         empresa.cnpj.includes(searchTerm) ||
                         empresa.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || empresa.status === filters.status;
    const matchesPlano = !filters.plano || empresa.plano === filters.plano;
    
    return matchesSearch && matchesStatus && matchesPlano;
  });

  const handleNovaEmpresa = () => {
    setEmpresaEditando(null);
    setShowModalCadastro(true);
  };

  const handleEditarEmpresa = (empresa: Empresa) => {
    setEmpresaEditando(empresa);
    setShowModalCadastro(true);
  };

  const handleSalvarEmpresa = async (dadosEmpresa: any) => {
    try {
      if (empresaEditando) {
        // Atualizar empresa existente
        setEmpresas(empresas.map(emp => 
          emp.id === empresaEditando.id 
            ? { ...emp, ...dadosEmpresa }
            : emp
        ));
        
        addNotification({
          title: '✅ Empresa Atualizada',
          message: `${dadosEmpresa.nome} foi atualizada com sucesso`,
          type: 'success',
          priority: 'medium',
          entityType: 'cliente'
        });
      } else {
        // Criar nova empresa
        const novaEmpresa: Empresa = {
          id: Date.now().toString(),
          nome: dadosEmpresa.nome,
          cnpj: dadosEmpresa.cnpj,
          email: dadosEmpresa.email,
          plano: dadosEmpresa.plano,
          status: dadosEmpresa.status,
          usuariosAtivos: 1,
          clientesCadastrados: 0,
          ultimoAcesso: new Date(),
          dataExpiracao: new Date(dadosEmpresa.dataFimContrato),
          valorMensal: dadosEmpresa.valorMensal
        };
        
        setEmpresas([novaEmpresa, ...empresas]);
        
        addNotification({
          title: '🎉 Nova Empresa Cadastrada',
          message: `${dadosEmpresa.nome} foi cadastrada com sucesso`,
          type: 'success',
          priority: 'medium',
          entityType: 'cliente'
        });
      }
      
      setShowModalCadastro(false);
    } catch (error) {
      addNotification({
        title: '❌ Erro ao Salvar',
        message: 'Não foi possível salvar a empresa. Tente novamente.',
        type: 'error',
        priority: 'high',
        entityType: 'cliente'
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      plano: '',
      dataInicio: '',
      dataFim: ''
    });
  };

  const handleEmpresaClick = (empresaId: string) => {
    const empresa = empresas.find(emp => emp.id === empresaId);
    if (empresa) {
      handleEditarEmpresa(empresa);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Gestão"
          nucleusPath="/nuclei/gestao"
          currentModuleName="Gestão de Empresas"
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-[#159A9C]" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-3 py-2 rounded-lg border transition-colors flex items-center space-x-2
                ${showFilters 
                  ? 'bg-[#159A9C] text-white border-[#159A9C]' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>

            <button
              onClick={handleNovaEmpresa}
              className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <EmpresaFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
          />
        )}
      </div>

      {/* Métricas */}
      <EmpresaMetrics empresas={empresas} />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-auto p-6">
        {filteredEmpresas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Tente ajustar os filtros de busca' 
                : 'Não há empresas cadastradas no sistema'
              }
            </p>
            {!searchTerm && !Object.values(filters).some(f => f) && (
              <button
                onClick={handleNovaEmpresa}
                className="bg-[#159A9C] text-white px-6 py-3 rounded-lg hover:bg-[#138A8C] transition-colors"
              >
                Cadastrar Primeira Empresa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmpresas.map(empresa => (
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                onClick={() => handleEmpresaClick(empresa.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <ModalCadastroEmpresa
        isOpen={showModalCadastro}
        onClose={() => setShowModalCadastro(false)}
        onSave={handleSalvarEmpresa}
        empresa={empresaEditando}
      />
    </div>
  );
};
