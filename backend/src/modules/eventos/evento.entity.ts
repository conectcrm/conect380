import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TipoEvento {
  REUNIAO = 'reuniao',
  LIGACAO = 'ligacao',
  APRESENTACAO = 'apresentacao',
  VISITA = 'visita',
  FOLLOW_UP = 'follow-up',
  OUTRO = 'outro',
}

@Entity('evento')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ name: 'dataInicio', type: 'timestamp with time zone' })
  dataInicio: Date;

  @Column({ name: 'dataFim', type: 'timestamp with time zone', nullable: true })
  dataFim?: Date;

  @Column({ name: 'diaInteiro', default: false })
  diaInteiro: boolean;

  @Column({ length: 255, nullable: true })
  local?: string;

  @Column({
    type: 'enum',
    enum: TipoEvento,
    default: TipoEvento.REUNIAO,
  })
  tipo: TipoEvento;

  @Column({ length: 7, default: '#3B82F6' })
  cor: string;

  @Column({ name: 'clienteId', type: 'uuid', nullable: true })
  clienteId?: string;

  @Column({ name: 'usuarioId', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'empresaId', type: 'uuid' })
  empresaId: string;

  @CreateDateColumn({ name: 'criadoEm', type: 'timestamp with time zone' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizadoEm', type: 'timestamp with time zone' })
  atualizadoEm: Date;
}
