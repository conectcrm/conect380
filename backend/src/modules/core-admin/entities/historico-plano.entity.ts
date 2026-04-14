import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('historico_planos')
export class HistoricoPlano {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'plano_anterior',
  })
  planoAnterior: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'plano_novo',
  })
  planoNovo: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor_anterior',
  })
  valorAnterior: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor_novo',
  })
  valorNovo: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo da mudança de plano',
  })
  motivo: string;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'alterado_por',
    comment: 'ID do admin que fez a alteração',
  })
  alteradoPor: string;

  @CreateDateColumn({ name: 'data_alteracao' })
  dataAlteracao: Date;
}
