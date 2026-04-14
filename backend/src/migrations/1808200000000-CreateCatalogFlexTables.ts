import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogFlexTables1808200000000 implements MigrationInterface {
  name = 'CreateCatalogFlexTables1808200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalog_templates" (
        "code" character varying(80) NOT NULL,
        "empresa_id" uuid,
        "nome" character varying(120) NOT NULL,
        "descricao" text,
        "item_kind" character varying(40) NOT NULL,
        "business_type" character varying(40) NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_templates_code" PRIMARY KEY ("code"),
        CONSTRAINT "FK_catalog_templates_empresa" FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_templates_empresa_id"
      ON "catalog_templates" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_templates_kind"
      ON "catalog_templates" ("item_kind", "business_type")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalog_template_fields" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_code" character varying(80) NOT NULL,
        "field_key" character varying(80) NOT NULL,
        "label" character varying(120) NOT NULL,
        "section" character varying(40) NOT NULL,
        "field_type" character varying(30) NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "options" jsonb,
        "sort_order" integer NOT NULL DEFAULT 0,
        "help_text" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_template_fields_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_catalog_template_fields_template" FOREIGN KEY ("template_code")
          REFERENCES "catalog_templates"("code") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_catalog_template_fields_template_key"
      ON "catalog_template_fields" ("template_code", "field_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_template_fields_template_code"
      ON "catalog_template_fields" ("template_code")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalog_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "legacy_produto_id" uuid,
        "code" character varying(100),
        "nome" character varying(255) NOT NULL,
        "descricao" text,
        "item_kind" character varying(40) NOT NULL,
        "business_type" character varying(40) NOT NULL,
        "template_code" character varying(80),
        "categoria_id" uuid,
        "subcategoria_id" uuid,
        "configuracao_id" uuid,
        "status" character varying(30) NOT NULL DEFAULT 'ativo',
        "billing_model" character varying(30),
        "recurrence" character varying(30),
        "unit_code" character varying(40),
        "sale_price" numeric(12,2) NOT NULL DEFAULT 0,
        "cost_amount" numeric(12,2),
        "currency_code" character varying(8) NOT NULL DEFAULT 'BRL',
        "track_stock" boolean NOT NULL DEFAULT false,
        "stock_current" integer,
        "stock_min" integer,
        "stock_max" integer,
        "sku" character varying(100),
        "supplier_name" character varying(255),
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_catalog_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_catalog_items_empresa" FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalog_items_legacy_produto" FOREIGN KEY ("legacy_produto_id")
          REFERENCES "produtos"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_catalog_items_template" FOREIGN KEY ("template_code")
          REFERENCES "catalog_templates"("code") ON DELETE SET NULL,
        CONSTRAINT "FK_catalog_items_categoria" FOREIGN KEY ("categoria_id")
          REFERENCES "categorias_produtos"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_catalog_items_subcategoria" FOREIGN KEY ("subcategoria_id")
          REFERENCES "subcategorias_produtos"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_catalog_items_configuracao" FOREIGN KEY ("configuracao_id")
          REFERENCES "configuracoes_produtos"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_items_empresa"
      ON "catalog_items" ("empresa_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_items_kind"
      ON "catalog_items" ("empresa_id", "item_kind", "business_type")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_items_status"
      ON "catalog_items" ("empresa_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_items_template"
      ON "catalog_items" ("empresa_id", "template_code")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_catalog_items_empresa_sku"
      ON "catalog_items" ("empresa_id", "sku")
      WHERE "sku" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "catalog_item_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "parent_item_id" uuid NOT NULL,
        "child_item_id" uuid NOT NULL,
        "component_role" character varying(30) NOT NULL,
        "quantity" numeric(12,4) NOT NULL DEFAULT 1,
        "sort_order" integer NOT NULL DEFAULT 0,
        "affects_price" boolean NOT NULL DEFAULT false,
        "is_default" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_catalog_item_components_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_catalog_item_components_parent_child_diff"
          CHECK ("parent_item_id" <> "child_item_id"),
        CONSTRAINT "FK_catalog_item_components_empresa" FOREIGN KEY ("empresa_id")
          REFERENCES "empresas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalog_item_components_parent" FOREIGN KEY ("parent_item_id")
          REFERENCES "catalog_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_catalog_item_components_child" FOREIGN KEY ("child_item_id")
          REFERENCES "catalog_items"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_components_parent"
      ON "catalog_item_components" ("empresa_id", "parent_item_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_catalog_components_child"
      ON "catalog_item_components" ("empresa_id", "child_item_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "catalog_items" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_items ON "catalog_items"
    `);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_catalog_items ON "catalog_items"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant())
    `);

    await queryRunner.query(`
      ALTER TABLE "catalog_item_components" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_item_components ON "catalog_item_components"
    `);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_catalog_item_components ON "catalog_item_components"
      FOR ALL
      USING ("empresa_id" = get_current_tenant())
      WITH CHECK ("empresa_id" = get_current_tenant())
    `);

    await queryRunner.query(`
      ALTER TABLE "catalog_templates" ENABLE ROW LEVEL SECURITY
    `);
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_templates ON "catalog_templates"
    `);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation_catalog_templates ON "catalog_templates"
      FOR SELECT
      USING ("empresa_id" IS NULL OR "empresa_id" = get_current_tenant())
    `);

    await queryRunner.query(`
      INSERT INTO "catalog_templates" ("code", "empresa_id", "nome", "descricao", "item_kind", "business_type", "ativo")
      VALUES
        ('software_plan', NULL, 'Plano de Software', 'Plano SaaS com composição de módulos e add-ons', 'subscription', 'plano', true),
        ('software_module', NULL, 'Módulo de Software', 'Módulo ou licença complementar de plataforma', 'simple', 'modulo', true),
        ('service_package', NULL, 'Pacote de Serviço', 'Pacote comercial de implantação, consultoria ou treinamento', 'composite', 'pacote', true),
        ('autoparts_item', NULL, 'Peça Automotiva', 'Peça ou acessório com compatibilidade veicular', 'simple', 'peca', true),
        ('retail_accessory_or_service', NULL, 'Acessório ou Serviço', 'Oferta simples de acessório, garantia ou instalação', 'simple', 'acessorio', true)
      ON CONFLICT ("code") DO UPDATE SET
        "nome" = EXCLUDED."nome",
        "descricao" = EXCLUDED."descricao",
        "item_kind" = EXCLUDED."item_kind",
        "business_type" = EXCLUDED."business_type",
        "ativo" = EXCLUDED."ativo",
        "updated_at" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "catalog_template_fields"
        ("template_code", "field_key", "label", "section", "field_type", "required", "sort_order", "help_text", "options")
      VALUES
        ('software_plan', 'usuarios_inclusos', 'Usuários Inclusos', 'operacao', 'number', false, 10, 'Quantidade padrão incluída no plano.', NULL),
        ('software_plan', 'suporte_incluso', 'Suporte Incluído', 'operacao', 'select', false, 20, 'Nível de suporte padrão do plano.', '[{"value":"padrao","label":"Padrão"},{"value":"prioritario","label":"Prioritário"},{"value":"dedicado","label":"Dedicado"}]'),
        ('software_plan', 'onboarding_incluso', 'Onboarding Incluído', 'operacao', 'boolean', false, 30, 'Indica se onboarding padrão já faz parte do plano.', NULL),
        ('software_plan', 'limite_unidades', 'Limite de Unidades', 'operacao', 'number', false, 40, 'Limite operacional por unidade, filial ou operação.', NULL),
        ('software_plan', 'limite_integracoes', 'Limite de Integrações', 'operacao', 'number', false, 50, 'Limite de integrações incluídas no plano.', NULL),

        ('software_module', 'depende_de_modulo', 'Depende de Módulo', 'composicao', 'text', false, 10, 'Código ou nome do módulo obrigatório para ativação.', NULL),
        ('software_module', 'tipo_licenciamento', 'Tipo de Licenciamento', 'cobranca', 'select', false, 20, 'Modelo de licenciamento principal do módulo.', '[{"value":"usuario","label":"Por usuário"},{"value":"empresa","label":"Por empresa"},{"value":"unidade","label":"Por unidade"}]'),
        ('software_module', 'recorrencia_comercial', 'Recorrência Comercial', 'cobranca', 'select', false, 30, 'Ciclo comercial principal do módulo.', '[{"value":"mensal","label":"Mensal"},{"value":"anual","label":"Anual"},{"value":"sob_consulta","label":"Sob consulta"}]'),
        ('software_module', 'limite_usuarios', 'Limite de Usuários', 'operacao', 'number', false, 40, 'Quantidade máxima de usuários para o módulo.', NULL),

        ('service_package', 'duracao_estimada', 'Duração Estimada', 'operacao', 'text', false, 10, 'Prazo esperado para execução do pacote.', NULL),
        ('service_package', 'modalidade', 'Modalidade', 'operacao', 'select', false, 20, 'Forma de entrega do serviço.', '[{"value":"remoto","label":"Remoto"},{"value":"presencial","label":"Presencial"},{"value":"hibrido","label":"Híbrido"}]'),
        ('service_package', 'horas_previstas', 'Horas Previstas', 'operacao', 'number', false, 30, 'Carga horária estimada do pacote.', NULL),
        ('service_package', 'escopo_entrega', 'Escopo de Entrega', 'observacoes', 'textarea', false, 40, 'Descrição resumida do escopo comercial e operacional.', NULL),

        ('autoparts_item', 'marca_aplicacao', 'Marca de Aplicação', 'compatibilidade', 'text', false, 10, 'Marca principal do veículo compatível.', NULL),
        ('autoparts_item', 'modelo_aplicacao', 'Modelo de Aplicação', 'compatibilidade', 'text', false, 20, 'Modelo principal do veículo compatível.', NULL),
        ('autoparts_item', 'ano_inicial', 'Ano Inicial', 'compatibilidade', 'number', false, 30, 'Ano inicial de compatibilidade.', NULL),
        ('autoparts_item', 'ano_final', 'Ano Final', 'compatibilidade', 'number', false, 40, 'Ano final de compatibilidade.', NULL),
        ('autoparts_item', 'codigo_oem', 'Código OEM', 'compatibilidade', 'text', false, 50, 'Código OEM ou referência técnica do item.', NULL),
        ('autoparts_item', 'referencia_cruzada', 'Referência Cruzada', 'compatibilidade', 'text', false, 60, 'Código cruzado para catálogos alternativos.', NULL),
        ('autoparts_item', 'lado_posicao', 'Lado ou Posição', 'compatibilidade', 'select', false, 70, 'Posição do item no veículo.', '[{"value":"dianteiro","label":"Dianteiro"},{"value":"traseiro","label":"Traseiro"},{"value":"esquerdo","label":"Esquerdo"},{"value":"direito","label":"Direito"}]'),

        ('retail_accessory_or_service', 'possui_instalacao', 'Possui Instalação', 'operacao', 'boolean', false, 10, 'Define se o item exige ou oferece instalação.', NULL),
        ('retail_accessory_or_service', 'prazo_execucao', 'Prazo de Execução', 'operacao', 'text', false, 20, 'Prazo comercial para instalação ou entrega.', NULL),
        ('retail_accessory_or_service', 'fornecedor_padrao', 'Fornecedor Padrão', 'operacao', 'text', false, 30, 'Fornecedor principal recomendado para o item.', NULL)
      ON CONFLICT ("template_code", "field_key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "section" = EXCLUDED."section",
        "field_type" = EXCLUDED."field_type",
        "required" = EXCLUDED."required",
        "sort_order" = EXCLUDED."sort_order",
        "help_text" = EXCLUDED."help_text",
        "options" = EXCLUDED."options",
        "updated_at" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_templates ON "catalog_templates"
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_templates" DISABLE ROW LEVEL SECURITY
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_item_components ON "catalog_item_components"
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_item_components" DISABLE ROW LEVEL SECURITY
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS tenant_isolation_catalog_items ON "catalog_items"
    `);
    await queryRunner.query(`
      ALTER TABLE "catalog_items" DISABLE ROW LEVEL SECURITY
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_components_child"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_components_parent"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "catalog_item_components"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_catalog_items_empresa_sku"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_items_template"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_items_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_items_kind"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_items_empresa"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "catalog_items"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_template_fields_template_code"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_catalog_template_fields_template_key"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "catalog_template_fields"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_templates_kind"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_catalog_templates_empresa_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "catalog_templates"
    `);
  }
}
