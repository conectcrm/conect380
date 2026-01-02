import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Plus,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Fatura, StatusFatura } from '../../services/faturamentoService';

interface TriggerWorkflow {
  id: string;
  tipo:
    | 'fatura_criada'
    | 'fatura_vencida'
    | 'pagamento_recebido'
    | 'cliente_inadimplente'
    | 'data_especifica';
  condicoes: Record<string, any>;
}

interface AcaoWorkflow {
  id: string;
  tipo:
    | 'enviar_email'
    | 'criar_tarefa'
    | 'atualizar_status'
    | 'gerar_cobranca'
    | 'notificar_equipe'
    | 'aplicar_desconto';
  parametros: Record<string, any>;
  ordem: number;
}

interface Workflow {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  trigger: TriggerWorkflow;
  acoes: AcaoWorkflow[];
  estatisticas: {
    execucoes: number;
    sucessos: number;
    falhas: number;
    ultimaExecucao?: Date;
  };
  criadoEm: Date;
}

interface ExecucaoWorkflow {
  id: string;
  workflowId: string;
  status: 'executando' | 'sucesso' | 'falha' | 'aguardando';
  inicioExecucao: Date;
  fimExecucao?: Date;
  logs: string[];
  dadosContexto: Record<string, any>;
}

interface WorkflowAutomacaoProps {
  faturas: Fatura[];
  onExecutarAcao: (acao: string, dados: any) => Promise<void>;
}

const WORKFLOWS_PREDEFINIDOS: Workflow[] = [
  {
    id: '1',
    nome: 'Cobrança Automática - 3 Dias',
    descricao: 'Envia email de cobrança 3 dias após vencimento',
    ativo: true,
    trigger: {
      id: 'trigger_1',
      tipo: 'fatura_vencida',
      condicoes: { diasAtraso: 3 },
    },
    acoes: [
      {
        id: 'acao_1',
        tipo: 'enviar_email',
        parametros: { template: 'cobranca_suave', incluirBoleto: true },
        ordem: 1,
      },
      {
        id: 'acao_2',
        tipo: 'criar_tarefa',
        parametros: { titulo: 'Acompanhar cobrança', responsavel: 'financeiro' },
        ordem: 2,
      },
    ],
    estatisticas: { execucoes: 45, sucessos: 42, falhas: 3 },
    criadoEm: new Date('2024-01-15'),
  },
  {
    id: '2',
    nome: 'Welcome Journey - Novo Cliente',
    descricao: 'Sequência de boas-vindas para novos clientes',
    ativo: true,
    trigger: {
      id: 'trigger_2',
      tipo: 'fatura_criada',
      condicoes: { primeiraFatura: true },
    },
    acoes: [
      {
        id: 'acao_3',
        tipo: 'enviar_email',
        parametros: { template: 'boas_vindas', anexarGuia: true },
        ordem: 1,
      },
      {
        id: 'acao_4',
        tipo: 'criar_tarefa',
        parametros: { titulo: 'Ligar para novo cliente', responsavel: 'vendas', prazo: 2 },
        ordem: 2,
      },
    ],
    estatisticas: { execucoes: 12, sucessos: 12, falhas: 0 },
    criadoEm: new Date('2024-02-01'),
  },
  {
    id: '3',
    nome: 'Recuperação de Inadimplência',
    descricao: 'Processo escalado para clientes com 30+ dias em atraso',
    ativo: false,
    trigger: {
      id: 'trigger_3',
      tipo: 'cliente_inadimplente',
      condicoes: { diasAtraso: 30, valorMinimo: 500 },
    },
    acoes: [
      {
        id: 'acao_5',
        tipo: 'aplicar_desconto',
        parametros: { percentual: 10, validade: 7 },
        ordem: 1,
      },
      {
        id: 'acao_6',
        tipo: 'enviar_email',
        parametros: { template: 'ultima_chance', incluirDesconto: true },
        ordem: 2,
      },
      {
        id: 'acao_7',
        tipo: 'notificar_equipe',
        parametros: { equipe: 'juridico', prioridade: 'alta' },
        ordem: 3,
      },
    ],
    estatisticas: { execucoes: 8, sucessos: 5, falhas: 3 },
    criadoEm: new Date('2024-01-20'),
  },
];

export default function WorkflowAutomacao({ faturas, onExecutarAcao }: WorkflowAutomacaoProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(WORKFLOWS_PREDEFINIDOS);
  const [execucoesRecentes, setExecucoesRecentes] = useState<ExecucaoWorkflow[]>([]);
  const [modalNovoWorkflow, setModalNovoWorkflow] = useState(false);
  const [workflowSelecionado, setWorkflowSelecionado] = useState<Workflow | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Simula execuções recentes
  useEffect(() => {
    const execucoes: ExecucaoWorkflow[] = [
      {
        id: '1',
        workflowId: '1',
        status: 'sucesso',
        inicioExecucao: new Date(Date.now() - 300000), // 5 min atrás
        fimExecucao: new Date(Date.now() - 298000),
        logs: ['Email enviado com sucesso', 'Tarefa criada para equipe financeiro'],
        dadosContexto: { faturaId: 123, clienteNome: 'Empresa ABC' },
      },
      {
        id: '2',
        workflowId: '2',
        status: 'executando',
        inicioExecucao: new Date(Date.now() - 60000), // 1 min atrás
        logs: ['Enviando email de boas-vindas...'],
        dadosContexto: { faturaId: 124, clienteNome: 'Tech Solutions' },
      },
      {
        id: '3',
        workflowId: '1',
        status: 'falha',
        inicioExecucao: new Date(Date.now() - 900000), // 15 min atrás
        fimExecucao: new Date(Date.now() - 895000),
        logs: ['Erro ao enviar email', 'SMTP timeout'],
        dadosContexto: { faturaId: 125, clienteNome: 'Marketing Pro' },
      },
    ];
    setExecucoesRecentes(execucoes);
  }, []);

  const toggleWorkflow = async (workflowId: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, ativo: !w.ativo } : w)));
  };

  const executarWorkflowManual = async (workflow: Workflow) => {
    const novaExecucao: ExecucaoWorkflow = {
      id: Date.now().toString(),
      workflowId: workflow.id,
      status: 'executando',
      inicioExecucao: new Date(),
      logs: ['Execução manual iniciada'],
      dadosContexto: { executorManual: true },
    };

    setExecucoesRecentes((prev) => [novaExecucao, ...prev.slice(0, 9)]);

    // Simula execução
    setTimeout(() => {
      setExecucoesRecentes((prev) =>
        prev.map((e) =>
          e.id === novaExecucao.id
            ? {
                ...e,
                status: 'sucesso' as const,
                fimExecucao: new Date(),
                logs: [...e.logs, 'Todas as ações executadas com sucesso'],
              }
            : e,
        ),
      );
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sucesso':
        return 'text-green-600 bg-green-100';
      case 'falha':
        return 'text-red-600 bg-red-100';
      case 'executando':
        return 'text-blue-600 bg-blue-100';
      case 'aguardando':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTriggerLabel = (trigger: TriggerWorkflow) => {
    switch (trigger.tipo) {
      case 'fatura_criada':
        return 'Nova fatura criada';
      case 'fatura_vencida':
        return `Fatura vencida (${trigger.condicoes.diasAtraso} dias)`;
      case 'pagamento_recebido':
        return 'Pagamento recebido';
      case 'cliente_inadimplente':
        return `Cliente inadimplente (${trigger.condicoes.diasAtraso}+ dias)`;
      case 'data_especifica':
        return 'Data específica';
      default:
        return trigger.tipo;
    }
  };

  const getAcaoLabel = (acao: AcaoWorkflow) => {
    switch (acao.tipo) {
      case 'enviar_email':
        return `📧 Enviar ${acao.parametros.template}`;
      case 'criar_tarefa':
        return `📋 Criar tarefa: ${acao.parametros.titulo}`;
      case 'atualizar_status':
        return `🔄 Atualizar status`;
      case 'gerar_cobranca':
        return `💰 Gerar cobrança`;
      case 'notificar_equipe':
        return `🔔 Notificar ${acao.parametros.equipe}`;
      case 'aplicar_desconto':
        return `🏷️ Aplicar desconto ${acao.parametros.percentual}%`;
      default:
        return acao.tipo;
    }
  };

  const workflowsFiltrados = workflows.filter((w) => {
    if (filtroStatus === 'ativo') return w.ativo;
    if (filtroStatus === 'inativo') return !w.ativo;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Automação de Workflows</h2>
            <p className="text-gray-600">
              Configure e monitore processos automáticos para otimizar sua operação
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os workflows</option>
              <option value="ativo">Apenas ativos</option>
              <option value="inativo">Apenas inativos</option>
            </select>
            <button
              onClick={() => setModalNovoWorkflow(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {workflows.filter((w) => w.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Workflows Ativos</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {workflows.reduce((acc, w) => acc + w.estatisticas.execucoes, 0)}
              </div>
              <div className="text-sm text-gray-500">Execuções Totais</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {execucoesRecentes.filter((e) => e.status === 'executando').length}
              </div>
              <div className="text-sm text-gray-500">Em Execução</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(
                  (workflows.reduce((acc, w) => acc + w.estatisticas.sucessos, 0) /
                    Math.max(
                      workflows.reduce((acc, w) => acc + w.estatisticas.execucoes, 0),
                      1,
                    )) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-500">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Workflows */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Workflows Configurados</h3>
        </div>
        <div className="divide-y">
          {workflowsFiltrados.map((workflow) => (
            <div key={workflow.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{workflow.nome}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {workflow.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{workflow.descricao}</p>

                  {/* Trigger */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Gatilho: </span>
                    <span className="text-sm text-gray-600">
                      {getTriggerLabel(workflow.trigger)}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Ações: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {workflow.acoes.map((acao, index) => (
                        <span
                          key={acao.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {index + 1}. {getAcaoLabel(acao)}
                          {index < workflow.acoes.length - 1 && <ArrowRight className="w-3 h-3" />}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Execuções: {workflow.estatisticas.execucoes}</span>
                    <span>Sucessos: {workflow.estatisticas.sucessos}</span>
                    <span>Falhas: {workflow.estatisticas.falhas}</span>
                    {workflow.estatisticas.ultimaExecucao && (
                      <span>
                        Última: {workflow.estatisticas.ultimaExecucao.toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      workflow.ativo
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={workflow.ativo ? 'Pausar workflow' : 'Ativar workflow'}
                  >
                    {workflow.ativo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => executarWorkflowManual(workflow)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Executar manualmente"
                  >
                    <Zap className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setWorkflowSelecionado(workflow)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Configurar workflow"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execuções Recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Execuções Recentes</h3>
        </div>
        <div className="divide-y">
          {execucoesRecentes.map((execucao) => {
            const workflow = workflows.find((w) => w.id === execucao.workflowId);
            return (
              <div key={execucao.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{workflow?.nome}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execucao.status)}`}
                      >
                        {execucao.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Iniciado: {execucao.inicioExecucao.toLocaleString('pt-BR')}
                      {execucao.fimExecucao && (
                        <> • Finalizado: {execucao.fimExecucao.toLocaleString('pt-BR')}</>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Logs:</span>
                      <ul className="list-disc list-inside mt-1">
                        {execucao.logs.map((log, index) => (
                          <li key={index}>{log}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {execucao.status === 'executando' && (
                    <div className="ml-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
