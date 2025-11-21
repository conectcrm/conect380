import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  // ManyToOne,
  // JoinColumn,
} from 'typeorm';
// import { Empresa } from '../../../../empresas/entities/empresa.entity';

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

  @Column({ name: 'smtp_senha', nullable: true })
  smtpSenha: string;

  // Configurações de Comunicação (WhatsApp, SMS, Push)
  @Column({ name: 'whatsapp_habilitado', default: false })
  whatsappHabilitado: boolean;

  @Column({ name: 'whatsapp_numero', nullable: true })
  whatsappNumero: string;

  @Column({ name: 'whatsapp_api_token', nullable: true })
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

  @Column({ name: 'sms_api_key', nullable: true })
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

  @Column({ name: 'push_api_key', nullable: true })
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
