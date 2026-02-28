import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Info,
  Shield,
  Users,
  Mail,
  MessageSquare,
  Database,
  Building2,
  Send,
  CheckCircle,
  XCircle,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';
import { LoadingSkeleton, PageHeader, SectionCard } from '../../components/layout-v2';
import {
  BackupSnapshotInfo,
  ConfiguracoesEmpresa,
  empresaConfigService,
} from '../../services/empresaConfigService';
import { empresaService, EmpresaResponse } from '../../services/empresaService';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { userHasPermission } from '../../config/menuConfig';
import { toastService } from '../../services/toastService';

const ConfiguracaoEmpresaPage: React.FC = () => {
  const { confirm } = useGlobalConfirmation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('geral');
  const [config, setConfig] = useState<ConfiguracoesEmpresa | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<ConfiguracoesEmpresa>>({});
  const [empresaData, setEmpresaData] = useState<Partial<EmpresaResponse>>({});
  const [testingSMTP, setTestingSMTP] = useState(false);
  const [smtpTestResult, setSMTPTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [executingBackup, setExecutingBackup] = useState(false);
  const [backupResult, setBackupResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [backupHistory, setBackupHistory] = useState<BackupSnapshotInfo[]>([]);
  const [showBackupHistory, setShowBackupHistory] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canUpdateConfig = userHasPermission(user, 'config.empresa.update');

  // 🔐 empresaId removido - backend pega do JWT automaticamente

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'usuarios', label: 'Usuários e Permissões', icon: Users },
    { id: 'email', label: 'Email/SMTP', icon: Mail },
    { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
    { id: 'backup', label: 'Backup e Dados', icon: Database },
  ];

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const empresaId = user?.empresa?.id;
    if (!empresaId) {
      setLoading(false);
      setError('Usuário não possui empresa associada');
      return;
    }

    void carregarConfig(empresaId);
  }, [authLoading, user?.empresa?.id]);

  const carregarConfig = async (empresaId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [configData, empresaInfo, snapshots] = await Promise.all([
        empresaConfigService.getConfig(),
        empresaService.obterEmpresaPorId(empresaId),
        empresaConfigService.getBackupHistory().catch(() => [] as BackupSnapshotInfo[]),
      ]);

      setConfig(configData);
      setFormData(configData);
      setEmpresa(empresaInfo);
      setEmpresaData(empresaInfo);
      setBackupHistory(snapshots);
    } catch (err: unknown) {
      console.error('Erro ao carregar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ConfiguracoesEmpresa, value: any) => {
    if (!canUpdateConfig) {
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleEmpresaInputChange = (field: keyof EmpresaResponse, value: any) => {
    if (!canUpdateConfig) {
      return;
    }
    setEmpresaData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canUpdateConfig) {
      setError('Você não possui permissão para atualizar as configurações da empresa.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 🔐 Pegar empresaId do usuário autenticado
      const empresaId = user?.empresa?.id;
      if (!empresaId) {
        throw new Error('Usuário não possui empresa associada');
      }

      console.log('Enviando configura??es da empresa (resumo):', {
        activeTab,
        hasLogo: Boolean(formData.logoUrl),
        emailsHabilitados: Boolean(formData.emailsHabilitados),
        smtpConfigurado: Boolean(formData.smtpUsuario && formData.smtpSenha),
        whatsappHabilitado: Boolean(formData.whatsappHabilitado),
        whatsappTokenConfigurado: Boolean(formData.whatsappApiToken),
        smsHabilitado: Boolean(formData.smsHabilitado),
        smsApiKeyConfigurada: Boolean(formData.smsApiKey),
        pushHabilitado: Boolean(formData.pushHabilitado),
        pushApiKeyConfigurada: Boolean(formData.pushApiKey),
      });

      const updatedConfig = await empresaConfigService.updateConfig(formData);
      setConfig(updatedConfig);
      setFormData(updatedConfig);

      const updatedEmpresa = await empresaService.atualizarEmpresa(empresaId, empresaData);
      setEmpresa(updatedEmpresa);
      setEmpresaData(updatedEmpresa);

      setHasChanges(false);
      toastService.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao salvar:', err);

      // Extrair mensagem de erro detalhada do backend
      const errorMessage = err?.response?.data?.message;
      const detailedError = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || err.message || 'Erro desconhecido ao salvar';

      setError(detailedError);
      toastService.error(`Erro ao salvar: ${detailedError}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canUpdateConfig) {
      setError('Você não possui permissão para restaurar as configurações.');
      return;
    }

    if (
      !(await confirm(
        'Tem certeza que deseja restaurar todas as configurações para os valores padrão?',
      ))
    )
      return;
    try {
      setSaving(true);
      setError(null);
      // 🔐 empresaId vem do JWT no backend
      const reset = await empresaConfigService.resetConfig();
      setConfig(reset);
      setFormData(reset);
      setHasChanges(false);
      toastService.success('Configurações restauradas!');
    } catch (err: unknown) {
      console.error('Erro ao resetar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao resetar');
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionar para max 500x500 mantendo proporção
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Erro ao processar imagem'));
            return;
          }

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para base64 com compressão (0.8 = 80% qualidade)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

          // Verificar tamanho final (base64 ~= 1.37x o tamanho em bytes)
          const sizeInBytes = (compressedBase64.length * 3) / 4;
          const sizeInKB = Math.round(sizeInBytes / 1024);

          console.log(`✅ Imagem comprimida: ${sizeInKB}KB (${width}x${height})`);

          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpdateConfig) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toastService.warning('Selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho original (max 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      toastService.warning('A imagem deve ter no máximo 10MB.');
      return;
    }

    setUploadingLogo(true);

    try {
      // Comprimir e redimensionar imagem
      const compressedBase64 = await compressImage(file);

      // Atualizar preview e form
      setLogoPreview(compressedBase64);
      handleInputChange('logoUrl', compressedBase64);

      // Feedback visual
      const sizeInKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
      console.log(`✅ Logo processada com sucesso: ${sizeInKB}KB`);
    } catch (err) {
      console.error('Erro ao fazer upload da logo:', err);
      toastService.error('Erro ao processar a imagem. Tente novamente ou escolha outra imagem.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    if (!canUpdateConfig) {
      return;
    }

    setLogoPreview(null);
    handleInputChange('logoUrl', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestSMTP = async () => {
    if (!canUpdateConfig) {
      return;
    }

    setTestingSMTP(true);
    setSMTPTestResult(null);

    try {
      const response = await empresaConfigService.testSMTP({
        servidorSMTP: formData.servidorSMTP,
        portaSMTP: formData.portaSMTP,
        smtpUsuario: formData.smtpUsuario,
        smtpSenha: formData.smtpSenha,
      });
      setSMTPTestResult(response);
    } catch (err: any) {
      console.error('Erro ao testar SMTP:', err);
      setSMTPTestResult({
        success: false,
        message:
          err?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Erro ao testar conexão SMTP'),
      });
    } finally {
      setTestingSMTP(false);
    }
  };

  const handleExecutarBackup = async () => {
    if (!canUpdateConfig) {
      return;
    }

    setExecutingBackup(true);
    setBackupResult(null);

    try {
      const result = await empresaConfigService.executeBackup();
      setBackupResult({ success: result.success, message: result.message });

      const history = await empresaConfigService.getBackupHistory();
      setBackupHistory(history);
      setShowBackupHistory(history.length > 0);
    } catch (err: any) {
      console.error('Erro ao executar backup:', err);
      setBackupResult({
        success: false,
        message:
          err?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Erro ao executar backup'),
      });
    } finally {
      setExecutingBackup(false);
    }
  };

  const handleVerHistoricoBackups = async () => {
    try {
      const latestHistory = await empresaConfigService.getBackupHistory();
      setBackupHistory(latestHistory);

      if (latestHistory.length === 0) {
        toastService.info('Nenhum backup disponível para esta empresa.');
        setShowBackupHistory(false);
        return;
      }

      toastService.info(`Histórico atualizado: ${latestHistory.length} backup${latestHistory.length > 1 ? 's' : ''}.`);
      setShowBackupHistory(true);
    } catch (err) {
      console.error('Erro ao carregar histórico de backups:', err);
      toastService.error('Não foi possível carregar o histórico de backups.');
      setShowBackupHistory(false);
    }
  };

  const ultimoBackup = backupHistory[0];
  const ultimoBackupDescricao = ultimoBackup
    ? `${new Date(ultimoBackup.generatedAt).toLocaleString('pt-BR')} - ${Math.max(
        1,
        Math.round(ultimoBackup.sizeBytes / 1024),
      )} KB`
    : 'Nenhum backup executado ainda.';

  const ultimoBackupIcon = ultimoBackup ? (
    <CheckCircle className="h-6 w-6 text-[#159A9C]" />
  ) : (
    <Info className="h-6 w-6 text-gray-500" />
  );

  const canUploadLogo = canUpdateConfig && !uploadingLogo;

  if (loading || authLoading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 pt-1 sm:pt-2">
      <SectionCard className="p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-3">
              <Settings className="h-7 w-7 text-[#159A9C]" />
              <span>Configurações da Empresa</span>
            </span>
          }
          description="Gerencie todas as configurações do sistema"
          actions={
            hasChanges ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <Info className="h-4 w-4 mr-1" />
                Alterações pendentes
              </span>
            ) : null
          }
        />
      </SectionCard>

      {error && (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {!canUpdateConfig && (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Você possui acesso somente leitura para as configurações da empresa.
        </div>
      )}

      <SectionCard className="overflow-hidden">
        <div className="border-b px-6 py-3">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-[#159A9C] border-b-2 border-[#159A9C]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
              {activeTab === 'geral' && (
                <div className="space-y-8">
                  {/* Seção 1: Informações da Empresa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <Building2 className="h-5 w-5 text-[#159A9C]" />
                      <h3 className="text-lg font-semibold text-[#002333]">
                        Informações da Empresa
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Empresa
                        </label>
                        <input
                          type="text"
                          value={empresaData.nome || ''}
                          onChange={(e) => handleEmpresaInputChange('nome', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Razão Social"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                        <input
                          type="text"
                          value={empresaData.cnpj || ''}
                          onChange={(e) => handleEmpresaInputChange('cnpj', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: 00.000.000/0000-00</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Principal
                        </label>
                        <input
                          type="email"
                          value={empresaData.email || ''}
                          onChange={(e) => handleEmpresaInputChange('email', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="contato@empresa.com.br"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={empresaData.telefone || ''}
                          onChange={(e) => handleEmpresaInputChange('telefone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: (00) 00000-0000</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endereço Completo
                        </label>
                        <input
                          type="text"
                          value={empresaData.endereco || ''}
                          onChange={(e) => handleEmpresaInputChange('endereco', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Rua, Número, Complemento, Bairro"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={empresaData.cidade || ''}
                          onChange={(e) => handleEmpresaInputChange('cidade', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Nome da cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado (UF)
                        </label>
                        <select
                          value={empresaData.estado || ''}
                          onChange={(e) => handleEmpresaInputChange('estado', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        >
                          <option value="">Selecione...</option>
                          <option value="AC">Acre</option>
                          <option value="AL">Alagoas</option>
                          <option value="AP">Amapá</option>
                          <option value="AM">Amazonas</option>
                          <option value="BA">Bahia</option>
                          <option value="CE">Ceará</option>
                          <option value="DF">Distrito Federal</option>
                          <option value="ES">Espírito Santo</option>
                          <option value="GO">Goiás</option>
                          <option value="MA">Maranhão</option>
                          <option value="MT">Mato Grosso</option>
                          <option value="MS">Mato Grosso do Sul</option>
                          <option value="MG">Minas Gerais</option>
                          <option value="PA">Pará</option>
                          <option value="PB">Paraíba</option>
                          <option value="PR">Paraná</option>
                          <option value="PE">Pernambuco</option>
                          <option value="PI">Piauí</option>
                          <option value="RJ">Rio de Janeiro</option>
                          <option value="RN">Rio Grande do Norte</option>
                          <option value="RS">Rio Grande do Sul</option>
                          <option value="RO">Rondônia</option>
                          <option value="RR">Roraima</option>
                          <option value="SC">Santa Catarina</option>
                          <option value="SP">São Paulo</option>
                          <option value="SE">Sergipe</option>
                          <option value="TO">Tocantins</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                        <input
                          type="text"
                          value={empresaData.cep || ''}
                          onChange={(e) => handleEmpresaInputChange('cep', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        <p className="text-xs text-gray-500 mt-1">Formato: 00000-000</p>
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Identidade Visual */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <Settings className="h-5 w-5 text-[#159A9C]" />
                      <h3 className="text-lg font-semibold text-[#002333]">Identidade Visual</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={formData.descricao || ''}
                          onChange={(e) => handleInputChange('descricao', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Breve descrição sobre a empresa"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                        <input
                          type="url"
                          value={formData.site || ''}
                          onChange={(e) => handleInputChange('site', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="https://exemplo.com.br"
                        />
                      </div>

                      {/* Upload de Logo */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Logo da Empresa
                        </label>
                        <div className="flex items-start gap-6">
                          {/* Preview da Logo */}
                          <div className="flex-shrink-0">
                            {logoPreview || formData.logoUrl ? (
                              <div className="relative group">
                                <div className="w-32 h-32 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center overflow-hidden shadow-sm">
                                  <img
                                    src={logoPreview || formData.logoUrl || ''}
                                    alt="Logo da empresa"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <button
                                  onClick={handleRemoveLogo}
                                  disabled={!canUpdateConfig}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                  title="Remover logo"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Upload Area */}
                          <div className="flex-1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={!canUploadLogo}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor={canUploadLogo ? 'logo-upload' : undefined}
                              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                                canUploadLogo
                                  ? 'bg-[#159A9C] text-white hover:bg-[#0F7B7D] cursor-pointer'
                                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingLogo ? 'Enviando...' : 'Fazer Upload'}
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              • Formatos aceitos: JPG, PNG, SVG
                              <br />
                              • Tamanho máximo: 10MB (será otimizada automaticamente)
                              <br />
                              • Recomendado: Imagens quadradas (1:1)
                              <br />• A imagem será redimensionada para 500x500px mantendo a
                              proporção
                            </p>
                            <div className="mt-3 p-3 bg-[#DEEFE7] rounded-lg border border-[#B4BEC9]">
                              <p className="text-xs text-[#002333]">
                                <Info className="h-3 w-3 inline mr-1" />
                                Esta logo aparecerá em propostas, relatórios e no portal do cliente.
                                A compressão automática garante carregamento rápido.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Primária
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.corPrimaria || '#159A9C'}
                            onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                            className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.corPrimaria || '#159A9C'}
                              onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] font-mono text-sm"
                              placeholder="#159A9C"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                          </div>
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: formData.corPrimaria || '#159A9C' }}
                            title="Preview da cor"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Cor principal usada em botões e destaques
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cor Secundária
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={formData.corSecundaria || '#002333'}
                            onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                            className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={formData.corSecundaria || '#002333'}
                              onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] font-mono text-sm"
                              placeholder="#002333"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                          </div>
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: formData.corSecundaria || '#002333' }}
                            title="Preview da cor"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Cor usada em textos e elementos secundários
                        </p>
                      </div>

                      {/* Preview de Branding */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Preview do Branding
                        </label>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
                          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                            {/* Cabeçalho com logo */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                              {logoPreview || formData.logoUrl ? (
                                <div className="h-12 flex items-center">
                                  <img
                                    src={logoPreview || formData.logoUrl || ''}
                                    alt="Logo preview"
                                    className="max-h-12 w-auto object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="h-12 w-24 bg-gray-200 rounded flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <span className="text-xs text-gray-500 font-medium">Preview</span>
                            </div>

                            {/* Exemplo de botão com cor primária */}
                            <button
                              className="w-full px-4 py-2.5 text-white rounded-lg font-medium mb-3 transition-opacity hover:opacity-90 shadow-sm"
                              style={{ backgroundColor: formData.corPrimaria || '#159A9C' }}
                              disabled
                            >
                              Botão Primário
                            </button>

                            {/* Exemplo de texto com cor secundária */}
                            <p
                              className="text-base font-semibold mb-2"
                              style={{ color: formData.corSecundaria || '#002333' }}
                            >
                              Título de Exemplo
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              Esta é uma prévia de como as cores personalizadas e a logo da sua
                              empresa aparecerão em propostas comerciais, relatórios e documentos
                              oficiais.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Segurança */}
              {activeTab === 'seguranca' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-[#002333] mb-4">
                    Configurações de Segurança
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2FA */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Autenticação 2FA
                        </label>
                        <p className="text-xs text-gray-500">Exigir segundo fator para login</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.autenticacao2FA || false}
                        onChange={(e) => handleInputChange('autenticacao2FA', e.target.checked)}
                        className="h-5 w-5 text-[#159A9C] focus:ring-[#159A9C] rounded"
                      />
                    </div>

                    {/* Sessão Expiração */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de Sessão (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={formData.sessaoExpiracaoMinutos || 30}
                        onChange={(e) =>
                          handleInputChange('sessaoExpiracaoMinutos', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Entre 5 e 480 minutos (8 horas)</p>
                    </div>

                    {/* Complexidade Senha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complexidade de Senha
                      </label>
                      <select
                        value={formData.senhaComplexidade || 'media'}
                        onChange={(e) => handleInputChange('senhaComplexidade', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      >
                        <option value="baixa">Baixa (mínimo 6 caracteres)</option>
                        <option value="media">Média (8 caracteres + números)</option>
                        <option value="alta">Alta (12 caracteres + números + símbolos)</option>
                      </select>
                    </div>

                    {/* Auditoria */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Logs de Auditoria
                        </label>
                        <p className="text-xs text-gray-500">Registrar ações dos usuários</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.auditoria !== false}
                        onChange={(e) => handleInputChange('auditoria', e.target.checked)}
                        className="h-5 w-5 text-[#159A9C] focus:ring-[#159A9C] rounded"
                      />
                    </div>

                    {/* Force SSL */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Forçar HTTPS
                        </label>
                        <p className="text-xs text-gray-500">Redirecionar HTTP para HTTPS</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.forceSsl !== false}
                        onChange={(e) => handleInputChange('forceSsl', e.target.checked)}
                        className="h-5 w-5 text-[#159A9C] focus:ring-[#159A9C] rounded"
                      />
                    </div>

                    {/* IP Whitelist */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IPs Permitidos (Whitelist)
                      </label>
                      <textarea
                        value={formData.ipWhitelist?.join('\n') || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'ipWhitelist',
                            e.target.value.split('\n').filter((ip) => ip.trim()),
                          )
                        }
                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Um IP por linha. Deixe vazio para permitir todos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <Users className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Usuários e Permissões
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Limite de Usuários */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Limite de Usuários
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.limiteUsuarios || 10}
                        onChange={(e) =>
                          handleInputChange('limiteUsuarios', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Número máximo de usuários ativos na empresa (1-1000)
                      </p>
                    </div>

                    {/* Aprovação de Novos Usuários */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Aprovação de Novos Usuários
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Exigir aprovação manual para novos cadastros
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.aprovacaoNovoUsuario || false}
                        onChange={(e) =>
                          handleInputChange('aprovacaoNovoUsuario', e.target.checked)
                        }
                        className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                      />
                    </div>

                    {/* Expiração de Convites */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Validade do Convite (horas)
                      </label>
                      <input
                        type="number"
                        min="24"
                        max="168"
                        value={formData.conviteExpiracaoHoras || 72}
                        onChange={(e) =>
                          handleInputChange('conviteExpiracaoHoras', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tempo até o convite de cadastro expirar (24-168 horas = 1-7 dias)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alçada de Aprovação Financeira (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.alcadaAprovacaoFinanceira ?? 0}
                        onChange={(e) =>
                          handleInputChange(
                            'alcadaAprovacaoFinanceira',
                            Number(e.target.value || 0),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contas a pagar com valor total igual ou acima deste valor exigem aprovação.
                        Use 0 para desativar a regra automática.
                      </p>
                    </div>

                    {/* Card Informativo */}
                    <div className="flex items-start gap-3 p-4 bg-[#DEEFE7] rounded-lg border border-[#B4BEC9]">
                      <Info className="h-5 w-5 text-[#159A9C] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#002333]">Gestão de Permissões</p>
                        <p className="text-xs text-[#002333] mt-1">
                          Configure perfis e permissões detalhadas na seção "Gestão de Usuários" do
                          menu Administração.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <Mail className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Email / SMTP
                  </h2>

                  {/* Toggle Principal */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Habilitar Envio de Emails
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Ative para permitir que o sistema envie emails automaticamente
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.emailsHabilitados || false}
                      onChange={(e) => {
                        handleInputChange('emailsHabilitados', e.target.checked);
                        if (!e.target.checked) {
                          setSMTPTestResult(null);
                        }
                      }}
                      className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                    />
                  </div>

                  {/* Campos SMTP (mostrar apenas se habilitado) */}
                  {formData.emailsHabilitados && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Servidor SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Servidor SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.servidorSMTP || ''}
                            onChange={(e) => handleInputChange('servidorSMTP', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Endereço do servidor SMTP</p>
                        </div>

                        {/* Porta SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Porta SMTP
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="65535"
                            value={formData.portaSMTP || 587}
                            onChange={(e) =>
                              handleInputChange('portaSMTP', parseInt(e.target.value))
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Porta padrão: 587 (TLS) ou 465 (SSL)
                          </p>
                        </div>

                        {/* Usuário SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuário SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={formData.smtpUsuario || ''}
                            onChange={(e) => handleInputChange('smtpUsuario', e.target.value)}
                            placeholder="seu-email@empresa.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Email usado para autenticação
                          </p>
                        </div>

                        {/* Senha SMTP */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha SMTP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formData.smtpSenha || ''}
                            onChange={(e) => handleInputChange('smtpSenha', e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                          />
                          <p className="text-xs text-gray-500 mt-1">Senha ou token de aplicativo</p>
                        </div>
                      </div>

                      {/* Botão Testar Conexão */}
                      <div className="border-t pt-6">
                        <button
                          onClick={handleTestSMTP}
                          disabled={
                            !canUpdateConfig ||
                            testingSMTP ||
                            !formData.servidorSMTP ||
                            !formData.smtpUsuario ||
                            !formData.smtpSenha
                          }
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-4 w-4" />
                          {testingSMTP ? 'Testando Conexão...' : 'Testar Conexão SMTP'}
                        </button>

                        {/* Resultado do Teste */}
                        {smtpTestResult && (
                          <div
                            className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                              smtpTestResult.success
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            {smtpTestResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  smtpTestResult.success ? 'text-green-900' : 'text-red-900'
                                }`}
                              >
                                {smtpTestResult.success ? 'Teste Bem-Sucedido' : 'Falha no Teste'}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  smtpTestResult.success ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {smtpTestResult.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Informativo */}
                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">Configuração Gmail</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Para Gmail, use <strong>smtp.gmail.com</strong> porta{' '}
                            <strong>587</strong> e gere uma
                            <a
                              href="https://myaccount.google.com/apppasswords"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline ml-1 hover:text-amber-800"
                            >
                              senha de aplicativo
                            </a>
                            .
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'comunicacao' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Comunicação
                  </h2>

                  {/* SEÇÃO 1: WhatsApp */}
                  <div className="border-l-4 border-[#159A9C] pl-6 py-4 bg-[#DEEFE7]/30">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                      WhatsApp Business API
                    </h3>

                    <div className="space-y-4">
                      {/* Toggle WhatsApp */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Habilitar WhatsApp
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Ative para enviar mensagens via WhatsApp Business API
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.whatsappHabilitado || false}
                          onChange={(e) =>
                            handleInputChange('whatsappHabilitado', e.target.checked)
                          }
                          className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                        />
                      </div>

                      {formData.whatsappHabilitado && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número WhatsApp <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={formData.whatsappNumero || ''}
                              onChange={(e) => handleInputChange('whatsappNumero', e.target.value)}
                              placeholder="+55 11 98765-4321"
                              maxLength={20}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Token API WhatsApp <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={formData.whatsappApiToken || ''}
                              onChange={(e) =>
                                handleInputChange('whatsappApiToken', e.target.value)
                              }
                              placeholder="••••••••••••••••••••••••••••"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Token de acesso da Meta Business API
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO 2: SMS */}
                  <div className="border-l-4 border-[#159A9C] pl-6 py-4 bg-[#DEEFE7]/30">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                      SMS
                    </h3>

                    <div className="space-y-4">
                      {/* Toggle SMS */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Habilitar SMS
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Ative para enviar mensagens via SMS
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.smsHabilitado || false}
                          onChange={(e) => handleInputChange('smsHabilitado', e.target.checked)}
                          className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                        />
                      </div>

                      {formData.smsHabilitado && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Provedor SMS <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.smsProvider || 'twilio'}
                              onChange={(e) => handleInputChange('smsProvider', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            >
                              <option value="twilio">Twilio</option>
                              <option value="nexmo">Nexmo (Vonage)</option>
                              <option value="sinch">Sinch</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chave API SMS <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={formData.smsApiKey || ''}
                              onChange={(e) => handleInputChange('smsApiKey', e.target.value)}
                              placeholder="••••••••••••••••••••••••••••"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Chave de autenticação do provedor selecionado
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO 3: Push Notifications */}
                  <div className="border-l-4 border-[#159A9C] pl-6 py-4 bg-[#DEEFE7]/30">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#159A9C]" />
                      Push Notifications
                    </h3>

                    <div className="space-y-4">
                      {/* Toggle Push */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Habilitar Push Notifications
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Ative para enviar notificações push para dispositivos móveis
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.pushHabilitado || false}
                          onChange={(e) => handleInputChange('pushHabilitado', e.target.checked)}
                          className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                        />
                      </div>

                      {formData.pushHabilitado && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Provedor Push <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.pushProvider || 'fcm'}
                              onChange={(e) => handleInputChange('pushProvider', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            >
                              <option value="fcm">Firebase Cloud Messaging (FCM)</option>
                              <option value="apns">Apple Push Notification (APNS)</option>
                              <option value="onesignal">OneSignal</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chave API Push <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              value={formData.pushApiKey || ''}
                              onChange={(e) => handleInputChange('pushApiKey', e.target.value)}
                              placeholder="••••••••••••••••••••••••••••"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Chave de servidor ou token de autenticação
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Informativo Geral */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Integração Multi-Canal</p>
                      <p className="text-xs text-gray-700 mt-1">
                        Configure múltiplos canais de comunicação para aumentar o alcance. Você pode
                        ativar todos simultaneamente e o sistema escolherá o melhor canal
                        automaticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-2">
                    <Database className="h-6 w-6 text-[#159A9C]" />
                    Configurações de Backup e Dados
                  </h2>

                  {/* Status do Último Backup */}
                  <div className="p-4 bg-[#DEEFE7] rounded-lg border border-[#B4BEC9]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#002333]">Último Backup</p>
                        <p className="text-xs text-[#002333] mt-1">{ultimoBackupDescricao}</p>
                      </div>
                      {ultimoBackupIcon}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Automático */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Backup Automático
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Executar backup automaticamente
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.backupAutomatico || false}
                        onChange={(e) => handleInputChange('backupAutomatico', e.target.checked)}
                        className="h-5 w-5 text-[#159A9C] rounded focus:ring-[#159A9C] cursor-pointer"
                      />
                    </div>

                    {/* Frequência do Backup */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequência do Backup
                      </label>
                      <select
                        value={formData.backupFrequencia || 'diario'}
                        onChange={(e) => handleInputChange('backupFrequencia', e.target.value)}
                        disabled={!formData.backupAutomatico}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="diario">Diário (todo dia às 02:00)</option>
                        <option value="semanal">Semanal (domingos às 02:00)</option>
                        <option value="mensal">Mensal (dia 1 às 02:00)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Horário automático em fuso GMT-3 (Brasília)
                      </p>
                    </div>

                    {/* Retenção de Backups */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Período de Retenção (dias)
                      </label>
                      <input
                        type="number"
                        min="7"
                        max="365"
                        value={formData.backupRetencaoDias || 30}
                        onChange={(e) =>
                          handleInputChange('backupRetencaoDias', parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Backups mais antigos que este período serão removidos automaticamente (7-365
                        dias)
                      </p>
                    </div>
                  </div>

                  {/* Ações de Backup */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleExecutarBackup}
                        disabled={executingBackup || !canUpdateConfig}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Database className="h-4 w-4" />
                        {executingBackup ? 'Executando Backup...' : 'Executar Backup Agora'}
                      </button>

                      <button
                        onClick={handleVerHistoricoBackups}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Info className="h-4 w-4" />
                        Ver Histórico
                      </button>
                    </div>

                    {/* Resultado do Backup */}
                    {backupResult && (
                      <div
                        className={`p-4 rounded-lg flex items-start gap-3 ${
                          backupResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        {backupResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              backupResult.success ? 'text-green-900' : 'text-red-900'
                            }`}
                          >
                            {backupResult.success ? 'Backup Concluído' : 'Falha no Backup'}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              backupResult.success ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {backupResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {showBackupHistory && backupHistory.length > 0 && (
                      <div className="rounded-lg border border-[#B4BEC9] bg-white">
                        <div className="border-b border-[#DCE6EA] px-4 py-3">
                          <p className="text-sm font-medium text-[#002333]">Histórico de Backups</p>
                          <p className="text-xs text-gray-500 mt-1">Exibindo os 10 mais recentes.</p>
                        </div>
                        <ul className="divide-y divide-[#EEF3F5]">
                          {backupHistory.slice(0, 10).map((item) => (
                            <li
                              key={`${item.fileName}-${item.generatedAt}`}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#002333] truncate">
                                  {item.fileName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(item.generatedAt).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-[#355061] whitespace-nowrap">
                                {Math.max(1, Math.round(item.sizeBytes / 1024))} KB
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Cards Informativos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Backup Seguro</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Todos os backups são criptografados e armazenados em infraestrutura
                          redundante.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Recuperação Rápida</p>
                        <p className="text-xs text-green-700 mt-1">
                          Em caso de necessidade, entre em contato com suporte para restaurar um
                          backup.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'geral' &&
                activeTab !== 'seguranca' &&
                activeTab !== 'usuarios' &&
                activeTab !== 'email' &&
                activeTab !== 'comunicacao' &&
                activeTab !== 'backup' && (
                  <div className="text-center py-12 text-gray-500">
                    <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aba "{tabs.find((t) => t.id === activeTab)?.label}" em desenvolvimento</p>
                  </div>
                )}
            </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10">
        <SectionCard className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              onClick={handleReset}
              disabled={saving || !canUpdateConfig}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrões
            </button>
            <button
              onClick={handleSave}
              disabled={!canUpdateConfig || !hasChanges || saving}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default ConfiguracaoEmpresaPage;

