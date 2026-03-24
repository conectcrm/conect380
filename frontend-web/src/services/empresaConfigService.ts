import api from './api';

export enum SenhaComplexidadeEnum {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
}

export enum BackupFrequenciaEnum {
  DIARIO = 'diario',
  SEMANAL = 'semanal',
  MENSAL = 'mensal',
}

export enum SmsProviderEnum {
  TWILIO = 'twilio',
  NEXMO = 'nexmo',
  SINCH = 'sinch',
}

export enum PushProviderEnum {
  FCM = 'fcm',
  APNS = 'apns',
  ONESIGNAL = 'onesignal',
}

export interface ConfiguracoesEmpresa {
  id: string;
  empresaId: string;

  // Geral
  descricao?: string | null;
  site?: string | null;
  logoUrl?: string | null;
  corPrimaria: string;
  corSecundaria: string;

  // Seguranca
  autenticacao2FA: boolean;
  sessaoExpiracaoMinutos: number;
  senhaComplexidade: SenhaComplexidadeEnum;
  auditoria: boolean;
  forceSsl: boolean;
  ipWhitelist?: string[] | null;

  // Usuarios
  limiteUsuarios: number;
  aprovacaoNovoUsuario: boolean;
  conviteExpiracaoHoras: number;
  alcadaAprovacaoFinanceira?: number | null;
  comercialLimiteDescontoPercentual: number;
  comercialAprovacaoInternaHabilitada: boolean;

  // Email/SMTP
  emailsHabilitados: boolean;
  servidorSMTP?: string | null;
  portaSMTP: number;
  smtpUsuario?: string | null;
  smtpSenha?: string | null;

  // Comunicacao
  whatsappHabilitado: boolean;
  whatsappNumero?: string | null;
  whatsappApiToken?: string | null;
  smsHabilitado: boolean;
  smsProvider?: SmsProviderEnum | null;
  smsApiKey?: string | null;
  pushHabilitado: boolean;
  pushProvider?: PushProviderEnum | null;
  pushApiKey?: string | null;

  // Integracoes
  apiHabilitada: boolean;
  webhooksAtivos: number;
  fiscalProvider?: string | null;
  fiscalOfficialHttpEnabled?: boolean | null;
  fiscalRequireOfficialProvider?: boolean | null;
  fiscalOfficialBaseUrl?: string | null;
  fiscalOfficialStrictResponse?: boolean | null;
  fiscalOfficialWebhookAllowInsecure?: boolean | null;
  fiscalOfficialCorrelationHeader?: string | null;
  fiscalOfficialApiToken?: string | null;
  fiscalOfficialWebhookSecret?: string | null;

  // Backup
  backupAutomatico: boolean;
  backupFrequencia: BackupFrequenciaEnum;
  backupRetencaoDias: number;

  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmpresaConfigDto {
  // Geral
  descricao?: string;
  site?: string;
  logoUrl?: string | null;
  corPrimaria?: string;
  corSecundaria?: string;

  // Seguranca
  autenticacao2FA?: boolean;
  sessaoExpiracaoMinutos?: number;
  senhaComplexidade?: SenhaComplexidadeEnum;
  auditoria?: boolean;
  forceSsl?: boolean;
  ipWhitelist?: string[] | null;

  // Usuarios
  limiteUsuarios?: number;
  aprovacaoNovoUsuario?: boolean;
  conviteExpiracaoHoras?: number;
  alcadaAprovacaoFinanceira?: number | null;
  comercialLimiteDescontoPercentual?: number;
  comercialAprovacaoInternaHabilitada?: boolean;

  // Email/SMTP
  emailsHabilitados?: boolean;
  servidorSMTP?: string;
  portaSMTP?: number;
  smtpUsuario?: string;
  smtpSenha?: string;

  // Comunicacao
  whatsappHabilitado?: boolean;
  whatsappNumero?: string;
  whatsappApiToken?: string;
  smsHabilitado?: boolean;
  smsProvider?: SmsProviderEnum;
  smsApiKey?: string;
  pushHabilitado?: boolean;
  pushProvider?: PushProviderEnum;
  pushApiKey?: string;

  // Integracoes
  apiHabilitada?: boolean;
  webhooksAtivos?: number;
  fiscalProvider?: string;
  fiscalOfficialHttpEnabled?: boolean;
  fiscalRequireOfficialProvider?: boolean;
  fiscalOfficialBaseUrl?: string;
  fiscalOfficialStrictResponse?: boolean;
  fiscalOfficialWebhookAllowInsecure?: boolean;
  fiscalOfficialCorrelationHeader?: string;
  fiscalOfficialApiToken?: string;
  fiscalOfficialWebhookSecret?: string;

  // Backup
  backupAutomatico?: boolean;
  backupFrequencia?: BackupFrequenciaEnum;
  backupRetencaoDias?: number;
}

export interface TestSmtpRequest {
  servidorSMTP?: string | null;
  portaSMTP?: number | null;
  smtpUsuario?: string | null;
  smtpSenha?: string | null;
}

export interface TestSmtpResponse {
  success: boolean;
  message: string;
}

export const empresaConfigService = {
  async getConfig(): Promise<ConfiguracoesEmpresa> {
    const response = await api.get('/empresas/config');
    return response.data;
  },

  async updateConfig(data: UpdateEmpresaConfigDto): Promise<ConfiguracoesEmpresa> {
    const response = await api.put('/empresas/config', data);
    return response.data;
  },

  async resetConfig(): Promise<ConfiguracoesEmpresa> {
    const response = await api.post('/empresas/config/reset');
    return response.data;
  },

  async testSMTP(data: TestSmtpRequest): Promise<TestSmtpResponse> {
    const response = await api.post('/empresas/config/smtp/test', data);
    return response.data;
  },
};
