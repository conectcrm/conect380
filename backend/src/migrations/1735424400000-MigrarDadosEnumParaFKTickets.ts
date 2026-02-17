import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Migrar Dados de Enums para FKs Configuráveis
 *
 * Migra todos os tickets existentes:
 * - assignedLevel (enum N1/N2/N3) → nivel_atendimento_id
 * - status (enum FILA/EM_ATENDIMENTO...) → status_customizado_id
 * - tipo (enum tecnica/comercial...) → tipo_servico_id
 *
 * IMPORTANTE: Executa por empresa para garantir multi-tenancy correto
 */
export class MigrarDadosEnumParaFKTickets1735424400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migração de dados de enums para FKs...');

    const ticketsTable = await queryRunner.getTable('atendimento_tickets');
    if (!ticketsTable) {
      console.warn('⚠️  Migration: tabela "atendimento_tickets" não existe - pulando');
      return;
    }

    const hasColumn = (columnName: string) =>
      ticketsTable.columns.some((c) => c.name === columnName);

    const resolveLegacyColumn = (candidates: string[]) =>
      candidates.find((c) => hasColumn(c)) ?? null;

    const legacyAssignedLevelCol = resolveLegacyColumn([
      'assigned_level',
      'assignedLevel',
    ]);
    const legacyStatusCol = resolveLegacyColumn(['status']);
    const legacyTipoCol = resolveLegacyColumn(['tipo']);

    // As colunas FK (snake_case) são adicionadas na migration anterior.
    const hasNivelFkCol = hasColumn('nivel_atendimento_id');
    const hasStatusFkCol = hasColumn('status_customizado_id');
    const hasTipoFkCol = hasColumn('tipo_servico_id');

    // ========================================
    // 1. MIGRAR ASSIGNED_LEVEL → NIVEL_ATENDIMENTO_ID
    // ========================================
    console.log('📊 Migrando assignedLevel → nivelAtendimentoId...');

    if (!hasNivelFkCol) {
      console.warn(
        '⚠️  Migration: coluna "nivel_atendimento_id" não existe em "atendimento_tickets" - pulando etapa de nível',
      );
    } else if (!legacyAssignedLevelCol) {
      console.warn(
        '⚠️  Migration: coluna legada de nível ("assigned_level"/"assignedLevel") não existe - pulando migração de assignedLevel',
      );
    } else {
      const legacyLevelExpr = `t."${legacyAssignedLevelCol}"`;

      // N1
      await queryRunner.query(
        `
        UPDATE atendimento_tickets t
        SET nivel_atendimento_id = na.id
        FROM niveis_atendimento na
        WHERE ${legacyLevelExpr} = $1
          AND na.codigo = $2
          AND na.empresa_id = t.empresa_id
          AND t.nivel_atendimento_id IS NULL
      `,
        ['N1', 'N1'],
      );

      // N2
      await queryRunner.query(
        `
        UPDATE atendimento_tickets t
        SET nivel_atendimento_id = na.id
        FROM niveis_atendimento na
        WHERE ${legacyLevelExpr} = $1
          AND na.codigo = $2
          AND na.empresa_id = t.empresa_id
          AND t.nivel_atendimento_id IS NULL
      `,
        ['N2', 'N2'],
      );

      // N3
      await queryRunner.query(
        `
        UPDATE atendimento_tickets t
        SET nivel_atendimento_id = na.id
        FROM niveis_atendimento na
        WHERE ${legacyLevelExpr} = $1
          AND na.codigo = $2
          AND na.empresa_id = t.empresa_id
          AND t.nivel_atendimento_id IS NULL
      `,
        ['N3', 'N3'],
      );

      console.log('✅ assignedLevel migrado!');
    }

    // ========================================
    // 2. MIGRAR STATUS → STATUS_CUSTOMIZADO_ID
    // ========================================
    console.log('📊 Migrando status → statusCustomizadoId...');

    if (!hasStatusFkCol) {
      console.warn(
        '⚠️  Migration: coluna "status_customizado_id" não existe em "atendimento_tickets" - pulando etapa de status',
      );
    } else if (!legacyStatusCol) {
      console.warn(
        '⚠️  Migration: coluna legada de status ("status") não existe - pulando migração de status',
      );
    } else {
      const legacyStatusExpr = `t."${legacyStatusCol}"`;

      // Mapear status antigos para novos (apenas os que existem no enum atual)
      const statusMapping = [
        { old: 'FILA', new: 'Fila' },
        { old: 'EM_ATENDIMENTO', new: 'Em Atendimento' },
        { old: 'ENVIO_ATIVO', new: 'Em Atendimento' },
        { old: 'ENCERRADO', new: 'Concluído' },
      ];

      for (const mapping of statusMapping) {
        await queryRunner.query(
          `
          UPDATE atendimento_tickets t
          SET status_customizado_id = sc.id
          FROM status_customizados sc
          JOIN niveis_atendimento na ON na.id = sc.nivel_id
          WHERE ${legacyStatusExpr} = $1
            AND sc.nome = $2
            AND na.id = t.nivel_atendimento_id
            AND sc.empresa_id = t.empresa_id
            AND t.status_customizado_id IS NULL
        `,
          [mapping.old, mapping.new],
        );
      }

      console.log('✅ status migrado!');
    }

    // ========================================
    // 3. MIGRAR TIPO → TIPO_SERVICO_ID
    // ========================================
    console.log('📊 Migrando tipo → tipoServicoId...');

    if (!hasTipoFkCol) {
      console.warn(
        '⚠️  Migration: coluna "tipo_servico_id" não existe em "atendimento_tickets" - pulando etapa de tipo',
      );
    } else if (!legacyTipoCol) {
      console.warn(
        '⚠️  Migration: coluna legada de tipo ("tipo") não existe - pulando migração de tipo',
      );
    } else {
      const legacyTipoExpr = `t."${legacyTipoCol}"`;

      // Mapear tipos antigos (enum) para novos (nome na tabela)
      const tipoMapping = [
        { old: 'tecnica', new: 'Técnica' },
        { old: 'comercial', new: 'Comercial' },
        { old: 'financeira', new: 'Financeira' },
        { old: 'suporte', new: 'Suporte' },
        { old: 'reclamacao', new: 'Reclamação' },
        { old: 'solicitacao', new: 'Solicitação de Melhoria' },
        { old: 'outros', new: 'Bug/Outros' },
      ];

      for (const mapping of tipoMapping) {
        await queryRunner.query(
          `
          UPDATE atendimento_tickets t
          SET tipo_servico_id = ts.id
          FROM tipos_servico ts
          WHERE ${legacyTipoExpr} = $1
            AND ts.nome = $2
            AND ts.empresa_id = t.empresa_id
            AND t.tipo_servico_id IS NULL
        `,
          [mapping.old, mapping.new],
        );
      }

      // Tickets sem tipo definido → mapear para "Suporte"
      await queryRunner.query(
        `
        UPDATE atendimento_tickets t
        SET tipo_servico_id = ts.id
        FROM tipos_servico ts
        WHERE ${legacyTipoExpr} IS NULL
          AND ts.nome = 'Suporte'
          AND ts.empresa_id = t.empresa_id
          AND t.tipo_servico_id IS NULL
      `,
      );

      console.log('✅ tipo migrado!');
    }

    // ========================================
    // 4. VALIDAÇÃO
    // ========================================
    console.log('🔍 Validando migração...');

    const result = await queryRunner.query(`
      SELECT
        COUNT(*) as total_tickets,
        COUNT(nivel_atendimento_id) as com_nivel,
        COUNT(status_customizado_id) as com_status,
        COUNT(tipo_servico_id) as com_tipo
      FROM atendimento_tickets
    `);

    console.log('📊 Resultado da migração:', result[0]);

    const total = parseInt(result[0].total_tickets);
    const comNivel = parseInt(result[0].com_nivel);
    const comStatus = parseInt(result[0].com_status);
    const comTipo = parseInt(result[0].com_tipo);

    if (comNivel < total || comStatus < total || comTipo < total) {
      console.warn('⚠️  ATENÇÃO: Alguns tickets não foram migrados completamente!');
      console.warn(
        `   Total: ${total}, Nível: ${comNivel}, Status: ${comStatus}, Tipo: ${comTipo}`,
      );
    } else {
      console.log('✅ Todos os tickets migrados com sucesso!');
    }

    console.log('✅ Migration UP concluída!');
    console.log('⚠️  NOTA: Enums antigos ainda estão presentes para compatibilidade.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revertendo migração de dados...');

    const ticketsTable = await queryRunner.getTable('atendimento_tickets');
    if (!ticketsTable) {
      console.warn('⚠️  Migration (down): tabela "atendimento_tickets" não existe - pulando');
      return;
    }

    const hasColumn = (columnName: string) =>
      ticketsTable.columns.some((c) => c.name === columnName);

    if (!hasColumn('nivel_atendimento_id') && !hasColumn('status_customizado_id') && !hasColumn('tipo_servico_id')) {
      console.warn('⚠️  Migration (down): colunas FK não existem - nada a reverter');
      return;
    }

    // Limpar FKs (reverter para NULL)
    await queryRunner.query(`
      UPDATE atendimento_tickets
      SET
        nivel_atendimento_id = NULL,
        status_customizado_id = NULL,
        tipo_servico_id = NULL
    `);

    console.log('✅ Rollback concluído! FKs zeradas.');
  }
}
