import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { Ticket } from './ticket.entity';

export enum TipoCanal {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  WEBCHAT = 'webchat',
}

export enum StatusCanal {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  CONFIGURANDO = 'configurando',
  ERRO = 'erro',
}

@Entity('atendimento_canais') // ✅ Nome correto da tabela
@Index(['empresaId', 'tipo'])
@Index(['empresaId', 'status'])
export class Canal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    name: 'empresa_id', // ✅ Nome correto no banco: empresa_id (snake_case)
  })
  empresaId: string;

  // @ManyToOne(() => Empresa)
  // @JoinColumn({ name: 'empresaId' })
  // empresa: Empresa;

  @Column({
    type: 'varchar',
    length: 50,
  })
  nome: string;

  @Column({
    type: 'enum',
    enum: TipoCanal,
  })
  tipo: TipoCanal;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'provedor', // ✅ CORRIGIDO: banco usa 'provedor' em português
    comment: 'whatsapp_business_api, twilio, telegram_bot_api, sendgrid, meta_graph_api',
  })
  provider: string;

  @Column({
    type: 'enum',
    enum: StatusCanal,
    default: StatusCanal.CONFIGURANDO,
  })
  status: StatusCanal;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'config', // ✅ Mapear para coluna 'config' no banco
    comment: 'Configurações específicas do provider (tokens, credenciais, etc)',
  })
  configuracao: Record<string, any>;

  // @Column({
  //   type: 'text',
  //   nullable: true,
  //   name: 'webhook_url',
  //   comment: 'URL para receber webhooks deste canal',
  // })
  // webhookUrl: string;

  // @Column({
  //   type: 'text',
  //   nullable: true,
  //   name: 'webhook_secret',
  //   comment: 'Secret para validar webhooks',
  // })
  // webhookSecret: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  ativo: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'horario_atendimento',
  })
  horarioAtendimento: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
    name: 'mensagem_ausencia',
  })
  mensagemAusencia: string;

  @Column({
    type: 'boolean',
    default: false,
    name: 'auto_resposta_ativa',
  })
  autoRespostaAtiva: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'ultima_sincronizacao',
  })
  ultimaSincronizacao: Date;

  // Campos comentados - não existem no banco ainda
  // @Column({
  //   type: 'uuid',
  //   nullable: true,
  //   name: 'fila_padrao_id',
  //   comment: 'Fila padrão para tickets deste canal',
  // })
  // filaPadraoId: string;

  // // Alias para compatibilidade
  // get filaId(): string {
  //   return this.filaPadraoId;
  // }

  // @Column({
  //   type: 'boolean',
  //   default: true,
  //   name: 'auto_resposta_ativa',
  //   comment: 'Habilita respostas automáticas via IA',
  // })
  // autoRespostaAtiva: boolean;

  // // Alias para compatibilidade
  // get aiAutomatica(): boolean {
  //   return this.autoRespostaAtiva;
  // }

  // Alias para ativo (status === 'ativo')
  // get ativo(): boolean {
  //   return this.status === StatusCanal.ATIVO;
  // }

  // set ativo(value: boolean) {
  //   this.status = value ? StatusCanal.ATIVO : StatusCanal.INATIVO;
  // }

  // @Column({
  //   type: 'text',
  //   nullable: true,
  //   name: 'mensagem_boas_vindas',
  //   comment: 'Mensagem de boas-vindas do bot',
  // })
  // mensagemBoasVindas: string;

  // @Column({
  //   type: 'text',
  //   nullable: true,
  //   name: 'mensagem_fora_horario',
  //   comment: 'Mensagem quando fora do horário de atendimento',
  // })
  // mensagemForaHorario: string;

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  //   name: 'horario_atendimento',
  //   comment: 'Horários de funcionamento por dia da semana',
  // })
  // horarioAtendimento: {
  //   [key: string]: {
  //     inicio: string;
  //     fim: string;
  //     ativo: boolean;
  //   };
  // };

  // @Column({
  //   type: 'jsonb',
  //   nullable: true,
  //   name: 'metricas',
  //   comment: 'Métricas agregadas do canal',
  // })
  // metricas: {
  //   mensagensRecebidas?: number;
  //   mensagensEnviadas?: number;
  //   ticketsAbertos?: number;
  //   ticketsFechados?: number;
  //   tempoMedioResposta?: number;
  // };

  // @OneToMany(() => Ticket, (ticket) => ticket.canal)
  // tickets: Ticket[];

  @CreateDateColumn({
    name: 'created_at', // ✅ Snake case correto
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at', // ✅ Snake case correto
  })
  updatedAt: Date;

  // @DeleteDateColumn({
  //   name: 'deleted_at',  // ❌ Coluna não existe no banco
  //   nullable: true,
  // })
  // deletedAt: Date;
}
