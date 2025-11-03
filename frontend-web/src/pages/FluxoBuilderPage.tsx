// Página Principal - Construtor Visual de Fluxos de Bot

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  OnConnect,
  OnNodesDelete,
  OnEdgesDelete,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Play, AlertCircle, CheckCircle2, Smartphone, History } from 'lucide-react';

// Components
import { BlockLibrary } from '../features/bot-builder/components/BlockLibrary';
import { BlockConfig } from '../features/bot-builder/components/BlockConfig';
import { WhatsAppPreview } from '../features/bot-builder/components/WhatsAppPreview';
import { ModalHistoricoVersoes } from '../features/bot-builder/components/ModalHistoricoVersoes';
import { BackToNucleus } from '../components/navigation/BackToNucleus';

// Blocks
import { StartBlock } from '../features/bot-builder/components/blocks/StartBlock';
import { MessageBlock } from '../features/bot-builder/components/blocks/MessageBlock';
import { MenuBlock } from '../features/bot-builder/components/blocks/MenuBlock';
import { QuestionBlock } from '../features/bot-builder/components/blocks/QuestionBlock';
import { ConditionBlock } from '../features/bot-builder/components/blocks/ConditionBlock';
import { ActionBlock } from '../features/bot-builder/components/blocks/ActionBlock';
import { EndBlock } from '../features/bot-builder/components/blocks/EndBlock';

// Utils
import {
  jsonToFlow,
  flowToJson,
  validateFlow,
  generateNodeId,
  calculateNewNodePosition
} from '../features/bot-builder/utils/flowConverter';
import { corrigirLoopsAutomaticamente } from '../features/bot-builder/utils/loop-fixer';

// Types
import { FlowNode, FlowEdge, Etapa, BlockData, EstruturaFluxo } from '../features/bot-builder/types/flow-builder.types';

// Services
import fluxoService from '../services/fluxoService';
import nucleoService from '../services/nucleoService';
import { FlowTestModal } from '../features/bot-builder/components/FlowTestModal';

// Node Types
const nodeTypes = {
  start: StartBlock,
  message: MessageBlock,
  menu: MenuBlock,
  question: QuestionBlock,
  condition: ConditionBlock,
  action: ActionBlock,
  end: EndBlock,
};

const FluxoBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Helper para formatar tempo relativo
  const formatarTempoRelativo = (data: Date): string => {
    const agora = new Date();
    const diff = Math.floor((agora.getTime() - data.getTime()) / 1000); // em segundos

    if (diff < 60) return 'agora há pouco';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Estados
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [fluxo, setFluxo] = useState<any>(null);
  const [nucleos, setNucleos] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testStructure, setTestStructure] = useState<EstruturaFluxo | null>(null);
  const [estruturaComLoop, setEstruturaComLoop] = useState<EstruturaFluxo | null>(null); // Para correção automática
  const [autoSaving, setAutoSaving] = useState(false); // Indicador de autosave
  const [lastSaved, setLastSaved] = useState<Date | null>(null); // Último salvamento
  const [showPreview, setShowPreview] = useState(true); // Mostrar preview WhatsApp
  const [showHistorico, setShowHistorico] = useState(false); // Modal de histórico de versões

  // Ref para debounce do autosave
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ==================== INICIALIZAÇÃO ====================

  useEffect(() => {
    carregarNucleos();
  }, []);

  useEffect(() => {
    if (id) {
      carregarFluxo(id);
    } else {
      carregarFluxoPadraoWhatsapp();
    }
  }, [id]);

  // 💾 Autosave com debounce de 3 segundos
  useEffect(() => {
    if (!isDirty || !fluxo?.id) {
      return; // Não salvar se não houver mudanças ou se for fluxo novo
    }

    // Limpar timer anterior
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Configurar novo timer
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true);
        console.log('💾 Autosave iniciado...');

        const estrutura = flowToJson(nodes as FlowNode[], edges as FlowEdge[]);

        await fluxoService.atualizar(fluxo.id, {
          estrutura,
        });

        setLastSaved(new Date());
        setIsDirty(false);
        console.log('✅ Autosave concluído');
      } catch (error) {
        console.error('❌ Erro no autosave:', error);
        // Não mostrar alert para não interromper usuário
      } finally {
        setAutoSaving(false);
      }
    }, 3000); // 3 segundos de debounce

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, isDirty, fluxo?.id]);

  const carregarNucleos = async () => {
    try {
      const dados = await nucleoService.listar();
      setNucleos(dados);
    } catch (err) {
      console.error('Erro ao carregar núcleos:', err);
    }
  };

  const aplicarEstruturaNoCanvas = useCallback((estrutura?: EstruturaFluxo | null) => {
    if (!estrutura) {
      inicializarNovoFluxo();
      return;
    }

    const estruturaNormalizada: EstruturaFluxo = {
      etapaInicial: estrutura.etapaInicial,
      etapas: estrutura.etapas || {},
      variaveis: estrutura.variaveis,
      versao: estrutura.versao || '1.0',
    };

    try {
      const { nodes: visualNodes, edges: visualEdges } = jsonToFlow(estruturaNormalizada);
      setNodes(visualNodes);
      setEdges(visualEdges);
      setValidationErrors([]);
      setIsDirty(false);
      setEstruturaComLoop(null); // Limpar estrutura com loop se carregou com sucesso
    } catch (error: any) {
      console.error('❌ Erro ao converter JSON para visual:', error);

      // Se for erro de loop infinito, salvar estrutura e oferecer correção
      if (error.message.includes('loop') || error.message.includes('Loop')) {
        setEstruturaComLoop(estruturaNormalizada); // Salvar para correção automática

        setValidationErrors([
          '🔴 LOOP INFINITO DETECTADO',
          '',
          error.message,
          '',
          '🤖 CORREÇÃO AUTOMÁTICA DISPONÍVEL',
          'Clique no botão "� Corrigir Loops Automaticamente" abaixo',
          'O sistema removerá as opções "Voltar" que causam ciclos',
          '',
          '📝 OU corrija manualmente:',
          '1. Abra o editor JSON',
          '2. Encontre as etapas que referenciam umas às outras ciclicamente',
          '3. Remova ou redirecione uma das conexões para quebrar o ciclo',
        ]);
      } else {
        setValidationErrors([`Erro ao carregar fluxo: ${error.message}`]);
      }

      // Manter visualização vazia para evitar crash
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  const carregarFluxo = async (fluxoId: string) => {
    try {
      setLoading(true);
      const dados = await fluxoService.buscarPorId(fluxoId);
      setFluxo(dados);
      aplicarEstruturaNoCanvas(dados.estrutura as EstruturaFluxo);
    } catch (err) {
      console.error('Erro ao carregar fluxo:', err);
      alert('Erro ao carregar fluxo');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔧 Corrige loops automaticamente e recarrega
   */
  const handleCorrigirLoopsAutomaticamente = async () => {
    if (!estruturaComLoop) {
      alert('Nenhuma estrutura com loop para corrigir');
      return;
    }

    try {
      console.log('🔧 Iniciando correção automática de loops...');

      const { fluxoCorrigido, loopsCorrigidos, acoesTomadas } =
        corrigirLoopsAutomaticamente(estruturaComLoop);

      if (loopsCorrigidos.length === 0) {
        alert('❌ Não foi possível corrigir os loops automaticamente. Tente correção manual.');
        return;
      }

      console.log('✅ Loops corrigidos:', loopsCorrigidos);
      console.log('📝 Ações tomadas:', acoesTomadas);

      // Exibir resumo das ações
      const resumo = acoesTomadas.join('\n');
      const confirmacao = window.confirm(
        `🔧 CORREÇÃO AUTOMÁTICA\n\n${resumo}\n\n` +
        `Deseja aplicar estas correções e salvar o fluxo?`
      );

      if (!confirmacao) {
        console.log('❌ Correção cancelada pelo usuário');
        return;
      }

      // Aplicar estrutura corrigida no canvas
      aplicarEstruturaNoCanvas(fluxoCorrigido);

      // Salvar automaticamente
      if (fluxo?.id) {
        setSaving(true);
        await fluxoService.atualizar(fluxo.id, {
          estrutura: fluxoCorrigido,
        });

        alert('✅ Loops corrigidos e fluxo salvo com sucesso!');
        setEstruturaComLoop(null);
        setValidationErrors([]);
      } else {
        alert('⚠️ Loops corrigidos! Não esqueça de salvar o fluxo.');
        setIsDirty(true);
      }

    } catch (error: any) {
      console.error('❌ Erro ao corrigir loops:', error);
      alert(`Erro ao corrigir loops: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const carregarFluxoPadraoWhatsapp = async () => {
    try {
      setLoading(true);
      const fluxos = await fluxoService.listar({ publicado: true, canal: 'whatsapp' });
      const fluxoPadrao = fluxos.find((item) =>
        item.codigo === 'FLUXO_PADRAO_WHATSAPP' || item.nome?.toLowerCase() === 'fluxo padrao whatsapp'
      );

      if (fluxoPadrao) {
        setFluxo(fluxoPadrao);
        aplicarEstruturaNoCanvas(fluxoPadrao.estrutura as EstruturaFluxo);
        return;
      }

      console.warn('Fluxo Padrao WhatsApp não encontrado. Inicializando fluxo vazio.');
      inicializarNovoFluxo();
    } catch (err) {
      console.error('Erro ao carregar Fluxo Padrao WhatsApp:', err);
      inicializarNovoFluxo();
    } finally {
      setLoading(false);
    }
  };

  const inicializarNovoFluxo = () => {
    // Criar fluxo vazio com apenas bloco START
    const startNode: FlowNode = {
      id: 'start',
      type: 'start',
      position: { x: 400, y: 50 },
      data: {
        label: 'Início',
        tipo: 'mensagem' as any,
      },
    };

    setNodes([startNode]);
    setEdges([]);
    setFluxo(null);
    setValidationErrors([]);
    setIsDirty(false);
  };

  // ==================== MANIPULAÇÃO DE BLOCOS ====================

  const resolveEtapaTipo = useCallback((blockType: string): BlockData['tipo'] => {
    switch (blockType) {
      case 'menu':
        return 'mensagem_menu';
      case 'question':
        return 'coleta_dados';
      case 'condition':
        return 'condicional';
      case 'action':
        return 'acao';
      case 'end':
        return 'finalizar';
      default:
        return 'mensagem';
    }
  }, []);

  const onAddBlock = useCallback((type: string) => {
    const newPosition = calculateNewNodePosition(nodes as FlowNode[]);
    const newId = generateNodeId(type);
    const etapaTipo = resolveEtapaTipo(type);

    const newNode: FlowNode = {
      id: newId,
      type: type as any,
      position: newPosition,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        tipo: etapaTipo,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  }, [nodes, resolveEtapaTipo, setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      const newId = generateNodeId(type);

      const newNode: FlowNode = {
        id: newId,
        type: type as any,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          tipo: resolveEtapaTipo(type),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [resolveEtapaTipo, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const baseIdParts = [
          connection.source || 'source',
          connection.sourceHandle || 'default',
          connection.target || 'target',
          connection.targetHandle || 'default',
        ];
        const baseId = baseIdParts.join('-');

        let uniqueId = baseId;
        let suffix = 1;
        while (eds.some(edge => edge.id === uniqueId)) {
          uniqueId = `${baseId}-${suffix++}`;
        }

        const edge: FlowEdge = {
          id: uniqueId,
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          animated: true,
        };

        return addEdge(edge, eds);
      });

      setIsDirty(true);
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === 'start') return; // START não é configurável
    setSelectedNode(node as FlowNode);
  }, []);

  const onUpdateNode = useCallback((nodeId: string, data: Partial<BlockData>) => {
    console.log('🔄 Atualizando node:', {
      nodeId,
      novosDados: data,
      totalOpcoes: data.etapa?.opcoes?.length || 0,
      opcoes: data.etapa?.opcoes
    });

    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
    setIsDirty(true);
    setSelectedNode(null);
  }, [setNodes]);

  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setSelectedNode(null);
    setIsDirty(true);
  }, [setNodes]);

  // ==================== VALIDAÇÃO E SALVAMENTO ====================

  const validarFluxo = useCallback(() => {
    const validation = validateFlow(nodes as FlowNode[], edges as FlowEdge[]);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [nodes, edges]);

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }

    validarFluxo();
  }, [nodes, edges, validarFluxo]);

  const isEditing = Boolean(id);

  const salvarFluxo = async () => {
    console.log('🖱️ Botão SALVAR clicado!');
    console.log('📊 Estado atual:', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      validationErrors: validationErrors.length,
      errors: validationErrors
    });

    // Validar primeiro
    if (!validarFluxo()) {
      console.error('❌ Validação falhou:', validationErrors);
      alert('Corrija os erros antes de salvar');
      return;
    }

    try {
      setSaving(true);

      // Converter Visual → JSON
      const estrutura = flowToJson(nodes as FlowNode[], edges as FlowEdge[]);

      console.log('🔄 Salvando fluxo - estrutura convertida:', {
        etapas: Object.keys(estrutura.etapas).map(key => ({
          id: key,
          tipo: estrutura.etapas[key].tipo,
          totalOpcoes: estrutura.etapas[key].opcoes?.length || 0,
          opcoes: estrutura.etapas[key].opcoes
        }))
      });

      const nomeFluxo = isEditing
        ? fluxo?.nome || 'Fluxo sem nome'
        : fluxo?.nome
          ? `${fluxo.nome} (Cópia)`
          : 'Novo Fluxo';

      const dto: any = {
        nome: nomeFluxo,
        descricao: fluxo?.descricao || '',
        tipo: 'menu_opcoes',
        canais: ['whatsapp'],
        estrutura,
      };

      if (isEditing && id) {
        console.log('📤 Enviando atualização para API:', { id, dto });
        await fluxoService.atualizar(id, dto);
        alert('Fluxo atualizado com sucesso!');
      } else {
        const novoFluxo = await fluxoService.criar(dto);
        alert('Fluxo criado com sucesso!');
        navigate(`/gestao/fluxos/${novoFluxo.id}/builder`);
      }

      setIsDirty(false);
    } catch (err: any) {
      console.error('❌ Erro ao salvar fluxo:', err);
      console.error('❌ Resposta do servidor:', err.response?.data);
      alert(`Erro ao salvar: ${err.response?.data?.message || err.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestFlow = () => {
    if (!validarFluxo()) {
      alert('Corrija os erros antes de testar');
      return;
    }

    try {
      const estrutura = flowToJson(nodes as FlowNode[], edges as FlowEdge[]);

      if (!estrutura.etapaInicial) {
        alert('Conecte o bloco de início a uma etapa antes de testar o fluxo.');
        return;
      }

      setTestStructure(estrutura);
      setIsTestOpen(true);
    } catch (err: unknown) {
      console.error('Erro ao gerar estrutura para teste:', err);
      alert('Não foi possível preparar o fluxo para teste. Verifique a configuração das etapas.');
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando fluxo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToNucleus nucleusName="Gestão" nucleusPath="/gestao/fluxos" />
            <div>
              <h1 className="text-2xl font-bold text-[#002333]">
                🤖 Construtor de Fluxos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? (fluxo?.nome || 'Fluxo sem nome') : (fluxo?.nome ? `${fluxo.nome} (importado)` : 'Novo Fluxo')} {isDirty && '(não salvo)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Validação */}
            {validationErrors.length > 0 ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {validationErrors.length} erro{validationErrors.length > 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Fluxo válido</span>
              </div>
            )}

            {/* Indicador de Autosave */}
            {autoSaving && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">💾 Salvando...</span>
              </div>
            )}

            {/* Último salvamento */}
            {lastSaved && !autoSaving && isDirty === false && (
              <div className="text-sm text-gray-500">
                ✅ Salvo {formatarTempoRelativo(lastSaved)}
              </div>
            )}

            {/* Aviso de alterações não salvas */}
            {isDirty && !autoSaving && (
              <div className="text-sm text-orange-600 font-medium">
                ⚠️ Alterações não salvas
              </div>
            )}

            {/* Botões */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors font-medium"
              title={showPreview ? 'Ocultar preview WhatsApp' : 'Mostrar preview WhatsApp'}
            >
              <Smartphone className="w-5 h-5" />
              {showPreview ? 'Ocultar' : 'Preview'}
            </button>

            {/* Botão Histórico de Versões */}
            {id && (
              <button
                onClick={() => setShowHistorico(true)}
                className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors font-medium"
                title="Ver histórico de versões"
              >
                <History className="w-5 h-5" />
                Histórico
              </button>
            )}

            <button
              onClick={() => {
                console.log('🔘 Click detectado no botão Salvar');
                console.log('🚦 Botão habilitado?', !(saving || validationErrors.length > 0));
                salvarFluxo();
              }}
              disabled={saving || validationErrors.length > 0}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>

            <button
              onClick={handleTestFlow}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              Testar
            </button>
          </div>
        </div>

        {/* Erros de Validação */}
        {validationErrors.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-800 mb-2">Erros encontrados:</p>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>

            {/* Botão de Correção Automática (se houver estrutura com loop) */}
            {estruturaComLoop && (
              <button
                onClick={handleCorrigirLoopsAutomaticamente}
                disabled={saving}
                className="mt-3 w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 
                          text-white font-medium rounded-lg transition-colors duration-200 
                          flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    🔧 Corrigir Loops Automaticamente
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda - Biblioteca de Blocos */}
        <BlockLibrary onAddBlock={onAddBlock} />

        {/* Canvas Central - React Flow */}
        <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#10b981';
                  case 'message': return '#3b82f6';
                  case 'menu': return '#a855f7';
                  case 'question': return '#eab308';
                  case 'condition': return '#14b8a6';
                  case 'action': return '#f97316';
                  case 'end': return '#ef4444';
                  default: return '#6b7280';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>

        {/* Sidebar Direita - Configuração de Blocos e Preview */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Tabs */}
          {showPreview && selectedNode && (
            <div className="flex border-b">
              <button
                onClick={() => setShowPreview(false)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${!showPreview
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                ⚙️ Configuração
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${showPreview
                  ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                📱 Preview
              </button>
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden">
            {showPreview && selectedNode ? (
              <WhatsAppPreview
                selectedNode={selectedNode}
                nodes={nodes}
                edges={edges}
              />
            ) : (
              <BlockConfig
                node={selectedNode}
                onUpdate={onUpdateNode}
                onClose={() => setSelectedNode(null)}
                onDelete={onDeleteNode}
                nucleos={nucleos}
              />
            )}
          </div>
        </div>
      </div>

      <FlowTestModal
        open={isTestOpen}
        estrutura={testStructure}
        onClose={() => {
          setIsTestOpen(false);
        }}
      />

      {/* Modal de Histórico de Versões */}
      <ModalHistoricoVersoes
        open={showHistorico}
        fluxoId={id || ''}
        onClose={() => setShowHistorico(false)}
        onRestore={() => {
          // Recarregar fluxo após restaurar versão
          if (id) {
            carregarFluxo(id);
          }
        }}
      />
    </div>
  );
};

export default FluxoBuilderPage;
