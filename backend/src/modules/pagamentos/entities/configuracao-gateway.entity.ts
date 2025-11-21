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
import { TransacaoGateway } from './transacao-gateway.entity';

export enum GatewayProvider {
  MERCADO_PAGO = 'mercado_pago',
  STRIPE = 'stripe',
  PAGSEGURO = 'pagseguro',
}

export enum GatewayMode {
  SANDBOX = 'sandbox',
  PRODUCAO = 'producao',
}

export enum GatewayStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  ERRO = 'erro',
}

@Entity('configuracoes_gateway_pagamento')
@Index('IDX_configuracoes_gateway_empresa', ['empresa_id'])
@Index('UQ_config_gateway_empresa_tipo_modo', ['empresa_id', 'gateway', 'modoOperacao'], {
  unique: true,
})
export class ConfiguracaoGateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({
    type: 'enum',
    enum: GatewayProvider,
  })
  gateway: GatewayProvider;

  @Column({
    name: 'modo_operacao',
    type: 'enum',
    enum: GatewayMode,
    default: GatewayMode.SANDBOX,
  })
  modoOperacao: GatewayMode;

  @Column({
    type: 'enum',
    enum: GatewayStatus,
    default: GatewayStatus.INATIVO,
  })
  status: GatewayStatus;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  credenciais?: Record<string, any>;

  @Column({ name: 'webhook_url', type: 'varchar', length: 255, nullable: true })
  webhookUrl?: string;

  @Column({ name: 'webhook_secret', type: 'varchar', length: 255, nullable: true })
  webhookSecret?: string;

  @Column({
    name: 'metodos_permitidos',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  metodosPermitidos: string[];

  @Column({ name: 'config_adicional', type: 'jsonb', nullable: true })
  configuracoesAdicionais?: Record<string, any>;

  @Column({ name: 'ultimo_erro', type: 'text', nullable: true })
  ultimoErro?: string;

  @Column({ name: 'ultimo_evento_em', type: 'timestamp', nullable: true })
  ultimoEventoEm?: Date;

  @Column({ name: 'criado_por', type: 'uuid', nullable: true })
  criadoPor?: string;

  @Column({ name: 'atualizado_por', type: 'uuid', nullable: true })
  atualizadoPor?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TransacaoGateway, (transacao) => transacao.configuracao)
  transacoes: TransacaoGateway[];
}
