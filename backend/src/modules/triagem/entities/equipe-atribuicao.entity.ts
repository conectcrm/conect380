import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Equipe } from './equipe.entity';
import { NucleoAtendimento } from './nucleo-atendimento.entity';
import { Departamento } from './departamento.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

/**
 * Atribuição de uma equipe a um núcleo ou departamento
 * Todos os membros da equipe herdam essa atribuição
 */
@Entity('equipe_atribuicoes')
export class EquipeAtribuicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid', name: 'equipe_id' })
  equipeId: string;

  @ManyToOne(() => Equipe, (equipe) => equipe.atribuicoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipe_id' })
  equipe: Equipe;

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
