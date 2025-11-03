-- Teste RLS Simplificado
-- Verificar se RLS esta funcionando

-- 1. Verificar quantas tabelas tem RLS habilitado
SELECT COUNT(*) as tabelas_com_rls 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- 2. Verificar quantas politicas RLS existem
SELECT COUNT(*) as total_politicas 
FROM pg_policies 
WHERE schemaname = 'public';

-- 3. Listar tabelas com RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- 4. Verificar se funcoes RLS existem
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('set_current_tenant', 'get_current_tenant');

-- 5. Testar isolamento basico
-- Criar empresas teste
INSERT INTO empresas (id, nome, email, telefone, slug)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Empresa Teste A', 'test-a@test.com', '1199999991', 'empresa-a'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Empresa Teste B', 'test-b@test.com', '1199999992', 'empresa-b')
ON CONFLICT (id) DO NOTHING;

-- Criar clientes para Empresa A
INSERT INTO clientes (nome, email, empresa_id)
VALUES
  ('Cliente A1', 'a1@test.com', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  ('Cliente A2', 'a2@test.com', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
ON CONFLICT DO NOTHING;

-- Criar clientes para Empresa B
INSERT INTO clientes (nome, email, empresa_id)
VALUES
  ('Cliente B1', 'b1@test.com', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  ('Cliente B2', 'b2@test.com', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
  ('Cliente B3', 'b3@test.com', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)
ON CONFLICT DO NOTHING;

-- 6. Testar sem tenant definido (deve retornar 0)
SELECT COUNT(*) as clientes_sem_tenant FROM clientes;

-- 7. Definir tenant A e contar (deve retornar 2)
SELECT set_current_tenant('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
SELECT COUNT(*) as clientes_empresa_a FROM clientes;

-- 8. Definir tenant B e contar (deve retornar 3)
SELECT set_current_tenant('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid);
SELECT COUNT(*) as clientes_empresa_b FROM clientes;

-- 9. Verificar politicas ativas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname
LIMIT 20;
