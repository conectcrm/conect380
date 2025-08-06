import React, { useState } from 'react';
import { contratoService } from '../services/contratoService';
import { api } from '../services/api';

const DebugContratos: React.FC = () => {
  const [resultado, setResultado] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const verificarAutenticacao = async () => {
    try {
      setLoading(true);
      setResultado('Verificando autenticação...');

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setResultado('❌ Nenhum token encontrado. Faça login primeiro em /debug-login');
        return;
      }

      // Tentar uma chamada autenticada simples
      const response = await api.get('/users/profile');
      setResultado(`✅ Autenticação OK! Usuário: ${JSON.stringify(response.data, null, 2)}`);

    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      setResultado(`❌ Erro de autenticação: ${error.response?.data?.message || error.message}\n\nFaça login em /debug-login primeiro`);
    } finally {
      setLoading(false);
    }
  };

  const testarConexao = async () => {
    try {
      setLoading(true);
      setResultado('Testando conexão...');

      // Primeiro, tentar listar contratos
      const contratos = await contratoService.listarContratos();
      setResultado(`✅ Conexão OK! Encontrados ${contratos.length} contratos`);

    } catch (error: any) {
      console.error('Erro no teste:', error);
      setResultado(`❌ Erro: ${error.message || 'Falha na conexão'}`);
    } finally {
      setLoading(false);
    }
  };

  const testarContratoEspecifico = async () => {
    const id = (document.getElementById('contratoId') as HTMLInputElement)?.value;

    if (!id) {
      setResultado('❌ Por favor, digite um ID');
      return;
    }

    try {
      setLoading(true);
      setResultado(`Buscando contrato ${id}...`);

      const contrato = await contratoService.buscarContrato(id);
      setResultado(`✅ Contrato encontrado: ${JSON.stringify(contrato, null, 2)}`);

    } catch (error: any) {
      console.error('Erro ao buscar contrato:', error);
      setResultado(`❌ Contrato não encontrado: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const criarContratoTeste = async () => {
    try {
      setLoading(true);
      setResultado('Criando contrato de teste...');

      const contratoData = {
        propostaId: 1,
        clienteId: 1,
        usuarioResponsavelId: 1,
        tipo: 'servico' as const,
        objeto: 'Contrato de teste para debug',
        valorTotal: 1000,
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        observacoes: 'Contrato criado para teste de debug'
      };

      const contrato = await contratoService.criarContrato(contratoData);
      setResultado(`✅ Contrato criado com sucesso! ID: ${contrato.id}, Número: ${contrato.numero}`);

    } catch (error: any) {
      console.error('Erro ao criar contrato:', error);
      setResultado(`❌ Erro ao criar contrato: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug de Contratos</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={verificarAutenticacao}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar Autenticação'}
        </button>

        <button
          onClick={testarConexao}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>

        <button
          onClick={criarContratoTeste}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Criando...' : 'Criar Contrato Teste'}
        </button>

        <div className="flex items-center space-x-2">
          <input
            id="contratoId"
            type="text"
            placeholder="ID do contrato"
            className="border rounded px-3 py-2"
          />
          <button
            onClick={testarContratoEspecifico}
            disabled={loading}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar Contrato'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">Resultado:</h2>
        <pre className="whitespace-pre-wrap text-sm">{resultado}</pre>
      </div>

      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <p className="text-sm">
          💡 <strong>Dica:</strong> Se você ver erros de autenticação, acesse primeiro{' '}
          <a href="/debug-login" className="text-blue-600 underline">/debug-login</a>{' '}
          para fazer login.
        </p>
      </div>
    </div>
  );
};

export default DebugContratos;
