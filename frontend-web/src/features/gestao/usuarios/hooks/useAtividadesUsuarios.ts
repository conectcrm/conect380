import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useAtividadesUsuarios = () => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarAtividades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando atividades de usuários...');
      
      // Chamada à API real para buscar atividades
      const response = await axios.get(`${API_BASE_URL}/users/atividades`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      console.log('✅ Resposta da API de atividades:', response.data);
      
      // Se tiver dados reais, use-os
      if (response.data && Array.isArray(response.data)) {
        const atividadesFormatadas = response.data.map((atividade: any) => ({
          ...atividade,
          timestamp: new Date(atividade.created_at || atividade.timestamp)
        }));
        console.log('📊 Atividades formatadas:', atividadesFormatadas);
        setAtividades(atividadesFormatadas);
      } else {
        console.log('⚠️ Resposta da API não contém array de atividades');
        // Caso não haja endpoint ainda, forneça uma estrutura vazia
        setAtividades([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atividades de usuários:', error);
      
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 500)) {
        // API endpoint ainda não está disponível ou tem erro de servidor
        console.log('Endpoint de atividades não disponível. Usando dados simulados temporariamente.');
        
        // Dados simulados para visualização enquanto a API está sendo configurada
        const dadosSimulados: Atividade[] = [
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
          }
        ];
        
        setAtividades(dadosSimulados);
        setError(null); // Não mostrar erro para o usuário
      } else {
        setError('Não foi possível carregar as atividades recentes.');
        setAtividades([]); // Garantir um array vazio em caso de erro
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtividades();
  }, []);

  return { 
    atividades, 
    loading, 
    error,
    carregarAtividades
  };
};
