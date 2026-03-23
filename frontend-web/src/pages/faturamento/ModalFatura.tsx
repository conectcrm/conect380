import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, FileText, DollarSign } from 'lucide-react';
import {
  faturamentoService,
  NovaFatura,
  ItemFatura,
  TipoFatura,
  FormaPagamento,
  Fatura,
  TipoDocumentoFinanceiro as TipoDocumentoFinanceiroApi,
} from '../../services/faturamentoService';
import ClienteSelect, { ClienteSelectValue } from '../../components/selects/ClienteSelect';
import ContratoSelect from '../../components/selects/ContratoSelect';
import MoneyInput from '../../components/inputs/MoneyInput';
import MoneyInputNoPrefix from '../../components/inputs/MoneyInputNoPrefix';
import NumberInput from '../../components/inputs/NumberInput';
import PercentInput from '../../components/inputs/PercentInput';
import { formatarValorMonetario } from '../../utils/formatacao';
import { useAuth } from '../../hooks/useAuth';

interface ModalFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dadosFatura: NovaFatura) => void;
  fatura?: Fatura | null;
}

type ItemFormulario = Omit<ItemFatura, 'id' | 'valorTotal'>;
const UNIDADE_PADRAO = 'un';
const LIMITE_UNIDADE = 10;

const normalizarUnidadeItem = (unidade?: string): string => {
  const unidadeNormalizada = String(unidade || '').trim();
  if (!unidadeNormalizada) {
    return UNIDADE_PADRAO;
  }
  return unidadeNormalizada.slice(0, LIMITE_UNIDADE);
};

const criarNovoItemPadrao = (): ItemFormulario => ({
  descricao: '',
  quantidade: 0,
  valorUnitario: 0,
  unidade: UNIDADE_PADRAO,
  codigoProduto: '',
  percentualDesconto: 0,
  valorDesconto: 0,
});

const criarFaturaPadrao = (usuarioResponsavelId: string): NovaFatura => ({
  contratoId: '',
  clienteId: '',
  usuarioResponsavelId,
  tipo: TipoFatura.UNICA,
  dataVencimento: '',
  formaPagamento: FormaPagamento.PIX,
  observacoes: '',
  percentualDesconto: 0,
  valorDesconto: 0,
  valorImpostos: 0,
  percentualImpostos: null,
  diasCarenciaJuros: 0,
  percentualJuros: 0,
  percentualMulta: 0,
  detalhesTributarios: undefined,
  itens: [],
});

type PeriodicidadeRecorrencia = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
const PERIODICIDADES_RECORRENCIA: PeriodicidadeRecorrencia[] = [
  'mensal',
  'bimestral',
  'trimestral',
  'semestral',
  'anual',
];

interface ConfiguracaoTipoFatura {
  periodicidadeRecorrencia: PeriodicidadeRecorrencia;
  limiteCiclos: number | null;
  quantidadeParcelas: number;
  intervaloParcelasDias: number;
}

interface ConfiguracaoFinanceiraAvancada {
  diasCarenciaJuros: number;
  percentualJuros: number;
  percentualMulta: number;
  valorImpostos: number;
}

type TipoDocumentoFinanceiro = TipoDocumentoFinanceiroApi;

type TributoCodigo = 'icms' | 'pis' | 'cofins' | 'iss' | 'ipi' | 'outros';

interface DocumentoFinanceiroConfig {
  tipo: TipoDocumentoFinanceiro;
  modelo: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  motivoEdicaoManual: string;
}

interface TributoDetalhadoValor {
  valor: number;
  percentual: number;
}

type TributosDetalhadosConfig = Record<TributoCodigo, TributoDetalhadoValor>;

interface MetadadosFatura {
  versao: number;
  tipo: ConfiguracaoTipoFatura;
  financeiro: ConfiguracaoFinanceiraAvancada;
}

const CONFIG_TIPO_PADRAO: ConfiguracaoTipoFatura = {
  periodicidadeRecorrencia: 'mensal',
  limiteCiclos: null,
  quantidadeParcelas: 2,
  intervaloParcelasDias: 30,
};

const CONFIG_FINANCEIRA_PADRAO: ConfiguracaoFinanceiraAvancada = {
  diasCarenciaJuros: 0,
  percentualJuros: 0,
  percentualMulta: 0,
  valorImpostos: 0,
};

const TIPOS_DOCUMENTO_FINANCEIRO: Array<{
  value: TipoDocumentoFinanceiro;
  label: string;
}> = [
  { value: 'fatura', label: 'Fatura comercial' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'nfse', label: 'NFS-e (servico)' },
  { value: 'nfe', label: 'NF-e (produto)' },
  { value: 'folha_pagamento', label: 'Folha de pagamento' },
  { value: 'outro', label: 'Outro documento' },
];

const TIPOS_DOCUMENTO_FISCAL = new Set<TipoDocumentoFinanceiro>(['nfse', 'nfe']);

const TRIBUTOS_META: Array<{ codigo: TributoCodigo; label: string }> = [
  { codigo: 'icms', label: 'ICMS' },
  { codigo: 'pis', label: 'PIS' },
  { codigo: 'cofins', label: 'COFINS' },
  { codigo: 'iss', label: 'ISS' },
  { codigo: 'ipi', label: 'IPI' },
  { codigo: 'outros', label: 'Outros' },
];

const DOCUMENTO_FINANCEIRO_PADRAO: DocumentoFinanceiroConfig = {
  tipo: 'fatura',
  modelo: '',
  numero: '',
  serie: '',
  chaveAcesso: '',
  motivoEdicaoManual: '',
};

const normalizarDigitos = (value: string): string => String(value || '').replace(/\D/g, '');

const gerarPreviewIdentificadoresFiscais = (
  tipo: TipoDocumentoFinanceiro,
): { numero: string; serie: string; chave: string } | null => {
  if (!TIPOS_DOCUMENTO_FISCAL.has(tipo)) {
    return null;
  }

  const agora = new Date();
  const seed = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(
    agora.getDate(),
  ).padStart(2, '0')}${String(agora.getHours()).padStart(2, '0')}${String(
    agora.getMinutes(),
  ).padStart(2, '0')}${String(agora.getSeconds()).padStart(2, '0')}${String(
    agora.getMilliseconds(),
  ).padStart(3, '0')}`;

  if (tipo === 'nfe') {
    return {
      numero: seed.slice(-9),
      serie: '001',
      chave: 'Gerada na autorizacao SEFAZ (44 digitos)',
    };
  }

  return {
    numero: seed.slice(-10),
    serie: 'A1',
    chave: 'Gerada no provedor municipal de NFS-e',
  };
};

const TRIBUTOS_DETALHADOS_PADRAO: TributosDetalhadosConfig = {
  icms: { valor: 0, percentual: 0 },
  pis: { valor: 0, percentual: 0 },
  cofins: { valor: 0, percentual: 0 },
  iss: { valor: 0, percentual: 0 },
  ipi: { valor: 0, percentual: 0 },
  outros: { valor: 0, percentual: 0 },
};

const METADADOS_INICIO = '[CONFIG_FATURA]';
const METADADOS_FIM = '[/CONFIG_FATURA]';

const normalizarNumero = (valor: unknown, fallback = 0): number => {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
};

const roundMoney = (valor: number): number =>
  Math.round((normalizarNumero(valor, 0) + Number.EPSILON) * 100) / 100;

const extrairMensagemErro = (error: unknown, fallback: string): string => {
  const responseMessage =
    typeof (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message ===
    'string'
      ? String((error as { response?: { data?: { message?: unknown } } }).response?.data?.message)
      : '';
  const errorMessage =
    typeof (error as { message?: unknown })?.message === 'string'
      ? String((error as { message?: unknown }).message)
      : '';

  return responseMessage.trim() || errorMessage.trim() || fallback;
};

const extrairMetadadosObservacoes = (observacoes?: string): {
  textoLimpo: string;
  metadados: MetadadosFatura | null;
} => {
  const textoOriginal = String(observacoes || '');
  const inicio = textoOriginal.indexOf(METADADOS_INICIO);
  const fim = textoOriginal.indexOf(METADADOS_FIM);

  if (inicio === -1 || fim === -1 || fim < inicio) {
    return { textoLimpo: textoOriginal.trim(), metadados: null };
  }

  const conteudo = textoOriginal
    .slice(inicio + METADADOS_INICIO.length, fim)
    .trim();

  const textoSemMetadados = `${textoOriginal.slice(0, inicio)}${textoOriginal.slice(
    fim + METADADOS_FIM.length,
  )}`.trim();

  try {
    const parsed = JSON.parse(conteudo) as Partial<MetadadosFatura>;
    const periodicidade =
      parsed?.tipo?.periodicidadeRecorrencia &&
      PERIODICIDADES_RECORRENCIA.includes(parsed.tipo.periodicidadeRecorrencia)
        ? parsed.tipo.periodicidadeRecorrencia
        : 'mensal';

    const metadados: MetadadosFatura = {
      versao: normalizarNumero(parsed?.versao, 1),
      tipo: {
        periodicidadeRecorrencia: periodicidade,
        limiteCiclos:
          parsed?.tipo?.limiteCiclos == null
            ? null
            : Math.max(1, normalizarNumero(parsed.tipo.limiteCiclos, 1)),
        quantidadeParcelas: Math.max(2, normalizarNumero(parsed?.tipo?.quantidadeParcelas, 2)),
        intervaloParcelasDias: Math.max(
          1,
          normalizarNumero(parsed?.tipo?.intervaloParcelasDias, 30),
        ),
      },
      financeiro: {
        diasCarenciaJuros: Math.max(
          0,
          Math.trunc(normalizarNumero(parsed?.financeiro?.diasCarenciaJuros, 0)),
        ),
        percentualJuros: Math.max(0, normalizarNumero(parsed?.financeiro?.percentualJuros, 0)),
        percentualMulta: Math.max(0, normalizarNumero(parsed?.financeiro?.percentualMulta, 0)),
        valorImpostos: Math.max(0, normalizarNumero(parsed?.financeiro?.valorImpostos, 0)),
      },
    };

    return {
      textoLimpo: textoSemMetadados,
      metadados,
    };
  } catch {
    return {
      textoLimpo: textoSemMetadados || textoOriginal.trim(),
      metadados: null,
    };
  }
};

const extrairConfigTipoDosDetalhes = (
  detalhes?: Record<string, unknown> | null,
): ConfiguracaoTipoFatura | null => {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
    return null;
  }

  const tipoRaw =
    (detalhes.tipo as Partial<ConfiguracaoTipoFatura> | undefined) ||
    (detalhes.configuracaoTipo as Partial<ConfiguracaoTipoFatura> | undefined);

  if (!tipoRaw || typeof tipoRaw !== 'object') {
    return null;
  }

  const periodicidade =
    tipoRaw.periodicidadeRecorrencia &&
    PERIODICIDADES_RECORRENCIA.includes(tipoRaw.periodicidadeRecorrencia)
      ? tipoRaw.periodicidadeRecorrencia
      : 'mensal';

  return {
    periodicidadeRecorrencia: periodicidade,
    limiteCiclos:
      tipoRaw.limiteCiclos == null ? null : Math.max(1, normalizarNumero(tipoRaw.limiteCiclos, 1)),
    quantidadeParcelas: Math.max(2, normalizarNumero(tipoRaw.quantidadeParcelas, 2)),
    intervaloParcelasDias: Math.max(1, normalizarNumero(tipoRaw.intervaloParcelasDias, 30)),
  };
};

const extrairDocumentoFinanceiroDosDetalhes = (
  detalhes?: Record<string, unknown> | null,
): DocumentoFinanceiroConfig => {
  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
    return DOCUMENTO_FINANCEIRO_PADRAO;
  }

  const documentoRaw = detalhes.documento;
  if (!documentoRaw || typeof documentoRaw !== 'object' || Array.isArray(documentoRaw)) {
    return DOCUMENTO_FINANCEIRO_PADRAO;
  }

  const documento = documentoRaw as Record<string, unknown>;
  const tipoRaw = String(documento.tipo || 'fatura').trim().toLowerCase() as TipoDocumentoFinanceiro;
  const tipo = TIPOS_DOCUMENTO_FINANCEIRO.some((option) => option.value === tipoRaw)
    ? tipoRaw
    : 'fatura';

  return {
    tipo,
    modelo: String(documento.modelo || '').trim(),
    numero: String(documento.numero || '').trim(),
    serie: String(documento.serie || '').trim(),
    chaveAcesso: String(documento.chaveAcesso || '').trim(),
    motivoEdicaoManual: String(
      documento.motivoEdicaoManual || documento.manualReason || documento.motivoManual || '',
    ).trim(),
  };
};

const extrairTributosDetalhadosDosDetalhes = (
  detalhes?: Record<string, unknown> | null,
): TributosDetalhadosConfig => {
  const base: TributosDetalhadosConfig = {
    icms: { ...TRIBUTOS_DETALHADOS_PADRAO.icms },
    pis: { ...TRIBUTOS_DETALHADOS_PADRAO.pis },
    cofins: { ...TRIBUTOS_DETALHADOS_PADRAO.cofins },
    iss: { ...TRIBUTOS_DETALHADOS_PADRAO.iss },
    ipi: { ...TRIBUTOS_DETALHADOS_PADRAO.ipi },
    outros: { ...TRIBUTOS_DETALHADOS_PADRAO.outros },
  };

  if (!detalhes || typeof detalhes !== 'object' || Array.isArray(detalhes)) {
    return base;
  }

  const tributosRaw = detalhes.tributos;
  if (!tributosRaw || typeof tributosRaw !== 'object' || Array.isArray(tributosRaw)) {
    return base;
  }

  const itens = (tributosRaw as Record<string, unknown>).itens;
  if (!Array.isArray(itens)) {
    return base;
  }

  itens.forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return;
    }

    const raw = item as Record<string, unknown>;
    const codigoRaw = String(raw.codigo || '').trim().toLowerCase() as TributoCodigo;
    if (!TRIBUTOS_META.some((tributo) => tributo.codigo === codigoRaw)) {
      return;
    }

    base[codigoRaw] = {
      valor: Math.max(0, normalizarNumero(raw.valor, 0)),
      percentual: Math.max(0, Math.min(100, normalizarNumero(raw.percentual, 0))),
    };
  });

  return base;
};

export default function ModalFatura({
  isOpen,
  onClose,
  onSave,
  fatura,
}: ModalFaturaProps) {
  const { user } = useAuth();
  const usuarioResponsavelId = String(user?.id || '').trim();
  const roleNormalizado = String(user?.role || '')
    .trim()
    .toLowerCase();
  const permissoesNormalizadas = React.useMemo(() => {
    return new Set(
      [
        ...(Array.isArray(user?.permissions) ? user.permissions : []),
        ...(Array.isArray(user?.permissoes) ? user.permissoes : []),
      ]
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean),
    );
  }, [user?.permissions, user?.permissoes]);
  const podeUsarDocumentoFiscalManual =
    roleNormalizado === 'superadmin' ||
    roleNormalizado === 'admin' ||
    roleNormalizado === 'financeiro' ||
    permissoesNormalizadas.has('admin.empresas.manage');

  const [formData, setFormData] = useState<NovaFatura>(() => criarFaturaPadrao(''));
  const [novoItem, setNovoItem] = useState<ItemFormulario>(() => criarNovoItemPadrao());

  const [totais, setTotais] = useState({
    subtotal: 0,
    desconto: 0,
    total: 0,
  });

  const [erros, setErros] = useState<{
    clienteId?: string;
    contratoId?: string;
    dataVencimento?: string;
    itens?: string;
    configuracaoTipo?: string;
    documentoFinanceiro?: string;
    financeiro?: string;
    geral?: string;
  }>({});

  const [salvando, setSalvando] = useState(false);
  const [configTipo, setConfigTipo] = useState<ConfiguracaoTipoFatura>(CONFIG_TIPO_PADRAO);
  const [configFinanceira, setConfigFinanceira] = useState<ConfiguracaoFinanceiraAvancada>(
    CONFIG_FINANCEIRA_PADRAO,
  );
  const [documentoFinanceiro, setDocumentoFinanceiro] = useState<DocumentoFinanceiroConfig>(
    DOCUMENTO_FINANCEIRO_PADRAO,
  );
  const [documentoFiscalAuto, setDocumentoFiscalAuto] = useState(true);
  const [gerandoNumeroDocumento, setGerandoNumeroDocumento] = useState(false);
  const [tributosDetalhados, setTributosDetalhados] = useState<TributosDetalhadosConfig>(
    TRIBUTOS_DETALHADOS_PADRAO,
  );

  // Estados para os selects de cliente e contrato
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteSelectValue | null>(null);

  const [contratoSelecionado, setContratoSelecionado] = useState<{
    id: string;
    numero: string;
    cliente?: {
      id?: string;
      nome: string;
      email: string;
    };
    valor?: number;
    status?: string;
    dataEmissao?: Date;
    dataVencimento?: Date;
    descricao?: string;
  } | null>(null);

  const tipoExigeContrato =
    formData.tipo === TipoFatura.RECORRENTE ||
    formData.tipo === TipoFatura.PARCELA ||
    formData.tipo === TipoFatura.ADICIONAL;

  const totalTributosDetalhados = TRIBUTOS_META.reduce((acc, tributo) => {
    return acc + Math.max(0, normalizarNumero(tributosDetalhados[tributo.codigo]?.valor, 0));
  }, 0);
  const ajusteManualImpostos = Math.max(0, normalizarNumero(configFinanceira.valorImpostos, 0));
  const valorImpostosEfetivo = roundMoney(totalTributosDetalhados + ajusteManualImpostos);
  const totalComImpostos = Math.max(0, totais.total + valorImpostosEfetivo);
  const jurosEstimado = Math.max(0, (totalComImpostos * configFinanceira.percentualJuros) / 100);
  const multaEstimada = Math.max(0, (totalComImpostos * configFinanceira.percentualMulta) / 100);
  const totalProjetadoAtraso = totalComImpostos + jurosEstimado + multaEstimada;
  const tipoDocumentoFiscalSelecionado = TIPOS_DOCUMENTO_FISCAL.has(documentoFinanceiro.tipo);
  const previewDocumentoFiscal = React.useMemo(
    () =>
      documentoFiscalAuto
        ? gerarPreviewIdentificadoresFiscais(documentoFinanceiro.tipo)
        : null,
    [documentoFiscalAuto, documentoFinanceiro.tipo, fatura?.id, isOpen],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (fatura) {
      const { textoLimpo, metadados } = extrairMetadadosObservacoes(fatura.observacoes);
      const configTipoEstruturada = extrairConfigTipoDosDetalhes(fatura.detalhesTributarios);
      const documentoFinanceiroEstruturado = extrairDocumentoFinanceiroDosDetalhes(
        fatura.detalhesTributarios,
      );
      const tributosDetalhadosEstruturados = extrairTributosDetalhadosDosDetalhes(
        fatura.detalhesTributarios,
      );

      const configFinanceiraEstruturada: ConfiguracaoFinanceiraAvancada = {
        diasCarenciaJuros: Math.max(
          0,
          Math.trunc(
            normalizarNumero(fatura.diasCarenciaJuros, metadados?.financeiro?.diasCarenciaJuros || 0),
          ),
        ),
        percentualJuros: Math.max(
          0,
          normalizarNumero(fatura.percentualJuros, metadados?.financeiro?.percentualJuros || 0),
        ),
        percentualMulta: Math.max(
          0,
          normalizarNumero(fatura.percentualMulta, metadados?.financeiro?.percentualMulta || 0),
        ),
        valorImpostos: Math.max(
          0,
          normalizarNumero(fatura.valorImpostos, metadados?.financeiro?.valorImpostos || 0),
        ),
      };

      setFormData({
        contratoId: fatura.contratoId ? String(fatura.contratoId) : '',
        clienteId: fatura.clienteId ? String(fatura.clienteId) : '',
        usuarioResponsavelId: fatura.usuarioResponsavelId || usuarioResponsavelId,
        tipo: fatura.tipo,
        dataVencimento: fatura.dataVencimento.split('T')[0],
        formaPagamento: fatura.formaPagamento || fatura.formaPagamentoPreferida || FormaPagamento.PIX,
        observacoes: textoLimpo || '',
        percentualDesconto: fatura.percentualDesconto || 0,
        valorDesconto: fatura.valorDesconto || 0,
        valorImpostos: configFinanceiraEstruturada.valorImpostos,
        percentualImpostos:
          fatura.percentualImpostos === undefined ? null : (fatura.percentualImpostos ?? null),
        diasCarenciaJuros: configFinanceiraEstruturada.diasCarenciaJuros,
        percentualJuros: configFinanceiraEstruturada.percentualJuros,
        percentualMulta: configFinanceiraEstruturada.percentualMulta,
        detalhesTributarios:
          fatura.detalhesTributarios && typeof fatura.detalhesTributarios === 'object'
            ? fatura.detalhesTributarios
            : undefined,
        itens: fatura.itens.map((item) => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          unidade: normalizarUnidadeItem(item.unidade),
          codigoProduto: item.codigoProduto,
          percentualDesconto: item.percentualDesconto,
          valorDesconto: item.valorDesconto,
        })),
      });

      if (fatura.clienteId) {
        setClienteSelecionado({
          id: String(fatura.clienteId),
          nome: fatura.cliente?.nome || `Cliente ID: ${fatura.clienteId}`,
          email: fatura.cliente?.email,
          telefone: fatura.cliente?.telefone,
          documento: fatura.cliente?.documento,
          tipo: fatura.cliente?.tipo,
        });
      } else {
        setClienteSelecionado(null);
      }

      if (fatura.contratoId) {
        setContratoSelecionado({
          id: String(fatura.contratoId),
          numero: `CT${fatura.contratoId}`,
          cliente: fatura.cliente,
        });
      } else {
        setContratoSelecionado(null);
      }

      setConfigTipo(configTipoEstruturada ?? metadados?.tipo ?? CONFIG_TIPO_PADRAO);
      setConfigFinanceira(configFinanceiraEstruturada);
      setDocumentoFinanceiro(documentoFinanceiroEstruturado);
      if (TIPOS_DOCUMENTO_FISCAL.has(documentoFinanceiroEstruturado.tipo)) {
        const possuiIdentificadoresManuais = Boolean(
          documentoFinanceiroEstruturado.numero.trim() ||
            documentoFinanceiroEstruturado.serie.trim() ||
            documentoFinanceiroEstruturado.chaveAcesso.trim(),
        );
        setDocumentoFiscalAuto(!possuiIdentificadoresManuais);
      } else {
        setDocumentoFiscalAuto(true);
      }
      setTributosDetalhados(tributosDetalhadosEstruturados);
    } else {
      setFormData(criarFaturaPadrao(usuarioResponsavelId));
      setClienteSelecionado(null);
      setContratoSelecionado(null);
      setConfigTipo(CONFIG_TIPO_PADRAO);
      setConfigFinanceira(CONFIG_FINANCEIRA_PADRAO);
      setDocumentoFinanceiro(DOCUMENTO_FINANCEIRO_PADRAO);
      setDocumentoFiscalAuto(true);
      setTributosDetalhados(TRIBUTOS_DETALHADOS_PADRAO);
    }

    setNovoItem(criarNovoItemPadrao());
    setErros({});
  }, [fatura, isOpen]);

  useEffect(() => {
    if (!isOpen || salvando) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, salvando]);

  useEffect(() => {
    if (TIPOS_DOCUMENTO_FISCAL.has(documentoFinanceiro.tipo)) {
      return;
    }
    if (!documentoFiscalAuto) {
      setDocumentoFiscalAuto(true);
    }
  }, [documentoFinanceiro.tipo, documentoFiscalAuto]);

  // Handlers para mudança dos selects
  const handleClienteChange = (cliente: typeof clienteSelecionado) => {
    setClienteSelecionado(cliente);
    setFormData((prev) => ({
      ...prev,
      clienteId: cliente?.id || '', // UUID string
    }));
    setErros((prev) => ({ ...prev, clienteId: undefined }));

    // Limpar contrato se mudou o cliente
    if (contratoSelecionado && cliente?.id !== contratoSelecionado.cliente?.id) {
      setContratoSelecionado(null);
      setFormData((prev) => ({
        ...prev,
        contratoId: '',
      }));
    }
  };

  const handleContratoChange = (contrato: typeof contratoSelecionado) => {
    setContratoSelecionado(contrato);
    setFormData((prev) => ({
      ...prev,
      contratoId: contrato ? contrato.id : '',
    }));
    setErros((prev) => ({ ...prev, contratoId: undefined, configuracaoTipo: undefined }));
  };

  const handleTipoFaturaChange = (tipo: TipoFatura) => {
    setFormData((prev) => ({ ...prev, tipo }));
    setErros((prev) => ({ ...prev, contratoId: undefined, configuracaoTipo: undefined }));
  };

  const handleDocumentoFinanceiroChange = <K extends keyof DocumentoFinanceiroConfig>(
    campo: K,
    valor: DocumentoFinanceiroConfig[K],
  ) => {
    setDocumentoFinanceiro((prev) => ({ ...prev, [campo]: valor }));
    setErros((prev) => ({ ...prev, documentoFinanceiro: undefined }));
  };

  const handleToggleDocumentoFiscalAuto = (value: boolean) => {
    if (!value && !podeUsarDocumentoFiscalManual) {
      setErros((prev) => ({
        ...prev,
        documentoFinanceiro:
          'Modo manual restrito a perfis financeiro/admin. Mantenha geracao automatica.',
      }));
      return;
    }

    setDocumentoFiscalAuto(value);
    setErros((prev) => ({ ...prev, documentoFinanceiro: undefined }));
    if (value) {
      setDocumentoFinanceiro((prev) => ({
        ...prev,
        numero: '',
        serie: '',
        chaveAcesso: '',
        motivoEdicaoManual: '',
      }));
    }
  };

  const handleGerarNumeroDocumentoFinanceiro = async () => {
    if (tipoDocumentoFiscalSelecionado || gerandoNumeroDocumento || salvando) {
      return;
    }

    setGerandoNumeroDocumento(true);
    setErros((prev) => ({ ...prev, documentoFinanceiro: undefined }));

    try {
      const resultado = await faturamentoService.gerarNumeroDocumentoFinanceiro(
        documentoFinanceiro.tipo,
      );
      setDocumentoFinanceiro((prev) => ({
        ...prev,
        numero: resultado.numero,
      }));
    } catch (error) {
      setErros((prev) => ({
        ...prev,
        documentoFinanceiro: extrairMensagemErro(
          error,
          'Nao foi possivel gerar o numero do documento automaticamente.',
        ),
      }));
    } finally {
      setGerandoNumeroDocumento(false);
    }
  };

  const handleTributoDetalhadoChange = (
    codigo: TributoCodigo,
    campo: keyof TributoDetalhadoValor,
    valor: number,
  ) => {
    setTributosDetalhados((prev) => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [campo]:
          campo === 'percentual'
            ? Math.max(0, Math.min(100, normalizarNumero(valor, 0)))
            : Math.max(0, normalizarNumero(valor, 0)),
      },
    }));
  };

  useEffect(() => {
    calcularTotais();
  }, [formData.itens, formData.percentualDesconto, formData.valorDesconto]);

  const calcularTotais = () => {
    const subtotal = formData.itens.reduce((acc, item) => {
      return acc + item.quantidade * item.valorUnitario;
    }, 0);

    const descontoItens = formData.itens.reduce((acc, item) => {
      const subtotalItem = item.quantidade * item.valorUnitario;
      const descontoItem =
        item.valorDesconto || (subtotalItem * (item.percentualDesconto || 0)) / 100;
      return acc + descontoItem;
    }, 0);

    const descontoGeral =
      formData.valorDesconto || (subtotal * (formData.percentualDesconto || 0)) / 100;
    const descontoTotal = descontoItens + descontoGeral;
    const total = subtotal - descontoTotal;

    setTotais({
      subtotal,
      desconto: descontoTotal,
      total: Math.max(0, total),
    });
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0 || novoItem.valorUnitario <= 0) {
      setErros((prev) => ({
        ...prev,
        itens: 'Preencha descrição, quantidade e valor unitário válidos para o item.',
      }));
      return;
    }

    const item = {
      ...novoItem,
      unidade: normalizarUnidadeItem(novoItem.unidade),
    };
    setFormData((prev) => ({
      ...prev,
      itens: [...prev.itens, item],
    }));
    setErros((prev) => ({ ...prev, itens: undefined }));

    setNovoItem(criarNovoItemPadrao());
  };

  const removerItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  };

  const atualizarItem = <K extends keyof ItemFormulario>(
    index: number,
    campo: K,
    valor: ItemFormulario[K],
  ) => {
    const valorAtualizado =
      campo === 'unidade'
        ? (normalizarUnidadeItem(String(valor || '')) as ItemFormulario[K])
        : valor;

    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) =>
        i === index ? { ...item, [campo]: valorAtualizado } : item,
      ),
    }));
  };

  const validarFormulario = (): boolean => {
    const novosErros: typeof erros = {};

    // Validar cliente
    if (!formData.clienteId || formData.clienteId.trim() === '') {
      novosErros.clienteId = 'Cliente é obrigatório.';
    }

    // Regras condicionais por tipo de fatura
    if (tipoExigeContrato && (!formData.contratoId || formData.contratoId.trim() === '')) {
      novosErros.contratoId = 'Contrato é obrigatório para este tipo de fatura.';
    }

    // Validar data de vencimento
    if (!formData.dataVencimento) {
      novosErros.dataVencimento = 'Data de vencimento é obrigatória.';
    } else {
      const dataVencimento = new Date(formData.dataVencimento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataVencimento < hoje) {
        novosErros.dataVencimento = 'Data de vencimento não pode ser anterior a hoje.';
      }
    }

    // Validar itens
    if (formData.itens.length === 0) {
      novosErros.itens = 'Pelo menos um item é obrigatório.';
    } else {
      const itemInvalido = formData.itens.find(
        (item) =>
          !item.descricao.trim() ||
          item.quantidade <= 0 ||
          item.valorUnitario <= 0 ||
          !normalizarUnidadeItem(item.unidade).trim(),
      );
      if (itemInvalido) {
        novosErros.itens =
          'Todos os itens devem ter descrição, quantidade, unidade e valor válidos.';
      }
    }

    if (formData.tipo === TipoFatura.RECORRENTE) {
      if (!configTipo.periodicidadeRecorrencia) {
        novosErros.configuracaoTipo = 'Selecione a periodicidade da recorrência.';
      }
      if (configTipo.limiteCiclos !== null && configTipo.limiteCiclos < 1) {
        novosErros.configuracaoTipo =
          'Quando informado, o limite de ciclos deve ser maior ou igual a 1.';
      }
    }

    if (formData.tipo === TipoFatura.PARCELA) {
      if (configTipo.quantidadeParcelas < 2) {
        novosErros.configuracaoTipo = 'Fatura parcelada deve ter pelo menos 2 parcelas.';
      } else if (configTipo.intervaloParcelasDias < 1) {
        novosErros.configuracaoTipo =
          'Intervalo entre parcelas deve ser maior ou igual a 1 dia.';
      }
    }

    const tipoDocumentoFiscal = TIPOS_DOCUMENTO_FISCAL.has(documentoFinanceiro.tipo);
    if (tipoDocumentoFiscal && !documentoFiscalAuto) {
      const numeroDocumento = documentoFinanceiro.numero.trim();
      const serieDocumento = documentoFinanceiro.serie.trim();
      const chaveAcesso = documentoFinanceiro.chaveAcesso.trim();
      const motivoManual = documentoFinanceiro.motivoEdicaoManual.trim();

      if (!numeroDocumento) {
        novosErros.documentoFinanceiro =
          'Informe o numero fiscal ou habilite a geracao automatica.';
      }

      if (!motivoManual && podeUsarDocumentoFiscalManual) {
        novosErros.documentoFinanceiro =
          'Informe o motivo da edicao manual ou habilite a geracao automatica.';
      }

      if (documentoFinanceiro.tipo === 'nfe') {
        const numeroNfe = normalizarDigitos(numeroDocumento);
        const serieNfe = normalizarDigitos(serieDocumento);
        const chaveNfe = normalizarDigitos(chaveAcesso);

        if (numeroDocumento && (numeroNfe.length === 0 || numeroNfe.length > 9)) {
          novosErros.documentoFinanceiro = 'Para NF-e, o numero deve ter ate 9 digitos.';
        } else if (serieDocumento && (serieNfe.length === 0 || serieNfe.length > 3)) {
          novosErros.documentoFinanceiro = 'Para NF-e, a serie deve ter ate 3 digitos.';
        } else if (chaveAcesso && chaveNfe.length !== 44) {
          novosErros.documentoFinanceiro =
            'Para NF-e, a chave de acesso deve ter exatamente 44 digitos.';
        }
      }
    }

    if (
      configFinanceira.percentualJuros < 0 ||
      configFinanceira.percentualJuros > 100 ||
      configFinanceira.percentualMulta < 0 ||
      configFinanceira.percentualMulta > 100 ||
      configFinanceira.valorImpostos < 0 ||
      configFinanceira.diasCarenciaJuros < 0
    ) {
      novosErros.financeiro = 'Revise juros, multa, impostos e carência para valores válidos.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuarioResponsavelId && !usuarioResponsavelId) {
      setErros({
        geral: 'Não foi possível identificar o usuário responsável pela fatura.',
      });
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);
    setErros({});

    try {
      const observacoesBase = formData.observacoes?.trim() || '';
      const ajusteManualImpostosSubmit = Math.max(0, configFinanceira.valorImpostos || 0);
      const tributosItens = TRIBUTOS_META.map((tributo) => {
        const valor = Math.max(0, normalizarNumero(tributosDetalhados[tributo.codigo]?.valor, 0));
        const percentual = Math.max(
          0,
          Math.min(100, normalizarNumero(tributosDetalhados[tributo.codigo]?.percentual, 0)),
        );
        return {
          codigo: tributo.codigo,
          descricao: tributo.label,
          valor: roundMoney(valor),
          percentual: Number(percentual.toFixed(4)),
        };
      }).filter((item) => item.valor > 0 || item.percentual > 0);

      const valorTributosDetalhados = roundMoney(
        tributosItens.reduce((acc, item) => acc + item.valor, 0),
      );
      const valorImpostos = roundMoney(valorTributosDetalhados + ajusteManualImpostosSubmit);
      const percentualImpostosCalculado =
        totais.total > 0 && valorImpostos > 0
          ? Number(((valorImpostos / totais.total) * 100).toFixed(4))
          : null;
      const tipoDocumentoFiscal = TIPOS_DOCUMENTO_FISCAL.has(documentoFinanceiro.tipo);
      const modeloDocumento =
        documentoFinanceiro.modelo.trim() ||
        (documentoFinanceiro.tipo === 'nfe'
          ? '55'
          : documentoFinanceiro.tipo === 'nfse'
            ? 'NFS-e'
            : '');
      const numeroDocumento =
        tipoDocumentoFiscal && documentoFiscalAuto
          ? null
          : documentoFinanceiro.numero.trim() || null;
      const serieDocumento =
        tipoDocumentoFiscal && documentoFiscalAuto
          ? null
          : documentoFinanceiro.serie.trim() || null;
      const chaveDocumento =
        tipoDocumentoFiscal && documentoFiscalAuto
          ? null
          : documentoFinanceiro.chaveAcesso.trim() || null;
      const motivoManualDocumento =
        tipoDocumentoFiscal && !documentoFiscalAuto
          ? documentoFinanceiro.motivoEdicaoManual.trim() || null
          : null;

      await onSave({
        ...formData,
        usuarioResponsavelId: formData.usuarioResponsavelId || usuarioResponsavelId,
        observacoes: observacoesBase,
        valorImpostos,
        percentualImpostos: percentualImpostosCalculado,
        diasCarenciaJuros: Math.max(0, Math.trunc(configFinanceira.diasCarenciaJuros || 0)),
        percentualJuros: Math.max(0, Math.min(100, configFinanceira.percentualJuros || 0)),
        percentualMulta: Math.max(0, Math.min(100, configFinanceira.percentualMulta || 0)),
        detalhesTributarios: {
          versao: 2,
          origem: 'modal_fatura',
          tipo: configTipo,
          documento: {
            tipo: documentoFinanceiro.tipo,
            modelo: modeloDocumento || null,
            numero: numeroDocumento,
            serie: serieDocumento,
            chaveAcesso: chaveDocumento,
            geracaoAutomatica: tipoDocumentoFiscal ? documentoFiscalAuto : false,
            motivoEdicaoManual: motivoManualDocumento,
            emissorEsperado:
              documentoFinanceiro.tipo === 'nfe'
                ? 'sefaz'
                : documentoFinanceiro.tipo === 'nfse'
                  ? 'provedor_municipal'
                  : 'interno',
          },
          tributos: {
            total: valorTributosDetalhados,
            ajusteManual: roundMoney(ajusteManualImpostosSubmit),
            valorImpostosAplicado: valorImpostos,
            itens: tributosItens,
          },
        },
        itens: formData.itens.map((item) => ({
          ...item,
          descricao: item.descricao.trim(),
          unidade: normalizarUnidadeItem(item.unidade),
        })),
      });
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      setErros({ geral: 'Erro ao salvar fatura. Tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  const handleClose = () => {
    if (salvando) {
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[1200px] overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-fatura-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECF7F3]">
              <FileText className="h-4 w-4 text-[#159A9C]" />
            </div>
            <h2 id="modal-fatura-title" className="text-lg font-semibold text-[#173A4D]">
              {fatura ? 'Editar fatura' : 'Nova fatura'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={salvando}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensagem de erro geral */}
          {erros.geral && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro ao salvar fatura</h3>
                  <div className="mt-2 text-sm text-red-700">{erros.geral}</div>
                </div>
              </div>
            </div>
          )}

          {/* Seleção de cliente e contrato */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <ClienteSelect
                  value={clienteSelecionado}
                  onChange={handleClienteChange}
                  required={true}
                  className="w-full"
                  error={erros.clienteId}
                />
              </div>

              <div>
                <ContratoSelect
                  value={contratoSelecionado}
                  onChange={handleContratoChange}
                  clienteId={clienteSelecionado?.id}
                  required={false}
                  className="w-full"
                />
                {erros.contratoId && <p className="mt-1 text-sm text-red-600">{erros.contratoId}</p>}
              </div>
            </div>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de vencimento *
              </label>
              <input
                type="date"
                value={formData.dataVencimento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dataVencimento: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 ${
                  erros.dataVencimento ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {erros.dataVencimento && (
                <p className="text-sm text-red-600 mt-1">{erros.dataVencimento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de fatura *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleTipoFaturaChange(e.target.value as TipoFatura)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value={TipoFatura.UNICA}>Única</option>
                <option value={TipoFatura.RECORRENTE}>Recorrente</option>
                <option value={TipoFatura.PARCELA}>Parcela</option>
                <option value={TipoFatura.ADICIONAL}>Adicional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formData.formaPagamento}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    formaPagamento: e.target.value as FormaPagamento,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
              >
                <option value={FormaPagamento.PIX}>PIX</option>
                <option value={FormaPagamento.CARTAO_CREDITO}>Cartão de Crédito</option>
                <option value={FormaPagamento.CARTAO_DEBITO}>Cartão de Débito</option>
                <option value={FormaPagamento.BOLETO}>Boleto</option>
                <option value={FormaPagamento.TRANSFERENCIA}>Transferência</option>
                <option value={FormaPagamento.DINHEIRO}>Dinheiro</option>
                <option value={FormaPagamento.A_COMBINAR}>A combinar</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-[#E1EAEE] bg-[#FAFCFD] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#173A4D]">
              Documento financeiro
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo de documento
                </label>
                <select
                  value={documentoFinanceiro.tipo}
                  onChange={(event) =>
                    handleDocumentoFinanceiroChange(
                      'tipo',
                      event.target.value as TipoDocumentoFinanceiro,
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                >
                  {TIPOS_DOCUMENTO_FINANCEIRO.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Modelo / referencia
                </label>
                <input
                  type="text"
                  value={documentoFinanceiro.modelo}
                  onChange={(event) =>
                    handleDocumentoFinanceiroChange('modelo', event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder="Ex: 55, NFS-e, recibo interno"
                />
              </div>

              {tipoDocumentoFiscalSelecionado && (
                <div className="md:col-span-2 rounded-md border border-[#DCE8EC] bg-white p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-[#173A4D]">
                    <input
                      type="checkbox"
                      checked={documentoFiscalAuto}
                      onChange={(event) => handleToggleDocumentoFiscalAuto(event.target.checked)}
                      disabled={!podeUsarDocumentoFiscalManual}
                      className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]/30"
                    />
                    Gerar identificadores fiscais automaticamente (recomendado)
                  </label>
                  <p className="mt-1 text-xs text-[#5E7784]">
                    No modo automatico, numero/serie/chave sao definidos no fluxo fiscal na emissao
                    (SEFAZ para NF-e e provedor municipal para NFS-e).
                  </p>
                  {!podeUsarDocumentoFiscalManual && (
                    <p className="mt-1 text-xs font-medium text-[#87614A]">
                      Modo manual disponivel apenas para perfis financeiro/admin.
                    </p>
                  )}
                  {documentoFiscalAuto && previewDocumentoFiscal && (
                    <div className="mt-2 rounded-md border border-dashed border-[#C9DCE2] bg-[#F8FBFC] px-3 py-2 text-xs text-[#46616F]">
                      <p className="font-medium text-[#173A4D]">Pre-visualizacao do padrao automatico</p>
                      <p>Numero sugerido: <strong>{previewDocumentoFiscal.numero}</strong></p>
                      <p>Serie sugerida: <strong>{previewDocumentoFiscal.serie}</strong></p>
                      <p>{previewDocumentoFiscal.chave}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Numero do documento
                  </label>
                  {!tipoDocumentoFiscalSelecionado && (
                    <button
                      type="button"
                      onClick={handleGerarNumeroDocumentoFinanceiro}
                      disabled={gerandoNumeroDocumento || salvando}
                      className="inline-flex h-7 items-center rounded-md border border-[#BFD3DB] bg-white px-2.5 text-xs font-medium text-[#173A4D] transition hover:border-[#159A9C] hover:text-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {gerandoNumeroDocumento ? 'Gerando...' : 'Gerar numero'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={documentoFinanceiro.numero}
                  onChange={(event) =>
                    handleDocumentoFinanceiroChange('numero', event.target.value)
                  }
                  disabled={
                    (tipoDocumentoFiscalSelecionado && documentoFiscalAuto) ||
                    (tipoDocumentoFiscalSelecionado &&
                      !documentoFiscalAuto &&
                      !podeUsarDocumentoFiscalManual)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder={
                    tipoDocumentoFiscalSelecionado && documentoFiscalAuto
                      ? 'Gerado automaticamente na emissao'
                      : 'Numero da nota/recibo/documento'
                  }
                />
                {!tipoDocumentoFiscalSelecionado && (
                  <p className="mt-1 text-xs text-[#5E7784]">
                    Gere automaticamente seguindo o padrao por tipo e ano (empresa atual).
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Serie</label>
                <input
                  type="text"
                  value={documentoFinanceiro.serie}
                  onChange={(event) =>
                    handleDocumentoFinanceiroChange('serie', event.target.value)
                  }
                  disabled={
                    (tipoDocumentoFiscalSelecionado && documentoFiscalAuto) ||
                    (tipoDocumentoFiscalSelecionado &&
                      !documentoFiscalAuto &&
                      !podeUsarDocumentoFiscalManual)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                  placeholder={
                    tipoDocumentoFiscalSelecionado && documentoFiscalAuto
                      ? 'Gerada automaticamente na emissao'
                      : 'Serie (quando houver)'
                  }
                />
              </div>

              {tipoDocumentoFiscalSelecionado && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Chave de acesso / protocolo
                  </label>
                  <input
                    type="text"
                    value={documentoFinanceiro.chaveAcesso}
                    onChange={(event) =>
                      handleDocumentoFinanceiroChange('chaveAcesso', event.target.value)
                    }
                    disabled={documentoFiscalAuto || !podeUsarDocumentoFiscalManual}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    placeholder={
                      documentoFiscalAuto
                        ? 'Gerada automaticamente no autorizador fiscal'
                        : 'Opcional (44 digitos para NF-e)'
                    }
                  />
                </div>
              )}

              {tipoDocumentoFiscalSelecionado && !documentoFiscalAuto && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Motivo da edicao manual *
                  </label>
                  <textarea
                    value={documentoFinanceiro.motivoEdicaoManual}
                    onChange={(event) =>
                      handleDocumentoFinanceiroChange('motivoEdicaoManual', event.target.value)
                    }
                    disabled={!podeUsarDocumentoFiscalManual}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    placeholder="Ex: documento emitido fora do sistema / ajuste de migracao."
                  />
                </div>
              )}
            </div>
            {erros.documentoFinanceiro && (
              <p className="text-xs font-medium text-red-600">{erros.documentoFinanceiro}</p>
            )}
          </div>

          {(formData.tipo === TipoFatura.RECORRENTE ||
            formData.tipo === TipoFatura.PARCELA ||
            formData.tipo === TipoFatura.ADICIONAL) && (
            <div className="space-y-4 rounded-xl border border-[#E1EAEE] bg-[#FAFCFD] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#173A4D]">
                Configuração por tipo de fatura
              </h3>

              {tipoExigeContrato && (
                <p className="text-xs text-[#5E7784]">
                  Este tipo de fatura deve estar vinculado a um contrato.
                </p>
              )}

              {formData.tipo === TipoFatura.RECORRENTE && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Periodicidade
                    </label>
                    <select
                      value={configTipo.periodicidadeRecorrencia}
                      onChange={(e) =>
                        setConfigTipo((prev) => ({
                          ...prev,
                          periodicidadeRecorrencia: e.target.value as PeriodicidadeRecorrencia,
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    >
                      {PERIODICIDADES_RECORRENCIA.map((periodicidade) => (
                        <option key={periodicidade} value={periodicidade}>
                          {periodicidade.charAt(0).toUpperCase() + periodicidade.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Limite de ciclos (opcional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={configTipo.limiteCiclos ?? ''}
                      onChange={(e) =>
                        setConfigTipo((prev) => ({
                          ...prev,
                          limiteCiclos:
                            e.target.value === ''
                              ? null
                              : Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                      placeholder="Sem limite"
                    />
                  </div>
                </div>
              )}

              {formData.tipo === TipoFatura.PARCELA && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quantidade de parcelas
                    </label>
                    <input
                      type="number"
                      min={2}
                      value={configTipo.quantidadeParcelas}
                      onChange={(e) =>
                        setConfigTipo((prev) => ({
                          ...prev,
                          quantidadeParcelas: Math.max(
                            2,
                            Number.parseInt(e.target.value, 10) || 2,
                          ),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Intervalo entre parcelas (dias)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={configTipo.intervaloParcelasDias}
                      onChange={(e) =>
                        setConfigTipo((prev) => ({
                          ...prev,
                          intervaloParcelasDias: Math.max(
                            1,
                            Number.parseInt(e.target.value, 10) || 1,
                          ),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>
                </div>
              )}

              {erros.configuracaoTipo && (
                <p className="text-sm font-medium text-red-600">{erros.configuracaoTipo}</p>
              )}
            </div>
          )}

          {/* Itens da fatura */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Itens da fatura
              {erros.itens && (
                <span className="text-sm text-red-600 font-normal">* {erros.itens}</span>
              )}
            </h3>

            {/* Lista de Itens */}
            {formData.itens.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-center py-2">Qtd</th>
                      <th className="text-center py-2">Unidade</th>
                      <th className="text-right py-2">Valor Unit.</th>
                      <th className="text-right py-2">Desconto</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-center py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.itens.map((item, index) => {
                      const subtotal = item.quantidade * item.valorUnitario;
                      const desconto =
                        item.valorDesconto || (subtotal * (item.percentualDesconto || 0)) / 100;
                      const total = subtotal - desconto;

                      return (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <NumberInput
                              value={item.quantidade}
                              onValueChange={(value) => atualizarItem(index, 'quantidade', value)}
                              allowDecimals={false}
                              className="w-16 text-sm text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input
                              type="text"
                              value={item.unidade || UNIDADE_PADRAO}
                              onChange={(e) => atualizarItem(index, 'unidade', e.target.value)}
                              maxLength={LIMITE_UNIDADE}
                              className="w-20 text-sm text-center px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                              placeholder={UNIDADE_PADRAO}
                            />
                          </td>
                          <td className="py-2 text-right">
                            <MoneyInputNoPrefix
                              value={item.valorUnitario}
                              onValueChange={(value) =>
                                atualizarItem(index, 'valorUnitario', value)
                              }
                              className="w-24 text-sm text-right px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <MoneyInputNoPrefix
                              value={item.valorDesconto || 0}
                              onValueChange={(value) =>
                                atualizarItem(index, 'valorDesconto', value)
                              }
                              className="w-20 text-sm text-right px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                            />
                          </td>
                          <td className="py-2 text-right font-medium">
                            R$ {formatarValorMonetario(total)}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removerItem(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Adicionar Novo Item */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
              {/* Descrição - col-span-2 em md, col-span-1 em mobile */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem((prev) => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Ex: Produto/Serviço"
                />
              </div>

              {/* Quantidade - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
                <NumberInput
                  value={novoItem.quantidade}
                  onValueChange={(value) =>
                    setNovoItem((prev) => ({ ...prev, quantidade: value || 0 }))
                  }
                  allowDecimals={false}
                  placeholder="1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                />
              </div>

              {/* Valor Unitário - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor Unitário *
                </label>
                <MoneyInputNoPrefix
                  value={novoItem.valorUnitario}
                  onValueChange={(value) =>
                    setNovoItem((prev) => ({ ...prev, valorUnitario: value }))
                  }
                  placeholder="0,00"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                />
              </div>

              {/* Unidade - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Unidade</label>
                <input
                  type="text"
                  value={novoItem.unidade}
                  onChange={(e) =>
                    setNovoItem((prev) => ({
                      ...prev,
                      unidade: e.target.value.slice(0, LIMITE_UNIDADE),
                    }))
                  }
                  maxLength={LIMITE_UNIDADE}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                  placeholder={UNIDADE_PADRAO}
                />
              </div>

              {/* Desconto - col-span-1 */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Desconto</label>
                <MoneyInputNoPrefix
                  value={novoItem.valorDesconto || 0}
                  onValueChange={(value) =>
                    setNovoItem((prev) => ({ ...prev, valorDesconto: value }))
                  }
                  placeholder="0,00"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                />
              </div>

              {/* Botão Adicionar - col-span-1 em md, centralizado em mobile */}
              <div className="md:col-span-1 flex justify-center md:justify-start items-end">
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="inline-flex h-9 w-full md:w-auto items-center justify-center gap-1 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E]"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Desconto Geral e Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                placeholder="Informações adicionais sobre a fatura..."
              />
            </div>

            <div className="space-y-4">
              <div>
                <MoneyInput
                  label="Desconto Geral (R$)"
                  value={formData.valorDesconto || 0}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      valorDesconto: value,
                      percentualDesconto: 0,
                    }))
                  }
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15 focus:border-transparent"
                />
              </div>

              <div>
                <PercentInput
                  label="Ou Desconto Geral (%)"
                  value={formData.percentualDesconto || 0}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      percentualDesconto: value,
                      valorDesconto: 0,
                    }))
                  }
                  placeholder="0%"
                  max={100}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-4">
                <h4 className="text-sm font-semibold text-[#173A4D]">Configuração financeira avançada</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Carência para juros (dias)
                    </label>
                    <NumberInput
                      value={configFinanceira.diasCarenciaJuros}
                      onValueChange={(value) =>
                        setConfigFinanceira((prev) => ({
                          ...prev,
                          diasCarenciaJuros: Math.max(0, Math.trunc(value || 0)),
                        }))
                      }
                      min={0}
                      allowDecimals={false}
                      placeholder="0"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Juros por atraso (%)
                    </label>
                    <PercentInput
                      value={configFinanceira.percentualJuros}
                      onValueChange={(value) =>
                        setConfigFinanceira((prev) => ({
                          ...prev,
                          percentualJuros: Math.max(0, Math.min(100, value || 0)),
                        }))
                      }
                      min={0}
                      max={100}
                      placeholder="0,00%"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Multa (%)
                    </label>
                    <PercentInput
                      value={configFinanceira.percentualMulta}
                      onValueChange={(value) =>
                        setConfigFinanceira((prev) => ({
                          ...prev,
                          percentualMulta: Math.max(0, Math.min(100, value || 0)),
                        }))
                      }
                      min={0}
                      max={100}
                      placeholder="0,00%"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Ajuste manual de impostos/taxas (R$)
                    </label>
                    <MoneyInputNoPrefix
                      value={configFinanceira.valorImpostos}
                      onValueChange={(value) =>
                        setConfigFinanceira((prev) => ({
                          ...prev,
                          valorImpostos: Math.max(0, value || 0),
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                    />
                  </div>

                  <div className="md:col-span-2 rounded-md border border-[#DCE8EC] bg-white/70 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#315567]">
                      Tributos detalhados
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {TRIBUTOS_META.map((tributo) => (
                        <div key={tributo.codigo} className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-700">
                              {tributo.label} (R$)
                            </label>
                            <MoneyInputNoPrefix
                              value={tributosDetalhados[tributo.codigo].valor}
                              onValueChange={(value) =>
                                handleTributoDetalhadoChange(tributo.codigo, 'valor', value)
                              }
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-gray-700">
                              {tributo.label} (%)
                            </label>
                            <PercentInput
                              value={tributosDetalhados[tributo.codigo].percentual}
                              onValueChange={(value) =>
                                handleTributoDetalhadoChange(tributo.codigo, 'percentual', value)
                              }
                              min={0}
                              max={100}
                              placeholder="0,00%"
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1A9E87]/15"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[#46616F]">
                      <span>Total tributos detalhados:</span>
                      <strong>R$ {formatarValorMonetario(totalTributosDetalhados)}</strong>
                    </div>
                  </div>
                </div>
                {erros.financeiro && <p className="text-xs font-medium text-red-600">{erros.financeiro}</p>}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {formatarValorMonetario(totais.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto:</span>
                  <span className="text-red-600">
                    - R$ {formatarValorMonetario(totais.desconto)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impostos/Taxas (total):</span>
                  <span className="text-amber-700">
                    + R$ {formatarValorMonetario(valorImpostosEfetivo)}
                  </span>
                </div>
                {totalTributosDetalhados > 0 && (
                  <div className="flex justify-between text-xs text-[#6B7F89]">
                    <span>Tributos detalhados</span>
                    <span>+ R$ {formatarValorMonetario(totalTributosDetalhados)}</span>
                  </div>
                )}
                {ajusteManualImpostos > 0 && (
                  <div className="flex justify-between text-xs text-[#6B7F89]">
                    <span>Ajuste manual</span>
                    <span>+ R$ {formatarValorMonetario(ajusteManualImpostos)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total base:</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    R$ {formatarValorMonetario(totalComImpostos)}
                  </span>
                </div>
                {(configFinanceira.percentualJuros > 0 || configFinanceira.percentualMulta > 0) && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Juros em atraso:</span>
                      <span className="text-[#0F7B7D]">
                        + R$ {formatarValorMonetario(jurosEstimado)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Multa:</span>
                      <span className="text-[#0F7B7D]">
                        + R$ {formatarValorMonetario(multaEstimada)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-sm font-semibold text-[#173A4D]">
                      <span>Total projetado em atraso:</span>
                      <span>R$ {formatarValorMonetario(totalProjetadoAtraso)}</span>
                    </div>
                    <p className="text-[11px] text-[#5E7784]">
                      Juros e multa aplicados após {configFinanceira.diasCarenciaJuros} dia(s) de atraso.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E1EAEE]">
            <button
              type="button"
              onClick={handleClose}
              disabled={salvando}
              className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || formData.itens.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {fatura ? 'Atualizar Fatura' : 'Criar Fatura'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
