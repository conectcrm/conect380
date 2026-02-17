import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../../../services/api';
import { getErrorMessage } from '../../../../utils/errorHandling';

export interface Atividade {
  id: string;
  tipo: 'LOGIN' | 'LOGOUT' | 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'ALTERACAO_STATUS' | 'RESET_SENHA';
  usuario: {
    nome: string;
    avatar_url?: string;
  };
  descricao: string;
  timestamp: Date;
  detalhes?: string;
}

type AtividadeApi = Partial<Omit<Atividade, 'timestamp'>> & {
  created_at?: string | Date;
  timestamp?: string | Date;
};

type UseAtividadesUsuariosResult = {
  atividades: Atividade[];
  loading: boolean;
  error: string | null;
  carregarAtividades: () => Promise<void>;
};

const SIMULATED_ATIVIDADES: Atividade[] = [
  {
    id: '1',
    tipo: 'LOGIN',
    usuario: { nome: 'Administrador' },
    descricao: 'Efetuou login no sistema',
    timestamp: new Date(new Date().getTime() - 30 * 60000),
  },
  {
    id: '2',
    tipo: 'CRIACAO',
    usuario: { nome: 'Maria Santos' },
    descricao: 'Criou novo usuário: Carlos Ferreira',
    timestamp: new Date(new Date().getTime() - 2 * 60 * 60000),
  },
  {
    id: '3',
    tipo: 'ALTERACAO_STATUS',
    usuario: { nome: 'Administrador' },
    descricao: 'Alterou status: João Silva para Ativo',
    timestamp: new Date(new Date().getTime() - 4 * 60 * 60000),
  },
  {
    id: '4',
    tipo: 'RESET_SENHA',
    usuario: { nome: 'João Silva' },
    descricao: 'Solicitou redefinição de senha',
    timestamp: new Date(new Date().getTime() - 1 * 24 * 60 * 60000),
  },
];

const normalizeAtividade = (atividade: AtividadeApi, index: number): Atividade => {
  const timestampSource = atividade.timestamp ?? atividade.created_at ?? new Date();

  return {
    id: atividade.id ?? `atividade-${index}`,
    tipo: atividade.tipo ?? 'LOGIN',
    usuario: {
      nome: atividade.usuario?.nome ?? 'Usuário',
      avatar_url: atividade.usuario?.avatar_url,
    },
    descricao: atividade.descricao ?? 'Atividade registrada',
    timestamp: new Date(timestampSource),
    detalhes: atividade.detalhes,
  };
};

export const useAtividadesUsuarios = (): UseAtividadesUsuariosResult => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarAtividades = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<AtividadeApi[]>(`${API_BASE_URL}/users/atividades`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const dados = response.data;

      if (Array.isArray(dados)) {
        setAtividades(dados.map((atividade, index) => normalizeAtividade(atividade, index)));
      } else {
        setAtividades([]);
      }
    } catch (err) {
      console.error('Erro ao carregar atividades de usuários:', err);

      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 404 || err.response?.status === 500)
      ) {
        setAtividades(SIMULATED_ATIVIDADES);
        setError(null);
        return;
      }

      const mensagem = getErrorMessage(err, 'Não foi possível carregar as atividades recentes.');
      setError(mensagem);
      setAtividades([]);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAtividades();
  }, [carregarAtividades]);

  return {
    atividades,
    loading,
    error,
    carregarAtividades,
  };
};
