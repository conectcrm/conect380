import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import * as crypto from 'crypto';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('atendimento_redmine_configs')
export class RedmineConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id', unique: true })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Conexão Redmine
  @Column({ type: 'varchar', length: 255, name: 'redmine_url' })
  redmineUrl: string; // Ex: https://redmine.cliente.com.br

  @Column({ type: 'varchar', length: 255, name: 'redmine_api_key_encrypted' })
  redmineApiKeyEncrypted: string;

  @Column({ type: 'int', name: 'redmine_project_id' })
  redmineProjectId: number; // Projeto padrão

  @Column({ type: 'int', name: 'redmine_custom_field_id', default: 1 })
  redmineCustomFieldId: number; // ID do custom field "ConectCRM ID"

  // Mapeamentos customizados (override dos defaults)
  @Column({ type: 'jsonb', nullable: true })
  mapeamentoTrackers: {
    TECNICA?: number;
    COMERCIAL?: number;
    FINANCEIRA?: number;
    SUPORTE?: number;
    RECLAMACAO?: number;
    SOLICITACAO?: number;
    OUTROS?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  mapeamentoStatus: {
    ABERTA?: number;
    EM_ANDAMENTO?: number;
    AGUARDANDO?: number;
    CONCLUIDA?: number;
    CANCELADA?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  mapeamentoPrioridade: {
    BAIXA?: number;
    MEDIA?: number;
    ALTA?: number;
    URGENTE?: number;
  };

  // Comportamento
  @Column({ type: 'boolean', default: true, name: 'sincronizacao_automatica' })
  sincronizacaoAutomatica: boolean; // Se true, cria issue ao criar demanda

  @Column({ type: 'boolean', default: false, name: 'sincronizacao_bidirecional' })
  sincronizacaoBidirecional: boolean; // Se true, atualiza demanda quando issue muda

  @Column({ type: 'int', default: 300, name: 'intervalo_polling' })
  intervaloPolling: number; // Segundos entre checks (se bidirecional)

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // API Key em plain text (não persiste no banco)
  private redmineApiKeyPlain: string;

  get redmineApiKey(): string {
    if (!this.redmineApiKeyPlain && this.redmineApiKeyEncrypted) {
      this.redmineApiKeyPlain = this.decrypt(this.redmineApiKeyEncrypted);
    }
    return this.redmineApiKeyPlain;
  }

  set redmineApiKey(value: string) {
    this.redmineApiKeyPlain = value;
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptApiKey() {
    if (this.redmineApiKeyPlain) {
      this.redmineApiKeyEncrypted = this.encrypt(this.redmineApiKeyPlain);
    }
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(
      process.env.ENCRYPTION_KEY || '0'.repeat(64),
      'hex',
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(
        process.env.ENCRYPTION_KEY || '0'.repeat(64),
        'hex',
      );
      const [ivHex, encryptedHex] = text.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar API key:', error.message);
      return '';
    }
  }
}
