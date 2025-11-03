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
import { NucleoAtendimento } from './nucleo-atendimento.entity';
import { Departamento } from './departamento.entity';

/**
 * Atribuição direta de um atendente a um núcleo ou departamento
 * Tem prioridade sobre atribuições via equipe
 */
@Entity('atendente_atribuicoes')
export class AtendenteAtribuicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'atendente_id' })
  atendenteId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atendente_id' })
  atendente: User;

  // ===================================================================
  // Atribuição: Núcleo OU Departamento (pelo menos um deve estar preenchido)
  // ===================================================================

  @Column({ type: 'uuid', name: 'nucleo_id', nullable: true })
  nucleoId: string | null;

  @ManyToOne(() => NucleoAtendimento, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'nucleo_id' })
  nucleo: NucleoAtendimento | null;

  @Column({ type: 'uuid', name: 'departamento_id', nullable: true })
  departamentoId: string | null;

  @ManyToOne(() => Departamento, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento | null;

  // ===================================================================
  // Prioridade (0 = maior prioridade)
  // ===================================================================

  @Column({ type: 'integer', default: 0 })
  prioridade: number;

  // ===================================================================
  // Status
  // ===================================================================

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  // ===================================================================
  // Auditoria
  // ===================================================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
