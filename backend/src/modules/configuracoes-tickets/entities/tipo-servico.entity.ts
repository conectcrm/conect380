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

/**
 * Entity: Tipos de Serviço Configuráveis
 * 
 * Substitui o enum TipoTicket por sistema gerenciado pelo gestor.
 * Permite adicionar/remover tipos como 'Bug', 'Melhoria', 'Atualização', etc.
 * 
 * Requisito: "Tipo do serviço deve ser configurável pelo gestor"
 */
@Entity('tipos_servico')
@Index(['empresaId', 'ordem'])
export class TipoServico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nome do tipo de serviço (ex: 'Bug', 'Melhoria', 'Atualização')
   */
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  /**
   * Descrição do tipo de serviço
   * Ajuda usuários a escolher o tipo correto
   */
  @Column({ type: 'text', nullable: true })
  descricao: string;

  /**
   * Cor hexadecimal para identificação visual
   * Ex: '#EF4444' para bugs, '#10B981' para melhorias
   */
  @Column({ type: 'varchar', length: 7, nullable: true })
  cor: string;

  /**
   * Ícone Lucide React (nome) para exibição
   * Ex: 'Bug', 'Sparkles', 'RefreshCw'
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  icone: string;

  /**
   * Ordem de exibição no dropdown
   */
  @Column({ type: 'integer', default: 0 })
  ordem: number;

  /**
   * Se o tipo está ativo e pode ser selecionado
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * Empresa proprietária deste tipo
   */
  @ManyToOne(() => Empresa, { nullable: false })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
