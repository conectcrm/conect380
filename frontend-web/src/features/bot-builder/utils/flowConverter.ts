// Conversor entre estrutura JSON do backend e React Flow

import { Node, Edge, Position } from 'reactflow';
import {
  EstruturaFluxo,
  Etapa,
  FlowNode,
  FlowEdge,
  BlockType,
  BlockData,
  OpcaoMenu,
} from '../types/flow-builder.types';

const MENU_TYPES = new Set(['mensagem_menu', 'menu_opcoes']);
const QUESTION_TYPES = new Set(['coleta_dados', 'pergunta_aberta']);
const CONDITION_TYPES = new Set(['condicional', 'validacao']);

const normalizeMessage = (mensagem: unknown): string => {
  if (typeof mensagem === 'string') {
    return mensagem;
  }

  if (Array.isArray(mensagem)) {
    return mensagem.filter(Boolean).map(String).join('\n');
  }

  if (mensagem && typeof mensagem === 'object') {
    return String((mensagem as any).texto || (mensagem as any).conteudo || '');
  }

  return '';
};

const normalizeOpcao = (opcao: OpcaoMenu, index: number): OpcaoMenu => {
  const valorCalculado = opcao?.valor ?? opcao?.numero ?? String(index + 1);

  return {
    ...opcao,
    valor: valorCalculado,
    numero: opcao.numero ?? valorCalculado,
    acao: opcao.acao || 'proximo_passo',
    texto: opcao.texto ?? `Opção ${index + 1}`,
  };
};

const normalizeEtapa = (id: string, etapa: any): Etapa => {
  if (!etapa) {
    return {
      id,
      tipo: 'mensagem',
      nome: id,
      mensagem: '',
    };
  }

  const mensagemNormalizada = normalizeMessage(etapa.mensagem);
  const opcoesNormalizadas = Array.isArray(etapa.opcoes)
    ? etapa.opcoes.map((opcao: OpcaoMenu, index: number) => normalizeOpcao(opcao, index))
    : undefined;

  // Inferir tipo se não definido
  let tipoNormalizado = (etapa.tipo || 'mensagem') as Etapa['tipo'];

  // Se tem opções mas tipo não foi definido, assumir menu_opcoes
  if (!etapa.tipo && opcoesNormalizadas && opcoesNormalizadas.length > 0) {
    tipoNormalizado = 'menu_opcoes';
  }

  // Se finalizar é true, tipo é finalizar
  if (etapa.finalizar === true) {
    tipoNormalizado = 'finalizar';
  }

  // Se acao é 'transferir', tipo é acao
  if (etapa.acao === 'transferir') {
    tipoNormalizado = 'acao';
  }

  return {
    ...etapa,
    id: etapa.id || id,
    tipo: tipoNormalizado,
    nome: etapa.nome || etapa.titulo,
    mensagem: mensagemNormalizada,
    opcoes: opcoesNormalizadas,
    condicoes: Array.isArray(etapa.condicoes) ? etapa.condicoes : undefined,
    proximaEtapa: etapa.proximaEtapa || etapa.proxima_etapa,
    proximaEtapaCondicional: Array.isArray(etapa.proximaEtapaCondicional)
      ? etapa.proximaEtapaCondicional
      : undefined,
  };
};

const getEtapaLabel = (etapa: Etapa, fallbackId: string): string => {
  if (etapa.nome && etapa.nome.trim().length > 0) {
    return etapa.nome;
  }

  if (etapa.mensagem && etapa.mensagem.trim().length > 0) {
    const sanitized = etapa.mensagem.trim().replace(/\s+/g, ' ');
    return sanitized.length > 40 ? `${sanitized.slice(0, 37)}...` : sanitized;
  }

  return fallbackId;
};

/**
 * 🔍 Detecta loops infinitos no fluxo
 * Retorna array de caminhos com loop (ex: ["inicio", "menu", "inicio"])
 */
function detectLoops(estrutura: EstruturaFluxo): string[][] {
  const loops: string[][] = [];
  const visitedPaths = new Map<string, Set<string>>(); // etapaId -> set de etapas no caminho atual

  function dfs(etapaId: string, path: string[]): void {
    // Se etapa já está no caminho atual, encontramos um loop
    if (path.includes(etapaId)) {
      const loopStart = path.indexOf(etapaId);
      const loop = [...path.slice(loopStart), etapaId];
      loops.push(loop);
      return;
    }

    // Se já visitamos esta etapa com este caminho, pular (evitar explosão combinatória)
    if (!visitedPaths.has(etapaId)) {
      visitedPaths.set(etapaId, new Set());
    }
    const pathKey = path.join('→');
    if (visitedPaths.get(etapaId)!.has(pathKey)) {
      return;
    }
    visitedPaths.get(etapaId)!.add(pathKey);

    const etapa = estrutura.etapas[etapaId];
    if (!etapa) return;

    const newPath = [...path, etapaId];

    // Checar proximaEtapa direta
    const proximaEtapa = etapa.proximaEtapa || (etapa as any).proxima_etapa;
    if (proximaEtapa && typeof proximaEtapa === 'string') {
      dfs(proximaEtapa, newPath);
    }

    // Checar opções de menu
    if (etapa.opcoes && Array.isArray(etapa.opcoes)) {
      for (const opcao of etapa.opcoes) {
        const proxima = opcao.proximaEtapa || (opcao as any).proxima_etapa;
        if (proxima && typeof proxima === 'string') {
          dfs(proxima, newPath);
        }
      }
    }

    // Checar condições
    if (etapa.condicoes && Array.isArray(etapa.condicoes)) {
      for (const condicao of etapa.condicoes) {
        if (condicao.proximaEtapa) {
          dfs(condicao.proximaEtapa, newPath);
        }
        if (condicao.entao) {
          dfs(condicao.entao, newPath);
        }
      }
    }

    // Checar proximaEtapaCondicional
    if (etapa.proximaEtapaCondicional && Array.isArray(etapa.proximaEtapaCondicional)) {
      for (const cond of etapa.proximaEtapaCondicional) {
        if (cond.entao) {
          dfs(cond.entao, newPath);
        }
      }
    }
  }

  // Iniciar DFS da etapa inicial
  if (estrutura.etapaInicial) {
    dfs(estrutura.etapaInicial, []);
  }

  return loops;
}

// ==================== JSON → VISUAL ====================

/**
 * Converte estrutura JSON do backend para nodes/edges do React Flow
 */
export function jsonToFlow(estrutura: EstruturaFluxo): { nodes: FlowNode[]; edges: FlowEdge[] } {
  // 🔍 DETECTAR LOOPS ANTES DE PROCESSAR
  const loops = detectLoops(estrutura);
  if (loops.length > 0) {
    const loopDescriptions = loops.map((loop) => loop.join(' → ')).join('\n');
    console.error('🔴 LOOPS INFINITOS DETECTADOS:', loops);
    throw new Error(
      `❌ Fluxo contém ${loops.length} loop(s) infinito(s):\n\n${loopDescriptions}\n\n` +
        `Por favor, corrija o fluxo removendo as referências circulares.`,
    );
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Cache para posicionamento
  const positionedNodes = new Map<string, { x: number; y: number }>();
  let currentY = 100;
  let currentLevel = 0;

  // 1. Criar nó inicial (START)
  const startNode: FlowNode = {
    id: 'start',
    type: 'start',
    position: { x: 400, y: 0 },
    data: {
      label: 'Início',
      tipo: 'mensagem' as any,
    },
  };
  nodes.push(startNode);
  positionedNodes.set('start', { x: 400, y: 0 });

  // 2. Conectar START → primeira etapa
  if (estrutura.etapaInicial) {
    edges.push({
      id: `start-${estrutura.etapaInicial}`,
      source: 'start',
      target: estrutura.etapaInicial,
      animated: true,
    });
  }

  // 3. Processar todas as etapas
  const processedNodes = new Set<string>();
  const queue: Array<{ etapaId: string; level: number; parentX: number }> = [];

  if (estrutura.etapaInicial) {
    queue.push({ etapaId: estrutura.etapaInicial, level: 1, parentX: 400 });
  }

  while (queue.length > 0) {
    const { etapaId, level, parentX } = queue.shift()!;

    if (processedNodes.has(etapaId) || !estrutura.etapas?.[etapaId]) continue;
    processedNodes.add(etapaId);

    const etapa = normalizeEtapa(etapaId, estrutura.etapas[etapaId]);

    // Calcular posição
    const x = parentX;
    const y = level * 200;

    // Criar node
    const node = etapaToNode(etapaId, etapa, { x, y });
    nodes.push(node);
    positionedNodes.set(etapaId, { x, y });

    // Processar conexões (edges)
    const nextSteps = getNextSteps(etapa);

    nextSteps.forEach((next, index) => {
      // Criar edge
      edges.push({
        id: `${etapaId}-${next.targetId}-${index}`,
        source: etapaId,
        target: next.targetId,
        label: next.label,
        animated: next.animated,
        type: next.type,
      });

      // Adicionar à fila se ainda não processado
      if (!processedNodes.has(next.targetId)) {
        const offsetX = (index - (nextSteps.length - 1) / 2) * 250;
        queue.push({
          etapaId: next.targetId,
          level: level + 1,
          parentX: x + offsetX,
        });
      }
    });
  }

  return { nodes, edges };
}

/**
 * Converte uma Etapa em Node do React Flow
 */
function etapaToNode(id: string, etapa: Etapa, position: { x: number; y: number }): FlowNode {
  const blockType = getBlockType(etapa.tipo);
  const label = getEtapaLabel(etapa, id);

  return {
    id,
    type: blockType,
    position,
    data: {
      label,
      tipo: etapa.tipo,
      etapa,
      isValid: true,
    },
  };
}

/**
 * Mapeia tipo de etapa para tipo de bloco visual
 */
function getBlockType(tipo: string): BlockType {
  if (!tipo) {
    return 'message';
  }

  if (MENU_TYPES.has(tipo)) {
    return 'menu';
  }

  if (QUESTION_TYPES.has(tipo)) {
    return 'question';
  }

  if (tipo === 'acao') {
    return 'action';
  }

  if (tipo === 'finalizar') {
    return 'end';
  }

  if (CONDITION_TYPES.has(tipo)) {
    return 'condition';
  }

  return 'message';
}

/**
 * Extrai próximas etapas de uma etapa
 * Suporta tanto formato novo (proximaEtapa) quanto legado (proxima_etapa)
 */
function getNextSteps(
  etapa: Etapa,
): Array<{ targetId: string; label?: string; animated?: boolean; type?: string }> {
  const nextSteps: Array<{ targetId: string; label?: string; animated?: boolean; type?: string }> =
    [];
  const pushStep = (step: {
    targetId?: string;
    label?: string;
    animated?: boolean;
    type?: string;
  }) => {
    if (!step.targetId) {
      return;
    }

    if (
      nextSteps.find(
        (existing) => existing.targetId === step.targetId && existing.label === step.label,
      )
    ) {
      return;
    }

    nextSteps.push(step as { targetId: string; label?: string; animated?: boolean; type?: string });
  };

  if (Array.isArray(etapa.opcoes) && etapa.opcoes.length > 0) {
    etapa.opcoes.forEach((opcao: any, index) => {
      // Suporte a formato novo e legado
      const proximaEtapa = opcao.proximaEtapa || opcao.proxima_etapa;

      if (proximaEtapa) {
        pushStep({
          targetId: proximaEtapa,
          label: opcao.texto || String(opcao.valor ?? index + 1),
          animated: false,
        });
      }

      if (Array.isArray(opcao.proximaEtapaCondicional)) {
        opcao.proximaEtapaCondicional.forEach((cond: any, condIndex: number) => {
          pushStep({
            targetId: cond.entao,
            label: cond.se || `${opcao.texto || 'Opção'} (condição ${condIndex + 1})`,
            animated: false,
            type: 'smoothstep',
          });
        });
      }
    });
  }

  if (Array.isArray(etapa.condicoes) && etapa.condicoes.length > 0) {
    etapa.condicoes.forEach((condicao, index) => {
      pushStep({
        targetId: condicao.proximaEtapa,
        label: condicao.campo
          ? `${condicao.campo} ${condicao.operador || '->'}`
          : index === 0
            ? 'Sim'
            : 'Não',
        animated: false,
        type: 'smoothstep',
      });
    });
  }

  if (Array.isArray(etapa.proximaEtapaCondicional)) {
    etapa.proximaEtapaCondicional.forEach((cond, condIndex) => {
      pushStep({
        targetId: cond.entao,
        label: cond.se || `Condição ${condIndex + 1}`,
        animated: false,
        type: 'smoothstep',
      });
    });
  }

  // Suporte a formato novo e legado
  const proximaEtapa = (etapa as any).proximaEtapa || (etapa as any).proxima_etapa;
  if (proximaEtapa) {
    pushStep({
      targetId: proximaEtapa,
      animated: true,
    });
  }

  return nextSteps;
}

// ==================== VISUAL → JSON ====================

/**
 * Converte nodes/edges do React Flow para estrutura JSON do backend
 */
export function flowToJson(nodes: FlowNode[], edges: FlowEdge[]): EstruturaFluxo {
  const etapas: Record<string, Etapa> = {};
  let etapaInicial = '';

  // 1. Identificar etapa inicial (conectada ao START)
  const startEdge = edges.find((e) => e.source === 'start');
  if (startEdge) {
    etapaInicial = startEdge.target;
  }

  // 2. Converter cada node (exceto START) em Etapa
  nodes.forEach((node) => {
    if (node.id === 'start') return;

    const etapa = nodeToEtapa(node, edges);
    if (etapa) {
      etapas[node.id] = etapa;
    }
  });

  return {
    etapaInicial,
    versao: '1.0',
    etapas,
  };
}

/**
 * Converte Node do React Flow em Etapa
 */
function nodeToEtapa(node: FlowNode, edges: FlowEdge[]): Etapa | null {
  const { data } = node;

  if (!data.etapa) return null;

  const etapa: Etapa = {
    ...data.etapa,
    id: node.id,
  };

  // Atualizar conexões baseado nos edges
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  // Se tem opções de menu, atualizar proximaEtapa de cada opção
  if (etapa.opcoes && etapa.opcoes.length > 0) {
    etapa.opcoes = etapa.opcoes.map((opcao, index) => {
      const handleId = `source-${index}`;
      const edgeByHandle = outgoingEdges.find((e) => e.sourceHandle === handleId);
      const edgeByLabel = outgoingEdges.find((e) => e.label === opcao.texto);

      const edge = edgeByHandle || edgeByLabel;

      return {
        ...opcao,
        proximaEtapa: edge?.target ?? opcao.proximaEtapa,
      };
    });
  }

  // Se tem condições, atualizar proximaEtapa de cada condição
  if (etapa.condicoes && etapa.condicoes.length > 0) {
    etapa.condicoes = etapa.condicoes.map((condicao, index) => {
      const edge = outgoingEdges.find((e) => e.label === (index === 0 ? 'Sim' : 'Não'));
      return {
        ...condicao,
        proximaEtapa: edge?.target || condicao.proximaEtapa,
      };
    });
  }

  // Próxima etapa simples
  if (outgoingEdges.length === 1 && !etapa.opcoes && !etapa.condicoes) {
    etapa.proximaEtapa = outgoingEdges[0].target;
  }

  return etapa;
}

// ==================== VALIDAÇÃO ====================

/**
 * Valida se o fluxo está completo e sem erros
 */
export function validateFlow(
  nodes: FlowNode[],
  edges: FlowEdge[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const nodeMap = new Map<string, FlowNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  // 1. Verificar se tem nó START
  const hasStart = nodes.some((n) => n.id === 'start');
  if (!hasStart) {
    errors.push('Fluxo deve ter um bloco de Início');
  }

  // 2. Verificar se START está conectado
  const startConnected = edges.some((e) => e.source === 'start');
  if (!startConnected) {
    errors.push('Bloco de Início deve estar conectado a uma etapa');
  }

  // 3. Verificar nodes órfãos (exceto START)
  const connectedNodes = new Set<string>();
  edges.forEach((e) => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });

  nodes.forEach((node) => {
    if (node.id !== 'start' && !connectedNodes.has(node.id)) {
      errors.push(`Bloco "${node.data.label}" está desconectado`);
    }
  });

  // 4. Verificar se nodes têm configuração válida
  nodes.forEach((node) => {
    if (node.id === 'start') return;

    if (!node.data.etapa) {
      errors.push(`Bloco "${node.data.label}" não está configurado`);
      return;
    }

    const etapa = node.data.etapa;

    const requiresMensagem =
      MENU_TYPES.has(etapa.tipo) || QUESTION_TYPES.has(etapa.tipo) || etapa.tipo === 'mensagem';
    if (requiresMensagem && (!etapa.mensagem || etapa.mensagem.trim() === '')) {
      errors.push(`Bloco "${node.data.label}" precisa de uma mensagem`);
    }

    // Validar opções de menu
    if (MENU_TYPES.has(etapa.tipo) && (!etapa.opcoes || etapa.opcoes.length === 0)) {
      errors.push(`Bloco de Menu "${node.data.label}" precisa ter opções`);
    }
  });

  // 5. Verificar loops infinitos (básico)
  const isInteractiveNode = (nodeId: string): boolean => {
    if (nodeId === 'start') return false;
    const node = nodeMap.get(nodeId);
    const etapa = node?.data?.etapa as any;
    if (!etapa) return false;

    if (MENU_TYPES.has(etapa.tipo) || QUESTION_TYPES.has(etapa.tipo)) {
      return true;
    }

    if (etapa.tipo === 'mensagem' && etapa.aguardarResposta === true) {
      return true;
    }

    return false;
  };

  const stack: string[] = [];
  const visited = new Set<string>();
  let hasBlockingCycle = false;

  const dfs = (nodeId: string) => {
    if (hasBlockingCycle) return;

    stack.push(nodeId);
    visited.add(nodeId);

    const outgoing = edges.filter((e) => e.source === nodeId);

    for (const edge of outgoing) {
      const existingIndex = stack.indexOf(edge.target);
      if (existingIndex !== -1) {
        const cycleNodes = stack.slice(existingIndex);
        const hasInteractiveInCycle = cycleNodes.some((id) => isInteractiveNode(id));

        if (!hasInteractiveInCycle) {
          hasBlockingCycle = true;
          return;
        }

        continue;
      }

      if (!visited.has(edge.target)) {
        dfs(edge.target);
        if (hasBlockingCycle) return;
      }
    }

    stack.pop();
  };

  if (hasStart) {
    dfs('start');
  }

  if (hasBlockingCycle) {
    errors.push('Fluxo contém um loop infinito');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ==================== UTILITÁRIOS ====================

/**
 * Gera ID único para novo node
 */
export function generateNodeId(prefix: string = 'etapa'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula posição para novo node
 */
export function calculateNewNodePosition(nodes: FlowNode[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 400, y: 100 };
  }

  // Encontrar posição mais baixa
  const maxY = Math.max(...nodes.map((n) => n.position.y));

  return {
    x: 400,
    y: maxY + 200,
  };
}
