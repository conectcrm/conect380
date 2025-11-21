import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  EstruturaFluxo,
  Etapa,
  OpcaoMenu,
  Condicao,
} from '../types/flow-builder.types';

interface FlowTestModalProps {
  open: boolean;
  estrutura: EstruturaFluxo | null;
  onClose: () => void;
}

type HistoryOrigin = 'bot' | 'user' | 'system';

interface HistoryEntry {
  id: string;
  from: HistoryOrigin;
  message: string;
  stepId?: string;
  timestamp: number;
}

type InteractionState =
  | { type: 'menu'; step: Etapa; options: OpcaoMenu[] }
  | { type: 'question'; step: Etapa }
  | { type: 'condition'; step: Etapa; condicoes: Condicao[] }
  | { type: 'continue'; step: Etapa; nextId?: string | null }
  | { type: 'none' };

const MENU_STEP_TYPES = new Set<Etapa['tipo']>(['mensagem_menu', 'menu_opcoes']);
const QUESTION_STEP_TYPES = new Set<Etapa['tipo']>(['coleta_dados', 'pergunta_aberta']);

const normalizeMenuOptions = (opcoes?: OpcaoMenu[]): OpcaoMenu[] => {
  if (!Array.isArray(opcoes)) {
    return [];
  }

  return opcoes.map((opcao, index) => {
    const valorCalculado = opcao?.valor ?? opcao?.numero ?? String(index + 1);
    return {
      ...opcao,
      valor: valorCalculado,
      numero: opcao.numero ?? valorCalculado,
      texto: opcao.texto ?? `Opção ${index + 1}`,
    };
  });
};

const cloneValue = <T,>(value: T): T => {
  if (typeof window !== 'undefined' && typeof (window as any).structuredClone === 'function') {
    return (window as any).structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value ?? {}));
};

const createHistoryEntry = (
  from: HistoryOrigin,
  message: string,
  stepId?: string,
): HistoryEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  from,
  message,
  stepId,
  timestamp: Date.now(),
});

export const FlowTestModal: React.FC<FlowTestModalProps> = ({ open, estrutura, onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'none' });
  const [isFinished, setIsFinished] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [context, setContext] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const historyEndRef = useRef<HTMLDivElement | null>(null);
  const contextRef = useRef<Record<string, any>>({});

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const scrollToBottom = useCallback(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  const getValueFromContext = useCallback((path: string) => {
    if (!path) return undefined;
    const normalized = path.replace(/^contexto\./, '');
    const segments = normalized.split('.');
    let current: any = contextRef.current;

    for (const segment of segments) {
      if (current == null) return undefined;
      current = current[segment];
    }

    return current;
  }, []);

  const evaluateConditionalExpression = useCallback(
    (expressao?: string) => {
      if (!expressao || typeof expressao !== 'string') {
        return false;
      }

      const parseValue = (raw: string): any => {
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        if (raw === 'null') return null;
        if (raw === 'undefined') return undefined;

        const numeric = Number(raw);
        if (!Number.isNaN(numeric) && raw.trim() !== '') {
          return numeric;
        }

        if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
          return raw.slice(1, -1);
        }

        return raw;
      };

      const evaluateSimple = (fragment: string): boolean => {
        const sanitized = fragment.replace(/contexto\./g, '').trim();
        const operadores = ['===', '!==', '==', '!='] as const;
        const operadorEncontrado = operadores.find(op => sanitized.includes(op));

        if (!operadorEncontrado) {
          return false;
        }

        const [variavelRaw, valorRaw] = sanitized.split(operadorEncontrado).map(part => part.trim());
        if (!variavelRaw) {
          return false;
        }

        const valorContexto = getValueFromContext(variavelRaw);
        const valorComparacao = parseValue(valorRaw);

        switch (operadorEncontrado) {
          case '===':
            return valorContexto === valorComparacao;
          case '!==':
            return valorContexto !== valorComparacao;
          case '==':
            return valorContexto == valorComparacao; // eslint-disable-line eqeqeq
          case '!=':
            return valorContexto != valorComparacao; // eslint-disable-line eqeqeq
          default:
            return false;
        }
      };

      try {
        const gruposOu = expressao
          .split('||')
          .map(grupo => grupo.trim())
          .filter(Boolean);

        if (gruposOu.length === 0) {
          return evaluateSimple(expressao);
        }

        return gruposOu.some(grupo => {
          const condicoesE = grupo
            .split('&&')
            .map(cond => cond.trim())
            .filter(Boolean);

          return condicoesE.every(evaluateSimple);
        });
      } catch (err) {
        console.warn('Não foi possível avaliar condição do fluxo:', err);
        return false;
      }
    },
    [getValueFromContext],
  );

  const formatMessage = useCallback(
    (rawMessage?: string) => {
      if (!rawMessage) return '';

      return rawMessage.replace(/{{\s*([^}]+)\s*}}/g, (_, token: string) => {
        const value = getValueFromContext(token.trim());
        if (value === null || typeof value === 'undefined') {
          return '';
        }

        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch (err) {
            return '[objeto]';
          }
        }

        return String(value);
      });
    },
    [getValueFromContext],
  );

  const evaluateCondition = useCallback(
    (condicao: Condicao) => {
      if (!condicao) {
        return false;
      }

      if (condicao.se) {
        return evaluateConditionalExpression(condicao.se);
      }

      if (!condicao.campo) {
        return false;
      }

      const valorAtual = getValueFromContext(condicao.campo);
      const valorComparacao = condicao.valor;

      switch (condicao.operador) {
        case 'igual':
          return valorAtual === valorComparacao;
        case 'diferente':
          return valorAtual !== valorComparacao;
        case 'contem':
          return (
            typeof valorAtual === 'string' &&
            typeof valorComparacao === 'string' &&
            valorAtual.toLowerCase().includes(valorComparacao.toLowerCase())
          );
        case 'maior':
          return Number(valorAtual) > Number(valorComparacao);
        case 'menor':
          return Number(valorAtual) < Number(valorComparacao);
        case 'existe':
          return valorAtual !== undefined && valorAtual !== null && valorAtual !== '';
        case 'nao_existe':
          return valorAtual === undefined || valorAtual === null || valorAtual === '';
        default:
          return false;
      }
    },
    [evaluateConditionalExpression, getValueFromContext],
  );

  const setValueAtPath = useCallback((target: Record<string, any>, path: string, value: any) => {
    if (!path) return;
    const segments = path.split('.');
    let cursor = target;

    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value;
        return;
      }

      if (cursor[segment] == null || typeof cursor[segment] !== 'object') {
        cursor[segment] = {};
      } else {
        cursor[segment] = Array.isArray(cursor[segment])
          ? [...cursor[segment]]
          : { ...cursor[segment] };
      }

      cursor = cursor[segment];
    });
  }, []);

  const applyContextUpdates = useCallback((updates: Record<string, any>) => {
    setContext(prev => {
      const next = cloneValue(prev || {});
      Object.entries(updates).forEach(([path, value]) => {
        setValueAtPath(next, path, value);
      });
      contextRef.current = next;
      return next;
    });
  }, [setValueAtPath]);

  const applyMenuContext = useCallback(
    (opcao: OpcaoMenu, resposta: string) => {
      if (!opcao.salvarContexto) return;

      const updates: Record<string, any> = {};

      Object.entries(opcao.salvarContexto).forEach(([chave, valor]) => {
        if (valor === '{{resposta}}') {
          updates[chave] = resposta;
          return;
        }

        if (typeof valor === 'string' && valor.startsWith('{{contexto.') && valor.endsWith('}}')) {
          const path = valor.slice(11, -2);
          updates[chave] = getValueFromContext(path);
          return;
        }

        updates[chave] = valor;
      });

      applyContextUpdates(updates);
    },
    [applyContextUpdates, getValueFromContext],
  );

  const resolveOptionNextStep = useCallback(
    (opcao: OpcaoMenu): string | undefined => {
      if (!opcao) {
        return undefined;
      }

      if (Array.isArray(opcao.proximaEtapaCondicional)) {
        for (const cond of opcao.proximaEtapaCondicional) {
          if (cond?.se && evaluateConditionalExpression(cond.se) && cond.entao) {
            return cond.entao;
          }
        }
      }

      return opcao.proximaEtapa ?? undefined;
    },
    [evaluateConditionalExpression],
  );

  const processStep = useCallback(
    (stepId: string, visited: Set<string> = new Set()) => {
      if (!estrutura || !estrutura.etapas) return;

      const etapa = estrutura.etapas[stepId];

      if (!etapa) {
        setHistory(prev => [
          ...prev,
          createHistoryEntry('system', `⚠️ Etapa "${stepId}" não encontrada na estrutura.`),
        ]);
        setIsFinished(true);
        setInteraction({ type: 'none' });
        setCurrentStepId(null);
        return;
      }

      setInteraction({ type: 'none' });
      setCurrentStepId(stepId);

      const mensagem = etapa.mensagem || etapa.nome || `Etapa ${stepId}`;
      const mensagemFormatada = formatMessage(mensagem);

      setHistory(prev => [
        ...prev,
        createHistoryEntry('bot', mensagemFormatada, stepId),
      ]);

      const normalizedOptions = normalizeMenuOptions(etapa.opcoes);

      if (Array.isArray(etapa.proximaEtapaCondicional)) {
        const condicaoAtendida = etapa.proximaEtapaCondicional.find(cond => cond?.se && evaluateConditionalExpression(cond.se));

        if (condicaoAtendida?.entao) {
          if (visited.has(condicaoAtendida.entao)) {
            setHistory(prev => [
              ...prev,
              createHistoryEntry('system', '⚠️ Loop detectado ao avaliar condição da etapa.'),
            ]);
            setIsFinished(true);
            setCurrentStepId(null);
            return;
          }

          const novoVisited = new Set(visited);
          novoVisited.add(stepId);
          processStep(condicaoAtendida.entao, novoVisited);
          return;
        }
      }

      if (etapa.tipo === 'finalizar') {
        setIsFinished(true);
        setCurrentStepId(null);
        return;
      }

      if ((etapa as any).aguardarResposta === false && etapa.proximaEtapa) {
        if (visited.has(etapa.proximaEtapa)) {
          setHistory(prev => [
            ...prev,
            createHistoryEntry('system', '⚠️ Loop detectado ao avançar automaticamente.'),
          ]);
          setIsFinished(true);
          setCurrentStepId(null);
          return;
        }

        const novoVisited = new Set(visited);
        novoVisited.add(stepId);
        processStep(etapa.proximaEtapa, novoVisited);
        return;
      }

      if (MENU_STEP_TYPES.has(etapa.tipo) && normalizedOptions.length > 0) {
        setInteraction({ type: 'menu', step: etapa, options: normalizedOptions });
        return;
      }

      if (QUESTION_STEP_TYPES.has(etapa.tipo)) {
        setInteraction({ type: 'question', step: etapa });
        return;
      }

      if (etapa.tipo === 'condicional' && etapa.condicoes && etapa.condicoes.length > 0) {
        const condicaoAtendida = etapa.condicoes.find(cond => evaluateCondition(cond));

        if (condicaoAtendida?.proximaEtapa) {
          processStep(condicaoAtendida.proximaEtapa, visited);
          return;
        }

        setInteraction({ type: 'condition', step: etapa, condicoes: etapa.condicoes });
        return;
      }

      if (etapa.proximaEtapa) {
        setInteraction({ type: 'continue', step: etapa, nextId: etapa.proximaEtapa });
        return;
      }

      setIsFinished(true);
      setCurrentStepId(null);
    },
    [estrutura, evaluateCondition, evaluateConditionalExpression, formatMessage],
  );

  const iniciarSimulacao = useCallback(() => {
    if (!estrutura) return;

    if (!estrutura.etapaInicial) {
      setError('Fluxo sem etapa inicial definido. Conecte o bloco Início.');
      return;
    }

    const contextoBase = estrutura.variaveis ? cloneValue(estrutura.variaveis) : {};
    contextRef.current = contextoBase;
    setContext(contextoBase);
    setHistory([]);
    setError(null);
    setIsFinished(false);
    setUserInput('');
    setCurrentStepId(null);
    setInteraction({ type: 'none' });

    processStep(estrutura.etapaInicial, new Set());
  }, [estrutura, processStep]);

  useEffect(() => {
    if (!open || !estrutura) return;
    iniciarSimulacao();
  }, [open, estrutura, iniciarSimulacao]);

  const handleMenuOption = (opcao: OpcaoMenu) => {
    const respostaValor = opcao.texto ?? opcao.valor ?? 'Opção';
    const resposta = String(respostaValor);

    setHistory(prev => [
      ...prev,
      createHistoryEntry('user', resposta, currentStepId || undefined),
    ]);

    applyMenuContext(opcao, resposta);
    setInteraction({ type: 'none' });

    const proxima = resolveOptionNextStep(opcao);

    if (proxima) {
      processStep(proxima, new Set());
    } else {
      setIsFinished(true);
      setCurrentStepId(null);
    }
  };

  const handleSendAnswer = () => {
    if (!estrutura || !currentStepId) return;
    const etapa = estrutura.etapas[currentStepId];
    if (!etapa) return;

    const resposta = userInput.trim();
    if (!resposta) return;

    setHistory(prev => [
      ...prev,
      createHistoryEntry('user', resposta, currentStepId),
    ]);

    setUserInput('');

    if ((etapa as any).variavel) {
      applyContextUpdates({ [(etapa as any).variavel]: resposta });
    }

    setInteraction({ type: 'none' });

    if (etapa.proximaEtapa) {
      processStep(etapa.proximaEtapa, new Set());
    } else {
      setIsFinished(true);
      setCurrentStepId(null);
    }
  };

  const handleConditionChoice = (condicao: Condicao) => {
    if (!condicao.proximaEtapa) {
      setHistory(prev => [
        ...prev,
        createHistoryEntry('system', 'Condição selecionada sem próxima etapa configurada.'),
      ]);
      setIsFinished(true);
      setCurrentStepId(null);
      return;
    }

    setInteraction({ type: 'none' });
    processStep(condicao.proximaEtapa, new Set());
  };

  const handleContinue = () => {
    if (interaction.type !== 'continue' || !interaction.nextId) {
      setIsFinished(true);
      setCurrentStepId(null);
      return;
    }

    setInteraction({ type: 'none' });
    processStep(interaction.nextId, new Set());
  };

  const handleReset = () => {
    iniciarSimulacao();
  };

  if (!open || !estrutura) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-[#002333]">🧪 Testar Fluxo</h2>
            <p className="text-sm text-gray-500">
              Visualize o comportamento do fluxo sem sair do construtor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Reiniciar
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3">
          {/* Conversation */}
          <div className="lg:col-span-2 flex flex-col border-r border-gray-200 bg-gray-50">
            <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Etapa Atual</p>
                <p className="text-sm font-semibold text-gray-700">
                  {currentStepId || (isFinished ? 'Fluxo finalizado' : 'Aguardando...')}
                </p>
              </div>
              {isFinished ? (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" /> Finalizado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                  Etapas em andamento
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {history.map(entry => (
                <div
                  key={entry.id}
                  className={`flex ${entry.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap ${entry.from === 'user'
                      ? 'bg-blue-600 text-white'
                      : entry.from === 'system'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-white text-gray-800'
                      }`}
                  >
                    {entry.stepId && entry.from !== 'user' && (
                      <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                        Etapa: {entry.stepId}
                      </p>
                    )}
                    {entry.message || '—'}
                  </div>
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>

            {/* Interaction controls */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              {interaction.type === 'menu' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Escolha uma opção</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interaction.options.map(opcao => (
                      <button
                        key={`${opcao.valor}-${opcao.texto}`}
                        onClick={() => handleMenuOption(opcao)}
                        className="text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl px-4 py-3 transition-colors"
                      >
                        <p className="text-sm font-semibold text-purple-700">{opcao.valor}</p>
                        <p className="text-sm text-purple-900 mt-1">{opcao.texto}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {interaction.type === 'question' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Responder</p>
                  <div className="flex gap-3">
                    <input
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendAnswer();
                        }
                      }}
                      placeholder="Digite a resposta para esta etapa"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendAnswer}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}

              {interaction.type === 'condition' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Escolha o resultado da condição
                  </p>
                  <div className="space-y-2">
                    {interaction.condicoes.map((condicao, index) => (
                      <button
                        key={`${condicao.campo || 'cond'}-${index}`}
                        onClick={() => handleConditionChoice(condicao)}
                        className="w-full text-left bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-4 py-3 transition-colors"
                      >
                        <p className="text-sm font-semibold text-amber-800">
                          {condicao.campo} {condicao.operador} {condicao.valor ?? '—'}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          Próxima etapa: {condicao.proximaEtapa || '—'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {interaction.type === 'continue' && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Próxima etapa</p>
                    <p className="text-sm text-gray-700">{interaction.nextId || 'Fim do fluxo'}</p>
                  </div>
                  <button
                    onClick={handleContinue}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Avançar
                  </button>
                </div>
              )}

              {interaction.type === 'none' && isFinished && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Fluxo finalizado.</p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reiniciar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Context panel */}
          <div className="hidden lg:flex flex-col bg-white">
            <div className="px-6 py-3 border-b border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500">Contexto da Simulação</p>
              <p className="text-sm text-gray-600 mt-0.5">Variáveis preenchidas durante o fluxo</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 whitespace-pre-wrap break-words max-h-full">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowTestModal;
