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

    // ========================================
    // 1. MIGRAR ASSIGNED_LEVEL → NIVEL_ATENDIMENTO_ID
    // ========================================
    console.log('📊 Migrando assignedLevel → nivelAtendimentoId...');

    // N1
    await queryRunner.query(`
      UPDATE atendimento_tickets t
      SET nivel_atendimento_id = na.id
      FROM niveis_atendimento na
      WHERE t.assigned_level = 'N1'
        AND na.codigo = 'N1'
        AND na.empresa_id = t.empresa_id
    `);

    // N2
    await queryRunner.query(`
      UPDATE atendimento_tickets t
      SET nivel_atendimento_id = na.id
      FROM niveis_atendimento na
      WHERE t.assigned_level = 'N2'
        AND na.codigo = 'N2'
        AND na.empresa_id = t.empresa_id
    `);

    // N3
    await queryRunner.query(`
      UPDATE atendimento_tickets t
      SET nivel_atendimento_id = na.id
      FROM niveis_atendimento na
      WHERE t.assigned_level = 'N3'
        AND na.codigo = 'N3'
        AND na.empresa_id = t.empresa_id
    `);

    console.log('✅ assignedLevel migrado!');

    // ========================================
    // 2. MIGRAR STATUS → STATUS_CUSTOMIZADO_ID
    // ========================================
    console.log('📊 Migrando status → statusCustomizadoId...');

    // Mapear status antigos para novos (apenas os que existem no enum atual)
    const statusMapping = [
      { old: 'FILA', new: 'Fila' },
      { old: 'EM_ATENDIMENTO', new: 'Em Atendimento' },
      { old: 'ENVIO_ATIVO', new: 'Em Atendimento' }, // Mapear para Em Atendimento
      { old: 'ENCERRADO', new: 'Concluído' }, // Mapear para Concluído
    ];

    for (const mapping of statusMapping) {
      await queryRunner.query(`
        UPDATE atendimento_tickets t
        SET status_customizado_id = sc.id
        FROM status_customizados sc
        JOIN niveis_atendimento na ON na.id = sc.nivel_id
        WHERE t.status = '${mapping.old}'
          AND sc.nome = '${mapping.new}'
          AND na.id = t.nivel_atendimento_id
          AND sc.empresa_id = t.empresa_id
      `);
    }

    console.log('✅ status migrado!');

    // ========================================
    // 3. MIGRAR TIPO → TIPO_SERVICO_ID
    // ========================================
    console.log('📊 Migrando tipo → tipoServicoId...');

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
      await queryRunner.query(`
        UPDATE atendimento_tickets t
        SET tipo_servico_id = ts.id
        FROM tipos_servico ts
        WHERE t.tipo = '${mapping.old}'
          AND ts.nome = '${mapping.new}'
          AND ts.empresa_id = t.empresa_id
      `);
    }

    // Tickets sem tipo definido → mapear para "Suporte"
    await queryRunner.query(`
      UPDATE atendimento_tickets t
      SET tipo_servico_id = ts.id
      FROM tipos_servico ts
      WHERE t.tipo IS NULL
        AND ts.nome = 'Suporte'
        AND ts.empresa_id = t.empresa_id
    `);

    console.log('✅ tipo migrado!');

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
      console.warn(`   Total: ${total}, Nível: ${comNivel}, Status: ${comStatus}, Tipo: ${comTipo}`);
    } else {
      console.log('✅ Todos os tickets migrados com sucesso!');
    }

    console.log('✅ Migration UP concluída!');
    console.log('⚠️  NOTA: Enums antigos ainda estão presentes para compatibilidade.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revertendo migração de dados...');

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
