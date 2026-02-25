import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('propostas_portal_tokens')
@Index('IDX_propostas_portal_tokens_empresa_id', ['empresaId'])
@Index('IDX_propostas_portal_tokens_proposta_id', ['propostaId'])
@Index('IDX_propostas_portal_tokens_token_hash', ['tokenHash'], { unique: true })
@Index('IDX_propostas_portal_tokens_active', ['isActive'])
export class PropostaPortalToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Mantido como string para compatibilidade com schemas onde empresa_id ainda esta em varchar.
  @Column({ type: 'varchar', name: 'empresa_id' })
  empresaId: string;

  @Column({ type: 'uuid', name: 'proposta_id' })
  propostaId: string;

  @Column({ type: 'varchar', name: 'token_hash', length: 128, unique: true })
  tokenHash: string;

  @Column({ type: 'varchar', name: 'token_hint', length: 32, nullable: true })
  tokenHint?: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'expira_em', nullable: true })
  expiraEm?: Date | null;

  @Column({ type: 'timestamptz', name: 'revogado_em', nullable: true })
  revogadoEm?: Date | null;

  @Column({ type: 'timestamptz', name: 'ultimo_acesso_em', nullable: true })
  ultimoAcessoEm?: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'atualizado_em' })
  atualizadoEm: Date;
}
