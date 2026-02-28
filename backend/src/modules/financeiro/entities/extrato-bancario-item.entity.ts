import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { ContaBancaria } from './conta-bancaria.entity';
import { ContaPagar } from './conta-pagar.entity';
import { ExtratoBancarioImportacao } from './extrato-bancario-importacao.entity';

export enum TipoLancamentoExtratoBancario {
  CREDITO = 'credito',
  DEBITO = 'debito',
}

export type OrigemConciliacaoExtratoBancario = 'automatica' | 'manual';

@Entity('extratos_bancarios_itens')
@Index('IDX_extratos_itens_importacao_id', ['importacaoId'])
@Index('IDX_extratos_itens_empresa_data_lancamento', ['empresaId', 'dataLancamento'])
@Index('IDX_extratos_itens_empresa_conciliado', ['empresaId', 'conciliado'])
export class ExtratoBancarioItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'importacao_id' })
  importacaoId: string;

  @ManyToOne(() => ExtratoBancarioImportacao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'importacao_id' })
  importacao: ExtratoBancarioImportacao;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'conta_bancaria_id' })
  contaBancariaId: string;

  @ManyToOne(() => ContaBancaria)
  @JoinColumn({ name: 'conta_bancaria_id' })
  contaBancaria: ContaBancaria;

  @Column({ name: 'data_lancamento', type: 'date' })
  dataLancamento: Date;

  @Column({ length: 500 })
  descricao: string;

  @Column({ name: 'documento', length: 120, nullable: true })
  documento?: string;

  @Column({ name: 'referencia_externa', length: 120, nullable: true })
  referenciaExterna?: string;

  @Column({
    type: 'enum',
    enum: TipoLancamentoExtratoBancario,
  })
  tipo: TipoLancamentoExtratoBancario;

  @Column('decimal', { precision: 15, scale: 2 })
  valor: number;

  @Column({ name: 'saldo_pos_lancamento', type: 'decimal', precision: 15, scale: 2, nullable: true })
  saldoPosLancamento?: number;

  @Column({ default: false })
  conciliado: boolean;

  @Column({ name: 'conta_pagar_id', nullable: true })
  contaPagarId?: string;

  @ManyToOne(() => ContaPagar, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conta_pagar_id' })
  contaPagar?: ContaPagar;

  @Column({ name: 'data_conciliacao', type: 'timestamp', nullable: true })
  dataConciliacao?: Date;

  @Column({ name: 'conciliado_por', nullable: true })
  conciliadoPor?: string;

  @Column({ name: 'conciliacao_origem', length: 20, nullable: true })
  conciliacaoOrigem?: OrigemConciliacaoExtratoBancario;

  @Column({ name: 'motivo_conciliacao', length: 500, nullable: true })
  motivoConciliacao?: string;

  @Column({
    name: 'auditoria_conciliacao',
    type: 'jsonb',
    nullable: true,
    default: () => "'[]'::jsonb",
  })
  auditoriaConciliacao?: Array<Record<string, unknown>>;

  @Column({ name: 'dados_originais', type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  dadosOriginais?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
