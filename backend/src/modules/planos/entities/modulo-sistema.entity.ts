import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('modulos_sistema')
export class ModuloSistema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 50, unique: true })
  codigo: string; // dashboard, clientes, propostas, contatos, etc.

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ length: 100, nullable: true })
  icone: string; // nome do ícone

  @Column({ length: 50, nullable: true })
  cor: string; // cor hexadecimal

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'boolean', default: false })
  essencial: boolean; // módulos que não podem ser desabilitados

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
