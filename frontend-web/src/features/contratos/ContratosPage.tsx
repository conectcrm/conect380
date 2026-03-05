import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { contratoService } from '../../services/contratoService';
import type { Contrato } from '../../services/contratoService';
import { clientesService } from '../../services/clientesService';
import { propostasService } from '../../services/propostasService';
import { toastService } from '../../services/toastService';

interface ContratosPageProps {
  contratoId?: string;
}

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60';
const btnSuccess =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#14804A] px-3 text-sm font-medium text-white transition hover:bg-[#0E6B3E] disabled:cursor-not-allowed disabled:opacity-60';

const LABEL_NAO_INFORMADO = 'Nao informado';
const LABEL_DATA_NAO_INFORMADA = 'Data nao informada';

const moneyFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatarData = (data?: string | Date) => {
  if (!data) return LABEL_NAO_INFORMADO;

  try {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (Number.isNaN(dataObj.getTime())) return LABEL_NAO_INFORMADO;
    return dataObj.toLocaleDateString('pt-BR');
  } catch {
    return LABEL_NAO_INFORMADO;
  }
};

const formatarDataHora = (data?: string | Date) => {
  if (!data) return LABEL_DATA_NAO_INFORMADA;

  try {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (Number.isNaN(dataObj.getTime())) return LABEL_DATA_NAO_INFORMADA;
    return dataObj.toLocaleString('pt-BR');
  } catch {
    return LABEL_DATA_NAO_INFORMADA;
  }
};

const normalizarTexto = (valor: unknown) =>
  String(valor || '')
    .toLowerCase()
    .trim();

const getStatusMeta = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
    aguardando_assinatura: {
      label: 'Aguardando assinatura',
      className: 'bg-yellow-100 text-yellow-800',
    },
    assinado: { label: 'Assinado', className: 'bg-green-100 text-green-800' },
    cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    expirado: { label: 'Expirado', className: 'bg-red-100 text-red-800' },
  };

  if (map[status]) {
    return map[status];
  }

  const fallbackLabel =
    status
      ?.replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, (char) => char.toUpperCase()) || LABEL_NAO_INFORMADO;

  return { label: fallbackLabel, className: 'bg-gray-100 text-gray-800' };
};

const getTipoAssinaturaTexto = (tipo?: 'digital' | 'eletronica' | 'presencial') => {
  if (tipo === 'presencial') return 'Assinatura externa';
  if (tipo === 'digital' || tipo === 'eletronica') return 'Assinatura digital';
  return 'Assinatura';
};

const UUID_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLIENTE_GENERICO_REGEX = /^cliente\s+[0-9a-f-]{12,}$/i;

type ClienteResolvido = {
  nome?: string;
  email?: string;
};

const isUuidLike = (valor?: string | null) => {
  const normalizado = String(valor || '').trim();
  return UUID_LIKE_REGEX.test(normalizado);
};

const extrairNumeroProposta = (proposta: unknown): string => {
  if (!proposta || typeof proposta !== 'object') return '';

  const propostaObj = proposta as Record<string, unknown>;
  const candidatos = [
    propostaObj.numero,
    propostaObj.numeroProposta,
    propostaObj.codigo,
    propostaObj.id,
  ];

  const valor = candidatos.find(
    (item) =>
      (typeof item === 'string' || typeof item === 'number') &&
      String(item).trim().length > 0,
  );

  return valor ? String(valor).trim() : '';
};

const nomeClienteTecnico = (nome?: string | null) => {
  const valor = String(nome || '').trim();
  if (!valor) return false;
  return UUID_LIKE_REGEX.test(valor) || CLIENTE_GENERICO_REGEX.test(valor);
};

const getClienteNome = (item: Contrato, clientesPorId: Record<string, ClienteResolvido>) => {
  const clienteId = String(item.cliente?.id || '').trim();
  const resolvido = clientesPorId[clienteId];
  const nomeResolvido = String(resolvido?.nome || '').trim();
  if (nomeResolvido) return nomeResolvido;

  const nomeAtual = String(item.cliente?.nome || '').trim();
  if (nomeAtual && !nomeClienteTecnico(nomeAtual)) return nomeAtual;

  if (clienteId && isUuidLike(clienteId)) {
    return `Cliente ${clienteId.slice(0, 8)}`;
  }

  return nomeAtual || 'Cliente nao identificado';
};

const getClienteEmail = (item: Contrato, clientesPorId: Record<string, ClienteResolvido>) => {
  const clienteId = String(item.cliente?.id || '').trim();
  const resolvido = clientesPorId[clienteId];
  const emailResolvido = String(resolvido?.email || '').trim();
  if (emailResolvido) return emailResolvido;

  const emailAtual = String(item.cliente?.email || '').trim();
  return emailAtual || '';
};

const getPropostaLabel = (item: Contrato, propostasPorId: Record<string, string>) => {
  const propostaId = String(item.propostaId || '').trim();
  if (!propostaId) return '-';

  const propostaNumero = String(
    propostasPorId[propostaId] || item.propostaNumero || '',
  ).trim();
  if (propostaNumero) {
    return propostaNumero.startsWith('#') ? propostaNumero : `#${propostaNumero}`;
  }

  if (isUuidLike(propostaId)) {
    return `#${propostaId.slice(0, 8)}`;
  }

  return propostaId.startsWith('#') ? propostaId : `#${propostaId}`;
};

const ContratosPage: React.FC<ContratosPageProps> = ({ contratoId: propContratoId }) => {
  const { id: paramContratoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm } = useGlobalConfirmation();

  const contratoId = propContratoId || paramContratoId;
  const isDetalhe = Boolean(contratoId);

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baixandoPdfId, setBaixandoPdfId] = useState<string | null>(null);
  const [registrandoAssinaturaExterna, setRegistrandoAssinaturaExterna] = useState(false);
  const [clientesPorId, setClientesPorId] = useState<Record<string, ClienteResolvido>>({});
  const [propostasPorId, setPropostasPorId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isDetalhe && contratoId) {
      void carregarContrato(contratoId);
      return;
    }

    void carregarContratos();
  }, [isDetalhe, contratoId]);

  const enriquecerDadosRelacionados = async (listaContratos: Contrato[]) => {
    const clienteIds = Array.from(
      new Set(
        listaContratos
          .map((item) => String(item.cliente?.id || '').trim())
          .filter((id) => id && isUuidLike(id)),
      ),
    );
    const propostaIds = Array.from(
      new Set(listaContratos.map((item) => String(item.propostaId || '').trim()).filter(Boolean)),
    );

    if (clienteIds.length > 0) {
      const clientesSettled = await Promise.allSettled(
        clienteIds.map(async (id) => {
          const cliente = await clientesService.getClienteById(id);
          return {
            id,
            nome: String(cliente?.nome || '').trim(),
            email: String(cliente?.email || '').trim(),
          };
        }),
      );

      setClientesPorId((anterior) => {
        const proximo = { ...anterior };

        clientesSettled.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;
          const { id, nome, email } = resultado.value;
          if (!nome && !email) return;
          proximo[id] = { ...proximo[id], nome: nome || proximo[id]?.nome, email: email || proximo[id]?.email };
        });

        return proximo;
      });
    }

    if (propostaIds.length > 0) {
      const propostasSettled = await Promise.allSettled(
        propostaIds.map(async (id) => {
          const proposta = await propostasService.findById(id);
          const propostaObj = proposta as unknown as Record<string, unknown>;
          const clienteDaProposta =
            propostaObj?.cliente && typeof propostaObj.cliente === 'object'
              ? (propostaObj.cliente as Record<string, unknown>)
              : undefined;

          return {
            id,
            numero: extrairNumeroProposta(propostaObj),
            cliente: {
              id: String(clienteDaProposta?.id || '').trim(),
              nome: String(clienteDaProposta?.nome || '').trim(),
              email: String(clienteDaProposta?.email || '').trim(),
            },
          };
        }),
      );

      setPropostasPorId((anterior) => {
        const proximo = { ...anterior };

        propostasSettled.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;
          const { id, numero } = resultado.value;
          if (!numero) return;
          proximo[id] = numero;
        });

        return proximo;
      });

      setClientesPorId((anterior) => {
        const proximo = { ...anterior };

        propostasSettled.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;
          const { cliente } = resultado.value;
          if (!cliente.id || (!cliente.nome && !cliente.email)) return;

          proximo[cliente.id] = {
            ...proximo[cliente.id],
            nome: proximo[cliente.id]?.nome || cliente.nome || undefined,
            email: proximo[cliente.id]?.email || cliente.email || undefined,
          };
        });

        return proximo;
      });
    }
  };

  const carregarContrato = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const contratoData = await contratoService.buscarContrato(id);
      setContrato(contratoData);
      setContratos([]);
      void enriquecerDadosRelacionados([contratoData]);
    } catch (err) {
      console.error('Erro ao carregar contrato:', err);
      setError('Nao foi possivel carregar o contrato solicitado.');
    } finally {
      setLoading(false);
    }
  };

  const carregarContratos = async () => {
    try {
      setLoading(true);
      setError(null);
      setContrato(null);
      const lista = await contratoService.listarContratos();
      const ordenada = [...lista].sort((a, b) => {
        const dataA = (a.atualizadoEm || a.criadoEm || a.dataEmissao)?.getTime() || 0;
        const dataB = (b.atualizadoEm || b.criadoEm || b.dataEmissao)?.getTime() || 0;
        return dataB - dataA;
      });
      setContratos(ordenada);
      void enriquecerDadosRelacionados(ordenada);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
      setError('Nao foi possivel carregar os contratos.');
    } finally {
      setLoading(false);
    }
  };

  const baixarPdfContrato = async (id: string, numero?: string) => {
    try {
      setBaixandoPdfId(id);
      const pdfBlob = await contratoService.baixarPDF(id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-${numero || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toastService.success('Download do contrato iniciado.');
    } catch (err) {
      console.error('Erro ao baixar PDF do contrato:', err);
      toastService.apiError(err, 'Nao foi possivel baixar o PDF do contrato.');
    } finally {
      setBaixandoPdfId(null);
    }
  };

  const registrarAssinaturaExterna = async () => {
    if (!contrato) return;

    const confirmado = await confirm({
      title: 'Confirmar assinatura externa',
      message: 'Esta acao vai registrar o contrato como assinado externamente. Deseja continuar?',
      confirmText: 'Confirmar assinatura',
      cancelText: 'Cancelar',
      icon: 'warning',
      confirmButtonClass: 'bg-[#14804A] hover:bg-[#0E6B3E] focus:ring-[#14804A]',
    });

    if (!confirmado) return;

    try {
      setRegistrandoAssinaturaExterna(true);
      const atualizado = await contratoService.confirmarAssinaturaExterna(contrato.id);
      setContrato(atualizado);
      toastService.success('Assinatura externa registrada com sucesso.');
    } catch (err) {
      console.error('Erro ao registrar assinatura externa:', err);
      toastService.apiError(err, 'Nao foi possivel registrar a assinatura externa do contrato.');
    } finally {
      setRegistrandoAssinaturaExterna(false);
    }
  };

  const contratosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);
    if (!termo) return contratos;

    return contratos.filter((item) => {
      const campos = [
        item.numero,
        item.propostaId,
        getPropostaLabel(item, propostasPorId),
        getClienteNome(item, clientesPorId),
        getClienteEmail(item, clientesPorId),
      ];
      return campos.some((campo) => normalizarTexto(campo).includes(termo));
    });
  }, [busca, contratos, clientesPorId, propostasPorId]);

  const resumo = useMemo(() => {
    const total = contratos.length;
    const aguardando = contratos.filter(
      (item) => item.status === 'aguardando_assinatura' || item.status === 'rascunho',
    ).length;
    const assinados = contratos.filter((item) => item.status === 'assinado').length;
    const expirados = contratos.filter((item) => item.status === 'expirado').length;
    const confirmadosExternamente = contratos.filter((item) =>
      (item.assinaturas || []).some(
        (assinatura) => assinatura.status === 'assinado' && assinatura.tipo === 'presencial',
      ),
    ).length;

    return {
      total,
      aguardando,
      assinados,
      expirados,
      confirmadosExternamente,
    };
  }, [contratos]);

  const historicoAssinaturas = useMemo(() => {
    if (!contrato) return [];

    const assinaturas = Array.isArray(contrato.assinaturas) ? contrato.assinaturas : [];
    const eventos = assinaturas
      .map((assinatura) => {
        const dataEvento = assinatura.dataAssinatura || assinatura.criadoEm;
        const usuario = assinatura.usuario?.nome || 'Usuario nao identificado';
        const tipoTexto = getTipoAssinaturaTexto(assinatura.tipo);
        const timestamp = (dataEvento instanceof Date ? dataEvento : new Date(dataEvento || 0)).getTime() || 0;

        if (assinatura.status === 'assinado') {
          return {
            id: assinatura.id,
            titulo:
              assinatura.tipo === 'presencial'
                ? 'Assinatura externa confirmada'
                : 'Assinatura concluida',
            descricao: `${usuario} - ${tipoTexto}`,
            data: formatarDataHora(dataEvento),
            color: 'bg-green-500',
            timestamp,
          };
        }

        if (assinatura.status === 'rejeitado') {
          return {
            id: assinatura.id,
            titulo: 'Assinatura rejeitada',
            descricao: `${usuario} - ${tipoTexto}`,
            data: formatarDataHora(dataEvento),
            color: 'bg-red-500',
            timestamp,
          };
        }

        if (assinatura.status === 'expirado') {
          return {
            id: assinatura.id,
            titulo: 'Assinatura expirada',
            descricao: `${usuario} - ${tipoTexto}`,
            data: formatarDataHora(dataEvento),
            color: 'bg-gray-400',
            timestamp,
          };
        }

        return {
          id: assinatura.id,
          titulo: 'Assinatura pendente',
          descricao: `${usuario} - ${tipoTexto}`,
          data: formatarDataHora(dataEvento),
          color: 'bg-yellow-500',
          timestamp,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    if (eventos.length === 0 && contrato.status === 'assinado' && contrato.dataAssinatura) {
      return [
        {
          id: 'assinatura-principal',
          titulo: 'Contrato assinado',
          descricao: 'Registro de assinatura do contrato',
          data: formatarDataHora(contrato.dataAssinatura),
          color: 'bg-green-500',
          timestamp: new Date(contrato.dataAssinatura).getTime(),
        },
      ];
    }

    return eventos;
  }, [contrato]);

  const podeRegistrarAssinaturaExterna =
    contrato?.status === 'aguardando_assinatura' || contrato?.status === 'rascunho';

  if (!isDetalhe) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <SectionCard className="space-y-4 p-4 sm:p-5">
          <PageHeader
            title="Contratos"
            description="Acompanhe os contratos gerados a partir das propostas comerciais."
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className={btnSecondary}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => void carregarContratos()}
                  disabled={loading}
                  className={btnSecondary}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            }
          />

          {!loading && !error && (
            <InlineStats
              stats={[
                { label: 'Total', value: String(resumo.total), tone: 'neutral' },
                { label: 'Aguardando assinatura', value: String(resumo.aguardando), tone: 'warning' },
                { label: 'Assinados', value: String(resumo.assinados), tone: 'accent' },
                { label: 'Externos confirmados', value: String(resumo.confirmadosExternamente), tone: 'neutral' },
                { label: 'Expirados', value: String(resumo.expirados), tone: 'warning' },
              ]}
            />
          )}
        </SectionCard>

        <FiltersBar className="p-4">
          <div className="w-full sm:min-w-[280px] sm:flex-1">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Buscar contratos</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Numero, proposta, cliente ou e-mail..."
                className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
              />
            </div>
          </div>
        </FiltersBar>

        {loading && <LoadingSkeleton lines={8} />}

        {!loading && error && (
          <EmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Falha ao carregar contratos"
            description={error}
            action={
              <button type="button" onClick={() => void carregarContratos()} className={btnPrimary}>
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            }
          />
        )}

        {!loading && !error && contratosFiltrados.length === 0 && (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="Nenhum contrato encontrado"
            description={
              busca.trim()
                ? 'Ajuste o filtro para localizar contratos.'
                : 'Quando contratos forem gerados no fluxo de propostas, eles aparecerao aqui.'
            }
          />
        )}

        {!loading && !error && contratosFiltrados.length > 0 && (
          <DataTableCard>
            <div className="flex flex-col gap-3 border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="text-sm text-[#516F7D]">
                {contratosFiltrados.length} registro{contratosFiltrados.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="p-4 lg:hidden">
              <div className="grid grid-cols-1 gap-3">
                {contratosFiltrados.map((item) => {
                  const status = getStatusMeta(item.status);
                  const clienteNome = getClienteNome(item, clientesPorId);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[#DFE9ED] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#173A4D]">#{item.numero || item.id}</p>
                          <p className="mt-1 truncate text-sm text-[#5A7684]">{clienteNome}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                          <div className="flex items-center gap-2 text-[#5F7B89]">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs uppercase tracking-wide">Valor</span>
                          </div>
                          <p className="mt-1 font-semibold text-[#173A4D]">
                            {moneyFmt.format(item.valor || 0)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2">
                          <div className="flex items-center gap-2 text-[#5F7B89]">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs uppercase tracking-wide">Vencimento</span>
                          </div>
                          <p className="mt-1 font-medium text-[#173A4D]">
                            {formatarData(item.dataVencimento)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#EDF3F5] pt-3">
                        <button
                          type="button"
                          onClick={() => void baixarPdfContrato(item.id, item.numero)}
                          disabled={baixandoPdfId === item.id}
                          className={btnSecondary}
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/contratos/${item.id}`)}
                          className={btnPrimary}
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Contrato
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Cliente
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Proposta
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Valor
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Vencimento
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#5B7683]">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {contratosFiltrados.map((item) => {
                      const status = getStatusMeta(item.status);
                      const clienteNome = getClienteNome(item, clientesPorId);
                      const clienteEmail = getClienteEmail(item, clientesPorId);
                      const propostaLabel = getPropostaLabel(item, propostasPorId);
                      return (
                        <tr key={item.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                          <td className="px-5 py-4 align-top">
                            <div className="text-sm font-semibold text-[#173A4D]">#{item.numero || item.id}</div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-sm font-medium text-[#173A4D]">{clienteNome}</div>
                            {clienteEmail ? (
                              <div className="mt-0.5 text-xs text-[#64808E]">{clienteEmail}</div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-[#476776]">{propostaLabel}</td>
                          <td className="px-5 py-4 align-top">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-top text-sm font-semibold text-[#173A4D]">
                            {moneyFmt.format(item.valor || 0)}
                          </td>
                          <td className="px-5 py-4 align-top text-sm text-[#476776]">
                            {formatarData(item.dataVencimento)}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void baixarPdfContrato(item.id, item.numero)}
                                disabled={baixandoPdfId === item.id}
                                className={btnSecondary}
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/contratos/${item.id}`)}
                                className={btnPrimary}
                              >
                                <Eye className="h-4 w-4" />
                                Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </DataTableCard>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <SectionCard className="p-4 sm:p-5">
          <LoadingSkeleton lines={8} />
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Contrato nao encontrado"
          description={error}
          action={
            <button type="button" onClick={() => navigate('/contratos')} className={btnPrimary}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para contratos
            </button>
          }
        />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Contrato nao encontrado"
          description="O contrato solicitado nao esta disponivel."
          action={
            <button type="button" onClick={() => navigate('/contratos')} className={btnPrimary}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para contratos
            </button>
          }
        />
      </div>
    );
  }

  const statusContrato = getStatusMeta(contrato.status);
  const clienteNomeContrato = getClienteNome(contrato, clientesPorId);
  const clienteEmailContrato = getClienteEmail(contrato, clientesPorId);
  const propostaLabelContrato = getPropostaLabel(contrato, propostasPorId);

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={`Contrato ${contrato.numero || `#${contrato.id}`}`}
          description={`Status atual: ${statusContrato.label}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigate('/contratos')} className={btnSecondary}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              {podeRegistrarAssinaturaExterna && (
                <button
                  type="button"
                  onClick={() => void registrarAssinaturaExterna()}
                  disabled={registrandoAssinaturaExterna}
                  className={btnSuccess}
                >
                  {registrandoAssinaturaExterna ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar assinatura externa
                </button>
              )}
              <button
                type="button"
                onClick={() => void baixarPdfContrato(contrato.id, contrato.numero)}
                disabled={baixandoPdfId === contrato.id}
                className={btnPrimary}
              >
                {baixandoPdfId === contrato.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar PDF
              </button>
            </div>
          }
        />

        <InlineStats
          stats={[
            { label: 'Status', value: statusContrato.label, tone: 'neutral' },
            { label: 'Valor', value: moneyFmt.format(contrato.valor || 0), tone: 'accent' },
            { label: 'Vencimento', value: formatarData(contrato.dataVencimento), tone: 'warning' },
            { label: 'Atualizado em', value: formatarData(contrato.atualizadoEm), tone: 'neutral' },
          ]}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard className="p-4">
          <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
            <User className="mr-2 h-4 w-4" />
            Cliente
          </h3>
          <div className="space-y-2 text-sm text-[#173A4D]">
            <p>
              <span className="text-[#6A8593]">Nome: </span>
              {clienteNomeContrato}
            </p>
            <p>
              <span className="text-[#6A8593]">Email: </span>
              {clienteEmailContrato || LABEL_NAO_INFORMADO}
            </p>
            <p>
              <span className="text-[#6A8593]">Telefone: </span>
              {contrato.cliente?.telefone || LABEL_NAO_INFORMADO}
            </p>
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
            <DollarSign className="mr-2 h-4 w-4" />
            Financeiro
          </h3>
          <div className="space-y-2 text-sm text-[#173A4D]">
            <p>
              <span className="text-[#6A8593]">Valor total: </span>
              {moneyFmt.format(contrato.valor || 0)}
            </p>
            <p>
              <span className="text-[#6A8593]">Data de emissao: </span>
              {formatarData(contrato.dataEmissao)}
            </p>
            <p>
              <span className="text-[#6A8593]">Data de vencimento: </span>
              {formatarData(contrato.dataVencimento)}
            </p>
            <p>
              <span className="text-[#6A8593]">Data de assinatura: </span>
              {formatarData(contrato.dataAssinatura)}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-4">
        <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
          <FileText className="mr-2 h-4 w-4" />
          Descricao do contrato
        </h3>
        <p className="whitespace-pre-wrap text-sm text-[#173A4D]">
          {contrato.descricao || 'Sem descricao registrada.'}
        </p>
      </SectionCard>

      {contrato.observacoes ? (
        <SectionCard className="p-4">
          <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
            <AlertCircle className="mr-2 h-4 w-4" />
            Observacoes
          </h3>
          <p className="whitespace-pre-wrap text-sm text-[#173A4D]">{contrato.observacoes}</p>
        </SectionCard>
      ) : null}

      {historicoAssinaturas.length > 0 ? (
        <SectionCard className="p-4">
          <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
            <Clock className="mr-2 h-4 w-4" />
            Historico de assinatura
          </h3>
          <div className="space-y-3">
            {historicoAssinaturas.map((evento) => (
              <div
                key={evento.id}
                className="flex items-start gap-3 rounded-lg border border-[#DFE9ED] bg-white px-3 py-2"
              >
                <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${evento.color}`} />
                <div>
                  <p className="text-sm font-semibold text-[#173A4D]">{evento.titulo}</p>
                  <p className="text-sm text-[#5A7684]">{evento.descricao}</p>
                  <p className="mt-0.5 text-xs text-[#77909C]">{evento.data}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard className="p-4">
        <h3 className="mb-3 flex items-center text-sm font-semibold uppercase tracking-wide text-[#385A6A]">
          <Calendar className="mr-2 h-4 w-4" />
          Informacoes adicionais
        </h3>
        <div className="grid grid-cols-1 gap-3 text-sm text-[#173A4D] md:grid-cols-2">
          <p>
            <span className="text-[#6A8593]">ID do contrato: </span>
            {contrato.id}
          </p>
          <p>
            <span className="text-[#6A8593]">Proposta de origem: </span>
            {contrato.propostaId ? propostaLabelContrato : 'Nao vinculada'}
          </p>
          <p>
            <span className="text-[#6A8593]">Criado em: </span>
            {formatarData(contrato.criadoEm || contrato.dataEmissao)}
          </p>
          <p>
            <span className="text-[#6A8593]">Atualizado em: </span>
            {formatarData(contrato.atualizadoEm)}
          </p>
        </div>
      </SectionCard>
    </div>
  );
};

export default ContratosPage;
