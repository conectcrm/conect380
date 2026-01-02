import { useState, useEffect } from 'react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { Package, Plus, Edit2, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'; // ⚠️ Trocar Package pelo ícone adequado
import toast from 'react-hot-toast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

/**
 * 📋 TEMPLATE DE PÁGINA COM KPI CARDS
 * 
 * ⚠️ ANTES DE USAR:
 * 1. [ ] Renomear componente (TemplatePage → MinhaFeaturePage)
 * 2. [ ] Renomear arquivo (template-page.tsx → minha-feature-page.tsx)
 * 3. [ ] Ajustar cor do módulo (ver DESIGN_GUIDELINES.md)
 * 4. [ ] Implementar service (services/minhaFeatureService.ts)
 * 5. [ ] Ajustar KPIs (total, ativos, etc.)
 * 6. [ ] Ajustar ícone (import correto do lucide-react)
 * 7. [ ] Registrar rota em App.tsx
 * 8. [ ] Adicionar no menuConfig.ts
 * 9. [ ] Testar: loading, error, empty, success
 * 
 * ✅ O QUE JÁ ESTÁ CORRETO NESTE TEMPLATE:
 * - Estados: loading, error, empty
 * - BackToNucleus
 * - KPI cards (padrão Funil de Vendas)
 * - Responsividade (mobile-first)
 * - ConfirmationModal (para deleção)
 * - Toast notifications
 * 
 * 🎨 CORES POR MÓDULO:
 * - Atendimento: #159A9C
 * - Comercial: #159A9C
 * - Financeiro: #159A9C
 * - Configurações: #159A9C
 * (TODOS usam Crevasse #159A9C!)
 */

// ⚠️ DEFINIR INTERFACE (espelhar backend Entity)
interface Item {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

const TemplatePage: React.FC = () => {
  // ============================================
  // ESTADOS
  // ============================================
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const { confirmationState, showConfirmation } = useConfirmation();

  // ============================================
  // CARREGAR DADOS
  // ============================================
  useEffect(() => {
    carregarItems();
  }, []);

  const carregarItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ⚠️ IMPLEMENTAR: Chamar service do backend
      // const data = await minhaFeatureService.listar();
      // setItems(data);
      
      // Mock temporário (remover depois)
      await new Promise(resolve => setTimeout(resolve, 500));
      setItems([
        {
          id: '1',
          empresaId: 'empresa-1',
          nome: 'Item de Exemplo 1',
          descricao: 'Descrição do item',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      
    } catch (err: unknown) {
      console.error('Erro ao carregar items:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro ao carregar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // AÇÕES (CRUD)
  // ============================================
  const handleCriar = () => {
    setEditingItem(null);
    setShowDialog(true);
  };

  const handleEditar = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleDeletar = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();

    showConfirmation({
      title: 'Deletar Item',
      message: `Deseja realmente deletar "${item.nome}"?\n\nEsta ação não pode ser desfeita.`,
      confirmText: 'Sim, Deletar',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        try {
          // ⚠️ IMPLEMENTAR: Chamar service
          // await minhaFeatureService.deletar(item.id);
          
          toast.success('Item deletado com sucesso!');
          await carregarItems();
        } catch (err) {
          console.error('Erro ao deletar:', err);
          toast.error('Erro ao deletar item');
        }
      },
    });
  };

  const handleSalvar = async (formData: Partial<Item>) => {
    try {
      setLoading(true);
      
      if (editingItem) {
        // ⚠️ IMPLEMENTAR: Atualizar
        // await minhaFeatureService.atualizar(editingItem.id, formData);
        toast.success('Item atualizado com sucesso!');
      } else {
        // ⚠️ IMPLEMENTAR: Criar
        // await minhaFeatureService.criar(formData);
        toast.success('Item criado com sucesso!');
      }
      
      setShowDialog(false);
      await carregarItems();
    } catch (err: unknown) {
      console.error('Erro ao salvar:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FILTROS
  // ============================================
  const itemsFiltrados = items.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ============================================
  // KPIs CALCULADOS
  // ============================================
  const total = items.length;
  const ativos = items.filter(i => i.ativo).length;
  const inativos = total - ativos;

  // ⚠️ ADICIONAR MAIS KPIs CONFORME NECESSÁRIO
  // const valorTotal = items.reduce((acc, i) => acc + (i.valor || 0), 0);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#159A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <BackToNucleus nucleusName="Nome do Núcleo" nucleusPath="/nucleo" />
        </div>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={carregarItems}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========== HEADER ========== */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus 
          nucleusName="Nome do Núcleo" 
          nucleusPath="/nucleo" 
        />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* ========== TÍTULO ========== */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                <Package className="h-8 w-8 mr-3 text-[#159A9C]" /> {/* ⚠️ Trocar ícone */}
                Título da Página
              </h1>
              <button
                onClick={handleCriar}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Novo Item
              </button>
            </div>
          </div>

          {/* ========== KPI CARDS ========== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Total */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {total}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Items cadastrados no sistema
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#159A9C]" />
                </div>
              </div>
            </div>

            {/* Card 2: Ativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Ativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {ativos}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Items ativos e disponíveis
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Card 3: Inativos */}
            <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                    Inativos
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#002333]">
                    {inativos}
                  </p>
                  <p className="mt-3 text-sm text-[#002333]/70">
                    Items desativados temporariamente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-500/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* ========== BARRA DE BUSCA ========== */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              />
            </div>
          </div>

          {/* ========== LISTA DE ITEMS ========== */}
          {itemsFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro item.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCriar}
                  className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // ⚠️ IMPLEMENTAR: Abrir detalhes ou editar
                    console.log('Clicou em:', item);
                  }}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#002333] mb-1">
                        {item.nome}
                      </h3>
                      {item.descricao && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.descricao}
                        </p>
                      )}
                    </div>
                    
                    {/* Badge de Status */}
                    <span
                      className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Footer do Card */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    
                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditar(item, e)}
                        className="p-2 text-[#159A9C] hover:bg-[#159A9C]/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeletar(item, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== MODAL DE CONFIRMAÇÃO ========== */}
      <ConfirmationModal confirmationState={confirmationState} />

      {/* ⚠️ TODO: Adicionar Dialog de Criar/Editar */}
      {/* {showDialog && (
        <DialogComponent
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSave={handleSalvar}
          item={editingItem}
        />
      )} */}
    </div>
  );
};

export default TemplatePage;

/**
 * 📝 EXEMPLO DE USO:
 * 
 * 1. Copiar arquivo:
 *    cp frontend-web/templates/_TemplatePageWithKPIs.tsx frontend-web/src/pages/MinhaFeaturePage.tsx
 * 
 * 2. Renomear componente:
 *    TemplatePage → MinhaFeaturePage
 * 
 * 3. Ajustar imports:
 *    import { Package, ... } from 'lucide-react';
 *    → Trocar Package pelo ícone correto (Users, ShoppingCart, etc.)
 * 
 * 4. Implementar service:
 *    import { minhaFeatureService } from '../services/minhaFeatureService';
 *    
 *    const carregarItems = async () => {
 *      const data = await minhaFeatureService.listar();
 *      setItems(data);
 *    };
 * 
 * 5. Ajustar interface Item:
 *    interface Item {
 *      id: string;
 *      nome: string;
 *      // campos específicos...
 *    }
 * 
 * 6. Ajustar KPIs:
 *    const valorTotal = items.reduce((acc, i) => acc + i.valor, 0);
 * 
 * 7. Registrar rota em App.tsx:
 *    import MinhaFeaturePage from './pages/MinhaFeaturePage';
 *    <Route path="/meu-modulo/minha-feature" element={<MinhaFeaturePage />} />
 * 
 * 8. Adicionar no menuConfig.ts:
 *    {
 *      id: 'minha-feature',
 *      title: 'Minha Feature',
 *      path: '/meu-modulo/minha-feature',
 *      icon: Package,
 *    }
 * 
 * 9. Testar:
 *    - Loading: Funciona?
 *    - Error: Mostra mensagem?
 *    - Empty: CTA aparece?
 *    - Success: Lista renderiza?
 *    - CRUD: Criar, editar, deletar funcionam?
 *    - Responsivo: Mobile, tablet, desktop OK?
 */
