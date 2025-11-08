import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

interface HorarioFuncionamento {
  inicio: string;
  fim: string;
  ativo: boolean;
}

interface HorariosFuncionamento {
  segunda: HorarioFuncionamento;
  terca: HorarioFuncionamento;
  quarta: HorarioFuncionamento;
  quinta: HorarioFuncionamento;
  sexta: HorarioFuncionamento;
  sabado: HorarioFuncionamento;
  domingo: HorarioFuncionamento;
}

@Entity('sla_configs')
export class SlaConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // Prioridade: baixa, normal, alta, urgente
  @Column({ type: 'varchar', length: 20 })
  prioridade: string;

  // Canal: whatsapp, email, chat, telefone, todos
  @Column({ type: 'varchar', length: 50, nullable: true })
  canal: string;

  // Tempos em MINUTOS
  @Column({ type: 'int' })
  tempoRespostaMinutos: number; // Tempo para primeira resposta

  @Column({ type: 'int' })
  tempoResolucaoMinutos: number; // Tempo para resolução completa

  // Horários de funcionamento (JSONB para PostgreSQL)
  @Column({ type: 'jsonb', nullable: true })
  horariosFuncionamento: HorariosFuncionamento;

  // Configurações de alerta
  @Column({ type: 'int', default: 80 })
  alertaPercentual: number; // Alertar quando atingir X% do tempo

  @Column({ type: 'boolean', default: true })
  notificarEmail: boolean;

  @Column({ type: 'boolean', default: true })
  notificarSistema: boolean;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'uuid' })
  empresaId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
