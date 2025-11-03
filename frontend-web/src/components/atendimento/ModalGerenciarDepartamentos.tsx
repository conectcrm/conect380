import React, { useState, useEffect } from 'react';
import { X, Save, Building2, AlertCircle, CheckCircle, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { departamentoService } from '../../services/departamentoService';
import { Departamento } from '../../types/departamentoTypes';
import { Nucleo } from '../../services/nucleoService';

// ========================================================================
// INTERFACES
// ========================================================================

interface ModalGerenciarDepartamentosProps {
  /** Controla visibilidade do modal */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Núcleo sendo editado */
  nucleo: Nucleo;
  /** Callback após salvar com sucesso */
  onSuccess?: () => void;
}

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================

export const ModalGerenciarDepartamentos: React.FC<ModalGerenciarDepartamentosProps> = ({
  isOpen,
  onClose,
  nucleo,
  onSuccess,
}) => {
  const navigate = useNavigate();

  // ========================================================================
  // STATES
  // ========================================================================

  const [todosDepartamentos, setTodosDepartamentos] = useState<Departamento[]>([]);
  const [departamentosVinculados, setDepartamentosVinculados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen, nucleo.id]);

  // ========================================================================
  // FUNÇÕES
  // ========================================================================

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar todos os departamentos do sistema
      const todos = await departamentoService.listar();
      setTodosDepartamentos(todos || []);

      // Carregar departamentos já vinculados a este núcleo
      const vinculados = await departamentoService.listarPorNucleo(nucleo.id);
      setDepartamentosVinculados(vinculados.map(d => d.id));
    } catch (err: unknown) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDepartamento = (departamentoId: string) => {
    setDepartamentosVinculados(prev => {
      if (prev.includes(departamentoId)) {
        return prev.filter(id => id !== departamentoId);
      } else {
        return [...prev, departamentoId];
      }
    });
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      setError(null);

      // Atualizar cada departamento individualmente
      const promessas: Promise<any>[] = [];

      // Vincular departamentos selecionados
      for (const deptId of departamentosVinculados) {
        const dept = todosDepartamentos.find(d => d.id === deptId);
        if (dept && dept.nucleoId !== nucleo.id) {
          promessas.push(
            departamentoService.atualizar(deptId, { nucleoId: nucleo.id })
          );
        }
      }

      // Desvincular departamentos não selecionados que estavam vinculados
      const vinculadosAnteriormente = await departamentoService.listarPorNucleo(nucleo.id);
      for (const dept of vinculadosAnteriormente) {
        if (!departamentosVinculados.includes(dept.id)) {
          // Remove do núcleo (define nucleoId como vazio ou outro núcleo padrão)
          // Aqui você pode decidir a lógica: deletar ou mover para núcleo "Geral"
          promessas.push(
            departamentoService.atualizar(dept.id, { nucleoId: '' })
          );
        }
      }

      await Promise.all(promessas);

      setSuccess('Departamentos vinculados com sucesso!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar vínculos');
    } finally {
      setSaving(false);
    }
  };

  const handleIrParaDepartamentos = () => {
    navigate('/gestao/departamentos');
    onClose();
  };

  // ========================================================================
  // COMPUTED
  // ========================================================================

  const departamentosFiltrados = todosDepartamentos.filter(dept =>
    dept.nome.toLowerCase().includes(busca.toLowerCase()) ||
    dept.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const departamentosAtivos = departamentosFiltrados.filter(d => d.ativo);
  const departamentosInativos = departamentosFiltrados.filter(d => !d.ativo);

  // ========================================================================
  // RENDER
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-purple-600" />
                Vincular Departamentos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Núcleo: <span className="font-semibold">{nucleo.nome}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Busca */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar departamento..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Info quando não há departamentos */}
              {todosDepartamentos.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Nenhum departamento cadastrado no sistema.</p>
                  <Button
                    onClick={handleIrParaDepartamentos}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Criar Primeiro Departamento
                  </Button>
                </div>
              )}

              {/* Lista de departamentos ativos */}
              {departamentosAtivos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Departamentos Ativos ({departamentosAtivos.length})
                  </h3>
                  <div className="space-y-2">
                    {departamentosAtivos.map((dept) => {
                      const isVinculado = departamentosVinculados.includes(dept.id);
                      const numAtendentes = dept.atendentesIds?.length || 0;

                      return (
                        <label
                          key={dept.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isVinculado
                              ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200'
                              : 'bg-white border-gray-200 hover:border-purple-200'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isVinculado}
                            onChange={() => handleToggleDepartamento(dept.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: dept.cor }}
                          >
                            {dept.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{dept.nome}</p>
                            {dept.descricao && (
                              <p className="text-xs text-gray-600 truncate">{dept.descricao}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {numAtendentes} atendente{numAtendentes !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {dept.visivelNoBot && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                              Bot ✓
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de departamentos inativos */}
              {departamentosInativos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">
                    Departamentos Inativos ({departamentosInativos.length})
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {departamentosInativos.map((dept) => {
                      const isVinculado = departamentosVinculados.includes(dept.id);
                      const numAtendentes = dept.atendentesIds?.length || 0;

                      return (
                        <label
                          key={dept.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isVinculado
                              ? 'bg-gray-50 border-gray-300'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isVinculado}
                            onChange={() => handleToggleDepartamento(dept.id)}
                            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                          />
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: dept.cor }}
                          >
                            {dept.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-700">{dept.nome}</p>
                            {dept.descricao && (
                              <p className="text-xs text-gray-500 truncate">{dept.descricao}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {numAtendentes} atendente{numAtendentes !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                            Inativo
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nenhum resultado na busca */}
              {departamentosFiltrados.length === 0 && busca && todosDepartamentos.length > 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum departamento encontrado para "{busca}"</p>
                </div>
              )}

              {/* Link para criar novo departamento */}
              {todosDepartamentos.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    💡 Não encontrou o departamento?
                  </p>
                  <Button
                    onClick={handleIrParaDepartamentos}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ir para Gestão de Departamentos
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {departamentosVinculados.length} departamento{departamentosVinculados.length !== 1 ? 's' : ''} selecionado{departamentosVinculados.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Vínculos
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
