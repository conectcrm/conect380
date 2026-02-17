import { MigrationInterface, QueryRunner } from 'typeorm';

// Migration para alterar coluna propostaId de integer para uuid na tabela contratos
// Estratégia:
// 1. Renomear coluna antiga para propostaId_old
// 2. Adicionar nova coluna propostaId uuid nullable
// 3. Copiar valores fazendo cast para texto->uuid quando possível (se dados antigos usavam IDs numéricos que não existem em propostas, ficarão nulos)
// 4. Criar FK para propostas(id)
// 5. Remover coluna antiga
// Down: reverter para integer (pode haver perda se tinham uuids não numéricos)
export class AlterContratoPropostaIdToUuid1733500000000 implements MigrationInterface {
  name = 'AlterContratoPropostaIdToUuid1733500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const contratosTable = 'contratos';
    const propostasTable = 'propostas';

    const hasContratos = await queryRunner.hasTable(contratosTable);
    if (!hasContratos) {
      console.log(`⚠️  Migration: tabela "${contratosTable}" não existe - pulando`);
      return;
    }

    const hasPropostaIdCamel = await queryRunner.hasColumn(contratosTable, 'propostaId');
    const hasPropostaIdSnake = await queryRunner.hasColumn(contratosTable, 'proposta_id');
    const columnName = hasPropostaIdCamel ? 'propostaId' : hasPropostaIdSnake ? 'proposta_id' : null;
    if (!columnName) {
      console.log(`⚠️  Migration: coluna propostaId/proposta_id não existe em "${contratosTable}" - pulando`);
      return;
    }

    // Verifica se a coluna já é uuid (idempotência básica)
    const col = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = $1`,
      [columnName],
    );
    if (col?.[0]?.data_type === 'uuid') {
      return; // já aplicado
    }

    const oldColumnName = `${columnName}_old`;
    const hasOldColumn = await queryRunner.hasColumn(contratosTable, oldColumnName);
    if (!hasOldColumn) {
      await queryRunner.query(
        `ALTER TABLE "${contratosTable}" RENAME COLUMN "${columnName}" TO "${oldColumnName}"`,
      );
    }

    const hasNewColumn = await queryRunner.hasColumn(contratosTable, columnName);
    if (!hasNewColumn) {
      await queryRunner.query(`ALTER TABLE "${contratosTable}" ADD COLUMN "${columnName}" uuid`);
    }

    // Mapear valores somente se propostas existir e tiver os campos esperados
    const hasPropostas = await queryRunner.hasTable(propostasTable);
    if (hasPropostas) {
      const hasPropostasNumero = await queryRunner.hasColumn(propostasTable, 'numero');
      const hasPropostasId = await queryRunner.hasColumn(propostasTable, 'id');
      const hasOldForUpdate = await queryRunner.hasColumn(contratosTable, oldColumnName);
      if (hasPropostasNumero && hasPropostasId && hasOldForUpdate) {
        await queryRunner.query(
          `UPDATE "${contratosTable}" c SET "${columnName}" = p.id FROM "${propostasTable}" p WHERE CAST(c."${oldColumnName}" AS text) = p.numero`,
        );
      }

      // Criar constraint FK (deixa ON DELETE SET NULL para segurança)
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_contratos_proposta'
          ) THEN
            EXECUTE 'ALTER TABLE "${contratosTable}" ADD CONSTRAINT "FK_contratos_proposta" FOREIGN KEY ("${columnName}") REFERENCES "${propostasTable}"("id") ON DELETE SET NULL ON UPDATE CASCADE';
          END IF;
        END $$;
      `);
    }

    const hasOldForDrop = await queryRunner.hasColumn(contratosTable, oldColumnName);
    if (hasOldForDrop) {
      await queryRunner.query(`ALTER TABLE "${contratosTable}" DROP COLUMN "${oldColumnName}"`);
    }

    return;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const contratosTable = 'contratos';
    const propostasTable = 'propostas';

    const hasContratos = await queryRunner.hasTable(contratosTable);
    if (!hasContratos) {
      return;
    }

    const hasPropostaIdCamel = await queryRunner.hasColumn(contratosTable, 'propostaId');
    const hasPropostaIdSnake = await queryRunner.hasColumn(contratosTable, 'proposta_id');
    const columnName = hasPropostaIdCamel ? 'propostaId' : hasPropostaIdSnake ? 'proposta_id' : null;
    if (!columnName) {
      return;
    }

    const col = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = $1`,
      [columnName],
    );
    if (col?.[0]?.data_type !== 'uuid') {
      return; // nada a reverter
    }

    await queryRunner.query(`ALTER TABLE "${contratosTable}" DROP CONSTRAINT IF EXISTS "FK_contratos_proposta"`);

    const oldColumnName = `${columnName}_old`;
    const hasOldColumn = await queryRunner.hasColumn(contratosTable, oldColumnName);
    if (!hasOldColumn) {
      await queryRunner.query(`ALTER TABLE "${contratosTable}" ADD COLUMN "${oldColumnName}" integer`);
    }

    const hasPropostas = await queryRunner.hasTable(propostasTable);
    if (hasPropostas) {
      const hasPropostasNumero = await queryRunner.hasColumn(propostasTable, 'numero');
      const hasPropostasId = await queryRunner.hasColumn(propostasTable, 'id');
      if (hasPropostasNumero && hasPropostasId) {
        await queryRunner.query(
          `UPDATE "${contratosTable}" c SET "${oldColumnName}" = CAST(p.numero AS integer) FROM "${propostasTable}" p WHERE c."${columnName}" = p.id AND p.numero ~ '^\\d+$'`,
        );
      }
    }

    await queryRunner.query(`ALTER TABLE "${contratosTable}" DROP COLUMN "${columnName}"`);
    await queryRunner.query(`ALTER TABLE "${contratosTable}" RENAME COLUMN "${oldColumnName}" TO "${columnName}"`);
  }
}
