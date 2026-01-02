const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const queries = [
  { name: 'produtos', sql: `ALTER TABLE produtos ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_produtos ON produtos; CREATE POLICY tenant_isolation_produtos ON produtos FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'propostas', sql: `ALTER TABLE propostas ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_propostas ON propostas; CREATE POLICY tenant_isolation_propostas ON propostas FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'leads', sql: `ALTER TABLE leads ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_leads ON leads; CREATE POLICY tenant_isolation_leads ON leads FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'oportunidades', sql: `ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_oportunidades ON oportunidades; CREATE POLICY tenant_isolation_oportunidades ON oportunidades FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'interacoes', sql: `ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_interacoes ON interacoes; CREATE POLICY tenant_isolation_interacoes ON interacoes FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'contratos', sql: `ALTER TABLE contratos ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_contratos ON contratos; CREATE POLICY tenant_isolation_contratos ON contratos FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'faturas', sql: `ALTER TABLE faturas ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_faturas ON faturas; CREATE POLICY tenant_isolation_faturas ON faturas FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'pagamentos', sql: `ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_pagamentos ON pagamentos; CREATE POLICY tenant_isolation_pagamentos ON pagamentos FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'configuracoes_gateway', sql: `ALTER TABLE configuracoes_gateway_pagamento ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_configuracoes_gateway ON configuracoes_gateway_pagamento; CREATE POLICY tenant_isolation_configuracoes_gateway ON configuracoes_gateway_pagamento FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'transacoes_gateway', sql: `ALTER TABLE transacoes_gateway_pagamento ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_transacoes_gateway ON transacoes_gateway_pagamento; CREATE POLICY tenant_isolation_transacoes_gateway ON transacoes_gateway_pagamento FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'agenda_eventos', sql: `ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_agenda_eventos ON agenda_eventos; CREATE POLICY tenant_isolation_agenda_eventos ON agenda_eventos FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'niveis_atendimento', sql: `ALTER TABLE niveis_atendimento ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_niveis_atendimento ON niveis_atendimento; CREATE POLICY tenant_isolation_niveis_atendimento ON niveis_atendimento FOR ALL USING ("empresaId"::uuid = get_current_tenant());` },
  { name: 'tipos_servico', sql: `ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_tipos_servico ON tipos_servico; CREATE POLICY tenant_isolation_tipos_servico ON tipos_servico FOR ALL USING ("empresaId"::uuid = get_current_tenant());` },
  { name: 'status_customizados', sql: `ALTER TABLE status_customizados ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_status_customizados ON status_customizados; CREATE POLICY tenant_isolation_status_customizados ON status_customizados FOR ALL USING ("empresaId"::uuid = get_current_tenant());` },
  { name: 'config_inatividade', sql: `ALTER TABLE atendimento_configuracao_inatividade ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_atendimento_configuracao_inatividade ON atendimento_configuracao_inatividade; CREATE POLICY tenant_isolation_atendimento_configuracao_inatividade ON atendimento_configuracao_inatividade FOR ALL USING (empresa_id::uuid = get_current_tenant());` },
  { name: 'metas', sql: `ALTER TABLE metas ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_metas ON metas; CREATE POLICY tenant_isolation_metas ON metas FOR ALL USING ("empresaId"::uuid = get_current_tenant());` },
  { name: 'assinaturas_empresas', sql: `ALTER TABLE assinaturas_empresas ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS tenant_isolation_assinaturas_empresas ON assinaturas_empresas; CREATE POLICY tenant_isolation_assinaturas_empresas ON assinaturas_empresas FOR ALL USING ("empresaId"::uuid = get_current_tenant());` },
];

async function applyRLS() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'conectcrm',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: String(process.env.DATABASE_PASSWORD || ''),
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    let success = 0;
    let failed = 0;

    for (const query of queries) {
      try {
        await client.query(query.sql);
        console.log(`✅ ${query.name}`);
        success++;
      } catch (error) {
        console.log(`⚠️  ${query.name}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Resumo: ${success} sucesso, ${failed} falhas`);
    console.log('🎉 RLS COMPLEMENTAR APLICADO!');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLS();
