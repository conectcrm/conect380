import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

/**
 * 📋 TEMPLATE DE ENTITY MULTI-TENANT
 * 
 * ⚠️ ANTES DE USAR:
 * 1. [ ] Renomear classe (ex: TemplateEntity → Produto)
 * 2. [ ] Renomear arquivo (ex: template.entity.ts → produto.entity.ts)
 * 3. [ ] Ajustar nome da tabela no @Entity('nome_tabela')
 * 4. [ ] Adicionar campos específicos da entidade
 * 5. [ ] Adicionar relacionamentos (@ManyToOne, @OneToMany)
 * 6. [ ] Criar migration COM RLS habilitado (usar _TemplateMigration.ts)
 * 7. [ ] Registrar entity em backend/src/config/database.config.ts
 * 8. [ ] Criar DTO correspondente (CreateXDto, UpdateXDto)
 * 
 * ✅ O QUE JÁ ESTÁ CORRETO NESTE TEMPLATE:
 * - empresaId (OBRIGATÓRIO para multi-tenant)
 * - Relação com Empresa
 * - Timestamps (created_at, updated_at, deleted_at)
 * - Soft delete habilitado
 * 
 * 🚫 O QUE NÃO ESQUECER:
 * - Migration DEVE habilitar RLS!
 * - Migration DEVE criar política tenant_isolation_*
 * - Migration DEVE criar índice em empresa_id
 */

@Entity('nome_da_tabela') // ⚠️ TROCAR pelo nome da tabela
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ⚡ OBRIGATÓRIO: Multi-tenant
  @Column({ type: 'uuid', name: 'empresa_id' })
  empresaId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // ============================================
  // ⚠️ ADICIONAR CAMPOS ESPECÍFICOS AQUI
  // ============================================

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  // Exemplo de campo numérico
  // @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  // valor: number;

  // Exemplo de campo JSON
  // @Column({ type: 'jsonb', nullable: true })
  // metadados?: Record<string, any>;

  // Exemplo de enum
  // @Column({
  //   type: 'enum',
  //   enum: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO'],
  //   default: 'PENDENTE',
  // })
  // status: string;

  // ============================================
  // ⚠️ ADICIONAR RELACIONAMENTOS AQUI
  // ============================================

  // Exemplo de ManyToOne (N:1)
  // @Column({ type: 'uuid', nullable: true })
  // clienteId?: string;
  //
  // @ManyToOne(() => Cliente, (cliente) => cliente.items)
  // @JoinColumn({ name: 'cliente_id' })
  // cliente?: Cliente;

  // Exemplo de OneToMany (1:N)
  // @OneToMany(() => ItemRelacionado, (item) => item.parent)
  // itens: ItemRelacionado[];

  // Exemplo de ManyToMany (N:N)
  // @ManyToMany(() => Tag, (tag) => tag.items)
  // @JoinTable({
  //   name: 'template_tags',
  //   joinColumn: { name: 'template_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  // })
  // tags: Tag[];

  // ============================================
  // ✅ TIMESTAMPS (NÃO ALTERAR)
  // ============================================

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // ============================================
  // ⚠️ OPCIONAL: Campos de Auditoria
  // ============================================

  // @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  // createdBy?: string;
  //
  // @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  // updatedBy?: string;
}

/**
 * 📝 EXEMPLO DE USO:
 * 
 * 1. Copiar este arquivo:
 *    cp backend/templates/_TemplateEntity.ts backend/src/modules/meu-modulo/entities/minha-entity.entity.ts
 * 
 * 2. Renomear classe:
 *    TemplateEntity → MinhaEntity
 * 
 * 3. Ajustar @Entity:
 *    @Entity('nome_da_tabela') → @Entity('minha_tabela')
 * 
 * 4. Adicionar campos:
 *    @Column({ length: 50 })
 *    codigo: string;
 * 
 * 5. Adicionar relacionamentos:
 *    @ManyToOne(() => Cliente)
 *    cliente: Cliente;
 * 
 * 6. Criar migration (copiar _TemplateMigration.ts):
 *    npm run migration:generate -- src/migrations/CreateMinhaTabela
 * 
 * 7. Registrar em database.config.ts:
 *    import { MinhaEntity } from '../modules/meu-modulo/entities/minha-entity.entity';
 *    entities: [..., MinhaEntity]
 * 
 * 8. Rodar migration:
 *    npm run migration:run
 * 
 * 9. Verificar RLS ativo:
 *    SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'minha_tabela';
 *    → Deve retornar rowsecurity = true
 */
