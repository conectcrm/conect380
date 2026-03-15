import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Plus,
  Save,
  Send,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorCompletoBRL } from '../../utils/formatacao';

interface TemplateEmail {
  id: string;
  nome: string;
  assunto: string;
  conteudo: string;
  tipoTrigger: 'vencimento' | 'vencido' | 'pagamento' | 'manual';
  diasAntes?: number;
  ativo: boolean;
}

interface EmailEnviado {
  id: string;
  faturaId: number;
  templateId: string;
  destinatario: string;
  assunto: string;
  dataEnvio: Date;
  status: 'enviado' | 'falha' | 'pendente';
}

export interface EnvioEmailAutomacaoPayload {
  faturaId: number;
  templateId: string;
  assunto: string;
  conteudo: string;
}

interface EmailAutomacaoProps {
  faturas: Fatura[];
  onEnviarEmail: (envios: EnvioEmailAutomacaoPayload[]) => Promise<void>;
}

const STORAGE_KEY = 'faturamento-email-templates-v1';
const MODAL_OVERLAY_CLASS = 'fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4';
const MODAL_CONTAINER_CLASS =
  'w-full overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]';

const TEMPLATES_PADRAO: TemplateEmail[] = [
  {
    id: 'template_vencimento',
    nome: 'Lembrete de Vencimento',
    assunto: 'Fatura {numero} vence em {dias} dia(s)',
    conteudo:
      'Olá {nomeCliente},\n\nSua fatura #{numero}, no valor de {valor}, vence em {dias} dia(s) ({dataVencimento}).\n\nLink para pagamento: {linkPagamento}\n\nEquipe Financeiro',
    tipoTrigger: 'vencimento',
    diasAntes: 3,
    ativo: true,
  },
  {
    id: 'template_vencido',
    nome: 'Cobrança de Fatura Vencida',
    assunto: 'Fatura {numero} em atraso há {diasAtraso} dia(s)',
    conteudo:
      'Olá {nomeCliente},\n\nSua fatura #{numero}, no valor de {valor}, está vencida há {diasAtraso} dia(s).\n\nLink para regularização: {linkPagamento}\n\nEquipe Financeiro',
    tipoTrigger: 'vencido',
    ativo: true,
  },
  {
    id: 'template_pagamento',
    nome: 'Confirmação de Pagamento',
    assunto: 'Pagamento confirmado - fatura {numero}',
    conteudo:
      'Olá {nomeCliente},\n\nRecebemos o pagamento da fatura #{numero}, no valor de {valor}, em {dataPagamento}.\n\nObrigado.\nEquipe Financeiro',
    tipoTrigger: 'pagamento',
    ativo: true,
  },
];

const lerTemplates = (): TemplateEmail[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return TEMPLATES_PADRAO;
    const parsed = JSON.parse(raw) as TemplateEmail[];
    if (!Array.isArray(parsed) || !parsed.length) return TEMPLATES_PADRAO;
    return parsed;
  } catch (_error) {
    return TEMPLATES_PADRAO;
  }
};

const salvarTemplates = (templates: TemplateEmail[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (_error) {
    // Ignora falha de storage sem quebrar o fluxo
  }
};

const novoTemplateEmBranco = (): TemplateEmail => ({
  id: `template_${Date.now()}`,
  nome: '',
  assunto: '',
  conteudo: '',
  tipoTrigger: 'manual',
  ativo: true,
});

const getFaturamentoPublicUrl = (faturaId: number): string => {
  const path = `/financeiro/faturamento?faturaId=${faturaId}`;
  if (typeof window === 'undefined') {
    return path;
  }

  const baseUrl = window.location.origin.replace(/\/+$/, '');
  return `${baseUrl}${path}`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const gerarHtmlEmailCliente = (conteudo: string, faturaId: number): string => {
  const urlFatura = getFaturamentoPublicUrl(faturaId);
  const conteudoSeguro = escapeHtml(conteudo).replace(/\r?\n/g, '<br />');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="line-height: 1.6; color: #2c3e50;">
        ${conteudoSeguro}
      </div>

      <div style="text-align: center; margin: 32px 0 12px;">
        <a href="${urlFatura}"
           style="background-color: #28a745; color: white; padding: 14px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Acessar Fatura
        </a>
      </div>

      <p style="color: #666; font-size: 13px; text-align: center;">
        Este email foi enviado automaticamente pelo sistema ConectCRM.
      </p>
    </div>
  `;
};

export default function EmailAutomacao({ faturas, onEnviarEmail }: EmailAutomacaoProps) {
  const [templates, setTemplates] = useState<TemplateEmail[]>(() => lerTemplates());
  const [emailsEnviados, setEmailsEnviados] = useState<EmailEnviado[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateEmail | null>(null);
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<number[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [modalTemplate, setModalTemplate] = useState(false);
  const [modalEnvio, setModalEnvio] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<TemplateEmail | null>(null);

  const templatesAtivos = useMemo(() => templates.filter((template) => template.ativo), [templates]);

  const getFaturasParaNotificacao = (tipo: 'vencimento' | 'vencido') => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (tipo === 'vencimento') {
      return faturas.filter((fatura) => {
        const dataVencimento = new Date(fatura.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);

        const diffDias = Math.ceil(
          (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );
        return (
          diffDias <= 3 &&
          diffDias >= 0 &&
          [StatusFatura.PENDENTE, StatusFatura.ENVIADA, StatusFatura.PARCIALMENTE_PAGA].includes(
            fatura.status,
          )
        );
      });
    }

    return faturas.filter((fatura) => {
      const dataVencimento = new Date(fatura.dataVencimento);
      dataVencimento.setHours(0, 0, 0, 0);

      return (
        dataVencimento < hoje &&
        ![StatusFatura.PAGA, StatusFatura.CANCELADA].includes(fatura.status)
      );
    });
  };

  const processarTemplate = (template: TemplateEmail, fatura: Fatura): { assunto: string; conteudo: string } => {
    const hoje = new Date();
    const dataVencimento = new Date(fatura.dataVencimento);
    const diasParaVencimento = Math.ceil(
      (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
    const diasAtraso = Math.max(
      0,
      Math.ceil((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const variaveis = {
      '{numero}': fatura.numero,
      '{nomeCliente}': fatura.cliente?.nome || `Cliente #${fatura.clienteId || 'N/A'}`,
      '{valor}': formatarValorCompletoBRL(fatura.valorTotal),
      '{dataVencimento}': dataVencimento.toLocaleDateString('pt-BR'),
      '{dias}': String(diasParaVencimento),
      '{diasAtraso}': String(diasAtraso),
      '{linkPagamento}': getFaturamentoPublicUrl(fatura.id),
      '{dataPagamento}': hoje.toLocaleDateString('pt-BR'),
    };

    let assunto = template.assunto;
    let conteudo = template.conteudo;

    Object.entries(variaveis).forEach(([variavel, valor]) => {
      assunto = assunto.replace(new RegExp(variavel, 'g'), valor);
      conteudo = conteudo.replace(new RegExp(variavel, 'g'), valor);
    });

    return { assunto, conteudo };
  };

  const abrirModalEnvio = (faturaIds: number[], tipoTemplate: TemplateEmail['tipoTrigger']) => {
    const templatePadrao =
      templatesAtivos.find((template) => template.tipoTrigger === tipoTemplate) || templatesAtivos[0] || null;
    setFaturasSelecionadas(faturaIds);
    setTemplateSelecionado(templatePadrao);
    setModalEnvio(true);
  };

  const enviarEmailsLote = async () => {
    if (!templateSelecionado || faturasSelecionadas.length === 0) return;
    setEnviandoEmail(true);

    try {
      const envios = faturasSelecionadas.map((faturaId) => {
        const fatura = faturas.find((item) => item.id === faturaId);
        const renderizado = fatura ? processarTemplate(templateSelecionado, fatura) : null;
        return {
          faturaId,
          templateId: templateSelecionado.id,
          assunto: renderizado?.assunto || templateSelecionado.assunto,
          conteudo: renderizado?.conteudo || templateSelecionado.conteudo,
        } as EnvioEmailAutomacaoPayload;
      });

      await onEnviarEmail(envios);

      const enviados: EmailEnviado[] = faturasSelecionadas.map((faturaId) => {
        const fatura = faturas.find((item) => item.id === faturaId);
        const renderizado = fatura ? processarTemplate(templateSelecionado, fatura) : null;

        return {
          id: `email_${Date.now()}_${faturaId}`,
          faturaId,
          templateId: templateSelecionado.id,
          destinatario: fatura?.cliente?.email || `cliente_${faturaId}@sem-email.local`,
          assunto: renderizado?.assunto || templateSelecionado.assunto,
          dataEnvio: new Date(),
          status: 'enviado',
        };
      });

      setEmailsEnviados((prev) => [...enviados, ...prev].slice(0, 50));
      setFaturasSelecionadas([]);
      setModalEnvio(false);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const iniciarNovoTemplate = () => {
    setTemplateEditando(novoTemplateEmBranco());
  };

  const salvarTemplate = () => {
    if (!templateEditando) return;
    if (!templateEditando.nome.trim() || !templateEditando.assunto.trim() || !templateEditando.conteudo.trim()) {
      return;
    }

    const existe = templates.some((item) => item.id === templateEditando.id);
    const atualizados = existe
      ? templates.map((item) => (item.id === templateEditando.id ? templateEditando : item))
      : [templateEditando, ...templates];

    setTemplates(atualizados);
    salvarTemplates(atualizados);
    setTemplateEditando(null);
  };

  const excluirTemplate = (templateId: string) => {
    const atualizados = templates.filter((template) => template.id !== templateId);
    setTemplates(atualizados.length ? atualizados : TEMPLATES_PADRAO);
    salvarTemplates(atualizados.length ? atualizados : TEMPLATES_PADRAO);
  };

  const toggleAtivoTemplate = (templateId: string) => {
    const atualizados = templates.map((template) =>
      template.id === templateId ? { ...template, ativo: !template.ativo } : template,
    );
    setTemplates(atualizados);
    salvarTemplates(atualizados);
  };

  const faturasVencendo = getFaturasParaNotificacao('vencimento');
  const faturasVencidas = getFaturasParaNotificacao('vencido');
  const primeiraFaturaSelecionada = faturasSelecionadas[0];
  const faturaPreview =
    typeof primeiraFaturaSelecionada === 'number'
      ? faturas.find((item) => item.id === primeiraFaturaSelecionada)
      : undefined;
  const templatePreviewRenderizado =
    templateSelecionado && faturaPreview
      ? processarTemplate(templateSelecionado, faturaPreview)
      : null;
  const previewAssunto = templatePreviewRenderizado?.assunto || templateSelecionado?.assunto || '';
  const previewConteudo =
    templatePreviewRenderizado?.conteudo || templateSelecionado?.conteudo || '';
  const previewDestinatario =
    faturaPreview?.cliente?.email ||
    (primeiraFaturaSelecionada ? `cliente_${primeiraFaturaSelecionada}@sem-email.local` : '-');
  const previewHtmlFinal =
    primeiraFaturaSelecionada && previewConteudo
      ? gerarHtmlEmailCliente(previewConteudo, primeiraFaturaSelecionada)
      : '';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-[#002333]">Automação de E-mails</h2>
            <p className="text-[#4F6B79]">Disparo em lote para vencimento, atraso e cobrança.</p>
          </div>
          <button
            onClick={() => setModalTemplate(true)}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-md hover:bg-[#117C7E] flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Gerenciar templates
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{faturasVencendo.length}</div>
              <div className="text-sm text-gray-500">Vencem em até 3 dias</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{faturasVencidas.length}</div>
              <div className="text-sm text-gray-500">Faturas vencidas</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{emailsEnviados.length}</div>
              <div className="text-sm text-gray-500">E-mails enviados</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{templatesAtivos.length}</div>
              <div className="text-sm text-gray-500">Templates ativos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-[#002333]">Notificações pendentes</h3>

          <div className="space-y-4">
            {faturasVencendo.length > 0 && (
              <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-yellow-800">Vencimento próximo</h4>
                    <p className="text-yellow-700 text-sm">{faturasVencendo.length} faturas em até 3 dias</p>
                  </div>
                  <button
                    onClick={() => abrirModalEnvio(faturasVencendo.map((f) => f.id), 'vencimento')}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Enviar lembretes
                  </button>
                </div>
              </div>
            )}

            {faturasVencidas.length > 0 && (
              <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-red-800">Faturas vencidas</h4>
                    <p className="text-red-700 text-sm">{faturasVencidas.length} faturas em atraso</p>
                  </div>
                  <button
                    onClick={() => abrirModalEnvio(faturasVencidas.map((f) => f.id), 'vencido')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Cobrar agora
                  </button>
                </div>
              </div>
            )}

            {faturasVencendo.length === 0 && faturasVencidas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Não há notificações pendentes</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium text-[#002333]">Últimos envios</h3>

          <div className="space-y-3">
            {emailsEnviados.slice(0, 8).map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{email.destinatario}</div>
                    <div className="text-xs text-gray-500">{email.assunto}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{email.dataEnvio.toLocaleString('pt-BR')}</div>
              </div>
            ))}

            {emailsEnviados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhum e-mail enviado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalEnvio && (
        <div
          className={MODAL_OVERLAY_CLASS}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !enviandoEmail) {
              setModalEnvio(false);
            }
          }}
        >
          <div className={`${MODAL_CONTAINER_CLASS} max-w-[1000px]`} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between border-b border-[#E1EAEE] px-6 py-4">
              <h3 className="text-lg font-semibold text-[#173A4D]">Confirmar envio</h3>
              <button
                type="button"
                onClick={() => setModalEnvio(false)}
                disabled={enviandoEmail}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-[#4F6B79]">
                      Enviar para <strong>{faturasSelecionadas.length}</strong> cliente(s)
                    </p>
                    <label className="mb-1 block text-sm font-medium text-[#244455]">Template</label>
                    <select
                      value={templateSelecionado?.id || ''}
                      onChange={(event) => {
                        const novoTemplate =
                          templatesAtivos.find((item) => item.id === event.target.value) || null;
                        setTemplateSelecionado(novoTemplate);
                      }}
                      className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                    >
                      <option value="" disabled>
                        Selecione um template
                      </option>
                      {templatesAtivos.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg border border-[#D4E2E7] bg-[#F8FBFC] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5E7784]">
                      Destinatario de amostra
                    </p>
                    <p className="mt-1 text-sm text-[#173A4D]">{previewDestinatario}</p>
                    {faturasSelecionadas.length > 1 && (
                      <p className="mt-2 text-xs text-[#5E7784]">
                        A pre-visualizacao usa a primeira fatura da selecao. Os demais clientes
                        receberao dados individualizados.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5E7784]">
                      Assunto final
                    </p>
                    <div className="mt-1 rounded-lg border border-[#D4E2E7] bg-white px-3 py-2 text-sm text-[#173A4D]">
                      {previewAssunto || 'Selecione um template para visualizar o assunto.'}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5E7784]">
                      Pre-visualizacao do email enviado
                    </p>
                    <div className="mt-1 rounded-xl border border-[#D4E2E7] bg-[#F4F8FA] p-3">
                      {previewHtmlFinal ? (
                        <div
                          className="max-h-[360px] overflow-auto rounded-lg border border-[#E1EAEE] bg-white"
                          dangerouslySetInnerHTML={{ __html: previewHtmlFinal }}
                        />
                      ) : (
                        <div className="rounded-lg border border-dashed border-[#C8D9DF] bg-white px-4 py-6 text-center text-sm text-[#5E7784]">
                          Selecione um template para visualizar o email final.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E2ECEF] pt-4">
                <button
                  type="button"
                  onClick={() => setModalEnvio(false)}
                  disabled={enviandoEmail}
                  className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviarEmailsLote}
                  disabled={enviandoEmail || !templateSelecionado}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviandoEmail ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalTemplate && (
        <div
          className={MODAL_OVERLAY_CLASS}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalTemplate(false);
            }
          }}
        >
          <div
            className={`${MODAL_CONTAINER_CLASS} max-h-[90vh] max-w-[920px]`}
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white px-6 py-4">
              <h3 className="text-lg font-semibold text-[#173A4D]">Gerenciar templates</h3>
              <button
                type="button"
                onClick={() => setModalTemplate(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex justify-end">
                <button
                  onClick={iniciarNovoTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#159A9C] text-white text-sm hover:bg-[#117C7E]"
                >
                  <Plus className="h-4 w-4" />
                  Novo template
                </button>
              </div>

              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-xl border border-[#D4E2E7] bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{template.nome}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              template.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {template.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{template.assunto}</p>
                        <p className="mt-1 text-xs text-gray-500">Trigger: {template.tipoTrigger}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setTemplateEditando({ ...template })}
                          className="rounded border border-[#D4E2E7] px-3 py-1.5 text-sm text-[#244455] hover:bg-[#F6FAFB]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleAtivoTemplate(template.id)}
                          className="rounded border border-[#D4E2E7] px-3 py-1.5 text-sm text-[#244455] hover:bg-[#F6FAFB]"
                        >
                          {template.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => excluirTemplate(template.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {templateEditando && (
                <div className="space-y-4 rounded-xl border border-[#D4E2E7] bg-[#F8FCFC] p-4">
                  <h4 className="font-medium text-gray-900">Editor de template</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-gray-600">Nome</label>
                      <input
                        value={templateEditando.nome}
                        onChange={(event) =>
                          setTemplateEditando((prev) =>
                            prev ? { ...prev, nome: event.target.value } : prev,
                          )
                        }
                        className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-600">Trigger</label>
                      <select
                        value={templateEditando.tipoTrigger}
                        onChange={(event) =>
                          setTemplateEditando((prev) =>
                            prev
                              ? { ...prev, tipoTrigger: event.target.value as TemplateEmail['tipoTrigger'] }
                              : prev,
                          )
                        }
                        className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                      >
                        <option value="manual">Manual</option>
                        <option value="vencimento">Vencimento</option>
                        <option value="vencido">Vencido</option>
                        <option value="pagamento">Pagamento</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Assunto</label>
                    <input
                      value={templateEditando.assunto}
                      onChange={(event) =>
                        setTemplateEditando((prev) =>
                          prev ? { ...prev, assunto: event.target.value } : prev,
                        )
                      }
                      className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Conteúdo</label>
                    <textarea
                      rows={6}
                      value={templateEditando.conteudo}
                      onChange={(event) =>
                        setTemplateEditando((prev) =>
                          prev ? { ...prev, conteudo: event.target.value } : prev,
                        )
                      }
                      className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#244455] focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Variáveis disponíveis: {'{numero}'}, {'{nomeCliente}'}, {'{valor}'}, {'{dataVencimento}'}, {'{dias}'}, {'{diasAtraso}'}, {'{linkPagamento}'}, {'{dataPagamento}'}.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-[#E2ECEF] pt-4">
                    <button
                      onClick={() => setTemplateEditando(null)}
                      className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarTemplate}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E]"
                    >
                      <Save className="h-4 w-4" />
                      Salvar template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
