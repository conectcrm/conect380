import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

export enum StatusCliente {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  CLIENTE = 'cliente',
  INATIVO = 'inativo',
}

export enum TipoCliente {
  PESSOA_FISICA = 'pessoa_fisica',
  PESSOA_JURIDICA = 'pessoa_juridica',
}

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'enum', enum: TipoCliente, default: TipoCliente.PESSOA_FISICA })
  tipo: TipoCliente;

  @Column({ name: 'documento', length: 20, nullable: true })
  documento: string;

  @Column({ type: 'varchar', nullable: true })
  endereco: string;

  @Column({ length: 100, nullable: true })
  cidade: string;

  @Column({ length: 2, nullable: true })
  estado: string;

  @Column({ length: 10, nullable: true })
  cep: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'text', name: 'avatar_url', nullable: true, select: false })
  avatar_url?: string | null;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa_rel: Empresa;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Campos legados mantidos para compatibilidade de tipagem em serviços existentes.
  empresa?: string;
  cargo?: string;
  origem?: string;
  tags?: string[];
  responsavel_id?: string;
  valor_estimado?: number;
  ultimo_contato?: Date;
  proximo_contato?: Date;
  status?: StatusCliente;
  avatar?: string;
  avatarUrl?: string;
}
