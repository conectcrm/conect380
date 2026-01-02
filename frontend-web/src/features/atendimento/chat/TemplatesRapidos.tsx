import React, { useState, useRef, useEffect } from 'react';
import { Zap, ChevronDown, Search, Star } from 'lucide-react';

interface Template {
  id: string;
  titulo: string;
  texto: string;
  categoria?: string;
  atalho?: string;
  favorito?: boolean;
}

interface TemplatesRapidosProps {
  onSelecionarTemplate: (texto: string) => void;
  className?: string;
}

const TEMPLATES_PADRAO: Template[] = [
  {
    id: '1',
    titulo: '👋 Saudação Inicial',
    texto: 'Olá! Como posso ajudar você hoje?',
    categoria: 'Saudação',
    atalho: '/ola',
    favorito: true,
  },
  {
    id: '2',
    titulo: '⏳ Solicitar Aguardo',
    texto: 'Por favor, aguarde um momento enquanto verifico isso para você.',
    categoria: 'Processo',
    atalho: '/aguarde',
    favorito: true,
  },
  {
    id: '3',
    titulo: '✅ Problema Resolvido',
    texto: 'Problema resolvido! Há mais alguma coisa em que posso ajudar?',
    categoria: 'Resolução',
    atalho: '/resolvido',
  },
  {
    id: '4',
    titulo: '📧 Envio de Email',
    texto:
      'Enviarei as informações detalhadas por email em alguns instantes. Por favor, verifique sua caixa de entrada.',
    categoria: 'Processo',
    atalho: '/email',
  },
  {
    id: '5',
    titulo: '🔄 Retorno de Contato',
    texto: 'Retornarei seu contato assim que possível. Nosso prazo é de até 24 horas.',
    categoria: 'Processo',
    atalho: '/retorno',
  },
  {
    id: '6',
    titulo: '📞 Solicitar Telefone',
    texto: 'Para prosseguir, preciso que me informe seu número de telefone para contato.',
    categoria: 'Informação',
    atalho: '/telefone',
  },
  {
    id: '7',
    titulo: '📧 Solicitar Email',
    texto: 'Para enviar os documentos, preciso que me informe seu endereço de email.',
    categoria: 'Informação',
    atalho: '/solicitemail',
  },
  {
    id: '8',
    titulo: '🙏 Agradecimento',
    texto: 'Muito obrigado por entrar em contato! Estamos sempre à disposição.',
    categoria: 'Encerramento',
    atalho: '/obrigado',
  },
  {
    id: '9',
    titulo: '👋 Despedida',
    texto: 'Tenha um ótimo dia! Qualquer dúvida, estou à disposição.',
    categoria: 'Encerramento',
    atalho: '/tchau',
  },
  {
    id: '10',
    titulo: '⚠️ Fora do Horário',
    texto:
      'No momento estamos fora do horário de atendimento. Nosso expediente é de segunda a sexta, das 9h às 18h. Retornaremos seu contato no próximo dia útil.',
    categoria: 'Informação',
    atalho: '/horario',
  },
  {
    id: '11',
    titulo: '🔍 Verificando Informações',
    texto: 'Estou verificando as informações no sistema. Isso pode levar alguns minutos.',
    categoria: 'Processo',
    atalho: '/verificando',
  },
  {
    id: '12',
    titulo: '📋 Protocolo Gerado',
    texto: 'Seu protocolo de atendimento foi gerado. Anote para futuras consultas.',
    categoria: 'Informação',
    atalho: '/protocolo',
  },
];

export const TemplatesRapidos: React.FC<TemplatesRapidosProps> = ({
  onSelecionarTemplate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates] = useState<Template[]>(TEMPLATES_PADRAO);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focar no input de busca ao abrir
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtrar templates
  const filteredTemplates = templates.filter(
    (template) =>
      template.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.atalho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.categoria?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Agrupar por categoria
  const templatesPorCategoria = filteredTemplates.reduce(
    (acc, template) => {
      const categoria = template.categoria || 'Outros';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(template);
      return acc;
    },
    {} as Record<string, Template[]>,
  );

  const handleSelectTemplate = (template: Template) => {
    onSelecionarTemplate(template.texto);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão de Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        title="Respostas rápidas (atalho: /)"
      >
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Templates</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
          {/* Header com busca */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Dica: Digite <code className="bg-gray-100 px-1 rounded">/</code> seguido do atalho
              na mensagem
            </p>
          </div>

          {/* Lista de Templates */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(templatesPorCategoria).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">Nenhum template encontrado</p>
              </div>
            ) : (
              Object.entries(templatesPorCategoria).map(([categoria, templatesCategoria]) => (
                <div key={categoria} className="border-b border-gray-100 last:border-0">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {categoria}
                    </h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {templatesCategoria.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full px-3 py-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-sm text-gray-900 group-hover:text-blue-700 truncate">
                              {template.titulo}
                            </span>
                            {template.favorito && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          {template.atalho && (
                            <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono flex-shrink-0">
                              {template.atalho}
                            </code>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 group-hover:text-gray-700 line-clamp-2">
                          {template.texto}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}{' '}
              disponível
              {filteredTemplates.length !== 1 ? 'is' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook para processar atalhos de templates na mensagem
export const useTemplateShortcuts = (templates: Template[] = TEMPLATES_PADRAO) => {
  const processShortcut = (text: string): { found: boolean; replacement?: string } => {
    // Verifica se começa com /
    if (!text.startsWith('/')) {
      return { found: false };
    }

    const shortcut = text.toLowerCase();
    const template = templates.find((t) => t.atalho?.toLowerCase() === shortcut);

    if (template) {
      return { found: true, replacement: template.texto };
    }

    return { found: false };
  };

  return { processShortcut };
};
