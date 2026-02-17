import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Fila } from './fila.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

/**
 * Configuração de Distribuição Automática de Tickets
 *
 * Define como tickets serão automaticamente atribuídos a atendentes
 * dentro de uma fila específica.
 */
@Entity('distribuicao_config')
export class DistribuicaoConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column('uuid')
  filaId: string;

  @ManyToOne(() => Fila, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'filaId' })
  fila: Fila;

  /**
   * Algoritmo de distribuição:
   * - 'round-robin': Revezamento circular entre atendentes
   * - 'menor-carga': Atribui para atendente com menos tickets ativos
   * - 'skills': Baseado em habilidades/competências
   * - 'hibrido': Combina skills + menor carga (recomendado)
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: 'round-robin',
  })
  algoritmo: 'round-robin' | 'menor-carga' | 'skills' | 'hibrido';

  /**
   * Se true, distribuição automática está ativa para esta fila
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * Número máximo de tickets simultâneos por atendente
   * Atendentes que atingirem este limite não receberão novos tickets
   */
  @Column({ type: 'int', default: 10 })
  capacidadeMaxima: number;

  /**
   * Se true, prioriza atendentes com status "online"
   * Atendentes "ausente" ou "offline" não receberão tickets
   */
  @Column({ type: 'boolean', default: true })
  priorizarOnline: boolean;

  /**
   * Se true, considera skills/competências do atendente
   * Usado nos algoritmos 'skills' e 'hibrido'
   */
  @Column({ type: 'boolean', default: false })
  considerarSkills: boolean;

  /**
   * Tempo em minutos para timeout de resposta
   * Se atendente não responder, ticket é realocado automaticamente
   */
  @Column({ type: 'int', default: 30 })
  tempoTimeoutMin: number;

  /**
   * Se true, permite overflow para fila backup quando todos atendentes
   * estão com capacidade máxima
   */
  @Column({ type: 'boolean', default: false })
  permitirOverflow: boolean;

  /**
   * ID da fila backup para overflow (opcional)
   */
  @Column({ type: 'uuid', nullable: true })
  filaBackupId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
