// Painel de Configuração de Blocos

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { FlowNode, Etapa, OpcaoMenu } from '../types/flow-builder.types';
import { departamentoService } from '../../../services/departamentoService';
import { Departamento } from '../../../types/departamentoTypes';

interface BlockConfigProps {
  node: FlowNode | null;
  onUpdate: (nodeId: string, data: Partial<FlowNode['data']>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  nucleos?: Array<{ id: string; nome: string }>;
}

export const BlockConfig: React.FC<BlockConfigProps> = ({
  node,
  onUpdate,
  onClose,
  onDelete,
  nucleos = []
}) => {
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);

  const cloneDeep = <T,>(value: T): T => {
    if (value == null) {
      return value;
    }

    const globalClone = (globalThis as unknown as { structuredClone?: <K>(input: K) => K }).structuredClone;

    if (typeof globalClone === 'function') {
      try {
        return globalClone(value);
      } catch (error) {
        console.warn('structuredClone falhou, usando fallback JSON', error);
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      console.warn('JSON fallback falhou ao clonar valor', error);
      return value;
    }
  };

  // Função para carregar departamentos quando núcleo for selecionado
  const carregarDepartamentos = async (nucleoId: string) => {
    if (!nucleoId) {
      setDepartamentos([]);
      return;
    }

    try {
      setLoadingDepartamentos(true);
      const deps = await departamentoService.listarPorNucleo(nucleoId);
      setDepartamentos(deps.filter(d => d.ativo));
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      setDepartamentos([]);
    } finally {
      setLoadingDepartamentos(false);
    }
  };

  useEffect(() => {
    if (node?.data.etapa) {
      setEtapa(cloneDeep(node.data.etapa));
    } else if (node) {
      // Criar etapa inicial baseado no tipo
      const novaEtapa: Etapa = {
        id: node.id,
        tipo: node.data.tipo,
        nome: node.data.label,
        mensagem: '',
      };

      if (node.type === 'menu') {
        novaEtapa.opcoes = [];
      }

      setEtapa(novaEtapa);
    }
  }, [node]);

  if (!node || !etapa) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-400 px-6">
          <p className="text-sm">Selecione um bloco para configurar</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (etapa) {
      const etapaClonada = cloneDeep(etapa);
      console.log('💾 Salvando configuração do bloco:', {
        nodeId: node.id,
        opcoes: etapaClonada.opcoes,
        totalOpcoes: etapaClonada.opcoes?.length || 0
      });
      onUpdate(node.id, {
        etapa: etapaClonada,
        label: etapaClonada.nome || etapaClonada.mensagem?.substring(0, 30) || 'Bloco sem título',
      });
      // Fechar painel após salvar
      onClose();
    }
  };

  const handleAddOption = () => {
    setEtapa((prevEtapa) => {
      if (!prevEtapa) return prevEtapa;

      const opcoesAtuais = Array.isArray(prevEtapa.opcoes) ? [...prevEtapa.opcoes] : [];

      const novaOpcao: OpcaoMenu = {
        valor: String(opcoesAtuais.length + 1),
        texto: `Opção ${opcoesAtuais.length + 1}`,
        acao: 'proximo_passo',
      };

      opcoesAtuais.push(novaOpcao);

      console.log('➕ Nova opção adicionada:', {
        totalOpcoes: opcoesAtuais.length,
        novaOpcao
      });

      return {
        ...prevEtapa,
        opcoes: opcoesAtuais,
      };
    });
  };

  const handleUpdateOption = (index: number, field: keyof OpcaoMenu, value: any) => {
    setEtapa((prevEtapa) => {
      if (!prevEtapa?.opcoes) {
        return prevEtapa;
      }

      const novasOpcoes = prevEtapa.opcoes.map((opcao, idx) =>
        idx === index ? { ...opcao, [field]: value } : opcao,
      );

      return {
        ...prevEtapa,
        opcoes: novasOpcoes,
      };
    });
  };

  const handleRemoveOption = (index: number) => {
    setEtapa((prevEtapa) => {
      if (!prevEtapa?.opcoes) {
        return prevEtapa;
      }

      const novasOpcoes = prevEtapa.opcoes
        .filter((_, i) => i !== index)
        .map((opcao, idx) => ({
          ...opcao,
          valor: opcao.valor ?? String(idx + 1),
          numero: opcao.numero ?? String(idx + 1),
        }));

      return {
        ...prevEtapa,
        opcoes: novasOpcoes,
      };
    });
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-bold text-[#002333]">
          ⚙️ Configurar Bloco
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Nome do Bloco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Bloco
          </label>
          <input
            type="text"
            value={etapa.nome}
            onChange={(e) => setEtapa({ ...etapa, nome: e.target.value })}
            placeholder="Ex: Boas-vindas"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem {node.type === 'menu' && '(Pergunta)'}
          </label>
          <textarea
            value={etapa.mensagem}
            onChange={(e) => setEtapa({ ...etapa, mensagem: e.target.value })}
            placeholder="Digite a mensagem que será enviada..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {etapa.mensagem.length} caracteres
          </p>
        </div>

        {/* Seleção de Núcleos (Menu Dinâmico) */}
        {node.type === 'menu' && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  🎯 Menu Dinâmico de Núcleos
                </label>
                <p className="text-xs text-blue-700">
                  Marque os núcleos que devem aparecer no menu. O bot irá listar automaticamente os departamentos de cada núcleo.
                </p>
              </div>
            </div>

            {nucleos.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nucleos.map((nucleo) => {
                  const nucleosSelecionados = etapa.nucleosMenu || [];
                  const isSelected = nucleosSelecionados.includes(nucleo.id);

                  return (
                    <label
                      key={nucleo.id}
                      className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const nucleosAtuais = etapa.nucleosMenu || [];
                          const novosNucleos = e.target.checked
                            ? [...nucleosAtuais, nucleo.id]
                            : nucleosAtuais.filter(id => id !== nucleo.id);

                          setEtapa({ ...etapa, nucleosMenu: novosNucleos });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {nucleo.nome}
                        </span>
                        {isSelected && (
                          <span className="ml-2 text-xs text-green-600 font-medium">
                            ✓ Incluído no menu
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-blue-700 italic">
                Nenhum núcleo cadastrado. Cadastre núcleos em Gestão → Núcleos.
              </p>
            )}

            {etapa.nucleosMenu && etapa.nucleosMenu.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-800">
                  ✓ <strong>{etapa.nucleosMenu.length}</strong> núcleo(s) selecionado(s).
                  O bot irá gerar automaticamente as opções do menu.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Opções (Menu) */}
        {node.type === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Opções Manuais (Opcional)
              </label>
              <button
                onClick={handleAddOption}
                className="text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition-colors"
              >
                + Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Use opções manuais apenas se precisar de ações customizadas além dos núcleos dinâmicos.
            </p>

            <div className="space-y-3">
              {etapa.opcoes && etapa.opcoes.length > 0 ? (
                etapa.opcoes.map((opcao, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">
                        Opção {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Número</label>
                        <input
                          type="text"
                          value={opcao.valor}
                          onChange={(e) => handleUpdateOption(index, 'valor', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Texto</label>
                        <input
                          type="text"
                          value={opcao.texto}
                          onChange={(e) => handleUpdateOption(index, 'texto', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ação</label>
                        <select
                          value={opcao.acao}
                          onChange={(e) => handleUpdateOption(index, 'acao', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="proximo_passo">Próximo Passo</option>
                          <option value="transferir_nucleo">Transferir para Núcleo</option>
                          <option value="finalizar">Finalizar</option>
                        </select>
                      </div>

                      {opcao.acao === 'transferir_nucleo' && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Núcleo</label>
                            <select
                              value={opcao.nucleoId || ''}
                              onChange={(e) => {
                                handleUpdateOption(index, 'nucleoId', e.target.value);
                                carregarDepartamentos(e.target.value);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Selecione...</option>
                              {nucleos.map(n => (
                                <option key={n.id} value={n.id}>{n.nome}</option>
                              ))}
                            </select>
                          </div>

                          {opcao.nucleoId && (
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 mb-1">
                                Departamento (opcional)
                              </label>
                              {loadingDepartamentos ? (
                                <p className="text-xs text-gray-500 italic">Carregando...</p>
                              ) : departamentos.length > 0 ? (
                                <select
                                  value={opcao.departamentoId || ''}
                                  onChange={(e) => handleUpdateOption(index, 'departamentoId', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Nenhum (transferir para núcleo)</option>
                                  {departamentos.map(d => (
                                    <option key={d.id} value={d.id}>
                                      {d.codigo} - {d.nome}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-xs text-gray-500 italic">
                                  Nenhum departamento ativo neste núcleo
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  Nenhuma opção adicionada ainda
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ação (Action Block) */}
        {node.type === 'action' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Ação
            </label>
            <select
              value={etapa.opcoes?.[0]?.acao || 'proximo_passo'}
              onChange={(e) => {
                const novaOpcao: OpcaoMenu = {
                  valor: '1',
                  texto: 'Ação',
                  acao: e.target.value as any,
                };
                setEtapa({ ...etapa, opcoes: [novaOpcao] });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="proximo_passo">Próximo Passo</option>
              <option value="transferir_nucleo">Transferir para Núcleo</option>
              <option value="criar_ticket">Criar Ticket</option>
              <option value="finalizar">Finalizar Atendimento</option>
            </select>

            {etapa.opcoes?.[0]?.acao === 'transferir_nucleo' && (
              <>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Núcleo
                  </label>
                  <select
                    value={etapa.opcoes[0].nucleoId || ''}
                    onChange={(e) => {
                      const novasOpcoes = [...(etapa.opcoes || [])];
                      novasOpcoes[0] = { ...novasOpcoes[0], nucleoId: e.target.value };
                      setEtapa({ ...etapa, opcoes: novasOpcoes });
                      carregarDepartamentos(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Selecione um núcleo...</option>
                    {nucleos.map(n => (
                      <option key={n.id} value={n.id}>{n.nome}</option>
                    ))}
                  </select>
                </div>

                {etapa.opcoes[0].nucleoId && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento (opcional)
                    </label>
                    {loadingDepartamentos ? (
                      <p className="text-sm text-gray-500 italic">Carregando departamentos...</p>
                    ) : departamentos.length > 0 ? (
                      <select
                        value={etapa.opcoes[0].departamentoId || ''}
                        onChange={(e) => {
                          const novasOpcoes = [...(etapa.opcoes || [])];
                          novasOpcoes[0] = { ...novasOpcoes[0], departamentoId: e.target.value };
                          setEtapa({ ...etapa, opcoes: novasOpcoes });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Nenhum (transferir apenas para núcleo)</option>
                        {departamentos.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.codigo} - {d.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Nenhum departamento ativo neste núcleo
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* Footer - Actions */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
