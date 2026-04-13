import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ComissaoLancamento } from './comissao-lancamento.entity';

@Entity('comissoes_lancamento_participantes')
export class ComissaoLancamentoParticipante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @Column({ type: 'uuid', name: 'lancamento_id' })
  lancamentoId: string;

  @ManyToOne(() => ComissaoLancamento, (l) => l.participantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lancamento_id' })
  lancamento: ComissaoLancamento;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @Column({ type: 'varchar', nullable: true })
  papel?: string | null;

  @Column({ type: 'numeric', precision: 7, scale: 4, default: 0 })
  percentual: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, name: 'valor_comissao', default: 0 })
  valorComissao: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

