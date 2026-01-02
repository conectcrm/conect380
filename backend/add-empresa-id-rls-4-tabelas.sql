-- Script SQL para adicionar empresa_id + RLS em 4 tabelas
-- Executar via: node scripts/add-empresa-id-rls-4-tabelas.js

-- ========== 1. TICKET_HISTORICO ==========
ALTER TABLE ticket_historico ADD COLUMN empresa_id UUID;

UPDATE ticket_historico th
SET empresa_id = t.empresa_id
FROM atendimento_tickets t
WHERE th.ticket_id = t.id;

ALTER TABLE ticket_historico ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE ticket_historico
ADD CONSTRAINT fk_ticket_historico_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

ALTER TABLE ticket_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ticket_historico ON ticket_historico
FOR ALL USING (empresa_id = get_current_tenant());

-- ========== 2. TICKET_RELACIONAMENTOS ==========
ALTER TABLE ticket_relacionamentos ADD COLUMN empresa_id UUID;

UPDATE ticket_relacionamentos tr
SET empresa_id = t.empresa_id
FROM atendimento_tickets t
WHERE tr.ticket_origem_id = t.id;

ALTER TABLE ticket_relacionamentos ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE ticket_relacionamentos
ADD CONSTRAINT fk_ticket_relacionamentos_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

ALTER TABLE ticket_relacionamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ticket_relacionamentos ON ticket_relacionamentos
FOR ALL USING (empresa_id = get_current_tenant());

-- ========== 3. ATENDENTE_SKILLS ==========
ALTER TABLE atendente_skills ADD COLUMN empresa_id UUID;

UPDATE atendente_skills ask
SET empresa_id = u.empresa_id
FROM users u
WHERE ask."atendenteId" = u.id;

ALTER TABLE atendente_skills ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE atendente_skills
ADD CONSTRAINT fk_atendente_skills_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

ALTER TABLE atendente_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_atendente_skills ON atendente_skills
FOR ALL USING (empresa_id = get_current_tenant());

-- ========== 4. TICKET_TAGS (Junction Table) ==========
ALTER TABLE ticket_tags ADD COLUMN empresa_id UUID;

UPDATE ticket_tags tt
SET empresa_id = t.empresa_id
FROM atendimento_tickets t
WHERE tt."ticketId" = t.id;

ALTER TABLE ticket_tags ALTER COLUMN empresa_id SET NOT NULL;

ALTER TABLE ticket_tags
ADD CONSTRAINT fk_ticket_tags_empresa
FOREIGN KEY (empresa_id) REFERENCES empresas(id);

ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ticket_tags ON ticket_tags
FOR ALL USING (empresa_id = get_current_tenant());

-- ========== VERIFICAÇÃO ==========
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Ativo' ELSE '❌ Sem RLS' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ticket_historico', 'ticket_relacionamentos', 'atendente_skills', 'ticket_tags')
ORDER BY tablename;
