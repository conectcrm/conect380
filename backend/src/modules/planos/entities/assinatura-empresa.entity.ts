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
import { Empresa } from '../../../empresas/entities/empresa.entity';

export const CANONICAL_ASSINATURA_STATUS_VALUES = [
  'trial',
  'active',
  'past_due',
  'suspended',
  'canceled',
] as const;

export const LEGACY_ASSINATURA_STATUS_VALUES = [
  'pendente',
  'ativa',
  'suspensa',
  'cancelada',
] as const;

export const ASSINATURA_STATUS_VALUES = [
  ...CANONICAL_ASSINATURA_STATUS_VALUES,
  ...LEGACY_ASSINATURA_STATUS_VALUES,
] as const;

export type CanonicalAssinaturaStatus = (typeof CANONICAL_ASSINATURA_STATUS_VALUES)[number];
export type LegacyAssinaturaStatus = (typeof LEGACY_ASSINATURA_STATUS_VALUES)[number];
export type AssinaturaStatus = (typeof ASSINATURA_STATUS_VALUES)[number];

const CANONICAL_BY_STATUS: Record<AssinaturaStatus, CanonicalAssinaturaStatus> = {
  trial: 'trial',
  active: 'active',
  past_due: 'past_due',
  suspended: 'suspended',
  canceled: 'canceled',
  pendente: 'trial',
  ativa: 'active',
  suspensa: 'suspended',
  cancelada: 'canceled',
};

const STATUS_ALIASES_BY_CANONICAL: Record<CanonicalAssinaturaStatus, AssinaturaStatus[]> = {
  trial: ['trial', 'pendente'],
  active: ['active', 'ativa'],
  past_due: ['past_due'],
  suspended: ['suspended', 'suspensa'],
  canceled: ['canceled', 'cancelada'],
};

export function isAssinaturaStatus(value: string): value is AssinaturaStatus {
  return ASSINATURA_STATUS_VALUES.includes(value as AssinaturaStatus);
}

export function toCanonicalAssinaturaStatus(
  status: AssinaturaStatus | string | null | undefined,
): CanonicalAssinaturaStatus {
  if (!status || !isAssinaturaStatus(status)) {
    return 'trial';
  }

  return CANONICAL_BY_STATUS[status];
}

export function getAssinaturaStatusAliases(
  status: CanonicalAssinaturaStatus,
): readonly AssinaturaStatus[] {
  return STATUS_ALIASES_BY_CANONICAL[status];
}

@Entity('assinaturas_empresas')
export class AssinaturaEmpresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Relacionamento com Plano
  @ManyToOne(() => Plano, (plano) => plano.assinaturas, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plano_id' })
  plano: Plano;

  @Column({ type: 'enum', enum: ASSINATURA_STATUS_VALUES, default: 'active' })
  status: AssinaturaStatus;

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
