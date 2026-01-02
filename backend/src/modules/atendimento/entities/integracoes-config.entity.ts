import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('atendimento_integracoes_config')
export class IntegracoesConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'tipo', length: 50 })
  tipo: string;

  @Column({ name: 'ativo', default: false })
  ativo: boolean;

  @Column({ name: 'credenciais', type: 'jsonb', nullable: true })
  credenciais: Record<string, any>;

  @Column({ name: 'webhook_secret', length: 255, nullable: true })
  webhookSecret: string;

  // Colunas específicas do WhatsApp (para compatibilidade/fallback)
  @Column({ name: 'whatsapp_api_token', length: 500, nullable: true })
  whatsappApiToken: string;

  @Column({ name: 'whatsapp_phone_number_id', length: 100, nullable: true })
  whatsappPhoneNumberId: string;

  @Column({ name: 'whatsapp_business_account_id', length: 100, nullable: true })
  whatsappBusinessAccountId: string;

  @Column({ name: 'whatsapp_webhook_verify_token', length: 255, nullable: true })
  whatsappWebhookVerifyToken: string;

  @Column({ name: 'whatsapp_ativo', default: false, nullable: true })
  whatsappAtivo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
