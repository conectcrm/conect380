/**
 * MODAL DE CRIAÇÃO/EDIÇÃO DE TICKET - CONECT CRM
 * 
 * Campos conforme especificação do usuário:
 * 1. Título
 * 2. Cliente
 * 3. Nível de Atendimento (N1, N2, N3)
 * 4. Tipo de Serviço
 * 5. Urgência
 * 6. Responsável
 * 7. Tags
 * 8. Tempo SLA
 * 9. Descrição
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Clock, HelpCircle, Check, XCircle, Search, ChevronDown, Paperclip, FileText, Image as ImageIcon, File, Trash2, Upload, BookTemplate, Download, Calendar, UserPlus, Copy, Eye, EyeOff, Plus, Bell, Link, History, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketsService, TipoTicket, PrioridadeTicketApi } from '../../services/ticketsService';
import type { Ticket } from '../../services/ticketsService';
import { clientesService, Cliente } from '../../services/clientesService';
import usersService, { User } from '../../services/usersService';
import tagsService, { Tag } from '../../services/tagsService';
// ✅ FASE 3d: Services de configurações dinâmicas
import { niveisService, NivelAtendimento } from '../../services/niveisService';
import { statusService, StatusCustomizado } from '../../services/statusService';
import { tiposService, TipoServico } from '../../services/tiposService';

interface TicketTemplate {
  id: string;
  nome: string;
  titulo: string;
  tipoServicoId: string;
  nivelAtendimentoId: string;
  prioridade: PrioridadeTicketApi;
  tagIds: string[];
  descricao: string;
}

interface AnexoTicket {
  id: string;
  nome: string;
  arquivo: File;
  tamanho: number;
  tipo: string;
  preview?: string;
}

interface TicketRelacionado {
  ticketId: string;
  tipo: 'relacionado' | 'duplicado' | 'bloqueado';
  ticketNumero?: string;
  ticketTitulo?: string;
}

interface TicketHistorico {
  id: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  usuarioNome: string;
  data: string;
}

interface TicketFormData {
  titulo: string;
  clienteId: string;
  // ✅ FASE 3d: Usar FKs em vez de enums
  nivelAtendimentoId: string;
  statusCustomizadoId: string;
  tipoServicoId: string;
  // ⚠️ Mantidos temporariamente para compatibilidade (serão removidos)
  assignedLevel?: 'N1' | 'N2' | 'N3';
  tipo?: TipoTicket;
  prioridade: PrioridadeTicketApi;
  responsavelId: string;
  tagIds: string[];
  descricao: string;
  // Novos campos
  prazoCustomizado?: string; // Data no formato YYYY-MM-DD
  observadorIds: string[]; // IDs dos usuários observadores
  notificarCliente: boolean; // Enviar notificação ao cliente via email
  ticketsRelacionados: TicketRelacionado[]; // Tickets relacionados/duplicados/bloqueados
}

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket?: Ticket | null;
  mode: 'create' | 'edit';
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ticket,
  mode,
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    titulo: '',
    clienteId: '',
    nivelAtendimentoId: '',
    statusCustomizadoId: '',
    tipoServicoId: '',
    prioridade: 'MEDIA',
    responsavelId: '',
    tagIds: [],
    descricao: '',
    prazoCustomizado: undefined,
    observadorIds: [],
    notificarCliente: false,
    ticketsRelacionados: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Estados para busca de cliente
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const clienteDropdownRef = useRef<HTMLDivElement>(null);

  // Estados para busca de responsável
  const [responsavelSearchTerm, setResponsavelSearchTerm] = useState('');
  const [showResponsavelDropdown, setShowResponsavelDropdown] = useState(false);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<User[]>([]);
  const responsavelDropdownRef = useRef<HTMLDivElement>(null);

  // Estados para anexos
  const [anexos, setAnexos] = useState<AnexoTicket[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para templates
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateNome, setTemplateNome] = useState('');

  // Estados para prazo customizado
  const [showCalendario, setShowCalendario] = useState(false);
  const calendarioRef = useRef<HTMLDivElement>(null);

  // Estados para observadores
  const [showObservadores, setShowObservadores] = useState(false);
  const observadoresRef = useRef<HTMLDivElement>(null);
  const [observadoresSearch, setObservadoresSearch] = useState('');
  const [observadoresFiltrados, setObservadoresFiltrados] = useState<User[]>([]);

  // Estados para markdown preview
  const [modoDescricao, setModoDescricao] = useState<'escrever' | 'visualizar'>('escrever');

  // Estados para criação rápida de tags
  const [showNovaTag, setShowNovaTag] = useState(false);
  const [novaTagNome, setNovaTagNome] = useState('');
  const [novaTagCor, setNovaTagCor] = useState('#159A9C');
  const [criandoTag, setCriandoTag] = useState(false);

  // Estados para relacionamento de tickets
  const [showRelacionamento, setShowRelacionamento] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketsFiltrados, setTicketsFiltrados] = useState<any[]>([]);
  const [tipoRelacao, setTipoRelacao] = useState<'relacionado' | 'duplicado' | 'bloqueado'>('relacionado');
  const relacionamentoRef = useRef<HTMLDivElement>(null);

  // Estados para histórico de alterações
  const [showHistorico, setShowHistorico] = useState(false);
  const [historico, setHistorico] = useState<TicketHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // ✅ FASE 3d: Estados para configurações dinâmicas
  const [niveis, setNiveis] = useState<NivelAtendimento[]>([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCustomizado[]>([]);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [slaMinutes, setSlaMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarDadosIniciais();
    }
  }, [isOpen]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      // Esc para fechar
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
      // Ctrl+Enter ou Cmd+Enter para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isOpen, loading, onClose]);

  // Filtrar clientes em tempo real
  useEffect(() => {
    if (!clienteSearchTerm.trim()) {
      setClientesFiltrados(clientes);
      return;
    }

    const termo = clienteSearchTerm.toLowerCase();
    const filtrados = clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(termo) ||
      cliente.email?.toLowerCase().includes(termo) ||
      cliente.telefone?.toLowerCase().includes(termo)
    );
    setClientesFiltrados(filtrados);
  }, [clienteSearchTerm, clientes]);

  // Filtrar responsáveis em tempo real
  useEffect(() => {
    if (!responsavelSearchTerm.trim()) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const termo = responsavelSearchTerm.toLowerCase();
    const filtrados = usuarios.filter(usuario =>
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email?.toLowerCase().includes(termo)
    );
    setUsuariosFiltrados(filtrados);
  }, [responsavelSearchTerm, usuarios]);

  // Carregar templates do localStorage
  useEffect(() => {
    if (isOpen) {
      const templatesStorage = localStorage.getItem('conectcrm-ticket-templates');
      if (templatesStorage) {
        try {
          setTemplates(JSON.parse(templatesStorage));
        } catch (e) {
          console.error('Erro ao carregar templates:', e);
        }
      }
    }
  }, [isOpen]);

  // Filtrar observadores em tempo real
  useEffect(() => {
    if (!observadoresSearch.trim()) {
      setObservadoresFiltrados(usuarios.filter(u => !formData.observadorIds.includes(u.id)));
      return;
    }

    const termo = observadoresSearch.toLowerCase();
    const filtrados = usuarios.filter(usuario =>
      !formData.observadorIds.includes(usuario.id) &&
      (usuario.nome.toLowerCase().includes(termo) || usuario.email?.toLowerCase().includes(termo))
    );
    setObservadoresFiltrados(filtrados);
  }, [observadoresSearch, usuarios, formData.observadorIds]);
  useEffect(() => {
    if (mode === 'edit' && ticket) {
      setFormData({
        titulo: ticket.titulo || ticket.assunto || '',
        clienteId: ticket.clienteId || '',
        // ✅ FASE 3d: Usar FKs do backend
        nivelAtendimentoId: (ticket as any).nivelAtendimentoId || '',
        statusCustomizadoId: (ticket as any).statusCustomizadoId || '',
        tipoServicoId: (ticket as any).tipoServicoId || '',
        prioridade: ticket.prioridade as any || 'MEDIA',
        responsavelId: ticket.responsavelId || '',
        tagIds: [], // TODO: Backend não retorna tags ainda, implementar relacionamento
        descricao: ticket.descricao || '',
        prazoCustomizado: undefined,
        observadorIds: [],
        notificarCliente: false,
        ticketsRelacionados: [],
      });
      setSlaMinutes(ticket.slaTargetMinutes || null);
      // Preencher campos de busca no modo edição
      if (ticket.clienteId) {
        const clienteNome = getClienteNome(ticket.clienteId);
        if (clienteNome) setClienteSearchTerm(clienteNome);
      }
      if (ticket.responsavelId) {
        const responsavelNome = getResponsavelNome(ticket.responsavelId);
        if (responsavelNome) setResponsavelSearchTerm(responsavelNome);
      }
    } else {
      setFormData({
        titulo: '',
        clienteId: '',
        nivelAtendimentoId: '',
        statusCustomizadoId: '',
        tipoServicoId: '',
        prioridade: 'MEDIA',
        responsavelId: '',
        tagIds: [],
        descricao: '',
        prazoCustomizado: undefined,
        observadorIds: [],
        notificarCliente: false,
        ticketsRelacionados: [],
      });
      setSlaMinutes(null);
      setClienteSearchTerm('');
      setResponsavelSearchTerm('');
      setAnexos([]);
    }
    setErrors({});
    setSubmitError(null);
    setShowClienteDropdown(false);
    setShowResponsavelDropdown(false);
  }, [mode, ticket, isOpen, clientes, usuarios]);

  const carregarDadosIniciais = async () => {
    try {
      setLoadingData(true);

      // ✅ FASE 3d: Carregar configurações dinâmicas junto com dados existentes
      const [clientesResult, usuariosData, tagsData, niveisData, tiposData] = await Promise.all([
        clientesService.getClientes({ limit: 1000 }).catch(() => ({
          data: [], total: 0, page: 1, limit: 0, totalPages: 0
        })),
        usersService.listarAtivos().catch(() => []),
        tagsService.listar(true).catch(() => []),
        niveisService.listarAtivos().catch(() => []),
        tiposService.listarAtivos().catch(() => []),
      ]);

      // clientesResult é PaginatedClientes: { data: Cliente[], total, page, limit, totalPages }
      const clientesArray = Array.isArray(clientesResult?.data) ? clientesResult.data : [];
      const usuariosArray = Array.isArray(usuariosData) ? usuariosData : [];
      const tagsArray = Array.isArray(tagsData) ? tagsData : [];
      const niveisArray = Array.isArray(niveisData) ? niveisData : [];
      const tiposArray = Array.isArray(tiposData) ? tiposData : [];

      setClientes(clientesArray);
      setUsuarios(usuariosArray);
      setTags(tagsArray);
      setNiveis(niveisArray);
      setTipos(tiposArray);

      // 🐛 DEBUG: Verificar dados carregados
      console.log('🔍 [TicketFormModal] Dados carregados:');
      console.log('   - Clientes:', clientesArray.length);
      console.log('   - Usuários:', usuariosArray.length);
      console.log('   - Níveis:', niveisArray.length);
      console.log('   - Tipos:', tiposArray.length);
      console.log('   - Tags:', tagsArray.length);

      // 🐛 DEBUG: Mostrar tipos detalhados
      if (tiposArray.length > 0) {
        console.log('📋 Tipos carregados:');
        tiposArray.forEach(tipo => {
          console.log(`   ${tipo.icone || '📄'} ${tipo.nome} (ID: ${tipo.id})`);
        });
      } else {
        console.warn('⚠️ Nenhum tipo foi carregado!');
      }

      // ✅ Se tiver níveis, selecionar o primeiro por padrão (modo create)
      if (mode === 'create' && niveisArray.length > 0) {
        const primeiroNivel = niveisArray[0];
        setFormData(prev => ({ ...prev, nivelAtendimentoId: primeiroNivel.id }));
      }
    } catch (err) {
      console.error('Erro ao carregar dados do formulário:', err);
      setClientes([]);
      setUsuarios([]);
      setTags([]);
      setNiveis([]);
      setTipos([]);
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ FASE 3d: Carregar status quando nível mudar
  useEffect(() => {
    const carregarStatus = async () => {
      if (!formData.nivelAtendimentoId) {
        setStatusDisponiveis([]);
        return;
      }

      try {
        setLoadingStatus(true);
        const statusData = await statusService.listarPorNivel(formData.nivelAtendimentoId);
        setStatusDisponiveis(statusData);

        // ✅ Auto-selecionar primeiro status se não tiver nenhum selecionado
        if (!formData.statusCustomizadoId && statusData.length > 0) {
          const statusFila = statusData.find(s => s.nome.toLowerCase().includes('fila'));
          const statusDefault = statusFila || statusData[0];
          setFormData(prev => ({ ...prev, statusCustomizadoId: statusDefault.id }));
        }

        // ⚠️ Se mudou o nível e o status atual não pertence ao novo nível, limpar
        if (formData.statusCustomizadoId) {
          const statusAtualValido = statusData.some(s => s.id === formData.statusCustomizadoId);
          if (!statusAtualValido) {
            const statusFila = statusData.find(s => s.nome.toLowerCase().includes('fila'));
            const statusDefault = statusFila || statusData[0];
            setFormData(prev => ({ ...prev, statusCustomizadoId: statusDefault.id }));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar status:', err);
        setStatusDisponiveis([]);
      } finally {
        setLoadingStatus(false);
      }
    };

    carregarStatus();
  }, [formData.nivelAtendimentoId]);

  useEffect(() => {
    // ✅ FASE 3d: SLA baseado em FK de nível (buscar código do nível)
    const nivelSelecionado = niveis.find(n => n.id === formData.nivelAtendimentoId);
    if (!nivelSelecionado) {
      setSlaMinutes(null);
      return;
    }

    const slaConfig: Record<string, number> = {
      'N1-URGENTE': 30, 'N1-ALTA': 60, 'N1-MEDIA': 120, 'N1-BAIXA': 240,
      'N2-URGENTE': 60, 'N2-ALTA': 120, 'N2-MEDIA': 240, 'N2-BAIXA': 480,
      'N3-URGENTE': 120, 'N3-ALTA': 240, 'N3-MEDIA': 480, 'N3-BAIXA': 960,
    };

    const key = `${nivelSelecionado.codigo}-${formData.prioridade}`;
    setSlaMinutes(slaConfig[key] || null);
  }, [formData.nivelAtendimentoId, formData.prioridade, niveis]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) newErrors.titulo = 'Título é obrigatório';
    else if (formData.titulo.trim().length < 3) newErrors.titulo = 'Título deve ter no mínimo 3 caracteres';

    if (!formData.clienteId) newErrors.clienteId = 'Cliente é obrigatório';

    // ✅ FASE 3d: Validar FKs em vez de enums
    if (!formData.nivelAtendimentoId) newErrors.nivelAtendimentoId = 'Nível de atendimento é obrigatório';
    if (!formData.statusCustomizadoId) newErrors.statusCustomizadoId = 'Status é obrigatório';
    if (!formData.tipoServicoId) newErrors.tipoServicoId = 'Tipo de serviço é obrigatório';

    if (!formData.prioridade) newErrors.prioridade = 'Urgência é obrigatória';
    if (!formData.responsavelId) newErrors.responsavelId = 'Responsável é obrigatório';

    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    else if (formData.descricao.trim().length < 10) newErrors.descricao = 'Descrição deve ter no mínimo 10 caracteres';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof TicketFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Marcar campo como tocado
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }

    // Validação em tempo real
    const newErrors = { ...errors };

    switch (field) {
      case 'titulo':
        if (!value.trim()) {
          newErrors.titulo = 'Título é obrigatório';
        } else if (value.trim().length < 3) {
          newErrors.titulo = 'Mínimo 3 caracteres';
        } else {
          delete newErrors.titulo;
        }
        break;
      case 'descricao':
        if (!value.trim()) {
          newErrors.descricao = 'Descrição é obrigatória';
        } else if (value.trim().length < 10) {
          newErrors.descricao = 'Mínimo 10 caracteres';
        } else {
          delete newErrors.descricao;
        }
        break;
      default:
        if (errors[field]) {
          delete newErrors[field];
        }
    }

    setErrors(newErrors);
  };

  const getFieldStatus = (field: keyof TicketFormData): 'valid' | 'invalid' | 'neutral' => {
    if (!touched[field]) return 'neutral';
    if (errors[field]) return 'invalid';

    const value = formData[field];
    if (field === 'titulo' && value && (value as string).trim().length >= 3) return 'valid';
    if (field === 'descricao' && value && (value as string).trim().length >= 10) return 'valid';
    if (value && typeof value === 'string' && value.trim()) return 'valid';
    if (value) return 'valid';

    return 'neutral';
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  // Funções para Responsável
  const selecionarResponsavel = (usuario: User) => {
    handleChange('responsavelId', usuario.id);
    setResponsavelSearchTerm(`${usuario.nome} (${usuario.email})`);
    setShowResponsavelDropdown(false);
  };

  const limparResponsavel = () => {
    handleChange('responsavelId', '');
    setResponsavelSearchTerm('');
    setShowResponsavelDropdown(false);
  };

  const getResponsavelNome = (responsavelId: string): string => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    if (!usuario) return '';
    return `${usuario.nome} (${usuario.email})`;
  };

  // Funções para Anexos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(arquivo => {
      if (arquivo.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${arquivo.name} é muito grande (máx 10MB)`);
        return;
      }

      const novoAnexo: AnexoTicket = {
        id: `${Date.now()}-${Math.random()}`,
        nome: arquivo.name,
        arquivo,
        tamanho: arquivo.size,
        tipo: arquivo.type,
      };

      if (arquivo.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          novoAnexo.preview = event.target?.result as string;
          setAnexos(prev => [...prev, novoAnexo]);
        };
        reader.readAsDataURL(arquivo);
      } else {
        setAnexos(prev => [...prev, novoAnexo]);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerAnexo = (anexoId: string) => {
    setAnexos(prev => prev.filter(a => a.id !== anexoId));
  };

  const formatarTamanho = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIconeArquivo = (tipo: string) => {
    if (tipo.startsWith('image/')) return ImageIcon;
    if (tipo.includes('pdf')) return FileText;
    return File;
  };

  // Funções para Templates
  const aplicarTemplate = (template: TicketTemplate) => {
    setFormData(prev => ({
      ...prev,
      titulo: template.titulo,
      nivelAtendimentoId: template.nivelAtendimentoId,
      tipoServicoId: template.tipoServicoId,
      prioridade: template.prioridade,
      tagIds: template.tagIds,
      descricao: template.descricao,
    }));
    setShowTemplates(false);
    toast.success(`Template "${template.nome}" aplicado!`);
  };

  const salvarComoTemplate = () => {
    if (!templateNome.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    const novoTemplate: TicketTemplate = {
      id: `${Date.now()}`,
      nome: templateNome,
      titulo: formData.titulo,
      tipoServicoId: formData.tipoServicoId,
      nivelAtendimentoId: formData.nivelAtendimentoId,
      prioridade: formData.prioridade,
      tagIds: formData.tagIds,
      descricao: formData.descricao,
    };

    const novosTemplates = [...templates, novoTemplate];
    setTemplates(novosTemplates);
    localStorage.setItem('conectcrm-ticket-templates', JSON.stringify(novosTemplates));

    setShowSaveTemplate(false);
    setTemplateNome('');
    toast.success('Template salvo com sucesso!');
  };

  const excluirTemplate = (templateId: string) => {
    const novosTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(novosTemplates);
    localStorage.setItem('conectcrm-ticket-templates', JSON.stringify(novosTemplates));
    toast.success('Template excluído');
  };

  // Funções para Prazo Customizado
  const calcularDiasUteis = (dataFutura: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataFutura.setHours(0, 0, 0, 0);

    let dias = 0;
    const current = new Date(hoje);

    while (current <= dataFutura) {
      const diaSemana = current.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Não é sábado nem domingo
        dias++;
      }
      current.setDate(current.getDate() + 1);
    }

    return dias;
  };

  const selecionarPrazo = (data: string) => {
    handleChange('prazoCustomizado', data);
    setShowCalendario(false);

    const dataObj = new Date(data + 'T00:00:00');
    const diasUteis = calcularDiasUteis(dataObj);
    toast.success(`Prazo definido para ${new Date(data).toLocaleDateString('pt-BR')} (${diasUteis} dias úteis)`);
  };

  const limparPrazo = () => {
    handleChange('prazoCustomizado', undefined);
  };

  // Funções para Observadores
  const adicionarObservador = (usuario: User) => {
    if (formData.observadorIds.includes(usuario.id)) return;
    handleChange('observadorIds', [...formData.observadorIds, usuario.id]);
    setObservadoresSearch('');
  };

  const removerObservador = (usuarioId: string) => {
    handleChange('observadorIds', formData.observadorIds.filter(id => id !== usuarioId));
  };

  const getObservadorNome = (usuarioId: string): string => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario ? usuario.nome : 'Usuário';
  };

  // Função para Duplicar Ticket
  const duplicarTicket = () => {
    if (!ticket) return;

    setFormData({
      titulo: `[CÓPIA] ${ticket.titulo || ticket.assunto || ''}`,
      clienteId: ticket.clienteId || '',
      nivelAtendimentoId: (ticket as any).nivelAtendimentoId || '',
      statusCustomizadoId: '', // Reset status (novo ticket)
      tipoServicoId: (ticket as any).tipoServicoId || '',
      prioridade: (ticket.prioridade as any) || 'MEDIA',
      responsavelId: '', // Reset responsável
      tagIds: [], // Reset tags
      descricao: ticket.descricao || '',
      prazoCustomizado: undefined,
      observadorIds: [],
      notificarCliente: false,
      ticketsRelacionados: [],
    });

    // Limpar campos de busca
    setClienteSearchTerm(ticket.clienteId ? getClienteNome(ticket.clienteId) : '');
    setResponsavelSearchTerm('');
    setAnexos([]);

    toast.success('Ticket duplicado! Ajuste os campos e salve.');
  };

  // Função para Markdown Preview
  const renderMarkdown = (texto: string): string => {
    if (!texto) return '<p class="text-[#002333]/40 text-sm">Nenhum conteúdo para visualizar</p>';

    let html = texto
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-[#002333] mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-[#002333] mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-[#002333] mt-4 mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code inline
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-[#002333]">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#159A9C] hover:underline" target="_blank" rel="noopener">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return html;
  };

  // Função para Buscar Tickets (relacionamento)
  const buscarTickets = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setTicketsFiltrados([]);
      return;
    }

    try {
      const empresaId = localStorage.getItem('empresaAtiva') || '';
      // Buscar por número ou título
      const response = await ticketsService.listar({
        empresaId,
        busca: termo,
        limite: 10,
        pagina: 1,
      });

      // Filtrar ticket atual (não pode relacionar consigo mesmo)
      const ticketsValidos = response.data.filter((t: any) =>
        ticket ? t.id !== ticket.id : true
      );

      setTicketsFiltrados(ticketsValidos);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
      setTicketsFiltrados([]);
    }
  };

  // Debounce para busca de tickets
  useEffect(() => {
    const timer = setTimeout(() => {
      if (ticketSearch.trim()) {
        buscarTickets(ticketSearch);
      } else {
        setTicketsFiltrados([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [ticketSearch]);

  // Função para Adicionar Ticket Relacionado
  const adicionarTicketRelacionado = (ticketSelecionado: any) => {
    const jaExiste = formData.ticketsRelacionados.some(
      tr => tr.ticketId === ticketSelecionado.id
    );

    if (jaExiste) {
      toast.error('Este ticket já está relacionado');
      return;
    }

    const novoRelacionamento: TicketRelacionado = {
      ticketId: ticketSelecionado.id,
      tipo: tipoRelacao,
      ticketNumero: ticketSelecionado.numero,
      ticketTitulo: ticketSelecionado.titulo || ticketSelecionado.assunto,
    };

    handleChange('ticketsRelacionados', [...formData.ticketsRelacionados, novoRelacionamento]);
    setTicketSearch('');
    setShowRelacionamento(false);
    toast.success(`Ticket #${ticketSelecionado.numero} relacionado como ${tipoRelacao}`);
  };

  // Função para Remover Ticket Relacionado
  const removerTicketRelacionado = (ticketId: string) => {
    handleChange(
      'ticketsRelacionados',
      formData.ticketsRelacionados.filter(tr => tr.ticketId !== ticketId)
    );
  };

  // Função para Carregar Histórico
  const carregarHistorico = async () => {
    if (!ticket || mode !== 'edit') return;

    try {
      setLoadingHistorico(true);
      // TODO: Endpoint de histórico do backend
      // const response = await ticketsService.buscarHistorico(ticket.id);
      // setHistorico(response.data);

      // Simulação temporária
      const historicoMock: TicketHistorico[] = [
        {
          id: '1',
          campo: 'Status',
          valorAnterior: 'Novo',
          valorNovo: 'Em Atendimento',
          usuarioNome: 'Admin User',
          data: new Date().toISOString(),
        },
        {
          id: '2',
          campo: 'Responsável',
          valorAnterior: 'Não atribuído',
          valorNovo: 'João Silva',
          usuarioNome: 'Admin User',
          data: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setHistorico(historicoMock);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Carregar histórico quando abrir em modo edição
  useEffect(() => {
    if (isOpen && mode === 'edit' && ticket) {
      carregarHistorico();
    }
  }, [isOpen, mode, ticket]);

  // Fechar dropdown de relacionamento ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (relacionamentoRef.current && !relacionamentoRef.current.contains(event.target as Node)) {
        setShowRelacionamento(false);
      }
    };

    if (showRelacionamento) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRelacionamento]);

  // Fechar calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarioRef.current && !calendarioRef.current.contains(event.target as Node)) {
        setShowCalendario(false);
      }
    };

    if (showCalendario) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendario]);

  // Fechar dropdown de observadores ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (observadoresRef.current && !observadoresRef.current.contains(event.target as Node)) {
        setShowObservadores(false);
      }
    };

    if (showObservadores) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showObservadores]);

  // Fechar dropdown de cliente ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
    };

    if (showClienteDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showClienteDropdown]);

  // Fechar dropdown de responsável ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (responsavelDropdownRef.current && !responsavelDropdownRef.current.contains(event.target as Node)) {
        setShowResponsavelDropdown(false);
      }
    };

    if (showResponsavelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showResponsavelDropdown]);

  // Função para Criar Tag Rapidamente
  const criarTagRapida = async () => {
    if (!novaTagNome.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    try {
      setCriandoTag(true);

      const novaTag = await tagsService.criar({
        nome: novaTagNome.trim(),
        cor: novaTagCor,
        ativo: true,
      });

      // Atualizar lista de tags
      setTags(prev => [...prev, novaTag]);

      // Adicionar automaticamente ao ticket
      handleChange('tagIds', [...formData.tagIds, novaTag.id]);

      // Limpar form
      setNovaTagNome('');
      setNovaTagCor('#159A9C');
      setShowNovaTag(false);

      toast.success(`Tag "${novaTag.nome}" criada e adicionada!`);
    } catch (err) {
      console.error('Erro ao criar tag:', err);
      toast.error('Erro ao criar tag');
    } finally {
      setCriandoTag(false);
    }
  };

  const selecionarCliente = (cliente: Cliente) => {
    handleChange('clienteId', cliente.id);
    setClienteSearchTerm(`${cliente.nome} (${cliente.email || cliente.telefone || 'sem contato'})`);
    setShowClienteDropdown(false);
  };

  const limparCliente = () => {
    handleChange('clienteId', '');
    setClienteSearchTerm('');
    setShowClienteDropdown(false);
  };

  const getClienteNome = (clienteId: string): string => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return '';
    return `${cliente.nome} (${cliente.email || cliente.telefone || 'sem contato'})`;
  };

  const formatarSLA = (minutos: number): string => {
    if (minutos < 60) return `${minutos} minutos`;
    if (minutos < 1440) return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
    return `${Math.floor(minutos / 1440)} dias`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setSubmitError(null);

      const empresaId = localStorage.getItem('empresaAtiva') || '';

      // ✅ FASE 3d: Enviar FKs para o backend
      const payload = {
        titulo: formData.titulo,
        clienteId: formData.clienteId,
        nivelAtendimentoId: formData.nivelAtendimentoId,
        statusCustomizadoId: formData.statusCustomizadoId,
        tipoServicoId: formData.tipoServicoId,
        prioridade: formData.prioridade,
        responsavelId: formData.responsavelId,
        tagIds: formData.tagIds,
        descricao: formData.descricao,
        slaTargetMinutes: slaMinutes || undefined,
        tipo: 'suporte', // ✅ FASE 4 - Enum em minúsculas
        prazoCustomizado: formData.prazoCustomizado,
        observadorIds: formData.observadorIds,
        notificarCliente: formData.notificarCliente,
        ticketsRelacionados: formData.ticketsRelacionados,
      };

      if (mode === 'edit' && ticket) {
        await ticketsService.atualizar(ticket.id, empresaId, payload);
        if (formData.notificarCliente) {
          toast.success('Ticket atualizado e cliente notificado!');
        } else {
          toast.success('Ticket atualizado com sucesso!');
        }
      } else {
        await ticketsService.criar(empresaId, payload);
        if (formData.notificarCliente) {
          toast.success('Ticket criado e cliente notificado!');
        } else {
          toast.success('Ticket criado com sucesso!');
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar ticket:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao salvar ticket';
      setSubmitError(errorMsg);
      toast.error(`Erro: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#002333]">
              {mode === 'edit' ? `Editar Ticket #${ticket?.numero}` : 'Criar Novo Ticket'}
            </h2>
            <button onClick={onClose} disabled={loading} className="p-2 text-[#002333]/60 hover:text-[#002333] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Botões de Template */}
          <div className="flex items-center gap-2">
            {/* Botão Duplicar (só em modo edição) */}
            {mode === 'edit' && (
              <button
                type="button"
                onClick={duplicarTicket}
                disabled={loading}
                className="px-3 py-1.5 bg-white border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Duplicar Ticket
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-3 py-1.5 bg-white border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <BookTemplate className="h-4 w-4" />
                Usar Template
                {templates.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#159A9C] text-white text-xs rounded-full">{templates.length}</span>
                )}
              </button>

              {/* Dropdown de Templates */}
              {showTemplates && (
                <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-[#B4BEC9] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#002333]/60">
                      Nenhum template salvo ainda.
                    </div>
                  ) : (
                    <ul className="py-1">
                      {templates.map((template) => (
                        <li key={template.id} className="border-b border-[#B4BEC9] last:border-b-0">
                          <div className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => aplicarTemplate(template)}
                                className="flex-1 text-left"
                              >
                                <p className="text-sm font-medium text-[#002333]">{template.nome}</p>
                                <p className="text-xs text-[#002333]/60 truncate mt-1">{template.titulo}</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => excluirTemplate(template.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSaveTemplate(true)}
              className="px-3 py-1.5 bg-white border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Salvar como Template
            </button>
          </div>

          {/* Modal de Salvar Template */}
          {showSaveTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-[#002333] mb-4">Salvar como Template</h3>
                <input
                  type="text"
                  value={templateNome}
                  onChange={(e) => setTemplateNome(e.target.value)}
                  placeholder="Nome do template (ex: Bug Crítico)"
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] mb-4"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplate(false);
                      setTemplateNome('');
                    }}
                    className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarComoTemplate}
                    disabled={!templateNome.trim()}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Salvar Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loadingData && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C]"></div>
              <p className="mt-2 text-sm text-[#002333]/60">Carregando dados...</p>
            </div>
          )}

          {!loadingData && (
            <>
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Erro ao salvar</p>
                    <p className="text-sm text-red-700 mt-1">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Seção 1: Informações Básicas */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEEFE7]">
                  <div className="h-8 w-1 bg-[#159A9C] rounded-full"></div>
                  <h3 className="text-lg font-semibold text-[#002333]">Informações Básicas</h3>
                </div>

                {/* 1. Título */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => handleChange('titulo', e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, titulo: true }))}
                      disabled={loading}
                      maxLength={100}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.titulo && touched.titulo ? 'border-red-500' :
                        getFieldStatus('titulo') === 'valid' ? 'border-green-500' :
                          'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="Ex: Erro no módulo de vendas"
                    />
                    {touched.titulo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getFieldStatus('titulo') === 'valid' && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        {getFieldStatus('titulo') === 'invalid' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {errors.titulo && touched.titulo && (
                        <p className="text-sm text-red-600">{errors.titulo}</p>
                      )}
                    </div>
                    <p className={`text-xs ${formData.titulo.length > 90 ? 'text-red-600 font-medium' : 'text-[#002333]/60'
                      }`}>
                      {formData.titulo.length}/100
                    </p>
                  </div>
                </div>

                {/* 2. Cliente - COM BUSCA EM TEMPO REAL */}
                <div ref={clienteDropdownRef} className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-[#002333]">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                      <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Busque por nome, email ou telefone. Digite para filtrar os resultados.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                    <input
                      type="text"
                      value={clienteSearchTerm}
                      onChange={(e) => {
                        setClienteSearchTerm(e.target.value);
                        setShowClienteDropdown(true);
                        if (!e.target.value.trim()) {
                          handleChange('clienteId', '');
                        }
                      }}
                      onFocus={() => setShowClienteDropdown(true)}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.clienteId ? 'border-red-500' : 'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      placeholder="Buscar cliente por nome, email ou telefone..."
                    />
                    {formData.clienteId && (
                      <button
                        type="button"
                        onClick={limparCliente}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#002333]/40 hover:text-[#002333] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {!formData.clienteId && (
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                    )}
                  </div>

                  {/* Dropdown de resultados */}
                  {showClienteDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-[#B4BEC9] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {clientesFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-[#002333]/60 text-sm">
                          {clienteSearchTerm.trim() ? 'Nenhum cliente encontrado' : 'Digite para buscar...'}
                        </div>
                      ) : (
                        <ul className="py-1">
                          {clientesFiltrados.map((cliente) => (
                            <li key={cliente.id}>
                              <button
                                type="button"
                                onClick={() => selecionarCliente(cliente)}
                                className={`w-full px-4 py-2.5 text-left hover:bg-[#159A9C]/10 transition-colors ${formData.clienteId === cliente.id ? 'bg-[#159A9C]/5' : ''
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#002333] truncate">
                                      {cliente.nome}
                                    </p>
                                    {(cliente.email || cliente.telefone) && (
                                      <p className="text-xs text-[#002333]/60 truncate">
                                        {cliente.email || cliente.telefone}
                                      </p>
                                    )}
                                  </div>
                                  {formData.clienteId === cliente.id && (
                                    <Check className="h-4 w-4 text-[#159A9C] flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {errors.clienteId && <p className="mt-1 text-sm text-red-600">{errors.clienteId}</p>}
                </div>
              </div>

              {/* Seção 2: Classificação e Atendimento */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEEFE7]">
                  <div className="h-8 w-1 bg-[#159A9C] rounded-full"></div>
                  <h3 className="text-lg font-semibold text-[#002333]">Classificação e Atendimento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 3. Nível - DINÂMICO */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-[#002333]">
                        Nível de Atendimento <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                        <div className="absolute left-0 top-6 w-72 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          O nível determina quem pode atender este ticket. N1 = primeira linha, N2 = especializado, N3 = crítico/complexo. Também afeta o tempo de SLA.
                        </div>
                      </div>
                    </div>
                    <select
                      value={formData.nivelAtendimentoId}
                      onChange={(e) => handleChange('nivelAtendimentoId', e.target.value)}
                      disabled={loading}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.nivelAtendimentoId ? 'border-red-500' : 'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">Selecione um nível</option>
                      {niveis.map(nivel => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.codigo} - {nivel.nome}
                        </option>
                      ))}
                    </select>
                    {errors.nivelAtendimentoId && <p className="mt-1 text-sm text-red-600">{errors.nivelAtendimentoId}</p>}
                  </div>

                  {/* 4. Status - DINÂMICO (carrega com base no nível) */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-[#002333]">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                        <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          Os status disponíveis dependem do nível selecionado. Cada nível pode ter status customizados.
                        </div>
                      </div>
                    </div>
                    <select
                      value={formData.statusCustomizadoId}
                      onChange={(e) => handleChange('statusCustomizadoId', e.target.value)}
                      disabled={loading || loadingStatus || !formData.nivelAtendimentoId}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.statusCustomizadoId ? 'border-red-500' : 'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {loadingStatus ? 'Carregando status...' :
                          !formData.nivelAtendimentoId ? 'Selecione um nível primeiro' :
                            'Selecione um status'}
                      </option>
                      {statusDisponiveis.map(status => (
                        <option key={status.id} value={status.id}>
                          {status.nome}
                        </option>
                      ))}
                    </select>
                    {errors.statusCustomizadoId && <p className="mt-1 text-sm text-red-600">{errors.statusCustomizadoId}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 5. Tipo de Serviço - DINÂMICO */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-[#002333]">
                        Tipo de Serviço <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                        <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          Categoriza o tipo de atendimento (Suporte, Técnica, Comercial, etc). Ajuda na organização e métricas.
                        </div>
                      </div>
                    </div>
                    <select
                      value={formData.tipoServicoId}
                      onChange={(e) => handleChange('tipoServicoId', e.target.value)}
                      disabled={loading}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.tipoServicoId ? 'border-red-500' : 'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="">Selecione um tipo</option>
                      {Array.isArray(tipos) && tipos.length > 0 ? (
                        tipos.map(tipo => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nome}
                          </option>
                        ))
                      ) : (
                        <option disabled>Carregando tipos...</option>
                      )}
                    </select>
                    {errors.tipoServicoId && <p className="mt-1 text-sm text-red-600">{errors.tipoServicoId}</p>}
                  </div>

                  {/* 6. Urgência */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Urgência <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.prioridade}
                      onChange={(e) => handleChange('prioridade', e.target.value)}
                      disabled={loading}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.prioridade ? 'border-red-500' : 'border-[#B4BEC9]'
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    >
                      <option value="BAIXA">🟢 Baixa</option>
                      <option value="MEDIA">🟡 Média</option>
                      <option value="ALTA">🟠 Alta</option>
                      <option value="URGENTE">🔴 Urgente</option>
                    </select>
                    {errors.prioridade && <p className="mt-1 text-sm text-red-600">{errors.prioridade}</p>}
                  </div>
                </div>
              </div>

              {/* Seção 3: Responsabilidade e SLA */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEEFE7]">
                  <div className="h-8 w-1 bg-[#159A9C] rounded-full"></div>
                  <h3 className="text-lg font-semibold text-[#002333]">Responsabilidade e SLA</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 7. Responsável - AUTOCOMPLETE */}
                  <div ref={responsavelDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Responsável <span className="text-red-500">*</span>
                    </label>

                    {/* Campo de busca com preview */}
                    <div className="relative">
                      <input
                        type="text"
                        value={responsavelSearchTerm}
                        onChange={(e) => setResponsavelSearchTerm(e.target.value)}
                        onFocus={() => setShowResponsavelDropdown(true)}
                        placeholder="Digite para buscar responsável..."
                        disabled={loading}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors ${errors.responsavelId ? 'border-red-500' : 'border-[#B4BEC9]'
                          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                      {formData.responsavelId && (
                        <button
                          type="button"
                          onClick={limparResponsavel}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#002333]/40 hover:text-red-600 transition-colors"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                      {!formData.responsavelId && (
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                      )}
                    </div>

                    {/* Dropdown de resultados */}
                    {showResponsavelDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-[#B4BEC9] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {usuariosFiltrados.length === 0 ? (
                          <div className="p-4 text-center text-[#002333]/60 text-sm">
                            {responsavelSearchTerm.trim() ? 'Nenhum responsável encontrado' : 'Digite para buscar...'}
                          </div>
                        ) : (
                          <ul className="py-1">
                            {usuariosFiltrados.map((usuario) => (
                              <li key={usuario.id}>
                                <button
                                  type="button"
                                  onClick={() => selecionarResponsavel(usuario)}
                                  className={`w-full px-4 py-2.5 text-left hover:bg-[#159A9C]/10 transition-colors ${formData.responsavelId === usuario.id ? 'bg-[#159A9C]/5' : ''
                                    }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#002333] truncate">
                                        {usuario.nome}
                                      </p>
                                      {usuario.email && (
                                        <p className="text-xs text-[#002333]/60 truncate">
                                          {usuario.email}
                                        </p>
                                      )}
                                    </div>
                                    {formData.responsavelId === usuario.id && (
                                      <Check className="h-4 w-4 text-[#159A9C] flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {errors.responsavelId && <p className="mt-1 text-sm text-red-600">{errors.responsavelId}</p>}
                  </div>

                  {/* 8. Tempo SLA */}
                  {slaMinutes && (
                    <div className="bg-white border border-[#DEEFE7] rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#159A9C]/10 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-[#159A9C]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-[#002333]/60 uppercase tracking-wide mb-1">Tempo SLA</p>
                          <p className="text-xl font-bold text-[#002333]">
                            {formatarSLA(slaMinutes)}
                          </p>
                          <p className="text-xs text-[#002333]/70 mt-1">
                            {niveis.find(n => n.id === formData.nivelAtendimentoId)?.codigo} · {formData.prioridade}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 9. Prazo Personalizado (opcional) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-[#002333]">
                      Prazo Personalizado (opcional)
                    </label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                      <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Defina um prazo customizado para este ticket (além do SLA padrão). O sistema calcula apenas dias úteis.
                      </div>
                    </div>
                  </div>

                  <div ref={calendarioRef} className="relative">
                    {!formData.prazoCustomizado ? (
                      <button
                        type="button"
                        onClick={() => setShowCalendario(true)}
                        className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg hover:border-[#159A9C] text-left flex items-center gap-2 text-[#002333]/60 transition-colors"
                      >
                        <Calendar className="h-5 w-5" />
                        <span>Selecionar prazo</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-2 border border-[#159A9C] bg-[#159A9C]/5 rounded-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#159A9C]" />
                          <span className="text-sm font-medium text-[#002333]">
                            {new Date(formData.prazoCustomizado + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-[#002333]/60 ml-auto">
                            ({calcularDiasUteis(new Date(formData.prazoCustomizado + 'T00:00:00'))} dias úteis)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={limparPrazo}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {showCalendario && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-[#DEEFE7] rounded-lg shadow-lg p-4 z-20 min-w-[300px]">
                        <p className="text-xs font-medium text-[#002333]/60 uppercase tracking-wide mb-2">
                          Selecionar Data
                        </p>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => selecionarPrazo(e.target.value)}
                          className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Aviso se prazo < SLA */}
                  {formData.prazoCustomizado && slaMinutes && (
                    (() => {
                      const prazoData = new Date(formData.prazoCustomizado + 'T00:00:00');
                      const hoje = new Date();
                      const diffMs = prazoData.getTime() - hoje.getTime();
                      const diffMinutos = Math.floor(diffMs / (1000 * 60));

                      if (diffMinutos < slaMinutes) {
                        return (
                          <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 text-sm">
                              <p className="font-medium text-yellow-900">Atenção: Prazo menor que SLA</p>
                              <p className="text-yellow-700 mt-1">
                                O prazo personalizado ({calcularDiasUteis(prazoData)} dias úteis) é menor que o SLA padrão ({formatarSLA(slaMinutes)}).
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>

                {/* 10. Observadores (opcional) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-[#002333]">
                      Observadores (opcional)
                    </label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                      <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Observadores receberão notificações sobre este ticket, mas não serão responsáveis pelo atendimento.
                      </div>
                    </div>
                  </div>

                  {/* Badges dos observadores selecionados */}
                  {formData.observadorIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.observadorIds.map((obsId) => (
                        <div
                          key={obsId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#159A9C]/10 border border-[#159A9C]/30 rounded-full"
                        >
                          <span className="text-sm font-medium text-[#002333]">
                            {getObservadorNome(obsId)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerObservador(obsId)}
                            className="text-[#159A9C] hover:text-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Campo de busca */}
                  <div ref={observadoresRef} className="relative">
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#002333]/40" />
                      <input
                        type="text"
                        value={observadoresSearch}
                        onChange={(e) => {
                          setObservadoresSearch(e.target.value);
                          setShowObservadores(true);
                        }}
                        onFocus={() => setShowObservadores(true)}
                        placeholder="Buscar usuário por nome ou email..."
                        className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                      />
                    </div>

                    {/* Dropdown de resultados */}
                    {showObservadores && observadoresFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DEEFE7] rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                        {observadoresFiltrados.map((usuario) => (
                          <button
                            key={usuario.id}
                            type="button"
                            onClick={() => adicionarObservador(usuario)}
                            className="w-full px-4 py-3 text-left hover:bg-[#159A9C]/5 transition-colors border-b border-[#DEEFE7] last:border-0"
                          >
                            <p className="text-sm font-medium text-[#002333]">{usuario.nome}</p>
                            {usuario.email && (
                              <p className="text-xs text-[#002333]/60 mt-0.5">{usuario.email}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {showObservadores && observadoresFiltrados.length === 0 && observadoresSearch.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DEEFE7] rounded-lg shadow-lg p-4 z-20">
                        <p className="text-sm text-[#002333]/60 text-center">Nenhum usuário encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 4: Detalhes e Observações */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEEFE7]">
                  <div className="h-8 w-1 bg-[#159A9C] rounded-full"></div>
                  <h3 className="text-lg font-semibold text-[#002333]">Detalhes e Observações</h3>
                </div>

                {/* 9. Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#002333]">Tags (opcional)</label>
                    <button
                      type="button"
                      onClick={() => setShowNovaTag(!showNovaTag)}
                      className="px-2 py-1 text-xs font-medium text-[#159A9C] hover:bg-[#159A9C]/10 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Nova Tag
                    </button>
                  </div>

                  {/* Form de criação rápida */}
                  {showNovaTag && (
                    <div className="mb-3 p-3 bg-[#159A9C]/5 border border-[#159A9C]/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#002333] mb-1">Nome da Tag</label>
                          <input
                            type="text"
                            value={novaTagNome}
                            onChange={(e) => setNovaTagNome(e.target.value)}
                            placeholder="Ex: Urgente, Bug, Feature..."
                            className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                            disabled={criandoTag}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#002333] mb-1">Cor</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={novaTagCor}
                              onChange={(e) => setNovaTagCor(e.target.value)}
                              className="h-10 w-16 border border-[#B4BEC9] rounded cursor-pointer"
                              disabled={criandoTag}
                            />
                            <span className="text-xs text-[#002333]/60">{novaTagCor}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={criarTagRapida}
                          disabled={criandoTag || !novaTagNome.trim()}
                          className="px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {criandoTag ? 'Criando...' : 'Criar e Adicionar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNovaTag(false);
                            setNovaTagNome('');
                            setNovaTagCor('#159A9C');
                          }}
                          className="px-3 py-1.5 bg-white border border-[#B4BEC9] text-[#002333] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          disabled={criandoTag}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(tags) && tags.length === 0 && !showNovaTag && (
                      <p className="text-sm text-[#002333]/60">Nenhuma tag disponível. Crie uma nova acima.</p>
                    )}
                    {Array.isArray(tags) && tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${formData.tagIds.includes(tag.id) ? 'bg-[#159A9C] text-white' : 'bg-gray-100 text-[#002333] hover:bg-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={formData.tagIds.includes(tag.id) ? { backgroundColor: tag.cor } : {}}
                      >
                        {tag.nome}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10. Anexos */}
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Anexos (opcional)
                  </label>
                  <div className="border-2 border-dashed border-[#B4BEC9] rounded-lg p-4 hover:border-[#159A9C] transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="w-full flex flex-col items-center gap-2 py-3 text-[#002333]/60 hover:text-[#159A9C] transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-8 w-8" />
                      <span className="text-sm font-medium">Clique para selecionar arquivos</span>
                      <span className="text-xs">ou arraste e solte aqui</span>
                      <span className="text-xs text-[#002333]/40">Máx 10MB por arquivo</span>
                    </button>
                  </div>

                  {/* Lista de anexos */}
                  {anexos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {anexos.map((anexo) => {
                        const IconeArquivo = getIconeArquivo(anexo.tipo);
                        return (
                          <div key={anexo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-[#B4BEC9]">
                            {anexo.preview ? (
                              <img src={anexo.preview} alt={anexo.nome} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-[#159A9C]/10 rounded flex items-center justify-center flex-shrink-0">
                                <IconeArquivo className="h-5 w-5 text-[#159A9C]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#002333] truncate">{anexo.nome}</p>
                              <p className="text-xs text-[#002333]/60">{formatarTamanho(anexo.tamanho)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removerAnexo(anexo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 11. Descrição */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#002333]">
                      Descrição <span className="text-red-500">*</span>
                    </label>
                    {/* Toggle Escrever/Visualizar */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setModoDescricao('escrever')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${modoDescricao === 'escrever'
                          ? 'bg-white text-[#159A9C] shadow-sm'
                          : 'text-[#002333]/60 hover:text-[#002333]'
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Escrever
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoDescricao('visualizar')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${modoDescricao === 'visualizar'
                          ? 'bg-white text-[#159A9C] shadow-sm'
                          : 'text-[#002333]/60 hover:text-[#002333]'
                          }`}
                      >
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Visualizar
                        </span>
                      </button>
                    </div>
                  </div>

                  {modoDescricao === 'escrever' ? (
                    <>
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, descricao: true }))}
                        disabled={loading}
                        rows={6}
                        maxLength={2000}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] transition-colors font-mono text-sm ${errors.descricao && touched.descricao ? 'border-red-500' :
                          getFieldStatus('descricao') === 'valid' ? 'border-green-500' :
                            'border-[#B4BEC9]'
                          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        placeholder="Descreva o problema, solicitação ou demanda em detalhes...&#10;&#10;Dica: Use Markdown!&#10;# Título Grande&#10;## Subtítulo&#10;**Negrito** *Itálico*&#10;`código`&#10;[Link](url)"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          {errors.descricao && touched.descricao && (
                            <p className="text-sm text-red-600">{errors.descricao}</p>
                          )}
                          <p className="text-xs text-[#002333]/40">Suporta Markdown</p>
                        </div>
                        <p className={`text-xs ${formData.descricao.length > 1900 ? 'text-red-600 font-medium' : 'text-[#002333]/60'}`}>
                          {formData.descricao.length}/2000
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="min-h-[150px] px-4 py-3 border border-[#B4BEC9] rounded-lg bg-gray-50">
                      <div
                        className="prose prose-sm max-w-none text-[#002333]"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.descricao) }}
                      />
                    </div>
                  )}
                </div>

                {/* 12. Notificar Cliente */}
                <div className="flex items-center gap-3 p-4 bg-[#159A9C]/5 border border-[#159A9C]/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="notificarCliente"
                    checked={formData.notificarCliente}
                    onChange={(e) => handleChange('notificarCliente', e.target.checked)}
                    className="h-4 w-4 text-[#159A9C] rounded border-[#B4BEC9] focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <label htmlFor="notificarCliente" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Bell className="h-4 w-4 text-[#159A9C]" />
                    <span className="text-sm font-medium text-[#002333]">
                      Notificar cliente por email sobre este ticket
                    </span>
                  </label>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                    <div className="absolute right-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      O cliente receberá um email com os detalhes do ticket (título, descrição, prazo, etc).
                    </div>
                  </div>
                </div>

                {/* 13. Relacionamento de Tickets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-[#002333]">
                      Tickets Relacionados (opcional)
                    </label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-[#002333]/40 cursor-help" />
                      <div className="absolute left-0 top-6 w-64 p-2 bg-[#002333] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Vincule tickets relacionados, duplicados ou que bloqueiam este ticket.
                      </div>
                    </div>
                  </div>

                  {/* Badges dos tickets relacionados */}
                  {formData.ticketsRelacionados.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.ticketsRelacionados.map((rel) => (
                        <div
                          key={rel.ticketId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DEEFE7] rounded-lg shadow-sm"
                        >
                          <GitBranch className="h-4 w-4 text-[#159A9C]" />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-[#002333]">
                              #{rel.ticketNumero} - {rel.tipo}
                            </span>
                            <span className="text-xs text-[#002333]/60 truncate max-w-[200px]">
                              {rel.ticketTitulo}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerTicketRelacionado(rel.ticketId)}
                            className="text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form de adicionar relacionamento */}
                  <div ref={relacionamentoRef} className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Tipo de relação */}
                      <div>
                        <select
                          value={tipoRelacao}
                          onChange={(e) => setTipoRelacao(e.target.value as any)}
                          className="w-full px-3 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        >
                          <option value="relacionado">Relacionado</option>
                          <option value="duplicado">Duplicado de</option>
                          <option value="bloqueado">Bloqueado por</option>
                        </select>
                      </div>

                      {/* Busca de ticket */}
                      <div className="md:col-span-2 relative">
                        <div className="relative">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#002333]/40" />
                          <input
                            type="text"
                            value={ticketSearch}
                            onChange={(e) => {
                              setTicketSearch(e.target.value);
                              setShowRelacionamento(true);
                            }}
                            onFocus={() => setShowRelacionamento(true)}
                            placeholder="Buscar ticket por número ou título..."
                            className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                          />
                        </div>

                        {/* Dropdown de resultados */}
                        {showRelacionamento && ticketsFiltrados.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DEEFE7] rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                            {ticketsFiltrados.map((t: any) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => adicionarTicketRelacionado(t)}
                                className="w-full px-4 py-3 text-left hover:bg-[#159A9C]/5 transition-colors border-b border-[#DEEFE7] last:border-0"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-[#159A9C]/10 text-[#159A9C] rounded text-xs font-medium">
                                    #{t.numero}
                                  </span>
                                  <p className="text-sm font-medium text-[#002333] truncate flex-1">
                                    {t.titulo || t.assunto}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {showRelacionamento && ticketsFiltrados.length === 0 && ticketSearch.trim() && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DEEFE7] rounded-lg shadow-lg p-4 z-20">
                            <p className="text-sm text-[#002333]/60 text-center">Nenhum ticket encontrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 14. Botão Histórico (apenas em modo edição) */}
                {mode === 'edit' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHistorico(!showHistorico)}
                      className="w-full px-4 py-3 bg-white border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <History className="h-4 w-4 text-[#159A9C]" />
                        <span className="text-[#002333]">Histórico de Alterações</span>
                      </span>
                      <ChevronDown className={`h-4 w-4 text-[#002333]/60 transition-transform ${showHistorico ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Timeline de histórico */}
                    {showHistorico && (
                      <div className="mt-3 p-4 bg-gray-50 border border-[#DEEFE7] rounded-lg">
                        {loadingHistorico ? (
                          <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#159A9C]"></div>
                            <p className="mt-2 text-xs text-[#002333]/60">Carregando histórico...</p>
                          </div>
                        ) : historico.length === 0 ? (
                          <p className="text-sm text-[#002333]/60 text-center py-4">
                            Nenhuma alteração registrada ainda.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {historico.map((item, index) => (
                              <div key={item.id} className="relative pl-6">
                                {/* Linha vertical */}
                                {index !== historico.length - 1 && (
                                  <div className="absolute left-2 top-6 bottom-0 w-px bg-[#DEEFE7]"></div>
                                )}

                                {/* Bolinha */}
                                <div className="absolute left-0 top-1 w-4 h-4 bg-[#159A9C] rounded-full border-2 border-white"></div>

                                {/* Conteúdo */}
                                <div className="bg-white rounded-lg p-3 border border-[#DEEFE7]">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-xs font-medium text-[#002333]">{item.campo}</p>
                                    <p className="text-xs text-[#002333]/60">
                                      {new Date(item.data).toLocaleString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-red-600 line-through">{item.valorAnterior}</span>
                                    <span className="text-[#002333]/40">→</span>
                                    <span className="text-green-600 font-medium">{item.valorNovo}</span>
                                  </div>
                                  <p className="text-xs text-[#002333]/60 mt-1">
                                    por {item.usuarioNome}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-xs text-[#002333]/60">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-[#B4BEC9] rounded text-xs">Esc</kbd>
                    <span>Fechar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-[#B4BEC9] rounded text-xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-[#B4BEC9] rounded text-xs">Enter</kbd>
                    <span>Salvar</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Ticket'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
