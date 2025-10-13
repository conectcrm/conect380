import React, { useState } from 'react';
import { X, MessageSquare, Mail, Phone, Search, User, Building2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface NovoAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: NovoAtendimentoData) => void;
}

export interface NovoAtendimentoData {
  canal: 'whatsapp' | 'chat' | 'email' | 'telefone';
  contato: {
    nome: string;
    telefone?: string;
    email?: string;
  };
  clienteId?: string;
  assunto: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  tags: string[];
}

export const NovoAtendimentoModal: React.FC<NovoAtendimentoModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { currentPalette } = useTheme();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [canal, setCanal] = useState<'whatsapp' | 'chat' | 'email' | 'telefone'>('whatsapp');
  const [buscaContato, setBuscaContato] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<any>(null);
  const [novoContato, setNovoContato] = useState({
    nome: '',
    telefone: '',
    email: ''
  });
  const [clienteVinculado, setClienteVinculado] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Mock de contatos para busca (será substituído por API)
  const contatosMock = [
    { id: '1', nome: 'João Silva', telefone: '11999998888', email: 'joao@email.com' },
    { id: '2', nome: 'Maria Santos', telefone: '11988887777', email: 'maria@email.com' },
    { id: '3', nome: 'Pedro Costa', telefone: '11977776666', email: 'pedro@email.com' }
  ];

  const contatosFiltrados = buscaContato
    ? contatosMock.filter(c =>
        c.nome.toLowerCase().includes(buscaContato.toLowerCase()) ||
        c.telefone.includes(buscaContato) ||
        c.email.toLowerCase().includes(buscaContato.toLowerCase())
      )
    : contatosMock;

  const canais = [
    { id: 'whatsapp', nome: 'WhatsApp', icon: MessageSquare, cor: '#25D366' },
    { id: 'chat', nome: 'Chat Web', icon: MessageSquare, cor: currentPalette.colors.primary },
    { id: 'email', nome: 'Email', icon: Mail, cor: '#EA4335' },
    { id: 'telefone', nome: 'Telefone', icon: Phone, cor: '#0088CC' }
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', cor: '#10B981' },
    { value: 'media', label: 'Média', cor: '#F59E0B' },
    { value: 'alta', label: 'Alta', cor: '#EF4444' },
    { value: 'urgente', label: 'Urgente', cor: '#DC2626' }
  ];

  const handleAdicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoverTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSelecionarContato = (contato: any) => {
    setContatoSelecionado(contato);
    setBuscaContato('');
  };

  const handleProximoPasso = () => {
    if (!contatoSelecionado && !novoContato.nome) {
      alert('Selecione ou cadastre um contato');
      return;
    }
    setStep(2);
  };

  const handleConfirmar = () => {
    const dados: NovoAtendimentoData = {
      canal,
      contato: contatoSelecionado || novoContato,
      clienteId: clienteVinculado || undefined,
      assunto,
      descricao,
      prioridade,
      tags
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    // Reset form
    setStep(1);
    setCanal('whatsapp');
    setBuscaContato('');
    setContatoSelecionado(null);
    setNovoContato({ nome: '', telefone: '', email: '' });
    setClienteVinculado('');
    setAssunto('');
    setDescricao('');
    setPrioridade('media');
    setTags([]);
    setTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Novo Atendimento
              </h2>
              <p className="text-sm text-gray-500">
                Passo {step} de 2 - {step === 1 ? 'Contato e Canal' : 'Detalhes do Atendimento'}
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
          {step === 1 ? (
            <div className="space-y-6">
              {/* Seleção de Canal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Canal de Atendimento *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {canais.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCanal(c.id as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        canal === c.id
                          ? 'border-current shadow-md scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: canal === c.id ? c.cor : undefined,
                        backgroundColor: canal === c.id ? `${c.cor}10` : undefined
                      }}
                    >
                      <c.icon 
                        className="w-6 h-6" 
                        style={{ color: canal === c.id ? c.cor : '#6B7280' }}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {c.nome}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Busca/Seleção de Contato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contato *
                </label>
                
                {!contatoSelecionado ? (
                  <>
                    {/* Campo de Busca */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={buscaContato}
                        onChange={(e) => setBuscaContato(e.target.value)}
                        placeholder="Buscar contato por nome, telefone ou email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                        style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                      />
                    </div>

                    {/* Lista de Contatos Encontrados */}
                    {buscaContato && (
                      <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                        {contatosFiltrados.length > 0 ? (
                          contatosFiltrados.map((contato) => (
                            <button
                              key={contato.id}
                              onClick={() => handleSelecionarContato(contato)}
                              className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-center gap-3 border-b last:border-b-0"
                            >
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                                style={{ backgroundColor: currentPalette.colors.primary }}
                              >
                                {contato.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {contato.nome}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {contato.telefone} • {contato.email}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Nenhum contato encontrado
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulário Novo Contato */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Ou cadastre um novo contato:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={novoContato.nome}
                            onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                            placeholder="Ex: João Silva"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                            style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Telefone {canal === 'whatsapp' || canal === 'telefone' ? '*' : ''}
                            </label>
                            <input
                              type="tel"
                              value={novoContato.telefone}
                              onChange={(e) => setNovoContato({ ...novoContato, telefone: e.target.value })}
                              placeholder="(11) 99999-9999"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                              style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Email {canal === 'email' ? '*' : ''}
                            </label>
                            <input
                              type="email"
                              value={novoContato.email}
                              onChange={(e) => setNovoContato({ ...novoContato, email: e.target.value })}
                              placeholder="email@exemplo.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                              style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Contato Selecionado */
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: currentPalette.colors.primary }}
                      >
                        {contatoSelecionado.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contatoSelecionado.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contatoSelecionado.telefone} • {contatoSelecionado.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setContatoSelecionado(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cliente Vinculado (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Cliente/Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteVinculado}
                  onChange={(e) => setClienteVinculado(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vincule este atendimento a um cliente CRM
                </p>
              </div>
            </div>
          ) : (
            /* Step 2: Detalhes */
            <div className="space-y-5">
              {/* Assunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto *
                </label>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Dúvida sobre produto X"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição/Mensagem Inicial
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o motivo do atendimento..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm resize-none"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {prioridades.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPrioridade(p.value as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        prioridade === p.value
                          ? 'text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: prioridade === p.value ? p.cor : undefined
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    Adicionar
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

              {/* Aviso */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dica:</p>
                  <p className="text-xs">
                    Após criar o atendimento, você será redirecionado para a conversa e poderá enviar mensagens imediatamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={step === 1 ? handleFechar : () => setStep(1)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>
          <button
            onClick={step === 1 ? handleProximoPasso : handleConfirmar}
            disabled={step === 1 ? (!contatoSelecionado && !novoContato.nome) : !assunto}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: currentPalette.colors.primary }}
          >
            {step === 1 ? 'Próximo' : 'Criar Atendimento'}
          </button>
        </div>
      </div>
    </div>
  );
};
