import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('sla_event_logs')
export class SlaEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @Column({ type: 'uuid', nullable: true })
  slaConfigId: string;

  // Tipo de evento: violacao, alerta, resolucao_no_prazo, escalacao
  @Column({ type: 'varchar', length: 50 })
  tipoEvento: string;

  // Status: em_risco, violado, cumprido
  @Column({ type: 'varchar', length: 30 })
  status: string;

  @Column({ type: 'int', nullable: true })
  tempoRespostaMinutos: number; // Tempo real que levou para responder

  @Column({ type: 'int', nullable: true })
  tempoResolucaoMinutos: number; // Tempo real para resolver

  @Column({ type: 'int', nullable: true })
  tempoLimiteMinutos: number; // Tempo limite configurado

  @Column({ type: 'int', nullable: true })
  percentualUsado: number; // % do tempo usado (ex: 85%)

  @Column({ type: 'text', nullable: true })
  detalhes: string;

  @Column({ type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @CreateDateColumn()
  createdAt: Date;
}
