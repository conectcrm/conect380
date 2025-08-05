import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit3, Trash2, Building2, Phone, Mail, Filter, Download, MoreVertical, 
  FileSpreadsheet, Eye, Check, X, CheckCircle, Calendar, Activity, Settings, FileText,
  Upload, RefreshCw, AlertCircle, MapPin, Globe, ChevronDown, ChevronUp, Star,
  Archive, Bell, Clock, TrendingUp, BarChart3, PieChart, Users, Target, ArrowUpDown,
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Edit, Zap, Shield, Award
} from 'lucide-react';
import { fornecedorService, Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import { ModalFornecedor } from './ModalFornecedor';
import { ModalDetalhesFornecedor } from './ModalDetalhesFornecedor';
import { FornecedorExtendido, mapearFornecedorParaExtendido, mapearExtendidoParaServico } from './fornecedorMappers';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { exportToCSV, exportToExcel, formatDateForExport, formatStatusForExport, ExportColumn } from '../../../utils/exportUtils';

export { }; // Para resolver o erro isolatedModules

// Interfaces expandidas para funcionalidades avançadas
interface DashboardCards {
  totalFornecedores: number;
  fornecedoresAtivos: number;
  fornecedoresInativos: number;
  fornecedoresCadastradosHoje: number;
  fornecedoresPremium: number;
  mediaTempoParceria: number;
  totalTransacoes: number;
  fornecedoresPorRegiao: { [key: string]: number };
}

interface FiltrosAvancados {
  status: 'todos' | 'ativo' | 'inativo';
  regiao: string;
  cidade: string;
  categoria: string;
  dataCadastroInicio: string;
  dataCadastroFim: string;
  valorMinTransacao: number;
  valorMaxTransacao: number;
  tempoParcerias: 'todos' | 'novos' | 'antigos';
  classificacao: 'todos' | 'premium' | 'padrao' | 'basico';
}

interface HistoricoAuditoria {
  id: string;
  acao: string;
  usuario: string;
  dataHora: string;
  detalhes: string;
  fornecedorId: string;
}

interface NotificacaoFornecedor {
  id: string;
  tipo: 'vencimento_documento' | 'atualizacao_dados' | 'nova_transacao' | 'inatividade';
  titulo: string;
  mensagem: string;
  fornecedorId: string;
  lida: boolean;
  criadaEm: string;
}

export default function FornecedoresPage() {
  const navigate = useNavigate();
  
  // Estados principais
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de modais
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  
  // Estados de dados
  const [fornecedorEdicao, setFornecedorEdicao] = useState<Fornecedor | null>(null);
  const [fornecedorDetalhes, setFornecedorDetalhes] = useState<Fornecedor | null>(null);
  
  // Estados de busca e filtros
  const [busca, setBusca] = useState('');
  const [buscaRapida, setBuscaRapida] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosAvancados>({
    status: 'todos',
    regiao: '',
    cidade: '',
    categoria: '',
    dataCadastroInicio: '',
    dataCadastroFim: '',
    valorMinTransacao: 0,
    valorMaxTransacao: 0,
    tempoParcerias: 'todos',
    classificacao: 'todos'
  });
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);

  // Estados para seleção múltipla e ações em massa
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<string[]>([]);
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false);
  const [processandoAcaoMassa, setProcessandoAcaoMassa] = useState(false);

  // Estados para dashboard e analytics
  const [dashboardCards, setDashboardCards] = useState<DashboardCards>({
    totalFornecedores: 0,
    fornecedoresAtivos: 0,
    fornecedoresInativos: 0,
    fornecedoresCadastradosHoje: 0,
    fornecedoresPremium: 0,
    mediaTempoParceria: 0,
    totalTransacoes: 0,
    fornecedoresPorRegiao: {}
  });

  // Estados para auditoria e notificações
  const [historicoAuditoria, setHistoricoAuditoria] = useState<HistoricoAuditoria[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoFornecedor[]>([]);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  // Estados para ordenação e visualização
  const [ordenacao, setOrdenacao] = useState<{campo: string, direcao: 'asc' | 'desc'}>({
    campo: 'nome',
    direcao: 'asc'
  });
  const [visualizacao, setVisualizacao] = useState<'lista' | 'cards' | 'compacta'>('lista');
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados para cache e performance
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Efeitos para carregamento e auto-refresh
  useEffect(() => {
    carregarFornecedores();
    carregarNotificacoes();
    carregarHistoricoAuditoria();
  }, [filtroStatus, filtrosAvancados]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        carregarFornecedores(false); // Carregamento silencioso
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Debounce para busca em tempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaRapida !== busca) {
        setBusca(buscaRapida);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [buscaRapida]);

  // Função principal de carregamento com cache e analytics
  const carregarFornecedores = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) {
        setCarregando(true);
      }
      setErro(null);

      const filtros = {
        busca: busca.trim(),
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo',
        ...filtrosAvancados
      };

      const dados = await fornecedorService.listarFornecedores(filtros);
      setFornecedores(dados);
      setUltimaAtualizacao(new Date());

      // Calcular estatísticas avançadas para o dashboard
      calcularEstatisticasDashboard(dados);
      
      // Registrar auditoria
      registrarAuditoria('listagem', 'Sistema', 'Fornecedores carregados com sucesso');

    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setErro('Erro ao carregar fornecedores. Tente novamente.');
      
      // Registrar erro na auditoria
      registrarAuditoria('erro', 'Sistema', `Erro ao carregar fornecedores: ${error}`);
    } finally {
      if (mostrarLoading) {
        setCarregando(false);
      }
    }
  }, [busca, filtroStatus, filtrosAvancados]);

  // Função para calcular estatísticas avançadas
  const calcularEstatisticasDashboard = (dados: Fornecedor[]) => {
    const total = dados.length;
    const ativos = dados.filter(f => f.ativo).length;
    const inativos = total - ativos;
    const hoje = new Date().toDateString();
    const cadastradosHoje = dados.filter(f =>
      new Date(f.criadoEm).toDateString() === hoje
    ).length;

    // Calcular fornecedores premium (exemplo: com mais de X transações)
    const premium = dados.filter(f => f.transacoes && f.transacoes > 10).length;

    // Calcular média de tempo de parceria
    const temposParceria = dados.map(f => {
      const inicio = new Date(f.criadoEm);
      const agora = new Date();
      return Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    });
    const mediaTempo = temposParceria.length > 0 
      ? Math.floor(temposParceria.reduce((a, b) => a + b, 0) / temposParceria.length)
      : 0;

    // Agrupar por região
    const porRegiao: { [key: string]: number } = {};
    dados.forEach(f => {
      const regiao = f.estado || 'Não informado';
      porRegiao[regiao] = (porRegiao[regiao] || 0) + 1;
    });

    setDashboardCards({
      totalFornecedores: total,
      fornecedoresAtivos: ativos,
      fornecedoresInativos: inativos,
      fornecedoresCadastradosHoje: cadastradosHoje,
      fornecedoresPremium: premium,
      mediaTempoParceria: mediaTempo,
      totalTransacoes: dados.reduce((sum, f) => sum + (f.transacoes || 0), 0),
      fornecedoresPorRegiao: porRegiao
    });
  };

  // Função para carregar notificações
  const carregarNotificacoes = async () => {
    try {
      // Mock de notificações - substituir pela API real
      const mockNotificacoes: NotificacaoFornecedor[] = [
        {
          id: '1',
          tipo: 'vencimento_documento',
          titulo: 'Documento vencendo',
          mensagem: 'CNPJ da empresa ABC Ltda vence em 30 dias',
          fornecedorId: '1',
          lida: false,
          criadaEm: new Date().toISOString()
        }
      ];
      setNotificacoes(mockNotificacoes);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  // Função para carregar histórico de auditoria
  const carregarHistoricoAuditoria = async () => {
    try {
      // Mock de histórico - substituir pela API real
      const mockHistorico: HistoricoAuditoria[] = [
        {
          id: '1',
          acao: 'criacao',
          usuario: 'João Silva',
          dataHora: new Date().toISOString(),
          detalhes: 'Fornecedor ABC Ltda criado',
          fornecedorId: '1'
        }
      ];
      setHistoricoAuditoria(mockHistorico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Função para registrar auditoria
  const registrarAuditoria = (acao: string, usuario: string, detalhes: string, fornecedorId?: string) => {
    const novoRegistro: HistoricoAuditoria = {
      id: Date.now().toString(),
      acao,
      usuario,
      dataHora: new Date().toISOString(),
      detalhes,
      fornecedorId: fornecedorId || ''
    };
    
    setHistoricoAuditoria(prev => [novoRegistro, ...prev.slice(0, 99)]); // Manter últimos 100 registros
  };

  // Função de busca avançada com múltiplos critérios
  const buscarFornecedores = useCallback(async () => {
    if (busca.trim() === '' && Object.values(filtrosAvancados).every(v => !v || v === 'todos' || v === 0)) {
      carregarFornecedores();
      return;
    }

    try {
      setCarregando(true);
      const filtros = {
        busca: busca.trim(),
        ativo: filtroStatus === 'todos' ? undefined : filtroStatus === 'ativo',
        ...filtrosAvancados
      };

      const dados = await fornecedorService.listarFornecedores(filtros);
      setFornecedores(dados);
      calcularEstatisticasDashboard(dados);
      
      registrarAuditoria('busca', 'Usuário', `Busca realizada: "${busca}"`);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setErro('Erro ao buscar fornecedores. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroStatus, filtrosAvancados, carregarFornecedores]);

  // Aplicar filtros avançados
  const aplicarFiltrosAvancados = (novosFiltros: Partial<FiltrosAvancados>) => {
    setFiltrosAvancados(prev => ({ ...prev, ...novosFiltros }));
    setPaginaAtual(1); // Resetar paginação
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setBusca('');
    setBuscaRapida('');
    setFiltroStatus('todos');
    setFiltrosAvancados({
      status: 'todos',
      regiao: '',
      cidade: '',
      categoria: '',
      dataCadastroInicio: '',
      dataCadastroFim: '',
      valorMinTransacao: 0,
      valorMaxTransacao: 0,
      tempoParcerias: 'todos',
      classificacao: 'todos'
    });
    setPaginaAtual(1);
  };

  // Filtrar e ordenar fornecedores
  const fornecedoresFiltrados = useMemo(() => {
    let resultado = [...fornecedores];

    // Aplicar busca
    if (busca) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(f =>
        f.nome.toLowerCase().includes(termo) ||
        f.cnpjCpf.includes(termo) ||
        f.email?.toLowerCase().includes(termo) ||
        f.telefone?.includes(termo) ||
        f.cidade?.toLowerCase().includes(termo) ||
        f.estado?.toLowerCase().includes(termo)
      );
    }

    // Aplicar ordenação
    resultado.sort((a, b) => {
      let valorA: any = a[ordenacao.campo as keyof Fornecedor];
      let valorB: any = b[ordenacao.campo as keyof Fornecedor];

      if (typeof valorA === 'string') valorA = valorA.toLowerCase();
      if (typeof valorB === 'string') valorB = valorB.toLowerCase();

      if (valorA < valorB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [fornecedores, busca, ordenacao]);

  // Paginação
  const fornecedoresPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return fornecedoresFiltrados.slice(inicio, fim);
  }, [fornecedoresFiltrados, paginaAtual, itensPorPagina]);

  const totalPaginas = Math.ceil(fornecedoresFiltrados.length / itensPorPagina);

  // Função para alterar ordenação
  const alterarOrdenacao = (campo: string) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarFornecedores();
    }
  };

  // Modais - Edição
  const abrirModalEdicao = (fornecedor: Fornecedor) => {
    setFornecedorEdicao(fornecedor);
    setModalAberto(true);
    registrarAuditoria('visualizacao', 'Usuário', `Modal de edição aberto para ${fornecedor.nome}`, fornecedor.id);
  };

  const abrirModalCriacao = () => {
    setFornecedorEdicao(null);
    setModalAberto(true);
    registrarAuditoria('acao', 'Usuário', 'Modal de criação de fornecedor aberto');
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFornecedorEdicao(null);
  };

  // Modais - Detalhes
  const abrirModalDetalhes = (fornecedor: Fornecedor) => {
    setFornecedorDetalhes(fornecedor);
    setModalDetalhesAberto(true);
    registrarAuditoria('visualizacao', 'Usuário', `Detalhes visualizados para ${fornecedor.nome}`, fornecedor.id);
  };

  const fecharModalDetalhes = () => {
    setModalDetalhesAberto(false);
    setFornecedorDetalhes(null);
  };

  // Modal - Importação
  const abrirModalImportacao = () => {
    setModalImportacaoAberto(true);
    registrarAuditoria('acao', 'Usuário', 'Modal de importação aberto');
  };

  const fecharModalImportacao = () => {
    setModalImportacaoAberto(false);
  };

  // Modal - Histórico
  const abrirModalHistorico = () => {
    setModalHistoricoAberto(true);
  };

  const fecharModalHistorico = () => {
    setModalHistoricoAberto(false);
  };

  // Salvar fornecedor com auditoria
  const handleSalvarFornecedor = async (dadosFornecedor: NovoFornecedor | Partial<NovoFornecedor>) => {
    try {
      let fornecedorSalvo;
      
      if (fornecedorEdicao) {
        fornecedorSalvo = await fornecedorService.atualizarFornecedor(fornecedorEdicao.id, dadosFornecedor);
        registrarAuditoria('edicao', 'Usuário', `Fornecedor ${fornecedorEdicao.nome} atualizado`, fornecedorEdicao.id);
      } else {
        fornecedorSalvo = await fornecedorService.criarFornecedor(dadosFornecedor as NovoFornecedor);
        registrarAuditoria('criacao', 'Usuário', `Novo fornecedor ${dadosFornecedor.nome} criado`);
      }

      fecharModal();
      carregarFornecedores();
      
      // Mostrar notificação de sucesso
      mostrarNotificacao('success', 
        fornecedorEdicao ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!'
      );
      
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      registrarAuditoria('erro', 'Usuário', `Erro ao salvar fornecedor: ${error}`);
      mostrarNotificacao('error', 'Erro ao salvar fornecedor. Tente novamente.');
    }
  };

  // Excluir fornecedor com confirmação avançada
  const excluirFornecedor = async (id: string) => {
    const fornecedor = fornecedores.find(f => f.id === id);
    if (!fornecedor) return;

    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO!\n\n` +
      `Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?\n\n` +
      `Esta ação não pode ser desfeita e irá:\n` +
      `• Remover todos os dados do fornecedor\n` +
      `• Afetar relatórios históricos\n` +
      `• Precisar de reconfiguração em transações futuras\n\n` +
      `Digite "CONFIRMAR" para prosseguir.`
    );

    if (!confirmacao) return;

    try {
      await fornecedorService.excluirFornecedor(id);
      registrarAuditoria('exclusao', 'Usuário', `Fornecedor ${fornecedor.nome} excluído`, id);
      carregarFornecedores();
      mostrarNotificacao('success', 'Fornecedor excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      registrarAuditoria('erro', 'Usuário', `Erro ao excluir fornecedor: ${error}`, id);
      mostrarNotificacao('error', 'Erro ao excluir fornecedor. Verifique se não há transações associadas.');
    }
  };

  // Sistema de notificações
  const mostrarNotificacao = (tipo: 'success' | 'error' | 'warning' | 'info', mensagem: string) => {
    const novaNotificacao: NotificacaoFornecedor = {
      id: Date.now().toString(),
      tipo: 'nova_transacao', // Tipo genérico para notificações do sistema
      titulo: tipo === 'success' ? 'Sucesso' : tipo === 'error' ? 'Erro' : 'Aviso',
      mensagem,
      fornecedorId: '',
      lida: false,
      criadaEm: new Date().toISOString()
    };

    setNotificacoes(prev => [novaNotificacao, ...prev]);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      setNotificacoes(prev => prev.filter(n => n.id !== novaNotificacao.id));
    }, 5000);
  };

  const formatarCNPJCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 11) {
      // CPF
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numeros.length === 14) {
      // CNPJ
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  };

  // Funções de exportação avançadas
  const exportarParaCSV = () => {
    const dadosParaExportar = fornecedoresSelecionados.length > 0 
      ? fornecedores.filter(f => fornecedoresSelecionados.includes(f.id))
      : fornecedoresFiltrados;

    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone', format: formatarTelefone },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'classificacao', label: 'Classificação' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport },
      { key: 'atualizadoEm', label: 'Última Atualização', format: formatDateForExport }
    ];

    const sufixo = fornecedoresSelecionados.length > 0 ? '_selecionados' : '';
    const filename = `fornecedores${sufixo}_${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(dadosParaExportar, columns, filename);
    registrarAuditoria('exportacao', 'Usuário', `Exportação CSV: ${dadosParaExportar.length} fornecedores`);
  };

  const exportarParaExcel = () => {
    const dadosParaExportar = fornecedoresSelecionados.length > 0 
      ? fornecedores.filter(f => fornecedoresSelecionados.includes(f.id))
      : fornecedoresFiltrados;

    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone', format: formatarTelefone },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'classificacao', label: 'Classificação' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport },
      { key: 'atualizadoEm', label: 'Última Atualização', format: formatDateForExport }
    ];

    const sufixo = fornecedoresSelecionados.length > 0 ? '_selecionados' : '';
    const filename = `fornecedores${sufixo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const sheetName = fornecedoresSelecionados.length > 0 ? 'Fornecedores Selecionados' : 'Fornecedores';
    
    exportToExcel(dadosParaExportar, columns, filename, sheetName);
    registrarAuditoria('exportacao', 'Usuário', `Exportação Excel: ${dadosParaExportar.length} fornecedores`);
  };

  // Exportação de relatório completo com analytics
  const exportarRelatorioCompleto = () => {
    const dadosCompletos = fornecedores.map(f => ({
      ...f,
      tempoParcerias: calcularTempoParceria(f.criadoEm),
      totalTransacoes: f.transacoes || 0,
      ultimaInteracao: f.ultimaInteracao || 'Nunca',
      score: calcularScoreFornecedor(f)
    }));

    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF', format: formatarCNPJCPF },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone', format: formatarTelefone },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'classificacao', label: 'Classificação' },
      { key: 'tempoParcerias', label: 'Tempo de Parceria (dias)' },
      { key: 'totalTransacoes', label: 'Total de Transações' },
      { key: 'ultimaInteracao', label: 'Última Interação' },
      { key: 'score', label: 'Score do Fornecedor' },
      { key: 'ativo', label: 'Status', format: formatStatusForExport },
      { key: 'criadoEm', label: 'Data de Cadastro', format: formatDateForExport }
    ];

    const filename = `relatorio_fornecedores_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(dadosCompletos, columns, filename, 'Relatório Completo');
    
    registrarAuditoria('exportacao', 'Usuário', `Relatório completo exportado: ${dadosCompletos.length} fornecedores`);
  };

  // Funções auxiliares para cálculos
  const calcularTempoParceria = (dataCriacao: string): number => {
    const inicio = new Date(dataCriacao);
    const agora = new Date();
    return Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calcularScoreFornecedor = (fornecedor: Fornecedor): number => {
    let score = 0;
    
    // Pontuação baseada em tempo de parceria
    const tempoDias = calcularTempoParceria(fornecedor.criadoEm);
    score += Math.min(tempoDias / 365 * 20, 50); // Máximo 50 pontos para tempo
    
    // Pontuação baseada em transações
    const transacoes = fornecedor.transacoes || 0;
    score += Math.min(transacoes * 2, 30); // Máximo 30 pontos para transações
    
    // Pontuação para dados completos
    if (fornecedor.email) score += 5;
    if (fornecedor.telefone) score += 5;
    if (fornecedor.endereco) score += 5;
    if (fornecedor.contato) score += 5;
    
    return Math.round(Math.min(score, 100));
  };

  // Funções de seleção múltipla avançadas
  const toggleSelecionarFornecedor = (fornecedorId: string) => {
    setFornecedoresSelecionados(prev => {
      const novaSelecao = prev.includes(fornecedorId)
        ? prev.filter(id => id !== fornecedorId)
        : [...prev, fornecedorId];

      setMostrarAcoesMassa(novaSelecao.length > 0);
      return novaSelecao;
    });
  };

  const selecionarTodos = () => {
    const todosIds = fornecedoresPaginados.map(f => f.id);
    setFornecedoresSelecionados(todosIds);
    setMostrarAcoesMassa(todosIds.length > 0);
  };

  const selecionarTodosVisiveis = () => {
    const idsVisiveis = fornecedoresFiltrados.map(f => f.id);
    setFornecedoresSelecionados(idsVisiveis);
    setMostrarAcoesMassa(idsVisiveis.length > 0);
  };

  const selecionarPorCritério = (criterio: 'ativos' | 'inativos' | 'premium' | 'recentes') => {
    let fornecedoresFiltros: Fornecedor[] = [];
    
    switch (criterio) {
      case 'ativos':
        fornecedoresFiltros = fornecedores.filter(f => f.ativo);
        break;
      case 'inativos':
        fornecedoresFiltros = fornecedores.filter(f => !f.ativo);
        break;
      case 'premium':
        fornecedoresFiltros = fornecedores.filter(f => calcularScoreFornecedor(f) >= 80);
        break;
      case 'recentes':
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        fornecedoresFiltros = fornecedores.filter(f => new Date(f.criadoEm) >= seteDiasAtras);
        break;
    }
    
    const ids = fornecedoresFiltros.map(f => f.id);
    setFornecedoresSelecionados(ids);
    setMostrarAcoesMassa(ids.length > 0);
  };

  const deselecionarTodos = () => {
    setFornecedoresSelecionados([]);
    setMostrarAcoesMassa(false);
  };

  // Ações em massa avançadas
  const ativarSelecionados = async () => {
    const quantidade = fornecedoresSelecionados.length;
    if (!window.confirm(
      `Tem certeza que deseja ativar ${quantidade} fornecedor(es) selecionado(s)?\n\n` +
      `Esta ação irá:\n` +
      `• Tornar os fornecedores disponíveis para novas transações\n` +
      `• Reativar notificações automáticas\n` +
      `• Incluir nos relatórios ativos`
    )) {
      return;
    }

    try {
      setProcessandoAcaoMassa(true);
      
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: true });
      }

      registrarAuditoria('acao_massa', 'Usuário', `${quantidade} fornecedores ativados em massa`);
      deselecionarTodos();
      carregarFornecedores();
      mostrarNotificacao('success', `${quantidade} fornecedor(es) ativado(s) com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao ativar fornecedores:', error);
      registrarAuditoria('erro', 'Usuário', `Erro na ativação em massa: ${error}`);
      mostrarNotificacao('error', 'Erro ao ativar fornecedores. Alguns podem não ter sido processados.');
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const desativarSelecionados = async () => {
    const quantidade = fornecedoresSelecionados.length;
    if (!window.confirm(
      `Tem certeza que deseja desativar ${quantidade} fornecedor(es) selecionado(s)?\n\n` +
      `Esta ação irá:\n` +
      `• Impedir novas transações com estes fornecedores\n` +
      `• Pausar notificações automáticas\n` +
      `• Mover para a categoria de inativos\n\n` +
      `Os dados históricos serão mantidos.`
    )) {
      return;
    }

    try {
      setProcessandoAcaoMassa(true);
      
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { ativo: false });
      }

      registrarAuditoria('acao_massa', 'Usuário', `${quantidade} fornecedores desativados em massa`);
      deselecionarTodos();
      carregarFornecedores();
      mostrarNotificacao('success', `${quantidade} fornecedor(es) desativado(s) com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao desativar fornecedores:', error);
      registrarAuditoria('erro', 'Usuário', `Erro na desativação em massa: ${error}`);
      mostrarNotificacao('error', 'Erro ao desativar fornecedores. Alguns podem não ter sido processados.');
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const excluirSelecionados = async () => {
    const quantidade = fornecedoresSelecionados.length;
    const nomesFornecedores = fornecedores
      .filter(f => fornecedoresSelecionados.includes(f.id))
      .map(f => f.nome)
      .slice(0, 5)
      .join(', ');
    
    const maisFornecedores = quantidade > 5 ? ` e mais ${quantidade - 5}` : '';

    if (!window.confirm(
      `⚠️ ATENÇÃO - EXCLUSÃO EM MASSA ⚠️\n\n` +
      `Tem certeza que deseja excluir ${quantidade} fornecedor(es)?\n\n` +
      `Fornecedores: ${nomesFornecedores}${maisFornecedores}\n\n` +
      `Esta ação é IRREVERSÍVEL e irá:\n` +
      `• Remover permanentemente todos os dados\n` +
      `• Afetar relatórios históricos\n` +
      `• Quebrar referências em transações\n\n` +
      `Digite "EXCLUIR ${quantidade}" para confirmar.`
    )) {
      return;
    }

    // Segunda confirmação para ações críticas
    const confirmacaoTexto = prompt(`Para confirmar a exclusão, digite: EXCLUIR ${quantidade}`);
    if (confirmacaoTexto !== `EXCLUIR ${quantidade}`) {
      mostrarNotificacao('warning', 'Exclusão cancelada - texto de confirmação incorreto.');
      return;
    }

    try {
      setProcessandoAcaoMassa(true);
      
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.excluirFornecedor(id);
      }

      registrarAuditoria('acao_massa', 'Usuário', `${quantidade} fornecedores excluídos em massa: ${nomesFornecedores}`);
      deselecionarTodos();
      carregarFornecedores();
      mostrarNotificacao('success', `${quantidade} fornecedor(es) excluído(s) com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao excluir fornecedores:', error);
      registrarAuditoria('erro', 'Usuário', `Erro na exclusão em massa: ${error}`);
      mostrarNotificacao('error', 'Erro ao excluir fornecedores. Verifique transações associadas.');
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const exportarSelecionados = () => {
    if (fornecedoresSelecionados.length === 0) {
      mostrarNotificacao('warning', 'Selecione pelo menos um fornecedor para exportar.');
      return;
    }
    
    exportarParaExcel();
  };

  // Ações em massa específicas
  const atualizarCategoriaSelecionados = async (novaCategoria: string) => {
    const quantidade = fornecedoresSelecionados.length;
    
    try {
      setProcessandoAcaoMassa(true);
      
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { categoria: novaCategoria });
      }

      registrarAuditoria('acao_massa', 'Usuário', `Categoria atualizada para ${quantidade} fornecedores: ${novaCategoria}`);
      deselecionarTodos();
      carregarFornecedores();
      mostrarNotificacao('success', `Categoria atualizada para ${quantidade} fornecedor(es)!`);
      
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      mostrarNotificacao('error', 'Erro ao atualizar categoria dos fornecedores.');
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const marcarComoFavoritos = async () => {
    const quantidade = fornecedoresSelecionados.length;
    
    try {
      setProcessandoAcaoMassa(true);
      
      for (const id of fornecedoresSelecionados) {
        await fornecedorService.atualizarFornecedor(id, { favorito: true });
      }

      registrarAuditoria('acao_massa', 'Usuário', `${quantidade} fornecedores marcados como favoritos`);
      deselecionarTodos();
      carregarFornecedores();
      mostrarNotificacao('success', `${quantidade} fornecedor(es) marcado(s) como favorito(s)!`);
      
    } catch (error) {
      console.error('Erro ao marcar favoritos:', error);
      mostrarNotificacao('error', 'Erro ao marcar fornecedores como favoritos.');
    } finally {
      setProcessandoAcaoMassa(false);
    }
  };

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return valor;
  };

  // Função de importação de fornecedores
  const handleImportacaoFornecedores = async (arquivo: File) => {
    try {
      setCarregando(true);
      
      // Aqui seria implementada a lógica real de importação
      // Por enquanto, vamos simular o processo
      
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const resultado = await fornecedorService.importarFornecedores(formData);
      
      // Simulação de resultado
      const resultado = {
        sucesso: 15,
        erros: 2,
        total: 17,
        mensagens: [
          'Linha 3: CNPJ inválido',
          'Linha 8: Email já existe no sistema'
        ]
      };
      
      registrarAuditoria('importacao', 'Usuário', 
        `Importação concluída: ${resultado.sucesso} sucessos, ${resultado.erros} erros`);
      
      carregarFornecedores();
      fecharModalImportacao();
      
      if (resultado.erros > 0) {
        mostrarNotificacao('warning', 
          `Importação parcial: ${resultado.sucesso} fornecedores importados, ${resultado.erros} com erro.`);
      } else {
        mostrarNotificacao('success', 
          `${resultado.sucesso} fornecedores importados com sucesso!`);
      }
      
    } catch (error) {
      console.error('Erro na importação:', error);
      registrarAuditoria('erro', 'Usuário', `Erro na importação: ${error}`);
      mostrarNotificacao('error', 'Erro na importação. Verifique o formato do arquivo.');
    } finally {
      setCarregando(false);
    }
  };

  // Função para download do template de importação
  const downloadTemplateImportacao = () => {
    const templateData = [
      {
        nome: 'Exemplo Fornecedor Ltda',
        cnpjCpf: '12.345.678/0001-90',
        email: 'contato@exemplo.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Exemplo, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        contato: 'João Silva',
        cargo: 'Gerente Comercial',
        categoria: 'Tecnologia',
        observacoes: 'Fornecedor especializado em software'
      }
    ];

    const columns: ExportColumn[] = [
      { key: 'nome', label: 'Nome *' },
      { key: 'cnpjCpf', label: 'CNPJ/CPF *' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'endereco', label: 'Endereço' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'estado', label: 'Estado' },
      { key: 'cep', label: 'CEP' },
      { key: 'contato', label: 'Contato' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'observacoes', label: 'Observações' }
    ];

    exportToExcel(templateData, columns, 'template_importacao_fornecedores.xlsx', 'Template');
    registrarAuditoria('download', 'Usuário', 'Template de importação baixado');
  };

  // Função para refresh manual
  const refreshDados = () => {
    carregarFornecedores();
    mostrarNotificacao('info', 'Dados atualizados!');
  };

  // Função para alternar auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    mostrarNotificacao('info', autoRefresh ? 'Auto-refresh desativado' : 'Auto-refresh ativado');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sistema de Notificações */}
      {notificacoes.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notificacoes.slice(0, 3).map((notificacao) => (
            <div
              key={notificacao.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 bg-white min-w-80 transform transition-all duration-300 ${
                notificacao.tipo === 'nova_transacao' ? 'border-l-blue-500' :
                notificacao.tipo === 'vencimento_documento' ? 'border-l-orange-500' :
                notificacao.tipo === 'atualizacao_dados' ? 'border-l-green-500' :
                'border-l-gray-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{notificacao.titulo}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notificacao.mensagem}</p>
                </div>
                <button
                  onClick={() => setNotificacoes(prev => prev.filter(n => n.id !== notificacao.id))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <BackToNucleus
            nucleusName="Financeiro"
            nucleusPath="/nuclei/financeiro"
          />
          
          {/* Indicadores de Status */}
          <div className="flex items-center gap-4">
            {ultimaAtualizacao && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Atualizado: {ultimaAtualizacao.toLocaleTimeString()}
              </div>
            )}
            
            {autoRefresh && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Auto-refresh ativo
              </div>
            )}

            {notificacoes.filter(n => !n.lida).length > 0 && (
              <button
                onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
                className="relative p-2 text-gray-600 hover:text-gray-800"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificacoes.filter(n => !n.lida).length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header Expandido */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <Building2 className="h-8 w-8 mr-3 text-[#159A9C]" />
                Fornecedores
                {carregando && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C] ml-3"></div>
                )}
                {erro && (
                  <div className="ml-3 text-red-500 text-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                )}
              </h1>
              <p className="mt-2 text-[#B4BEC9]">
                {carregando ? 'Carregando fornecedores...' : 
                 erro ? erro :
                 `Gerencie seus ${dashboardCards.totalFornecedores} fornecedores e parceiros comerciais`}
              </p>
              
              {/* Indicadores de Performance */}
              <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Score médio: {fornecedores.length > 0 ? 
                    Math.round(fornecedores.reduce((acc, f) => acc + calcularScoreFornecedor(f), 0) / fornecedores.length) : 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Tempo médio: {dashboardCards.mediaTempoParceria} dias</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>{dashboardCards.totalTransacoes} transações</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação Principal */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              {/* Botões de Controle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshDados}
                  disabled={carregando}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Atualizar dados"
                >
                  <RefreshCw className={`w-5 h-5 ${carregando ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={toggleAutoRefresh}
                  className={`p-2 rounded-lg transition-colors ${autoRefresh 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                  title={autoRefresh ? 'Desativar auto-refresh' : 'Ativar auto-refresh'}
                >
                  <Activity className="w-5 h-5" />
                </button>

                <button
                  onClick={abrirModalHistorico}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ver histórico de auditoria"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              {/* Botões de Ação */}
              <button
                onClick={abrirModalImportacao}
                className="border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar
              </button>

              <button
                onClick={abrirModalCriacao}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Novo Fornecedor
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Dashboard Expandidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total de Fornecedores</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardCards.totalFornecedores}</p>
                <p className="text-xs text-gray-400 mt-1">📊 Cadastrados</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ativos</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{dashboardCards.fornecedoresAtivos}</p>
                <p className="text-xs text-green-500 mt-1">✅ Operacionais</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Inativos</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{dashboardCards.fornecedoresInativos}</p>
                <p className="text-xs text-red-500 mt-1">❌ Suspensos</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Novos Hoje</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{dashboardCards.fornecedoresCadastradosHoje}</p>
                <p className="text-xs text-purple-500 mt-1">🆕 Cadastros</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Premium</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboardCards.fornecedoresPremium}</p>
                <p className="text-xs text-yellow-500 mt-1">⭐ Alto Score</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Transações</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{dashboardCards.totalTransacoes}</p>
                <p className="text-xs text-indigo-500 mt-1">💼 Totais</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Distribuição por Região */}
        {Object.keys(dashboardCards.fornecedoresPorRegiao).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Distribuição por Região
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(dashboardCards.fornecedoresPorRegiao)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([regiao, quantidade]) => (
                <div key={regiao} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{quantidade}</div>
                  <div className="text-sm text-gray-600">{regiao}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sistema de Filtros Avançados */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Linha 1 - Busca Principal e Controles */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Busca Inteligente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, CNPJ/CPF, email, cidade, contato..."
                    value={buscaRapida}
                    onChange={(e) => setBuscaRapida(e.target.value)}
                    onKeyPress={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
                  />
                  {buscaRapida && (
                    <button
                      onClick={() => {setBuscaRapida(''); setBusca('');}}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Controles de Visualização */}
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Visualização</label>
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setVisualizacao('lista')}
                    className={`px-3 py-2 text-sm ${visualizacao === 'lista' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setVisualizacao('cards')}
                    className={`px-3 py-2 text-sm ${visualizacao === 'cards' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setVisualizacao('compacta')}
                    className={`px-3 py-2 text-sm ${visualizacao === 'compacta' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    Compacta
                  </button>
                </div>
              </div>

              {/* Botão Filtros Avançados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtros</label>
                <button
                  onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${mostrarFiltrosAvancados 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <Filter className="w-4 h-4" />
                  Avançados
                  {mostrarFiltrosAvancados ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Linha 2 - Filtros Rápidos */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'ativo' | 'inativo')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">✅ Ativos</option>
                  <option value="inativo">❌ Inativos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Itens por Página</label>
                <select
                  value={itensPorPagina}
                  onChange={(e) => setItensPorPagina(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>

              {/* Botões de Seleção Rápida */}
              <div className="flex gap-2">
                <button
                  onClick={() => selecionarPorCritério('ativos')}
                  className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Selecionar Ativos
                </button>
                <button
                  onClick={() => selecionarPorCritério('premium')}
                  className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Selecionar Premium
                </button>
                <button
                  onClick={() => selecionarPorCritério('recentes')}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Selecionar Recentes
                </button>
              </div>

              {/* Ações Principais */}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={buscarFornecedores}
                  disabled={carregando}
                  className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </button>

                <button
                  onClick={limparFiltros}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>

                {/* Menu de Exportação */}
                <div className="relative group">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors">
                    <Download className="w-4 h-4" />
                    Exportar
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 min-w-48">
                    <button
                      onClick={exportarParaCSV}
                      disabled={fornecedoresFiltrados.length === 0}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={exportarParaExcel}
                      disabled={fornecedoresFiltrados.length === 0}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Exportar Excel
                    </button>
                    <button
                      onClick={exportarRelatorioCompleto}
                      disabled={fornecedores.length === 0}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Relatório Completo
                    </button>
                    {fornecedoresSelecionados.length > 0 && (
                      <button
                        onClick={exportarSelecionados}
                        className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2 border-t border-gray-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Exportar Selecionados ({fornecedoresSelecionados.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Avançados Expansível */}
          {mostrarFiltrosAvancados && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Filtros Avançados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Região/Estado</label>
                  <select
                    value={filtrosAvancados.regiao}
                    onChange={(e) => aplicarFiltrosAvancados({ regiao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    <option value="">Todas as regiões</option>
                    {Object.keys(dashboardCards.fornecedoresPorRegiao).map(regiao => (
                      <option key={regiao} value={regiao}>{regiao}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classificação</label>
                  <select
                    value={filtrosAvancados.classificacao}
                    onChange={(e) => aplicarFiltrosAvancados({ classificacao: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    <option value="todos">Todas as classificações</option>
                    <option value="premium">⭐ Premium (Score ≥ 80)</option>
                    <option value="padrao">📊 Padrão (Score 50-79)</option>
                    <option value="basico">📈 Básico (Score &lt; 50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tempo de Parceria</label>
                  <select
                    value={filtrosAvancados.tempoParcerias}
                    onChange={(e) => aplicarFiltrosAvancados({ tempoParcerias: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  >
                    <option value="todos">Todos os tempos</option>
                    <option value="novos">🆕 Novos (&lt; 30 dias)</option>
                    <option value="antigos">⏰ Antigos (&gt; 1 ano)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Cadastro (Início)</label>
                  <input
                    type="date"
                    value={filtrosAvancados.dataCadastroInicio}
                    onChange={(e) => aplicarFiltrosAvancados({ dataCadastroInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Ações em Massa Avançada */}
        {mostrarAcoesMassa && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">
                    {fornecedoresSelecionados.length} fornecedor(es) selecionado(s)
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <button
                    onClick={selecionarTodosVisiveis}
                    className="hover:text-blue-900 underline transition-colors"
                  >
                    Selecionar todos visíveis ({fornecedoresFiltrados.length})
                  </button>
                  <span>•</span>
                  <button
                    onClick={deselecionarTodos}
                    className="hover:text-blue-900 underline transition-colors"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {processandoAcaoMassa && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Processando...
                  </div>
                )}

                {/* Ações Principais */}
                <button
                  onClick={ativarSelecionados}
                  disabled={processandoAcaoMassa}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Ativar
                </button>

                <button
                  onClick={desativarSelecionados}
                  disabled={processandoAcaoMassa}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Desativar
                </button>

                <button
                  onClick={marcarComoFavoritos}
                  disabled={processandoAcaoMassa}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Favoritar
                </button>

                <button
                  onClick={exportarSelecionados}
                  disabled={processandoAcaoMassa}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>

                {/* Menu de Ações Avançadas */}
                <div className="relative group">
                  <button 
                    disabled={processandoAcaoMassa}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Mais Ações
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 min-w-48">
                    <button
                      onClick={() => atualizarCategoriaSelecionados('Tecnologia')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Categoria: Tecnologia
                    </button>
                    <button
                      onClick={() => atualizarCategoriaSelecionados('Serviços')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Categoria: Serviços
                    </button>
                    <button
                      onClick={() => atualizarCategoriaSelecionados('Materiais')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Categoria: Materiais
                    </button>
                  </div>
                </div>

                <button
                  onClick={excluirSelecionados}
                  disabled={processandoAcaoMassa}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Fornecedores com Visualização Dinâmica */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lista de Fornecedores</h2>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {fornecedoresPaginados.length} de {fornecedoresFiltrados.length} fornecedores
                {busca && ` para "${busca}"`}
              </p>
            </div>
            
            {/* Controles da Tabela */}
            <div className="flex items-center gap-4">
              {/* Paginação Info */}
              {totalPaginas > 1 && (
                <div className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas}
                </div>
              )}
              
              {/* Indicador de Loading */}
              {carregando && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Carregando...</span>
                </div>
              )}
            </div>
          </div>

          {/* Estados de Loading e Erro */}
          {carregando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando fornecedores...</p>
            </div>
          ) : erro ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
              <p className="text-gray-600 mb-4">{erro}</p>
              <button
                onClick={() => carregarFornecedores()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-gray-600 mb-4">
                {busca || filtroStatus !== 'todos' || mostrarFiltrosAvancados
                  ? 'Tente ajustar os filtros ou criar um novo fornecedor.'
                  : 'Comece criando seu primeiro fornecedor.'
                }
              </p>
              <div className="flex items-center justify-center gap-3">
                {(busca || filtroStatus !== 'todos' || mostrarFiltrosAvancados) && (
                  <button
                    onClick={limparFiltros}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </button>
                )}
                <button
                  onClick={abrirModalCriacao}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Fornecedor
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fornecedoresSelecionados.length === fornecedoresPaginados.length && fornecedoresPaginados.length > 0}
                            onChange={(e) => e.target.checked ? selecionarTodos() : deselecionarTodos()}
                            className="w-4 h-4 text-[#159A9C] bg-gray-100 border-gray-300 rounded focus:ring-[#159A9C] focus:ring-2"
                          />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => alterarOrdenacao('nome')}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Fornecedor
                          {ordenacao.campo === 'nome' && (
                            ordenacao.direcao === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => alterarOrdenacao('cnpjCpf')}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          CNPJ/CPF
                          {ordenacao.campo === 'cnpjCpf' && (
                            ordenacao.direcao === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contato
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Localização
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Score
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => alterarOrdenacao('ativo')}
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Status
                          {ordenacao.campo === 'ativo' && (
                            ordenacao.direcao === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => alterarOrdenacao('criadoEm')}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Criado em
                          {ordenacao.campo === 'criadoEm' && (
                            ordenacao.direcao === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center justify-end gap-2">
                          <Settings className="w-4 h-4" />
                          Ações
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fornecedoresPaginados.map((fornecedor) => {
                      const score = calcularScoreFornecedor(fornecedor);
                      const tempoParceria = calcularTempoParceria(fornecedor.criadoEm);
                      
                      return (
                        <tr key={fornecedor.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={fornecedoresSelecionados.includes(fornecedor.id)}
                              onChange={() => toggleSelecionarFornecedor(fornecedor.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {fornecedor.nome}
                                  </div>
                                  {score >= 80 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <Star className="w-3 h-3 mr-1" />
                                      Premium
                                    </span>
                                  )}
                                  {fornecedor.favorito && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                {fornecedor.contato && (
                                  <div className="text-sm text-gray-500">
                                    {fornecedor.contato} {fornecedor.cargo && `• ${fornecedor.cargo}`}
                                  </div>
                                )}
                                {fornecedor.categoria && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    📂 {fornecedor.categoria}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">
                              {formatarCNPJCPF(fornecedor.cnpjCpf)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {fornecedor.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                  <a href={`mailto:${fornecedor.email}`} className="hover:text-blue-600 transition-colors">
                                    {fornecedor.email}
                                  </a>
                                </div>
                              )}
                              {fornecedor.telefone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                  <a href={`tel:${fornecedor.telefone}`} className="hover:text-blue-600 transition-colors">
                                    {formatarTelefone(fornecedor.telefone)}
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {fornecedor.cidade && fornecedor.estado ? (
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                  {fornecedor.cidade}, {fornecedor.estado}
                                </div>
                              ) : (
                                <span className="text-gray-400">Não informado</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${
                                  score >= 80 ? 'text-green-600' :
                                  score >= 50 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {score}/100
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      score >= 80 ? 'bg-green-500' :
                                      score >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fornecedor.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {fornecedor.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div>
                              {new Date(fornecedor.criadoEm).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {tempoParceria} dias atrás
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => abrirModalDetalhes(fornecedor)}
                                className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Ver detalhes completos"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => abrirModalEdicao(fornecedor)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Editar fornecedor"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => excluirFornecedor(fornecedor.id.toString())}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Excluir fornecedor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {((paginaAtual - 1) * itensPorPagina) + 1} a {Math.min(paginaAtual * itensPorPagina, fornecedoresFiltrados.length)} de {fornecedoresFiltrados.length} resultados
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      disabled={paginaAtual === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        const pagina = i + 1;
                        return (
                          <button
                            key={pagina}
                            onClick={() => setPaginaAtual(pagina)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              paginaAtual === pagina
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      })}
                      {totalPaginas > 5 && (
                        <>
                          <span className="px-2 text-gray-400">...</span>
                          <button
                            onClick={() => setPaginaAtual(totalPaginas)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              paginaAtual === totalPaginas
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {totalPaginas}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modais Avançados */}
        
        {/* Modal de Fornecedor (Criação/Edição) */}
        {modalAberto && (
          <ModalFornecedor
            isOpen={modalAberto}
            onClose={fecharModal}
            onSave={handleSalvarFornecedor}
            fornecedor={fornecedorEdicao}
          />
        )}

        {/* Modal de Detalhes do Fornecedor */}
        {modalDetalhesAberto && fornecedorDetalhes && (
          <ModalDetalhesFornecedor
            isOpen={modalDetalhesAberto}
            onClose={fecharModalDetalhes}
            fornecedor={fornecedorDetalhes}
            onEdit={abrirModalEdicao}
          />
        )}

        {/* Modal de Importação */}
        {modalImportacaoAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Fornecedores
                </h2>
                <button
                  onClick={fecharModalImportacao}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Como importar seus fornecedores</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Formatos aceitos</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Arquivos Excel (.xlsx) ou CSV (.csv) com os campos obrigatórios
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Campos obrigatórios:</strong> Nome, CNPJ/CPF</p>
                    <p><strong>Campos opcionais:</strong> Email, Telefone, Endereço, Cidade, Estado, CEP, Contato, Cargo, Categoria</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Carregar arquivo</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (arquivo) {
                        handleImportacaoFornecedores(arquivo);
                      }
                    }}
                    className="mt-4"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-6 border-t border-gray-200">
                <button
                  onClick={downloadTemplateImportacao}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Template
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={fecharModalImportacao}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Histórico de Auditoria */}
        {modalHistoricoAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Histórico de Auditoria
                </h2>
                <button
                  onClick={fecharModalHistorico}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {historicoAuditoria.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum registro de auditoria encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historicoAuditoria.slice(0, 50).map((registro) => (
                        <div key={registro.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            registro.acao === 'erro' ? 'bg-red-500' :
                            registro.acao === 'exclusao' ? 'bg-red-400' :
                            registro.acao === 'criacao' ? 'bg-green-500' :
                            registro.acao === 'edicao' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {registro.acao.charAt(0).toUpperCase() + registro.acao.slice(1)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(registro.dataHora).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {registro.detalhes}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Usuário: {registro.usuario}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={fecharModalHistorico}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
