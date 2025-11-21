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
    // Verifica se a coluna já é uuid (idempotência básica)
    const col = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'propostaId'`,
    );
    if (col?.[0]?.data_type === 'uuid') {
      return; // já aplicado
    }

    await queryRunner.query(
      `ALTER TABLE "contratos" RENAME COLUMN "propostaId" TO "propostaId_old"`,
    );
    await queryRunner.query(`ALTER TABLE "contratos" ADD COLUMN "propostaId" uuid`);

    // Tentar mapear valores: se havia correspondência numérica com propostas.numero (ou outra lógica), ajustar aqui.
    // Como não há garantia, apenas tentamos converter integer->text->uuid se por acaso já eram armazenados como formato uuid textual numérico (improvável). Mantém nulo caso contrário.
    // Se existirem contratos cujo propostaId_old corresponde ao campo numero único de propostas, podemos tentar mapear:
    await queryRunner.query(
      `UPDATE "contratos" c SET "propostaId" = p.id FROM "propostas" p WHERE CAST(c."propostaId_old" AS text) = p.numero`,
    );

    // Criar constraint FK (deixa ON DELETE SET NULL para segurança)
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_contratos_proposta" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );

    await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "propostaId_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const col = await queryRunner.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name = 'contratos' AND column_name = 'propostaId'`,
    );
    if (col?.[0]?.data_type !== 'uuid') {
      return; // nada a reverter
    }

    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT IF EXISTS "FK_contratos_proposta"`,
    );
    await queryRunner.query(`ALTER TABLE "contratos" ADD COLUMN "propostaId_old" integer`);

    // Tentativa de reverter: se numero da proposta é puramente numérico e cabe, usar isso. Caso contrário ficará nulo
    await queryRunner.query(
      `UPDATE "contratos" c SET "propostaId_old" = CAST(p.numero AS integer) FROM "propostas" p WHERE c."propostaId" = p.id AND p.numero ~ '^\\d+$'`,
    );

    await queryRunner.query(`ALTER TABLE "contratos" DROP COLUMN "propostaId"`);
    await queryRunner.query(
      `ALTER TABLE "contratos" RENAME COLUMN "propostaId_old" TO "propostaId"`,
    );
  }
}
