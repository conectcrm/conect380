import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { Ticket } from './ticket.entity';
import { User } from '../../users/user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

/**
 * Entity para armazenar o histórico de alterações de tickets
 * Registra quem alterou, quando e o que foi modificado
 */
@Entity('ticket_historico')
@Index(['ticketId'])
@Index(['usuarioId'])
@Index(['createdAt'])
export class TicketHistorico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'ticket_id' })
  ticketId: string;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @Column({ type: 'varchar', length: 100 })
  campo: string;

  @Column({ type: 'text', name: 'valor_anterior', nullable: true })
  valorAnterior: string;

  @Column({ type: 'text', name: 'valor_novo', nullable: true })
  valorNovo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
