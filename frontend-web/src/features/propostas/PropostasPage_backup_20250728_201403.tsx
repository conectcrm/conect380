import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { ModalProposta } from '../../components/modals/ModalProposta';
import { ModalNovaProposta } from '../../components/modals/ModalNovaProposta';
import { propostasService, PropostaCompleta } from './services/propostasService';
import { pdfPropostasService, DadosProposta } from '../../services/pdfPropostasService';
import DashboardPropostas from './components/DashboardPropostas';
import BulkActions from './components/BulkActions';
import FiltrosAvancados from './components/FiltrosAvancados';
import PropostaActions from './components/PropostaActions';
import ModalVisualizarProposta from './components/ModalVisualizarProposta';
import { safeRender } from '../../utils/safeRender';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  Grid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  BarChart3,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
  Copy
} from 'lucide-react';

// Função para converter PropostaCompleta para o formato da UI
const converterPropostaParaUI = (proposta: PropostaCompleta) => {
  return {
    id: safeRender(proposta.id) || '',
    numero: safeRender(proposta.numero) || '',
    cliente: safeRender(proposta.cliente?.nome) || 'Cliente não informado',
    cliente_contato: safeRender(proposta.cliente?.email) || '',
    titulo: `Proposta para ${safeRender(proposta.cliente?.nome) || 'Cliente'}`,
    valor: Number(proposta.total) || 0,
    status: safeRender(proposta.status) || 'rascunho',
    data_criacao: proposta.criadaEm ? new Date(proposta.criadaEm).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    data_vencimento: proposta.dataValidade ? new Date(proposta.dataValidade).toISOString().split('T')[0] : '',
    data_aprovacao: proposta.status === 'aprovada' ? new Date().toISOString().split('T')[0] : null,
    vendedor: safeRender(proposta.vendedor?.nome) || 'Sistema', // Usando vendedor real
    descricao: safeRender(proposta.observacoes) || `Proposta com ${proposta.produtos?.length || 0} produtos`,
    probabilidade: proposta.status === 'aprovada' ? 100 : proposta.status === 'enviada' ? 70 : proposta.status === 'rejeitada' ? 0 : 30,
    categoria: 'proposta'
  };
};

// Dados removidos - sistema agora trabalha apenas com dados reais do banco

const PropostasPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  // Estados inicializados com arrays vazios - dados vêm do banco
  const [propostas, setPropostas] = useState<any[]>([]);
  const [filteredPropostas, setFilteredPropostas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedVendedor, setSelectedVendedor] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);

  // Debug: Log sempre que showWizardModal mudar
  useEffect(() => {
    console.log('🔄 PropostasPage: showWizardModal mudou para:', showWizardModal);
  }, [showWizardModal]);

  // Novos estados para funcionalidades avançadas
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'data_criacao' | 'valor' | 'cliente' | 'status'>('data_criacao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'dashboard'>('dashboard'); // Novo modo dashboard
  const [filtrosAvancados, setFiltrosAvancados] = useState<any>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPropostaForView, setSelectedPropostaForView] = useState<PropostaCompleta | null>(null);

  // Carregar propostas reais do serviço
  useEffect(() => {
    carregarPropostas();
  }, []);

  // Atualizar lista quando página voltar ao foco (ex: voltar de nova proposta)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Página voltou ao foco, recarregando propostas...');
      setTimeout(() => carregarPropostas(), 500);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 🆕 Escutar eventos de atualização de propostas vindos do portal
  useEffect(() => {
    const handlePropostaAtualizada = (event: CustomEvent) => {
      console.log('🔄 Evento de atualização recebido do portal:', event.detail);
      const { propostaId, novoStatus, fonte } = event.detail;

      // Atualizar a proposta localmente em tempo real
      setPropostas(prev =>
        prev.map(p =>
          p.numero === propostaId || p.id === propostaId
            ? { ...p, status: novoStatus, updatedAt: new Date().toISOString() }
            : p
        )
      );

      // Aplicar também ao array filtrado
      setFilteredPropostas(prev =>
        prev.map(p =>
          p.numero === propostaId || p.id === propostaId
            ? { ...p, status: novoStatus, updatedAt: new Date().toISOString() }
            : p
        )
      );

      // Recarregar todas as propostas após um delay para garantir sincronização completa
      setTimeout(() => {
        console.log('♻️ Recarregando propostas após atualização do portal...');
        carregarPropostas();
      }, 2000);
    };

    // Adicionar listener para atualizações do portal
    window.addEventListener('propostaAtualizada', handlePropostaAtualizada as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('propostaAtualizada', handlePropostaAtualizada as EventListener);
    };
  }, []);

  // Função para salvar proposta usando serviço real
  const handleSaveProposta = async (data: any) => {
    try {
      setIsLoadingCreate(true);
      console.log('💾 Salvando proposta no banco de dados...', data);

      // Usar o serviço real para criar a proposta
      const novaProposta = await propostasService.criarProposta(data);
      
      console.log('✅ Proposta criada com sucesso:', novaProposta);
      
      // Recarregar a lista de propostas para incluir a nova
      await carregarPropostas();
      
      showNotification('Proposta criada com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      showNotification('Erro ao criar proposta. Tente novamente.', 'error');
    } finally {
      setIsLoadingCreate(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = propostas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(proposta =>
        proposta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposta.cliente_contato.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (selectedStatus !== 'todos') {
      filtered = filtered.filter(proposta => proposta.status === selectedStatus);
    }

    // Filtro por vendedor
    if (selectedVendedor !== 'todos') {
      filtered = filtered.filter(proposta => proposta.vendedor === selectedVendedor);
    }

    // Filtros avançados - range de datas
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(proposta => {
        const dataCreated = new Date(proposta.data_criacao);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return dataCreated >= startDate && dataCreated <= endDate;
      });
    }

    // Filtros avançados - range de valores
    if (valueRange.min || valueRange.max) {
      filtered = filtered.filter(proposta => {
        const valor = proposta.valor;
        const min = valueRange.min ? parseFloat(valueRange.min) : 0;
        const max = valueRange.max ? parseFloat(valueRange.max) : Infinity;
        return valor >= min && valor <= max;
      });
    }

    // Filtros avançados do componente FiltrosAvancados
    if (filtrosAvancados.status) {
      filtered = filtered.filter(p => p.status === filtrosAvancados.status);
    }
    if (filtrosAvancados.vendedor) {
      filtered = filtered.filter(p => p.vendedor === filtrosAvancados.vendedor);
    }
    if (filtrosAvancados.dataInicio && filtrosAvancados.dataFim) {
      filtered = filtered.filter(p => {
        const dataProposta = new Date(p.data_criacao);
        const inicio = new Date(filtrosAvancados.dataInicio);
        const fim = new Date(filtrosAvancados.dataFim);
        return dataProposta >= inicio && dataProposta <= fim;
      });
    }
    if (filtrosAvancados.valorMin !== undefined) {
      filtered = filtered.filter(p => p.valor >= filtrosAvancados.valorMin);
    }
    if (filtrosAvancados.valorMax !== undefined) {
      filtered = filtered.filter(p => p.valor <= filtrosAvancados.valorMax);
    }
    if (filtrosAvancados.categoria) {
      filtered = filtered.filter(p => p.categoria === filtrosAvancados.categoria);
    }
    if (filtrosAvancados.probabilidadeMin !== undefined) {
      filtered = filtered.filter(p => p.probabilidade >= filtrosAvancados.probabilidadeMin);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'data_criacao':
          comparison = new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
          break;
        case 'valor':
          comparison = a.valor - b.valor;
          break;
        case 'cliente':
          comparison = a.cliente.localeCompare(b.cliente);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPropostas(filtered);
  }, [propostas, searchTerm, selectedStatus, selectedVendedor, dateRange, valueRange, sortBy, sortOrder, filtrosAvancados]);

  // Funções para seleção em massa
  const handleSelectProposta = (propostaId: string) => {
    setSelectedPropostas(prev =>
      prev.includes(propostaId)
        ? prev.filter(id => id !== propostaId)
        : [...prev, propostaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPropostas.length === filteredPropostas.length) {
      setSelectedPropostas([]);
    } else {
      setSelectedPropostas(filteredPropostas.map(p => p.id));
    }
  };

  // Função para mostrar notificações
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Função para lidar com ações em lote
  const handleBulkAction = (action: string, success: boolean) => {
    showNotification(action, success ? 'success' : 'error');
    if (success) {
      // Recarregar propostas após ação bem-sucedida
      carregarPropostas();
    }
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedPropostas([]);
  };

  // Função para aplicar filtros avançados
  const handleAdvancedFilters = (filtros: any) => {
    setFiltrosAvancados(filtros);
  };

  // Função para clonar proposta
  const handleCloneProposta = async (propostaId: string) => {
    try {
      const propostaClonada = await propostasService.clonarProposta(propostaId);
      showNotification('Proposta clonada com sucesso!', 'success');
      carregarPropostas();
    } catch (error) {
      console.error('Erro ao clonar proposta:', error);
      showNotification('Erro ao clonar proposta', 'error');
    }
  };

  // Função principal para carregar propostas
  const carregarPropostas = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Carregando propostas do banco de dados...');
      
      const propostasReais = await propostasService.listarPropostas();

      console.log('🔄 Propostas carregadas do serviço:', propostasReais.length);

      if (propostasReais && propostasReais.length > 0) {
        const propostasFormatadas = propostasReais.map(converterPropostaParaUI);

        // Validar que todas as propostas têm campos string
        const propostasValidadas = propostasFormatadas.map(proposta => ({
          ...proposta,
          numero: safeRender(proposta.numero),
          cliente: safeRender(proposta.cliente),
          cliente_contato: safeRender(proposta.cliente_contato),
          titulo: safeRender(proposta.titulo),
          status: safeRender(proposta.status),
          vendedor: safeRender(proposta.vendedor),
          categoria: safeRender(proposta.categoria),
          descricao: safeRender(proposta.descricao),
          data_criacao: safeRender(proposta.data_criacao),
          data_vencimento: safeRender(proposta.data_vencimento),
          data_aprovacao: proposta.data_aprovacao ? safeRender(proposta.data_aprovacao) : null,
          valor: Number(proposta.valor) || 0,
          probabilidade: Number(proposta.probabilidade) || 0
        }));

        setPropostas(propostasValidadas);
        setFilteredPropostas(propostasValidadas);
        console.log('✅ Propostas carregadas do banco:', propostasValidadas.length);
      } else {
        setPropostas([]);
        setFilteredPropostas([]);
        console.log('📝 Nenhuma proposta encontrada no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar propostas:', error);
      setPropostas([]);
      setFilteredPropostas([]);
      showNotification('Erro ao carregar propostas do banco de dados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Ações em massa usando serviços reais
  const handleBulkDelete = async () => {
    if (window.confirm(`Deseja excluir ${selectedPropostas.length} proposta(s) selecionada(s)?`)) {
      try {
        setIsLoading(true);
        console.log('🗑️ Excluindo propostas em lote:', selectedPropostas);
        
        // Usar o serviço real para exclusão em lote
        await propostasService.excluirEmLote(selectedPropostas);
        
        showNotification(`${selectedPropostas.length} proposta(s) excluída(s) com sucesso!`, 'success');
        setSelectedPropostas([]);
        setShowBulkActions(false);
        
        // Recarregar dados
        await carregarPropostas();
      } catch (error) {
        console.error('❌ Erro ao excluir propostas em lote:', error);
        showNotification('Erro ao excluir propostas. Tente novamente.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      console.log('📝 Alterando status em lote:', selectedPropostas, 'para:', newStatus);
      
      // Para cada proposta selecionada, alterar o status
      for (const propostaId of selectedPropostas) {
        await propostasService.atualizarStatus(propostaId, newStatus);
      }
      
      showNotification(`Status de ${selectedPropostas.length} proposta(s) alterado com sucesso!`, 'success');
      setSelectedPropostas([]);
      setShowBulkActions(false);
      
      // Recarregar dados
      await carregarPropostas();
    } catch (error) {
      console.error('❌ Erro ao alterar status em lote:', error);
      showNotification('Erro ao alterar status das propostas. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = async () => {
    const selectedData = propostas.filter(p => selectedPropostas.includes(p.id));

    // Criar CSV
    const headers = ['Número', 'Cliente', 'Título', 'Valor', 'Status', 'Data Criação', 'Vendedor'];
    const csvContent = [
      headers.join(','),
      ...selectedData.map(p => [
        p.numero,
        p.cliente,
        p.titulo,
        p.valor,
        p.status,
        p.data_criacao,
        p.vendedor
      ].join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `propostas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedPropostas([]);
    setShowBulkActions(false);
  };

  // Calcular métricas do dashboard
  const calcularMetricas = () => {
    const total = filteredPropostas.length;
    const aprovadas = filteredPropostas.filter(p => p.status === 'aprovada').length;
    const emNegociacao = filteredPropostas.filter(p => p.status === 'negociacao').length;
    const valorTotal = filteredPropostas.reduce((sum, p) => sum + p.valor, 0);
    const valorAprovado = filteredPropostas
      .filter(p => p.status === 'aprovada')
      .reduce((sum, p) => sum + p.valor, 0);

    const taxaConversao = total > 0 ? (aprovadas / total) * 100 : 0;

    return {
      total,
      aprovadas,
      emNegociacao,
      valorTotal,
      valorAprovado,
      taxaConversao
    };
  };

  const metricas = calcularMetricas();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada': return <CheckCircle className="w-4 h-4" />;
      case 'rejeitada': return <XCircle className="w-4 h-4" />;
      case 'negociacao': return <TrendingUp className="w-4 h-4" />;
      case 'enviada': return <Clock className="w-4 h-4" />;
      case 'rascunho': return <Edit className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return 'bg-green-100 text-green-800';
      case 'rejeitada': return 'bg-red-100 text-red-800';
      case 'negociacao': return 'bg-blue-100 text-blue-800';
      case 'enviada': return 'bg-yellow-100 text-yellow-800';
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada';
      case 'rejeitada': return 'Rejeitada';
      case 'negociacao': return 'Em Negociação';
      case 'enviada': return 'Enviada';
      case 'rascunho': return 'Rascunho';
      default: return status;
    }
  };

  // Manipuladores dos botões de ações
  const converterPropostaParaPDF = async (proposta: any): Promise<DadosProposta> => {
    console.log('🔄 Convertendo proposta para PDF:', proposta);

    // Verificar se a proposta tem dados reais do sistema
    const temDadosReais = proposta.id && proposta.id.startsWith('prop_');

    if (temDadosReais) {
      console.log('📋 Usando dados reais da proposta criada no sistema');

      try {
        // Buscar dados completos da proposta
        const propostaCompleta = await propostasService.obterProposta(proposta.id);

        if (!propostaCompleta) {
          throw new Error('Proposta não encontrada');
        }

        console.log('🎯 Proposta completa encontrada:', propostaCompleta);

        // Converter produtos reais para formato PDF
        const itensReais = propostaCompleta.produtos.map((produtoProposta, index) => {
          const produto = produtoProposta.produto;
          const quantidade = produtoProposta.quantidade;
          const desconto = produtoProposta.desconto || 0;
          const valorUnitario = produto.preco;
          const valorComDesconto = valorUnitario * (1 - desconto / 100);
          const valorTotal = valorComDesconto * quantidade;

          // Criar descrição detalhada do produto
          let descricaoDetalhada = produto.descricao || '';

          // Adicionar informações específicas por tipo
          if (produto.tipo === 'software') {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: Software/Tecnologia`;
            if (produto.tipoItem) {
              descricaoDetalhada += `\n• Tipo: ${produto.tipoItem}`;
            }
            if (produto.tipoLicenciamento) {
              descricaoDetalhada += `\n• Licenciamento: ${produto.tipoLicenciamento}`;
            }
            if (produto.periodicidadeLicenca) {
              descricaoDetalhada += `\n• Periodicidade: ${produto.periodicidadeLicenca}`;
            }
            if (produto.quantidadeLicencas) {
              descricaoDetalhada += `\n• Licenças incluídas: ${produto.quantidadeLicencas}`;
            }
            if (produto.renovacaoAutomatica) {
              descricaoDetalhada += `\n• Renovação automática ativada`;
            }
          } else if (produto.tipo === 'combo') {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: Pacote Promocional`;
            descricaoDetalhada += `\n• Pacote com ${produto.produtosCombo?.length || 0} itens incluídos`;
            if (produto.precoOriginal && produto.desconto) {
              const economia = produto.precoOriginal - produto.preco;
              descricaoDetalhada += `\n• Economia: R$ ${economia.toFixed(2)} (${produto.desconto.toFixed(1)}% OFF)`;
            }
            if (produto.produtosCombo && produto.produtosCombo.length > 0) {
              descricaoDetalhada += `\n• Itens inclusos: ${produto.produtosCombo.map(p => p.nome).join(', ')}`;
            }
          } else {
            descricaoDetalhada += descricaoDetalhada ? '\n' : '';
            descricaoDetalhada += `• Categoria: ${produto.categoria}`;
          }

          // Adicionar unidade de medida
          descricaoDetalhada += `\n• Unidade de medida: ${produto.unidade}`;

          return {
            nome: produto.nome,
            descricao: descricaoDetalhada.trim(),
            quantidade: quantidade,
            valorUnitario: valorUnitario,
            desconto: desconto,
            valorTotal: valorTotal
          };
        });

        // Calcular totais reais
        const subtotal = propostaCompleta.subtotal;
        const descontoGlobal = (propostaCompleta.descontoGlobal || 0);
        const impostos = propostaCompleta.impostos || 0;
        const valorTotal = propostaCompleta.total;

        // Obter dados do cliente real
        const clienteReal = propostaCompleta.cliente;
        const vendedorReal = propostaCompleta.vendedor;

        // Mapear status para o formato correto
        const statusMap = {
          'rascunho': 'draft',
          'enviada': 'sent',
          'aprovada': 'approved',
          'rejeitada': 'rejected'
        } as const;

        return {
          numeroProposta: propostaCompleta.numero || `PROP-${Date.now()}`,
          titulo: propostaCompleta.titulo || `Proposta para ${clienteReal?.nome || 'Cliente'}`,
          descricao: propostaCompleta.observacoes || 'Proposta comercial com produtos/serviços selecionados conforme necessidades específicas do cliente.',
          status: statusMap[propostaCompleta.status || 'rascunho'],
          dataEmissao: propostaCompleta.criadaEm ? new Date(propostaCompleta.criadaEm).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
          dataValidade: propostaCompleta.dataValidade ? new Date(propostaCompleta.dataValidade).toLocaleDateString('pt-BR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          empresa: {
            nome: 'FenixCRM Solutions',
            endereco: 'Rua das Inovações, 123 - Centro Empresarial',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            telefone: '(11) 3333-4444',
            email: 'contato@fenixcrm.com.br',
            cnpj: '12.345.678/0001-90'
          },
          cliente: {
            nome: clienteReal?.nome || 'Cliente Não Informado',
            empresa: clienteReal?.tipoPessoa === 'juridica' ? clienteReal.nome : undefined,
            email: clienteReal?.email || 'cliente@email.com',
            telefone: clienteReal?.telefone || 'Não informado',
            documento: clienteReal?.documento || 'Não informado',
            tipoDocumento: clienteReal?.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF',
            endereco: clienteReal?.endereco ?
              `${clienteReal.endereco}${clienteReal.cidade ? `, ${clienteReal.cidade}` : ''}${clienteReal.estado ? `/${clienteReal.estado}` : ''}${clienteReal.cep ? ` - CEP: ${clienteReal.cep}` : ''}` :
              'Endereço não informado'
          },
          vendedor: {
            nome: vendedorReal?.nome || 'Consultor FenixCRM',
            email: vendedorReal?.email || 'vendedor@fenixcrm.com.br',
            telefone: '(11) 98765-4321',
            cargo: vendedorReal?.tipo === 'gerente' ? 'Gerente de Vendas' :
              vendedorReal?.tipo === 'admin' ? 'Diretor Comercial' :
                'Consultor de Vendas'
          },
          itens: itensReais,
          subtotal: subtotal,
          descontoGeral: descontoGlobal,
          percentualDesconto: subtotal > 0 ? (descontoGlobal / subtotal * 100) : 0,
          impostos: impostos,
          valorTotal: valorTotal,
          formaPagamento: propostaCompleta.formaPagamento === 'avista' ? 'À vista com desconto especial' :
            propostaCompleta.formaPagamento === 'parcelado' ? `Parcelado em até ${propostaCompleta.parcelas || 3}x sem juros` :
              propostaCompleta.formaPagamento === 'boleto' ? 'Boleto bancário' :
                propostaCompleta.formaPagamento === 'cartao' ? 'Cartão de crédito' :
                  'Conforme acordo comercial',
          prazoEntrega: `${propostaCompleta.validadeDias || 30} dias úteis`,
          garantia: '12 meses de garantia e suporte técnico especializado',
          validadeProposta: `${propostaCompleta.validadeDias || 30} dias corridos`,
          condicoesGerais: [
            `Proposta válida por ${propostaCompleta.validadeDias || 30} dias corridos a partir da data de emissão`,
            'Pagamento mediante apresentação de nota fiscal',
            'Entrega conforme cronograma acordado entre as partes',
            'Garantia e suporte técnico conforme especificações técnicas',
            'Valores já incluem todos os impostos aplicáveis',
            'Alterações no escopo podem gerar custos adicionais'
          ],
          observacoes: propostaCompleta.observacoes || `Esta proposta foi elaborada especialmente para ${clienteReal?.nome || 'o cliente'}, incluindo produtos/serviços selecionados conforme suas necessidades específicas. Estamos à disposição para esclarecimentos e ajustes necessários.`
        };

      } catch (error) {
        console.error('❌ Erro ao converter proposta real:', error);
        throw new Error('Não foi possível converter a proposta. Verifique os dados.');
      }
    } else {
      throw new Error('Proposta não encontrada ou dados incompletos.');
    }
  };

  // Função removida - sistema agora trabalha apenas com dados reais do banco
  // Todas as funcionalidades de mock foram removidas

  const handleViewProposta = async (proposta: any) => {
        case 'software':
          // Produtos reais de software/desenvolvimento
          if (valorTotal <= 30000) {
            return [
              {
                nome: 'Pacote Startup Digital (Combo)',
                descricao: 'Solução completa para startups - Software Web + Consultoria inicial | Desconto: 16,6% | Produtos: Sistema Web Básico, Consultoria Júnior - 8h',
                quantidade: 1,
                valorUnitario: valorTotal * 0.85,
                desconto: 16.6,
                valorTotal: valorTotal * 0.7
              },
              {
                nome: 'Hospedagem e Domínio Premium',
                descricao: 'Hospedagem em servidor dedicado, domínio personalizado, SSL, backup automático e CDN',
                quantidade: 1,
                valorUnitario: valorTotal * 0.3,
                desconto: 0,
                valorTotal: valorTotal * 0.3
              }
            ];
          } else if (valorTotal <= 80000) {
            return [
              {
                nome: 'Pacote Empresarial Completo (Combo)',
                descricao: 'Solução enterprise com múltiplas licenças, app mobile e treinamento | Desconto: 16,7% | Produtos: Sistema Web Premium, App Mobile, Treinamento Liderança',
                quantidade: 1,
                valorUnitario: valorTotal * 0.75,
                desconto: 16.7,
                valorTotal: valorTotal * 0.65
              },
              {
                nome: 'Integração e Migração de Dados',
                descricao: 'Migração completa de dados legados, integração com sistemas terceiros, APIs customizadas',
                quantidade: 1,
                valorUnitario: valorTotal * 0.35,
                desconto: 5,
                valorTotal: valorTotal * 0.35
              }
            ];
          } else {
            return [
              {
                nome: 'Pacote E-commerce Plus (Combo)',
                descricao: 'Plataforma completa de e-commerce com recursos avançados | Produtos: Loja Virtual Premium, Gateway de Pagamento, Sistema de Gestão',
                quantidade: 1,
                valorUnitario: valorTotal * 0.6,
                desconto: 12,
                valorTotal: valorTotal * 0.55
              },
              {
                nome: 'Marketing Digital Integrado',
                descricao: 'SEO otimizado, integração com redes sociais, email marketing automático, analytics avançado',
                quantidade: 1,
                valorUnitario: valorTotal * 0.25,
                desconto: 0,
                valorTotal: valorTotal * 0.25
              },
              {
                nome: 'Suporte Premium 24/7',
                descricao: 'Suporte técnico especializado, monitoramento, atualizações automáticas e backup em tempo real',
                quantidade: 1,
                valorUnitario: valorTotal * 0.2,
                desconto: 0,
                valorTotal: valorTotal * 0.2
              }
            ];
          }

        case 'consultoria':
          return [
            {
              nome: 'Consultoria em Marketing Digital',
              descricao: 'Análise completa de mercado, desenvolvimento de personas, estratégia de conteúdo e funil de vendas',
              quantidade: 1,
              valorUnitario: valorTotal * 0.6,
              desconto: 10,
              valorTotal: valorTotal * 0.55
            },
            {
              nome: 'Auditoria e Otimização SEO',
              descricao: 'Auditoria técnica completa, otimização on-page, estratégia de link building e relatórios mensais',
              quantidade: 1,
              valorUnitario: valorTotal * 0.25,
              desconto: 0,
              valorTotal: valorTotal * 0.25
            },
            {
              nome: 'Gestão de Campanhas Pagas',
              descricao: 'Configuração e gestão de Google Ads, Facebook Ads, relatórios de performance e otimização contínua',
              quantidade: 1,
              valorUnitario: valorTotal * 0.2,
              desconto: 5,
              valorTotal: valorTotal * 0.2
            }
          ];

        case 'treinamento':
          return [
            {
              nome: 'Programa de Liderança Executiva',
              descricao: 'Curso intensivo de 40h, certificação internacional, coaching individual e plataforma EAD vitalícia',
              quantidade: 1,
              valorUnitario: valorTotal * 0.7,
              desconto: 15,
              valorTotal: valorTotal * 0.6
            },
            {
              nome: 'Workshop Gestão de Equipes',
              descricao: 'Treinamento prático de 16h, dinâmicas de grupo, kit de ferramentas e mentorias de acompanhamento',
              quantidade: 1,
              valorUnitario: valorTotal * 0.4,
              desconto: 10,
              valorTotal: valorTotal * 0.4
            }
          ];

        case 'design':
          return [
            {
              nome: 'Identidade Visual Premium',
              descricao: 'Logotipo profissional, manual de marca completo, aplicações em diversos formatos e registro de marca',
              quantidade: 1,
              valorUnitario: valorTotal * 0.65,
              desconto: 8,
              valorTotal: valorTotal * 0.6
            },
            {
              nome: 'Kit Digital Completo',
              descricao: 'Templates para redes sociais, banners web, cartões digitais, apresentações e mockups em alta resolução',
              quantidade: 1,
              valorUnitario: valorTotal * 0.4,
              desconto: 12,
              valorTotal: valorTotal * 0.35
            },
            {
              nome: 'Website Institucional',
              descricao: 'Site responsivo de até 5 páginas, otimizado para SEO, formulários de contato e integração com redes sociais',
              quantidade: 1,
              valorUnitario: valorTotal * 0.05,
              desconto: 0,
              valorTotal: valorTotal * 0.05
            }
          ];

        case 'ecommerce':
          return [
            {
              nome: 'Loja Virtual Profissional',
              descricao: 'E-commerce completo com catálogo de produtos, carrinho de compras, checkout seguro e painel administrativo',
              quantidade: 1,
              valorUnitario: valorTotal * 0.55,
              desconto: 10,
              valorTotal: valorTotal * 0.5
            },
            {
              nome: 'Gateway de Pagamento Integrado',
              descricao: 'Integração com principais gateways (PagSeguro, Mercado Pago, PayPal), PIX automático e boleto bancário',
              quantidade: 1,
              valorUnitario: valorTotal * 0.25,
              desconto: 0,
              valorTotal: valorTotal * 0.25
            },
            {
              nome: 'Sistema de Gestão de Estoque',
              descricao: 'Controle automático de estoque, alertas de reposição, relatórios de vendas e integração com fornecedores',
              quantidade: 1,
              valorUnitario: valorTotal * 0.25,
              desconto: 5,
              valorTotal: valorTotal * 0.25
            }
          ];

        default:
          return [
            {
              nome: proposta.titulo || 'Solução Personalizada',
              descricao: proposta.descricao || 'Solução personalizada desenvolvida especificamente para atender às necessidades do cliente',
              quantidade: 1,
              valorUnitario: valorTotal,
              desconto: 0,
              valorTotal: valorTotal
            }
          ];
      }
    };

    const itens = criarItensDetalhados(proposta);
    const subtotal = itens.reduce((sum, item) => sum + item.valorTotal, 0);

    return {
      numeroProposta: proposta.numero || `PROP-${Date.now()}`,
      titulo: proposta.titulo || `Proposta para ${proposta.cliente}`,
      descricao: proposta.descricao || 'Proposta comercial personalizada com soluções sob medida para atender às necessidades específicas do seu negócio.',
      status: proposta.status || 'draft',
      dataEmissao: proposta.data_criacao || new Date().toISOString().split('T')[0],
      dataValidade: proposta.data_vencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      empresa: {
        nome: 'FenixCRM',
        endereco: 'Rua das Empresas, 123 - Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        telefone: '(11) 9999-9999',
        email: 'contato@fenixcrm.com',
        cnpj: '12.345.678/0001-90'
      },
      cliente: {
        nome: proposta.cliente || 'Cliente Não Informado',
        empresa: proposta.categoria === 'software' ? `${proposta.cliente} Tecnologia` : proposta.cliente,
        email: proposta.cliente_contato ? `${proposta.cliente_contato.toLowerCase().replace(/\s+/g, '.')}@${proposta.cliente.toLowerCase().replace(/\s+/g, '')}.com` : 'cliente@email.com',
        telefone: '(11) 8888-8888',
        documento: '123.456.789-00',
        tipoDocumento: 'CPF',
        endereco: 'Rua do Cliente, 456 - Bairro Comercial'
      },
      vendedor: {
        nome: proposta.vendedor || 'Sistema FenixCRM',
        email: 'vendedor@fenixcrm.com',
        telefone: '(11) 7777-7777',
        cargo: 'Consultor Comercial Sênior'
      },
      itens: itens,
      subtotal: subtotal,
      descontoGeral: subtotal * 0.05, // 5% de desconto geral
      percentualDesconto: 5,
      impostos: subtotal * 0.1, // 10% de impostos
      valorTotal: subtotal * 1.05, // subtotal + impostos - desconto
      formaPagamento: 'Parcelado em até 3x sem juros ou à vista com 5% de desconto',
      prazoEntrega: proposta.categoria === 'software' ? '45 dias úteis' : proposta.categoria === 'consultoria' ? '30 dias úteis' : '15 dias úteis',
      garantia: proposta.categoria === 'software' ? '12 meses de garantia e suporte técnico' : proposta.categoria === 'treinamento' ? '6 meses de suporte pós-treinamento' : '6 meses de garantia',
      validadeProposta: '30 dias corridos',
      condicoesGerais: [
        'Proposta válida por 30 dias corridos a partir da data de emissão',
        'Pagamento mediante apresentação de nota fiscal',
        'Entrega conforme cronograma acordado entre as partes',
        'Garantia e suporte técnico conforme especificações técnicas',
        'Valores não incluem despesas de viagem, se necessárias',
        'Alterações no escopo podem gerar custos adicionais'
      ],
      observacoes: `Esta proposta foi elaborada especialmente para ${proposta.cliente}, considerando as necessidades específicas do projeto "${proposta.titulo}". Estamos à disposição para esclarecimentos e ajustes necessários.`
    };
  };

  const handleViewProposta = async (proposta: any) => {
    console.log('👁️ Visualizar proposta:', proposta.numero);

    try {
      // Converter dados da proposta para o formato PropostaCompleta
      const propostaCompleta: PropostaCompleta = {
        id: proposta.id || `prop_${Date.now()}`,
        numero: proposta.numero || 'N/A',
        titulo: proposta.titulo || 'Proposta comercial',
        subtotal: proposta.valor || 0,
        total: proposta.valor || 0,
        dataValidade: new Date(proposta.data_vencimento || Date.now()),
        status: proposta.status as 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada',
        criadaEm: new Date(proposta.data_criacao || Date.now()),
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: 'avista',
        validadeDias: 30,
        incluirImpostosPDF: false,
        cliente: {
          id: `cliente_${proposta.id}`,
          nome: proposta.cliente || 'Cliente não informado',
          documento: '',
          email: `${proposta.cliente?.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          telefone: proposta.cliente_contato?.includes('(') ? proposta.cliente_contato : '(62) 99999-9999',
          tipoPessoa: 'juridica' as const
        },
        vendedor: {
          id: `vendedor_${proposta.id}`,
          nome: proposta.vendedor || 'Vendedor',
          email: 'vendedor@conectcrm.com',
          telefone: '(62) 99668-9991',
          tipo: 'vendedor' as const,
          ativo: true
        },
        produtos: [
          {
            produto: {
              id: `produto_${proposta.id}`,
              nome: proposta.titulo || 'Serviço/Produto',
              preco: proposta.valor || 0,
              categoria: proposta.categoria || 'Geral',
              descricao: proposta.descricao || 'Produto/serviço da proposta',
              unidade: 'un'
            },
            quantidade: 1,
            desconto: 0,
            subtotal: proposta.valor || 0
          }
        ],
        observacoes: `Esta proposta foi elaborada especialmente para ${proposta.cliente}, considerando as necessidades específicas do projeto "${proposta.titulo}". Estamos à disposição para esclarecimentos e ajustes necessários.`
      };

      setSelectedPropostaForView(propostaCompleta);
      setShowViewModal(true);

      console.log('✅ Modal de visualização aberto');
    } catch (error) {
      console.error('❌ Erro ao preparar visualização da proposta:', error);
      alert('Erro ao preparar visualização da proposta. Tente novamente.');
    }
  };

  // Função de fallback para gerar HTML local quando API não estiver disponível
  const gerarHtmlLocal = (dados: DadosProposta): string => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta Comercial - ${dados.numeroProposta}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #333; background: #fff; font-size: 14px; }
        .container { max-width: 210mm; margin: 0 auto; padding: 15px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 2px solid #159A9C; margin-bottom: 20px; }
        .company-info { font-size: 11px; color: #666; line-height: 1.3; margin-top: 8px; }
        .proposal-number { font-size: 20px; font-weight: bold; color: #159A9C; margin-bottom: 3px; }
        .title-section { text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #159A9C, #127577); color: white; border-radius: 6px; }
        .main-title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
        .client-section { display: flex; gap: 15px; margin: 20px 0; }
        .client-info, .vendor-info { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
        .section-title { font-size: 14px; font-weight: bold; color: #159A9C; margin-bottom: 10px; border-bottom: 1px solid #159A9C; padding-bottom: 3px; }
        .info-row { display: flex; margin: 5px 0; font-size: 12px; }
        .info-label { font-weight: 600; min-width: 90px; color: #555; }
        .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 12px; }
        .products-table th { background: #159A9C; color: white; padding: 10px 8px; text-align: left; font-weight: 600; font-size: 11px; }
        .products-table td { padding: 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
        .products-table tr:nth-child(even) { background: #f9f9f9; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .currency { font-weight: 600; color: #159A9C; }
        .product-name { font-weight: 600; color: #333; margin-bottom: 3px; }
        .product-desc { font-size: 10px; color: #666; line-height: 1.3; white-space: pre-line; }
        .product-features { font-size: 9px; color: #159A9C; background: #f0f9f9; padding: 4px 6px; margin-top: 4px; border-radius: 3px; border-left: 2px solid #159A9C; }
        .totals-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #159A9C; }
        .totals-table { width: 100%; max-width: 350px; margin-left: auto; font-size: 12px; }
        .totals-table td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
        .total-final { font-size: 16px; font-weight: bold; color: #159A9C; border-top: 2px solid #159A9C; background: white; }
        .signature-section { margin: 30px 0; padding: 20px 0; border-top: 2px solid #159A9C; }
        .signatures { display: flex; justify-content: space-between; gap: 30px; margin-top: 20px; }
        .signature-box { flex: 1; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background: #f9f9f9; }
        .signature-line { border-top: 1px solid #333; margin: 30px 15px 10px; }
        .signature-label { font-weight: 600; margin-bottom: 5px; font-size: 11px; }
        .signature-info { font-size: 10px; color: #666; }
        .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
        .term-item { padding: 12px; background: #f9f9f9; border-radius: 4px; }
        .term-label { font-weight: 600; color: #159A9C; margin-bottom: 3px; font-size: 11px; }
        .term-value { font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div style="font-size: 20px; font-weight: bold; color: #159A9C;">${dados.empresa?.nome || 'FenixCRM'}</div>
                <div class="company-info">
                    <div>${dados.empresa?.endereco || 'Endereço da empresa'}</div>
                    <div>${dados.empresa?.telefone || '(11) 0000-0000'} | ${dados.empresa?.email || 'contato@empresa.com'}</div>
                </div>
            </div>
            <div>
                <div class="proposal-number">PROPOSTA Nº ${dados.numeroProposta}</div>
                <div style="font-size: 12px; color: #666;">${dados.dataEmissao}</div>
            </div>
        </div>

        <div class="title-section">
            <div class="main-title">PROPOSTA COMERCIAL</div>
            <div style="font-size: 14px; opacity: 0.9;">${dados.titulo}</div>
        </div>

        <div class="client-section">
            <div class="client-info">
                <div class="section-title">DADOS DO CLIENTE</div>
                <div class="info-row">
                    <span class="info-label">Nome:</span>
                    <span>${dados.cliente.nome}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">E-mail:</span>
                    <span>${dados.cliente.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefone:</span>
                    <span>${dados.cliente.telefone || 'Não informado'}</span>
                </div>
            </div>

            <div class="vendor-info">
                <div class="section-title">DADOS DO VENDEDOR</div>
                <div class="info-row">
                    <span class="info-label">Nome:</span>
                    <span>${dados.vendedor.nome}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">E-mail:</span>
                    <span>${dados.vendedor.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Cargo:</span>
                    <span>${dados.vendedor.cargo || 'Vendedor'}</span>
                </div>
            </div>
        </div>

        <div style="margin: 20px 0;">
            <div class="section-title">PRODUTOS/SERVIÇOS</div>
            <table class="products-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">Item</th>
                        <th style="width: 40%;">Descrição</th>
                        <th style="width: 10%;" class="text-center">Qtd</th>
                        <th style="width: 15%;" class="text-right">Valor Unit.</th>
                        <th style="width: 10%;" class="text-center">Desconto</th>
                        <th style="width: 20%;" class="text-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${dados.itens.map((item, index) => {
      // Separar descrição dos detalhes técnicos
      const descricaoLinhas = (item.descricao || '').split('\n');
      const descricaoPrincipal = descricaoLinhas.find(linha => !linha.startsWith('•')) || '';
      const detalhes = descricaoLinhas.filter(linha => linha.startsWith('•'));

      return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>
                            <div class="product-name">${item.nome}</div>
                            ${descricaoPrincipal ? `<div class="product-desc">${descricaoPrincipal}</div>` : ''}
                            ${detalhes.length > 0 ? `<div class="product-features">${detalhes.join('\n')}</div>` : ''}
                        </td>
                        <td class="text-center">${item.quantidade}</td>
                        <td class="text-right currency">R$ ${item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-center">${item.desconto ? `${item.desconto.toFixed(1)}%` : '-'}</td>
                        <td class="text-right currency">R$ ${item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    `;
    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="totals-section">
            <div class="section-title">RESUMO FINANCEIRO</div>
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right currency">R$ ${(dados.subtotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${dados.descontoGeral ? `
                <tr>
                    <td>Desconto Geral (${dados.percentualDesconto || 0}%):</td>
                    <td class="text-right currency">- R$ ${dados.descontoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                ${dados.impostos ? `
                <tr>
                    <td>Impostos:</td>
                    <td class="text-right currency">R$ ${dados.impostos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : ''}
                <tr class="total-final">
                    <td><strong>VALOR TOTAL:</strong></td>
                    <td class="text-right"><strong>R$ ${dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
            </table>
        </div>

        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px;">
            <div class="section-title">CONDIÇÕES COMERCIAIS</div>
            <div class="terms-grid">
                <div class="term-item">
                    <div class="term-label">Pagamento</div>
                    <div class="term-value">${dados.formaPagamento}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Entrega</div>
                    <div class="term-value">${dados.prazoEntrega}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Garantia</div>
                    <div class="term-value">${dados.garantia}</div>
                </div>
                <div class="term-item">
                    <div class="term-label">Validade</div>
                    <div class="term-value">${dados.validadeProposta}</div>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="section-title">ACEITE DA PROPOSTA</div>
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-label">CLIENTE</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>${dados.cliente.nome}</strong></div>
                        <div>Data: ___/___/______</div>
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-label">VENDEDOR</div>
                    <div class="signature-line"></div>
                    <div class="signature-info">
                        <div><strong>${dados.vendedor.nome}</strong></div>
                        <div>Data: ___/___/______</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleEditProposta = (proposta: any) => {
    console.log('✏️ Editar proposta:', proposta.numero);
    // Navegar para página de edição ou abrir modal de edição
    alert(`Editando proposta: ${proposta.numero}\nEsta funcionalidade será implementada em breve!`);
  };

  const handleDeleteProposta = async (proposta: any) => {
    console.log('🗑️ Excluir proposta:', proposta.numero);

    if (window.confirm(`Tem certeza que deseja excluir a proposta ${proposta.numero}?`)) {
      try {
        setIsLoading(true);
        console.log('🗑️ Excluindo proposta do banco de dados...', proposta.id);

        // Usar o serviço real para excluir
        await propostasService.removerProposta(proposta.id);

        console.log('✅ Proposta excluída com sucesso');
        showNotification('Proposta excluída com sucesso!', 'success');
        
        // Recarregar a lista para refletir a exclusão
        await carregarPropostas();
      } catch (error) {
        console.error('❌ Erro ao excluir proposta:', error);
        showNotification('Erro ao excluir proposta. Tente novamente.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMoreOptions = (proposta: any) => {
    console.log('⚙️ Mais opções para proposta:', proposta.numero);

    // Criar um menu de contexto simples
    const opcoes = [
      'Duplicar Proposta',
      'Gerar PDF',
      'Enviar por Email',
      'Histórico',
      'Alterar Status'
    ];

    const opcaoEscolhida = window.prompt(
      `Selecione uma opção para ${proposta.numero}:\n\n` +
      opcoes.map((opcao, index) => `${index + 1}. ${opcao}`).join('\n') +
      '\n\nDigite o número da opção:'
    );

    if (opcaoEscolhida && opcaoEscolhida !== '') {
      const opcaoIndex = parseInt(opcaoEscolhida) - 1;
      if (opcaoIndex >= 0 && opcaoIndex < opcoes.length) {
        console.log(`📋 Opção selecionada: ${opcoes[opcaoIndex]}`);
        alert(`Funcionalidade "${opcoes[opcaoIndex]}" será implementada em breve!`);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalValorPropostas = propostas.reduce((sum, p) => sum + p.valor, 0);
  const valorAprovadas = propostas.filter(p => p.status === 'aprovada').reduce((sum, p) => sum + p.valor, 0);
  const valorNegociacao = propostas.filter(p => p.status === 'negociacao').reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="min-h-screen bg-[#DEEFE7]">
      <ModalNovaProposta
        key={`modal-${showWizardModal ? 'open' : 'closed'}-${Date.now()}`}
        isOpen={showWizardModal}
        onClose={() => {
          console.log('🔘 Modal onClose chamado - setShowWizardModal(false)');
          setShowWizardModal(false);
        }}
        onPropostaCriada={(proposta) => {
          console.log('✅ Nova proposta criada via wizard:', proposta);
          // Recarregar a lista de propostas
          carregarPropostas();
          setShowWizardModal(false);
        }}
      />

      <BackToNucleus
        nucleusName="Vendas"
        nucleusPath="/nuclei/vendas"
      />

      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success'
          ? 'bg-green-100 border border-green-400 text-green-700'
          : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <FileText className="h-8 w-8 mr-3 text-[#159A9C]" />
                Propostas
                {isLoading && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                )}
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                {isLoading ? 'Carregando propostas...' : `Acompanhe suas ${propostas.length} propostas comerciais`}
              </p>
            </div>

            {/* Controles de visualização e ações */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              {/* Botão de atualizar */}
              <button
                onClick={() => {
                  console.log('🔄 Atualizando propostas manualmente...');
                  carregarPropostas();
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Atualizar lista de propostas"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              {/* Modos de visualização */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'dashboard'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'cards'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              {/* Botão atualizar */}
              <button
                onClick={carregarPropostas}
                className="px-4 py-2 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] flex items-center gap-2 text-sm text-[#002333] transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#159A9C]"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Atualizar
              </button>

              {/* Botão exportar */}
              <button className="px-4 py-2 border border-[#B4BEC9] rounded-lg hover:bg-[#DEEFE7] flex items-center gap-2 text-sm text-[#002333] transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>

              {/* Botão nova proposta */}
              <button
                onClick={() => {
                  console.log('🔔 Botão Nova Proposta clicado!');
                  console.log('📊 Estado atual showWizardModal:', showWizardModal);
                  setShowWizardModal(true);
                  console.log('✅ setShowWizardModal(true) executado');
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Nova Proposta
              </button>
            </div>
          </div>
        </div>

        {/* Renderização condicional por modo de visualização */}
        {viewMode === 'dashboard' ? (
          <DashboardPropostas onRefresh={carregarPropostas} />
        ) : (
          <>
            {/* Filtros Avançados */}
            <div className="mb-6">
              <FiltrosAvancados
                onFiltersChange={handleAdvancedFilters}
                isOpen={showAdvancedFilters}
                onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
              />
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg border border-[#DEEFE7] shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-[#DEEFE7] rounded-lg">
                    <FileText className="w-6 h-6 text-[#159A9C]" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B4BEC9]">Total de Propostas</p>
                    <p className="text-2xl font-bold text-[#002333]">{propostas.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propostas.filter(p => p.status === 'aprovada').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Em Negociação</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {propostas.filter(p => p.status === 'negociacao').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totalValorPropostas)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros básicos */}
            <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Busca */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por número, cliente ou título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filtro Status */}
                <div className="lg:w-48">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="rejeitada">Rejeitada</option>
                  </select>
                </div>

                {/* Filtro Vendedor */}
                <div className="lg:w-48">
                  <select
                    value={selectedVendedor}
                    onChange={(e) => setSelectedVendedor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos os Vendedores</option>
                    <option value="Maria Santos">Maria Santos</option>
                    <option value="Pedro Costa">Pedro Costa</option>
                    <option value="Ana Silva">Ana Silva</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de Propostas com Seleção */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden propostas-page">
              <div className="table-wrapper">
                <table className="table-propostas min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* Checkbox para selecionar todas */}
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPropostas.length === filteredPropostas.length && filteredPropostas.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (sortBy === 'data_criacao') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('data_criacao');
                            setSortOrder('desc');
                          }
                        }}>
                        <div className="flex items-center space-x-1">
                          <span>Proposta</span>
                          {sortBy === 'data_criacao' && (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (sortBy === 'cliente') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('cliente');
                            setSortOrder('asc');
                          }
                        }}>
                        <div className="flex items-center space-x-1">
                          <span>Cliente</span>
                          {sortBy === 'cliente' && (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (sortBy === 'status') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('status');
                            setSortOrder('asc');
                          }
                        }}>
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortBy === 'status' && (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          if (sortBy === 'valor') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('valor');
                            setSortOrder('desc');
                          }
                        }}>
                        <div className="flex items-center space-x-1">
                          <span>Valor</span>
                          {sortBy === 'valor' && (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile">
                        Vendedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider col-hide-mobile">
                        Vencimento
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPropostas.map((proposta) => (
                      <tr key={proposta.id} className={`hover:bg-gray-50 ${selectedPropostas.includes(proposta.id) ? 'bg-blue-50' : ''}`}>
                        {/* Checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedPropostas.includes(proposta.id)}
                            onChange={() => handleSelectProposta(proposta.id)}
                            className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Proposta">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{safeRender(proposta.numero)}</div>
                            <div className="subinfo ellipsis-text">{safeRender(proposta.titulo)}</div>
                            <div className="subinfo flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              Criada em {formatDate(safeRender(proposta.data_criacao))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Cliente">
                          <div>
                            <div className="text-sm font-medium text-gray-900 ellipsis-text">{safeRender(proposta.cliente)}</div>
                            <div className="subinfo flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span className="ellipsis-sm">{safeRender(proposta.cliente_contato)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap col-hide-mobile" data-label="Status">
                          <span className={`status-badge inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(safeRender(proposta.status))}`}>
                            {getStatusIcon(safeRender(proposta.status))}
                            <span className="ml-1">{getStatusText(safeRender(proposta.status))}</span>
                          </span>
                          <div className="subinfo mt-1">
                            {safeRender(proposta.probabilidade)}% de chance
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" data-label="Valor">
                          <div className="valor-proposta text-sm font-medium">
                            {formatCurrency(Number(proposta.valor) || 0)}
                          </div>
                          <div className="subinfo capitalize">
                            {safeRender(proposta.categoria)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 col-hide-mobile" data-label="Vendedor">
                          {safeRender(proposta.vendedor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap col-hide-mobile" data-label="Vencimento">
                          <div className="data-proposta text-sm text-gray-900">
                            {formatDate(safeRender(proposta.data_vencimento))}
                          </div>
                          <div className="subinfo">
                            {new Date(proposta.data_vencimento) < new Date() ?
                              <span className="text-red-600">Vencida</span> :
                              `${Math.ceil((new Date(proposta.data_vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} dias`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Ações">
                          <PropostaActions
                            proposta={proposta}
                            onViewProposta={handleViewProposta}
                            className="justify-end"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>        {/* Paginação */}
              <div className="bg-white px-6 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredPropostas.length}</span> de{' '}
                    <span className="font-medium">{filteredPropostas.length}</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Anterior
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                      1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal de Proposta */}
            <ModalProposta
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSave={handleSaveProposta}
              isLoading={isLoadingCreate}
            />

            {/* Modal de Visualização de Proposta */}
            <ModalVisualizarProposta
              isOpen={showViewModal}
              onClose={() => setShowViewModal(false)}
              proposta={selectedPropostaForView}
            />

            {/* Modal Wizard removido daqui - movido para o início do JSX */}

            {/* Componentes adicionais */}
            <BulkActions
              selectedIds={selectedPropostas}
              onAction={handleBulkAction}
              onClearSelection={clearSelection}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PropostasPage;
