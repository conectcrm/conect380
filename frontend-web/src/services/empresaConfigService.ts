import api from './api';

/**
 * Enum para nível de complexidade de senha
 */
export enum SenhaComplexidadeEnum {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
}

/**
 * Enum para frequência de backup
 */
export enum BackupFrequenciaEnum {
  DIARIO = 'diario',
  SEMANAL = 'semanal',
  MENSAL = 'mensal',
}

/**
 * Enum para provedores de SMS
 */
export enum SmsProviderEnum {
  TWILIO = 'twilio',
  NEXMO = 'nexmo',
  SINCH = 'sinch',
}

/**
 * Enum para provedores de Push Notification
 */
export enum PushProviderEnum {
  FCM = 'fcm',
  APNS = 'apns',
  ONESIGNAL = 'onesignal',
}

/**
 * Interface para configurações de empresa
 */
export interface ConfiguracoesEmpresa {
  id: string;
  empresaId: string;

  // Geral
  descricao?: string | null;
  site?: string | null;
  logoUrl?: string | null;
  corPrimaria: string; // Default: #159A9C
  corSecundaria: string; // Default: #002333

  // Segurança
  autenticacao2FA: boolean; // Default: false
  sessaoExpiracaoMinutos: number; // Default: 30 (range: 5-480)
  senhaComplexidade: SenhaComplexidadeEnum; // Default: media
  auditoria: boolean; // Default: true
  forceSsl: boolean; // Default: true
  ipWhitelist?: string[] | null; // Lista de IPs permitidos

  // Usuários
  limiteUsuarios: number; // Default: 10 (range: 1-1000)
  aprovacaoNovoUsuario: boolean; // Default: false
  conviteExpiracaoHoras: number; // Default: 48 (range: 24-168)

  // Email/SMTP
  emailsHabilitados: boolean; // Default: true
  servidorSMTP?: string | null;
  portaSMTP: number; // Default: 587
  smtpUsuario?: string | null;
  smtpSenha?: string | null;

  // Comunicação (WhatsApp, SMS, Push)
  whatsappHabilitado: boolean; // Default: false
  whatsappNumero?: string | null;
  whatsappApiToken?: string | null;
  smsHabilitado: boolean; // Default: false
  smsProvider?: SmsProviderEnum | null;
  smsApiKey?: string | null;
  pushHabilitado: boolean; // Default: false
  pushProvider?: PushProviderEnum | null;
  pushApiKey?: string | null;

  // Integrações
  apiHabilitada: boolean; // Default: false
  webhooksAtivos: number; // Default: 0

  // Backup
  backupAutomatico: boolean; // Default: true
  backupFrequencia: BackupFrequenciaEnum; // Default: diario
  backupRetencaoDias: number; // Default: 30 (range: 7-365)

  // Auditoria
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para atualizar configurações de empresa (partial update)
 */
export interface UpdateEmpresaConfigDto {
  // Geral
  descricao?: string;
  site?: string;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;

  // Segurança
  autenticacao2FA?: boolean;
  sessaoExpiracaoMinutos?: number;
  senhaComplexidade?: SenhaComplexidadeEnum;
  auditoria?: boolean;

  // Usuários
  limiteUsuarios?: number;
  aprovacaoNovoUsuario?: boolean;

  // Notificações
  emailsHabilitados?: boolean;
  servidorSMTP?: string;
  portaSMTP?: number;
  smtpUsuario?: string;
  smtpSenha?: string;

  // Integrações
  apiHabilitada?: boolean;
  webhooksAtivos?: number;

  // Backup
  backupAutomatico?: boolean;
  backupFrequencia?: BackupFrequenciaEnum;
  backupRetencaoDias?: number;
}

/**
 * Service para gerenciar configurações de empresa
 */
export const empresaConfigService = {
  /**
   * Busca configurações da empresa autenticada
   * 🔐 empresaId extraído automaticamente do JWT no backend
   * @returns Configurações da empresa (auto-cria se não existir)
   */
  async getConfig(): Promise<ConfiguracoesEmpresa> {
    const response = await api.get(`/empresas/config`);
    return response.data;
  },

  /**
   * Atualiza configurações da empresa autenticada (partial update)
   * 🔐 empresaId extraído automaticamente do JWT no backend
   * @param data - Configurações a atualizar
   * @returns Configurações atualizadas
   */
  async updateConfig(data: UpdateEmpresaConfigDto): Promise<ConfiguracoesEmpresa> {
    const response = await api.put(`/empresas/config`, data);
    return response.data;
  },

  /**
   * Restaura configurações da empresa autenticada para os valores padrão
   * 🔐 empresaId extraído automaticamente do JWT no backend
   * @returns Configurações restauradas
   */
  async resetConfig(): Promise<ConfiguracoesEmpresa> {
    const response = await api.post(`/empresas/config/reset`);
    return response.data;
  },
};
