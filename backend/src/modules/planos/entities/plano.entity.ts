import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AssinaturaEmpresa } from './assinatura-empresa.entity';
import { PlanoModulo } from './plano-modulo.entity';

@Entity('planos')
export class Plano {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 50, unique: true })
  codigo: string; // starter, professional, enterprise

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column({ type: 'int', default: 1 })
  limiteUsuarios: number;

  @Column({ type: 'int', default: 1000 })
  limiteClientes: number;

  @Column({ type: 'bigint', default: 5368709120 }) // 5GB em bytes
  limiteStorage: number;

  @Column({ type: 'int', default: 1000 })
  limiteApiCalls: number; // por hora

  @Column({ type: 'boolean', default: false })
  whiteLabel: boolean;

  @Column({ type: 'boolean', default: false })
  suportePrioritario: boolean;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'int', default: 0 })
  ordem: number; // para ordenação na apresentação

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  // Relacionamentos
  @OneToMany(() => AssinaturaEmpresa, assinatura => assinatura.plano)
  assinaturas: AssinaturaEmpresa[];

  @OneToMany(() => PlanoModulo, planoModulo => planoModulo.plano)
  modulosInclusos: PlanoModulo[];
}
