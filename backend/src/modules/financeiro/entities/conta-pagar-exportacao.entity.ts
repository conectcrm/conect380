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

export enum ContaPagarExportacaoFormato {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum ContaPagarExportacaoStatus {
  PROCESSANDO = 'processando',
  SUCESSO = 'sucesso',
  FALHA = 'falha',
}

@Entity('contas_pagar_exportacoes')
@Index('IDX_contas_pagar_exportacoes_empresa_created_at', ['empresaId', 'createdAt'])
@Index('IDX_contas_pagar_exportacoes_empresa_status', ['empresaId', 'status'])
export class ContaPagarExportacao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'usuario_id', type: 'varchar', length: 120, nullable: true })
  usuarioId?: string;

  @Column({
    type: 'enum',
    enum: ContaPagarExportacaoFormato,
  })
  formato: ContaPagarExportacaoFormato;

  @Column({
    type: 'enum',
    enum: ContaPagarExportacaoStatus,
    default: ContaPagarExportacaoStatus.PROCESSANDO,
  })
  status: ContaPagarExportacaoStatus;

  @Column({ name: 'filtros', type: 'jsonb', default: () => "'{}'::jsonb" })
  filtros: Record<string, unknown>;

  @Column({ name: 'nome_arquivo', type: 'varchar', length: 180, nullable: true })
  nomeArquivo?: string;

  @Column({ name: 'total_registros', type: 'int', default: 0 })
  totalRegistros: number;

  @Column({ name: 'erro', type: 'text', nullable: true })
  erro?: string;

  @Column({ name: 'iniciado_em', type: 'timestamp', default: () => 'now()' })
  iniciadoEm: Date;

  @Column({ name: 'finalizado_em', type: 'timestamp', nullable: true })
  finalizadoEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
