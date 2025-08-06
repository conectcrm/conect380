import React, { useState } from 'react';
import { api } from '../services/api';

const LoginDebug: React.FC = () => {
  const [email, setEmail] = useState('admin@teste.com');
  const [senha, setSenha] = useState('123456');
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fazerLogin = async () => {
    try {
      setLoading(true);
      setResultado('Fazendo login...');

      const response = await api.post('/auth/login', {
        email,
        senha
      });

      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        setResultado('✅ Login realizado com sucesso!\nToken salvo no localStorage.');
      } else {
        setResultado('❌ Login falhou - token não recebido');
      }

    } catch (error: any) {
      console.error('Erro no login:', error);
      setResultado(`❌ Erro no login: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const criarUsuarioTeste = async () => {
    try {
      setLoading(true);
      setResultado('Criando usuário de teste...');

      const userData = {
        nome: 'Administrador Teste',
        email: 'admin@teste.com',
        senha: '123456',
        role: 'admin'
      };

      const response = await api.post('/users/debug-create', userData);
      setResultado(`✅ Usuário criado: ${JSON.stringify(response.data, null, 2)}`);

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      setResultado(`❌ Erro ao criar usuário: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verificarToken = () => {
    const token = localStorage.getItem('auth_token');
    setResultado(token ? `✅ Token presente: ${token.substring(0, 50)}...` : '❌ Nenhum token encontrado');
  };

  const limparToken = () => {
    localStorage.removeItem('auth_token');
    setResultado('🗑️ Token removido do localStorage');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔐 Debug de Autenticação</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-4">Login</h2>
        <div className="space-y-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="space-x-2">
          <button
            onClick={fazerLogin}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Fazendo Login...' : 'Fazer Login'}
          </button>

          <button
            onClick={criarUsuarioTeste}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Usuário Teste'}
          </button>

          <button
            onClick={verificarToken}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Verificar Token
          </button>

          <button
            onClick={limparToken}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Limpar Token
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">Resultado:</h2>
        <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">{resultado}</pre>
      </div>
    </div>
  );
};

export default LoginDebug;
