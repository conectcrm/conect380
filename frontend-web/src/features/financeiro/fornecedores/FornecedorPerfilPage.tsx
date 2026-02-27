import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  User,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import ModalFornecedor from '../components/ModalFornecedor';
import fornecedorService, { Fornecedor, NovoFornecedor } from '../../../services/fornecedorService';
import contasPagarService from '../../../services/contasPagarService';
import { ContaPagar, StatusContaPagar, STATUS_LABELS } from '../../../types/financeiro';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarData = (data?: string) => {
  if (!data) return 'N/A';
  const value = new Date(data);
  if (Number.isNaN(value.getTime())) return 'N/A';
  return value.toLocaleDateString('pt-BR');
};

const formatarTelefone = (valor?: string) => {
  if (!valor) return 'Não informado';
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 10) return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  if (numeros.length === 11) return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  return valor;
};

const statusBadge = (status: StatusContaPagar) => {
  const tone =
    status === StatusContaPagar.PAGO
      ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
      : status === StatusContaPagar.VENCIDO
        ? 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
        : status === StatusContaPagar.AGENDADO
          ? 'border-[#CFE3FA] bg-[#F2F8FF] text-[#1E66B4]'
          : status === StatusContaPagar.CANCELADO
            ? 'border-[#DCE8EC] bg-[#F8FBFC] text-[#476776]'
            : 'border-[#F9D9AA] bg-[#FFF7EA] text-[#A86400]';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

const FornecedorPerfilPage: React.FC = () => {
  const navigate = useNavigate();
  const { fornecedorId } = useParams<{ fornecedorId: string }>();

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false);

  const carregarPerfil = async () => {
    if (!fornecedorId) {
      setErro('Fornecedor não informado.');
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const [fornecedorData, contasData] = await Promise.all([
        fornecedorService.buscarFornecedorPorId(fornecedorId),
        contasPagarService.listar({ fornecedorId }),
      ]);

      setFornecedor(fornecedorData);
      setContas(contasData);
    } catch (error: any) {
      console.error('Erro ao carregar perfil do fornecedor:', error);
      setErro(error?.message || 'Não foi possível carregar o perfil do fornecedor.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    void carregarPerfil();
  }, [fornecedorId]);

  const resumo = useMemo(() => {
    const totalContas = contas.length;
    const pagas = contas.filter((c) => c.status === StatusContaPagar.PAGO);
    const abertas = contas.filter(
      (c) =>
        c.status === StatusContaPagar.EM_ABERTO ||
        c.status === StatusContaPagar.AGENDADO ||
        c.status === StatusContaPagar.VENCIDO,
    );
    const valorTotal = contas.reduce((acc, conta) => acc + (conta.valorTotal || 0), 0);
    const valorPago = contas.reduce((acc, conta) => acc + (conta.valorPago || 0), 0);
    const valorAberto = contas.reduce((acc, conta) => acc + (conta.valorRestante || 0), 0);

    return {
      totalContas,
      pagas: pagas.length,
      abertas: abertas.length,
      valorTotal,
      valorPago,
      valorAberto,
    };
  }, [contas]);

  const historico = useMemo(() => {
    const eventos: Array<{ data: string; titulo: string; descricao: string }> = [];

    if (fornecedor?.criadoEm) {
      eventos.push({
        data: fornecedor.criadoEm,
        titulo: 'Fornecedor cadastrado',
        descricao: `${fornecedor.nome} foi incluído na base de fornecedores.`,
      });
    }

    if (fornecedor?.atualizadoEm && fornecedor.atualizadoEm !== fornecedor.criadoEm) {
      eventos.push({
        data: fornecedor.atualizadoEm,
        titulo: 'Cadastro atualizado',
        descricao: 'Informações de cadastro foram alteradas.',
      });
    }

    contas.forEach((conta) => {
      eventos.push({
        data: conta.criadoEm,
        titulo: `Conta ${conta.numero} criada`,
        descricao: `${moneyFmt.format(conta.valorTotal || 0)} - ${STATUS_LABELS[conta.status]}`,
      });

      if (conta.dataPagamento) {
        eventos.push({
          data: conta.dataPagamento,
          titulo: `Conta ${conta.numero} paga`,
          descricao: `Pagamento registrado em ${formatarData(conta.dataPagamento)}.`,
        });
      }
    });

    return eventos
      .filter((evento) => !!evento.data)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 12);
  }, [contas, fornecedor]);

  const salvarFornecedor = async (payload: NovoFornecedor) => {
    if (!fornecedor) return;
    try {
      setSalvandoFornecedor(true);
      await fornecedorService.atualizarFornecedor(fornecedor.id, payload);
      toast.success('Fornecedor atualizado com sucesso.');
      setModalEdicaoAberto(false);
      await carregarPerfil();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error(error?.message || 'Erro ao atualizar fornecedor.');
    } finally {
      setSalvandoFornecedor(false);
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={fornecedor ? `Fornecedor: ${fornecedor.nome}` : 'Perfil do fornecedor'}
          description="Histórico de relacionamento, contas vinculadas e dados cadastrais."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => navigate('/financeiro/fornecedores')} className={btnSecondary}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button type="button" onClick={() => void carregarPerfil()} className={btnSecondary} disabled={carregando}>
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              {fornecedor ? (
                <button type="button" onClick={() => setModalEdicaoAberto(true)} className={btnPrimary}>
                  <Edit3 className="h-4 w-4" />
                  Editar fornecedor
                </button>
              ) : null}
            </div>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Contas vinculadas', value: String(resumo.totalContas), tone: 'neutral' },
              { label: 'Em aberto', value: String(resumo.abertas), tone: 'warning' },
              { label: 'Pagas', value: String(resumo.pagas), tone: 'accent' },
              { label: 'Valor aberto', value: moneyFmt.format(resumo.valorAberto), tone: 'warning' },
              { label: 'Valor pago', value: moneyFmt.format(resumo.valorPago), tone: 'accent' },
            ]}
          />
        ) : null}
      </SectionCard>

      {carregando ? <LoadingSkeleton lines={10} /> : null}

      {!carregando && erro ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Erro ao carregar perfil do fornecedor"
          description={erro}
          action={
            <button type="button" onClick={() => void carregarPerfil()} className={btnPrimary}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {!carregando && !erro && fornecedor ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard className="space-y-3 p-4 xl:col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5F7B89]">
                Dados cadastrais
              </h3>
              <div className="space-y-2 text-sm text-[#173A4D]">
                <p className="flex items-center gap-2"><User className="h-4 w-4 text-[#6E8997]" />{fornecedor.contato || 'Contato não informado'}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#6E8997]" />{fornecedor.email || 'E-mail não informado'}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#6E8997]" />{formatarTelefone(fornecedor.telefone)}</p>
                <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#6E8997]" />{fornecedor.cnpjCpf || 'Documento não informado'}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#6E8997]" />Cadastro: {formatarData(fornecedor.criadoEm)}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#6E8997]" />Atualização: {formatarData(fornecedor.atualizadoEm)}</p>
              </div>
              <div className="rounded-lg border border-[#E4EDF0] bg-[#FAFCFD] p-3 text-sm text-[#476776]">
                <p>
                  <strong>Endereço:</strong> {fornecedor.endereco || 'Não informado'}
                  {fornecedor.numero ? `, ${fornecedor.numero}` : ''}
                </p>
                <p>
                  {fornecedor.bairro || 'Sem bairro'} - {fornecedor.cidade || 'Sem cidade'}
                  {fornecedor.estado ? `/${fornecedor.estado}` : ''}
                </p>
                <p>CEP: {fornecedor.cep || 'Não informado'}</p>
              </div>
            </SectionCard>

            <SectionCard className="space-y-3 p-4 xl:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5F7B89]">
                Histórico e relacionamento
              </h3>
              {historico.length ? (
                <div className="space-y-2">
                  {historico.map((evento, index) => (
                    <div key={`${evento.titulo}-${index}`} className="rounded-lg border border-[#E4EDF0] bg-white p-3">
                      <p className="text-xs text-[#6E8997]">{formatarData(evento.data)}</p>
                      <p className="text-sm font-semibold text-[#173A4D]">{evento.titulo}</p>
                      <p className="text-sm text-[#476776]">{evento.descricao}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock className="h-5 w-5" />}
                  title="Sem histórico"
                  description="Ainda não há eventos de relacionamento para este fornecedor."
                />
              )}
            </SectionCard>
          </div>

          <DataTableCard>
            <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-[#173A4D]">Contas a pagar vinculadas</h3>
            </div>
            {contas.length ? (
              <div className="max-h-[55vh] overflow-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#E1EAEE]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Conta</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Descrição</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Vencimento</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Valor total</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Pago</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5B7683]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {contas.map((conta) => (
                      <tr key={conta.id} className="border-t border-[#EDF3F5] hover:bg-[#FAFCFD]">
                        <td className="px-5 py-4 text-sm font-semibold text-[#173A4D]">{conta.numero}</td>
                        <td className="px-5 py-4 text-sm text-[#476776]">{conta.descricao}</td>
                        <td className="px-5 py-4 text-sm text-[#476776]">{formatarData(conta.dataVencimento)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#173A4D]">{moneyFmt.format(conta.valorTotal || 0)}</td>
                        <td className="px-5 py-4 text-sm text-[#137A42]">{moneyFmt.format(conta.valorPago || 0)}</td>
                        <td className="px-5 py-4">{statusBadge(conta.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-5 w-5" />}
                title="Sem contas vinculadas"
                description="Nenhuma conta a pagar foi registrada para este fornecedor."
              />
            )}
          </DataTableCard>
        </>
      ) : null}

      {modalEdicaoAberto && fornecedor ? (
        <ModalFornecedor
          isOpen={modalEdicaoAberto}
          onClose={() => setModalEdicaoAberto(false)}
          onSave={salvarFornecedor}
          fornecedor={fornecedor}
          isLoading={salvandoFornecedor}
        />
      ) : null}
    </div>
  );
};

export default FornecedorPerfilPage;
