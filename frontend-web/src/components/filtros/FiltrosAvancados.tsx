import React, { useState, useEffect } from 'react';
import { Filter, X, Calendar, DollarSign, User, Tag, Save, Star, Trash2 } from 'lucide-react';
import {
  StatusFatura,
  TipoFatura,
  FormaPagamento,
  FiltrosFatura,
} from '../../services/faturamentoService';

interface FiltroAvancado extends FiltrosFatura {
  nome?: string;
  dataInicioEmissao?: string;
  dataFimEmissao?: string;
  dataInicioVencimento?: string;
  dataFimVencimento?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  clienteNome?: string;
  contratoNumero?: string;
  numeroFatura?: string;
}

interface FiltroSalvo {
  id: string;
  nome: string;
  filtro: FiltroAvancado;
  criadoEm: Date;
  favorito: boolean;
}

interface FiltrosAvancadosProps {
  isOpen: boolean;
  onClose: () => void;
  onAplicarFiltros: (filtros: FiltroAvancado) => void;
  filtrosAtuais: FiltroAvancado;
}

export default function FiltrosAvancados({
  isOpen,
  onClose,
  onAplicarFiltros,
  filtrosAtuais,
}: FiltrosAvancadosProps) {
  const [filtros, setFiltros] = useState<FiltroAvancado>(filtrosAtuais);
  const [filtrosSalvos, setFiltrosSalvos] = useState<FiltroSalvo[]>([]);
  const [nomeFiltroSalvar, setNomeFiltroSalvar] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<'filtros' | 'salvos'>('filtros');

  useEffect(() => {
    if (isOpen) {
      setFiltros(filtrosAtuais);
      carregarFiltrosSalvos();
    }
  }, [isOpen, filtrosAtuais]);

  const carregarFiltrosSalvos = () => {
    const salvos = localStorage.getItem('faturamento-filtros-salvos');
    if (salvos) {
      try {
        const filtrosParsed = JSON.parse(salvos).map((f: any) => ({
          ...f,
          criadoEm: new Date(f.criadoEm),
        }));
        setFiltrosSalvos(filtrosParsed);
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error);
      }
    }
  };

  const salvarFiltrosSalvos = (novos: FiltroSalvo[]) => {
    localStorage.setItem('faturamento-filtros-salvos', JSON.stringify(novos));
    setFiltrosSalvos(novos);
  };

  const handleSalvarFiltro = () => {
    if (!nomeFiltroSalvar.trim()) {
      alert('Digite um nome para o filtro');
      return;
    }

    const novoFiltro: FiltroSalvo = {
      id: Date.now().toString(),
      nome: nomeFiltroSalvar.trim(),
      filtro: { ...filtros },
      criadoEm: new Date(),
      favorito: false,
    };

    const novos = [...filtrosSalvos, novoFiltro];
    salvarFiltrosSalvos(novos);
    setNomeFiltroSalvar('');
    setAbaSelecionada('salvos');
  };

  const handleCarregarFiltro = (filtroSalvo: FiltroSalvo) => {
    setFiltros(filtroSalvo.filtro);
    setAbaSelecionada('filtros');
  };

  const handleExcluirFiltro = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este filtro?')) {
      const novos = filtrosSalvos.filter((f) => f.id !== id);
      salvarFiltrosSalvos(novos);
    }
  };

  const handleToggleFavorito = (id: string) => {
    const novos = filtrosSalvos.map((f) => (f.id === id ? { ...f, favorito: !f.favorito } : f));
    salvarFiltrosSalvos(novos);
  };

  const limparFiltros = () => {
    const filtrosLimpos: FiltroAvancado = {};
    setFiltros(filtrosLimpos);
  };

  const contarFiltrosAtivos = () => {
    return Object.keys(filtros).filter((key) => {
      const valor = filtros[key as keyof FiltroAvancado];
      return valor !== undefined && valor !== '' && valor !== null;
    }).length;
  };

  const aplicarFiltros = () => {
    onAplicarFiltros(filtros);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Filter className="w-6 h-6 text-blue-600" />
              Filtros Avançados
            </h2>
            <p className="text-sm text-gray-600 mt-1">{contarFiltrosAtivos()} filtro(s) ativo(s)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setAbaSelecionada('filtros')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              abaSelecionada === 'filtros'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Configurar Filtros
          </button>
          <button
            onClick={() => setAbaSelecionada('salvos')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              abaSelecionada === 'salvos'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Filtros Salvos ({filtrosSalvos.length})
          </button>
        </div>

        <div className="p-6">
          {abaSelecionada === 'filtros' ? (
            <div className="space-y-6">
              {/* Status e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    value={filtros.status || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        status: (e.target.value as StatusFatura) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os Status</option>
                    <option value={StatusFatura.PENDENTE}>Pendente</option>
                    <option value={StatusFatura.ENVIADA}>Enviada</option>
                    <option value={StatusFatura.PAGA}>Paga</option>
                    <option value={StatusFatura.VENCIDA}>Vencida</option>
                    <option value={StatusFatura.CANCELADA}>Cancelada</option>
                    <option value={StatusFatura.PARCIALMENTE_PAGA}>Parcialmente Paga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tipo
                  </label>
                  <select
                    value={filtros.tipo || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        tipo: (e.target.value as TipoFatura) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value={TipoFatura.UNICA}>Única</option>
                    <option value={TipoFatura.RECORRENTE}>Recorrente</option>
                    <option value={TipoFatura.PARCELA}>Parcela</option>
                    <option value={TipoFatura.ADICIONAL}>Adicional</option>
                  </select>
                </div>
              </div>

              {/* Valores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Faixa de Valores
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor mínimo"
                      value={filtros.valorMinimo || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          valorMinimo: parseFloat(e.target.value) || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor máximo"
                      value={filtros.valorMaximo || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          valorMaximo: parseFloat(e.target.value) || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Datas de Emissão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Período de Emissão
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={filtros.dataInicioEmissao || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          dataInicioEmissao: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Data inicial</p>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filtros.dataFimEmissao || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          dataFimEmissao: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Data final</p>
                  </div>
                </div>
              </div>

              {/* Datas de Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Período de Vencimento
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={filtros.dataInicioVencimento || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          dataInicioVencimento: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Vencimento inicial</p>
                  </div>
                  <div>
                    <input
                      type="date"
                      value={filtros.dataFimVencimento || ''}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          dataFimVencimento: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Vencimento final</p>
                  </div>
                </div>
              </div>

              {/* Busca por textos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome do cliente"
                    value={filtros.clienteNome || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        clienteNome: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Contrato
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CT-2025-001"
                    value={filtros.contratoNumero || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        contratoNumero: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Fatura
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: FT2025000001"
                    value={filtros.numeroFatura || ''}
                    onChange={(e) =>
                      setFiltros((prev) => ({
                        ...prev,
                        numeroFatura: e.target.value || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Salvar Filtro */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Salvar Configuração de Filtros</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Nome para este filtro"
                    value={nomeFiltroSalvar}
                    onChange={(e) => setNomeFiltroSalvar(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSalvarFiltro}
                    disabled={!nomeFiltroSalvar.trim() || contarFiltrosAtivos() === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Filtros Salvos */
            <div>
              {filtrosSalvos.length === 0 ? (
                <div className="text-center py-12">
                  <Save className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum filtro salvo</h3>
                  <p className="text-gray-600">
                    Configure e salve filtros para reutilizar rapidamente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtrosSalvos
                    .sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0))
                    .map((filtroSalvo) => (
                      <div
                        key={filtroSalvo.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleFavorito(filtroSalvo.id)}
                            className={`p-1 rounded-full transition-colors ${
                              filtroSalvo.favorito
                                ? 'text-yellow-500'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                          >
                            <Star
                              className={`w-4 h-4 ${filtroSalvo.favorito ? 'fill-current' : ''}`}
                            />
                          </button>
                          <div>
                            <h4 className="font-medium text-gray-900">{filtroSalvo.nome}</h4>
                            <p className="text-sm text-gray-600">
                              Criado em {filtroSalvo.criadoEm.toLocaleDateString('pt-BR')} •
                              {Object.keys(filtroSalvo.filtro).length} filtro(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCarregarFiltro(filtroSalvo)}
                            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Carregar
                          </button>
                          <button
                            onClick={() => handleExcluirFiltro(filtroSalvo.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={limparFiltros}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpar Todos
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar Filtros ({contarFiltrosAtivos()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
