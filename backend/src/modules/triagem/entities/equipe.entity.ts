import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { EquipeAtribuicao } from './equipe-atribuicao.entity';
import { AtendenteEquipe } from './atendente-equipe.entity';

/**
 * Entidade que representa uma equipe de atendimento
 * Utilizada para organizar atendentes em grupos lógicos
 */
@Entity('equipes')
export class Equipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ===================================================================
  // Identificação
  // ===================================================================

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // ===================================================================
  // Configurações visuais
  // ===================================================================

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  cor: string;

  @Column({ type: 'varchar', length: 50, default: 'users' })
  icone: string;

  // ===================================================================
  // Status
  // ===================================================================

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  // ===================================================================
  // Relacionamentos
  // ===================================================================

  @OneToMany(() => AtendenteEquipe, (ae) => ae.equipe)
  atendenteEquipes: AtendenteEquipe[];

  @OneToMany(() => EquipeAtribuicao, (ea) => ea.equipe)
  atribuicoes: EquipeAtribuicao[];

  // ===================================================================
  // Auditoria
  // ===================================================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
