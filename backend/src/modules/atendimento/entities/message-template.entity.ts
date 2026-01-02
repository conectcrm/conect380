import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nome: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  atalho: string; // Atalho para uso rápido no chat (ex: /boas-vindas)

  @Column({ type: 'simple-json', nullable: true })
  variaveis: string[]; // Lista de variáveis disponíveis (ex: ['{{nome}}', '{{ticket}}', '{{empresa}}'])

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'varchar', length: 36 })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
