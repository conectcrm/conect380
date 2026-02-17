import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { Fila } from './fila.entity';

/**
 * Entity que representa a relação Many-to-Many entre Fila e User (Atendente)
 *
 * Permite configurar:
 * - Capacidade individual do atendente nesta fila
 * - Prioridade do atendente para receber tickets
 * - Se o atendente está ativo nesta fila
 */
@Entity('filas_atendentes')
@Index(['filaId', 'atendenteId'], { unique: true })
@Index(['filaId'])
@Index(['atendenteId'])
export class FilaAtendente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'filaId' })
  filaId: string;

  @ManyToOne(() => Fila, (fila) => fila.atendentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filaId' })
  fila: Fila;

  @Column({ type: 'uuid', name: 'atendenteId' })
  atendenteId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atendenteId' })
  atendente: User;

  /**
   * Capacidade máxima de tickets simultâneos para este atendente NESTA fila
   * Sobrescreve a capacidade global do atendente (User.capacidade_maxima)
   * Min: 1, Max: 50
   */
  @Column({
    type: 'integer',
    default: 10,
    comment: 'Tickets simultâneos que este atendente pode ter nesta fila',
  })
  capacidade: number;

  /**
   * Prioridade para distribuição de tickets
   * 1 = maior prioridade (recebe primeiro)
   * 10 = menor prioridade (recebe por último)
   *
   * Usado na estratégia PRIORIDADE e como desempate em outras
   */
  @Column({
    type: 'integer',
    default: 5,
    comment: '1=alta prioridade, 10=baixa prioridade',
  })
  prioridade: number;

  /**
   * Se o atendente está ativo NESTA fila
   * false = não receberá novos tickets desta fila
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
