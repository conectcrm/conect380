import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  UserPlus,
  Mail,
  Phone,
  X,
  Circle,
  Copy,
  KeyRound,
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { KPICard } from '../../../components/common/KPICard';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import atendenteService, {
  Atendente,
  CreateAtendenteDto,
  StatusAtendente,
} from '../../../services/atendenteService';
import { toastService } from '../../../services/toastService';
import { getErrorMessage } from '../../../utils/errorHandling';

const formatTelefone = (valor: string): string => {
  const numeros = valor.replace(/\D/g, '').slice(0, 11);

  if (numeros.length === 0) {
    return '';
  }

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
};

interface GestaoAtendentesPageProps {
  hideBackButton?: boolean;
}

const GestaoAtendentesPage: React.FC<GestaoAtendentesPageProps> = ({ hideBackButton = false }) => {
  const { confirm } = useGlobalConfirmation();
  // Estados principais
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [editingAtendente, setEditingAtendente] = useState<Atendente | null>(null);

  // ✅ NOVO: Modal de senha temporária
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [atendenteNome, setAtendenteNome] = useState<string>('');

  // Estados de validação
  const [validationErrors, setValidationErrors] = useState<{
    nome?: string;
    email?: string;
    telefone?: string;
  }>({});

  // Form state
  const [formData, setFormData] = useState<CreateAtendenteDto>({
    nome: '',
    email: '',
    telefone: '',
    ativo: true,
  });

  useEffect(() => {
    carregarAtendentes();
  }, []);

  const carregarAtendentes = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const dados = await atendenteService.listar();
      setAtendentes(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar atendentes:', err);
      setError(getErrorMessage(err, 'Erro ao carregar atendentes'));
      setAtendentes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (atendente?: Atendente): void => {
    if (atendente) {
      setEditingAtendente(atendente);
      setFormData({
        nome: atendente.nome ?? '',
        email: atendente.email ?? '',
        telefone: atendente.telefone ?? '',
        ativo: atendente.ativo ?? true,
      });
    } else {
      setEditingAtendente(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        ativo: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = (): void => {
    setShowDialog(false);
    setEditingAtendente(null);
    setValidationErrors({});
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      ativo: true,
    });
  };

  const validateForm = (): boolean => {
    const errors: { nome?: string; email?: string; telefone?: string } = {};

    // Validar nome
    if (!formData.nome || formData.nome.trim().length < 3) {
      errors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Email inválido';
    } else {
      // Verificar se email já existe (apenas para novo cadastro)
      const emailExiste = atendentes.some(
        (a) =>
          a.email.toLowerCase() === formData.email.toLowerCase() && a.id !== editingAtendente?.id,
      );
      if (emailExiste) {
        errors.email = 'Este email já está cadastrado';
      }
    }

    // Validar telefone (opcional, mas se preenchido deve estar completo)
    if (formData.telefone) {
      const telefoneLimpo = formData.telefone.replace(/\D/g, '');
      if (telefoneLimpo.length > 0 && telefoneLimpo.length < 10) {
        errors.telefone = 'Telefone incompleto';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      toastService.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setError(null);

      if (editingAtendente) {
        await atendenteService.atualizar(editingAtendente.id, formData);
        toastService.success('Atendente atualizado com sucesso!');
      } else {
        const response = await atendenteService.criar(formData);

        if (response.senhaTemporaria) {
          setSenhaTemporaria(response.senhaTemporaria);
          setAtendenteNome(formData.nome);
          setShowSenhaModal(true);
        }

        toastService.success('Atendente cadastrado com sucesso!');
      }

      await carregarAtendentes();
      handleCloseDialog();
    } catch (err: unknown) {
      console.error('Erro ao salvar atendente:', err);
      const errorMsg = getErrorMessage(err, 'Erro ao salvar atendente');
      setError(errorMsg);
      toastService.error(errorMsg);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    const confirmed = await confirm('Deseja realmente desativar este atendente?');
    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await atendenteService.deletar(id);
      toastService.success('Atendente desativado com sucesso!');
      await carregarAtendentes();
    } catch (err: unknown) {
      console.error('Erro ao deletar atendente:', err);
      const errorMsg = getErrorMessage(err, 'Erro ao deletar atendente');
      setError(errorMsg);
      toastService.error(errorMsg);
    }
  };

  // Filtro de busca
  const atendentesFiltrados = atendentes.filter(
    (atendente) =>
      atendente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      atendente.email.toLowerCase().includes(busca.toLowerCase()),
  );

  // Dashboard cards
  const atendentesAtivos = atendentes.filter((a) => a.ativo).length;
  const atendentesOnline = atendentes.filter((a) => a.status === StatusAtendente.ONLINE).length;
  const atendentesOcupados = atendentes.filter((a) => a.status === StatusAtendente.OCUPADO).length;

  const getStatusBadge = (status: StatusAtendente): React.ReactNode => {
    const badges = {
      [StatusAtendente.ONLINE]: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Circle className="h-2 w-2 mr-1 fill-current" />
          Online
        </span>
      ),
      [StatusAtendente.OCUPADO]: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Circle className="h-2 w-2 mr-1 fill-current" />
          Ocupado
        </span>
      ),
      [StatusAtendente.AUSENTE]: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Circle className="h-2 w-2 mr-1 fill-current" />
          Ausente
        </span>
      ),
      [StatusAtendente.OFFLINE]: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Circle className="h-2 w-2 mr-1 fill-current" />
          Offline
        </span>
      ),
    };

    return badges[status] || badges[StatusAtendente.OFFLINE];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header com navegação */}
      {!hideBackButton && (
        <div className="bg-white border-b px-6 py-4 -mx-6 -mt-6 mb-6">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
        </div>
      )}

      {/* Dashboard Cards - Tema Crevasse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard titulo="Total" valor={atendentes.length} icone={Users} color="crevasse" />

        <KPICard titulo="Online" valor={atendentesOnline} icone={CheckCircle} color="crevasse" />

        <KPICard
          titulo="Ocupados"
          valor={atendentesOcupados}
          icone={AlertCircle}
          color="crevasse"
        />

        <KPICard titulo="Ativos" valor={atendentesAtivos} icone={UserPlus} color="crevasse" />
      </div>

      {/* Barra de Busca e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar atendentes..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={carregarAtendentes}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Atualizar atendentes"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Atendente
            </button>
          </div>
        </div>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Erro</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de Atendentes */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando atendentes...</p>
        </div>
      ) : atendentesFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {busca ? 'Nenhum atendente encontrado' : 'Nenhum atendente cadastrado'}
          </h3>
          <p className="text-gray-600 mb-6">
            {busca
              ? 'Tente buscar com outros termos.'
              : 'Comece cadastrando seu primeiro atendente.'}
          </p>
          {!busca && (
            <button
              onClick={() => handleOpenDialog()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar Primeiro Atendente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atendentesFiltrados.map((atendente) => (
            <div
              key={atendente.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Avatar e Status */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-[#159A9C]/10 flex items-center justify-center text-[#159A9C] text-xl font-bold border-2 border-[#159A9C]/20">
                      {atendente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${atendente.status === StatusAtendente.ONLINE
                          ? 'bg-green-500'
                          : atendente.status === StatusAtendente.OCUPADO
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {atendente.nome}
                    </h3>
                    <div className="mt-1">{getStatusBadge(atendente.status)}</div>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{atendente.email}</span>
                  </div>
                  {atendente.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{atendente.telefone}</span>
                    </div>
                  )}
                </div>

                {/* Badge Ativo/Inativo */}
                <div className="mb-4">
                  {atendente.ativo ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inativo
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleOpenDialog(atendente)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(atendente.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAtendente ? 'Editar Atendente' : 'Novo Atendente'}
              </h2>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (validationErrors.nome) {
                      setValidationErrors({ ...validationErrors, nome: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${validationErrors.nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Ex: João da Silva"
                />
                {validationErrors.nome && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="joao@exemplo.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={formData.telefone}
                  onChange={(e) => {
                    const telefoneFormatado = formatTelefone(e.target.value);
                    setFormData({ ...formData, telefone: telefoneFormatado });
                    if (validationErrors.telefone) {
                      setValidationErrors({ ...validationErrors, telefone: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${validationErrors.telefone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="(00) 00000-0000"
                />
                {validationErrors.telefone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.telefone}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Atendente ativo
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  {editingAtendente ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL SENHA TEMPORÁRIA */}
      {showSenhaModal && senhaTemporaria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#002333] mb-2">Atendente Criado!</h3>
              <p className="text-gray-600 mb-4">
                <strong>{atendenteNome}</strong> foi cadastrado com sucesso.
              </p>
            </div>

            {/* Senha temporária */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
              <div className="flex items-start mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 text-sm">
                    ⚠️ Senha Temporária Gerada
                  </h4>
                  <p className="text-xs text-yellow-800 mt-1">
                    Esta senha só será exibida uma vez. Copie e envie ao atendente.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200 mt-3">
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-mono font-bold text-[#002333] tracking-wider">
                    {senhaTemporaria}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(senhaTemporaria);
                      toastService.success('Senha copiada!');
                    }}
                    className="ml-4 p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Copiar senha"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">📋 Próximos passos:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copie a senha acima</li>
                <li>Envie para o atendente (email/WhatsApp)</li>
                <li>No primeiro login, ele será solicitado a trocar a senha</li>
                <li>Após trocar a senha, terá acesso normal ao sistema</li>
              </ol>
            </div>

            {/* Botão fechar */}
            <button
              onClick={() => {
                setShowSenhaModal(false);
                setSenhaTemporaria(null);
                setAtendenteNome('');
              }}
              className="w-full bg-[#159A9C] text-white py-3 rounded-lg font-semibold hover:bg-[#0F7B7D] transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoAtendentesPage;
