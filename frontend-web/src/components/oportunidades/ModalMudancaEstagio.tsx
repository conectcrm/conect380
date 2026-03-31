import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { EstagioOportunidade, TipoAtividade } from '../../types/oportunidades';
import { BaseModal } from '../base/BaseModal';

interface ResponsavelOpcao {
  id: string;
  nome: string;
  email?: string;
}

interface AgendamentoProximaAcao {
  data: Date;
  tipoEvento: TipoAtividade;
  responsavelId: string;
  responsavelNome: string;
  descricao: string;
}

interface ModalMudancaEstagioProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    motivo: string,
    comentario: string,
    agendamento?: AgendamentoProximaAcao,
    justificativaPulo?: string,
  ) => void;
  estagioOrigem: string;
  estagioDestino: string;
  tituloOportunidade: string;
  responsaveis: ResponsavelOpcao[];
  responsavelPadraoId?: string;
  isPuloEtapa?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
}

const MOTIVOS_MUDANCA = [
  { value: 'avanco_natural', label: 'Avanco natural do processo' },
  { value: 'feedback_positivo', label: 'Feedback positivo do cliente' },
  { value: 'documentacao_completa', label: 'Documentacao completa' },
  { value: 'reuniao_realizada', label: 'Reuniao realizada com sucesso' },
  { value: 'solicitacao_cliente', label: 'Solicitacao do cliente' },
  { value: 'ajuste_estrategia', label: 'Ajuste de estrategia' },
  { value: 'aprovacao_interna', label: 'Aprovacao interna obtida' },
  { value: 'outro', label: 'Outro motivo' },
];

const ESTAGIOS_LABELS: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificacao',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociacao',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
  [EstagioOportunidade.GANHO]: 'Ganho',
  [EstagioOportunidade.PERDIDO]: 'Perdido',
};

const PROXIMOS_EVENTOS_OPCOES: Array<{ value: TipoAtividade; label: string }> = [
  { value: TipoAtividade.LIGACAO, label: 'Ligacao' },
  { value: TipoAtividade.EMAIL, label: 'E-mail' },
  { value: TipoAtividade.REUNIAO, label: 'Reuniao' },
  { value: TipoAtividade.TAREFA, label: 'Tarefa' },
];

const formatarDataInputHoje = (): string => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const converterDataInputParaDate = (value: string): Date | undefined => {
  if (!value) return undefined;

  const [ano, mes, dia] = value.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;

  const parsed = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const obterLabelEstagio = (estagio: string): string =>
  ESTAGIOS_LABELS[estagio as EstagioOportunidade] || estagio || 'Nao informado';

const ModalMudancaEstagio: React.FC<ModalMudancaEstagioProps> = ({
  isOpen,
  onClose,
  onConfirm,
  estagioOrigem,
  estagioDestino,
  tituloOportunidade,
  responsaveis,
  responsavelPadraoId,
  isPuloEtapa = false,
  loading = false,
  errorMessage = null,
}) => {
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [tipoProximoEvento, setTipoProximoEvento] = useState('');
  const [responsavelProximaAcao, setResponsavelProximaAcao] = useState('');
  const [descricaoProximaAcao, setDescricaoProximaAcao] = useState('');
  const [justificativaPulo, setJustificativaPulo] = useState('');
  const [tentouConfirmar, setTentouConfirmar] = useState(false);

  const responsavelPadraoSelecionado = useMemo(() => {
    if (!responsaveis.length) return '';

    if (responsavelPadraoId && responsaveis.some((item) => item.id === responsavelPadraoId)) {
      return responsavelPadraoId;
    }

    return responsaveis[0]?.id ?? '';
  }, [responsaveis, responsavelPadraoId]);

  useEffect(() => {
    if (!isOpen) return;
    setResponsavelProximaAcao(responsavelPadraoSelecionado);
  }, [isOpen, responsavelPadraoSelecionado]);

  const mostrarOutroMotivo = motivo === 'outro';
  const comentarioLimpo = comentario.trim();
  const descricaoProximaAcaoLimpa = descricaoProximaAcao.trim();
  const justificativaPuloLimpa = justificativaPulo.trim();
  const precisaConfigurarProximaAcao = Boolean(proximaAcao);
  const justificativaPuloInvalida = tentouConfirmar && isPuloEtapa && !justificativaPuloLimpa;
  const motivoInvalido = tentouConfirmar && !motivo;
  const comentarioObrigatorioInvalido = tentouConfirmar && mostrarOutroMotivo && !comentarioLimpo;
  const tipoProximoEventoInvalido =
    tentouConfirmar && precisaConfigurarProximaAcao && !tipoProximoEvento;
  const responsavelProximaAcaoInvalido =
    tentouConfirmar && precisaConfigurarProximaAcao && !responsavelProximaAcao;
  const descricaoProximaAcaoInvalida =
    tentouConfirmar && precisaConfigurarProximaAcao && !descricaoProximaAcaoLimpa;
  const isFormValid =
    Boolean(motivo) &&
    (!isPuloEtapa || Boolean(justificativaPuloLimpa)) &&
    (!mostrarOutroMotivo || Boolean(comentarioLimpo)) &&
    (!precisaConfigurarProximaAcao ||
      (Boolean(tipoProximoEvento) &&
        Boolean(responsavelProximaAcao) &&
        Boolean(descricaoProximaAcaoLimpa)));

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const handleConfirmar = (): void => {
    setTentouConfirmar(true);
    if (!isFormValid) return;

    const motivoSelecionadoLabel = MOTIVOS_MUDANCA.find((item) => item.value === motivo)?.label;
    const motivoFinal = mostrarOutroMotivo ? comentarioLimpo : motivoSelecionadoLabel || motivo;
    const comentarioFinal = mostrarOutroMotivo ? '' : comentarioLimpo;
    const dataAgendada = converterDataInputParaDate(proximaAcao);
    const responsavelSelecionado = responsaveis.find((item) => item.id === responsavelProximaAcao);

    const agendamento: AgendamentoProximaAcao | undefined =
      dataAgendada && tipoProximoEvento && responsavelSelecionado && descricaoProximaAcaoLimpa
        ? {
            data: dataAgendada,
            tipoEvento: tipoProximoEvento as TipoAtividade,
            responsavelId: responsavelSelecionado.id,
            responsavelNome: responsavelSelecionado.nome,
            descricao: descricaoProximaAcaoLimpa,
          }
        : undefined;

    onConfirm(motivoFinal, comentarioFinal, agendamento, justificativaPuloLimpa || undefined);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mudanca de estagio"
      subtitle="Registre o motivo desta movimentacao"
      maxWidth="xl"
      modalClassName="max-h-[90vh] overflow-hidden rounded-2xl"
    >
      <div data-testid="modal-mudanca-estagio">
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-[#DEEFE7] bg-[#DEEFE7]/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
              Oportunidade
            </p>
            <p className="mb-3 font-bold text-[#002333]">{tituloOportunidade}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-red-100 px-3 py-1 font-semibold text-red-700">
                {obterLabelEstagio(estagioOrigem)}
              </span>
              <span className="text-[#002333]/40">-&gt;</span>
              <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">
                {obterLabelEstagio(estagioDestino)}
              </span>
            </div>
          </div>

          {isPuloEtapa && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                <strong>Pulo de etapa:</strong> esta movimentacao ignora etapas intermediarias do
                pipeline. Informe uma justificativa para auditoria.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="modal-mudanca-estagio-motivo"
              className="mb-2 block text-sm font-medium text-[#002333]"
            >
              Motivo da mudanca <span className="text-red-600">*</span>
            </label>
            <select
              id="modal-mudanca-estagio-motivo"
              data-testid="modal-mudanca-estagio-motivo"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              disabled={loading}
              aria-invalid={motivoInvalido}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                motivoInvalido
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
              }`}
            >
              <option value="">Selecione o motivo...</option>
              {MOTIVOS_MUDANCA.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {motivoInvalido && (
              <p className="mt-1 text-xs text-red-600">Selecione um motivo para continuar.</p>
            )}
          </div>

          <div>
            <label
              htmlFor="modal-mudanca-estagio-comentario"
              className="mb-2 block text-sm font-medium text-[#002333]"
            >
              {mostrarOutroMotivo ? 'Descreva o motivo' : 'Comentario adicional'}
              {mostrarOutroMotivo && <span className="text-red-600"> *</span>}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-[#002333]/40">
                <MessageSquare className="h-5 w-5" />
              </div>
              <textarea
                id="modal-mudanca-estagio-comentario"
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                placeholder={
                  mostrarOutroMotivo
                    ? 'Descreva o motivo da mudanca...'
                    : 'Adicione detalhes sobre esta mudanca... (opcional)'
                }
                rows={4}
                maxLength={500}
                disabled={loading}
                aria-invalid={comentarioObrigatorioInvalido}
                className={`w-full rounded-lg border py-2.5 pl-11 pr-4 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  comentarioObrigatorioInvalido
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
                }`}
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">{comentario.length}/500 caracteres</p>
            {comentarioObrigatorioInvalido && (
              <p className="mt-1 text-xs text-red-600">Descreva o motivo para continuar.</p>
            )}
          </div>

          {isPuloEtapa && (
            <div>
              <label
                htmlFor="modal-mudanca-estagio-justificativa-pulo"
                className="mb-2 block text-sm font-medium text-[#002333]"
              >
                Justificativa do pulo <span className="text-red-600">*</span>
              </label>
              <textarea
                id="modal-mudanca-estagio-justificativa-pulo"
                value={justificativaPulo}
                onChange={(event) => setJustificativaPulo(event.target.value)}
                placeholder="Explique por que essa oportunidade deve pular etapas do pipeline."
                rows={3}
                maxLength={500}
                disabled={loading}
                aria-invalid={justificativaPuloInvalida}
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  justificativaPuloInvalida
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
                }`}
              />
              <p className="mt-1 text-xs text-[#002333]/60">
                Esse texto sera registrado no historico para rastreabilidade da decisao.
              </p>
              {justificativaPuloInvalida && (
                <p className="mt-1 text-xs text-red-600">
                  Informe a justificativa para confirmar o pulo de etapa.
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="modal-mudanca-estagio-proxima-acao"
              className="mb-2 block text-sm font-medium text-[#002333]"
            >
              Agendar proxima acao (opcional)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#002333]/40">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                id="modal-mudanca-estagio-proxima-acao"
                type="date"
                value={proximaAcao}
                onChange={(event) => setProximaAcao(event.target.value)}
                disabled={loading}
                min={formatarDataInputHoje()}
                className="w-full rounded-lg border border-[#B4BEC9] py-2.5 pl-11 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-[#159A9C] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              Data para follow-up ou proxima atividade.
            </p>
          </div>

          {precisaConfigurarProximaAcao && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="modal-mudanca-estagio-tipo-proximo-evento"
                  className="mb-2 block text-sm font-medium text-[#002333]"
                >
                  Proximo evento <span className="text-red-600">*</span>
                </label>
                <select
                  id="modal-mudanca-estagio-tipo-proximo-evento"
                  value={tipoProximoEvento}
                  onChange={(event) => setTipoProximoEvento(event.target.value)}
                  disabled={loading}
                  aria-invalid={tipoProximoEventoInvalido}
                  className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    tipoProximoEventoInvalido
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
                  }`}
                >
                  <option value="">Selecione o tipo...</option>
                  {PROXIMOS_EVENTOS_OPCOES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {tipoProximoEventoInvalido && (
                  <p className="mt-1 text-xs text-red-600">Selecione o tipo do proximo evento.</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="modal-mudanca-estagio-responsavel-proxima-acao"
                  className="mb-2 block text-sm font-medium text-[#002333]"
                >
                  Responsavel <span className="text-red-600">*</span>
                </label>
                <select
                  id="modal-mudanca-estagio-responsavel-proxima-acao"
                  value={responsavelProximaAcao}
                  onChange={(event) => setResponsavelProximaAcao(event.target.value)}
                  disabled={loading}
                  aria-invalid={responsavelProximaAcaoInvalido}
                  className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    responsavelProximaAcaoInvalido
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
                  }`}
                >
                  <option value="">Selecione o responsavel...</option>
                  {responsaveis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                      {item.email ? ` (${item.email})` : ''}
                    </option>
                  ))}
                </select>
                {responsavelProximaAcaoInvalido && (
                  <p className="mt-1 text-xs text-red-600">
                    Selecione quem vai executar a proxima acao.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="modal-mudanca-estagio-descricao-proxima-acao"
                  className="mb-2 block text-sm font-medium text-[#002333]"
                >
                  Descricao da proxima acao <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="modal-mudanca-estagio-descricao-proxima-acao"
                  value={descricaoProximaAcao}
                  onChange={(event) => setDescricaoProximaAcao(event.target.value)}
                  placeholder="Ex: Entrar em contato para validar proposta e confirmar decisores."
                  rows={3}
                  maxLength={280}
                  disabled={loading}
                  aria-invalid={descricaoProximaAcaoInvalida}
                  className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50 ${
                    descricaoProximaAcaoInvalida
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#B4BEC9] focus:border-transparent focus:ring-2 focus:ring-[#159A9C]'
                  }`}
                />
                <p className="mt-1 text-xs text-[#002333]/60">
                  Esse texto sera mostrado como orientacao da tarefa para o responsavel designado.
                </p>
                {descricaoProximaAcaoInvalida && (
                  <p className="mt-1 text-xs text-red-600">
                    Descreva o que deve ser executado na proxima acao.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              <strong>Historico:</strong> Esta movimentacao sera registrada automaticamente no
              historico de atividades da oportunidade com data, hora e usuario.
            </p>
          </div>

          {errorMessage && (
            <div
              data-testid="modal-mudanca-estagio-error"
              className="rounded-lg border border-red-200 bg-red-50 p-3"
            >
              <p className="text-sm text-red-800">
                <strong>Nao foi possivel mover:</strong> {errorMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#002333] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            data-testid="modal-mudanca-estagio-confirmar"
            type="button"
            onClick={handleConfirmar}
            disabled={!isFormValid || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Movendo...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Confirmar mudanca
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ModalMudancaEstagio;
