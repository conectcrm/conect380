-- =====================================================
-- 🔒 TESTE MANUAL DE ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Execute este script no PostgreSQL para validar RLS
-- ANTES de rodar os testes E2E automatizados
-- =====================================================

-- 1️⃣ CRIAR DUAS EMPRESAS DE TESTE
-- ====================================
INSERT INTO empresas (id, nome, email, telefone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Empresa A - Teste RLS', 'teste-a@rls.local', '11999999991'),
  ('22222222-2222-2222-2222-222222222222', 'Empresa B - Teste RLS', 'teste-b@rls.local', '11999999992')
ON CONFLICT (id) DO NOTHING;

-- 2️⃣ CRIAR CLIENTES PARA CADA EMPRESA
-- =====================================
INSERT INTO clientes (id, nome, email, empresa_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Cliente 1 da Empresa A', 'cliente1-a@test.com', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  (gen_random_uuid(), 'Cliente 2 da Empresa A', 'cliente2-a@test.com', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  (gen_random_uuid(), 'Cliente 1 da Empresa B', 'cliente1-b@test.com', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
  (gen_random_uuid(), 'Cliente 2 da Empresa B', 'cliente2-b@test.com', '22222222-2222-2222-2222-222222222222', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ✅ VERIFICAÇÃO INICIAL (SEM TENANT CONTEXT)
-- ============================================
-- DEVE RETORNAR 0 LINHAS (RLS bloqueando sem tenant definido)
SELECT COUNT(*) as total_clientes_sem_tenant FROM clientes;

-- 3️⃣ DEFINIR TENANT CONTEXT PARA EMPRESA A
-- =========================================
SELECT set_current_tenant('11111111-1111-1111-1111-111111111111');

-- ✅ TESTE 1: EMPRESA A VÊ APENAS SEUS CLIENTES
-- ==============================================
-- DEVE RETORNAR APENAS 2 CLIENTES (da Empresa A)
SELECT 
  nome, 
  email, 
  empresa_id,
  'Empresa A vendo' as contexto
FROM clientes
ORDER BY nome;

-- 4️⃣ MUDAR TENANT CONTEXT PARA EMPRESA B
-- ========================================
SELECT set_current_tenant('22222222-2222-2222-2222-222222222222');

-- ✅ TESTE 2: EMPRESA B VÊ APENAS SEUS CLIENTES
-- ==============================================
-- DEVE RETORNAR APENAS 2 CLIENTES (da Empresa B)
SELECT 
  nome, 
  email, 
  empresa_id,
  'Empresa B vendo' as contexto
FROM clientes
ORDER BY nome;

-- 5️⃣ TESTE DE INSERÇÃO ISOLADA
-- =============================
-- Empresa B tenta inserir cliente (deve ter empresa_id = B automaticamente)
INSERT INTO clientes (id, nome, email, empresa_id, created_at, updated_at)
VALUES (gen_random_uuid(), 'Cliente 3 da Empresa B', 'cliente3-b@test.com', '22222222-2222-2222-2222-222222222222', NOW(), NOW());

-- Verificar se foi inserido (deve aparecer apenas para Empresa B)
SELECT nome, empresa_id FROM clientes WHERE nome LIKE '%Cliente 3%';

-- 6️⃣ VOLTAR PARA EMPRESA A
-- =========================
SELECT set_current_tenant('11111111-1111-1111-1111-111111111111');

-- ✅ TESTE 3: EMPRESA A NÃO VÊ CLIENTE NOVO DA EMPRESA B
-- ========================================================
-- DEVE RETORNAR 0 LINHAS (Cliente 3 é da Empresa B)
SELECT COUNT(*) as clientes_empresa_b_visiveis_para_a 
FROM clientes 
WHERE nome LIKE '%Cliente 3%';

-- 7️⃣ TESTE DE AUDITORIA ISOLADA
-- ==============================
SELECT set_current_tenant('11111111-1111-1111-1111-111111111111');

-- Inserir log de auditoria para Empresa A
INSERT INTO audit_logs (empresa_id, entidade, acao, ip_address)
VALUES ('11111111-1111-1111-1111-111111111111', 'clientes', 'teste_rls', '127.0.0.1');

SELECT set_current_tenant('22222222-2222-2222-2222-222222222222');

-- Inserir log de auditoria para Empresa B
INSERT INTO audit_logs (empresa_id, entidade, acao, ip_address)
VALUES ('22222222-2222-2222-2222-222222222222', 'clientes', 'teste_rls', '127.0.0.1');

-- ✅ TESTE 4: EMPRESA B VÊ APENAS SEUS LOGS
-- ==========================================
SELECT COUNT(*) as logs_empresa_b FROM audit_logs;
-- DEVE RETORNAR 1 LOG (apenas da Empresa B)

-- 8️⃣ VERIFICAR POLÍTICAS ATIVAS
-- ==============================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as condicao
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'tenant_isolation_%'
ORDER BY tablename;

-- 9️⃣ VERIFICAR TABELAS COM RLS HABILITADO
-- =========================================
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Ativo' 
    ELSE '❌ RLS Desativado' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 🔟 CLEANUP (OPCIONAL)
-- ======================
-- Descomentar para limpar dados de teste:
-- DELETE FROM clientes WHERE empresa_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- DELETE FROM audit_logs WHERE empresa_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- DELETE FROM empresas WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- =====================================================
-- 📊 RESULTADO ESPERADO:
-- =====================================================
-- ✅ Empresa A: vê 2 clientes (apenas seus)
-- ✅ Empresa B: vê 3 clientes (apenas seus)
-- ✅ Empresa A: NÃO vê Cliente 3 (é da B)
-- ✅ Cada empresa vê apenas 1 log de auditoria (o seu)
-- ✅ 14 tabelas com RLS habilitado
-- ✅ 14+ políticas ativas (tenant_isolation_*)
-- =====================================================
