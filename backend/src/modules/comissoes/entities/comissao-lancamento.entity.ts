import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ComissaoLancamentoParticipante } from './comissao-lancamento-participante.entity';

export type StatusComissaoLancamento = 'pendente' | 'aprovada' | 'paga' | 'cancelada';

@Entity('comissoes_lancamentos')
export class ComissaoLancamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @Column({ type: 'uuid', name: 'proposta_id', nullable: true })
  propostaId?: string | null;

  @Column({ type: 'integer', name: 'fatura_id' })
  faturaId: number;

  @Column({ type: 'integer', name: 'pagamento_id' })
  pagamentoId: number;

  @Column({ type: 'varchar', default: 'pagamento.aprovado' })
  origem: string;

  @Column({ type: 'integer', name: 'competencia_ano' })
  competenciaAno: number;

  @Column({ type: 'integer', name: 'competencia_mes' })
  competenciaMes: number;

  @Column({ type: 'timestamp', name: 'data_evento' })
  dataEvento: Date;

  @Column({ type: 'numeric', precision: 15, scale: 2, name: 'valor_base_liquido', default: 0 })
  valorBaseLiquido: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, name: 'valor_comissao_total', default: 0 })
  valorComissaoTotal: number;

  @Column({ type: 'varchar', default: 'pendente' })
  status: StatusComissaoLancamento;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => ComissaoLancamentoParticipante, (p) => p.lancamento)
  participantes: ComissaoLancamentoParticipante[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

