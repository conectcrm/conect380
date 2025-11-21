import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Target,
  Plus,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Search,
  X,
  Edit2,
  Trash2,
  Grid3X3,
  List,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  RefreshCw,
  Copy,
  Save,
  Bookmark
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { oportunidadesService } from '../services/oportunidadesService';
import usuariosService from '../services/usuariosService';
import { Usuario } from '../types/usuarios';
import {
  Oportunidade,
  NovaOportunidade,
  FiltrosOportunidade,
  EstatisticasOportunidades
} from '../types/oportunidades';
import { EstagioOportunidade, PrioridadeOportunidade, OrigemOportunidade } from '../types/oportunidades/enums';
import ModalOportunidadeRefatorado from '../components/oportunidades/ModalOportunidadeRefatorado';
import ModalMudancaEstagio from '../components/oportunidades/ModalMudancaEstagio';
import ModalDetalhesOportunidade from '../components/oportunidades/ModalDetalhesOportunidade';
import ModalExport from '../components/oportunidades/ModalExport';
import { useAuth } from '../contexts/AuthContext';

// Configuração do localizador do calendário (date-fns)
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipos de visualização
type VisualizacaoPipeline = 'kanban' | 'lista' | 'calendario' | 'grafico';

// Configuração dos estágios do pipeline
// Cores progressivas que representam a jornada do lead até o fechamento
const ESTAGIOS_CONFIG = [
  {
    id: EstagioOportunidade.LEADS,
    nome: 'Leads',
    cor: 'bg-slate-500', // Cinza azulado - Leads frios, ainda não qualificados
    corTexto: 'text-slate-700',
    corFundo: 'bg-slate-50'
  },
  {
    id: EstagioOportunidade.QUALIFICACAO,
    nome: 'Qualificação',
    cor: 'bg-blue-500', // Azul - Processo de qualificação, análise
    corTexto: 'text-blue-700',
    corFundo: 'bg-blue-50'
  },
  {
    id: EstagioOportunidade.PROPOSTA,
    nome: 'Proposta',
    cor: 'bg-indigo-500', // Índigo - Proposta enviada, aguardando resposta
    corTexto: 'text-indigo-700',
    corFundo: 'bg-indigo-50'
  },
  {
    id: EstagioOportunidade.NEGOCIACAO,
    nome: 'Negociação',
    cor: 'bg-amber-500', // Âmbar - Negociação ativa, atenção necessária
    corTexto: 'text-amber-700',
    corFundo: 'bg-amber-50'
  },
  {
    id: EstagioOportunidade.FECHAMENTO,
    nome: 'Fechamento',
    cor: 'bg-orange-500', // Laranja - Quase fechado, última etapa
    corTexto: 'text-orange-700',
    corFundo: 'bg-orange-50'
  },
  {
    id: EstagioOportunidade.GANHO,
    nome: 'Ganho',
    cor: 'bg-emerald-500', // Verde esmeralda - Sucesso, venda ganha!
    corTexto: 'text-emerald-700',
    corFundo: 'bg-emerald-50'
  },
  {
    id: EstagioOportunidade.PERDIDO,
    nome: 'Perdido',
    cor: 'bg-rose-500', // Rosa/vermelho - Oportunidade perdida
    corTexto: 'text-rose-700',
    corFundo: 'bg-rose-50'
  },
];

// Cores dos gráficos (valores HEX correspondentes à paleta Crevasse)
const CORES_GRAFICOS = {
  slate: '#64748b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  amber: '#f59e0b',
  orange: '#f97316',
  emerald: '#10b981',
  rose: '#f43f5e',
  teal: '#159A9C', // Cor primária do sistema
};

const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasOportunidades | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [visualizacao, setVisualizacao] = useState<VisualizacaoPipeline>('kanban');
  const [filtros, setFiltros] = useState({
    busca: '',
    estagio: '',
    prioridade: '',
    origem: '',
    valorMin: '',
    valorMax: '',
    responsavel: '',
  });
  const [draggedItem, setDraggedItem] = useState<Oportunidade | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalExport, setShowModalExport] = useState(false);
  const [showModalMudancaEstagio, setShowModalMudancaEstagio] = useState(false);
  const [mudancaEstagioData, setMudancaEstagioData] = useState<{
    oportunidade: Oportunidade;
    novoEstagio: EstagioOportunidade;
  } | null>(null);
  const [loadingMudancaEstagio, setLoadingMudancaEstagio] = useState(false);
  const [showModalDeletar, setShowModalDeletar] = useState(false);
  const [oportunidadeDeletar, setOportunidadeDeletar] = useState<Oportunidade | null>(null);
  const [loadingDeletar, setLoadingDeletar] = useState(false);
  const [oportunidadeDetalhes, setOportunidadeDetalhes] = useState<Oportunidade | null>(null);
  const [oportunidadeEditando, setOportunidadeEditando] = useState<Oportunidade | null>(null);
  const [estagioNovaOportunidade, setEstagioNovaOportunidade] = useState<EstagioOportunidade>(EstagioOportunidade.LEADS);
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Estados para ordenação e paginação
  const [ordenacao, setOrdenacao] = useState<{
    campo: 'valor' | 'dataFechamentoEsperado' | 'probabilidade' | 'estagio' | 'titulo';
    direcao: 'asc' | 'desc';
  }>({ campo: 'dataFechamentoEsperado', direcao: 'asc' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estados para filtros salvos
  const [filtrosSalvos, setFiltrosSalvos] = useState<Array<{
    id: string;
    nome: string;
    filtros: typeof filtros;
  }>>([]);
  const [showModalSalvarFiltro, setShowModalSalvarFiltro] = useState(false);
  const [nomeFiltroSalvar, setNomeFiltroSalvar] = useState('');
  const [filtroSelecionado, setFiltroSelecionado] = useState<string | null>(null);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    const filtrosSalvosStorage = localStorage.getItem('conectcrm-pipeline-filtros-salvos');
    if (filtrosSalvosStorage) {
      try {
        setFiltrosSalvos(JSON.parse(filtrosSalvosStorage));
      } catch (err) {
        console.error('Erro ao carregar filtros salvos:', err);
      }
    }
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    if (!isAuthenticated) {
      setError('Você precisa estar autenticado para acessar esta página.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      setLoading(false);
      return;
    }
    carregarDados();
  }, [isAuthenticated, navigate]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar oportunidades e usuários em paralelo
      const [dados, stats, usuariosData] = await Promise.all([
        oportunidadesService.listarOportunidades(),
        oportunidadesService.obterEstatisticas(),
        carregarUsuarios()
      ]);

      setOportunidades(dados);
      setEstatisticas(stats);
      setUsuarios(usuariosData);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);

      // Tratamento específico para erro 401 (Unauthorized)
      if (err?.response?.status === 401) {
        setError('Sua sessão expirou. Por favor, faça login novamente.');
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          localStorage.removeItem('authToken'); // ✅ Corrigido para 'authToken'
          navigate('/login');
        }, 2000);
      } else {
        const errorMessage = err?.response?.data?.message || err.message || 'Erro ao carregar oportunidades';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de usuários para os selects
  const carregarUsuarios = async (): Promise<Usuario[]> => {
    try {
      setLoadingUsuarios(true);
      const response = await usuariosService.listarUsuarios({ ativo: true });
      return response.usuarios || [];
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      return [];
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Abrir modal para criar nova oportunidade
  const handleNovaOportunidade = (estagio: EstagioOportunidade = EstagioOportunidade.LEADS) => {
    setOportunidadeEditando(null);
    setEstagioNovaOportunidade(estagio);
    setShowModal(true);
  };

  // Abrir modal para editar oportunidade existente
  const handleEditarOportunidade = (oportunidade: Oportunidade) => {
    setOportunidadeEditando(oportunidade);
    setShowModal(true);
  };

  // Abrir modal de detalhes
  const handleVerDetalhes = (oportunidade: Oportunidade) => {
    setOportunidadeDetalhes(oportunidade);
  };

  // Abrir modal para confirmar exclusão
  const handleDeletarOportunidade = (oportunidade: Oportunidade) => {
    setOportunidadeDeletar(oportunidade);
    setShowModalDeletar(true);
  };

  // Confirmar exclusão
  const handleConfirmarDelecao = async () => {
    if (!oportunidadeDeletar) return;

    try {
      setLoadingDeletar(true);
      await oportunidadesService.excluirOportunidade(oportunidadeDeletar.id);
      setOportunidades(prev => prev.filter(o => o.id !== oportunidadeDeletar.id));

      // Recarregar estatísticas
      const stats = await oportunidadesService.obterEstatisticas();
      setEstatisticas(stats);

      toast.success('Oportunidade deletada com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar oportunidade:', err);
      toast.error('Erro ao deletar oportunidade');
    } finally {
      setLoadingDeletar(false);
      setShowModalDeletar(false);
      setOportunidadeDeletar(null);
    }
  };

  // Clonar oportunidade
  const handleClonarOportunidade = (oportunidade: Oportunidade) => {
    // Criar cópia dos dados (sem ID e datas)
    const oportunidadeClonada = {
      titulo: `${oportunidade.titulo} (Cópia)`,
      descricao: oportunidade.descricao,
      valor: oportunidade.valor,
      estagio: oportunidade.estagio,
      probabilidade: oportunidade.probabilidade,
      prioridade: oportunidade.prioridade,
      origem: oportunidade.origem,
      dataFechamentoEsperado: oportunidade.dataFechamentoEsperado,
      nomeContato: oportunidade.nomeContato,
      emailContato: oportunidade.emailContato,
      telefoneContato: oportunidade.telefoneContato,
      empresaContato: oportunidade.empresaContato,
      clienteId: oportunidade.clienteId,
      responsavelId: oportunidade.responsavelId,
    };

    // Abrir modal de edição com dados clonados
    setOportunidadeEditando(oportunidadeClonada as any);
    setShowModal(true);
    toast.success('Oportunidade duplicada! Edite e salve para criar a cópia.');
  };

  // Salvar filtro atual
  const handleSalvarFiltro = () => {
    if (!nomeFiltroSalvar.trim()) {
      toast.error('Digite um nome para o filtro');
      return;
    }

    const novoFiltro = {
      id: Date.now().toString(),
      nome: nomeFiltroSalvar.trim(),
      filtros: { ...filtros }
    };

    const novosFiltros = [...filtrosSalvos, novoFiltro];
    setFiltrosSalvos(novosFiltros);
    localStorage.setItem('conectcrm-pipeline-filtros-salvos', JSON.stringify(novosFiltros));

    setShowModalSalvarFiltro(false);
    setNomeFiltroSalvar('');
    toast.success('Filtro salvo com sucesso!');
  };

  // Aplicar filtro salvo
  const handleAplicarFiltroSalvo = (filtroId: string) => {
    const filtro = filtrosSalvos.find(f => f.id === filtroId);
    if (filtro) {
      setFiltros(filtro.filtros);
      setFiltroSelecionado(filtroId);
      setPaginaAtual(1);
      toast.success(`Filtro "${filtro.nome}" aplicado`);
    }
  };

  // Deletar filtro salvo
  const handleDeletarFiltroSalvo = (filtroId: string) => {
    const novosFiltros = filtrosSalvos.filter(f => f.id !== filtroId);
    setFiltrosSalvos(novosFiltros);
    localStorage.setItem('conectcrm-pipeline-filtros-salvos', JSON.stringify(novosFiltros));

    if (filtroSelecionado === filtroId) {
      setFiltroSelecionado(null);
    }

    toast.success('Filtro deletado');
  };

  // Limpar filtros
  const handleLimparFiltros = () => {
    setFiltros({
      busca: '',
      estagio: '',
      prioridade: '',
      origem: '',
      valorMin: '',
      valorMax: '',
      responsavel: '',
    });
    setFiltroSelecionado(null);
    setPaginaAtual(1);
  };

  // Função de ordenação
  const handleOrdenar = (campo: typeof ordenacao.campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
    setPaginaAtual(1); // Reset para primeira página ao ordenar
  };

  // Função para obter ícone de ordenação
  const getIconeOrdenacao = (campo: typeof ordenacao.campo) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' ? '↑' : '↓';
  };

  // Salvar oportunidade (criar ou atualizar)
  const handleSalvarOportunidade = async (data: NovaOportunidade) => {
    try {
      if (oportunidadeEditando) {
        // Atualizar existente
        await oportunidadesService.atualizarOportunidade({ id: oportunidadeEditando.id, ...data });
      } else {
        // Criar nova
        await oportunidadesService.criarOportunidade(data);
      }

      // Recarregar dados
      await carregarDados();
      setShowModal(false);
      setOportunidadeEditando(null);
      toast.success(oportunidadeEditando ? 'Oportunidade atualizada com sucesso!' : 'Oportunidade criada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar oportunidade:', err);
      toast.error('Erro ao salvar oportunidade');
      throw err; // Deixar o modal tratar o erro
    }
  };

  // Exportar oportunidades
  // Exportar oportunidades
  const handleExport = async (formato: 'csv' | 'excel' | 'pdf') => {
    try {
      console.log(`Exportando ${oportunidadesFiltradas.length} oportunidades no formato ${formato}`);

      const dataAtual = new Date().toISOString().split('T')[0];

      if (formato === 'csv') {
        // CSV Export
        const csv = [
          'Título,Estágio,Valor,Probabilidade,Prioridade,Origem,Contato,Email,Telefone,Empresa,Responsável,Data Esperada',
          ...oportunidadesFiltradas.map(op =>
            `"${op.titulo}","${op.estagio}","${formatarMoeda(op.valor)}","${op.probabilidade}%","${op.prioridade || ''}","${op.origem || ''}","${op.nomeContato || ''}","${op.emailContato || ''}","${op.telefoneContato || ''}","${op.empresaContato || ''}","${op.responsavel?.nome || ''}","${op.dataFechamentoEsperado || ''}"`
          )
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `oportunidades_${dataAtual}.csv`;
        link.click();

      } else if (formato === 'excel') {
        // Excel Export usando xlsx
        const dadosExcel = oportunidadesFiltradas.map(op => ({
          'Título': op.titulo,
          'Estágio': op.estagio,
          'Valor': op.valor,
          'Probabilidade (%)': op.probabilidade,
          'Prioridade': op.prioridade || '',
          'Origem': op.origem || '',
          'Contato': op.nomeContato || '',
          'Email': op.emailContato || '',
          'Telefone': op.telefoneContato || '',
          'Empresa': op.empresaContato || '',
          'Responsável': op.responsavel?.nome || '',
          'Data Esperada': op.dataFechamentoEsperado || '',
          'Descrição': op.descricao || '',
        }));

        // Criar workbook
        const ws = XLSX.utils.json_to_sheet(dadosExcel);
        const wb = XLSX.utils.book_new();

        // Ajustar largura das colunas
        const colWidths = [
          { wch: 30 }, // Título
          { wch: 15 }, // Estágio
          { wch: 15 }, // Valor
          { wch: 12 }, // Probabilidade
          { wch: 12 }, // Prioridade
          { wch: 15 }, // Origem
          { wch: 25 }, // Contato
          { wch: 30 }, // Email
          { wch: 18 }, // Telefone
          { wch: 25 }, // Empresa
          { wch: 20 }, // Responsável
          { wch: 15 }, // Data Esperada
          { wch: 50 }, // Descrição
        ];
        ws['!cols'] = colWidths;

        // Adicionar aba de Oportunidades
        XLSX.utils.book_append_sheet(wb, ws, 'Oportunidades');

        // Adicionar aba de Estatísticas
        if (estatisticas) {
          const statsData = [
            { Métrica: 'Total de Oportunidades', Valor: estatisticas.totalOportunidades },
            { Métrica: 'Valor Total do Pipeline', Valor: formatarMoeda(estatisticas.valorTotalPipeline) },
            { Métrica: 'Ticket Médio', Valor: formatarMoeda(estatisticas.valorMedio) },
            { Métrica: 'Taxa de Conversão', Valor: `${estatisticas.taxaConversao.toFixed(1)}%` },
          ];
          const wsStats = XLSX.utils.json_to_sheet(statsData);
          wsStats['!cols'] = [{ wch: 30 }, { wch: 25 }];
          XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas');
        }

        // Adicionar aba por Estágio
        const stagingData = ESTAGIOS_CONFIG.map(estagio => {
          const opsEstagio = oportunidadesFiltradas.filter(op => op.estagio === estagio.id);
          const valorTotal = opsEstagio.reduce((sum, op) => sum + op.valor, 0);
          return {
            Estágio: estagio.nome,
            Quantidade: opsEstagio.length,
            'Valor Total': formatarMoeda(valorTotal),
            'Valor Médio': opsEstagio.length > 0 ? formatarMoeda(valorTotal / opsEstagio.length) : 'R$ 0,00',
          };
        });
        const wsStaging = XLSX.utils.json_to_sheet(stagingData);
        wsStaging['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsStaging, 'Por Estágio');

        // Salvar arquivo
        XLSX.writeFile(wb, `oportunidades_${dataAtual}.xlsx`);

      } else if (formato === 'pdf') {
        // PDF Export usando jspdf
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 35, 51); // #002333
        doc.text('Pipeline de Vendas', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
        doc.text(`Total de oportunidades: ${oportunidadesFiltradas.length}`, 14, 34);

        // Estatísticas (se houver)
        if (estatisticas) {
          let yPos = 45;
          doc.setFontSize(14);
          doc.setTextColor(0, 35, 51);
          doc.text('Resumo Executivo', 14, yPos);

          yPos += 8;
          doc.setFontSize(10);
          doc.setTextColor(64, 64, 64);
          doc.text(`• Valor Total do Pipeline: ${formatarMoeda(estatisticas.valorTotalPipeline)}`, 14, yPos);
          yPos += 6;
          doc.text(`• Ticket Médio: ${formatarMoeda(estatisticas.valorMedio)}`, 14, yPos);
          yPos += 6;
          doc.text(`• Taxa de Conversão: ${estatisticas.taxaConversao.toFixed(1)}%`, 14, yPos);
          yPos += 10;
        }

        // Tabela de Oportunidades
        const tableData = oportunidadesFiltradas.map(op => [
          op.titulo,
          op.estagio,
          formatarMoeda(op.valor),
          `${op.probabilidade}%`,
          op.nomeContato || '-',
          op.responsavel?.nome || '-',
        ]);

        autoTable(doc, {
          startY: estatisticas ? 75 : 45,
          head: [['Título', 'Estágio', 'Valor', 'Prob.', 'Contato', 'Responsável']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [21, 154, 156], // #159A9C
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 35 },
            5: { cellWidth: 30 },
          },
          margin: { top: 10 },
        });

        // Rodapé
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        // Salvar PDF
        doc.save(`oportunidades_${dataAtual}.pdf`);
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      throw err;
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (oportunidade: Oportunidade) => {
    setDraggedItem(oportunidade);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (novoEstagio: EstagioOportunidade) => {
    if (!draggedItem) return;

    // Não faz nada se soltar no mesmo estágio
    if (draggedItem.estagio === novoEstagio) {
      setDraggedItem(null);
      return;
    }

    // Abrir modal para registrar motivo da mudança
    setMudancaEstagioData({
      oportunidade: draggedItem,
      novoEstagio: novoEstagio
    });
    setShowModalMudancaEstagio(true);
  };

  // Confirmar mudança de estágio com motivo registrado
  const handleConfirmarMudancaEstagio = async (
    motivo: string,
    comentario: string,
    proximaAcao?: Date
  ) => {
    if (!mudancaEstagioData) return;

    try {
      setLoadingMudancaEstagio(true);

      const { oportunidade, novoEstagio } = mudancaEstagioData;

      // Atualizar estágio no backend
      await oportunidadesService.atualizarOportunidade({
        id: oportunidade.id,
        estagio: novoEstagio
      });

      // Criar atividade de histórico
      const descricaoAtividade = [
        `Oportunidade movida de "${ESTAGIOS_CONFIG.find(e => e.id === oportunidade.estagio)?.nome}" para "${ESTAGIOS_CONFIG.find(e => e.id === novoEstagio)?.nome}"`,
        `Motivo: ${motivo}`,
        comentario ? `\nDetalhes: ${comentario}` : '',
        proximaAcao ? `\nPróxima ação agendada para: ${new Date(proximaAcao).toLocaleDateString('pt-BR')}` : ''
      ].filter(Boolean).join('\n');

      try {
        await oportunidadesService.criarAtividade({
          oportunidadeId: oportunidade.id,
          tipo: 'note',
          descricao: descricaoAtividade,
          dataAtividade: new Date()
        });
      } catch (err) {
        console.warn('Erro ao criar atividade de histórico:', err);
        // Continua mesmo se falhar ao criar atividade
      }

      // Atualizar estado local
      setOportunidades(prev =>
        prev.map(op =>
          op.id === oportunidade.id ? { ...op, estagio: novoEstagio } : op
        )
      );

      // Recarregar estatísticas
      const stats = await oportunidadesService.obterEstatisticas();
      setEstatisticas(stats);

      // Fechar modal
      setShowModalMudancaEstagio(false);
      setMudancaEstagioData(null);
      setDraggedItem(null);

      // Toast de sucesso (você pode usar uma lib de toast aqui)
      toast.success('Oportunidade movida com sucesso!');
    } catch (err) {
      console.error('Erro ao mover oportunidade:', err);
      toast.error('Erro ao mover oportunidade');
      setError('Erro ao mover oportunidade');
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  // Filtrar oportunidades com filtros avançados
  const oportunidadesFiltradas = oportunidades.filter(op => {
    // Filtro por busca (texto)
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      const matchBusca = (
        op.titulo.toLowerCase().includes(busca) ||
        op.descricao?.toLowerCase().includes(busca) ||
        op.nomeContato?.toLowerCase().includes(busca) ||
        op.empresaContato?.toLowerCase().includes(busca) ||
        op.emailContato?.toLowerCase().includes(busca) ||
        op.telefoneContato?.toLowerCase().includes(busca)
      );
      if (!matchBusca) return false;
    }

    // Filtro por estágio
    if (filtros.estagio && op.estagio !== filtros.estagio) {
      return false;
    }

    // Filtro por prioridade
    if (filtros.prioridade && op.prioridade !== filtros.prioridade) {
      return false;
    }

    // Filtro por origem
    if (filtros.origem && op.origem !== filtros.origem) {
      return false;
    }

    // Filtro por responsável
    if (filtros.responsavel && op.responsavel?.id !== filtros.responsavel) {
      return false;
    }

    // Filtro por valor mínimo
    if (filtros.valorMin) {
      const valorMin = parseFloat(filtros.valorMin);
      if (!isNaN(valorMin) && op.valor < valorMin) {
        return false;
      }
    }

    // Filtro por valor máximo
    if (filtros.valorMax) {
      const valorMax = parseFloat(filtros.valorMax);
      if (!isNaN(valorMax) && op.valor > valorMax) {
        return false;
      }
    }

    return true;
  });

  // Aplicar ordenação
  const oportunidadesOrdenadas = [...oportunidadesFiltradas].sort((a, b) => {
    const multiplicador = ordenacao.direcao === 'asc' ? 1 : -1;

    switch (ordenacao.campo) {
      case 'valor':
        return (Number(a.valor) - Number(b.valor)) * multiplicador;

      case 'dataFechamentoEsperado':
        const dataA = a.dataFechamentoEsperado ? new Date(a.dataFechamentoEsperado).getTime() : 0;
        const dataB = b.dataFechamentoEsperado ? new Date(b.dataFechamentoEsperado).getTime() : 0;
        return (dataA - dataB) * multiplicador;

      case 'probabilidade':
        return (Number(a.probabilidade) - Number(b.probabilidade)) * multiplicador;

      case 'estagio':
        const ordemEstagios = Object.values(EstagioOportunidade);
        const indexA = ordemEstagios.indexOf(a.estagio);
        const indexB = ordemEstagios.indexOf(b.estagio);
        return (indexA - indexB) * multiplicador;

      case 'titulo':
        return a.titulo.localeCompare(b.titulo) * multiplicador;

      default:
        return 0;
    }
  });

  // Aplicar paginação
  const totalPaginas = Math.ceil(oportunidadesOrdenadas.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const oportunidadesPaginadas = oportunidadesOrdenadas.slice(indexInicio, indexFim);

  // Transformar oportunidades em eventos de calendário
  const eventosCalendario = useMemo(() => {
    return oportunidadesFiltradas.map(op => {
      // Usar dataFechamentoEsperado se existir, senão usar updatedAt
      const dataEvento = op.dataFechamentoEsperado
        ? new Date(op.dataFechamentoEsperado)
        : new Date(op.updatedAt);

      // Encontrar cor do estágio
      const estagioConfig = ESTAGIOS_CONFIG.find(e => e.id === op.estagio);
      const cor = estagioConfig?.cor.replace('bg-', '') || 'slate-500';

      return {
        id: op.id,
        title: op.titulo,
        start: dataEvento,
        end: dataEvento,
        resource: op,
        color: cor,
      };
    });
  }, [oportunidadesFiltradas]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    // 1. Funil de conversão (Oportunidades por estágio)
    const funil = ESTAGIOS_CONFIG.map(estagio => {
      const oportunidadesEstagio = oportunidadesFiltradas.filter(op => op.estagio === estagio.id);
      return {
        nome: estagio.nome,
        quantidade: oportunidadesEstagio.length,
        valor: oportunidadesEstagio.reduce((acc, op) => acc + Number(op.valor || 0), 0),
        cor: estagio.cor.replace('bg-', '').replace('-500', ''),
      };
    });

    // 2. Valor por estágio (para gráfico de barras horizontal)
    const valorPorEstagio = funil.map(item => ({
      nome: item.nome,
      valor: item.valor,
      cor: item.cor,
    }));

    // 3. Taxa de conversão (% entre estágios)
    const totalLeads = funil[0]?.quantidade || 1;
    const taxaConversao = ESTAGIOS_CONFIG.map((estagio, index) => {
      const qtd = funil[index]?.quantidade || 0;
      return {
        nome: estagio.nome,
        taxa: totalLeads > 0 ? ((qtd / totalLeads) * 100).toFixed(1) : 0,
        quantidade: qtd,
      };
    });

    // 4. Origem das oportunidades (pizza)
    const origemCount: Record<string, number> = {};
    oportunidadesFiltradas.forEach(op => {
      const origem = op.origem || 'Não informado';
      origemCount[origem] = (origemCount[origem] || 0) + 1;
    });
    const origens = Object.entries(origemCount).map(([nome, value]) => ({
      nome,
      value,
    }));

    // 5. Performance por responsável (top 5)
    const responsavelStats: Record<string, { nome: string; quantidade: number; valor: number }> = {};
    oportunidadesFiltradas.forEach(op => {
      const respId = op.responsavel?.id || 'sem-responsavel';
      const respNome = op.responsavel?.nome || 'Sem responsável';
      if (!responsavelStats[respId]) {
        responsavelStats[respId] = { nome: respNome, quantidade: 0, valor: 0 };
      }
      responsavelStats[respId].quantidade++;
      responsavelStats[respId].valor += Number(op.valor || 0);
    });
    const performance = Object.values(responsavelStats)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return {
      funil,
      valorPorEstagio,
      taxaConversao,
      origens,
      performance,
    };
  }, [oportunidadesFiltradas]);

  // Agrupar por estágio
  const agrupadoPorEstagio = useMemo(() => {
    return ESTAGIOS_CONFIG.map(estagio => ({
      ...estagio,
      oportunidades: oportunidadesFiltradas.filter(op => op.estagio === estagio.id)
    }));
  }, [oportunidadesFiltradas]);

  // Calcular métricas
  const calcularValorTotal = (oportunidades: Oportunidade[]) => {
    return oportunidades.reduce((acc, op) => acc + Number(op.valor || 0), 0);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" />
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
            <p className="text-[#002333]/60">Carregando pipeline...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" />
      </div>

      <div className="p-6">
        <div className="max-w-[1920px] mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center mb-2">
                  <Target className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Pipeline de Vendas
                </h1>
                <p className="text-[#002333]/60">
                  Gerencie suas oportunidades de venda através de um funil visual
                </p>
              </div>
              <button
                onClick={() => handleNovaOportunidade()}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nova Oportunidade
              </button>
            </div>
          </div>

          {/* Métricas do Pipeline */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total de Oportunidades */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Total de Oportunidades
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.totalOportunidades}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-sm">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Valor Total */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Valor Total
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {formatarMoeda(estatisticas.valorTotalPipeline)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-sm">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Ticket Médio */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Ticket Médio
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {formatarMoeda(estatisticas.valorMedio)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Taxa de Conversão */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-[#FFFFFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Taxa de Conversão
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.taxaConversao.toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-sm">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seletor de Visualização */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#002333]">Visualização:</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setVisualizacao('kanban')}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${visualizacao === 'kanban'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-[#002333]/60 hover:text-[#002333]'
                      }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setVisualizacao('lista')}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${visualizacao === 'lista'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-[#002333]/60 hover:text-[#002333]'
                      }`}
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </button>
                  <button
                    onClick={() => setVisualizacao('calendario')}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${visualizacao === 'calendario'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-[#002333]/60 hover:text-[#002333]'
                      }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Calendário
                  </button>
                  <button
                    onClick={() => setVisualizacao('grafico')}
                    className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${visualizacao === 'grafico'
                      ? 'bg-white text-[#159A9C] shadow-sm'
                      : 'text-[#002333]/60 hover:text-[#002333]'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Gráficos
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => carregarDados()}
                  disabled={loading}
                  className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowModalExport(true)}
                  className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exportar"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                <input
                  type="text"
                  placeholder="Buscar oportunidades..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${showFiltros
                  ? 'bg-[#159A9C] text-white border-[#159A9C]'
                  : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-gray-50'
                  }`}
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
              {(filtros.responsavel || filtros.busca || filtros.estagio || filtros.prioridade || filtros.origem || filtros.valorMin || filtros.valorMax) && (
                <>
                  <button
                    onClick={handleLimparFiltros}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                  <button
                    onClick={() => setShowModalSalvarFiltro(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Filtro
                  </button>
                </>
              )}

              {/* Dropdown de Filtros Salvos */}
              {filtrosSalvos.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => document.getElementById('dropdown-filtros')?.classList.toggle('hidden')}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${filtroSelecionado
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-white text-[#002333] border-[#B4BEC9] hover:bg-gray-50'
                      }`}
                  >
                    <Bookmark className="h-4 w-4" />
                    Filtros ({filtrosSalvos.length})
                  </button>
                  <div
                    id="dropdown-filtros"
                    className="hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                  >
                    <div className="p-2">
                      <p className="text-xs font-semibold text-[#002333]/60 uppercase tracking-wide px-3 py-2">
                        Filtros Salvos
                      </p>
                      {filtrosSalvos.map(filtro => (
                        <div
                          key={filtro.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group"
                        >
                          <button
                            onClick={() => {
                              handleAplicarFiltroSalvo(filtro.id);
                              document.getElementById('dropdown-filtros')?.classList.add('hidden');
                            }}
                            className="flex-1 text-left text-sm text-[#002333] font-medium"
                          >
                            {filtroSelecionado === filtro.id && '✓ '}
                            {filtro.nome}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Deletar filtro "${filtro.nome}"?`)) {
                                handleDeletarFiltroSalvo(filtro.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Filtros Expandido */}
            {showFiltros && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Estágio */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Estágio
                  </label>
                  <select
                    value={filtros.estagio}
                    onChange={(e) => setFiltros({ ...filtros, estagio: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="">Todos os estágios</option>
                    {ESTAGIOS_CONFIG.map(estagio => (
                      <option key={estagio.id} value={estagio.id}>{estagio.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Prioridade
                  </label>
                  <select
                    value={filtros.prioridade}
                    onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="">Todas as prioridades</option>
                    <option value={PrioridadeOportunidade.BAIXA}>Baixa</option>
                    <option value={PrioridadeOportunidade.MEDIA}>Média</option>
                    <option value={PrioridadeOportunidade.ALTA}>Alta</option>
                  </select>
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Origem
                  </label>
                  <select
                    value={filtros.origem}
                    onChange={(e) => setFiltros({ ...filtros, origem: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                  >
                    <option value="">Todas as origens</option>
                    <option value={OrigemOportunidade.WEBSITE}>Website</option>
                    <option value={OrigemOportunidade.INDICACAO}>Indicação</option>
                    <option value={OrigemOportunidade.REDES_SOCIAIS}>Redes Sociais</option>
                    <option value={OrigemOportunidade.EVENTO}>Evento</option>
                    <option value={OrigemOportunidade.CAMPANHA}>Campanha</option>
                    <option value={OrigemOportunidade.TELEFONE}>Telefone</option>
                    <option value={OrigemOportunidade.EMAIL}>Email</option>
                    <option value={OrigemOportunidade.PARCEIRO}>Parceiro</option>
                  </select>
                </div>

                {/* Valor Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Valor Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 1000"
                    value={filtros.valorMin}
                    onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Valor Máximo */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Valor Máximo (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 50000"
                    value={filtros.valorMax}
                    onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Responsável
                  </label>
                  <select
                    value={filtros.responsavel}
                    onChange={(e) => setFiltros({ ...filtros, responsavel: e.target.value })}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    disabled={loadingUsuarios}
                  >
                    <option value="">
                      {loadingUsuarios ? 'Carregando...' : 'Todos os responsáveis'}
                    </option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-1">Erro ao Carregar Dados</h3>
                  <p className="text-red-800 mb-4">{error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => carregarDados()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Tentar Novamente
                    </button>
                    {error.includes('sessão expirou') || error.includes('autenticado') ? (
                      <button
                        onClick={() => {
                          localStorage.removeItem('authToken'); // ✅ Corrigido para 'authToken'
                          navigate('/login');
                        }}
                        className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Fazer Login
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualização Kanban */}
          {visualizacao === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {agrupadoPorEstagio.map((estagio) => (
                <div
                  key={estagio.id}
                  className="flex-shrink-0 w-80"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(estagio.id)}
                >
                  {/* Header da Coluna */}
                  <div className={`${estagio.cor} rounded-t-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {estagio.id === 'leads' ? '🎯' :
                            estagio.id === 'qualificacao' ? '✅' :
                              estagio.id === 'proposta' ? '📄' :
                                estagio.id === 'negociacao' ? '🤝' : '🎉'}
                        </span>
                        <h3 className="font-bold text-white">
                          {estagio.nome}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/25 backdrop-blur-sm text-white border border-white/30">
                          {estagio.oportunidades.length}
                        </span>
                        <button
                          onClick={() => handleNovaOportunidade(estagio.id)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                          title="Adicionar oportunidade"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white font-semibold">
                      {formatarMoeda(calcularValorTotal(estagio.oportunidades))}
                    </p>
                  </div>

                  {/* Cards das Oportunidades */}
                  <div className="bg-gray-100 rounded-b-lg p-2 min-h-[500px] space-y-2">
                    {estagio.oportunidades.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4 opacity-20">
                          {estagio.id === 'leads' ? '🎯' :
                            estagio.id === 'qualificacao' ? '✅' :
                              estagio.id === 'proposta' ? '📄' :
                                estagio.id === 'negociacao' ? '🤝' : '🎉'}
                        </div>
                        <p className="text-[#002333]/40 text-sm font-medium">Nenhuma oportunidade</p>
                        <p className="text-[#002333]/30 text-xs mt-1">Arraste cards para cá</p>
                      </div>
                    ) : (
                      estagio.oportunidades.map((oportunidade) => {
                        // Determinar cor da probabilidade (heat map)
                        const prob = oportunidade.probabilidade || 0;
                        const probColor = prob <= 20 ? 'bg-red-100 text-red-700' :
                          prob <= 40 ? 'bg-orange-100 text-orange-700' :
                            prob <= 60 ? 'bg-yellow-100 text-yellow-700' :
                              prob <= 80 ? 'bg-green-100 text-green-700' :
                                'bg-green-200 text-green-800';
                        const probEmoji = prob <= 20 ? '❄️' : prob <= 40 ? '🌤️' : prob <= 60 ? '☀️' : prob <= 80 ? '🔥' : '🚀';

                        // Calcular SLA
                        const diasAteVencimento = oportunidade.dataFechamentoEsperado
                          ? differenceInDays(new Date(oportunidade.dataFechamentoEsperado), new Date())
                          : null;

                        return (
                          <div
                            key={oportunidade.id}
                            draggable
                            onDragStart={() => handleDragStart(oportunidade)}
                            onClick={() => handleVerDetalhes(oportunidade)}
                            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer relative group"
                          >
                            {/* Header com avatar e ações */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {/* Avatar do responsável */}
                                {oportunidade.responsavel && (
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] flex items-center justify-center text-white text-xs font-bold shadow-sm" title={oportunidade.responsavel.nome}>
                                    {oportunidade.responsavel.nome?.charAt(0).toUpperCase() || 'U'}
                                  </div>
                                )}
                                {/* Badge de prioridade */}
                                {oportunidade.prioridade === 'alta' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Alta</span>
                                )}
                                {oportunidade.prioridade === 'urgente' && (
                                  <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold">Urgente</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarOportunidade(oportunidade);
                                  }}
                                  className="text-[#159A9C] hover:bg-[#159A9C]/10 p-1.5 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClonarOportunidade(oportunidade);
                                  }}
                                  className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                  title="Duplicar"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletarOportunidade(oportunidade);
                                  }}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Badge de SLA */}
                            {diasAteVencimento !== null && (
                              <>
                                {diasAteVencimento < 0 && (
                                  <div className="mb-3 px-2 py-1 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-xs font-semibold text-red-700">
                                      Atrasado {Math.abs(diasAteVencimento)}d
                                    </span>
                                  </div>
                                )}
                                {diasAteVencimento >= 0 && diasAteVencimento < 7 && (
                                  <div className="mb-3 px-2 py-1 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-xs font-semibold text-yellow-700">
                                      Vence em {diasAteVencimento}d
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Título */}
                            <h4 className="font-bold text-[#002333] text-base mb-3 line-clamp-2 leading-tight">
                              {oportunidade.titulo}
                            </h4>

                            {/* Valor em destaque */}
                            <div className="mb-3 pb-3 border-b border-gray-100">
                              <p className="text-2xl font-extrabold text-emerald-600">
                                {formatarMoeda(Number(oportunidade.valor || 0))}
                              </p>
                            </div>

                            {/* Badge de Probabilidade com Heat Map */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-[#002333]/60 font-medium">Probabilidade</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${probColor} flex items-center gap-1`}>
                                <span>{probEmoji}</span>
                                <span>{oportunidade.probabilidade}%</span>
                              </span>
                            </div>

                            {/* Cliente (prioritário) ou Contato */}
                            {oportunidade.cliente ? (
                              // Se tem cliente vinculado, mostra link clicável
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clientes/${oportunidade.cliente.id}`);
                                }}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline mb-2 transition-colors"
                              >
                                <Users className="h-4 w-4" />
                                <span className="truncate font-medium">{oportunidade.cliente.nome}</span>
                              </button>
                            ) : oportunidade.nomeContato ? (
                              // Se não tem cliente, mas tem nome de contato, mostra o contato
                              <div className="flex items-center gap-2 text-sm text-[#002333]/70 mb-2">
                                <Users className="h-4 w-4 text-[#159A9C]" />
                                <span className="truncate font-medium">{oportunidade.nomeContato}</span>
                              </div>
                            ) : null}

                            {/* Data */}
                            {oportunidade.dataFechamentoEsperado && (
                              <div className="flex items-center gap-2 text-sm text-[#002333]/70">
                                <Calendar className="h-4 w-4 text-[#159A9C]" />
                                <span className="font-medium">
                                  {new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}

                            {/* Tags */}
                            {oportunidade.tags && oportunidade.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                                {oportunidade.tags.slice(0, 2).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-md text-xs font-semibold"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {oportunidade.tags.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">
                                    +{oportunidade.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visualização Lista */}
          {visualizacao === 'lista' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th
                        onClick={() => handleOrdenar('titulo')}
                        className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Título
                          <span className="text-[#159A9C]">{getIconeOrdenacao('titulo')}</span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleOrdenar('estagio')}
                        className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Estágio
                          <span className="text-[#159A9C]">{getIconeOrdenacao('estagio')}</span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleOrdenar('valor')}
                        className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Valor
                          <span className="text-[#159A9C]">{getIconeOrdenacao('valor')}</span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleOrdenar('probabilidade')}
                        className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Probabilidade
                          <span className="text-[#159A9C]">{getIconeOrdenacao('probabilidade')}</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider">
                        Contato
                      </th>
                      <th
                        onClick={() => handleOrdenar('dataFechamentoEsperado')}
                        className="px-6 py-3 text-left text-xs font-medium text-[#002333] uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          Data Esperada
                          <span className="text-[#159A9C]">{getIconeOrdenacao('dataFechamentoEsperado')}</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[#002333] uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {oportunidadesPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-[#002333]/60">
                          Nenhuma oportunidade encontrada
                        </td>
                      </tr>
                    ) : (
                      oportunidadesPaginadas.map((oportunidade) => {
                        const estagioInfo = ESTAGIOS_CONFIG.find(e => e.id === oportunidade.estagio);
                        return (
                          <tr
                            key={oportunidade.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleVerDetalhes(oportunidade)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[#002333]">
                                {oportunidade.titulo}
                              </div>
                              {oportunidade.descricao && (
                                <div className="text-sm text-[#002333]/60 line-clamp-1">
                                  {oportunidade.descricao}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estagioInfo?.corTexto} ${estagioInfo?.corFundo}`}>
                                {estagioInfo?.nome}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                              {formatarMoeda(Number(oportunidade.valor || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]">
                              {oportunidade.probabilidade}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]/60">
                              {oportunidade.nomeContato || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#002333]/60">
                              {oportunidade.dataFechamentoEsperado
                                ? new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')
                                : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarOportunidade(oportunidade);
                                  }}
                                  className="text-[#159A9C] hover:text-[#0F7B7D] transition-colors p-1"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletarOportunidade(oportunidade);
                                  }}
                                  className="text-red-600 hover:text-red-700 transition-colors p-1"
                                  title="Deletar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-[#002333]/60">
                    Mostrando {indexInicio + 1} a {Math.min(indexFim, oportunidadesOrdenadas.length)} de {oportunidadesOrdenadas.length} oportunidades
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                      disabled={paginaAtual === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-[#002333] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter(page => {
                          // Mostrar apenas páginas próximas à atual
                          return page === 1 ||
                            page === totalPaginas ||
                            Math.abs(page - paginaAtual) <= 1;
                        })
                        .map((page, index, array) => {
                          // Adicionar "..." entre páginas não consecutivas
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="px-2 text-[#002333]/40">...</span>
                              )}
                              <button
                                onClick={() => setPaginaAtual(page)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${paginaAtual === page
                                  ? 'bg-[#159A9C] text-white'
                                  : 'text-[#002333] hover:bg-gray-100'
                                  }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-[#002333] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visualização Calendário */}
          {visualizacao === 'calendario' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <style>{`
                .rbc-calendar {
                  font-family: inherit;
                  min-height: 700px;
                }
                .rbc-header {
                  padding: 12px 6px;
                  font-weight: 600;
                  font-size: 14px;
                  color: #002333;
                  background-color: #F9FAFB;
                  border-bottom: 2px solid #E5E7EB;
                }
                .rbc-toolbar {
                  padding: 16px 24px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 1px solid #E5E7EB;
                  background-color: #FFFFFF;
                }
                .rbc-toolbar button {
                  padding: 8px 16px;
                  border: 1px solid #B4BEC9;
                  background-color: white;
                  color: #002333;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                }
                .rbc-toolbar button:hover {
                  background-color: #F3F4F6;
                  border-color: #159A9C;
                }
                .rbc-toolbar button.rbc-active {
                  background-color: #159A9C;
                  color: white;
                  border-color: #159A9C;
                }
                .rbc-month-view {
                  border: none;
                }
                .rbc-month-row {
                  border: none;
                  overflow: visible;
                }
                .rbc-day-bg {
                  border: 1px solid #E5E7EB;
                }
                .rbc-off-range-bg {
                  background-color: #F9FAFB;
                }
                .rbc-today {
                  background-color: #DEEFE7 !important;
                }
                .rbc-event {
                  padding: 4px 8px;
                  border-radius: 4px;
                  border: none;
                  font-size: 12px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s;
                  color: white !important;
                }
                .rbc-event:hover {
                  opacity: 0.9;
                  transform: translateY(-1px);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .rbc-event.rbc-selected {
                  outline: 2px solid #002333;
                  outline-offset: 2px;
                }
                .rbc-event-label {
                  display: none;
                }
                .rbc-event-content {
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .rbc-date-cell {
                  padding: 6px;
                  text-align: right;
                  font-size: 14px;
                  font-weight: 500;
                  color: #002333;
                }
                .rbc-off-range .rbc-date-cell {
                  color: #9CA3AF;
                }
                .rbc-show-more {
                  color: #159A9C;
                  font-size: 12px;
                  font-weight: 600;
                  padding: 2px 4px;
                  cursor: pointer;
                  background-color: transparent;
                  border: none;
                }
                .rbc-show-more:hover {
                  text-decoration: underline;
                }
                /* Cores por estágio */
                .rbc-event.event-slate-500 { background-color: #64748b !important; }
                .rbc-event.event-blue-500 { background-color: #3b82f6 !important; }
                .rbc-event.event-indigo-500 { background-color: #6366f1 !important; }
                .rbc-event.event-amber-500 { background-color: #f59e0b !important; }
                .rbc-event.event-orange-500 { background-color: #f97316 !important; }
                .rbc-event.event-emerald-500 { background-color: #10b981 !important; }
                .rbc-event.event-rose-500 { background-color: #f43f5e !important; }
              `}</style>

              <BigCalendar
                localizer={localizer}
                events={eventosCalendario}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 700 }}
                view={calendarView}
                onView={(view) => setCalendarView(view)}
                date={calendarDate}
                onNavigate={(date) => setCalendarDate(date)}
                onSelectEvent={(event: any) => {
                  // Abrir modal da oportunidade ao clicar no evento
                  if (event.resource) {
                    handleEditarOportunidade(event.resource);
                  }
                }}
                eventPropGetter={(event: any) => ({
                  className: `event-${event.color}`,
                })}
                messages={{
                  today: 'Hoje',
                  previous: 'Anterior',
                  next: 'Próximo',
                  month: 'Mês',
                  week: 'Semana',
                  day: 'Dia',
                  agenda: 'Agenda',
                  date: 'Data',
                  time: 'Hora',
                  event: 'Evento',
                  showMore: (total) => `+${total} mais`,
                }}
                formats={{
                  monthHeaderFormat: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
                  dayHeaderFormat: (date) => format(date, 'EEEE, dd/MM', { locale: ptBR }),
                  dayRangeHeaderFormat: ({ start, end }) =>
                    `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`,
                }}
              />

              {/* Legenda de cores */}
              <div className="p-4 border-t bg-gray-50">
                <p className="text-xs font-semibold text-[#002333] mb-3">Legenda de Estágios:</p>
                <div className="flex flex-wrap gap-4">
                  {ESTAGIOS_CONFIG.map((estagio) => (
                    <div key={estagio.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${estagio.cor}`}></div>
                      <span className="text-xs text-[#002333]">{estagio.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Visualização Gráficos */}
          {visualizacao === 'grafico' && (
            <div className="space-y-6">
              {/* Grid 2x3 de gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Funil de Conversão */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#159A9C]" />
                    Funil de Conversão
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficos.funil}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="nome"
                        tick={{ fontSize: 12, fill: '#002333' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#002333' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [value, 'Oportunidades']}
                      />
                      <Bar
                        dataKey="quantidade"
                        fill="#159A9C"
                        radius={[8, 8, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. Valor por Estágio */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#159A9C]" />
                    Valor por Estágio
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficos.valorPorEstagio} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: '#002333' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        tick={{ fontSize: 12, fill: '#002333' }}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(value),
                          'Valor'
                        ]}
                      />
                      <Bar
                        dataKey="valor"
                        fill="#3b82f6"
                        radius={[0, 8, 8, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. Taxa de Conversão */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#159A9C]" />
                    Taxa de Conversão
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosGraficos.taxaConversao}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="nome"
                        tick={{ fontSize: 12, fill: '#002333' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#002333' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`${value}%`, 'Taxa']}
                      />
                      <Line
                        type="monotone"
                        dataKey="taxa"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 4. Origem das Oportunidades */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#159A9C]" />
                    Origem das Oportunidades
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dadosGraficos.origens}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percent }: any) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dadosGraficos.origens.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={Object.values(CORES_GRAFICOS)[index % Object.values(CORES_GRAFICOS).length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 5. Performance por Responsável */}
                <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#159A9C]" />
                    Top 5 - Performance por Responsável
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={dadosGraficos.performance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="nome"
                        tick={{ fontSize: 12, fill: '#002333' }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 12, fill: '#002333' }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#002333' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'valor') {
                            return [
                              new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(value),
                              'Valor Total'
                            ];
                          }
                          return [value, 'Quantidade'];
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="valor"
                        fill="#6366f1"
                        name="Valor"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="quantidade"
                        fill="#f59e0b"
                        name="Quantidade"
                        radius={[8, 8, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

              </div>

              {/* Resumo Estatístico */}
              <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] rounded-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Resumo do Pipeline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Total Oportunidades</p>
                    <p className="text-3xl font-bold">{oportunidadesFiltradas.length}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Valor Total</p>
                    <p className="text-3xl font-bold">
                      {formatarMoeda(calcularValorTotal(oportunidadesFiltradas))}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Ticket Médio</p>
                    <p className="text-3xl font-bold">
                      {formatarMoeda(
                        oportunidadesFiltradas.length > 0
                          ? calcularValorTotal(oportunidadesFiltradas) / oportunidadesFiltradas.length
                          : 0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm mb-1">Taxa Conversão</p>
                    <p className="text-3xl font-bold">
                      {dadosGraficos.funil[0]?.quantidade > 0
                        ? ((dadosGraficos.funil.find(f => f.nome === 'Ganho')?.quantidade || 0) /
                          dadosGraficos.funil[0].quantidade * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Oportunidade Refatorado */}
      <ModalOportunidadeRefatorado
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setOportunidadeEditando(null);
        }}
        onSave={handleSalvarOportunidade}
        oportunidade={oportunidadeEditando}
        estagioInicial={estagioNovaOportunidade}
        usuarios={usuarios}
        loadingUsuarios={false}
      />

      {/* Modal Export */}
      <ModalExport
        isOpen={showModalExport}
        onClose={() => setShowModalExport(false)}
        totalOportunidades={oportunidadesFiltradas.length}
        onExport={handleExport}
      />

      {/* Modal Mudança de Estágio */}
      {mudancaEstagioData && (
        <ModalMudancaEstagio
          isOpen={showModalMudancaEstagio}
          onClose={() => {
            setShowModalMudancaEstagio(false);
            setMudancaEstagioData(null);
            setDraggedItem(null);
          }}
          onConfirm={handleConfirmarMudancaEstagio}
          estagioOrigem={mudancaEstagioData.oportunidade.estagio}
          estagioDestino={mudancaEstagioData.novoEstagio}
          tituloOportunidade={mudancaEstagioData.oportunidade.titulo}
          loading={loadingMudancaEstagio}
        />
      )}

      {/* Modal de Detalhes */}
      <ModalDetalhesOportunidade
        oportunidade={oportunidadeDetalhes}
        onClose={() => setOportunidadeDetalhes(null)}
        onEditar={(oportunidade) => {
          setOportunidadeEditando(oportunidade);
          setShowModal(true);
        }}
        onClonar={handleClonarOportunidade}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showModalDeletar && oportunidadeDeletar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#002333] mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Tem certeza que deseja deletar a oportunidade <strong>"{oportunidadeDeletar.titulo}"</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalDeletar(false);
                    setOportunidadeDeletar(null);
                  }}
                  disabled={loadingDeletar}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarDelecao}
                  disabled={loadingDeletar}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingDeletar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Deletar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Salvar Filtro */}
      {showModalSalvarFiltro && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
                <Bookmark className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#002333] mb-2">
                Salvar Filtro
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Dê um nome para este filtro para reutilizá-lo depois:
              </p>
              <input
                type="text"
                value={nomeFiltroSalvar}
                onChange={(e) => setNomeFiltroSalvar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nomeFiltroSalvar.trim()) {
                    handleSalvarFiltro();
                  }
                }}
                placeholder="Ex: Oportunidades Alta Prioridade"
                className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModalSalvarFiltro(false);
                    setNomeFiltroSalvar('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarFiltro}
                  disabled={!nomeFiltroSalvar.trim()}
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
