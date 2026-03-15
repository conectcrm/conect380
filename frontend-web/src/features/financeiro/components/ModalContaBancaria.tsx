import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import { ContaBancaria } from '../../../types/financeiro';
import { NovaContaBancaria } from '../../../services/contaBancariaService';
import MoneyInput from '../../../components/inputs/MoneyInput';

interface ModalContaBancariaProps {
  isOpen: boolean;
  conta?: ContaBancaria | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (dados: NovaContaBancaria) => Promise<void> | void;
}

type FormDataState = {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca';
  saldo: number;
  chavePix: string;
  ativo: boolean;
};

const fieldClass =
  'h-10 w-full rounded-xl border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455] outline-none transition focus:border-[#1A9E87]/45 focus:ring-2 focus:ring-[#1A9E87]/15';

const emptyForm: FormDataState = {
  nome: '',
  banco: '',
  agencia: '',
  conta: '',
  tipoConta: 'corrente',
  saldo: 0,
  chavePix: '',
  ativo: true,
};

const ModalContaBancaria: React.FC<ModalContaBancariaProps> = ({
  isOpen,
  conta,
  loading = false,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormDataState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (conta) {
      setFormData({
        nome: conta.nome || '',
        banco: conta.banco || '',
        agencia: conta.agencia || '',
        conta: conta.conta || '',
        tipoConta: conta.tipoConta || 'corrente',
        saldo: Number(conta.saldo || 0),
        chavePix: conta.chavePix || '',
        ativo: conta.ativo ?? true,
      });
      setErrors({});
      return;
    }

    setFormData(emptyForm);
    setErrors({});
  }, [conta, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    field: keyof FormDataState,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const validarFormulario = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.nome.trim()) nextErrors.nome = 'Nome da conta e obrigatorio';
    if (!formData.banco.trim()) nextErrors.banco = 'Banco e obrigatorio';
    if (!formData.agencia.trim()) nextErrors.agencia = 'Agencia e obrigatoria';
    if (!formData.conta.trim()) nextErrors.conta = 'Numero da conta e obrigatorio';

    const saldo = Number(formData.saldo);
    if (!Number.isFinite(saldo) || saldo < 0) {
      nextErrors.saldo = 'Saldo deve ser um numero maior ou igual a zero';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validarFormulario()) return;

    setSaving(true);
    try {
      await onSave({
        nome: formData.nome.trim(),
        banco: formData.banco.trim(),
        agencia: formData.agencia.trim(),
        conta: formData.conta.trim(),
        tipoConta: formData.tipoConta,
        saldo: Number(formData.saldo || 0),
        chavePix: formData.chavePix.trim() || undefined,
        ativo: formData.ativo,
      });
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0F172A]/45 p-4">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!disabled) onClose();
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#DCE8EC] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#173A4D]">
              {conta ? 'Editar conta bancaria' : 'Nova conta bancaria'}
            </h2>
            <p className="text-sm text-[#64808E]">
              Cadastre a conta para uso em contas a pagar e pagamentos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7A88] hover:bg-[#F2F7F8] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Nome da conta *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={fieldClass}
                placeholder="Ex: Conta principal operacional"
                disabled={disabled}
              />
              {errors.nome ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.nome}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Banco *</label>
              <input
                type="text"
                value={formData.banco}
                onChange={(e) => handleInputChange('banco', e.target.value)}
                className={fieldClass}
                placeholder="Ex: Banco do Brasil"
                disabled={disabled}
              />
              {errors.banco ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.banco}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Tipo de conta</label>
              <select
                value={formData.tipoConta}
                onChange={(e) => handleInputChange('tipoConta', e.target.value as 'corrente' | 'poupanca')}
                className={fieldClass}
                disabled={disabled}
              >
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupanca</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Agencia *</label>
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => handleInputChange('agencia', e.target.value)}
                className={fieldClass}
                placeholder="Ex: 1234"
                disabled={disabled}
              />
              {errors.agencia ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.agencia}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Conta *</label>
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => handleInputChange('conta', e.target.value)}
                className={fieldClass}
                placeholder="Ex: 12345-6"
                disabled={disabled}
              />
              {errors.conta ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.conta}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Saldo inicial</label>
              <MoneyInput
                value={formData.saldo}
                onValueChange={(value) => handleInputChange('saldo', Math.max(0, value || 0))}
                className={fieldClass}
                placeholder="R$ 0,00"
                disabled={disabled}
              />
              {errors.saldo ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.saldo}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#385A6A]">Chave PIX</label>
              <input
                type="text"
                value={formData.chavePix}
                onChange={(e) => handleInputChange('chavePix', e.target.value)}
                className={fieldClass}
                placeholder="Opcional"
                disabled={disabled}
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#385A6A]">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                  disabled={disabled}
                />
                Conta ativa
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E1EAEE] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {conta ? 'Salvar alteracoes' : 'Cadastrar conta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModalContaBancaria;
