import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';

@Entity('modulos_empresas')
export class ModuloEmpresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Nome do módulo: crm, atendimento, comercial, etc.'
  })
  modulo: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se o módulo está ativo para esta empresa'
  })
  ativo: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Limites de uso: usuarios, leads, storage_mb, api_calls_dia, etc.'
  })
  limites: {
    usuarios?: number;
    leads?: number;
    storage_mb?: number;
    api_calls_dia?: number;
    whatsapp_conexoes?: number;
    email_envios_dia?: number;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Uso atual dos recursos'
  })
  uso_atual: {
    usuarios?: number;
    leads?: number;
    storage_mb?: number;
    api_calls_dia?: number;
    whatsapp_conexoes?: number;
    email_envios_dia?: number;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do módulo'
  })
  configuracoes: Record<string, any>;

  @CreateDateColumn({ name: 'data_ativacao' })
  dataAtivacao: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'data_desativacao'
  })
  dataDesativacao: Date;

  @UpdateDateColumn({ name: 'ultima_atualizacao' })
  ultimaAtualizacao: Date;
}
