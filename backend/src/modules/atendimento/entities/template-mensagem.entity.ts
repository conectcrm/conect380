import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('atendimento_templates')
export class TemplateMensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  atalho: string; // Ex: "/bv" para boas-vindas

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string; // Ex: "Boas-vindas", "Despedida", "Instruções"

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
