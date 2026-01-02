-- RLS Complementar - Proteção de 17 tabelas críticas
-- Executado manualmente: 31/12/2025

-- ==================================
-- MÓDULO COMERCIAL/CRM (6 tabelas)
-- ==================================

-- produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_produtos ON produtos;
CREATE POLICY tenant_isolation_produtos ON produtos
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- propostas
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_propostas ON propostas;
CREATE POLICY tenant_isolation_propostas ON propostas
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_leads ON leads;
CREATE POLICY tenant_isolation_leads ON leads
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- oportunidades
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_oportunidades ON oportunidades;
CREATE POLICY tenant_isolation_oportunidades ON oportunidades
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- interacoes
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_interacoes ON interacoes;
CREATE POLICY tenant_isolation_interacoes ON interacoes
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- contratos
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_contratos ON contratos;
CREATE POLICY tenant_isolation_contratos ON contratos
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- ==================================
-- MÓDULO FINANCEIRO/BILLING (4 tabelas)
-- ==================================

-- faturas
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_faturas ON faturas;
CREATE POLICY tenant_isolation_faturas ON faturas
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_pagamentos ON pagamentos;
CREATE POLICY tenant_isolation_pagamentos ON pagamentos
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- configuracoes_gateway_pagamento
ALTER TABLE configuracoes_gateway_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_configuracoes_gateway ON configuracoes_gateway_pagamento;
CREATE POLICY tenant_isolation_configuracoes_gateway ON configuracoes_gateway_pagamento
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- transacoes_gateway_pagamento
ALTER TABLE transacoes_gateway_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_transacoes_gateway ON transacoes_gateway_pagamento;
CREATE POLICY tenant_isolation_transacoes_gateway ON transacoes_gateway_pagamento
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- ==================================
-- MÓDULO AGENDA (1 tabela)
-- ==================================

-- agenda_eventos
ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_agenda_eventos ON agenda_eventos;
CREATE POLICY tenant_isolation_agenda_eventos ON agenda_eventos
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- ==================================
-- MÓDULO ATENDIMENTO - CONFIG (4 tabelas)
-- ==================================

-- niveis_atendimento (usa "empresaId" camelCase)
ALTER TABLE niveis_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_niveis_atendimento ON niveis_atendimento;
CREATE POLICY tenant_isolation_niveis_atendimento ON niveis_atendimento
FOR ALL USING ("empresaId" = get_current_tenant());

-- tipos_servico (usa "empresaId" camelCase)
ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tipos_servico ON tipos_servico;
CREATE POLICY tenant_isolation_tipos_servico ON tipos_servico
FOR ALL USING ("empresaId" = get_current_tenant());

-- status_customizados (usa "empresaId" camelCase)
ALTER TABLE status_customizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_status_customizados ON status_customizados;
CREATE POLICY tenant_isolation_status_customizados ON status_customizados
FOR ALL USING ("empresaId" = get_current_tenant());

-- atendimento_configuracao_inatividade
ALTER TABLE atendimento_configuracao_inatividade ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_configuracao_inatividade ON atendimento_configuracao_inatividade;
CREATE POLICY tenant_isolation_atendimento_configuracao_inatividade ON atendimento_configuracao_inatividade
FOR ALL USING (empresa_id::uuid = get_current_tenant());

-- ==================================
-- MÓDULO METAS (1 tabela)
-- ==================================

-- metas (usa "empresaId" camelCase)
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_metas ON metas;
CREATE POLICY tenant_isolation_metas ON metas
FOR ALL USING ("empresaId" = get_current_tenant());

-- ==================================
-- MÓDULO ADMIN (1 tabela)
-- ==================================

-- assinaturas_empresas (usa "empresaId")
ALTER TABLE assinaturas_empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_assinaturas_empresas ON assinaturas_empresas;
CREATE POLICY tenant_isolation_assinaturas_empresas ON assinaturas_empresas
FOR ALL USING ("empresaId" = get_current_tenant());

-- ==================================
-- RESUMO
-- ==================================

SELECT '✅ RLS COMPLEMENTAR APLICADO COM SUCESSO!' as status;
SELECT 'Total de tabelas protegidas nesta execução: 17' as resumo;
SELECT 'Total acumulado com Sprint 1: 32 tabelas com RLS' as total;
