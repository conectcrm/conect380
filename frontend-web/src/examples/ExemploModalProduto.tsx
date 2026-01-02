/**
 * Exemplo de uso do ModalCadastroProduto
 */

import React, { useState } from 'react';
import { ModalCadastroProduto } from '../components/modals/ModalCadastroProdutoLandscape';

interface ProdutoFormData {
  id?: number;
  nome: string;
  tipoItem: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  categoria: string;
  precoUnitario: number;
  frequencia: 'unico' | 'mensal' | 'anual';
  unidadeMedida: 'unidade' | 'saca' | 'hectare' | 'pacote' | 'licenca';
  status: boolean;
  descricao?: string;
  tags?: string[];
  variacoes?: string[];
}

export const ExemploModalProduto: React.FC = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoFormData[]>([]);
  const [loading, setLoading] = useState(false);

  // Debug: Log quando o estado de produtos muda
  React.useEffect(() => {
    console.log('🔍 Estado de produtos atualizado:', produtos);
  }, [produtos]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    console.log('✅ Dados do produto recebidos:', data);

    // Transformar os dados para o formato correto
    const produtoFormatado: ProdutoFormData = {
      id: Date.now(),
      nome: data.nome || '',
      tipoItem: data.tipoItem || 'produto',
      categoria: data.categoria || '',
      precoUnitario: data.preco || data.precoUnitario || 0,
      frequencia: data.frequencia || 'unico',
      unidadeMedida: data.unidadeMedida || 'unidade',
      status: data.status === 'ativo' || data.status === true,
      descricao: data.descricao || '',
      tags: data.tags || [],
      variacoes: data.variacoes || [],
    };

    console.log('🔄 Produto formatado:', produtoFormatado);

    // Simular salvamento
    setTimeout(() => {
      setProdutos((prev) => {
        const novosPI = [...prev, produtoFormatado];
        console.log('📋 Lista atualizada:', novosPI);
        return novosPI;
      });
      setLoading(false);
      setModalAberto(false);
      console.log('🚀 Produto cadastrado com sucesso!');
    }, 1500);
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preco);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cadastro de Produtos - Fênix CRM</h1>
              <p className="text-gray-600">Teste do modal seguindo padrões dos melhores CRMs</p>
            </div>

            <button
              onClick={() => setModalAberto(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Novo Produto
            </button>
          </div>

          {/* Lista de produtos cadastrados */}
          {produtos.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Produtos Cadastrados ({produtos.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtos.map((produto, index) => (
                  <div
                    key={produto.id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{produto.nome}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          produto.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {produto.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Tipo:</span> {produto.tipoItem}
                      </p>
                      <p>
                        <span className="font-medium">Categoria:</span> {produto.categoria}
                      </p>
                      <p>
                        <span className="font-medium">Preço:</span>{' '}
                        {formatarPreco(produto.precoUnitario)}
                      </p>
                      <p>
                        <span className="font-medium">Frequência:</span> {produto.frequencia}
                      </p>
                      <p>
                        <span className="font-medium">Unidade:</span> {produto.unidadeMedida}
                      </p>
                    </div>

                    {produto.tags && produto.tags.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {produto.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {produto.descricao && (
                      <p className="mt-3 text-sm text-gray-600 italic">"{produto.descricao}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {produtos.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-gray-600 mb-4">Clique em "Novo Produto" para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ModalCadastroProduto
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};
