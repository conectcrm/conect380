import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plano } from './plano.entity';

@Entity('assinaturas_empresas')
export class AssinaturaEmpresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  // Relacionamento com Plano
  @ManyToOne(() => Plano, (plano) => plano.assinaturas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plano_id' })
  plano: Plano;

  @Column({ type: 'enum', enum: ['ativa', 'cancelada', 'suspensa', 'pendente'], default: 'ativa' })
  status: 'ativa' | 'cancelada' | 'suspensa' | 'pendente';

  @Column({ type: 'date' })
  dataInicio: Date;

  @Column({ type: 'date', nullable: true })
  dataFim: Date;

  @Column({ type: 'date' })
  proximoVencimento: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorMensal: number;

  @Column({ type: 'int', default: 0 })
  usuariosAtivos: number;

  @Column({ type: 'int', default: 0 })
  clientesCadastrados: number;

  @Column({ type: 'bigint', default: 0 })
  storageUtilizado: number; // em bytes

  @Column({ type: 'int', default: 0 })
  apiCallsHoje: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  ultimaContabilizacaoApi: Date;

  @Column({ type: 'boolean', default: true })
  renovacaoAutomatica: boolean;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
