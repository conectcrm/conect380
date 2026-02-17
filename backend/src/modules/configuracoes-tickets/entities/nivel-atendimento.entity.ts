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
 * Entity: Níveis de Atendimento Configuráveis
 *
 * Substitui o enum NivelAtendimentoTicket por sistema extensível.
 * Permite adicionar N1, N2, N3, N4, N5... dinamicamente por empresa.
 *
 * Requisito: "Nível de atendimento modelado de forma extensível"
 */
@Entity('niveis_atendimento')
@Index(['empresaId', 'codigo'], { unique: true })
@Index(['empresaId', 'ordem'])
export class NivelAtendimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Código único do nível (ex: 'N1', 'N2', 'N3', 'N4')
   * Usado para referência técnica e cálculo de SLA
   */
  @Column({ type: 'varchar', length: 10 })
  codigo: string;

  /**
   * Nome descritivo do nível (ex: 'Suporte Básico', 'Suporte Avançado')
   * Exibido no frontend
   */
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  /**
   * Descrição detalhada do que esse nível abrange
   */
  @Column({ type: 'text', nullable: true })
  descricao: string;

  /**
   * Ordem de exibição (menor = mais prioritário)
   * Ex: N1=1, N2=2, N3=3
   */
  @Column({ type: 'integer' })
  ordem: number;

  /**
   * Se o nível está ativo e pode ser selecionado
   */
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * Cor hexadecimal para identificação visual (opcional)
   * Ex: '#159A9C'
   */
  @Column({ type: 'varchar', length: 7, nullable: true })
  cor: string;

  /**
   * Empresa proprietária deste nível
   * Cada empresa pode ter seus próprios níveis personalizados
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
