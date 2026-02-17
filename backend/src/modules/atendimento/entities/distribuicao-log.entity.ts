import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/user.entity';
import { Fila } from './fila.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

/**
 * Log de Distribuição de Tickets
 *
 * Registra cada distribuição automática para auditoria,
 * métricas e troubleshooting.
 */
@Entity('distribuicao_log')
export class DistribuicaoLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  ticketId: string;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column('uuid')
  atendenteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'atendenteId' })
  atendente: User;

  @Column('uuid')
  filaId: string;

  @ManyToOne(() => Fila)
  @JoinColumn({ name: 'filaId' })
  fila: Fila;

  /**
   * Algoritmo usado para distribuição
   */
  @Column({ type: 'varchar', length: 50 })
  algoritmo: 'round-robin' | 'menor-carga' | 'skills' | 'hibrido';

  /**
   * Motivo detalhado da distribuição
   * Ex: "menor-carga: 2 tickets ativos", "skill-match: suporte-tecnico nível 4"
   */
  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  /**
   * Carga do atendente no momento da distribuição
   * (número de tickets ativos)
   */
  @Column({ type: 'int', default: 0 })
  cargaAtendente: number;

  /**
   * Se true, foi uma realocação (não primeira distribuição)
   */
  @Column({ type: 'boolean', default: false })
  realocacao: boolean;

  /**
   * Motivo da realocação (se aplicável)
   * Ex: "timeout de 30 minutos", "atendente ficou offline"
   */
  @Column({ type: 'text', nullable: true })
  motivoRealocacao: string | null;

  @CreateDateColumn()
  timestamp: Date;
}
