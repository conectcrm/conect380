import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  CheckCircle,
  Clock,
  Edit2,
  FileText,
  Mail,
  MessageSquare,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { EmptyState, FiltersBar, PageHeader, SectionCard } from '../components/layout-v2';
import {
  CreateInteracaoDto,
  interacoesService,
  Interacao,
  InteracaoFiltro,
  TipoInteracao,
  InteracoesEstatisticas,
  AgendaEventoPayload,
} from '../services/interacoesService';
import { getErrorMessage } from '../utils/errorHandling';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';

const tipoLabels: Record<string, { label: string; icon: JSX.Element }> = {
  [TipoInteracao.CHAMADA]: {
    label: 'Chamada',
    icon: <PhoneCall className="h-5 w-5 text-[#159A9C]" />,
  },
  [TipoInteracao.EMAIL]: {
    label: 'E-mail',
    icon: <Mail className="h-5 w-5 text-[#159A9C]" />,
  },
  [TipoInteracao.REUNIAO]: {
    label: 'Reunião',
    icon: <FileText className="h-5 w-5 text-[#159A9C]" />,
  },
  [TipoInteracao.NOTA]: {
    label: 'Nota',
    icon: <FileText className="h-5 w-5 text-[#159A9C]" />,
  },
  [TipoInteracao.OUTRO]: {
    label: 'Outro',
    icon: <Activity className="h-5 w-5 text-[#159A9C]" />,
  },
};

const tipoOptions = Object.keys(tipoLabels) as Array<TipoInteracao>;

const badgeClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

const InteracoesPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const [filtros, setFiltros] = useState<InteracaoFiltro>({ page: 1, limit: 10 });
  const [lista, setLista] = useState<Interacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<InteracoesEstatisticas | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Interacao | null>(null);
  const [createAgenda, setCreateAgenda] = useState(false);
  const [agendaForm, setAgendaForm] = useState<AgendaEventoPayload>({
    titulo: '',
    descricao: '',
    inicio: new Date().toISOString().slice(0, 16),
    fim: '',
    all_day: false,
    prioridade: 'media',
    status: 'confirmado',
    local: '',
    color: '',
  });
  const [form, setForm] = useState<CreateInteracaoDto>({
    tipo: TipoInteracao.NOTA,
    titulo: '',
    descricao: '',
    data_referencia: new Date().toISOString().slice(0, 16),
    proxima_acao_em: undefined,
    proxima_acao_descricao: '',
    agenda_event_id: '',
    lead_id: '',
    contato_id: '',
    responsavel_id: '',
  });

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.page, filtros.limit, filtros.tipo, filtros.busca]);

  const carregarTudo = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listaResp, statsResp] = await Promise.all([
        interacoesService.listar(filtros),
        interacoesService.obterEstatisticas(),
      ]);

      const items = (listaResp as any).items ?? (listaResp as any).data ?? [];
      setLista(items);
      setTotal(listaResp.total || 0);
      setTotalPages(listaResp.totalPages || 1);
      setEstatisticas(statsResp);
    } catch (err: unknown) {
      console.error('Erro ao carregar interações:', err);
      setError(getErrorMessage(err, 'carregar interações'));
      setLista([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: Interacao) => {
    if (item) {
      setEditing(item);
      setCreateAgenda(false);
      setAgendaForm({
        titulo: item.titulo || '',
        descricao: '',
        inicio: item.data_referencia?.slice(0, 16) || new Date().toISOString().slice(0, 16),
        fim: item.proxima_acao_em?.slice(0, 16) || '',
        all_day: false,
        prioridade: 'media',
        status: 'confirmado',
        local: '',
        color: '',
      });
      setForm({
        tipo: item.tipo as TipoInteracao,
        titulo: item.titulo ?? '',
        descricao: item.descricao ?? '',
        data_referencia: item.data_referencia?.slice(0, 16),
        proxima_acao_em: item.proxima_acao_em?.slice(0, 16),
        proxima_acao_descricao: item.proxima_acao_descricao ?? '',
        agenda_event_id: item.agenda_event_id ?? '',
        lead_id: item.lead_id ?? '',
        contato_id: item.contato_id ?? '',
        responsavel_id: item.responsavel_id ?? '',
      });
    } else {
      setEditing(null);
      setCreateAgenda(false);
      setAgendaForm({
        titulo: '',
        descricao: '',
        inicio: new Date().toISOString().slice(0, 16),
        fim: '',
        all_day: false,
        prioridade: 'media',
        status: 'confirmado',
        local: '',
        color: '',
      });
      setForm({
        tipo: TipoInteracao.NOTA,
        titulo: '',
        descricao: '',
        data_referencia: new Date().toISOString().slice(0, 16),
        proxima_acao_em: '',
        proxima_acao_descricao: '',
        agenda_event_id: '',
        lead_id: '',
        contato_id: '',
        responsavel_id: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: CreateInteracaoDto = { ...form };
      if (createAgenda) {
        payload.agenda_evento = {
          ...agendaForm,
          titulo: agendaForm.titulo || form.titulo || 'Interação',
        } as AgendaEventoPayload;
      } else {
        delete payload.agenda_evento;
      }

      if (editing) {
        await interacoesService.atualizar(editing.id, payload);
      } else {
        await interacoesService.criar(payload);
      }
      setShowDialog(false);
      setEditing(null);
      await carregarTudo();
    } catch (err: unknown) {
      console.error('Erro ao salvar interação:', err);
      setError(getErrorMessage(err, 'salvar interação'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Deseja realmente excluir esta interação?'))) return;
    try {
      setSaving(true);
      setError(null);
      await interacoesService.remover(id);
      await carregarTudo();
    } catch (err: unknown) {
      console.error('Erro ao excluir interação:', err);
      setError(getErrorMessage(err, 'excluir interação'));
    } finally {
      setSaving(false);
    }
  };

  const statsCards = useMemo(() => {
    const totalInteracoes = estatisticas?.total ?? 0;
    const porTipo = estatisticas?.porTipo || [];
    const mapQuantidades: Record<string, number> = porTipo.reduce((acc, cur) => {
      acc[cur.tipo] = cur.quantidade;
      return acc;
    }, {} as Record<string, number>);

    const cardBase = (
      key: string,
      titulo: string,
      valor: number | string,
      descricao: string,
      icon: JSX.Element,
    ) => (
      <div
        key={key}
        className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm text-[#002333] bg-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
              {titulo}
            </p>
            <p className="mt-2 text-3xl font-bold text-[#002333]">{valor}</p>
            <p className="mt-3 text-sm text-[#002333]/70">{descricao}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
            {icon}
          </div>
        </div>
      </div>
    );

    return [
      cardBase('total', 'Interações', totalInteracoes, 'Total registradas', <MessageSquare className="h-6 w-6 text-[#159A9C]" />),
      cardBase(
        'chamadas',
        'Chamadas',
        mapQuantidades[TipoInteracao.CHAMADA] || 0,
        'Interações por chamada',
        <PhoneCall className="h-6 w-6 text-[#159A9C]" />,
      ),
      cardBase(
        'emails',
        'E-mails',
        mapQuantidades[TipoInteracao.EMAIL] || 0,
        'Interações por e-mail',
        <Mail className="h-6 w-6 text-[#159A9C]" />,
      ),
      cardBase(
        'reunioes',
        'Reuniões',
        mapQuantidades[TipoInteracao.REUNIAO] || 0,
        'Interações por reunião',
        <FileText className="h-6 w-6 text-[#159A9C]" />,
      ),
    ];
  }, [estatisticas]);

  const renderBadge = (tipo: string) => {
    const info = tipoLabels[tipo] || { label: tipo, icon: null };
    const color = '#159A9C';
    return (
      <span
        className={`${badgeClass} flex items-center gap-1`}
        style={{ backgroundColor: 'rgba(21, 154, 156, 0.12)', color }}
      >
        {info.icon}
        {info.label}
      </span>
    );
  };

  const renderCard = (item: Interacao) => (
    <div key={item.id} className="bg-white rounded-xl border border-[#DEEFE7] shadow-sm p-5 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-[#159A9C]/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-[#159A9C]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-[#002333]">{item.titulo || 'Sem título'}</h3>
              {renderBadge(item.tipo)}
            </div>
            <p className="mt-1 text-sm text-[#002333]/70 line-clamp-2">{item.descricao || 'Sem descrição'}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#002333]/70">
              {item.data_referencia && (
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(item.data_referencia).toLocaleString('pt-BR')}
                </span>
              )}
              {item.proxima_acao_em && (
                <span className="inline-flex items-center gap-1 text-[#159A9C]">
                  <Clock className="h-4 w-4" />
                  Próxima ação: {new Date(item.proxima_acao_em).toLocaleString('pt-BR')}
                </span>
              )}
              {item.responsavel && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {item.responsavel.nome || item.responsavel.username || 'Responsável'}
                </span>
              )}
              {item.agenda_event_id && (
                <a
                  href="/agenda"
                  className="inline-flex items-center gap-1 text-[#159A9C] hover:underline"
                  title="Abrir Agenda"
                >
                  <CalendarClock className="h-4 w-4" />
                  Ver na Agenda
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpen(item)}
            className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
            disabled={saving}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#159A9C]" />
              <span>Interações</span>
            </span>
          }
          description="Registro unificado de chamadas, e-mails, reuniões e notas de CRM"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={carregarTudo}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg border border-[#D4E2E7] bg-white p-2 text-[#607B89] transition-colors hover:bg-[#F6FAF9] hover:text-[#19384C] disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => handleOpen()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Nova interação
              </button>
            </div>
          }
        />

        {!loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{statsCards}</div>
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[260px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                value={filtros.busca || ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, busca: e.target.value, page: 1 }))
                }
                placeholder="Título ou descrição"
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Tipo</label>
            <select
              value={filtros.tipo || ''}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipo: e.target.value || undefined,
                  page: 1,
                }))
              }
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            >
              <option value="">Todos</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipoLabels[tipo]?.label || tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">
              Data ref. (início)
            </label>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  dataInicio: e.target.value || undefined,
                  page: 1,
                }))
              }
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Data ref. (fim)</label>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  dataFim: e.target.value || undefined,
                  page: 1,
                }))
              }
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15 sm:w-[170px]"
            />
          </div>
        </div>
      </FiltersBar>

      <SectionCard className="p-4 sm:p-5">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-14 text-center text-sm text-[#607B89]">Carregando interações...</div>
        ) : lista.length === 0 ? (
          <EmptyState
            title="Nenhuma interação encontrada"
            description="Cadastre a primeira interação para iniciar o histórico."
            action={
              <button
                type="button"
                onClick={() => handleOpen()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0F7B7D]"
              >
                <Plus className="h-4 w-4" />
                Nova interação
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{lista.map(renderCard)}</div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex flex-col gap-3 text-sm text-[#607B89] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Página {filtros.page} de {totalPages} — {total} registros
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={(filtros.page || 1) <= 1}
                onClick={() =>
                  setFiltros((prev) => ({
                    ...prev,
                    page: Math.max((prev.page || 1) - 1, 1),
                  }))
                }
                className="inline-flex items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={(filtros.page || 1) >= totalPages}
                onClick={() =>
                  setFiltros((prev) => ({
                    ...prev,
                    page: (prev.page || 1) + 1,
                  }))
                }
                className="inline-flex items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-3 py-1.5 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9] disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-[#DEEFE7]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEEFE7]">
              <div>
                <p className="text-xs font-semibold text-[#002333]/60 uppercase tracking-wide">
                  {editing ? 'Editar' : 'Nova'} Interação
                </p>
                <h3 className="text-xl font-bold text-[#002333]">Detalhes da interação</h3>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#002333] font-medium">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as TipoInteracao }))}
                    className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                  >
                    {tipoOptions.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipoLabels[tipo]?.label || tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#002333] font-medium">Data da interação</label>
                  <input
                    type="datetime-local"
                    value={form.data_referencia || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, data_referencia: e.target.value }))}
                    className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#002333] font-medium">Próxima ação em</label>
                  <input
                    type="datetime-local"
                    value={form.proxima_acao_em || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, proxima_acao_em: e.target.value }))}
                    className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#002333] font-medium">Próxima ação (descrição)</label>
                  <input
                    value={form.proxima_acao_descricao || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, proxima_acao_descricao: e.target.value }))}
                    placeholder="Ex: retornar ligação, enviar proposta"
                    className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#002333] font-medium">Título</label>
                <input
                  value={form.titulo || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Resumo da interação"
                  className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-[#002333] font-medium">Integração com Agenda</label>
                  {form.agenda_event_id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#159A9C]/10 text-[#159A9C] border border-[#159A9C]/30">
                      Vinculado (ID: {form.agenda_event_id})
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#002333] font-medium">
                    <input
                      type="checkbox"
                      checked={createAgenda}
                      onChange={(e) => setCreateAgenda(e.target.checked)}
                      className="h-4 w-4 text-[#159A9C] border-[#DEEFE7] rounded focus:ring-2 focus:ring-[#159A9C]"
                    />
                    Criar/atualizar evento na Agenda automaticamente
                  </label>

                  {!createAgenda && (
                    <div className="text-xs text-[#002333]/60">
                      Já tem um evento criado? Informe o ID manualmente (opcional).
                      <input
                        value={form.agenda_event_id || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, agenda_event_id: e.target.value }))}
                        placeholder="Cole o ID do evento da Agenda"
                        className="mt-2 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="mt-1">
                        Precisa criar manualmente? <a href="/agenda" className="text-[#159A9C] hover:underline" target="_blank" rel="noreferrer">Abrir Agenda</a>
                      </p>
                    </div>
                  )}

                  {createAgenda && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#DEEFE7] rounded-lg p-4 bg-[#DEEFE7]/30">
                      <div className="md:col-span-2">
                        <label className="text-sm text-[#002333] font-medium">Título do evento</label>
                        <input
                          value={agendaForm.titulo || form.titulo || ''}
                          onChange={(e) => setAgendaForm((prev) => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Ex: Reunião de follow-up"
                          className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-[#002333] font-medium">Início</label>
                        <input
                          type="datetime-local"
                          value={agendaForm.inicio}
                          onChange={(e) => setAgendaForm((prev) => ({ ...prev, inicio: e.target.value }))}
                          className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-[#002333] font-medium">Fim (opcional)</label>
                        <input
                          type="datetime-local"
                          value={agendaForm.fim || ''}
                          onChange={(e) => setAgendaForm((prev) => ({ ...prev, fim: e.target.value }))}
                          className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          checked={agendaForm.all_day || false}
                          onChange={(e) => setAgendaForm((prev) => ({ ...prev, all_day: e.target.checked }))}
                          className="h-4 w-4 text-[#159A9C] border-[#DEEFE7] rounded focus:ring-2 focus:ring-[#159A9C]"
                        />
                        <span className="text-sm text-[#002333] font-medium">Dia todo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#002333] font-medium">Descrição</label>
                <textarea
                  value={form.descricao || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                  placeholder="Detalhes da interação"
                  className="mt-1 w-full border border-[#DEEFE7] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DEEFE7] flex justify-end gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteracoesPage;
