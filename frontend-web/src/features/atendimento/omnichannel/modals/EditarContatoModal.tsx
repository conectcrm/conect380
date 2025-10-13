import React, { useState } from 'react';
import { X, User, Mail, Phone, Building2, Tag } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface EditarContatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: ContatoEditado) => void;
  contato?: {
    nome: string;
    telefone?: string;
    email?: string;
    empresa?: string;
    tags?: string[];
  };
}

export interface ContatoEditado {
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  tags: string[];
  observacoes?: string;
}

export const EditarContatoModal: React.FC<EditarContatoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contato
}) => {
  const { currentPalette } = useTheme();
  
  const [nome, setNome] = useState(contato?.nome || '');
  const [telefone, setTelefone] = useState(contato?.telefone || '');
  const [email, setEmail] = useState(contato?.email || '');
  const [empresa, setEmpresa] = useState(contato?.empresa || '');
  const [tags, setTags] = useState<string[]>(contato?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleAdicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoverTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleConfirmar = () => {
    if (!nome.trim()) {
      alert('O nome é obrigatório');
      return;
    }

    const dados: ContatoEditado = {
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
      empresa: empresa.trim() || undefined,
      tags,
      observacoes: observacoes.trim() || undefined
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: `${currentPalette.colors.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentPalette.colors.primary, color: 'white' }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Contato
              </h2>
              <p className="text-sm text-gray-500">
                Atualize as informações do contato
              </p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            {/* Telefone e Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Empresa
              </label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nome da empresa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags/Etiquetas
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdicionarTag())}
                  placeholder="Digite uma tag e pressione Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
                <button
                  onClick={handleAdicionarTag}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: currentPalette.colors.primary }}
                >
                  +
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoverTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas adicionais sobre o contato..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm resize-none"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleFechar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!nome.trim()}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: currentPalette.colors.primary }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
