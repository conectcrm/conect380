import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Star, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FAQItem {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: string;
  tags: string[];
  popularidade: number;
  rating: number;
  visualizacoes: number;
}

interface FAQSectionProps {
  searchTerm: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ searchTerm }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'popularidade' | 'rating' | 'alfabetica'>('popularidade');

  const faqData: FAQItem[] = [
    {
      id: '1',
      categoria: 'Geral',
      pergunta: 'Como faço para redefinir minha senha?',
      resposta: 'Para redefinir sua senha, clique em "Esqueci minha senha" na tela de login. Um email será enviado com instruções para criar uma nova senha. Se não receber o email, verifique sua pasta de spam.',
      tags: ['senha', 'login', 'recuperar', 'email'],
      popularidade: 95,
      rating: 4.8,
      visualizacoes: 1250
    },
    {
      id: '2',
      categoria: 'Contatos',
      pergunta: 'Como importar contatos de um arquivo CSV?',
      resposta: 'Vá para o módulo de Contatos, clique em "Importar" e selecione seu arquivo CSV. Certifique-se de que o arquivo contém as colunas: Nome, Email, Telefone, Empresa. O sistema irá mapear automaticamente os campos e permitir ajustes antes da importação.',
      tags: ['contatos', 'importar', 'csv', 'arquivo'],
      popularidade: 87,
      rating: 4.6,
      visualizacoes: 980
    },
    {
      id: '3',
      categoria: 'Propostas',
      pergunta: 'Como criar uma proposta personalizada?',
      resposta: 'No módulo Propostas, clique em "Nova Proposta", selecione "Personalizada", adicione os produtos ou serviços desejados, configure desconto se necessário e personalize o template. Você pode salvar como modelo para usar novamente.',
      tags: ['propostas', 'criar', 'personalizada', 'template'],
      popularidade: 92,
      rating: 4.7,
      visualizacoes: 1150
    },
    {
      id: '4',
      categoria: 'Integração',
      pergunta: 'Como conectar com meu sistema de e-mail marketing?',
      resposta: 'Acesse Configurações > Integrações, encontre seu provedor de e-mail marketing (Mailchimp, RD Station, etc.), insira suas credenciais API e configure a sincronização automática de contatos e campanhas.',
      tags: ['integração', 'email', 'marketing', 'api'],
      popularidade: 78,
      rating: 4.5,
      visualizacoes: 670
    },
    {
      id: '5',
      categoria: 'Relatórios',
      pergunta: 'Como gerar relatório de vendas por período?',
      resposta: 'No módulo Relatórios, selecione "Vendas", defina o período desejado, escolha os filtros (vendedor, produto, cliente) e clique em "Gerar Relatório". Você pode exportar em PDF ou Excel.',
      tags: ['relatórios', 'vendas', 'período', 'export'],
      popularidade: 85,
      rating: 4.9,
      visualizacoes: 890
    },
    {
      id: '6',
      categoria: 'Geral',
      pergunta: 'Como alterar o plano da minha conta?',
      resposta: 'Vá em Configurações > Plano e Faturamento, compare os planos disponíveis e clique em "Fazer Upgrade" ou "Alterar Plano". As mudanças são aplicadas imediatamente com cobrança proporcional.',
      tags: ['plano', 'upgrade', 'faturamento', 'conta'],
      popularidade: 72,
      rating: 4.4,
      visualizacoes: 560
    },
    {
      id: '7',
      categoria: 'Produtos',
      pergunta: 'Como cadastrar produtos com variações?',
      resposta: 'No módulo Produtos, clique em "Novo Produto", preencha as informações básicas e na seção "Variações" adicione os diferentes tamanhos, cores ou modelos. Cada variação pode ter preço e estoque próprios.',
      tags: ['produtos', 'variações', 'cadastrar', 'estoque'],
      popularidade: 68,
      rating: 4.3,
      visualizacoes: 445
    },
    {
      id: '8',
      categoria: 'Financeiro',
      pergunta: 'Como configurar lembretes de cobrança?',
      resposta: 'No módulo Financeiro > Configurações, defina os intervalos para envio automático de lembretes (3, 7, 15 dias antes do vencimento). Personalize os templates de email e ative as notificações.',
      tags: ['financeiro', 'cobrança', 'lembretes', 'automático'],
      popularidade: 81,
      rating: 4.6,
      visualizacoes: 720
    }
  ];

  const categorias = ['todas', ...Array.from(new Set(faqData.map(item => item.categoria)))];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredAndSortedFAQ = useMemo(() => {
    let filtered = faqData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todas' || item.categoria === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularidade':
          return b.popularidade - a.popularidade;
        case 'rating':
          return b.rating - a.rating;
        case 'alfabetica':
          return a.pergunta.localeCompare(b.pergunta);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  const handleRating = (itemId: string, isPositive: boolean) => {
    // Implementar lógica de rating
    console.log(`Rating ${isPositive ? 'positivo' : 'negativo'} para item ${itemId}`);
  };

  return (
    <div className="space-y-6">
      {/* Filtros e ordenação */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[#002333]">
            Perguntas Frequentes ({filteredAndSortedFAQ.length})
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro por categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria === 'todas' ? 'Todas as Categorias' : categoria}
                </option>
              ))}
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularidade' | 'rating' | 'alfabetica')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              <option value="popularidade">Mais Populares</option>
              <option value="rating">Melhor Avaliadas</option>
              <option value="alfabetica">A-Z</option>
            </select>
          </div>
        </div>

        {/* Lista de FAQ */}
        <div className="space-y-4">
          {filteredAndSortedFAQ.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma pergunta encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          ) : (
            filteredAndSortedFAQ.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-[#159A9C] bg-opacity-10 text-[#159A9C] rounded-full text-xs font-medium">
                        {item.categoria}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {item.rating.toFixed(1)}
                        <span className="mx-2">•</span>
                        {item.visualizacoes} visualizações
                      </div>
                    </div>
                    <h3 className="font-medium text-[#002333]">
                      {item.pergunta}
                    </h3>
                  </div>
                  
                  {expandedItems.includes(item.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {expandedItems.includes(item.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 mb-4">
                        {item.resposta}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600">
                          Esta resposta foi útil?
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRating(item.id, true)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>Sim</span>
                          </button>
                          <button
                            onClick={() => handleRating(item.id, false)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>Não</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
