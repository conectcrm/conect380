import { useState, useEffect, useCallback } from 'react';
import { 
  Oportunidade, 
  FiltrosOportunidade, 
  EstatisticasOportunidades,
  DadosKanban,
  NovaOportunidade,
  AtualizarOportunidade,
  EstagioOportunidade
} from '../../../types/oportunidades/index';
import { oportunidadesService } from '../../../services/oportunidadesService';
import { useNotifications } from '../../../contexts/NotificationContext';

export const useOportunidades = (filtrosIniciais?: Partial<FiltrosOportunidade>) => {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Partial<FiltrosOportunidade>>(filtrosIniciais || {});
  const { addNotification } = useNotifications();

  const carregarOportunidades = useCallback(async (silent = false) => {
    try {
      setLoading(true);
      setError(null);
      const dados = await oportunidadesService.listarOportunidades(filtros);
      setOportunidades(dados);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar oportunidades';
      setError(errorMessage);
      
      // Só mostrar notificação se não for uma chamada silenciosa
      if (!silent) {
        addNotification({
          title: '❌ Erro',
          message: 'Não foi possível carregar as oportunidades',
          type: 'error',
          priority: 'high'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filtros, addNotification]);

  const criarOportunidade = async (dados: NovaOportunidade): Promise<Oportunidade | null> => {
    try {
      const novaOportunidade = await oportunidadesService.criarOportunidade(dados);
      setOportunidades(prev => [novaOportunidade, ...prev]);
      
      addNotification({
        title: '✅ Oportunidade Criada',
        message: `"${novaOportunidade.titulo}" foi criada com sucesso`,
        type: 'success',
        priority: 'medium'
      });
      
      return novaOportunidade;
    } catch (err: any) {
      addNotification({
        title: '❌ Erro ao Criar',
        message: err.message || 'Não foi possível criar a oportunidade',
        type: 'error',
        priority: 'high'
      });
      return null;
    }
  };

  const atualizarOportunidade = async (dados: AtualizarOportunidade): Promise<Oportunidade | null> => {
    try {
      const oportunidadeAtualizada = await oportunidadesService.atualizarOportunidade(dados);
      setOportunidades(prev => 
        prev.map(op => op.id === dados.id ? oportunidadeAtualizada : op)
      );
      
      addNotification({
        title: '✅ Oportunidade Atualizada',
        message: `"${oportunidadeAtualizada.titulo}" foi atualizada`,
        type: 'success',
        priority: 'low'
      });
      
      return oportunidadeAtualizada;
    } catch (err: any) {
      addNotification({
        title: '❌ Erro ao Atualizar',
        message: err.message || 'Não foi possível atualizar a oportunidade',
        type: 'error',
        priority: 'high'
      });
      return null;
    }
  };

  const excluirOportunidade = async (id: number): Promise<boolean> => {
    try {
      await oportunidadesService.excluirOportunidade(id);
      setOportunidades(prev => prev.filter(op => op.id !== id));
      
      addNotification({
        title: '🗑️ Oportunidade Excluída',
        message: 'A oportunidade foi removida com sucesso',
        type: 'info',
        priority: 'medium'
      });
      
      return true;
    } catch (err: any) {
      addNotification({
        title: '❌ Erro ao Excluir',
        message: err.message || 'Não foi possível excluir a oportunidade',
        type: 'error',
        priority: 'high'
      });
      return false;
    }
  };

  const moverOportunidade = async (id: number, novoEstagio: EstagioOportunidade): Promise<boolean> => {
    try {
      const oportunidadeMovida = await oportunidadesService.moverOportunidade(id, novoEstagio);
      setOportunidades(prev => 
        prev.map(op => op.id === id ? oportunidadeMovida : op)
      );
      
      addNotification({
        title: '🔄 Oportunidade Movida',
        message: `Movida para ${getEstagioNome(novoEstagio)}`,
        type: 'info',
        priority: 'medium'
      });
      
      return true;
    } catch (err: any) {
      addNotification({
        title: '❌ Erro ao Mover',
        message: err.message || 'Não foi possível mover a oportunidade',
        type: 'error',
        priority: 'high'
      });
      return false;
    }
  };

  const aplicarFiltros = (novosFiltros: Partial<FiltrosOportunidade>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  const limparFiltros = () => {
    setFiltros({});
  };

  useEffect(() => {
    // Carregar dados iniciais silenciosamente (primeira carga)
    carregarOportunidades(true);
  }, []);

  // Recarregar quando filtros mudarem (com notificações)
  useEffect(() => {
    if (Object.keys(filtros).length > 0) {
      carregarOportunidades(false);
    }
  }, [filtros]);

  return {
    oportunidades,
    loading,
    error,
    filtros,
    carregarOportunidades,
    criarOportunidade,
    atualizarOportunidade,
    excluirOportunidade,
    moverOportunidade,
    aplicarFiltros,
    limparFiltros
  };
};

export const useEstatisticasOportunidades = (filtros?: Partial<FiltrosOportunidade>) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasOportunidades | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await oportunidadesService.obterEstatisticas(filtros);
      setEstatisticas(dados);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  return {
    estatisticas,
    loading,
    error,
    recarregar: carregarEstatisticas
  };
};

export const useKanbanOportunidades = (filtros?: Partial<FiltrosOportunidade>) => {
  const [dadosKanban, setDadosKanban] = useState<DadosKanban | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const carregarDadosKanban = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await oportunidadesService.obterDadosKanban(filtros);
      setDadosKanban(dados);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do kanban');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const moverOportunidadeKanban = async (
    oportunidadeId: number, 
    estagioOrigem: EstagioOportunidade,
    estagioDestino: EstagioOportunidade
  ): Promise<boolean> => {
    if (estagioOrigem === estagioDestino) return false;
    
    try {
      await oportunidadesService.moverOportunidade(oportunidadeId, estagioDestino);
      
      // Atualizar estado local imediatamente para melhor UX
      setDadosKanban(prev => {
        if (!prev) return prev;
        
        const estagiosAtualizados = prev.estagios.map(estagio => {
          if (estagio.estagio === estagioOrigem) {
            return {
              ...estagio,
              oportunidades: estagio.oportunidades.filter(op => op.id !== oportunidadeId),
              quantidade: estagio.quantidade - 1,
              valor: estagio.valor - estagio.oportunidades.find(op => op.id === oportunidadeId)?.valor || 0
            };
          }
          
          if (estagio.estagio === estagioDestino) {
            const oportunidade = prev.estagios
              .find(e => e.estagio === estagioOrigem)
              ?.oportunidades.find(op => op.id === oportunidadeId);
              
            if (oportunidade) {
              return {
                ...estagio,
                oportunidades: [...estagio.oportunidades, { ...oportunidade, estagio: estagioDestino }],
                quantidade: estagio.quantidade + 1,
                valor: estagio.valor + oportunidade.valor
              };
            }
          }
          
          return estagio;
        });
        
        return {
          ...prev,
          estagios: estagiosAtualizados
        };
      });
      
      addNotification({
        title: '🔄 Oportunidade Movida',
        message: `Movida para ${getEstagioNome(estagioDestino)}`,
        type: 'success',
        priority: 'medium'
      });
      
      return true;
    } catch (err: any) {
      // Recarregar dados em caso de erro
      carregarDadosKanban();
      
      addNotification({
        title: '❌ Erro ao Mover',
        message: err.message || 'Não foi possível mover a oportunidade',
        type: 'error',
        priority: 'high'
      });
      
      return false;
    }
  };

  useEffect(() => {
    carregarDadosKanban();
  }, [carregarDadosKanban]);

  return {
    dadosKanban,
    loading,
    error,
    moverOportunidade: moverOportunidadeKanban,
    recarregar: carregarDadosKanban
  };
};

export const useOportunidade = (id: number) => {
  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarOportunidade = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await oportunidadesService.obterOportunidade(id);
      setOportunidade(dados);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar oportunidade');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      carregarOportunidade();
    }
  }, [carregarOportunidade, id]);

  return {
    oportunidade,
    loading,
    error,
    recarregar: carregarOportunidade
  };
};

// Utilitários
function getEstagioNome(estagio: EstagioOportunidade): string {
  const nomes = {
    [EstagioOportunidade.LEADS]: 'Leads',
    [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
    [EstagioOportunidade.PROPOSTA]: 'Proposta',
    [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
    [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
    [EstagioOportunidade.GANHO]: 'Ganho',
    [EstagioOportunidade.PERDIDO]: 'Perdido'
  };
  
  return nomes[estagio] || estagio;
}
