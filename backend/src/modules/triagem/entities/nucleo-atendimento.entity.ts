import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { User } from '../../users/user.entity';

export interface HorarioFuncionamento {
  seg?: { inicio: string; fim: string };
  ter?: { inicio: string; fim: string };
  qua?: { inicio: string; fim: string };
  qui?: { inicio: string; fim: string };
  sex?: { inicio: string; fim: string };
  sab?: { inicio: string; fim: string };
  dom?: { inicio: string; fim: string };
}

export type TipoDistribuicao = 'round_robin' | 'load_balancing' | 'skill_based' | 'manual';

@Entity('nucleos_atendimento')
export class NucleoAtendimento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ===================================================================
  // Identificação
  // ===================================================================
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  cor: string;

  @Column({ type: 'varchar', length: 50, default: 'headset' })
  icone: string;

  // ===================================================================
  // Status e Configurações
  // ===================================================================
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'boolean', default: true, name: 'visivel_no_bot' })
  visivelNoBot: boolean;

  @Column({ type: 'integer', default: 0 })
  prioridade: number;

  // ===================================================================
  // Horário de Funcionamento
  // ===================================================================
  @Column({ type: 'jsonb', nullable: true, name: 'horario_funcionamento' })
  horarioFuncionamento: HorarioFuncionamento;

  @Column({ type: 'varchar', length: 50, default: 'America/Sao_Paulo' })
  timezone: string;

  // ===================================================================
  // SLA e Métricas
  // ===================================================================
  @Column({ type: 'integer', default: 60, name: 'sla_resposta_minutos' })
  slaRespostaMinutos: number;

  @Column({ type: 'integer', default: 24, name: 'sla_resolucao_horas' })
  slaResolucaoHoras: number;

  @Column({ type: 'integer', default: 0, name: 'tempo_medio_atendimento_minutos' })
  tempoMedioAtendimentoMinutos: number;

  // ===================================================================
  // Equipe
  // ===================================================================
  @Column({ type: 'uuid', array: true, default: '{}', name: 'atendentes_ids' })
  atendentesIds: string[];

  @Column({ type: 'uuid', nullable: true, name: 'supervisor_id' })
  supervisorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: User;

  @Column({ type: 'integer', default: 50, name: 'capacidade_maxima_tickets' })
  capacidadeMaximaTickets: number;

  // ===================================================================
  // Roteamento
  // ===================================================================
  @Column({
    type: 'varchar',
    length: 30,
    default: 'round_robin',
    name: 'tipo_distribuicao'
  })
  tipoDistribuicao: TipoDistribuicao;

  // ===================================================================
  // Mensagens Automáticas
  // ===================================================================
  @Column({ type: 'text', nullable: true, name: 'mensagem_boas_vindas' })
  mensagemBoasVindas: string;

  @Column({ type: 'text', nullable: true, name: 'mensagem_fora_horario' })
  mensagemForaHorario: string;

  @Column({ type: 'text', nullable: true, name: 'mensagem_transferencia' })
  mensagemTransferencia: string;

  @Column({ type: 'text', nullable: true, name: 'mensagem_aguarde' })
  mensagemAguarde: string;

  // ===================================================================
  // Estatísticas (cache)
  // ===================================================================
  @Column({ type: 'integer', default: 0, name: 'total_tickets_abertos' })
  totalTicketsAbertos: number;

  @Column({ type: 'integer', default: 0, name: 'total_tickets_resolvidos' })
  totalTicketsResolvidos: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'taxa_satisfacao' })
  taxaSatisfacao: number;

  // ===================================================================
  // Auditoria
  // ===================================================================
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;

  // ===================================================================
  // Métodos Auxiliares
  // ===================================================================

  /**
   * Verifica se o núcleo está em horário de funcionamento
   */
  estaEmHorarioFuncionamento(dataHora: Date = new Date()): boolean {
    if (!this.horarioFuncionamento || Object.keys(this.horarioFuncionamento).length === 0) {
      return true; // Sem horário configurado, considerar disponível
    }

    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaAtual = diasSemana[dataHora.getDay()];

    const horario = this.horarioFuncionamento[diaAtual];
    if (!horario) return false; // Dia sem atendimento

    const horaAtual = dataHora.getHours() * 60 + dataHora.getMinutes();
    const [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
    const [horaFim, minFim] = horario.fim.split(':').map(Number);

    const minutoInicio = horaInicio * 60 + minInicio;
    const minutoFim = horaFim * 60 + minFim;

    return horaAtual >= minutoInicio && horaAtual <= minutoFim;
  }

  /**
   * Retorna próximo atendente disponível baseado na estratégia
   */
  proximoAtendenteDisponivel(cargaAtual: Record<string, number>): string | null {
    if (!this.atendentesIds || this.atendentesIds.length === 0) return null;

    switch (this.tipoDistribuicao) {
      case 'round_robin':
        // Retorna o próximo na fila circular
        return this.atendentesIds[0];

      case 'load_balancing':
        // Retorna o atendente com menos tickets
        const menosOcupado = this.atendentesIds.reduce((prev, curr) => {
          const cargaPrev = cargaAtual[prev] || 0;
          const cargaCurr = cargaAtual[curr] || 0;
          return cargaCurr < cargaPrev ? curr : prev;
        });
        return menosOcupado;

      case 'manual':
        // Não distribui automaticamente
        return null;

      default:
        return this.atendentesIds[0];
    }
  }
}
