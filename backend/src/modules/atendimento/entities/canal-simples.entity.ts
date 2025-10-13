import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('canais')
export class CanalSimples {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  tipo: string;

  @Column({ name: 'empresaId' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ default: false })
  ativo: boolean;

  @Column({ type: 'jsonb', nullable: true })
  configuracao: any;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true, name: 'webhook_url' })
  webhook_url: string;

  @Column({ nullable: true, name: 'webhook_secret' })
  webhook_secret: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
