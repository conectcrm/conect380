import React, { useState, useEffect } from 'react';
import { Mail, Clock, Users, Send, Settings, AlertCircle, CheckCircle, X } from 'lucide-react';
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
  tentativas: number;
}

interface EmailAutomacaoProps {
  faturas: Fatura[];
  onEnviarEmail: (faturaIds: number[], templateId: string) => Promise<void>;
}

const TEMPLATES_PADRAO: TemplateEmail[] = [
  {
    id: '1',
    nome: 'Lembrete de Vencimento',
    assunto: 'Fatura {numero} vence em {dias} dias',
    conteudo: `Olá {nomeCliente},

Sua fatura #{numero} no valor de {valor} vence em {dias} dias ({dataVencimento}).

Para evitar multas e juros, efetue o pagamento até a data de vencimento.

Link para pagamento: {linkPagamento}

Atenciosamente,
Equipe ConectCRM`,
    tipoTrigger: 'vencimento',
    diasAntes: 3,
    ativo: true,
  },
  {
    id: '2',
    nome: 'Fatura Vencida',
    assunto: 'Fatura {numero} está em atraso - Ação necessária',
    conteudo: `Olá {nomeCliente},

Sua fatura #{numero} no valor de {valor} está em atraso há {diasAtraso} dias.

Para regularizar sua situação e evitar a suspensão dos serviços, efetue o pagamento o quanto antes.

Link para pagamento: {linkPagamento}

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
Equipe ConectCRM`,
    tipoTrigger: 'vencido',
    ativo: true,
  },
  {
    id: '3',
    nome: 'Confirmação de Pagamento',
    assunto: 'Pagamento confirmado - Fatura {numero}',
    conteudo: `Olá {nomeCliente},

Confirmamos o recebimento do pagamento da fatura #{numero} no valor de {valor}.

Data do pagamento: {dataPagamento}

Obrigado pela preferência!

Atenciosamente,
Equipe ConectCRM`,
    tipoTrigger: 'pagamento',
    ativo: true,
  },
];

export default function EmailAutomacao({ faturas, onEnviarEmail }: EmailAutomacaoProps) {
  const [templates, setTemplates] = useState<TemplateEmail[]>(TEMPLATES_PADRAO);
  const [emailsEnviados, setEmailsEnviados] = useState<EmailEnviado[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateEmail | null>(null);
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<number[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [modalTemplate, setModalTemplate] = useState(false);
  const [modalEnvio, setModalEnvio] = useState(false);

  // Filtra faturas que precisam de notificação
  const getFaturasParaNotificacao = (tipo: 'vencimento' | 'vencido') => {
    const hoje = new Date();

    if (tipo === 'vencimento') {
      return faturas.filter((fatura) => {
        const dataVencimento = new Date(fatura.dataVencimento);
        const diffDias = Math.ceil(
          (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diffDias <= 3 && diffDias >= 0 && fatura.status === StatusFatura.PENDENTE;
      });
    } else {
      return faturas.filter((fatura) => {
        const dataVencimento = new Date(fatura.dataVencimento);
        return dataVencimento < hoje && fatura.status !== StatusFatura.PAGA;
      });
    }
  };

  // Processa variáveis do template
  const processarTemplate = (
    template: TemplateEmail,
    fatura: Fatura,
  ): { assunto: string; conteudo: string } => {
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
      '{nomeCliente}': fatura.cliente?.nome || 'Cliente',
      '{valor}': formatarValorCompletoBRL(fatura.valorTotal),
      '{dataVencimento}': dataVencimento.toLocaleDateString('pt-BR'),
      '{dias}': diasParaVencimento.toString(),
      '{diasAtraso}': diasAtraso.toString(),
      '{linkPagamento}': `https://app.conectcrm.com/pagamento/${fatura.id}`,
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

  // Envia emails em lote
  const enviarEmailsLote = async () => {
    if (!templateSelecionado || faturasSelecionadas.length === 0) return;

    setEnviandoEmail(true);
    try {
      await onEnviarEmail(faturasSelecionadas, templateSelecionado.id);

      // Simula emails enviados
      const novosEmails: EmailEnviado[] = faturasSelecionadas.map((faturaId) => ({
        id: `email_${Date.now()}_${faturaId}`,
        faturaId,
        templateId: templateSelecionado.id,
        destinatario: faturas.find((f) => f.id === faturaId)?.cliente?.email || '',
        assunto: processarTemplate(templateSelecionado, faturas.find((f) => f.id === faturaId)!)
          .assunto,
        dataEnvio: new Date(),
        status: 'enviado' as const,
        tentativas: 1,
      }));

      setEmailsEnviados((prev) => [...prev, ...novosEmails]);
      setFaturasSelecionadas([]);
      setModalEnvio(false);
    } catch (error) {
      console.error('Erro ao enviar emails:', error);
    } finally {
      setEnviandoEmail(false);
    }
  };

  const fatturasVencimento = getFaturasParaNotificacao('vencimento');
  const fatturasVencidas = getFaturasParaNotificacao('vencido');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Automação de Emails</h2>
            <p className="text-gray-600">Configure e envie emails automáticos para seus clientes</p>
          </div>
          <button
            onClick={() => setModalTemplate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Gerenciar Templates
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{fatturasVencimento.length}</div>
              <div className="text-sm text-gray-500">Vencem em 3 dias</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{fatturasVencidas.length}</div>
              <div className="text-sm text-gray-500">Faturas vencidas</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{emailsEnviados.length}</div>
              <div className="text-sm text-gray-500">Emails enviados</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {templates.filter((t) => t.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Templates ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Faturas para Notificação */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notificações Pendentes</h3>

          <div className="space-y-4">
            {fatturasVencimento.length > 0 && (
              <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">Vencimento Próximo</h4>
                    <p className="text-yellow-700 text-sm">
                      {fatturasVencimento.length} faturas vencem em até 3 dias
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFaturasSelecionadas(fatturasVencimento.map((f) => f.id));
                      setTemplateSelecionado(
                        templates.find((t) => t.tipoTrigger === 'vencimento') || templates[0],
                      );
                      setModalEnvio(true);
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Enviar Lembretes
                  </button>
                </div>
              </div>
            )}

            {fatturasVencidas.length > 0 && (
              <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-800">Faturas Vencidas</h4>
                    <p className="text-red-700 text-sm">
                      {fatturasVencidas.length} faturas em atraso
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFaturasSelecionadas(fatturasVencidas.map((f) => f.id));
                      setTemplateSelecionado(
                        templates.find((t) => t.tipoTrigger === 'vencido') || templates[1],
                      );
                      setModalEnvio(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Cobrar Agora
                  </button>
                </div>
              </div>
            )}

            {fatturasVencimento.length === 0 && fatturasVencidas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>Não há notificações pendentes</p>
              </div>
            )}
          </div>
        </div>

        {/* Últimos Emails Enviados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Últimos Emails Enviados</h3>

          <div className="space-y-3">
            {emailsEnviados
              .slice(-5)
              .reverse()
              .map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        email.status === 'enviado'
                          ? 'bg-green-500'
                          : email.status === 'falha'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                    ></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{email.destinatario}</div>
                      <div className="text-xs text-gray-500">{email.assunto}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {email.dataEnvio.toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}

            {emailsEnviados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Nenhum email enviado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Envio */}
      {modalEnvio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirmar Envio</h3>
              <button
                onClick={() => setModalEnvio(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Enviar email para <strong>{faturasSelecionadas.length}</strong> cliente(s)
                </p>
                <p className="text-sm text-gray-600">
                  Template: <strong>{templateSelecionado?.nome}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalEnvio(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarEmailsLote}
                  disabled={enviandoEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {enviandoEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
