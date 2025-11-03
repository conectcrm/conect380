import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { NucleoAtendimento } from './nucleo-atendimento.entity';
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

@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'nucleo_id', type: 'uuid' })
  nucleoId: string;

  @ManyToOne(() => NucleoAtendimento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nucleo_id' })
  nucleo: NucleoAtendimento;

  // ===================================================================
  // Identificação
  // ===================================================================
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 7, default: '#6366F1' })
  cor: string;

  @Column({ type: 'varchar', length: 50, default: 'briefcase' })
  icone: string;

  // ===================================================================
  // Status
  // ===================================================================
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'boolean', default: true, name: 'visivel_no_bot' })
  visivelNoBot: boolean;

  @Column({ type: 'integer', default: 0 })
  ordem: number;

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

  // ===================================================================
  // Horário (opcional - herda do núcleo se null)
  // ===================================================================
  @Column({ type: 'jsonb', nullable: true, name: 'horario_funcionamento' })
  horarioFuncionamento: HorarioFuncionamento;

  // ===================================================================
  // SLA (opcional - herda do núcleo se null)
  // ===================================================================
  @Column({ type: 'integer', nullable: true, name: 'sla_resposta_minutos' })
  slaRespostaMinutos: number;

  @Column({ type: 'integer', nullable: true, name: 'sla_resolucao_horas' })
  slaResolucaoHoras: number;

  // ===================================================================
  // Mensagens Personalizadas
  // ===================================================================
  @Column({ type: 'text', nullable: true, name: 'mensagem_boas_vindas' })
  mensagemBoasVindas: string;

  @Column({ type: 'text', nullable: true, name: 'mensagem_transferencia' })
  mensagemTransferencia: string;

  // ===================================================================
  // Roteamento
  // ===================================================================
  @Column({ type: 'varchar', length: 30, default: 'round_robin', name: 'tipo_distribuicao' })
  tipoDistribuicao: TipoDistribuicao;

  @Column({ type: 'integer', default: 30, name: 'capacidade_maxima_tickets' })
  capacidadeMaximaTickets: number;

  // ===================================================================
  // Skills para roteamento inteligente
  // ===================================================================
  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

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
   * Verifica se o departamento está em horário de funcionamento
   * Herda do núcleo se não tiver horário próprio
   */
  estaEmHorarioFuncionamento(dataHora: Date = new Date()): boolean {
    if (!this.horarioFuncionamento || Object.keys(this.horarioFuncionamento).length === 0) {
      // Sem horário próprio, delegar ao núcleo
      return true;
    }

    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaAtual = diasSemana[dataHora.getDay()];

    const horario = this.horarioFuncionamento[diaAtual];
    if (!horario) return false;

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
        return this.atendentesIds[0];

      case 'load_balancing':
        const menosOcupado = this.atendentesIds.reduce((prev, curr) => {
          const cargaPrev = cargaAtual[prev] || 0;
          const cargaCurr = cargaAtual[curr] || 0;
          return cargaCurr < cargaPrev ? curr : prev;
        });
        return menosOcupado;

      case 'skill_based':
        // Implementação futura com matching de skills
        return this.atendentesIds[0];

      case 'manual':
        return null;

      default:
        return this.atendentesIds[0];
    }
  }

  /**
   * Verifica se departamento tem capacidade disponível
   */
  temCapacidadeDisponivel(ticketsAtuais: number): boolean {
    return ticketsAtuais < this.capacidadeMaximaTickets;
  }
}
