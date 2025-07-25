import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import usuariosService from '../../../../services/usuariosService';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios,
  UserRole
} from '../../../../types/usuarios/index';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    busca: '',
    role: '',
    ativo: '',
    ordenacao: 'nome',
    direcao: 'asc'
  });

  const carregarUsuarios = useCallback(async (mostrarLoading = true) => {
    try {
      if (mostrarLoading) setLoading(true);
      setError(null);
      
      const usuariosData = await usuariosService.listarUsuarios(filtros);
      setUsuarios(usuariosData);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setError(error.message || 'Erro ao carregar usuários');
      toast.error('Erro ao carregar usuários');
    } finally {
      if (mostrarLoading) setLoading(false);
    }
  }, [filtros]);

  const criarUsuario = async (dados: NovoUsuario): Promise<Usuario | null> => {
    try {
      const novoUsuario = await usuariosService.criarUsuario(dados);
      // Recarregar a lista completa do backend para garantir sincronização
      await carregarUsuarios(false);
      toast.success('Usuário criado com sucesso!');
      return novoUsuario;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      const mensagem = error.response?.data?.message || error.message || 'Erro ao criar usuário';
      toast.error(mensagem);
      return null;
    }
  };

  const atualizarUsuario = async (dados: AtualizarUsuario): Promise<Usuario | null> => {
    try {
      const usuarioAtualizado = await usuariosService.atualizarUsuario(dados);
      setUsuarios(prev => 
        prev.map(usuario => 
          usuario.id === dados.id ? usuarioAtualizado : usuario
        )
      );
      toast.success('Usuário atualizado com sucesso!');
      return usuarioAtualizado;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
      return null;
    }
  };

  const excluirUsuario = async (id: string): Promise<boolean> => {
    try {
      await usuariosService.excluirUsuario(id);
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
      toast.success('Usuário excluído com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
      return false;
    }
  };

  const alterarStatusUsuario = async (id: string, ativo: boolean): Promise<boolean> => {
    try {
      const usuarioAtualizado = await usuariosService.alterarStatusUsuario(id, ativo);
      setUsuarios(prev => 
        prev.map(usuario => 
          usuario.id === id ? usuarioAtualizado : usuario
        )
      );
      toast.success(`Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao alterar status do usuário');
      return false;
    }
  };

  const resetarSenha = async (id: string): Promise<string | null> => {
    try {
      const resultado = await usuariosService.resetarSenha(id);
      toast.success('Senha resetada com sucesso!');
      return resultado.novaSenha;
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.response?.data?.message || 'Erro ao resetar senha');
      return null;
    }
  };

  const aplicarFiltros = useCallback((novosFiltros: Partial<FiltrosUsuarios>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      busca: '',
      role: '',
      ativo: '',
      ordenacao: 'nome',
      direcao: 'asc'
    });
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  return {
    usuarios,
    loading,
    error,
    filtros,
    carregarUsuarios,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
    alterarStatusUsuario,
    resetarSenha,
    aplicarFiltros,
    limparFiltros
  };
};

export const useEstatisticasUsuarios = () => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const estatisticasData = await usuariosService.obterEstatisticas();
      setEstatisticas(estatisticasData);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      setError(error.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  return {
    estatisticas,
    loading,
    error,
    carregarEstatisticas
  };
};
