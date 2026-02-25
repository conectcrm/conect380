import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ValueTransformer,
  // ManyToOne,
  // JoinColumn,
} from 'typeorm';
import * as crypto from 'crypto';
// import { Empresa } from '../../../../empresas/entities/empresa.entity';

const ENCRYPTED_PREFIX = 'enc:v1:';
let invalidEncryptionKeyWarned = false;

const getEncryptionKey = (): Buffer | null => {
  const rawKey = (process.env.ENCRYPTION_KEY || '').trim();

  if (!rawKey) {
    return null;
  }

  const isHex64 = /^[a-fA-F0-9]{64}$/.test(rawKey);
  if (!isHex64) {
    if (!invalidEncryptionKeyWarned) {
      invalidEncryptionKeyWarned = true;
      // Warning sem expor segredo; fallback mantém compatibilidade de ambiente.
      // eslint-disable-next-line no-console
      console.warn('[EmpresaConfig] ENCRYPTION_KEY inválida. Segredos serão mantidos em texto puro.');
    }
    return null;
  }

  return Buffer.from(rawKey, 'hex');
};

const encryptSecret = (value: string): string => {
  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${encrypted}`;
};

const decryptSecret = (value: string): string => {
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  try {
    const payload = value.slice(ENCRYPTED_PREFIX.length);
    const [ivHex, encryptedHex] = payload.split(':');
    if (!ivHex || !encryptedHex) {
      return value;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return value;
  }
};

const encryptedNullableStringTransformer: ValueTransformer = {
  to: (value: string | null | undefined) => {
    if (typeof value !== 'string' || value.length === 0) {
      return value ?? null;
    }

    if (value.startsWith(ENCRYPTED_PREFIX)) {
      return value;
    }

    return encryptSecret(value);
  },
  from: (value: string | null | undefined) => {
    if (typeof value !== 'string' || value.length === 0) {
      return value ?? null;
    }

    return decryptSecret(value);
  },
};

@Entity('empresa_configuracoes')
export class EmpresaConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  // ⚠️ Relacionamento comentado temporariamente para debug
  // @ManyToOne(() => Empresa)
  // @JoinColumn({ name: 'empresa_id' })
  // empresa: Empresa;

  // Configurações Gerais
  @Column({ nullable: true })
  descricao: string;

  @Column({ nullable: true })
  site: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'cor_primaria', default: '#159A9C' })
  corPrimaria: string;

  @Column({ name: 'cor_secundaria', default: '#002333' })
  corSecundaria: string;

  // Configurações de Segurança
  @Column({ name: 'autenticacao_2fa', default: false })
  autenticacao2FA: boolean;

  @Column({ name: 'sessao_expiracao_minutos', default: 30 })
  sessaoExpiracaoMinutos: number;

  @Column({
    name: 'senha_complexidade',
    type: 'enum',
    enum: ['baixa', 'media', 'alta'],
    enumName: 'senha_complexidade_enum',
    default: 'media',
  })
  senhaComplexidade: 'baixa' | 'media' | 'alta';

  @Column({ default: true })
  auditoria: boolean;

  @Column({ name: 'force_ssl', default: false })
  forceSsl: boolean;

  @Column({ name: 'ip_whitelist', type: 'text', nullable: true })
  ipWhitelist: string;

  // Configurações de Usuários
  @Column({ name: 'limite_usuarios', default: 10 })
  limiteUsuarios: number;

  @Column({ name: 'aprovacao_novo_usuario', default: false })
  aprovacaoNovoUsuario: boolean;

  @Column({ name: 'convite_expiracao_horas', default: 48 })
  conviteExpiracaoHoras: number;

  // Configurações de Email/SMTP
  @Column({ name: 'emails_habilitados', default: true })
  emailsHabilitados: boolean;

  @Column({ name: 'servidor_smtp', nullable: true })
  servidorSMTP: string;

  @Column({ name: 'porta_smtp', default: 587 })
  portaSMTP: number;

  @Column({ name: 'smtp_usuario', nullable: true })
  smtpUsuario: string;

  @Column({ name: 'smtp_senha', nullable: true, transformer: encryptedNullableStringTransformer })
  smtpSenha: string;

  // Configurações de Comunicação (WhatsApp, SMS, Push)
  @Column({ name: 'whatsapp_habilitado', default: false })
  whatsappHabilitado: boolean;

  @Column({ name: 'whatsapp_numero', nullable: true })
  whatsappNumero: string;

  @Column({
    name: 'whatsapp_api_token',
    nullable: true,
    transformer: encryptedNullableStringTransformer,
  })
  whatsappApiToken: string;

  @Column({ name: 'sms_habilitado', default: false })
  smsHabilitado: boolean;

  @Column({
    name: 'sms_provider',
    type: 'enum',
    enum: ['twilio', 'nexmo', 'sinch'],
    enumName: 'sms_provider_enum',
    nullable: true,
  })
  smsProvider: 'twilio' | 'nexmo' | 'sinch' | null;

  @Column({ name: 'sms_api_key', nullable: true, transformer: encryptedNullableStringTransformer })
  smsApiKey: string;

  @Column({ name: 'push_habilitado', default: false })
  pushHabilitado: boolean;

  @Column({
    name: 'push_provider',
    type: 'enum',
    enum: ['fcm', 'apns', 'onesignal'],
    enumName: 'push_provider_enum',
    nullable: true,
  })
  pushProvider: 'fcm' | 'apns' | 'onesignal' | null;

  @Column({ name: 'push_api_key', nullable: true, transformer: encryptedNullableStringTransformer })
  pushApiKey: string;

  // Configurações de Integrações
  @Column({ name: 'api_habilitada', default: false })
  apiHabilitada: boolean;

  @Column({ name: 'webhooks_ativos', default: 0 })
  webhooksAtivos: number;

  // Configurações de Backup
  @Column({ name: 'backup_automatico', default: true })
  backupAutomatico: boolean;

  @Column({
    name: 'backup_frequencia',
    type: 'enum',
    enum: ['diario', 'semanal', 'mensal'],
    enumName: 'backup_frequencia_enum',
    default: 'diario',
  })
  backupFrequencia: 'diario' | 'semanal' | 'mensal';

  @Column({ name: 'backup_retencao_dias', default: 30 })
  backupRetencaoDias: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
