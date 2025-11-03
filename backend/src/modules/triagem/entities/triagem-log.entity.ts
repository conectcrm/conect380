import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SessaoTriagem } from './sessao-triagem.entity';
import { FluxoTriagem } from './fluxo-triagem.entity';

export type DirecaoTriagemLog = 'entrada' | 'saida' | 'sistema';

@Entity('triagem_logs')
@Index('idx_triagem_logs_empresa', ['empresaId'])
@Index('idx_triagem_logs_sessao', ['sessaoId'])
@Index('idx_triagem_logs_fluxo', ['fluxoId'])
export class TriagemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @Column({ name: 'sessao_id', type: 'uuid', nullable: true })
  sessaoId?: string;

  @Column({ name: 'fluxo_id', type: 'uuid', nullable: true })
  fluxoId?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  etapa?: string;

  @Column({ type: 'varchar', length: 20 })
  direcao: DirecaoTriagemLog;

  @Column({ type: 'varchar', length: 30, default: 'whatsapp' })
  canal: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo?: string;

  @Column({ name: 'mensagem_id', type: 'varchar', length: 160, nullable: true })
  messageId?: string;

  @Column({ type: 'text', nullable: true })
  mensagem?: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'contexto_snapshot' })
  contextoSnapshot?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => SessaoTriagem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sessao_id' })
  sessao?: SessaoTriagem;

  @ManyToOne(() => FluxoTriagem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fluxo_id' })
  fluxo?: FluxoTriagem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
