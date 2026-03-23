import React, { useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  MailWarning,
  Pause,
  Play,
  RefreshCcw,
  XCircle,
  Zap,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';
import { formatarValorCompletoBRL, converterParaNumero } from '../../utils/formatacao';

export interface WorkflowExecutionResult {
  processados: number;
  sucesso: number;
  falhas: number;
  mensagem: string;
}

interface WorkflowAutomacaoProps {
  faturas: Fatura[];
  onExecutarAcao: (
    acao: string,
    dados: Record<string, unknown>,
  ) => Promise<WorkflowExecutionResult | void>;
}

type WorkflowId = 'lembrete_vencimento' | 'cobranca_vencidas' | 'sincronizacao_financeira';

interface WorkflowConfig {
  id: WorkflowId;
  nome: string;
  descricao: string;
  acao: string;
  ativo: boolean;
}

interface WorkflowHistorico {
  id: string;
  workflowId: WorkflowId;
  workflowNome: string;
  status: 'sucesso' | 'falha';
  inicioExecucao: string;
  fimExecucao: string;
  processados: number;
  sucesso: number;
  falhas: number;
  mensagem: string;
}

const WORKFLOW_STORAGE_KEY = 'faturamento-workflows-config-v1';
const HISTORICO_STORAGE_KEY = 'faturamento-workflows-historico-v1';

const WORKFLOWS_BASE: WorkflowConfig[] = [
  {
    id: 'lembrete_vencimento',
    nome: 'Lembrete de Vencimento (D-3)',
    descricao: 'Dispara lembretes para faturas pendentes com vencimento em até 3 dias.',
    acao: 'workflow_lembrete_vencimento',
    ativo: true,
  },
  {
    id: 'cobranca_vencidas',
    nome: 'Cobrança de Faturas Vencidas',
    descricao: 'Envia cobrança para faturas em atraso e registra o lote executado.',
    acao: 'workflow_cobranca_vencidas',
    ativo: true,
  },
  {
    id: 'sincronizacao_financeira',
    nome: 'Sincronização Financeira',
    descricao: 'Atualiza status de vencidas e processa cobranças recorrentes pendentes.',
    acao: 'workflow_sincronizacao_financeira',
    ativo: true,
  },
];

const lerJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch (_error) {
    return fallback;
  }
};

const salvarJSON = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_error) {
    // Ignora indisponibilidade de storage sem quebrar a tela
  }
};

const getDiasParaVencimento = (dataVencimento: string): number => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function WorkflowAutomacao({ faturas, onExecutarAcao }: WorkflowAutomacaoProps) {
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>(() => {
    const salvo = lerJSON<WorkflowConfig[]>(WORKFLOW_STORAGE_KEY, []);
    if (!salvo.length) return WORKFLOWS_BASE;

    // Merge para garantir novos workflows default sem perder preferencia do usuario
    return WORKFLOWS_BASE.map((base) => {
      const existente = salvo.find((item) => item.id === base.id);
      return existente ? { ...base, ativo: existente.ativo } : base;
    });
  });
  const [historico, setHistorico] = useState<WorkflowHistorico[]>(() =>
    lerJSON<WorkflowHistorico[]>(HISTORICO_STORAGE_KEY, []),
  );
  const [workflowExecutando, setWorkflowExecutando] = useState<WorkflowId | null>(null);
  const [executandoLote, setExecutandoLote] = useState(false);

  const metricas = useMemo(() => {
    const faturasPendentes = faturas.filter((f) =>
      [StatusFatura.PENDENTE, StatusFatura.ENVIADA, StatusFatura.PARCIALMENTE_PAGA].includes(f.status),
    );
    const faturasVencendo = faturasPendentes.filter((f) => {
      const dias = getDiasParaVencimento(f.dataVencimento);
      return dias >= 0 && dias <= 3;
    });
    const faturasVencidas = faturas.filter((f) => {
      if ([StatusFatura.PAGA, StatusFatura.CANCELADA].includes(f.status)) return false;
      return getDiasParaVencimento(f.dataVencimento) < 0;
    });
    const valorVencido = faturasVencidas.reduce((acc, item) => acc + converterParaNumero(item.valorTotal), 0);
    const ativos = workflows.filter((w) => w.ativo).length;

    return {
      ativos,
      faturasVencendo: faturasVencendo.length,
      faturasVencidas: faturasVencidas.length,
      valorVencido,
    };
  }, [faturas, workflows]);

  const salvarWorkflows = (novos: WorkflowConfig[]) => {
    setWorkflows(novos);
    salvarJSON(WORKFLOW_STORAGE_KEY, novos);
  };

  const salvarHistorico = (novos: WorkflowHistorico[]) => {
    const limitado = novos.slice(0, 30);
    setHistorico(limitado);
    salvarJSON(HISTORICO_STORAGE_KEY, limitado);
  };

  const toggleWorkflow = (workflowId: WorkflowId) => {
    const atualizados = workflows.map((item) =>
      item.id === workflowId ? { ...item, ativo: !item.ativo } : item,
    );
    salvarWorkflows(atualizados);
  };

  const registrarExecucao = (entrada: Omit<WorkflowHistorico, 'id'>) => {
    const novaEntrada: WorkflowHistorico = {
      id: `${entrada.workflowId}_${Date.now()}`,
      ...entrada,
    };
    salvarHistorico([novaEntrada, ...historico]);
  };

  const executarWorkflow = async (workflow: WorkflowConfig) => {
    const inicio = new Date();
    setWorkflowExecutando(workflow.id);

    try {
      const resultado = await onExecutarAcao(workflow.acao, {
        workflowId: workflow.id,
        nomeWorkflow: workflow.nome,
      });

      const fallback: WorkflowExecutionResult = {
        processados: 0,
        sucesso: 0,
        falhas: 0,
        mensagem: 'Workflow executado com sucesso.',
      };
      const dados = resultado || fallback;

      registrarExecucao({
        workflowId: workflow.id,
        workflowNome: workflow.nome,
        status: dados.falhas > 0 ? 'falha' : 'sucesso',
        inicioExecucao: inicio.toISOString(),
        fimExecucao: new Date().toISOString(),
        processados: dados.processados,
        sucesso: dados.sucesso,
        falhas: dados.falhas,
        mensagem: dados.mensagem,
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Falha ao executar workflow.';
      registrarExecucao({
        workflowId: workflow.id,
        workflowNome: workflow.nome,
        status: 'falha',
        inicioExecucao: inicio.toISOString(),
        fimExecucao: new Date().toISOString(),
        processados: 0,
        sucesso: 0,
        falhas: 1,
        mensagem,
      });
    } finally {
      setWorkflowExecutando(null);
    }
  };

  const executarTodosAtivos = async () => {
    const ativos = workflows.filter((workflow) => workflow.ativo);
    if (!ativos.length) return;

    setExecutandoLote(true);
    try {
      for (const workflow of ativos) {
        // Execucao sequencial para evitar sobrecarga de chamadas em lote no backend
        // e manter rastreabilidade simples do historico.
        // eslint-disable-next-line no-await-in-loop
        await executarWorkflow(workflow);
      }
    } finally {
      setExecutandoLote(false);
    }
  };

  const ultimoHistorico = (workflowId: WorkflowId) =>
    historico.find((item) => item.workflowId === workflowId);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#002333]">Automação de Workflows</h2>
            <p className="text-gray-600 mt-1">
              Execute fluxos operacionais do faturamento com controle de histórico.
            </p>
          </div>
          <button
            onClick={executarTodosAtivos}
            disabled={executandoLote || workflowExecutando !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Zap className="h-4 w-4" />
            {executandoLote ? 'Executando workflows ativos...' : 'Executar workflows ativos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#E8F6F6] p-2">
              <Activity className="h-5 w-5 text-[#159A9C]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metricas.ativos}</p>
              <p className="text-sm text-gray-500">Workflows ativos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <CalendarClock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metricas.faturasVencendo}</p>
              <p className="text-sm text-gray-500">Vencendo em até 3 dias</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <MailWarning className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metricas.faturasVencidas}</p>
              <p className="text-sm text-gray-500">Faturas vencidas</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#D4E2E7] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatarValorCompletoBRL(metricas.valorVencido)}</p>
              <p className="text-sm text-gray-500">Valor total em atraso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {workflows.map((workflow) => {
          const emExecucao = workflowExecutando === workflow.id;
          const ultimo = ultimoHistorico(workflow.id);

          return (
            <div key={workflow.id} className="rounded-2xl border border-[#D4E2E7] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.nome}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        workflow.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {workflow.ativo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{workflow.descricao}</p>
                  {ultimo && (
                    <div className="text-xs text-gray-500">
                      Última execução: {new Date(ultimo.fimExecucao).toLocaleString('pt-BR')} - {ultimo.mensagem}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      workflow.ativo
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {workflow.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {workflow.ativo ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => executarWorkflow(workflow)}
                    disabled={emExecucao || executandoLote}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCcw className={`h-4 w-4 ${emExecucao ? 'animate-spin' : ''}`} />
                    {emExecucao ? 'Executando...' : 'Executar agora'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#D4E2E7] bg-white shadow-sm">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-[#002333]">Histórico de execuções</h3>
        </div>
        {historico.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Nenhuma execução registrada.</div>
        ) : (
          <div className="divide-y">
            {historico.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.workflowNome}</p>
                    <p className="text-xs text-gray-500">
                      Início: {new Date(item.inicioExecucao).toLocaleString('pt-BR')} | Fim:{' '}
                      {new Date(item.fimExecucao).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{item.mensagem}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${
                        item.status === 'sucesso'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status === 'sucesso' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {item.status === 'sucesso' ? 'Sucesso' : 'Falha'}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                      Processados: {item.processados}
                    </span>
                    <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                      Sucesso: {item.sucesso}
                    </span>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                      Falhas: {item.falhas}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
