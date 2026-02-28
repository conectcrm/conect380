import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Eye,
  FileText,
  Filter,
  Link2,
  Link2Off,
  RefreshCw,
  Search,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../../components/layout-v2';
import contaBancariaService from '../../../services/contaBancariaService';
import conciliacaoBancariaService from '../../../services/conciliacaoBancariaService';
import {
  ContaBancaria,
  ContaPagarCandidataConciliacao,
  ImportacaoExtrato,
  ItemImportacaoExtrato,
  ResultadoImportacaoExtrato,
  TipoLancamentoExtrato,
} from '../../../types/financeiro';

const btnPrimary =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:opacity-60 disabled:cursor-not-allowed';
const btnSecondary =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:opacity-60 disabled:cursor-not-allowed';
const btnDanger =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-[#F3CCD2] bg-[#FFF4F6] px-3 text-sm font-medium text-[#9F1D35] transition hover:bg-[#FFE9EE] disabled:opacity-60 disabled:cursor-not-allowed';

const moneyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('pt-BR');
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (Array.isArray(message)) {
      const first = message.find((item) => typeof item === 'string' && item.trim());
      if (first) {
        return first.trim();
      }
    }
  }

  return fallback;
};

const tipoBadge = (tipo: TipoLancamentoExtrato) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
      tipo === 'credito'
        ? 'border-[#BEE6CF] bg-[#F1FBF5] text-[#137A42]'
        : 'border-[#F4C7CF] bg-[#FFF4F6] text-[#B4233A]'
    }`}
  >
    {tipo === 'credito' ? 'Credito' : 'Debito'}
  </span>
);

const tipoArquivoBadge = (tipoArquivo: 'csv' | 'ofx') => (
  <span className="inline-flex items-center rounded-full border border-[#DCE8EC] bg-[#F8FBFC] px-2.5 py-1 text-xs font-semibold text-[#476776] uppercase">
    {tipoArquivo}
  </span>
);

export default function ConciliacaoBancariaPage() {
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacaoExtrato | null>(null);
  const [importacoes, setImportacoes] = useState<ImportacaoExtrato[]>([]);
  const [importacaoSelecionadaId, setImportacaoSelecionadaId] = useState<string | null>(null);
  const [itensImportacao, setItensImportacao] = useState<ItemImportacaoExtrato[]>([]);
  const [buscaArquivo, setBuscaArquivo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoImportacoes, setCarregandoImportacoes] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [importando, setImportando] = useState(false);
  const [executandoMatching, setExecutandoMatching] = useState(false);
  const [processandoItemId, setProcessandoItemId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroItens, setErroItens] = useState<string | null>(null);
  const [inputArquivoKey, setInputArquivoKey] = useState(0);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemImportacaoExtrato | null>(null);
  const [candidatosConciliacao, setCandidatosConciliacao] = useState<ContaPagarCandidataConciliacao[]>([]);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [contaPagarSelecionadaId, setContaPagarSelecionadaId] = useState('');
  const [observacaoConciliacao, setObservacaoConciliacao] = useState('');

  useEffect(() => {
    void carregarContasBancarias();
  }, []);

  useEffect(() => {
    if (!contaBancariaId) {
      setImportacoes([]);
      setImportacaoSelecionadaId(null);
      setItensImportacao([]);
      setItemEmEdicao(null);
      return;
    }
    setImportacaoSelecionadaId(null);
    setItensImportacao([]);
    setItemEmEdicao(null);
    void carregarImportacoes(contaBancariaId);
  }, [contaBancariaId]);

  const carregarContasBancarias = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const contas = await contaBancariaService.listarAtivas();
      setContasBancarias(Array.isArray(contas) ? contas : []);

      if (Array.isArray(contas) && contas.length > 0) {
        setContaBancariaId((prev) => prev || contas[0].id);
      }
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar contas bancarias');
      setErro(mensagem);
      toast.error(mensagem);
      setContasBancarias([]);
    } finally {
      setCarregando(false);
    }
  };

  const carregarImportacoes = async (contaId: string) => {
    try {
      setCarregandoImportacoes(true);
      setErro(null);
      const dados = await conciliacaoBancariaService.listarImportacoes({
        contaBancariaId: contaId,
        limite: 50,
      });
      setImportacoes(Array.isArray(dados) ? dados : []);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar importacoes');
      setErro(mensagem);
      toast.error(mensagem);
      setImportacoes([]);
    } finally {
      setCarregandoImportacoes(false);
    }
  };

  const carregarItensImportacao = async (importacaoId: string) => {
    try {
      setCarregandoItens(true);
      setErroItens(null);
      setImportacaoSelecionadaId(importacaoId);
      setItemEmEdicao(null);
      setCandidatosConciliacao([]);
      const dados = await conciliacaoBancariaService.listarItensImportacao(importacaoId, 200);
      setItensImportacao(Array.isArray(dados) ? dados : []);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar lancamentos importados');
      setErroItens(mensagem);
      toast.error(mensagem);
      setItensImportacao([]);
    } finally {
      setCarregandoItens(false);
    }
  };

  const executarMatchingAutomatico = async () => {
    if (!importacaoSelecionadaId) {
      toast.error('Selecione uma importacao para executar matching automatico');
      return;
    }

    try {
      setExecutandoMatching(true);
      const resultado = await conciliacaoBancariaService.executarMatchingAutomatico(importacaoSelecionadaId, 3);
      toast.success(
        `Matching concluido: ${resultado.totalConciliados} conciliado(s), ${resultado.totalPendentes} pendente(s)`,
      );
      await carregarItensImportacao(importacaoSelecionadaId);
      if (contaBancariaId) {
        await carregarImportacoes(contaBancariaId);
      }
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Falha ao executar matching automatico');
      toast.error(mensagem);
    } finally {
      setExecutandoMatching(false);
    }
  };

  const abrirConciliacaoManual = async (item: ItemImportacaoExtrato) => {
    try {
      setItemEmEdicao(item);
      setObservacaoConciliacao('');
      setContaPagarSelecionadaId(item.contaPagarId || '');
      setCarregandoCandidatos(true);

      const candidatos = await conciliacaoBancariaService.listarCandidatosConciliacao(item.id, 20);
      setCandidatosConciliacao(candidatos);

      if (!item.contaPagarId && candidatos[0]) {
        setContaPagarSelecionadaId(candidatos[0].id);
      }
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel carregar candidatos para conciliacao');
      toast.error(mensagem);
      setItemEmEdicao(null);
      setCandidatosConciliacao([]);
    } finally {
      setCarregandoCandidatos(false);
    }
  };

  const fecharConciliacaoManual = () => {
    setItemEmEdicao(null);
    setCandidatosConciliacao([]);
    setContaPagarSelecionadaId('');
    setObservacaoConciliacao('');
  };

  const confirmarConciliacaoManual = async () => {
    if (!itemEmEdicao) return;
    if (!contaPagarSelecionadaId) {
      toast.error('Selecione uma conta a pagar para conciliar');
      return;
    }

    try {
      setProcessandoItemId(itemEmEdicao.id);
      const itemAtualizado = await conciliacaoBancariaService.conciliarItem(
        itemEmEdicao.id,
        contaPagarSelecionadaId,
        observacaoConciliacao.trim() || undefined,
      );

      setItensImportacao((prev) =>
        prev.map((item) => (item.id === itemAtualizado.id ? itemAtualizado : item)),
      );
      setItemEmEdicao(itemAtualizado);
      toast.success('Item conciliado com sucesso');
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel conciliar item');
      toast.error(mensagem);
    } finally {
      setProcessandoItemId(null);
    }
  };

  const desfazerConciliacao = async (item: ItemImportacaoExtrato) => {
    try {
      setProcessandoItemId(item.id);
      const itemAtualizado = await conciliacaoBancariaService.desconciliarItem(
        item.id,
        'Desconciliacao manual',
      );
      setItensImportacao((prev) =>
        prev.map((atual) => (atual.id === itemAtualizado.id ? itemAtualizado : atual)),
      );
      if (itemEmEdicao?.id === item.id) {
        setItemEmEdicao(itemAtualizado);
      }
      toast.success('Conciliacao desfeita com sucesso');
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel desfazer conciliacao');
      toast.error(mensagem);
    } finally {
      setProcessandoItemId(null);
    }
  };

  const handleImportarExtrato = async () => {
    if (!contaBancariaId) {
      toast.error('Selecione uma conta bancaria para importar');
      return;
    }

    if (!arquivo) {
      toast.error('Selecione um arquivo OFX ou CSV');
      return;
    }

    const nomeArquivo = arquivo.name.toLowerCase();
    if (!nomeArquivo.endsWith('.csv') && !nomeArquivo.endsWith('.ofx')) {
      toast.error('Formato invalido. Envie apenas arquivo CSV ou OFX');
      return;
    }

    try {
      setImportando(true);
      setErro(null);
      const resultado = await conciliacaoBancariaService.importarExtrato(contaBancariaId, arquivo);
      setResultadoImportacao(resultado);
      setArquivo(null);
      setInputArquivoKey((prev) => prev + 1);
      toast.success(
        `Extrato importado com sucesso (${resultado.resumo.totalLancamentos} lancamento(s))`,
      );
      await carregarImportacoes(contaBancariaId);
      await carregarItensImportacao(resultado.importacao.id);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Nao foi possivel importar o extrato');
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setImportando(false);
    }
  };

  const limparBusca = async () => {
    setBuscaArquivo('');
    if (contaBancariaId) {
      await carregarImportacoes(contaBancariaId);
    }
  };

  const contaAtual = useMemo(
    () => contasBancarias.find((conta) => conta.id === contaBancariaId) || null,
    [contaBancariaId, contasBancarias],
  );

  const importacoesFiltradas = useMemo(() => {
    const termo = buscaArquivo.trim().toLowerCase();
    if (!termo) return importacoes;
    return importacoes.filter((item) => item.nomeArquivo.toLowerCase().includes(termo));
  }, [buscaArquivo, importacoes]);

  const totalImportacoes = importacoes.length;
  const totalLancamentos = importacoes.reduce((acc, item) => acc + Number(item.totalLancamentos || 0), 0);
  const totalEntradas = importacoes.reduce((acc, item) => acc + Number(item.totalEntradas || 0), 0);
  const totalSaidas = importacoes.reduce((acc, item) => acc + Number(item.totalSaidas || 0), 0);
  const hasBusca = buscaArquivo.trim().length > 0;

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title="Conciliacao Bancaria"
          description={
            contaAtual
              ? `Importe extratos OFX/CSV para a conta ${contaAtual.nome}.`
              : 'Importe extratos OFX/CSV e acompanhe os lancamentos pendentes de conciliacao.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarContasBancarias()}
                className={btnSecondary}
                disabled={carregando || importando}
              >
                <RefreshCw className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          }
        />

        {!carregando && !erro ? (
          <InlineStats
            stats={[
              { label: 'Importacoes', value: String(totalImportacoes), tone: 'neutral' },
              { label: 'Lancamentos', value: String(totalLancamentos), tone: 'accent' },
              { label: 'Entradas', value: moneyFmt.format(totalEntradas), tone: 'neutral' },
              { label: 'Saidas', value: moneyFmt.format(totalSaidas), tone: 'warning' },
            ]}
          />
        ) : null}
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Conta bancaria</label>
            <select
              value={contaBancariaId}
              onChange={(event) => setContaBancariaId(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
            >
              {contasBancarias.length === 0 ? <option value="">Nenhuma conta ativa</option> : null}
              {contasBancarias.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.nome} - {conta.banco} ({conta.conta})
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Arquivo (OFX/CSV)</label>
            <input
              key={inputArquivoKey}
              type="file"
              accept=".csv,.ofx"
              onChange={(event) => setArquivo(event.target.files?.[0] || null)}
              className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] file:mr-3 file:rounded-md file:border-0 file:bg-[#EFF7F9] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#245468]"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-medium text-[#385A6A]">Acoes</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleImportarExtrato()}
                className={btnPrimary}
                disabled={importando || !contaBancariaId || !arquivo}
              >
                <UploadCloud className={`h-4 w-4 ${importando ? 'animate-pulse' : ''}`} />
                {importando ? 'Importando...' : 'Importar extrato'}
              </button>
            </div>
          </div>
        </div>
      </FiltersBar>

      {carregando ? <LoadingSkeleton lines={8} /> : null}

      {!carregando && erro ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5" />}
          title="Erro ao carregar conciliacao bancaria"
          description={erro}
          action={
            <button type="button" className={btnPrimary} onClick={() => void carregarContasBancarias()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          }
        />
      ) : null}

      {resultadoImportacao ? (
        <SectionCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#245468]">
            <FileText className="h-4 w-4" />
            Resultado da ultima importacao ({resultadoImportacao.importacao.nomeArquivo})
          </div>

          <InlineStats
            stats={[
              {
                label: 'Lancamentos importados',
                value: String(resultadoImportacao.resumo.totalLancamentos),
                tone: 'accent',
              },
              {
                label: 'Entradas',
                value: moneyFmt.format(resultadoImportacao.resumo.totalEntradas),
                tone: 'neutral',
              },
              {
                label: 'Saidas',
                value: moneyFmt.format(resultadoImportacao.resumo.totalSaidas),
                tone: 'warning',
              },
            ]}
          />

          {resultadoImportacao.erros.length > 0 ? (
            <div className="rounded-xl border border-[#F2D8A6] bg-[#FFF8EA] p-3">
              <p className="text-sm font-semibold text-[#8C5A07]">
                Importacao concluida com {resultadoImportacao.erros.length} aviso(s)
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#8C5A07]">
                {resultadoImportacao.erros.slice(0, 8).map((erro, index) => (
                  <li key={`${erro.mensagem}-${index}`}>
                    {erro.linha ? `Linha ${erro.linha}: ` : ''}
                    {erro.mensagem}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {!carregando && !erro ? (
        <>
          <FiltersBar className="p-4">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full sm:min-w-[280px] sm:flex-1">
                <label className="mb-2 block text-sm font-medium text-[#385A6A]">
                  Buscar no historico
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AAEB8]" />
                  <input
                    type="text"
                    value={buscaArquivo}
                    onChange={(event) => setBuscaArquivo(event.target.value)}
                    placeholder="Nome do arquivo..."
                    className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white pl-10 pr-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                  />
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => void carregarImportacoes(contaBancariaId)}
                  className={btnSecondary}
                  disabled={!contaBancariaId || carregandoImportacoes}
                >
                  <RefreshCw className={`h-4 w-4 ${carregandoImportacoes ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => void limparBusca()}
                  className={btnSecondary}
                  disabled={!hasBusca}
                >
                  <Filter className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>
          </FiltersBar>

          <DataTableCard>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F7FAFB] text-xs uppercase tracking-wide text-[#6B8794]">
                  <tr>
                    <th className="px-3 py-3">Arquivo</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Periodo</th>
                    <th className="px-3 py-3">Lancamentos</th>
                    <th className="px-3 py-3">Entradas</th>
                    <th className="px-3 py-3">Saidas</th>
                    <th className="px-3 py-3">Importado em</th>
                    <th className="px-3 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {importacoesFiltradas.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t border-[#EDF2F4] text-[#244455] ${
                        importacaoSelecionadaId === item.id ? 'bg-[#F2F8FF]' : ''
                      }`}
                    >
                      <td className="px-3 py-3 font-medium">{item.nomeArquivo}</td>
                      <td className="px-3 py-3">{tipoArquivoBadge(item.tipoArquivo)}</td>
                      <td className="px-3 py-3">
                        {item.periodoInicio || item.periodoFim
                          ? `${formatDate(item.periodoInicio)} a ${formatDate(item.periodoFim)}`
                          : 'Nao informado'}
                      </td>
                      <td className="px-3 py-3">{item.totalLancamentos}</td>
                      <td className="px-3 py-3">{moneyFmt.format(item.totalEntradas)}</td>
                      <td className="px-3 py-3">{moneyFmt.format(item.totalSaidas)}</td>
                      <td className="px-3 py-3">{formatDateTime(item.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => void carregarItensImportacao(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver itens
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!carregandoImportacoes && importacoesFiltradas.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="Nenhuma importacao encontrada"
                description="Importe um arquivo OFX/CSV para iniciar a conciliacao bancaria."
              />
            ) : null}
          </DataTableCard>

          {importacaoSelecionadaId ? (
            <>
              <DataTableCard>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF2F4] px-3 py-3">
                  <h3 className="text-sm font-semibold text-[#244455]">
                    Lancamentos importados ({itensImportacao.length})
                  </h3>
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => void executarMatchingAutomatico()}
                    disabled={executandoMatching || carregandoItens || itensImportacao.length === 0}
                  >
                    <Sparkles className={`h-4 w-4 ${executandoMatching ? 'animate-pulse' : ''}`} />
                    {executandoMatching ? 'Executando...' : 'Matching automatico'}
                  </button>
                </div>

                {carregandoItens ? <LoadingSkeleton lines={6} /> : null}

                {!carregandoItens && erroItens ? (
                  <EmptyState
                    icon={<AlertCircle className="h-5 w-5" />}
                    title="Erro ao carregar lancamentos"
                    description={erroItens}
                  />
                ) : null}

                {!carregandoItens && !erroItens && itensImportacao.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-5 w-5" />}
                    title="Sem lancamentos para a importacao selecionada"
                    description="Selecione outra importacao ou envie um novo arquivo."
                  />
                ) : null}

                {!carregandoItens && !erroItens && itensImportacao.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#F7FAFB] text-xs uppercase tracking-wide text-[#6B8794]">
                        <tr>
                          <th className="px-3 py-3">Data</th>
                          <th className="px-3 py-3">Descricao</th>
                          <th className="px-3 py-3">Documento</th>
                          <th className="px-3 py-3">Tipo</th>
                          <th className="px-3 py-3">Valor</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Conta vinculada</th>
                          <th className="px-3 py-3 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensImportacao.map((item) => {
                          const processando = processandoItemId === item.id;
                          return (
                            <tr key={item.id} className="border-t border-[#EDF2F4] text-[#244455]">
                              <td className="px-3 py-3">{formatDate(item.dataLancamento)}</td>
                              <td className="px-3 py-3">{item.descricao}</td>
                              <td className="px-3 py-3">{item.documento || item.referenciaExterna || '-'}</td>
                              <td className="px-3 py-3">{tipoBadge(item.tipo)}</td>
                              <td className="px-3 py-3">{moneyFmt.format(item.valor)}</td>
                              <td className="px-3 py-3">
                                {item.conciliado ? (
                                  <span className="inline-flex items-center rounded-full border border-[#BEE6CF] bg-[#F1FBF5] px-2.5 py-1 text-xs font-semibold text-[#137A42]">
                                    Conciliado{item.conciliacaoOrigem ? ` (${item.conciliacaoOrigem})` : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full border border-[#F2D8A6] bg-[#FFF8EA] px-2.5 py-1 text-xs font-semibold text-[#8C5A07]">
                                    Pendente
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {item.contaPagarId ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-[#244455]">
                                      {item.contaPagarNumero || item.contaPagarId}
                                    </p>
                                    <p className="text-xs text-[#6B8794]">{item.contaPagarDescricao || '-'}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#6B8794]">Nao conciliado</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className={btnSecondary}
                                    onClick={() => void abrirConciliacaoManual(item)}
                                    disabled={processando}
                                  >
                                    <Link2 className="h-4 w-4" />
                                    {item.conciliado ? 'Ajustar' : 'Conciliar'}
                                  </button>
                                  {item.conciliado ? (
                                    <button
                                      type="button"
                                      className={btnDanger}
                                      onClick={() => void desfazerConciliacao(item)}
                                      disabled={processando}
                                    >
                                      <Link2Off className="h-4 w-4" />
                                      Desfazer
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </DataTableCard>

              {itemEmEdicao ? (
                <SectionCard className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#244455]">Conciliacao manual do item</p>
                      <p className="text-xs text-[#6B8794]">
                        {formatDate(itemEmEdicao.dataLancamento)} - {itemEmEdicao.descricao} (
                        {moneyFmt.format(itemEmEdicao.valor)})
                      </p>
                    </div>
                    <button type="button" className={btnSecondary} onClick={fecharConciliacaoManual}>
                      Fechar
                    </button>
                  </div>

                  {carregandoCandidatos ? <LoadingSkeleton lines={3} /> : null}

                  {!carregandoCandidatos ? (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                      <div className="lg:col-span-8">
                        <label className="mb-2 block text-sm font-medium text-[#385A6A]">
                          Conta a pagar candidata
                        </label>
                        <select
                          value={contaPagarSelecionadaId}
                          onChange={(event) => setContaPagarSelecionadaId(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                        >
                          <option value="">Selecione uma conta</option>
                          {candidatosConciliacao.map((candidato) => (
                            <option key={candidato.id} value={candidato.id}>
                              {candidato.numero} | {moneyFmt.format(candidato.valorPago)} | score {candidato.score.toFixed(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-4">
                        <label className="mb-2 block text-sm font-medium text-[#385A6A]">
                          Observacao (opcional)
                        </label>
                        <input
                          type="text"
                          value={observacaoConciliacao}
                          onChange={(event) => setObservacaoConciliacao(event.target.value)}
                          placeholder="Motivo do ajuste"
                          className="h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15"
                        />
                      </div>
                    </div>
                  ) : null}

                  {!carregandoCandidatos && candidatosConciliacao.length > 0 ? (
                    <p className="text-xs text-[#6B8794]">
                      Melhor candidato: {candidatosConciliacao[0].numero} com score{' '}
                      {candidatosConciliacao[0].score.toFixed(1)} (
                      {candidatosConciliacao[0].criterios.join(', ') || 'sem criterio'})
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => void confirmarConciliacaoManual()}
                      disabled={!contaPagarSelecionadaId || processandoItemId === itemEmEdicao.id}
                    >
                      <Link2 className="h-4 w-4" />
                      Confirmar conciliacao
                    </button>
                    {itemEmEdicao.conciliado ? (
                      <button
                        type="button"
                        className={btnDanger}
                        onClick={() => void desfazerConciliacao(itemEmEdicao)}
                        disabled={processandoItemId === itemEmEdicao.id}
                      >
                        <Link2Off className="h-4 w-4" />
                        Desfazer conciliacao
                      </button>
                    ) : null}
                  </div>
                </SectionCard>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
