import React, { useEffect, useMemo, useState } from 'react';
import { X, MessageSquare, Mail, Phone, Search, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { atendimentoService, CanalAtendimento, ContatoResumo } from '../services/atendimentoService';
import { CanalTipo } from '../types';

interface NovoAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: NovoAtendimentoData) => void;
}

export interface NovoAtendimentoData {
  canalId: string;
  canalTipo: CanalTipo;
  canalNome: string;
  origem: string;
  contatoId?: string;
  contatoNome: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  clienteId?: string;
  assunto: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  tags: string[];
}

const mapOrigemByCanal = (tipo: CanalTipo): string => {
  switch (tipo) {
    case 'whatsapp':
      return 'WHATSAPP';
    case 'telegram':
      return 'TELEGRAM';
    case 'email':
      return 'EMAIL';
    case 'chat':
      return 'WEBCHAT';
    case 'telefone':
    default:
      return 'API';
  }
};

const normalizarCorCanal = (tipo: CanalTipo, fallback: string): string => {
  switch (tipo) {
    case 'whatsapp':
      return '#25D366';
    case 'email':
      return '#EA4335';
    case 'telegram':
      return '#2AABEE';
    case 'telefone':
      return '#0088CC';
    case 'chat':
    default:
      return fallback;
  }
};

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export const NovoAtendimentoModal: React.FC<NovoAtendimentoModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { currentPalette } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);

  const [canais, setCanais] = useState<CanalAtendimento[]>([]);
  const [carregandoCanais, setCarregandoCanais] = useState(false);
  const [erroCanais, setErroCanais] = useState<string | null>(null);
  const [canalSelecionadoId, setCanalSelecionadoId] = useState<string | null>(null);

  const [contatos, setContatos] = useState<ContatoResumo[]>([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [erroContatos, setErroContatos] = useState<string | null>(null);
  const [buscaContato, setBuscaContato] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoResumo | null>(null);

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
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const carregarCanais = async () => {
      setCarregandoCanais(true);
      setErroCanais(null);
      try {
        const resposta = await atendimentoService.listarCanais();
        setCanais(resposta);
        if (resposta.length > 0) {
          setCanalSelecionadoId((prev) => prev ?? resposta[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar canais de atendimento:', error);
        setErroCanais('Não foi possível carregar os canais de atendimento.');
      } finally {
        setCarregandoCanais(false);
      }
    };

    const carregarContatos = async () => {
      setCarregandoContatos(true);
      setErroContatos(null);
      try {
        const resposta = await atendimentoService.listarContatos();
        setContatos(resposta);
      } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        setErroContatos('Não foi possível carregar os contatos do CRM.');
      } finally {
        setCarregandoContatos(false);
      }
    };

    carregarCanais();
    carregarContatos();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setErroFormulario(null);
  }, [isOpen, step, canalSelecionadoId, contatoSelecionado, novoContato.nome, novoContato.telefone, novoContato.email, assunto, descricao]);

  const contatosFiltrados = useMemo(() => {
    if (!buscaContato) {
      return contatos.slice(0, 25);
    }

    const termo = buscaContato.toLowerCase();
    return contatos
      .filter((contato) =>
        contato.nome.toLowerCase().includes(termo) ||
        (contato.telefone && contato.telefone.includes(buscaContato)) ||
        (contato.email && contato.email.toLowerCase().includes(termo))
      )
      .slice(0, 25);
  }, [buscaContato, contatos]);

  const canalSelecionado = canais.find((canalAtual) => canalAtual.id === canalSelecionadoId) || null;

  const prioridades = [
    { value: 'baixa', label: 'Baixa', cor: '#10B981' },
    { value: 'media', label: 'Média', cor: '#F59E0B' },
    { value: 'alta', label: 'Alta', cor: '#EF4444' },
    { value: 'urgente', label: 'Urgente', cor: '#DC2626' }
  ];

  const handleAdicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoverTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleSelecionarContato = (contato: ContatoResumo) => {
    setContatoSelecionado(contato);
    setBuscaContato('');
    setNovoContato({
      nome: contato.nome,
      telefone: contato.telefone || '',
      email: contato.email || ''
    });
    setClienteVinculado(contato.clienteNome || '');
  };

  const validarTelefoneObrigatorio = (tipo?: CanalTipo, telefone?: string) => {
    if (!tipo) {
      return true;
    }

    if (!['whatsapp', 'telefone'].includes(tipo)) {
      return true;
    }

    return Boolean(telefone && telefone.trim().length > 0);
  };

  const handleProximoPasso = () => {
    setErroFormulario(null);

    if (!canalSelecionadoId) {
      setErroFormulario('Selecione um canal de atendimento.');
      return;
    }

    if (!contatoSelecionado && !novoContato.nome.trim()) {
      setErroFormulario('Selecione um contato existente ou informe os dados de um novo contato.');
      return;
    }

    if (!validarTelefoneObrigatorio(canalSelecionado?.tipo, contatoSelecionado?.telefone || novoContato.telefone)) {
      setErroFormulario('Para o canal selecionado é obrigatório informar um número de telefone válido.');
      return;
    }

    setStep(2);
  };

  const handleConfirmar = () => {
    setErroFormulario(null);

    if (!canalSelecionado) {
      setErroFormulario('Selecione um canal de atendimento.');
      return;
    }

    const contatoBase = contatoSelecionado || {
      id: undefined,
      nome: novoContato.nome.trim(),
      telefone: novoContato.telefone.trim() || undefined,
      email: novoContato.email.trim() || undefined,
      clienteId: undefined,
      clienteNome: clienteVinculado || undefined
    };

    if (!contatoBase.nome) {
      setErroFormulario('Informe o nome do contato do atendimento.');
      return;
    }

    if (!validarTelefoneObrigatorio(canalSelecionado.tipo, contatoBase.telefone)) {
      setErroFormulario('Para o canal selecionado é obrigatório informar um número de telefone válido.');
      return;
    }

    const clienteIdNormalizado = contatoSelecionado?.clienteId ||
      (clienteVinculado && UUID_REGEX.test(clienteVinculado.trim()) ? clienteVinculado.trim() : undefined);

    const dados: NovoAtendimentoData = {
      canalId: canalSelecionado.id,
      canalTipo: canalSelecionado.tipo,
      canalNome: canalSelecionado.nome,
      origem: canalSelecionado.origem || mapOrigemByCanal(canalSelecionado.tipo),
      contatoId: contatoSelecionado?.id,
      contatoNome: contatoBase.nome,
      contatoTelefone: contatoBase.telefone,
      contatoEmail: contatoBase.email,
      clienteId: clienteIdNormalizado,
      assunto: assunto.trim(),
      descricao: descricao.trim(),
      prioridade,
      tags
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    setStep(1);
    setCanais([]);
    setCarregandoCanais(false);
    setErroCanais(null);
    setCanalSelecionadoId(null);
    setContatos([]);
    setCarregandoContatos(false);
    setErroContatos(null);
    setBuscaContato('');
    setContatoSelecionado(null);
    setNovoContato({ nome: '', telefone: '', email: '' });
    setClienteVinculado('');
    setAssunto('');
    setDescricao('');
    setPrioridade('media');
    setTags([]);
    setTagInput('');
    setErroFormulario(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Canal de Atendimento *
                </label>
                <div className="space-y-3">
                  {carregandoCanais ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando canais configurados...
                    </div>
                  ) : erroCanais ? (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4" />
                      {erroCanais}
                    </div>
                  ) : canais.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Nenhum canal disponível. Configure um canal em <strong>Configurações &gt; Atendimento</strong> para criar atendimentos.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {canais.map((canalOpcao) => {
                        const ativo = canalSelecionadoId === canalOpcao.id;
                        const cor = normalizarCorCanal(canalOpcao.tipo, currentPalette.colors.primary);
                        const Icone = canalOpcao.tipo === 'email'
                          ? Mail
                          : canalOpcao.tipo === 'telefone'
                            ? Phone
                            : MessageSquare;

                        return (
                          <button
                            key={canalOpcao.id}
                            type="button"
                            onClick={() => setCanalSelecionadoId(canalOpcao.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${ativo
                              ? 'border-current shadow-md scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                            style={{
                              borderColor: ativo ? cor : undefined,
                              backgroundColor: ativo ? `${cor}10` : undefined
                            }}
                          >
                            <Icone className="w-6 h-6" style={{ color: ativo ? cor : '#6B7280' }} />
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-medium text-gray-700">{canalOpcao.nome}</span>
                              <span className="text-[11px] text-gray-500">{canalOpcao.tipo.toUpperCase()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contato *</label>

                {!contatoSelecionado ? (
                  <>
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

                    {buscaContato && (
                      <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                        {carregandoContatos ? (
                          <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Buscando contatos...
                          </div>
                        ) : erroContatos ? (
                          <div className="px-4 py-3 text-sm text-amber-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {erroContatos}
                          </div>
                        ) : contatosFiltrados.length > 0 ? (
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
                                <p className="text-sm font-medium text-gray-900 truncate">{contato.nome}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {contato.telefone || 'Sem telefone cadastrado'}
                                  {contato.email ? ` • ${contato.email}` : ''}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Nenhum contato encontrado para "{buscaContato}". Utilize o formulário abaixo para cadastrar rapidamente.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Ou cadastre um novo contato:</p>
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
                              Telefone {canalSelecionado?.tipo && ['whatsapp', 'telefone'].includes(canalSelecionado.tipo) ? '*' : ''}
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
                              Email
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: currentPalette.colors.primary }}
                      >
                        {contatoSelecionado.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contatoSelecionado.nome}</p>
                        <p className="text-xs text-gray-500">
                          {contatoSelecionado.telefone || 'Sem telefone'} • {contatoSelecionado.email || 'Sem email'}
                        </p>
                        {contatoSelecionado.clienteNome && (
                          <p className="text-xs text-gray-500">Cliente: {contatoSelecionado.clienteNome}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setContatoSelecionado(null);
                        setNovoContato({ nome: '', telefone: '', email: '' });
                        setClienteVinculado('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Cliente/Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={clienteVinculado}
                  onChange={(e) => setClienteVinculado(e.target.value)}
                  placeholder="Digite o nome ou ID do cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Caso o contato já esteja vinculado a um cliente, o sistema aplicará o vínculo automaticamente.
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${prioridade === p.value
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (opcional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoverTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Digite e pressione Enter para adicionar"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarTag();
                      }
                    }}
                    style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarTag}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

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

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {canalSelecionado ? `Canal selecionado: ${canalSelecionado.nome}` : 'Nenhum canal selecionado'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFechar}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            {step === 1 ? (
              <button
                onClick={handleProximoPasso}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: currentPalette.colors.primary }}
                disabled={carregandoCanais || canais.length === 0}
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleConfirmar}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm"
                style={{ backgroundColor: currentPalette.colors.primary }}
              >
                Criar Atendimento
              </button>
            )}
          </div>
        </div>

        {erroFormulario && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              <AlertCircle className="w-4 h-4" />
              {erroFormulario}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
