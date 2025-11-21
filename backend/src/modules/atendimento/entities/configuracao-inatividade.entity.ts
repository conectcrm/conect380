/**
 * ⚙️ Configuração de Fechamento Automático por Inatividade
 *
 * Define timeout de inatividade por empresa para fechar tickets automaticamente
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Departamento } from '../../triagem/entities/departamento.entity';

@Entity('atendimento_configuracao_inatividade')
@Index(['empresaId', 'departamentoId'], { unique: true }) // Unique por empresa E departamento
export class ConfiguracaoInatividade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  /**
   * Departamento específico (opcional)
   * Se NULL = configuração global da empresa
   * Se preenchido = configuração específica do departamento
   */
  @Column({ type: 'uuid', name: 'departamento_id', nullable: true })
  departamentoId: string | null;

  @ManyToOne(() => Departamento, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento | null;

  /**
   * Tempo em MINUTOS para considerar ticket inativo
   * Padrão: 1440 minutos (24 horas)
   */
  @Column({
    type: 'integer',
    name: 'timeout_minutos',
    default: 1440,
    comment: 'Tempo em minutos sem interação do cliente para fechar automaticamente',
  })
  timeoutMinutos: number;

  /**
   * Se deve enviar mensagem de aviso antes de fechar
   */
  @Column({
    type: 'boolean',
    name: 'enviar_aviso',
    default: true,
    comment: 'Enviar mensagem avisando que ticket será fechado por inatividade',
  })
  enviarAviso: boolean;

  /**
   * Tempo em MINUTOS para enviar aviso antes de fechar
   * Ex: 60 minutos antes do fechamento
   */
  @Column({
    type: 'integer',
    name: 'aviso_minutos_antes',
    default: 60,
    comment: 'Quantos minutos antes do fechamento enviar o aviso',
  })
  avisoMinutosAntes: number;

  /**
   * Mensagem personalizada de aviso
   */
  @Column({
    type: 'text',
    name: 'mensagem_aviso',
    nullable: true,
    comment: 'Mensagem enviada como aviso de fechamento iminente',
  })
  mensagemAviso: string;

  /**
   * Mensagem personalizada de fechamento
   */
  @Column({
    type: 'text',
    name: 'mensagem_fechamento',
    nullable: true,
    comment: 'Mensagem enviada ao fechar por inatividade',
  })
  mensagemFechamento: string;

  /**
   * Se está ativo (pode ser desativado temporariamente)
   */
  @Column({
    type: 'boolean',
    name: 'ativo',
    default: true,
    comment: 'Se o fechamento automático está ativo',
  })
  ativo: boolean;

  /**
   * Aplicar apenas em status específicos
   * Ex: ['AGUARDANDO', 'EM_ATENDIMENTO']
   */
  @Column({
    type: 'jsonb',
    name: 'status_aplicaveis',
    nullable: true,
    comment: 'Lista de status onde aplicar fechamento automático. Null = todos',
  })
  statusAplicaveis: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
