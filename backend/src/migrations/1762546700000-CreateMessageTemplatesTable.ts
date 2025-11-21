import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMessageTemplatesTable1762546700000 implements MigrationInterface {
  name = 'CreateMessageTemplatesTable1762546700000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "message_templates",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "nome",
            type: "varchar",
            length: "200",
            isNullable: false,
          },
          {
            name: "conteudo",
            type: "text",
            isNullable: false,
          },
          {
            name: "categoria",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "atalho",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "variaveis",
            type: "text",
            isNullable: true,
          },
          {
            name: "ativo",
            type: "boolean",
            default: true,
            isNullable: false,
          },
          {
            name: "empresaId",
            type: "varchar",
            length: "36",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índices para melhor performance
    await queryRunner.query(`
            CREATE INDEX "IDX_MESSAGE_TEMPLATES_EMPRESA" ON "message_templates" ("empresaId");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_MESSAGE_TEMPLATES_ATIVO" ON "message_templates" ("ativo");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_MESSAGE_TEMPLATES_ATALHO" ON "message_templates" ("atalho");
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_MESSAGE_TEMPLATES_CATEGORIA" ON "message_templates" ("categoria");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_CATEGORIA"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATALHO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_ATIVO"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_MESSAGE_TEMPLATES_EMPRESA"`);
    await queryRunner.dropTable("message_templates");
  }
}
