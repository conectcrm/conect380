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
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { NivelAtendimento } from './nivel-atendimento.entity';

/**
 * Entity: Status Customizados por Nível
 *
 * Substitui o enum StatusTicket por sistema configurável.
 * Cada nível pode ter seus próprios status personalizados.
 *
 * Requisito: "Status configuráveis vinculados a um nível"
 * Exemplo: N3 pode ter "Em Desenvolvimento", "Code Review", "Deploy"
 */
@Entity('status_customizados')
@Index(['empresaId', 'nivelId', 'ordem'])
export class StatusCustomizado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nome do status (ex: 'Em Atendimento', 'Aguardando Cliente')
   */
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  /**
   * Descrição do que esse status representa
   */
  @Column({ type: 'text', nullable: true })
  descricao: string;

  /**
   * Nível de atendimento ao qual este status pertence
   * Um status só pode ser usado em tickets do nível correspondente
   */
  @ManyToOne(() => NivelAtendimento, { nullable: false })
  @JoinColumn({ name: 'nivel_id' })
  nivel: NivelAtendimento;

  @Column({ name: 'nivel_id' })
  nivelId: string;

  /**
   * Cor hexadecimal para badge de status
   * Ex: '#10B981' (verde), '#EF4444' (vermelho)
   */
  @Column({ type: 'varchar', length: 7 })
  cor: string;

  /**
   * Ordem de exibição no dropdown
   * Define o fluxo lógico do status
   */
  @Column({ type: 'integer' })
  ordem: number;

  /**
   * Se este status indica finalização do ticket
   * Tickets com status finalizador não podem mais ser editados
   */
  @Column({ type: 'boolean', default: false })
  finalizador: boolean;

  /**
   * Se o status está ativo e pode ser selecionado
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * Empresa proprietária deste status
   */
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
