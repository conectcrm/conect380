import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contrato } from './contrato.entity';
import { User } from '../../users/user.entity';

export enum TipoAssinatura {
  DIGITAL = 'digital',
  ELETRONICA = 'eletronica',
  PRESENCIAL = 'presencial',
}

export enum StatusAssinatura {
  PENDENTE = 'pendente',
  ASSINADO = 'assinado',
  REJEITADO = 'rejeitado',
  EXPIRADO = 'expirado',
}

@Entity('assinaturas_contrato')
export class AssinaturaContrato {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contratoId: number;

  @ManyToOne(() => Contrato, (contrato) => contrato.assinaturas)
  @JoinColumn({ name: 'contratoId' })
  contrato: Contrato;

  @Column()
  usuarioId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({
    type: 'enum',
    enum: TipoAssinatura,
    default: TipoAssinatura.DIGITAL,
  })
  tipo: TipoAssinatura;

  @Column({
    type: 'enum',
    enum: StatusAssinatura,
    default: StatusAssinatura.PENDENTE,
  })
  status: StatusAssinatura;

  @Column({ type: 'text', nullable: true })
  certificadoDigital: string;

  @Column({ type: 'text', nullable: true })
  hashAssinatura: string;

  @Column({ type: 'text', nullable: true })
  ipAssinatura: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp', nullable: true })
  dataAssinatura: Date;

  @Column({ type: 'text', nullable: true })
  motivoRejeicao: string;

  @Column({ type: 'json', nullable: true })
  metadados: {
    localizacao?: string;
    dispositivo?: string;
    navegador?: string;
    versaoApp?: string;
  };

  @Column({ type: 'text', nullable: true })
  tokenValidacao: string;

  @Column({ type: 'timestamp', nullable: true })
  dataEnvio: Date;

  @Column({ type: 'timestamp', nullable: true })
  dataExpiracao: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Métodos auxiliares
  isAssinado(): boolean {
    return this.status === StatusAssinatura.ASSINADO;
  }

  isPendente(): boolean {
    return this.status === StatusAssinatura.PENDENTE;
  }

  isExpirado(): boolean {
    if (this.status !== StatusAssinatura.PENDENTE) return false;
    return new Date() > this.dataExpiracao;
  }

  getTempoRestante(): number {
    if (this.status !== StatusAssinatura.PENDENTE) return 0;
    const agora = new Date();
    const expiracao = new Date(this.dataExpiracao);
    return Math.max(0, Math.ceil((expiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
