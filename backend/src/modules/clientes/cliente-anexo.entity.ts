import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('cliente_anexos')
@Index(['clienteId'])
@Index(['empresaId'])
@Index(['created_at'])
export class ClienteAnexo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId: string;

  @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ length: 255 })
  nome: string;

  @Column({ length: 120 })
  tipo: string;

  @Column({ type: 'bigint' })
  tamanho: number;

  @Column({ type: 'text' })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
