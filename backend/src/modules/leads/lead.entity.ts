import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Oportunidade } from '../oportunidades/oportunidade.entity';

export enum StatusLead {
  NOVO = 'novo',
  CONTATADO = 'contatado',
  QUALIFICADO = 'qualificado',
  DESQUALIFICADO = 'desqualificado',
  CONVERTIDO = 'convertido',
}

export enum OrigemLead {
  FORMULARIO = 'formulario',
  IMPORTACAO = 'importacao',
  API = 'api',
  WHATSAPP = 'whatsapp',
  MANUAL = 'manual',
  INDICACAO = 'indicacao',
  OUTRO = 'outro',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Dados Básicos
  @Column({ length: 255 })
  nome: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  telefone: string;

  @Column({ length: 255, nullable: true })
  empresa_nome: string; // Nome da empresa do lead

  // Qualificação
  @Column({
    type: 'varchar',
    default: StatusLead.NOVO,
  })
  status: StatusLead;

  @Column({ type: 'int', default: 0 })
  score: number; // 0-100 (qualificação automática)

  @Column({ type: 'varchar', nullable: true })
  origem: OrigemLead;

  // Contexto
  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'jsonb', nullable: true })
  campos_customizados: any;

  // Relacionamentos
  @Column({ nullable: true })
  responsavel_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: User;

  // Conversão
  @Column({ nullable: true })
  oportunidade_id: string;

  @ManyToOne(() => Oportunidade, { nullable: true })
  @JoinColumn({ name: 'oportunidade_id' })
  oportunidade: Oportunidade;

  @Column({ type: 'timestamp', nullable: true })
  convertido_em: Date;

  // Auditoria
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
