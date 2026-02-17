import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

/**
 * Skills/Habilidades de Atendentes
 *
 * Define competências específicas de cada atendente para
 * distribuição inteligente baseada em skills.
 *
 * Exemplos de skills:
 * - "suporte-tecnico"
 * - "vendas"
 * - "financeiro"
 * - "cobranca"
 * - "cancelamento"
 */
@Entity('atendente_skills')
export class AtendenteSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  atendenteId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atendenteId' })
  atendente: User;

  /**
   * Nome da skill/competência
   * Ex: "suporte-tecnico", "vendas", "financeiro"
   */
  @Column({ type: 'varchar', length: 100 })
  skill: string;

  /**
   * Nível de proficiência (1-5)
   * 1 = Básico
   * 2 = Intermediário
   * 3 = Avançado
   * 4 = Expert
   * 5 = Master
   */
  @Column({ type: 'int', default: 1 })
  nivel: number;

  /**
   * Se true, atendente está ativo para receber tickets desta skill
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
