import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Equipe } from './equipe.entity';

/**
 * Tabela de relacionamento Many-to-Many entre Atendentes e Equipes
 * Permite que um atendente pertença a múltiplas equipes
 * e uma equipe tenha múltiplos atendentes
 */
@Entity('atendente_equipes')
export class AtendenteEquipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'atendente_id' })
  atendenteId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atendente_id' })
  atendente: User;

  @Column({ type: 'uuid', name: 'equipe_id' })
  equipeId: string;

  @ManyToOne(() => Equipe, (equipe) => equipe.atendenteEquipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipe_id' })
  equipe: Equipe;

  // ===================================================================
  // Função na equipe
  // ===================================================================

  @Column({ type: 'varchar', length: 50, default: 'membro' })
  funcao: string; // 'lider', 'membro', 'supervisor', etc.

  // ===================================================================
  // Auditoria
  // ===================================================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
