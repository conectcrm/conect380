import React, { useState } from 'react';
import { ModalCadastroProdutoAvancado } from '@/components/modals/ModalCadastroProdutoAvancado';
import { useSegmentoConfig } from '@/hooks/useSegmentoConfig';
import { BaseButton, StatusBadge } from '@/components/base';
import { ResponsiveCard } from '@/components/layout/ResponsiveLayout';
import { 
  Plus, 
  Settings, 
  Package, 
  Truck, 
  Globe, 
  ShoppingCart, 
  Briefcase,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ExemploModalProdutoAvancado - Demonstração prática do modal avançado
 * 
 * Este exemplo mostra como usar o modal para diferentes segmentos:
 * - Agropecuário: Planos com módulos complexos
 * - Software/SaaS: Licenças e add-ons
 * - E-commerce: Produtos físicos e digitais
 * - Serviços: Consultorias e treinamentos
 */
export const ExemploModalProdutoAvancado: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Hook para gerenciar configurações de segmento
  const {
    segmentoAtivo,
    configuracaoAtiva,
    segmentosDisponiveis,
    setSegmentoAtivo
  } = useSegmentoConfig('agropecuario');

  // Estados para demonstrar diferentes cenários
  const [produtos, setProdutos] = useState([
    {
      id: 1,
      nome: 'Plano Professional Agro',
      codigo: 'PROF-AGRO-001',
      tipoProduto: 'plano_sistema',
      categoria: 'gestao_pecuaria',
      status: 'ativo',
      segmento: 'agropecuario',
      precoBase: 299.99,
      tipoPreco: 'fixo',
      modulos: [
        { id: '1', nome: 'Gestão de Gado', incluido: true, quantidade: 1 },
        { id: '2', nome: 'Reprodução', incluido: true, quantidade: 1 },
        { id: '3', nome: 'Financeiro Rural', incluido: false, quantidade: 0 }
      ],
      licencas: [
        { id: '1', nome: 'Portal Web Completo', tipo: 'web', quantidade: 5 },
        { id: '2', nome: 'MB Task (Aplicativo de Campo)', tipo: 'mobile', quantidade: 2 }
      ]
    },
    {
      id: 2,
      nome: 'CRM Enterprise',
      codigo: 'CRM-ENT-001',
      tipoProduto: 'plano_saas',
      categoria: 'crm',
      status: 'ativo',
      segmento: 'software_saas',
      precoBase: 199.99,
      tipoPreco: 'fixo'
    }
  ]);

  // Função para salvar produto (simulação de API)
  const handleSaveProduto = async (data) => {
    setIsLoading(true);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (produtoSelecionado) {
        // Atualizar produto existente
        setProdutos(prev => prev.map(p => 
          p.id === produtoSelecionado.id ? { ...data, id: p.id } : p
        ));
        console.log('Produto atualizado:', data);
      } else {
        // Criar novo produto
        const novoProduto = {
          ...data,
          id: Date.now() // ID temporário
        };
        setProdutos(prev => [...prev, novoProduto]);
        console.log('Novo produto criado:', novoProduto);
      }
      
      // Simular sucesso
      setShowModal(false);
      setProdutoSelecionado(null);
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      throw error; // Re-throw para o modal tratar
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal para novo produto
  const handleNovoProduto = () => {
    setProdutoSelecionado(null);
    setShowModal(true);
  };

  // Abrir modal para editar produto
  const handleEditarProduto = (produto) => {
    setProdutoSelecionado(produto);
    setShowModal(true);
  };

  // Deletar produto (simulação)
  const handleDeletarProduto = (produto) => {
    if (confirm(`Deseja realmente deletar o produto "${produto.nome}"?`)) {
      setProdutos(prev => prev.filter(p => p.id !== produto.id));
      toast.success('Produto deletado com sucesso!');
    }
  };

  // Obter ícone do segmento
  const obterIconeSegmento = (segmentoId: string) => {
    const segmento = segmentosDisponiveis.find(s => s.value === segmentoId);
    if (segmento?.icone) {
      const Icon = segmento.icone;
      return <Icon className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestão de Produtos Avançada
          </h1>
          <p className="text-gray-600">
            Exemplo de uso do modal de cadastro para diferentes segmentos de negócio
          </p>
        </div>

        {/* Seletor de Segmento */}
        <ResponsiveCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Configuração do Segmento
            </h2>
            <StatusBadge
              status="active"
              text={configuracaoAtiva?.nome || 'Segmento não selecionado'}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segmentosDisponiveis.map(segmento => {
              const Icon = segmento.icone;
              return (
                <button
                  key={segmento.value}
                  onClick={() => setSegmentoAtivo(segmento.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    segmentoAtivo === segmento.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-6 h-6" />
                    <span className="font-medium">{segmento.label}</span>
                  </div>
                  <p className="text-sm opacity-80">{segmento.descricao}</p>
                </button>
              );
            })}
          </div>
        </ResponsiveCard>

        {/* Ações e Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Produtos Cadastrados
            </h2>
            <p className="text-gray-600 text-sm">
              {produtos.length} produto(s) encontrado(s)
            </p>
          </div>
          
          <BaseButton
            variant="primary"
            onClick={handleNovoProduto}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Produto
          </BaseButton>
        </div>

        {/* Lista de Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {produtos.map(produto => (
            <ResponsiveCard key={produto.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {obterIconeSegmento(produto.segmento)}
                  <h3 className="font-semibold text-gray-900 truncate">
                    {produto.nome}
                  </h3>
                </div>
                
                <StatusBadge
                  status={produto.status === 'ativo' ? 'success' : 'warning'}
                  text={produto.status}
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Código:</span>
                  <span className="font-medium">{produto.codigo}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">
                    {configuracaoAtiva?.tiposProduto.find(t => t.value === produto.tipoProduto)?.label || produto.tipoProduto}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Categoria:</span>
                  <span className="font-medium">
                    {configuracaoAtiva?.categorias.find(c => c.value === produto.categoria)?.label || produto.categoria}
                  </span>
                </div>
                
                {produto.precoBase && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Preço:</span>
                    <span className="font-medium text-green-600">
                      R$ {produto.precoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Informações extras baseadas no tipo */}
              {produto.modulos && produto.modulos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Módulos Inclusos
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {produto.modulos.filter(m => m.incluido).map(modulo => (
                      <span
                        key={modulo.id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {modulo.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {produto.licencas && produto.licencas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Licenças
                  </p>
                  <div className="space-y-1">
                    {produto.licencas.map(licenca => (
                      <div key={licenca.id} className="flex justify-between text-xs">
                        <span>{licenca.nome}</span>
                        <span className="font-medium">{licenca.quantidade}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditarProduto(produto)}
                  icon={<Edit className="w-4 h-4" />}
                  className="flex-1"
                >
                  Editar
                </BaseButton>
                
                <BaseButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeletarProduto(produto)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="text-red-600 hover:text-red-700"
                >
                  Deletar
                </BaseButton>
              </div>
            </ResponsiveCard>
          ))}
        </div>

        {/* Placeholder quando não há produtos */}
        {produtos.length === 0 && (
          <ResponsiveCard className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Clique em "Novo Produto" para começar a cadastrar seus produtos.
            </p>
            <BaseButton
              variant="primary"
              onClick={handleNovoProduto}
              icon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Primeiro Produto
            </BaseButton>
          </ResponsiveCard>
        )}

        {/* Modal de Cadastro Avançado */}
        <ModalCadastroProdutoAvancado
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setProdutoSelecionado(null);
          }}
          onSave={handleSaveProduto}
          produto={produtoSelecionado}
          isLoading={isLoading}
          segmentoConfig={configuracaoAtiva}
        />

        {/* Informações de Debug (remover em produção) */}
        {process.env.NODE_ENV === 'development' && (
          <ResponsiveCard className="mt-8 bg-gray-900 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações de Debug
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Segmento Ativo:</p>
                <code className="bg-gray-800 p-2 rounded block">
                  {JSON.stringify({ id: segmentoAtivo, nome: configuracaoAtiva?.nome }, null, 2)}
                </code>
              </div>
              <div>
                <p className="font-medium mb-2">Tipos de Produto Disponíveis:</p>
                <code className="bg-gray-800 p-2 rounded block overflow-auto max-h-40">
                  {JSON.stringify(configuracaoAtiva?.tiposProduto.map(t => ({ 
                    value: t.value, 
                    label: t.label 
                  })), null, 2)}
                </code>
              </div>
            </div>
          </ResponsiveCard>
        )}
      </div>
    </div>
  );
};

export default ExemploModalProdutoAvancado;
