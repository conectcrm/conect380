import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { Ticket } from './ticket.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

export enum TipoRelacionamento {
  RELACIONADO = 'relacionado',
  DUPLICADO = 'duplicado',
  BLOQUEADO = 'bloqueado',
}

/**
 * Entity para armazenar relacionamentos entre tickets
 * Permite vincular tickets relacionados, duplicados ou que bloqueiam outros
 */
@Entity('ticket_relacionamentos')
@Index(['ticketOrigemId'])
@Index(['ticketDestinoId'])
@Index(['tipo'])
@Unique(['ticketOrigemId', 'ticketDestinoId', 'tipo'])
export class TicketRelacionamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'ticket_origem_id' })
  ticketOrigemId: string;

  @Column({ type: 'uuid', name: 'ticket_destino_id' })
  ticketDestinoId: string;

  @Column({
    type: 'varchar',
    length: 20,
    enum: TipoRelacionamento,
  })
  tipo: TipoRelacionamento;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_origem_id' })
  ticketOrigem: Ticket;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_destino_id' })
  ticketDestino: Ticket;
}
