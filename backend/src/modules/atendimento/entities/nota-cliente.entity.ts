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

/**
 * 📝 Entity: Notas do Cliente
 *
 * Permite que atendentes adicionem anotações importantes
 * sobre o cliente durante ou após atendimentos.
 *
 * Casos de uso:
 * - Observações sobre comportamento do cliente
 * - Preferências de atendimento
 * - Histórico de problemas recorrentes
 * - Informações sensíveis/importantes
 */
@Entity('atendimento_notas_cliente')
export class NotaCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * UUID do cliente (referência para módulo de clientes/CRM)
   * Pode ser null se a nota for vinculada apenas ao ticket
   */
  @Column({ type: 'uuid', name: 'cliente_id', nullable: true })
  clienteId: string | null;

  /**
   * UUID do ticket relacionado (opcional)
   * Permite associar a nota a um atendimento específico
   */
  @Column({ type: 'uuid', name: 'ticket_id', nullable: true })
  ticketId: string | null;

  /**
   * Telefone do contato (fallback quando não tem clienteId)
   * Permite criar notas mesmo sem cliente cadastrado
   */
  @Column({ type: 'varchar', length: 20, name: 'contato_telefone', nullable: true })
  contatoTelefone: string | null;

  /**
   * UUID da empresa (multi-tenant)
   */
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  /**
   * Conteúdo da nota (texto livre)
   */
  @Column({ type: 'text' })
  conteudo: string;

  /**
   * Flag para marcar notas importantes/destacadas
   * Notas importantes aparecem primeiro na listagem
   */
  @Column({ type: 'boolean', default: false })
  importante: boolean;

  /**
   * UUID do atendente que criou a nota
   */
  @Column({ type: 'uuid', name: 'autor_id' })
  autorId: string;

  /**
   * Relação com o usuário (atendente) que criou a nota
   */
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'autor_id' })
  autor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
