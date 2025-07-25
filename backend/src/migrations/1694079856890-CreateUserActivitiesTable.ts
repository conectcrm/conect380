import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateUserActivitiesTable1694079856890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "user_activities",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "uuid"
                },
                {
                    name: "usuario_id",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "empresa_id",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "tipo",
                    type: "enum",
                    enum: ["LOGIN", "LOGOUT", "CRIACAO", "EDICAO", "EXCLUSAO", "ALTERACAO_STATUS", "RESET_SENHA"],
                    default: "'LOGIN'",
                    isNullable: false
                },
                {
                    name: "descricao",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                },
                {
                    name: "detalhes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }));

        // Criar chave estrangeira para usuários
        await queryRunner.createForeignKey(
            "user_activities",
            new TableForeignKey({
                columnNames: ["usuario_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover chave estrangeira
        const table = await queryRunner.getTable("user_activities");
        const foreignKey = table.foreignKeys.find(
            fk => fk.columnNames.indexOf("usuario_id") !== -1
        );
        await queryRunner.dropForeignKey("user_activities", foreignKey);
        
        // Remover tabela
        await queryRunner.dropTable("user_activities");
    }
}
