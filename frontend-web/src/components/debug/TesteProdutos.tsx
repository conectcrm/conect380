import React, { useState } from 'react';
import { propostasService } from '../../features/propostas/services/propostasService';

export const TesteProdutos: React.FC = () => {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string>('');

  const testarCarregamento = async () => {
    setLoading(true);
    setErro('');
    try {
      console.log('🔍 Iniciando teste de carregamento de produtos...');
      const produtosCarregados = await propostasService.obterProdutos();
      console.log('✅ Produtos carregados:', produtosCarregados);
      setProdutos(produtosCarregados);
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-4">🧪 Teste de Produtos</h3>
      
      <button 
        onClick={testarCarregamento}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Carregando...' : 'Testar Carregamento'}
      </button>

      {erro && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <strong>Erro:</strong> {erro}
        </div>
      )}

      {produtos.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Produtos Encontrados ({produtos.length}):</h4>
          <div className="space-y-2">
            {produtos.map((produto, index) => (
              <div key={index} className="p-2 bg-white border rounded text-sm">
                <div><strong>ID:</strong> {produto.id}</div>
                <div><strong>Nome:</strong> {produto.nome}</div>
                <div><strong>Categoria:</strong> {produto.categoria}</div>
                <div><strong>Preço:</strong> R$ {produto.preco?.toFixed(2)}</div>
                <div><strong>Disponível:</strong> {produto.disponivel ? '✅' : '❌'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TesteProdutos;
