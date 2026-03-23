import { MigrationInterface, QueryRunner } from 'typeorm';

interface LegacyMetadadosFatura {
  versao?: number;
  tipo?: Record<string, unknown>;
  financeiro?: {
    diasCarenciaJuros?: number;
    percentualJuros?: number;
    percentualMulta?: number;
    valorImpostos?: number;
  };
}

export class AddStructuredTaxFieldsToFaturas1808310000000 implements MigrationInterface {
  name = 'AddStructuredTaxFieldsToFaturas1808310000000';

  private readonly marcadorInicio = '[CONFIG_FATURA]';
  private readonly marcadorFim = '[/CONFIG_FATURA]';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('faturas'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "valorImpostos" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "percentualImpostos" numeric(7,4) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "diasCarenciaJuros" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "percentualJuros" numeric(7,4) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "percentualMulta" numeric(7,4) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      ADD COLUMN IF NOT EXISTS "detalhesTributarios" jsonb NULL
    `);

    const rows: Array<{
      id: number;
      observacoes?: string | null;
      valorTotal?: number | string | null;
      valorImpostos?: number | string | null;
      percentualImpostos?: number | string | null;
      diasCarenciaJuros?: number | string | null;
      percentualJuros?: number | string | null;
      percentualMulta?: number | string | null;
      detalhesTributarios?: Record<string, unknown> | string | null;
    }> = await queryRunner.query(`
      SELECT
        id,
        observacoes,
        "valorTotal",
        "valorImpostos",
        "percentualImpostos",
        "diasCarenciaJuros",
        "percentualJuros",
        "percentualMulta",
        "detalhesTributarios"
      FROM "faturas"
      WHERE observacoes IS NOT NULL
        AND observacoes LIKE '%[CONFIG_FATURA]%'
    `);

    for (const row of Array.isArray(rows) ? rows : []) {
      const { textoLimpo, metadados } = this.extrairMetadadosObservacoes(row.observacoes);
      if (!metadados && textoLimpo === (row.observacoes || '').trim()) {
        continue;
      }

      const financeiro = metadados?.financeiro || {};
      const valorTotalAtual = this.toNumber(row.valorTotal, 0);

      const valorImpostosAtual = this.toNumber(row.valorImpostos, 0);
      const valorImpostosMigrado = Math.max(0, this.toNumber(financeiro.valorImpostos, 0));
      const valorImpostos = this.roundMoney(
        valorImpostosAtual > 0 ? valorImpostosAtual : valorImpostosMigrado,
      );

      const percentualImpostosAtual = this.toNullablePercent(row.percentualImpostos);
      const percentualImpostosCalculado =
        percentualImpostosAtual !== null
          ? percentualImpostosAtual
          : valorImpostos > 0 && valorTotalAtual > 0
            ? this.toPercent((valorImpostos / Math.max(valorTotalAtual - valorImpostos, 0.0001)) * 100)
            : null;

      const diasCarenciaAtual = this.toInteger(row.diasCarenciaJuros, 0);
      const diasCarenciaMigrado = this.toInteger(financeiro.diasCarenciaJuros, 0);
      const diasCarenciaJuros = Math.max(diasCarenciaAtual, diasCarenciaMigrado);

      const percentualJurosAtual = this.toPercent(row.percentualJuros);
      const percentualJurosMigrado = this.toPercent(financeiro.percentualJuros);
      const percentualJuros = Math.max(percentualJurosAtual, percentualJurosMigrado);

      const percentualMultaAtual = this.toPercent(row.percentualMulta);
      const percentualMultaMigrado = this.toPercent(financeiro.percentualMulta);
      const percentualMulta = Math.max(percentualMultaAtual, percentualMultaMigrado);

      const detalhesAtuais = this.parseJsonObject(row.detalhesTributarios);
      const detalhesTributarios = {
        ...(detalhesAtuais || {}),
        ...(metadados?.tipo ? { configuracaoTipo: metadados.tipo } : {}),
        migracaoLegada: {
          origem: 'observacoes',
          versao: this.toInteger(metadados?.versao, 1),
          migradoEm: new Date().toISOString(),
        },
      };

      const observacoesFinal = textoLimpo || null;

      await queryRunner.query(
        `
          UPDATE "faturas"
          SET
            observacoes = $2,
            "valorImpostos" = $3,
            "percentualImpostos" = $4,
            "diasCarenciaJuros" = $5,
            "percentualJuros" = $6,
            "percentualMulta" = $7,
            "detalhesTributarios" = $8::jsonb,
            "updatedAt" = NOW()
          WHERE id = $1
        `,
        [
          row.id,
          observacoesFinal,
          valorImpostos,
          percentualImpostosCalculado,
          diasCarenciaJuros,
          percentualJuros,
          percentualMulta,
          JSON.stringify(detalhesTributarios),
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('faturas'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "detalhesTributarios"
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "percentualMulta"
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "percentualJuros"
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "diasCarenciaJuros"
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "percentualImpostos"
    `);

    await queryRunner.query(`
      ALTER TABLE "faturas"
      DROP COLUMN IF EXISTS "valorImpostos"
    `);
  }

  private extrairMetadadosObservacoes(observacoes?: string | null): {
    textoLimpo: string;
    metadados: LegacyMetadadosFatura | null;
  } {
    const textoOriginal = String(observacoes || '');
    const inicio = textoOriginal.indexOf(this.marcadorInicio);
    const fim = textoOriginal.indexOf(this.marcadorFim);

    if (inicio === -1 || fim === -1 || fim < inicio) {
      return { textoLimpo: textoOriginal.trim(), metadados: null };
    }

    const blocoJson = textoOriginal
      .slice(inicio + this.marcadorInicio.length, fim)
      .trim();

    const textoSemMetadados = `${textoOriginal.slice(0, inicio)}${textoOriginal.slice(
      fim + this.marcadorFim.length,
    )}`
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    try {
      const metadados = JSON.parse(blocoJson) as LegacyMetadadosFatura;
      return {
        textoLimpo: textoSemMetadados,
        metadados,
      };
    } catch {
      return {
        textoLimpo: textoSemMetadados || textoOriginal.trim(),
        metadados: null,
      };
    }
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private roundMoney(value: number): number {
    return Math.round((this.toNumber(value, 0) + Number.EPSILON) * 100) / 100;
  }

  private toPercent(value: unknown): number {
    const parsed = this.toNumber(value, 0);
    return Math.max(0, Math.min(100, Number(parsed.toFixed(4))));
  }

  private toNullablePercent(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return this.toPercent(value);
  }

  private toInteger(value: unknown, fallback = 0): number {
    const parsed = this.toNumber(value, fallback);
    return Math.max(0, Math.trunc(parsed));
  }

  private parseJsonObject(value: unknown): Record<string, unknown> | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }

    return null;
  }
}
