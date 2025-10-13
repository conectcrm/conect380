import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum StatusAtendente {
  DISPONIVEL = 'DISPONIVEL',
  OCUPADO = 'OCUPADO',
  AUSENTE = 'AUSENTE',
  OFFLINE = 'OFFLINE',
}

@Entity('atendentes')
@Index(['empresaId'])
export class Atendente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'uuid', name: 'usuarioId', nullable: true })
  usuarioId: string;

  @Column({ type: 'uuid', name: 'empresaId' })
  empresaId: string;

  @Column({ type: 'varchar', length: 20, default: 'DISPONIVEL' })
  status: string;

  @Column({ type: 'integer', default: 5, name: 'capacidadeMaxima' })
  capacidadeMaxima: number;

  @Column({ type: 'integer', default: 0, name: 'ticketsAtivos' })
  ticketsAtivos: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt' })
  deletedAt: Date;
}
