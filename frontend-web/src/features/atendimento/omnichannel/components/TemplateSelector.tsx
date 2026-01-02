import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { TemplateMensagem } from '../../../services/templateMensagemService';

interface TemplateSelectorProps {
  templates: TemplateMensagem[];
  onSelect: (conteudo: string) => void;
  onClose: () => void;
  searchTerm?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  onClose,
  searchTerm = '',
}) => {
  const [search, setSearch] = useState(searchTerm);
  const [filteredTemplates, setFilteredTemplates] = useState(templates);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focar no input ao abrir
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredTemplates(templates);
      return;
    }

    const searchLower = search.toLowerCase().replace('/', '');
    const filtered = templates.filter(
      (t) =>
        t.titulo.toLowerCase().includes(searchLower) ||
        t.conteudo.toLowerCase().includes(searchLower) ||
        t.atalho?.toLowerCase().includes(searchLower) ||
        t.categoria?.toLowerCase().includes(searchLower)
    );
    setFilteredTemplates(filtered);
  }, [search, templates]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // TODO: Navegar para baixo na lista
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // TODO: Navegar para cima na lista
    }
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg shadow-xl border border-[#DEEFE7] z-50">
      {/* Header */}
      <div className="p-3 border-b border-[#DEEFE7] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#002333]">Templates Rápidos</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#DEEFE7] rounded transition-colors"
        >
          <X className="h-4 w-4 text-[#B4BEC9]" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#DEEFE7]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B4BEC9]" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar template..."
            className="w-full pl-10 pr-3 py-2 border border-[#B4BEC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          />
        </div>
        <p className="text-xs text-[#B4BEC9] mt-2">
          Digite para buscar ou use atalhos (ex: /bv)
        </p>
      </div>

      {/* Templates List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[#B4BEC9]">
              Nenhum template encontrado
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template.conteudo)}
                className="w-full text-left p-3 hover:bg-[#159A9C]/10 rounded-lg transition-colors group"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm text-[#002333] group-hover:text-[#159A9C]">
                    {template.titulo}
                  </p>
                  {template.atalho && (
                    <span className="text-xs font-mono px-2 py-0.5 bg-[#DEEFE7] text-[#159A9C] rounded">
                      {template.atalho}
                    </span>
                  )}
                </div>
                {template.categoria && (
                  <p className="text-xs text-[#B4BEC9] mb-1">
                    {template.categoria}
                  </p>
                )}
                <p className="text-xs text-[#002333]/70 line-clamp-2">
                  {template.conteudo}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#DEEFE7] bg-[#DEEFE7]/30">
        <p className="text-xs text-[#B4BEC9] text-center">
          ↑↓ para navegar • Enter para selecionar • Esc para fechar
        </p>
      </div>
    </div>
  );
};
