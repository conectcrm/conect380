import React, { useState, useMemo } from 'react';
import { Book, Download, ExternalLink, Search, FileText, Code, Settings, Users, CreditCard, Shield } from 'lucide-react';

interface DocumentoItem {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: 'manual' | 'api' | 'guia' | 'politica';
  versao: string;
  tamanho: string;
  ultimaAtualizacao: string;
  link: string;
  downloadUrl?: string;
  tags: string[];
}

interface DocumentacaoSectionProps {
  searchTerm: string;
}

export const DocumentacaoSection: React.FC<DocumentacaoSectionProps> = ({ searchTerm }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');

  const documentos: DocumentoItem[] = [
    {
      id: '1',
      titulo: 'Manual do Usuário ConectCRM',
      descricao: 'Guia completo para utilização de todas as funcionalidades do sistema.',
      categoria: 'Geral',
      tipo: 'manual',
      versao: '2.1.0',
      tamanho: '15.2 MB',
      ultimaAtualizacao: '2024-01-15',
      link: '/docs/manual-usuario',
      downloadUrl: '/downloads/manual-usuario.pdf',
      tags: ['manual', 'completo', 'funcionalidades']
    },
    {
      id: '2',
      titulo: 'API Reference Guide',
      descricao: 'Documentação técnica completa da API REST do ConectCRM.',
      categoria: 'Desenvolvimento',
      tipo: 'api',
      versao: '1.8.3',
      tamanho: '5.8 MB',
      ultimaAtualizacao: '2024-01-12',
      link: '/docs/api-reference',
      downloadUrl: '/downloads/api-reference.pdf',
      tags: ['api', 'rest', 'desenvolvimento', 'integração']
    },
    {
      id: '3',
      titulo: 'Guia de Configuração Inicial',
      descricao: 'Passo a passo para configurar sua conta e começar a usar o sistema.',
      categoria: 'Configuração',
      tipo: 'guia',
      versao: '1.5.0',
      tamanho: '3.2 MB',
      ultimaAtualizacao: '2024-01-10',
      link: '/docs/configuracao-inicial',
      downloadUrl: '/downloads/configuracao-inicial.pdf',
      tags: ['configuração', 'inicial', 'setup']
    },
    {
      id: '4',
      titulo: 'Política de Privacidade e LGPD',
      descricao: 'Informações sobre tratamento de dados e conformidade com a LGPD.',
      categoria: 'Legal',
      tipo: 'politica',
      versao: '2.0.0',
      tamanho: '1.1 MB',
      ultimaAtualizacao: '2024-01-08',
      link: '/docs/politica-privacidade',
      downloadUrl: '/downloads/politica-privacidade.pdf',
      tags: ['lgpd', 'privacidade', 'legal']
    },
    {
      id: '5',
      titulo: 'Guia de Integrações',
      descricao: 'Como conectar o ConectCRM com outros sistemas e ferramentas.',
      categoria: 'Integrações',
      tipo: 'guia',
      versao: '1.7.2',
      tamanho: '8.5 MB',
      ultimaAtualizacao: '2024-01-05',
      link: '/docs/integracoes',
      downloadUrl: '/downloads/guia-integracoes.pdf',
      tags: ['integrações', 'conectar', 'sistemas']
    },
    {
      id: '6',
      titulo: 'Manual de Segurança',
      descricao: 'Boas práticas de segurança e configurações recomendadas.',
      categoria: 'Segurança',
      tipo: 'manual',
      versao: '1.3.1',
      tamanho: '4.7 MB',
      ultimaAtualizacao: '2024-01-03',
      link: '/docs/seguranca',
      downloadUrl: '/downloads/manual-seguranca.pdf',
      tags: ['segurança', 'práticas', 'configurações']
    },
    {
      id: '7',
      titulo: 'Guia de Faturamento e Planos',
      descricao: 'Informações sobre planos, faturamento e gestão de assinatura.',
      categoria: 'Financeiro',
      tipo: 'guia',
      versao: '1.4.0',
      tamanho: '2.3 MB',
      ultimaAtualizacao: '2024-01-01',
      link: '/docs/faturamento',
      downloadUrl: '/downloads/guia-faturamento.pdf',
      tags: ['faturamento', 'planos', 'assinatura']
    },
    {
      id: '8',
      titulo: 'Documentação de Webhooks',
      descricao: 'Como configurar e usar webhooks para integração em tempo real.',
      categoria: 'Desenvolvimento',
      tipo: 'api',
      versao: '1.2.5',
      tamanho: '2.1 MB',
      ultimaAtualizacao: '2023-12-28',
      link: '/docs/webhooks',
      downloadUrl: '/downloads/webhooks-docs.pdf',
      tags: ['webhooks', 'tempo real', 'eventos']
    }
  ];

  const categorias = ['todas', ...Array.from(new Set(documentos.map(d => d.categoria)))];
  const tipos = ['todos', 'manual', 'api', 'guia', 'politica'];

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'Geral':
        return <Book className="w-5 h-5" />;
      case 'Desenvolvimento':
        return <Code className="w-5 h-5" />;
      case 'Configuração':
        return <Settings className="w-5 h-5" />;
      case 'Legal':
        return <Shield className="w-5 h-5" />;
      case 'Integrações':
        return <Users className="w-5 h-5" />;
      case 'Segurança':
        return <Shield className="w-5 h-5" />;
      case 'Financeiro':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      case 'api':
        return 'bg-green-100 text-green-800';
      case 'guia':
        return 'bg-purple-100 text-purple-800';
      case 'politica':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocumentos = useMemo(() => {
    return documentos.filter(documento => {
      const matchesSearch = !searchTerm || 
        documento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documento.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        documento.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todas' || documento.categoria === selectedCategory;
      const matchesTipo = selectedTipo === 'todos' || documento.tipo === selectedTipo;
      
      return matchesSearch && matchesCategory && matchesTipo;
    });
  }, [searchTerm, selectedCategory, selectedTipo, documentos]);

  const handleViewDocument = (documento: DocumentoItem) => {
    window.open(documento.link, '_blank');
  };

  const handleDownload = (documento: DocumentoItem) => {
    if (documento.downloadUrl) {
      // Implementar download
      console.log('Download:', documento.downloadUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[#002333]">
            Documentação ({filteredDocumentos.length})
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
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

            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo === 'todos' ? 'Todos os Tipos' : 
                   tipo === 'manual' ? 'Manuais' :
                   tipo === 'api' ? 'API Docs' :
                   tipo === 'guia' ? 'Guias' : 'Políticas'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de documentos */}
        {filteredDocumentos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum documento encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocumentos.map((documento) => (
              <div
                key={documento.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center space-x-2 text-[#159A9C]">
                        {getCategoryIcon(documento.categoria)}
                        <span className="text-sm font-medium">{documento.categoria}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(documento.tipo)}`}>
                        {documento.tipo === 'manual' ? 'Manual' :
                         documento.tipo === 'api' ? 'API' :
                         documento.tipo === 'guia' ? 'Guia' : 'Política'}
                      </span>
                      <span className="text-xs text-gray-500">
                        v{documento.versao}
                      </span>
                    </div>

                    <h3 className="font-semibold text-[#002333] mb-2">
                      {documento.titulo}
                    </h3>

                    <p className="text-gray-600 mb-3">
                      {documento.descricao}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Tamanho: {documento.tamanho}</span>
                      <span>Atualizado: {new Date(documento.ultimaAtualizacao).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {documento.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleViewDocument(documento)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visualizar</span>
                    </button>

                    {documento.downloadUrl && (
                      <button
                        onClick={() => handleDownload(documento)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de ajuda adicional */}
      <div className="bg-gradient-to-r from-[#159A9C] to-[#0d7a7d] rounded-lg p-6 text-white">
        <h3 className="text-xl font-semibold mb-2">
          Precisa de ajuda específica?
        </h3>
        <p className="mb-4 text-gray-100">
          Nossa equipe está sempre disponível para ajudar você a aproveitar ao máximo o ConectCRM.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span>Solicitar Documentação Personalizada</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
            <Users className="w-4 h-4" />
            <span>Falar com Especialista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
