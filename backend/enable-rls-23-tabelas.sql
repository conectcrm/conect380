-- Script SQL: Habilitar RLS em tabelas de Atendimento, Triagem e Equipes
-- Executar via psql ou pgAdmin

\echo '🔒 Habilitando RLS para 23 tabelas...'

-- ========================================
-- GRUPO 1: Tabelas de Atendimento (14)
-- ========================================

-- atendimento_canais
ALTER TABLE atendimento_canais ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_canais ON atendimento_canais
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_filas
ALTER TABLE atendimento_filas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_filas ON atendimento_filas
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_atendentes
ALTER TABLE atendimento_atendentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_atendentes ON atendimento_atendentes
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_atendentes_filas
ALTER TABLE atendimento_atendentes_filas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_atendentes_filas ON atendimento_atendentes_filas
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_tickets
ALTER TABLE atendimento_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_tickets ON atendimento_tickets
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_mensagens
ALTER TABLE atendimento_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_mensagens ON atendimento_mensagens
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_templates
ALTER TABLE atendimento_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_templates ON atendimento_templates
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_tags
ALTER TABLE atendimento_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_tags ON atendimento_tags
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_historico
ALTER TABLE atendimento_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_historico ON atendimento_historico
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_integracoes_config
ALTER TABLE atendimento_integracoes_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_integracoes_config ON atendimento_integracoes_config
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_ai_insights
ALTER TABLE atendimento_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_ai_insights ON atendimento_ai_insights
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_base_conhecimento
ALTER TABLE atendimento_base_conhecimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_base_conhecimento ON atendimento_base_conhecimento
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_ai_respostas
ALTER TABLE atendimento_ai_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_ai_respostas ON atendimento_ai_respostas
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendimento_ai_metricas
ALTER TABLE atendimento_ai_metricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendimento_ai_metricas ON atendimento_ai_metricas
  FOR ALL USING (empresa_id = get_current_tenant());

\echo '✅ RLS habilitado em 14 tabelas de Atendimento'

-- ========================================
-- GRUPO 2: Tabelas de Triagem/Bot (5)
-- ========================================

-- nucleos_atendimento
ALTER TABLE nucleos_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_nucleos_atendimento ON nucleos_atendimento
  FOR ALL USING (empresa_id = get_current_tenant());

-- fluxos_triagem
ALTER TABLE fluxos_triagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_fluxos_triagem ON fluxos_triagem
  FOR ALL USING (empresa_id = get_current_tenant());

-- sessoes_triagem
ALTER TABLE sessoes_triagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sessoes_triagem ON sessoes_triagem
  FOR ALL USING (empresa_id = get_current_tenant());

-- templates_mensagem_triagem
ALTER TABLE templates_mensagem_triagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_templates_mensagem_triagem ON templates_mensagem_triagem
  FOR ALL USING (empresa_id = get_current_tenant());

-- metricas_nucleo
ALTER TABLE metricas_nucleo ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_metricas_nucleo ON metricas_nucleo
  FOR ALL USING (empresa_id = get_current_tenant());

\echo '✅ RLS habilitado em 5 tabelas de Triagem'

-- ========================================
-- GRUPO 3: Tabelas de Equipes (4)
-- ========================================

-- equipes
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_equipes ON equipes
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendente_equipes
ALTER TABLE atendente_equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendente_equipes ON atendente_equipes
  FOR ALL USING (empresa_id = get_current_tenant());

-- atendente_atribuicoes
ALTER TABLE atendente_atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_atendente_atribuicoes ON atendente_atribuicoes
  FOR ALL USING (empresa_id = get_current_tenant());

-- equipe_atribuicoes
ALTER TABLE equipe_atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_equipe_atribuicoes ON equipe_atribuicoes
  FOR ALL USING (empresa_id = get_current_tenant());

\echo '✅ RLS habilitado em 4 tabelas de Equipes'

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
\echo ''
\echo '🎉 RLS HABILITADO EM 23 TABELAS!'
\echo ''
\echo 'Verificando status RLS:'
\echo ''

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE tablename IN (
  'atendimento_canais', 'atendimento_filas', 'atendimento_atendentes',
  'atendimento_atendentes_filas', 'atendimento_tickets', 'atendimento_mensagens',
  'atendimento_templates', 'atendimento_tags', 'atendimento_historico',
  'atendimento_integracoes_config', 'atendimento_ai_insights',
  'atendimento_base_conhecimento', 'atendimento_ai_respostas', 'atendimento_ai_metricas',
  'nucleos_atendimento', 'fluxos_triagem', 'sessoes_triagem',
  'templates_mensagem_triagem', 'metricas_nucleo',
  'equipes', 'atendente_equipes', 'atendente_atribuicoes', 'equipe_atribuicoes'
)
ORDER BY tablename;
