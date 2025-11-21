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
import { ConfiguracaoGateway } from './configuracao-gateway.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { Fatura } from '../../faturamento/entities/fatura.entity';
import { Pagamento } from '../../faturamento/entities/pagamento.entity';

export enum GatewayTransacaoStatus {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  CANCELADO = 'cancelado',
  ERRO = 'erro',
}

export enum GatewayOperacao {
  COBRANCA = 'cobranca',
  ESTORNO = 'estorno',
  WEBHOOK = 'webhook',
  VALIDACAO = 'validacao',
}

export enum GatewayMetodoPagamento {
  PIX = 'pix',
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  LINK_PAGAMENTO = 'link_pagamento',
  TRANSFERENCIA = 'transferencia',
}

@Entity('transacoes_gateway_pagamento')
@Index('IDX_transacoes_gateway_empresa', ['empresa_id'])
@Index('UQ_transacoes_gateway_referencia', ['empresa_id', 'referenciaGateway'], {
  unique: true,
})
export class TransacaoGateway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid', { name: 'configuracao_id' })
  configuracaoId: string;

  @ManyToOne(() => ConfiguracaoGateway, (config) => config.transacoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuracao_id' })
  configuracao: ConfiguracaoGateway;

  @Column({ name: 'fatura_id', type: 'int', nullable: true })
  faturaId?: number;

  @ManyToOne(() => Fatura, { nullable: true })
  @JoinColumn({ name: 'fatura_id' })
  fatura?: Fatura;

  @Column({ name: 'pagamento_id', type: 'int', nullable: true })
  pagamentoId?: number;

  @ManyToOne(() => Pagamento, { nullable: true })
  @JoinColumn({ name: 'pagamento_id' })
  pagamento?: Pagamento;

  @Column({ name: 'referencia_gateway', type: 'varchar', length: 140 })
  referenciaGateway: string;

  @Column({
    type: 'enum',
    enum: GatewayTransacaoStatus,
    default: GatewayTransacaoStatus.PENDENTE,
  })
  status: GatewayTransacaoStatus;

  @Column({
    name: 'tipo_operacao',
    type: 'enum',
    enum: GatewayOperacao,
    default: GatewayOperacao.COBRANCA,
  })
  tipoOperacao: GatewayOperacao;

  @Column({
    type: 'enum',
    enum: GatewayMetodoPagamento,
    default: GatewayMetodoPagamento.PIX,
  })
  metodo: GatewayMetodoPagamento;

  @Column({ type: 'varchar', length: 60, default: 'api' })
  origem: string;

  @Column({ name: 'valor_bruto', type: 'decimal', precision: 12, scale: 2, default: '0' })
  valorBruto: number;

  @Column({ name: 'valor_liquido', type: 'decimal', precision: 12, scale: 2, default: '0' })
  valorLiquido: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  taxa: number;

  @Column({ name: 'payload_envio', type: 'jsonb', default: () => "'{}'::jsonb" })
  payloadEnvio: Record<string, any>;

  @Column({ name: 'payload_resposta', type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  payloadResposta?: Record<string, any>;

  @Column({ name: 'mensagem_erro', type: 'text', nullable: true })
  mensagemErro?: string;

  @Column({ name: 'processado_em', type: 'timestamp', nullable: true })
  processadoEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
