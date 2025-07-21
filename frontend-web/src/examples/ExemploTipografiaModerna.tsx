import React from 'react';

/**
 * Demonstração do Sistema de Tipografia Moderno
 * Comparação com os padrões dos CRMs mais conceituados
 */
export const ExemploTipografiaModerna: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Cabeçalho da demonstração */}
      <header className="text-center space-y-4">
        <h1 className="text-fluid-3xl font-bold text-gray-900">
          Sistema de Tipografia Moderno
        </h1>
        <p className="text-fluid-lg text-gray-600 max-w-3xl mx-auto">
          Baseado nos padrões dos CRMs mais conceituados como Salesforce Lightning, 
          HubSpot, Zoho e Pipedrive para melhor experiência do usuário.
        </p>
      </header>

      {/* Comparação: Antes vs Depois */}
      <section className="space-y-8">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📊 Comparação: Antes vs Agora
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Versão Antiga */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-red-600">❌ Versão Anterior</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-3">
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <strong>Problemas identificados:</strong>
              </div>
              <ul className="space-y-2 text-sm text-red-700">
                <li>• Fontes muito pequenas (14px base)</li>
                <li>• Line-height inadequado (1.4)</li>
                <li>• Contraste insuficiente</li>
                <li>• Falta de hierarquia clara</li>
                <li>• Não seguia padrões modernos</li>
              </ul>
            </div>
          </div>

          {/* Versão Nova */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-green-600">✅ Versão Atual</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
              <div className="text-fluid-base font-medium">
                <strong>Melhorias implementadas:</strong>
              </div>
              <ul className="space-y-2 text-green-700">
                <li>• Fonte base 16px (padrão moderno)</li>
                <li>• Line-height otimizado (1.6)</li>
                <li>• Contraste WCAG AA compliant</li>
                <li>• Hierarquia tipográfica clara</li>
                <li>• Padrões dos líderes de mercado</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Hierarquia Tipográfica */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📐 Hierarquia Tipográfica
        </h2>
        
        <div className="grid gap-6">
          <div className="space-y-4">
            <h1 className="heading-responsive">H1 - Título Principal (28px → 40px)</h1>
            <h2 className="text-fluid-2xl font-semibold text-gray-900">H2 - Seção Principal (24px → 32px)</h2>
            <h3 className="subheading-responsive">H3 - Subsection (20px → 24px)</h3>
            <h4 className="text-fluid-lg font-semibold text-gray-800">H4 - Título de Card (18px → 20px)</h4>
            <h5 className="text-fluid-base font-semibold text-gray-700">H5 - Label Destaque (16px → 18px)</h5>
            <h6 className="label-responsive uppercase">H6 - Metadata (14px → 16px)</h6>
          </div>
        </div>
      </section>

      {/* Texto Corpo */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📝 Texto Corpo
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="subheading-responsive mb-3">Texto Base (Corpo)</h3>
            <p className="text-responsive">
              Este é o texto padrão usado em parágrafos, descrições e conteúdo geral. 
              Agora usa 16px como base (era 14px), com line-height 1.6 para melhor 
              legibilidade, seguindo as práticas dos CRMs líderes como Salesforce e HubSpot.
            </p>
          </div>

          <div>
            <h3 className="subheading-responsive mb-3">Texto Grande (Lead)</h3>
            <p className="text-fluid-lg text-gray-700">
              Texto de destaque para introduções importantes, chamadas para ação 
              ou informações que precisam de maior visibilidade visual.
            </p>
          </div>

          <div>
            <h3 className="subheading-responsive mb-3">Texto Pequeno (Auxiliar)</h3>
            <p className="caption-responsive">
              Texto auxiliar para metadados, timestamps, labels secundários e 
              informações complementares que não precisam de destaque principal.
            </p>
          </div>
        </div>
      </section>

      {/* Formulários */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📋 Tipografia em Formulários
        </h2>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="form-label">
              Nome do Cliente *
            </label>
            <input 
              type="text" 
              className="form-input"
              placeholder="Digite o nome completo do cliente"
            />
            <p className="caption-responsive mt-1">
              Este campo é obrigatório e será usado para identificação.
            </p>
          </div>

          <div>
            <label className="form-label">
              Email de Contato
            </label>
            <input 
              type="email" 
              className="form-input"
              placeholder="cliente@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <div className="error-text">
              ❌ Este campo é obrigatório (erro)
            </div>
            <div className="success-text">
              ✅ Email validado com sucesso (sucesso)
            </div>
            <div className="warning-text">
              ⚠️ Verifique o formato do email (aviso)
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard e Métricas */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📊 Dashboard e Métricas
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="metric-value text-blue-600">
              R$ 127.432
            </div>
            <div className="metric-label mt-2">
              Vendas do Mês
            </div>
            <div className="metric-change positive mt-1">
              +12,5% vs mês anterior
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="metric-value text-green-600">
              1.847
            </div>
            <div className="metric-label mt-2">
              Leads Qualificados
            </div>
            <div className="metric-change positive mt-1">
              +8,3% vs mês anterior
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <div className="metric-value text-purple-600">
              68%
            </div>
            <div className="metric-label mt-2">
              Taxa de Conversão
            </div>
            <div className="metric-change negative mt-1">
              -2,1% vs mês anterior
            </div>
          </div>
        </div>
      </section>

      {/* Tabelas */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          📋 Tipografia em Tabelas
        </h2>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-header text-left p-4">Cliente</th>
                <th className="table-header text-left p-4">Status</th>
                <th className="table-header text-right p-4">Valor</th>
                <th className="table-header text-center p-4">Data</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="table-cell p-4">Tech Solutions Ltda</td>
                <td className="p-4">
                  <span className="badge bg-green-100 text-green-800">Ativo</span>
                </td>
                <td className="table-cell-numeric text-right p-4">R$ 25.400,00</td>
                <td className="table-cell text-center p-4">15/01/2025</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="table-cell p-4">Innovation Corp</td>
                <td className="p-4">
                  <span className="badge bg-yellow-100 text-yellow-800">Pendente</span>
                </td>
                <td className="table-cell-numeric text-right p-4">R$ 18.750,00</td>
                <td className="table-cell text-center p-4">14/01/2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Benchmarks de Mercado */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          🏆 Benchmark com CRMs Líderes
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="subheading-responsive">Salesforce Lightning</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-blue-900">Características:</div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Base: 16px | Line-height: 1.6</li>
                <li>• Headers: Scale fluida 20px-40px</li>
                <li>• Contraste AAA em elementos críticos</li>
                <li>• Font-weight diferenciado por hierarquia</li>
              </ul>
              <div className="text-xs text-blue-600 mt-3">
                ✅ Nosso sistema agora segue estes padrões
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="subheading-responsive">HubSpot</h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-orange-900">Características:</div>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Base: 16px | Line-height: 1.5-1.6</li>
                <li>• Typography scale bem definida</li>
                <li>• Micro-typography otimizada</li>
                <li>• Responsividade fluida com clamp()</li>
              </ul>
              <div className="text-xs text-orange-600 mt-3">
                ✅ Implementado no Fênix CRM
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="subheading-responsive">Pipedrive</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-green-900">Características:</div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Interface clean com boa legibilidade</li>
                <li>• Texto otimizado para produtividade</li>
                <li>• Hierarquia visual clara</li>
                <li>• Font-family moderna (Inter/System)</li>
              </ul>
              <div className="text-xs text-green-600 mt-3">
                ✅ Padrões adotados e melhorados
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="subheading-responsive">Zoho CRM</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium text-purple-900">Características:</div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Tipografia funcional e clara</li>
                <li>• Boa separação visual de conteúdo</li>
                <li>• Contraste adequado</li>
                <li>• Adaptação mobile eficiente</li>
              </ul>
              <div className="text-xs text-purple-600 mt-3">
                ✅ Conceitos aplicados no projeto
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acessibilidade */}
      <section className="space-y-6">
        <h2 className="text-fluid-2xl font-semibold text-gray-900 border-b pb-4">
          ♿ Acessibilidade e Inclusão
        </h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="subheading-responsive">Melhorias Implementadas:</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-fluid-base font-semibold text-gray-800 mb-2">
                WCAG 2.1 Compliance
              </h4>
              <ul className="caption-responsive space-y-1">
                <li>• Contraste mínimo 4.5:1 (AA)</li>
                <li>• Contraste preferido 7:1 (AAA)</li>
                <li>• Texto redimensionável até 200%</li>
                <li>• Suporte a mode de alto contraste</li>
              </ul>
            </div>
            <div>
              <h4 className="text-fluid-base font-semibold text-gray-800 mb-2">
                Inclusão Visual
              </h4>
              <ul className="caption-responsive space-y-1">
                <li>• Fontes otimizadas para dislexia</li>
                <li>• Line-height aumentado</li>
                <li>• Letter-spacing adequado</li>
                <li>• Hierarquia clara por tamanho e peso</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusão */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center space-y-4">
        <h2 className="text-fluid-2xl font-bold text-gray-900">
          🎯 Resultado Final
        </h2>
        <p className="text-fluid-lg text-gray-700 max-w-3xl mx-auto">
          O Fênix CRM agora possui um sistema de tipografia moderno, alinhado com os 
          padrões dos CRMs mais conceituados do mercado, garantindo melhor experiência 
          do usuário, acessibilidade e profissionalismo visual.
        </p>
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4">
            <div className="metric-value text-sm text-green-600">✅</div>
            <div className="caption-responsive mt-1">Legibilidade</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="metric-value text-sm text-blue-600">✅</div>
            <div className="caption-responsive mt-1">Responsividade</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="metric-value text-sm text-purple-600">✅</div>
            <div className="caption-responsive mt-1">Acessibilidade</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="metric-value text-sm text-orange-600">✅</div>
            <div className="caption-responsive mt-1">Modernidade</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExemploTipografiaModerna;
