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

export enum TipoContaBancaria {
  CORRENTE = 'corrente',
  POUPANCA = 'poupanca',
}

@Entity('contas_bancarias')
@Index('IDX_contas_bancarias_empresa', ['empresaId'])
@Index('IDX_contas_bancarias_empresa_ativo', ['empresaId', 'ativo'])
export class ContaBancaria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ length: 120 })
  nome: string;

  @Column({ length: 120 })
  banco: string;

  @Column({ length: 20 })
  agencia: string;

  @Column({ length: 30 })
  conta: string;

  @Column({
    name: 'tipo_conta',
    type: 'enum',
    enum: TipoContaBancaria,
    default: TipoContaBancaria.CORRENTE,
  })
  tipoConta: TipoContaBancaria;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  saldo: number;

  @Column({ name: 'chave_pix', length: 160, nullable: true })
  chavePix?: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ name: 'criado_por', nullable: true })
  criadoPor?: string;

  @Column({ name: 'atualizado_por', nullable: true })
  atualizadoPor?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
