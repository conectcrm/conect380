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

export enum AlertaOperacionalFinanceiroTipo {
  CONTA_VENCE_EM_3_DIAS = 'conta_vence_em_3_dias',
  CONTA_VENCIDA = 'conta_vencida',
  CONCILIACAO_PENDENTE_CRITICA = 'conciliacao_pendente_critica',
  WEBHOOK_PAGAMENTO_FALHA = 'webhook_pagamento_falha',
  EXPORTACAO_CONTABIL_FALHA = 'exportacao_contabil_falha',
}

export enum AlertaOperacionalFinanceiroSeveridade {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertaOperacionalFinanceiroStatus {
  ATIVO = 'ativo',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVIDO = 'resolvido',
}

@Entity('alertas_operacionais_financeiro')
@Index('IDX_alertas_operacionais_financeiro_empresa_status', ['empresaId', 'status'])
@Index('IDX_alertas_operacionais_financeiro_empresa_severidade', ['empresaId', 'severidade'])
@Index('IDX_alertas_operacionais_financeiro_empresa_created_at', ['empresaId', 'createdAt'])
export class AlertaOperacionalFinanceiro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({
    type: 'enum',
    enum: AlertaOperacionalFinanceiroTipo,
  })
  tipo: AlertaOperacionalFinanceiroTipo;

  @Column({
    type: 'enum',
    enum: AlertaOperacionalFinanceiroSeveridade,
    default: AlertaOperacionalFinanceiroSeveridade.WARNING,
  })
  severidade: AlertaOperacionalFinanceiroSeveridade;

  @Column({ type: 'varchar', length: 220 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  referencia?: string;

  @Column({
    type: 'enum',
    enum: AlertaOperacionalFinanceiroStatus,
    default: AlertaOperacionalFinanceiroStatus.ATIVO,
  })
  status: AlertaOperacionalFinanceiroStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  auditoria: Array<Record<string, unknown>>;

  @Column({ name: 'acknowledged_por', type: 'varchar', length: 120, nullable: true })
  acknowledgedPor?: string;

  @Column({ name: 'acknowledged_em', type: 'timestamp', nullable: true })
  acknowledgedEm?: Date;

  @Column({ name: 'resolvido_por', type: 'varchar', length: 120, nullable: true })
  resolvidoPor?: string;

  @Column({ name: 'resolvido_em', type: 'timestamp', nullable: true })
  resolvidoEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
