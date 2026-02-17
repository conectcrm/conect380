import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import usuariosService from '../../../../services/usuariosService';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  FiltrosUsuarios,
  EstatisticasUsuarios,
} from '../../../../types/usuarios/index';
import { getErrorMessage } from '../../../../utils/errorHandling';

type UseUsuariosResult = {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  filtros: FiltrosUsuarios;
  carregarUsuarios: (mostrarLoading?: boolean) => Promise<void>;
  criarUsuario: (dados: NovoUsuario) => Promise<Usuario | null>;
  atualizarUsuario: (dados: AtualizarUsuario) => Promise<Usuario | null>;
  excluirUsuario: (id: string) => Promise<boolean>;
  alterarStatusUsuario: (id: string, ativo: boolean) => Promise<boolean>;
  resetarSenha: (id: string) => Promise<string | null>;
  aplicarFiltros: (novosFiltros: Partial<FiltrosUsuarios>) => void;
  limparFiltros: () => void;
};

type UseEstatisticasUsuariosResult = {
  estatisticas: EstatisticasUsuarios | null;
  loading: boolean;
  error: string | null;
  carregarEstatisticas: () => Promise<void>;
};

export const useUsuarios = (): UseUsuariosResult => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    busca: '',
    role: '',
    ativo: '',
    ordenacao: 'nome',
    direcao: 'asc',
    limite: 100,
    pagina: 1,
  });

  const carregarUsuarios = useCallback(
    async (mostrarLoading = true): Promise<void> => {
      try {
        if (mostrarLoading) setLoading(true);
        setError(null);

        const resposta = await usuariosService.listarUsuarios(filtros);
        setUsuarios(resposta.usuarios);
      } catch (err) {
        const message = getErrorMessage(err, 'Erro ao carregar usuários');
        console.error('Erro ao carregar usuários:', err);
        setError(message);
        toast.error(message);
      } finally {
        if (mostrarLoading) setLoading(false);
      }
    },
    [filtros],
  );

  const criarUsuario = async (dados: NovoUsuario): Promise<Usuario | null> => {
    try {
      const novoUsuario = await usuariosService.criarUsuario(dados);
      // Recarregar a lista completa do backend para garantir sincronização
      await carregarUsuarios(false);
      toast.success('Usuário criado com sucesso!');
      return novoUsuario;
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao criar usuário');
      console.error('Erro ao criar usuário:', err);
      toast.error(mensagem);
      return null;
    }
  };

  const atualizarUsuario = async (dados: AtualizarUsuario): Promise<Usuario | null> => {
    try {
      const usuarioAtualizado = await usuariosService.atualizarUsuario(dados);
      setUsuarios((prev) =>
        prev.map((usuario) => (usuario.id === dados.id ? usuarioAtualizado : usuario)),
      );
      toast.success('Usuário atualizado com sucesso!');
      return usuarioAtualizado;
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao atualizar usuário');
      console.error('Erro ao atualizar usuário:', err);
      toast.error(mensagem);
      return null;
    }
  };

  const excluirUsuario = async (id: string): Promise<boolean> => {
    try {
      await usuariosService.excluirUsuario(id);
      setUsuarios((prev) => prev.filter((usuario) => usuario.id !== id));
      toast.success('Usuário excluído com sucesso!');
      return true;
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao excluir usuário');
      console.error('Erro ao excluir usuário:', err);
      toast.error(mensagem);
      return false;
    }
  };

  const alterarStatusUsuario = async (id: string, ativo: boolean): Promise<boolean> => {
    try {
      const usuarioAtualizado = await usuariosService.alterarStatusUsuario(id, ativo);
      setUsuarios((prev) =>
        prev.map((usuario) => (usuario.id === id ? usuarioAtualizado : usuario)),
      );
      toast.success(`Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso!`);
      return true;
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao alterar status do usuário');
      console.error('Erro ao alterar status do usuário:', err);
      toast.error(mensagem);
      return false;
    }
  };

  const resetarSenha = async (id: string): Promise<string | null> => {
    try {
      const resultado = await usuariosService.resetarSenha(id);
      toast.success('Senha resetada com sucesso!');
      return resultado;
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao resetar senha');
      console.error('Erro ao resetar senha:', err);
      toast.error(mensagem);
      return null;
    }
  };

  const aplicarFiltros = useCallback((novosFiltros: Partial<FiltrosUsuarios>) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      busca: '',
      role: '',
      ativo: '',
      ordenacao: 'nome',
      direcao: 'asc',
      limite: 100,
      pagina: 1,
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
    limparFiltros,
  };
};

export const useEstatisticasUsuarios = (): UseEstatisticasUsuariosResult => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstatisticas = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const estatisticasData = await usuariosService.obterEstatisticas();
      setEstatisticas(estatisticasData);
    } catch (err) {
      const mensagem = getErrorMessage(err, 'Erro ao carregar estatísticas');
      console.error('Erro ao carregar estatísticas:', err);
      setError(mensagem);
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
    carregarEstatisticas,
  };
};
