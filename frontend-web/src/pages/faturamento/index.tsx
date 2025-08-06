import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

// Componentes de UI básicos
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'default', size = 'md', className = '', disabled = false }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}> = ({ type = 'text', placeholder, value, onChange, className = '' }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
  />
);

const Select: React.FC<{
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}> = ({ value, onValueChange, children, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Componente PageHeader
const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
    {children && <div className="mt-4 md:mt-0">{children}</div>}
  </div>
);

// Tipos
interface Fatura {
  id: string;
  numero: string;
  clienteNome: string;
  clienteEmail: string;
  valor: number;
  status: 'rascunho' | 'enviada' | 'paga' | 'vencida' | 'cancelada' | 'pendente';
  dataEmissao: Date;
  dataVencimento: Date;
  dataPagamento?: Date;
  descricao: string;
  tipo: 'recorrente' | 'avulsa' | 'parcela' | 'entrada';
}

type FaturamentoView = 'lista' | 'detalhes' | 'criar';
type StatusFilter = 'todos' | 'rascunho' | 'enviada' | 'paga' | 'vencida' | 'cancelada' | 'pendente';

// Dados mock para demonstração
const mockFaturas: Fatura[] = [
  {
    id: '1',
    numero: 'FAT-2025-001',
    clienteNome: 'Empresa ABC Ltda',
    clienteEmail: 'contato@empresaabc.com',
    valor: 2500.00,
    status: 'paga',
    dataEmissao: new Date('2025-01-15'),
    dataVencimento: new Date('2025-02-15'),
    dataPagamento: new Date('2025-02-10'),
    descricao: 'Desenvolvimento de sistema CRM - Janeiro 2025',
    tipo: 'recorrente'
  },
  {
    id: '2',
    numero: 'FAT-2025-002',
    clienteNome: 'Tech Solutions S.A.',
    clienteEmail: 'financeiro@techsolutions.com',
    valor: 5000.00,
    status: 'pendente',
    dataEmissao: new Date('2025-02-01'),
    dataVencimento: new Date('2025-03-01'),
    descricao: 'Consultoria em automação - Fevereiro 2025',
    tipo: 'parcela'
  },
  {
    id: '3',
    numero: 'FAT-2025-003',
    clienteNome: 'Inovação Digital ME',
    clienteEmail: 'admin@inovacaodigital.com',
    valor: 1200.00,
    status: 'vencida',
    dataEmissao: new Date('2025-01-10'),
    dataVencimento: new Date('2025-01-25'),
    descricao: 'Manutenção de sistema - Janeiro 2025',
    tipo: 'avulsa'
  },
  {
    id: '4',
    numero: 'FAT-2025-004',
    clienteNome: 'StartupTech Inc.',
    clienteEmail: 'billing@startuptech.com',
    valor: 3750.00,
    status: 'enviada',
    dataEmissao: new Date('2025-02-05'),
    dataVencimento: new Date('2025-03-05'),
    descricao: 'Plataforma de e-commerce - Fevereiro 2025',
    tipo: 'parcela'
  },
  {
    id: '5',
    numero: 'FAT-2025-005',
    clienteNome: 'ConsultoriaMax',
    clienteEmail: 'financeiro@consultoriamax.com.br',
    valor: 8900.00,
    status: 'paga',
    dataEmissao: new Date('2025-01-20'),
    dataVencimento: new Date('2025-02-20'),
    dataPagamento: new Date('2025-02-18'),
    descricao: 'Sistema de gestão integrado - Janeiro 2025',
    tipo: 'entrada'
  }
];

export const FaturamentoPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<FaturamentoView>('lista');
  const [faturas] = useState<Fatura[]>(mockFaturas);
  const [filteredFaturas, setFilteredFaturas] = useState<Fatura[]>(mockFaturas);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');

  // Aplicar filtros
  useEffect(() => {
    let filtered = faturas;

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(fatura => fatura.status === statusFilter);
    }

    // Busca por texto
    if (searchTerm) {
      filtered = filtered.filter(fatura =>
        fatura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fatura.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFaturas(filtered);
  }, [faturas, statusFilter, searchTerm]);

  // Handlers
  const handleViewDetalhes = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setCurrentView('detalhes');
  };

  const handleEditFatura = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setCurrentView('criar');
  };

  const handleDownloadPDF = async (faturaId: string) => {
    console.log('Download PDF da fatura:', faturaId);
    // Implementar download real quando a API estiver pronta
  };

  const handleEnviarEmail = async (faturaId: string, email?: string) => {
    console.log('Enviar email da fatura:', faturaId, 'para:', email);
    // Implementar envio real quando a API estiver pronta
  };

  const handleMarcarComoPaga = async (faturaId: string) => {
    console.log('Marcar como paga:', faturaId);
    // Implementar quando a API estiver pronta
  };

  const handleMarcarComoVencida = async (faturaId: string) => {
    console.log('Marcar como vencida:', faturaId);
    // Implementar quando a API estiver pronta
  };

  const handleDeleteFatura = async (faturaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta fatura?')) {
      console.log('Excluir fatura:', faturaId);
      // Implementar quando a API estiver pronta
    }
  };

  // Estatísticas calculadas dos dados mock
  const totalFaturas = faturas.length;
  const faturasPagas = faturas.filter(f => f.status === 'paga').length;
  const faturasVencidas = faturas.filter(f => f.status === 'vencida').length;
  const faturasPendentes = faturas.filter(f => f.status === 'pendente').length;
  const valorTotal = faturas.reduce((total, f) => total + f.valor, 0);
  const valorRecebido = faturas.filter(f => f.status === 'paga').reduce((total, f) => total + f.valor, 0);
  const valorVencido = faturas.filter(f => f.status === 'vencida').reduce((total, f) => total + f.valor, 0);

  const estatisticas = {
    totalFaturas,
    faturasPagas,
    faturasVencidas,
    faturasPendentes,
    valorTotal,
    valorRecebido,
    valorVencido
  };

  // Função para formatar datas
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar valores
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Função para obter badge do status
  const getStatusBadge = (status: Fatura['status']) => {
    const statusConfig = {
      rascunho: { variant: 'default' as const, label: 'Rascunho', icon: Edit },
      enviada: { variant: 'info' as const, label: 'Enviada', icon: Mail },
      paga: { variant: 'success' as const, label: 'Paga', icon: CheckCircle },
      vencida: { variant: 'danger' as const, label: 'Vencida', icon: AlertCircle },
      cancelada: { variant: 'default' as const, label: 'Cancelada', icon: X },
      pendente: { variant: 'warning' as const, label: 'Pendente', icon: Clock }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Render das estatísticas
  const renderResumoCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Faturas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.totalFaturas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faturas Pagas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.faturasPagas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faturas Vencidas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.faturasVencidas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faturas Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.faturasPendentes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render do resumo financeiro
  const renderResumoFinanceiro = () => (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">Resumo Financeiro</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(estatisticas.valorTotal)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Valor Recebido</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(estatisticas.valorRecebido)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Valor Vencido</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(estatisticas.valorVencido)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render dos filtros
  const renderFiltros = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número, cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <option value="todos">Todos os status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="paga">Paga</option>
              <option value="vencida">Vencida</option>
              <option value="cancelada">Cancelada</option>
              <option value="pendente">Pendente</option>
            </Select>
          </div>
          <Button
            onClick={() => setCurrentView('criar')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render da lista de faturas
  const renderListaFaturas = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFaturas.map((fatura) => (
                <tr key={fatura.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fatura.numero}</div>
                    <div className="text-sm text-gray-500">{fatura.tipo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fatura.clienteNome}</div>
                    <div className="text-sm text-gray-500">{fatura.clienteEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(fatura.valor)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(fatura.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(fatura.dataVencimento)}</div>
                    {fatura.dataPagamento && (
                      <div className="text-sm text-gray-500">Pago em {formatDate(fatura.dataPagamento)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetalhes(fatura)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditFatura(fatura)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(fatura.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnviarEmail(fatura.id, fatura.clienteEmail)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFaturas.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma fatura encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando uma nova fatura'
              }
            </p>
            {(!searchTerm && statusFilter === 'todos') && (
              <div className="mt-6">
                <Button onClick={() => setCurrentView('criar')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render dos detalhes da fatura
  const renderDetalhes = () => {
    if (!selectedFatura) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedFatura.numero}</h2>
            <p className="text-gray-600">{selectedFatura.descricao}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('lista')}
            >
              Voltar
            </Button>
            <Button
              onClick={() => handleEditFatura(selectedFatura)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{selectedFatura.clienteNome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedFatura.clienteEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações da Fatura</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedFatura.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-medium capitalize">{selectedFatura.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedFatura.valor)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Datas</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Data de Emissão</p>
                  <p className="font-medium">{formatDate(selectedFatura.dataEmissao)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Vencimento</p>
                  <p className="font-medium">{formatDate(selectedFatura.dataVencimento)}</p>
                </div>
                {selectedFatura.dataPagamento && (
                  <div>
                    <p className="text-sm text-gray-600">Data de Pagamento</p>
                    <p className="font-medium text-green-600">{formatDate(selectedFatura.dataPagamento)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ações</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownloadPDF(selectedFatura.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnviarEmail(selectedFatura.id, selectedFatura.clienteEmail)}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Enviar por Email
                </Button>
                {selectedFatura.status !== 'paga' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarcarComoPaga(selectedFatura.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Marcar como Paga
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteFatura(selectedFatura.id)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render do formulário de criação/edição
  const renderFormCriar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedFatura ? 'Editar Fatura' : 'Nova Fatura'}
          </h2>
          <p className="text-gray-600">
            {selectedFatura ? 'Edite as informações da fatura' : 'Preencha os dados para criar uma nova fatura'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentView('lista')}
        >
          Cancelar
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Formulário em Desenvolvimento</h3>
            <p className="mt-1 text-sm text-gray-500">
              O formulário de criação/edição de faturas será implementado em breve.
            </p>
            <div className="mt-6">
              <Button onClick={() => setCurrentView('lista')}>
                Voltar à Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render principal
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento"
        subtitle="Gerencie suas faturas e recebimentos"
      />

      {currentView === 'lista' && (
        <>
          {renderResumoCards()}
          {renderResumoFinanceiro()}
          {renderFiltros()}
          {renderListaFaturas()}
        </>
      )}

      {currentView === 'detalhes' && renderDetalhes()}
      {currentView === 'criar' && renderFormCriar()}
    </div>
  );
};

export default FaturamentoPage;
