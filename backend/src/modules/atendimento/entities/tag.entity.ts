import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 7 })
  cor: string; // Formato hexadecimal: #RRGGBB

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relação Many-to-Many com Tickets
  @ManyToMany(() => Ticket, (ticket) => ticket.tags)
  tickets: Ticket[];
}
