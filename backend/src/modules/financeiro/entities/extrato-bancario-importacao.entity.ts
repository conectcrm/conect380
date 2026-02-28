import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { ContaBancaria } from './conta-bancaria.entity';
import { ExtratoBancarioItem } from './extrato-bancario-item.entity';

export enum TipoArquivoExtratoBancario {
  CSV = 'csv',
  OFX = 'ofx',
}

@Entity('extratos_bancarios_importacoes')
@Index('IDX_extratos_importacoes_empresa_created_at', ['empresaId', 'createdAt'])
@Index('IDX_extratos_importacoes_conta_bancaria_created_at', ['contaBancariaId', 'createdAt'])
export class ExtratoBancarioImportacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'nome_arquivo', length: 255 })
  nomeArquivo: string;

  @Column({
    name: 'tipo_arquivo',
    type: 'enum',
    enum: TipoArquivoExtratoBancario,
  })
  tipoArquivo: TipoArquivoExtratoBancario;

  @Column({ name: 'total_lancamentos', type: 'int', default: 0 })
  totalLancamentos: number;

  @Column('decimal', { name: 'total_entradas', precision: 15, scale: 2, default: 0 })
  totalEntradas: number;

  @Column('decimal', { name: 'total_saidas', precision: 15, scale: 2, default: 0 })
  totalSaidas: number;

  @Column({ name: 'periodo_inicio', type: 'date', nullable: true })
  periodoInicio?: Date;

  @Column({ name: 'periodo_fim', type: 'date', nullable: true })
  periodoFim?: Date;

  @Column({ name: 'status', length: 20, default: 'processado' })
  status: string;

  @Column({ name: 'erros_importacao', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  errosImportacao?: unknown[];

  @Column({ name: 'criado_por', nullable: true })
  criadoPor?: string;

  @OneToMany(() => ExtratoBancarioItem, (item) => item.importacao)
  itens?: ExtratoBancarioItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
