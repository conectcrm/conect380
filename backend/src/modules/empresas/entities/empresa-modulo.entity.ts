import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum ModuloEnum {
  ATENDIMENTO = 'ATENDIMENTO',
  CRM = 'CRM',
  VENDAS = 'VENDAS',
  FINANCEIRO = 'FINANCEIRO',
  BILLING = 'BILLING',
  ADMINISTRACAO = 'ADMINISTRACAO',
}

export enum PlanoEnum {
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('empresa_modulos')
@Unique(['empresaId', 'modulo'])
export class EmpresaModulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'ATENDIMENTO, CRM, VENDAS, FINANCEIRO, BILLING, ADMINISTRACAO',
  })
  modulo: ModuloEnum;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_ativacao: Date;

  @Column({ type: 'timestamp', nullable: true })
  data_expiracao: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'STARTER, BUSINESS, ENTERPRISE',
  })
  plano: PlanoEnum | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
