import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';

/**
 * Entity Contato
 * Representa os contatos (funcionários) vinculados a um Cliente (empresa)
 * 
 * Exemplo de uso:
 * - Cliente: "Empresa XYZ Ltda"
 * - Contatos:
 *   • João Silva (Gerente Comercial)
 *   • Maria Santos (Compradora)
 *   • Pedro Costa (Financeiro)
 * 
 * Durante o atendimento, o agente pode identificar com qual contato
 * está falando e trocar via dropdown no painel de contexto.
 */
@Entity('contatos')
export class Contato {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  telefone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string; // Ex: "Gerente", "Comprador", "Financeiro", "Diretor"

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  /**
   * Indica se este é o contato principal da empresa
   * Usado para destacar o contato mais importante
   */
  @Column({ type: 'boolean', default: false })
  principal: boolean;

  /**
   * Relacionamento ManyToOne: Vários contatos pertencem a um Cliente
   */
  @ManyToOne(() => Cliente, {
    onDelete: 'CASCADE', // Se cliente for deletado, remove contatos
    nullable: false,
  })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column({ type: 'uuid' })
  clienteId: string;

  /**
   * Observações sobre o contato
   * Ex: "Prefere contato por email", "Disponível apenas pela manhã"
   */
  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Método auxiliar para formatar telefone
   * (11) 99999-9999
   */
  formatarTelefone(): string {
    const numeros = this.telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substr(0, 2)}) ${numeros.substr(2, 5)}-${numeros.substr(7)}`;
    }
    return this.telefone;
  }

  /**
   * Retorna nome completo com cargo
   * Ex: "João Silva (Gerente Comercial)"
   */
  getNomeCompleto(): string {
    return this.cargo ? `${this.nome} (${this.cargo})` : this.nome;
  }
}
