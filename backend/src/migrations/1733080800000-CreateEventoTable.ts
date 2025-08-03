import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEventoTable1733080800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar se a tabela já existe
        const hasTable = await queryRunner.hasTable('evento');
        
        if (!hasTable) {
            await queryRunner.createTable(
                new Table({
                    name: 'evento',
                    columns: [
                        {
                            name: 'id',
                            type: 'uuid',
                            isPrimary: true,
                            generationStrategy: 'uuid',
                            default: 'uuid_generate_v4()',
                        },
                        {
                            name: 'titulo',
                            type: 'varchar',
                            length: '255',
                        },
                        {
                            name: 'descricao',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'dataInicio',
                            type: 'timestamp with time zone',
                        },
                        {
                            name: 'dataFim',
                            type: 'timestamp with time zone',
                            isNullable: true,
                        },
                        {
                            name: 'diaInteiro',
                            type: 'boolean',
                            default: false,
                        },
                        {
                            name: 'tipo',
                            type: 'enum',
                            enum: ['reuniao', 'ligacao', 'apresentacao', 'visita', 'follow-up', 'outro'],
                            default: "'reuniao'",
                        },
                        {
                            name: 'cor',
                            type: 'varchar',
                            length: '7',
                            default: "'#3B82F6'",
                        },
                        {
                            name: 'local',
                            type: 'varchar',
                            length: '255',
                            isNullable: true,
                        },
                        {
                            name: 'clienteId',
                            type: 'uuid',
                            isNullable: true,
                        },
                        {
                            name: 'usuarioId',
                            type: 'uuid',
                        },
                        {
                            name: 'empresaId',
                            type: 'uuid',
                        },
                        {
                            name: 'criadoEm',
                            type: 'timestamp with time zone',
                            default: 'CURRENT_TIMESTAMP',
                        },
                        {
                            name: 'atualizadoEm',
                            type: 'timestamp with time zone',
                            default: 'CURRENT_TIMESTAMP',
                        },
                    ],
                    indices: [
                        {
                            name: 'IDX_EVENTO_DATA_INICIO',
                            columnNames: ['dataInicio'],
                        },
                        {
                            name: 'IDX_EVENTO_USUARIO',
                            columnNames: ['usuarioId'],
                        },
                        {
                            name: 'IDX_EVENTO_EMPRESA',
                            columnNames: ['empresaId'],
                        },
                    ],
                }),
                true,
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable('evento');
        if (hasTable) {
            await queryRunner.dropTable('evento');
        }
    }
}
