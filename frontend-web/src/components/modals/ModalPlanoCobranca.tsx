import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import MoneyInputNoPrefix from '../inputs/MoneyInputNoPrefix';
import NumberInput from '../inputs/NumberInput';
import { contratoService, Contrato } from '../../services/contratoService';
import {
  faturamentoService,
  NovoPlanoCobranca,
  TipoRecorrencia,
} from '../../services/faturamentoService';

interface ModalPlanoCobrancaProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
  usuarioResponsavelId: string;
  onCreated?: () => void;
}

const toISODate = (value: Date): string => value.toISOString().split('T')[0];

const tipoRecorrenciaOptions: Array<{ value: TipoRecorrencia; label: string }> = [
  { value: TipoRecorrencia.MENSAL, label: 'Mensal' },
  { value: TipoRecorrencia.TRIMESTRAL, label: 'Trimestral' },
  { value: TipoRecorrencia.SEMESTRAL, label: 'Semestral' },
  { value: TipoRecorrencia.ANUAL, label: 'Anual' },
  { value: TipoRecorrencia.PERSONALIZADO, label: 'Personalizado' },
];

const inputClass =
  'w-full rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#19384C] shadow-sm focus:border-[#159A9C] focus:outline-none focus:ring-2 focus:ring-[#159A9C]/25 disabled:cursor-not-allowed disabled:bg-[#F2F7F9]';

const buildContratoLabel = (contrato: Contrato): string => {
  const numero = contrato.numero ? `#${contrato.numero}` : `Contrato ${contrato.id}`;
  const status = contrato.status ? String(contrato.status).replace(/_/g, ' ') : '';
  const valor = typeof contrato.valor === 'number' ? contrato.valor : undefined;
  const valorLabel =
    typeof valor === 'number'
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        }).format(valor)
      : '';

  return [numero, status, valorLabel].filter(Boolean).join(' • ');
};

const createDefaultForm = (): Omit<NovoPlanoCobranca, 'clienteId' | 'usuarioResponsavelId'> & {
  contratoId: number | null;
} => ({
  contratoId: null,
  nome: '',
  descricao: '',
  tipoRecorrencia: TipoRecorrencia.MENSAL,
  valorRecorrente: 0,
  diaVencimento: 5,
  dataInicio: toISODate(new Date()),
});

const ModalPlanoCobranca: React.FC<ModalPlanoCobrancaProps> = ({
  isOpen,
  onClose,
  clienteId,
  usuarioResponsavelId,
  onCreated,
}) => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contratosLoading, setContratosLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createDefaultForm);

  const contratosOptions = useMemo(
    () =>
      contratos
        .filter((contrato) => String(contrato.status || '').toLowerCase() !== 'cancelado')
        .map((contrato) => ({
          id: Number(contrato.id),
          label: buildContratoLabel(contrato),
        }))
        .filter((opt) => Number.isFinite(opt.id) && opt.id > 0),
    [contratos],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSaving(false);
    setForm(createDefaultForm());
    setContratos([]);
    setContratosLoading(true);

    contratoService
      .listarContratos({ clienteId })
      .then((lista) => {
        setContratos(Array.isArray(lista) ? lista : []);
      })
      .catch((error) => {
        console.error('Erro ao carregar contratos para recorrencia:', error);
        setContratos([]);
        toast.error('Nao foi possivel carregar os contratos deste cliente.');
      })
      .finally(() => {
        setContratosLoading(false);
      });
  }, [clienteId, isOpen]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (saving) return;

    const contratoId = form.contratoId;
    const nome = String(form.nome || '').trim();
    const dataInicio = String(form.dataInicio || '').trim();
    const diaVencimento = Number(form.diaVencimento || 0);
    const valorRecorrente = Number(form.valorRecorrente || 0);

    if (!Number.isFinite(contratoId || NaN) || !contratoId) {
      toast.error('Selecione um contrato para vincular a recorrencia.');
      return;
    }
    if (!nome) {
      toast.error('Informe o nome da recorrencia.');
      return;
    }
    if (!dataInicio) {
      toast.error('Informe a data de inicio.');
      return;
    }
    if (!Number.isFinite(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
      toast.error('Informe um dia de vencimento valido (1-31).');
      return;
    }
    if (!Number.isFinite(valorRecorrente) || valorRecorrente <= 0) {
      toast.error('Informe um valor recorrente valido.');
      return;
    }
    if (!usuarioResponsavelId?.trim()) {
      toast.error('Usuario responsavel nao identificado.');
      return;
    }

    const payload: NovoPlanoCobranca = {
      contratoId,
      clienteId,
      usuarioResponsavelId,
      nome,
      descricao: String(form.descricao || '').trim() || undefined,
      tipoRecorrencia: form.tipoRecorrencia,
      valorRecorrente,
      diaVencimento,
      dataInicio,
    };

    try {
      setSaving(true);
      await faturamentoService.criarPlanoCobranca(payload);
      toast.success('Recorrencia criada com sucesso.');
      onClose();
      onCreated?.();
    } catch (error) {
      console.error('Erro ao criar recorrencia:', error);
      toast.error('Nao foi possivel criar a recorrencia.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative flex w-full max-w-[820px] max-h-[92vh] flex-col overflow-hidden rounded-xl border border-[#DCE8EC] bg-white shadow-2xl">
          <div className="sticky top-0 z-10 border-b border-[#E4EDF0] bg-white px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#002333]">Nova recorrencia</h2>
                <p className="text-sm text-[#607B89]">
                  Vincule um contrato e defina a periodicidade para gerar faturas automaticas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Contrato *
                </label>
                <select
                  value={form.contratoId ? String(form.contratoId) : ''}
                  onChange={(event) => {
                    const next = Number(event.target.value || 0);
                    setForm((prev) => ({
                      ...prev,
                      contratoId: Number.isFinite(next) && next > 0 ? next : null,
                    }));
                  }}
                  className={inputClass}
                  disabled={contratosLoading || saving}
                >
                  <option value="">
                    {contratosLoading ? 'Carregando contratos...' : 'Selecione um contrato'}
                  </option>
                  {contratosOptions.map((opt) => (
                    <option key={opt.id} value={String(opt.id)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {!contratosLoading && contratosOptions.length === 0 ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Nenhum contrato encontrado para este cliente. Crie um contrato antes de configurar recorrencia.
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className={inputClass}
                  placeholder="Ex: Mensalidade Conect360"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Periodicidade *
                </label>
                <select
                  value={form.tipoRecorrencia}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tipoRecorrencia: event.target.value as TipoRecorrencia,
                    }))
                  }
                  className={inputClass}
                  disabled={saving}
                >
                  {tipoRecorrenciaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <MoneyInputNoPrefix
                  label="Valor recorrente *"
                  required={true}
                  value={form.valorRecorrente}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, valorRecorrente: value }))}
                  disabled={saving}
                  className={inputClass}
                  placeholder="0,00"
                />
              </div>

              <div>
                <NumberInput
                  label="Dia vencimento *"
                  required={true}
                  value={form.diaVencimento}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, diaVencimento: value }))}
                  min={1}
                  max={31}
                  disabled={saving}
                  className={inputClass}
                  placeholder="Ex: 5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Data inicio *
                </label>
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dataInicio: event.target.value }))
                  }
                  className={inputClass}
                  disabled={saving}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Descricao</label>
                <textarea
                  value={form.descricao || ''}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, descricao: event.target.value }))
                  }
                  className={`${inputClass} min-h-[90px]`}
                  placeholder="Opcional: detalhe do que esta incluso na recorrencia"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E4EDF0] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || contratosLoading || contratosOptions.length === 0}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Criar recorrencia
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalPlanoCobranca;

