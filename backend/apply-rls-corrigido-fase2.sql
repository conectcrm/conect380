-- =========================================================
-- FASE 2: APLICAR RLS EM 25 TABELAS REMANESCENTES
-- Data: 01/01/2026
-- Objetivo: Proteção completa multi-tenant (100%)
-- =========================================================

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: ATENDIMENTO (11 tabelas)
-- ═══════════════════════════════════════════════════════════

-- 1. filas (JÁ APLICADO - PULAR)

-- 2. filas_atendentes (JÁ APLICADO - PULAR)

-- 3. atendimento_canais (JÁ APLICADO - PULAR)

-- 4. message_templates (empresaId com COLUNA VARCHAR!)
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_message_templates ON message_templates;
CREATE POLICY tenant_isolation_message_templates ON message_templates
  FOR ALL USING ("empresaId"::uuid = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_message_templates_empresa_id ON message_templates("empresaId");

-- 5. atendimento_templates (JÁ APLICADO - PULAR)

-- 6. sla_configs (JÁ APLICADO - PULAR)

-- 7. tags (empresaId)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_tags ON tags;
CREATE POLICY tenant_isolation_tags ON tags
  FOR ALL USING ("empresaId" = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_tags_empresa_id ON tags("empresaId");

-- 8. atendimento_notas_cliente (JÁ APLICADO - PULAR)

-- 9. atendimento_mensagens (CRÍTICO - NÃO TEM empresa_id!)
-- Herda via ticket/demanda - precisa JOIN
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'atendimento_mensagens' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE atendimento_mensagens ADD COLUMN empresa_id UUID;
    
    -- Preencher empresa_id a partir dos tickets
    UPDATE atendimento_mensagens m
    SET empresa_id = t.empresa_id
    FROM atendimento_tickets t
    WHERE m.ticket_id = t.id AND m.empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE atendimento_mensagens ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE atendimento_mensagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_mensagens ON atendimento_mensagens;
CREATE POLICY tenant_isolation_atendimento_mensagens ON atendimento_mensagens
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_mensagens_empresa_id ON atendimento_mensagens(empresa_id);

-- 10. atendimento_integracoes_config (empresa_id)
ALTER TABLE atendimento_integracoes_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_integracoes_config ON atendimento_integracoes_config;
CREATE POLICY tenant_isolation_atendimento_integracoes_config ON atendimento_integracoes_config
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_integracoes_config_empresa_id ON atendimento_integracoes_config(empresa_id);

-- 11. atendimento_redmine_configs (empresa_id)
ALTER TABLE atendimento_redmine_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_atendimento_redmine_configs ON atendimento_redmine_configs;
CREATE POLICY tenant_isolation_atendimento_redmine_configs ON atendimento_redmine_configs
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_atendimento_redmine_configs_empresa_id ON atendimento_redmine_configs(empresa_id);

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: COTAÇÕES (3 tabelas CRÍTICAS)
-- ═══════════════════════════════════════════════════════════

-- 12. cotacoes (CRÍTICO - NÃO TEM empresa_id!)
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotacoes' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE cotacoes ADD COLUMN empresa_id UUID;
    
    -- Preencher empresa_id a partir dos clientes
    UPDATE cotacoes c
    SET empresa_id = cl.empresa_id
    FROM clientes cl
    WHERE c.cliente_id = cl.id AND c.empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE cotacoes ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_cotacoes ON cotacoes;
CREATE POLICY tenant_isolation_cotacoes ON cotacoes
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_cotacoes_empresa_id ON cotacoes(empresa_id);

-- 13. itens_cotacao (herda de cotacoes)
ALTER TABLE itens_cotacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_itens_cotacao ON itens_cotacao;
CREATE POLICY tenant_isolation_itens_cotacao ON itens_cotacao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cotacoes
      WHERE cotacoes.id = itens_cotacao.cotacao_id
        AND cotacoes.empresa_id = get_current_tenant()
    )
  );

-- 14. anexos_cotacao (herda de cotacoes)
ALTER TABLE anexos_cotacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_anexos_cotacao ON anexos_cotacao;
CREATE POLICY tenant_isolation_anexos_cotacao ON anexos_cotacao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cotacoes
      WHERE cotacoes.id = anexos_cotacao.cotacao_id
        AND cotacoes.empresa_id = get_current_tenant()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: CLIENTES (1 tabela)
-- ═══════════════════════════════════════════════════════════

-- 15. contatos (NÃO TEM empresa_id!)
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contatos' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE contatos ADD COLUMN empresa_id UUID;
    
    -- Preencher empresa_id a partir dos clientes
    UPDATE contatos ct
    SET empresa_id = cl.empresa_id
    FROM clientes cl
    WHERE ct.cliente_id = cl.id AND ct.empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE contatos ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_contatos ON contatos;
CREATE POLICY tenant_isolation_contatos ON contatos
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON contatos(empresa_id);

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: FINANCEIRO (2 tabelas)
-- ═══════════════════════════════════════════════════════════

-- 16. itens_fatura (herda de faturas via faturaId)
ALTER TABLE itens_fatura ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_itens_fatura ON itens_fatura;
CREATE POLICY tenant_isolation_itens_fatura ON itens_fatura
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM faturas
      WHERE faturas.id = itens_fatura."faturaId"
        AND faturas.empresa_id = get_current_tenant()
    )
  );

-- 17. planos_cobranca (NÃO TEM empresa_id!)
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planos_cobranca' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE planos_cobranca ADD COLUMN empresa_id UUID;
    
    -- Preencher com empresa padrão (ajustar depois manualmente se necessário)
    UPDATE planos_cobranca
    SET empresa_id = '11111111-1111-1111-1111-111111111111'
    WHERE empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE planos_cobranca ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE planos_cobranca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_planos_cobranca ON planos_cobranca;
CREATE POLICY tenant_isolation_planos_cobranca ON planos_cobranca
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_planos_cobranca_empresa_id ON planos_cobranca(empresa_id);

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: VENDAS (1 tabela)
-- ═══════════════════════════════════════════════════════════

-- 18. atividades (JÁ APLICADO - PULAR)

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: CONTRATOS (1 tabela)
-- ═══════════════════════════════════════════════════════════

-- 19. assinaturas_contrato (herda de contratos via contratoId)
ALTER TABLE assinaturas_contrato ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_assinaturas_contrato ON assinaturas_contrato;
CREATE POLICY tenant_isolation_assinaturas_contrato ON assinaturas_contrato
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contratos
      WHERE contratos.id = assinaturas_contrato."contratoId"
        AND contratos.empresa_id = get_current_tenant()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: ADMIN (2 tabelas)
-- ═══════════════════════════════════════════════════════════

-- 20. historico_planos (JÁ APLICADO - PULAR)

-- 21. modulos_empresas (JÁ APLICADO - PULAR)

-- ═══════════════════════════════════════════════════════════
-- MÓDULO: CONFIGURAÇÕES/AUTOMAÇÃO (5 tabelas)
-- ═══════════════════════════════════════════════════════════

-- 22. empresa_configuracoes (JÁ APLICADO - PULAR)

-- 23. empresa_modulos (JÁ APLICADO - PULAR)

-- 24. eventos_fluxo (NÃO TEM empresa_id!)
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'eventos_fluxo' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE eventos_fluxo ADD COLUMN empresa_id UUID;
    
    -- Preencher empresa_id a partir dos fluxos_triagem
    UPDATE eventos_fluxo ef
    SET empresa_id = ft.empresa_id
    FROM fluxos_triagem ft
    WHERE ef.fluxo_id = ft.id AND ef.empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE eventos_fluxo ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE eventos_fluxo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_eventos_fluxo ON eventos_fluxo;
CREATE POLICY tenant_isolation_eventos_fluxo ON eventos_fluxo
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_eventos_fluxo_empresa_id ON eventos_fluxo(empresa_id);

-- 25. fluxos_automatizados (NÃO TEM empresa_id!)
-- SOLUÇÃO: Adicionar coluna empresa_id primeiro!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fluxos_automatizados' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE fluxos_automatizados ADD COLUMN empresa_id UUID;
    
    -- Preencher com empresa padrão (ajustar depois manualmente se necessário)
    UPDATE fluxos_automatizados
    SET empresa_id = '11111111-1111-1111-1111-111111111111'
    WHERE empresa_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE fluxos_automatizados ALTER COLUMN empresa_id SET NOT NULL;
  END IF;
END$$;

ALTER TABLE fluxos_automatizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_fluxos_automatizados ON fluxos_automatizados;
CREATE POLICY tenant_isolation_fluxos_automatizados ON fluxos_automatizados
  FOR ALL USING (empresa_id = get_current_tenant());
CREATE INDEX IF NOT EXISTS idx_fluxos_automatizados_empresa_id ON fluxos_automatizados(empresa_id);

-- ═══════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════

-- Contar total de tabelas protegidas
SELECT COUNT(*) as total_protegidas, 'Fase 2 completa!' as mensagem
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c 
    WHERE c.table_name = pg_tables.tablename 
      AND (c.column_name = 'empresa_id' OR c.column_name = 'empresaId')
  );

-- Listar tabelas ainda desprotegidas (DEVE SER VAZIO!)
SELECT 
  t.tablename,
  'AINDA VULNERAVEL!' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c 
    WHERE c.table_name = t.tablename 
      AND (c.column_name = 'empresa_id' OR c.column_name = 'empresaId')
  );
