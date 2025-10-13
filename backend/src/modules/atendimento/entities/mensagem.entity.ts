import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum TipoMensagem {
  TEXTO = 'TEXTO',
  IMAGEM = 'IMAGEM',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENTO = 'DOCUMENTO',
  LOCALIZACAO = 'LOCALIZACAO',
}

export enum RemetenteMensagem {
  CLIENTE = 'CLIENTE',
  ATENDENTE = 'ATENDENTE',
  SISTEMA = 'SISTEMA',
  BOT = 'BOT',
}

// Alias para compatibilidade com código antigo
export const RemetenteEnum = RemetenteMensagem;

export enum StatusMensagem {
  ENVIADA = 'ENVIADA',
  ENTREGUE = 'ENTREGUE',
  LIDA = 'LIDA',
  ERRO = 'ERRO',
}

@Entity('atendimento_mensagens')
@Index(['ticketId'])
export class Mensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'ticket_id' })
  ticketId: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: string;

  @Column({ type: 'text' })
  conteudo: string;

  @Column({ type: 'varchar', length: 20, name: 'remetente_tipo' })
  remetente: string;

  // @Column({ type: 'varchar', length: 20, default: 'ENVIADA' })
  // status: string;

  @Column({ type: 'jsonb', nullable: true, name: 'anexos' })
  midia: any;

  @Column({ type: 'varchar', length: 255, name: 'identificador_externo', nullable: true })
  idExterno: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // @UpdateDateColumn({ name: 'updated_at' })
  // updatedAt: Date;

  // @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  // deletedAt: Date;
}
