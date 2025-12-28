import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';

import { Fila } from './fila.entity';
import { Tag } from './tag.entity';
import { User } from '../../users/user.entity';

export enum StatusTicket {
  FILA = 'FILA',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  ENVIO_ATIVO = 'ENVIO_ATIVO',
  ENCERRADO = 'ENCERRADO',
  // Novos status para unificação com Demandas (Sprint 1)
  AGUARDANDO_CLIENTE = 'AGUARDANDO_CLIENTE',
  AGUARDANDO_INTERNO = 'AGUARDANDO_INTERNO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

export enum PrioridadeTicket {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export enum SeveridadeTicket {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export enum NivelAtendimentoTicket {
  N1 = 'N1',
  N2 = 'N2',
  N3 = 'N3',
}

export enum OrigemTicket {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WEBCHAT = 'WEBCHAT',
  API = 'API',
}

// Novo enum para tipos de ticket (unificação com Demandas - Sprint 1)
export enum TipoTicket {
  TECNICA = 'tecnica',
  COMERCIAL = 'comercial',
  FINANCEIRA = 'financeira',
  SUPORTE = 'suporte',
  RECLAMACAO = 'reclamacao',
  SOLICITACAO = 'solicitacao',
  OUTROS = 'outros',
}

@Entity('atendimento_tickets')
@Index(['empresaId'])
@Index(['status'])
@Index(['atendenteId'])
@Index(['severity'])
@Index(['assignedLevel'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', nullable: true })
  numero: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assunto: string;

  @Column({ type: 'varchar', length: 20, default: StatusTicket.FILA })
  status: StatusTicket;

  @Column({ type: 'varchar', length: 20, default: PrioridadeTicket.MEDIA })
  prioridade: PrioridadeTicket;

  @Column({ type: 'varchar', length: 20, name: 'severity', nullable: true, default: SeveridadeTicket.MEDIA })
  severity?: SeveridadeTicket;

  @Column({ type: 'varchar', length: 10, name: 'assigned_level', default: NivelAtendimentoTicket.N1 })
  assignedLevel: NivelAtendimentoTicket;

  @Column({ type: 'varchar', length: 255, name: 'escalation_reason', nullable: true })
  escalationReason?: string;

  @Column({ type: 'timestamp', name: 'escalation_at', nullable: true })
  escalationAt?: Date;

  @Column({ type: 'integer', name: 'sla_target_minutes', nullable: true })
  slaTargetMinutes?: number;

  @Column({ type: 'timestamp', name: 'sla_expires_at', nullable: true })
  slaExpiresAt?: Date;

  @Column({ type: 'uuid', name: 'canal_id', nullable: true })
  canalId: string;

  @Column({ type: 'uuid', name: 'fila_id', nullable: true })
  filaId: string;

  @ManyToOne(() => Fila, { nullable: true })
  @JoinColumn({ name: 'fila_id' })
  fila: Fila;

  @Column({ type: 'uuid', name: 'atendente_id', nullable: true })
  atendenteId: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  // ========================================
  // NOVOS CAMPOS - Sprint 1 (Unificação Ticket + Demanda)
  // ========================================

  @Column({ type: 'uuid', name: 'cliente_id', nullable: true })
  clienteId?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  titulo?: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo?: TipoTicket;

  @Column({ type: 'timestamp', name: 'data_vencimento', nullable: true })
  dataVencimento?: Date;

  @Column({ type: 'uuid', name: 'responsavel_id', nullable: true })
  responsavelId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel?: User;

  @Column({ type: 'uuid', name: 'autor_id', nullable: true })
  autorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'autor_id' })
  autor?: User;

  // ========================================
  // FIM DOS NOVOS CAMPOS
  // ========================================

  @Column({ type: 'uuid', name: 'departamento_id', nullable: true })
  departamentoId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'contato_telefone', nullable: true })
  contatoTelefone: string;

  @Column({ type: 'varchar', length: 255, name: 'contato_nome', nullable: true })
  contatoNome: string;

  @Column({ type: 'varchar', length: 255, name: 'contato_email', nullable: true })
  contatoEmail: string;

  @Column({ type: 'varchar', length: 512, name: 'contato_foto', nullable: true })
  contatoFoto: string;

  @Column({ type: 'timestamp', name: 'data_abertura', nullable: true })
  data_abertura: Date;

  @Column({ type: 'timestamp', name: 'data_primeira_resposta', nullable: true })
  data_primeira_resposta: Date;

  @Column({ type: 'timestamp', name: 'data_resolucao', nullable: true })
  data_resolucao: Date;

  @Column({ type: 'timestamp', name: 'data_fechamento', nullable: true })
  data_fechamento: Date;

  @Column({ type: 'timestamp', name: 'ultima_mensagem_em', nullable: true })
  ultima_mensagem_em: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relação Many-to-Many com Tags
  @ManyToMany(() => Tag, (tag) => tag.tickets)
  @JoinTable({
    name: 'ticket_tags',
    joinColumn: { name: 'ticketId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  // @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  // deletedAt: Date;
}
