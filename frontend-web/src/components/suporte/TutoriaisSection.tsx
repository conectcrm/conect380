import React, { useState, useMemo } from 'react';
import { Play, Clock, User, Eye, Download, Filter, Star, BookOpen } from 'lucide-react';

interface Tutorial {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: 'video' | 'texto' | 'pdf';
  duracao: number; // em minutos
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  autor: string;
  visualizacoes: number;
  rating: number;
  thumbnail: string;
  tags: string[];
  dataCriacao: string;
  link?: string;
}

interface TutoriaisSectionProps {
  searchTerm: string;
}

export const TutoriaisSection: React.FC<TutoriaisSectionProps> = ({ searchTerm }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [selectedNivel, setSelectedNivel] = useState<string>('todos');

  const tutoriais: Tutorial[] = [
    {
      id: '1',
      titulo: 'Como criar seu primeiro contato no ConectCRM',
      descricao: 'Aprenda passo a passo como adicionar e gerenciar contatos no sistema.',
      categoria: 'Contatos',
      tipo: 'video',
      duracao: 8,
      nivel: 'iniciante',
      autor: 'Equipe ConectCRM',
      visualizacoes: 2540,
      rating: 4.8,
      thumbnail: '/api/placeholder/300/200',
      tags: ['contatos', 'básico', 'cadastro'],
      dataCriacao: '2024-01-15',
      link: 'https://youtube.com/watch?v=exemplo1'
    },
    {
      id: '2',
      titulo: 'Configuração avançada de funil de vendas',
      descricao: 'Configure funis personalizados para otimizar seu processo de vendas.',
      categoria: 'Vendas',
      tipo: 'video',
      duracao: 15,
      nivel: 'avancado',
      autor: 'João Silva',
      visualizacoes: 1230,
      rating: 4.9,
      thumbnail: '/api/placeholder/300/200',
      tags: ['funil', 'vendas', 'configuração'],
      dataCriacao: '2024-01-10',
      link: 'https://youtube.com/watch?v=exemplo2'
    },
    {
      id: '3',
      titulo: 'Guia completo de relatórios',
      descricao: 'Manual detalhado sobre como criar e personalizar relatórios no sistema.',
      categoria: 'Relatórios',
      tipo: 'pdf',
      duracao: 30,
      nivel: 'intermediario',
      autor: 'Maria Santos',
      visualizacoes: 890,
      rating: 4.6,
      thumbnail: '/api/placeholder/300/200',
      tags: ['relatórios', 'análise', 'dados'],
      dataCriacao: '2024-01-08'
    },
    {
      id: '4',
      titulo: 'Integração com WhatsApp Business',
      descricao: 'Configure a integração com WhatsApp para automatizar comunicações.',
      categoria: 'Integrações',
      tipo: 'texto',
      duracao: 12,
      nivel: 'intermediario',
      autor: 'Pedro Costa',
      visualizacoes: 1560,
      rating: 4.7,
      thumbnail: '/api/placeholder/300/200',
      tags: ['whatsapp', 'integração', 'automação'],
      dataCriacao: '2024-01-05'
    },
    {
      id: '5',
      titulo: 'Criando propostas profissionais',
      descricao: 'Aprenda a criar propostas atrativas que convertem mais.',
      categoria: 'Propostas',
      tipo: 'video',
      duracao: 20,
      nivel: 'iniciante',
      autor: 'Ana Silva',
      visualizacoes: 3210,
      rating: 4.9,
      thumbnail: '/api/placeholder/300/200',
      tags: ['propostas', 'vendas', 'conversão'],
      dataCriacao: '2024-01-03',
      link: 'https://youtube.com/watch?v=exemplo5'
    },
    {
      id: '6',
      titulo: 'Automação de marketing por email',
      descricao: 'Configure campanhas automatizadas para nutrir seus leads.',
      categoria: 'Marketing',
      tipo: 'video',
      duracao: 18,
      nivel: 'avancado',
      autor: 'Lucas Oliveira',
      visualizacoes: 980,
      rating: 4.5,
      thumbnail: '/api/placeholder/300/200',
      tags: ['email', 'automação', 'marketing'],
      dataCriacao: '2024-01-01',
      link: 'https://youtube.com/watch?v=exemplo6'
    }
  ];

  const categorias = ['todas', ...Array.from(new Set(tutoriais.map(t => t.categoria)))];
  const tipos = ['todos', 'video', 'texto', 'pdf'];
  const niveis = ['todos', 'iniciante', 'intermediario', 'avancado'];

  const filteredTutoriais = useMemo(() => {
    return tutoriais.filter(tutorial => {
      const matchesSearch = !searchTerm || 
        tutorial.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todas' || tutorial.categoria === selectedCategory;
      const matchesTipo = selectedTipo === 'todos' || tutorial.tipo === selectedTipo;
      const matchesNivel = selectedNivel === 'todos' || tutorial.nivel === selectedNivel;
      
      return matchesSearch && matchesCategory && matchesTipo && matchesNivel;
    });
  }, [searchTerm, selectedCategory, selectedTipo, selectedNivel, tutoriais]);

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'iniciante':
        return 'bg-green-100 text-green-800';
      case 'intermediario':
        return 'bg-yellow-100 text-yellow-800';
      case 'avancado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'texto':
        return <BookOpen className="w-4 h-4" />;
      case 'pdf':
        return <Download className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[#002333]">
            Tutoriais ({filteredTutoriais.length})
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
                   tipo === 'video' ? 'Vídeos' :
                   tipo === 'texto' ? 'Artigos' : 'PDFs'}
                </option>
              ))}
            </select>

            <select
              value={selectedNivel}
              onChange={(e) => setSelectedNivel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            >
              {niveis.map(nivel => (
                <option key={nivel} value={nivel}>
                  {nivel === 'todos' ? 'Todos os Níveis' : 
                   nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de tutoriais */}
        {filteredTutoriais.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum tutorial encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutoriais.map((tutorial) => (
              <div
                key={tutorial.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.titulo}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      tutorial.tipo === 'video' ? 'bg-red-100 text-red-800' :
                      tutorial.tipo === 'texto' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {getTipoIcon(tutorial.tipo)}
                      <span className="ml-1">
                        {tutorial.tipo === 'video' ? 'Vídeo' :
                         tutorial.tipo === 'texto' ? 'Artigo' : 'PDF'}
                      </span>
                    </span>
                  </div>
                  {tutorial.tipo === 'video' && (
                    <div className="absolute bottom-3 right-3">
                      <span className="flex items-center space-x-1 px-2 py-1 bg-black bg-opacity-75 text-white rounded text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{tutorial.duracao}min</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-[#159A9C] bg-opacity-10 text-[#159A9C] rounded-full text-xs font-medium">
                      {tutorial.categoria}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNivelColor(tutorial.nivel)}`}>
                      {tutorial.nivel}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#002333] mb-2 line-clamp-2">
                    {tutorial.titulo}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {tutorial.descricao}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{tutorial.autor}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{tutorial.visualizacoes.toLocaleString('pt-BR')}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{tutorial.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {tutorial.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (tutorial.link) {
                        window.open(tutorial.link, '_blank');
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors"
                  >
                    {getTipoIcon(tutorial.tipo)}
                    <span>
                      {tutorial.tipo === 'video' ? 'Assistir' :
                       tutorial.tipo === 'texto' ? 'Ler' : 'Download'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
