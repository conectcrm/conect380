import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NucleoAtendimento } from '../../triagem/entities/nucleo-atendimento.entity';
import { Departamento } from '../../triagem/entities/departamento.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { FilaAtendente } from './fila-atendente.entity';

export enum EstrategiaDistribuicao {
  ROUND_ROBIN = 'ROUND_ROBIN',
  MENOR_CARGA = 'MENOR_CARGA',
  PRIORIDADE = 'PRIORIDADE',
}

@Entity('filas')
@Index(['empresaId'])
export class Fila {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresaId' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  /**
   * ========================================
   * NOVOS CAMPOS (consolidação Equipe → Fila)
   * ========================================
   */

  /**
   * Cor da fila (formato HEX: #RRGGBB)
   * Utilizado para identificação visual no frontend
   */
  @Column({ type: 'varchar', length: 7, nullable: true })
  cor: string;

  /**
   * Ícone da fila (nome do ícone Lucide React)
   * Ex: 'Users', 'Headphones', 'Shield'
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  icone: string;

  /**
   * Núcleo de atendimento associado à fila
   * Ex: Suporte Técnico, Comercial, Financeiro
   */
  @Column({ type: 'uuid', name: 'nucleoId', nullable: true })
  nucleoId: string;

  @ManyToOne(() => NucleoAtendimento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'nucleoId' })
  nucleo: NucleoAtendimento;

  /**
   * Departamento associado à fila
   * Ex: TI, Vendas, Cobrança
   */
  @Column({ type: 'uuid', name: 'departamentoId', nullable: true })
  departamentoId: string;

  @ManyToOne(() => Departamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departamentoId' })
  departamento: Departamento;

  /**
   * ========================================
   * CAMPOS ORIGINAIS DA FILA
   * ========================================
   */

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'integer', default: 0 })
  ordem: number;

  @Column({ type: 'jsonb', nullable: true })
  horarioAtendimento: any;

  /**
   * Estratégia de distribuição de tickets
   * ROUND_ROBIN: Rotação circular entre atendentes
   * MENOR_CARGA: Atribui para quem tem menos tickets
   * PRIORIDADE: Atribui baseado na prioridade configurada
   */
  @Column({
    name: 'estrategia_distribuicao',
    type: 'enum',
    enum: EstrategiaDistribuicao,
    default: EstrategiaDistribuicao.ROUND_ROBIN,
  })
  estrategiaDistribuicao: EstrategiaDistribuicao;

  /**
   * Capacidade máxima de tickets por atendente nesta fila
   */
  @Column({ name: 'capacidade_maxima', type: 'integer', default: 10 })
  capacidadeMaxima: number;

  /**
   * Se true, tickets são distribuídos automaticamente
   * Se false, aguardam atribuição manual
   */
  @Column({ name: 'distribuicao_automatica', type: 'boolean', default: false })
  distribuicaoAutomatica: boolean;

  /**
   * Configurações adicionais da fila (JSONB)
   * Ex: tempoMaximoEspera, prioridadePadrao, notificarAposMinutos
   */
  @Column({ type: 'jsonb', nullable: true })
  configuracoes: any;

  @OneToMany(() => FilaAtendente, (filaAtendente) => filaAtendente.fila)
  atendentes: FilaAtendente[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
