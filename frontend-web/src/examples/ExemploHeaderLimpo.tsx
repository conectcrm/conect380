import React, { useState } from 'react';
import { Plus, Filter, Download, MoreHorizontal } from 'lucide-react';
import HeaderLimpo from '@/components/layout/HeaderLimpo';
import { ModalCadastroProduto } from './ModalCadastroProduto';

/**
 * Exemplo de Página com Header Limpo
 * 
 * Demonstra como o header focado em funcionalidades essenciais
 * não compete com o conteúdo da página, criando uma experiência
 * mais limpa e focada.
 */
export const ExemploHeaderLimpo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSaveProduto = async (data: any) => {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Produto salvo:', data);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // Aqui você aplicaria a lógica de tema
    console.log('Tema alterado para:', isDarkMode ? 'claro' : 'escuro');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header Limpo - Sem Logo, Funcional */}
      <HeaderLimpo 
        userInfo={{
          name: 'João Silva',
          role: 'Administrador',
          email: 'joao.silva@fenixcrm.com'
        }}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      {/* Layout Principal com Sidebar Simulada */}
      <div className="flex">
        
        {/* Sidebar Simulada (onde ficaria a logo) */}
        <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-14 hidden lg:block">
          <div className="p-6">
            {/* Logo na Sidebar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">Fênix CRM</h1>
                <p className="text-xs text-gray-500">v2.0.0</p>
              </div>
            </div>

            {/* Menu de Navegação */}
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 bg-blue-50 border-r-2 border-blue-600 rounded-l">
                📊 Dashboard
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded">
                👥 Clientes
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded">
                📦 Produtos
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded">
                📋 Propostas
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded">
                💰 Financeiro
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded">
                📈 Relatórios
              </a>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-6 py-8">
            
            {/* Cabeçalho da Página - Aqui que fica o contexto */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard de Vendas
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Acompanhe suas métricas e performance em tempo real
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                  </button>
                </div>
              </div>

              {/* Breadcrumb Contextual */}
              <nav className="flex text-sm text-gray-600">
                <span>Vendas</span>
                <span className="mx-2">›</span>
                <span>Dashboard</span>
                <span className="mx-2">›</span>
                <span className="text-gray-900">Visão Geral</span>
              </nav>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendas do Mês</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">R$ 127.432</p>
                    <p className="text-sm text-green-600 mt-1">+12,5% vs mês anterior</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Leads Qualificados</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">1.847</p>
                    <p className="text-sm text-green-600 mt-1">+8,3% vs mês anterior</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">68%</p>
                    <p className="text-sm text-red-600 mt-1">-2,1% vs mês anterior</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Produtos Ativos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">342</p>
                    <p className="text-sm text-green-600 mt-1">+15 novos produtos</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Área de Conteúdo Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Gráfico Principal */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Vendas por Período
                  </h2>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                {/* Simulação de Gráfico */}
                <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-600">Gráfico de vendas seria renderizado aqui</p>
                  </div>
                </div>
              </div>

              {/* Atividades Recentes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Atividades Recentes
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">✓</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Proposta aprovada
                      </p>
                      <p className="text-sm text-gray-600">
                        Cliente ABC aprovou proposta #1234
                      </p>
                      <p className="text-xs text-gray-500 mt-1">há 2 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Novo lead
                      </p>
                      <p className="text-sm text-gray-600">
                        Maria Santos se cadastrou no site
                      </p>
                      <p className="text-xs text-gray-500 mt-1">há 5 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📝</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Reunião agendada
                      </p>
                      <p className="text-sm text-gray-600">
                        Follow-up com cliente XYZ
                      </p>
                      <p className="text-xs text-gray-500 mt-1">amanhã às 14h</p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver todas as atividades
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Cadastro */}
      <ModalCadastroProduto
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveProduto}
      />
    </div>
  );
};

export default ExemploHeaderLimpo;
