import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

/**
 * Entity para demandas/tarefas relacionadas a clientes
 *
 * Uma demanda pode estar vinculada a:
 * - Um cliente específico (clienteId)
 * - Um ticket de atendimento (ticketId)
 * - Um contato por telefone (fallback quando não há cliente cadastrado)
 *
 * Campos:
 * - id: UUID único da demanda
 * - clienteId: ID do cliente (opcional, pode não ter cliente cadastrado)
 * - ticketId: ID do ticket relacionado (opcional)
 * - contatoTelefone: Telefone do contato (fallback)
 * - empresaId: ID da empresa (multi-tenant)
 * - titulo: Título resumido da demanda
 * - descricao: Descrição detalhada
 * - tipo: Tipo da demanda (tecnica, comercial, financeira, suporte, reclamacao, solicitacao, outros)
 * - prioridade: Prioridade (baixa, media, alta, urgente)
 * - status: Status atual (aberta, em_andamento, aguardando, concluida, cancelada)
 * - dataVencimento: Data limite para conclusão (opcional)
 * - dataConclusao: Data de conclusão real (preenchida ao concluir)
 * - responsavelId: ID do usuário responsável pela demanda
 * - responsavel: Relação com o usuário responsável
 * - autorId: ID do usuário que criou a demanda
 * - autor: Relação com o usuário que criou
 * - createdAt: Data de criação (automático)
 * - updatedAt: Data da última atualização (automático)
 */
@Entity('atendimento_demandas')
export class Demanda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  clienteId?: string;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId?: string;

  @Column({ name: 'contato_telefone', type: 'varchar', length: 20, nullable: true })
  contatoTelefone?: string;

  @Column({ name: 'empresa_id', type: 'uuid', nullable: false })
  empresaId: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'outros',
    comment:
      'Tipo da demanda: tecnica, comercial, financeira, suporte, reclamacao, solicitacao, outros',
  })
  tipo:
    | 'tecnica'
    | 'comercial'
    | 'financeira'
    | 'suporte'
    | 'reclamacao'
    | 'solicitacao'
    | 'outros';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'media',
    comment: 'Prioridade: baixa, media, alta, urgente',
  })
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';

  @Column({
    type: 'varchar',
    length: 30,
    default: 'aberta',
    comment: 'Status: aberta, em_andamento, aguardando, concluida, cancelada',
  })
  status: 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';

  @Column({ name: 'data_vencimento', type: 'timestamp', nullable: true })
  dataVencimento?: Date;

  @Column({ name: 'data_conclusao', type: 'timestamp', nullable: true })
  dataConclusao?: Date;

  @Column({ name: 'responsavel_id', type: 'uuid', nullable: true })
  responsavelId?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel?: User;

  @Column({ name: 'autor_id', type: 'uuid', nullable: false })
  autorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'autor_id' })
  autor?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
