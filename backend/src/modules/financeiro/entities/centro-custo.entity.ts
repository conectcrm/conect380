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

@Entity('centros_custo')
@Index('IDX_centros_custo_empresa', ['empresaId'])
@Index('IDX_centros_custo_empresa_ativo', ['empresaId', 'ativo'])
@Index('IDX_centros_custo_empresa_codigo', ['empresaId', 'codigo'], { unique: true })
export class CentroCusto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ length: 30 })
  codigo: string;

  @Column({ length: 120 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

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
