import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Plano } from './plano.entity';
import { ModuloSistema } from './modulo-sistema.entity';

@Entity('planos_modulos')
export class PlanoModulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relacionamentos
  @ManyToOne(() => Plano, (plano) => plano.modulosInclusos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plano_id' })
  plano: Plano;

  @ManyToOne(() => ModuloSistema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modulo_id' })
  modulo: ModuloSistema;

  @CreateDateColumn()
  criadoEm: Date;
}
