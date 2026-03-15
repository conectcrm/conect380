-- =========================================================
-- OWNER TENANT POLICY (BILLING INTERNO)
-- =========================================================
-- Objetivo:
-- Marcar uma empresa como tenant proprietario do software, ativando:
-- - isPlatformOwner = true
-- - billingExempt = true
-- - billingMonitorOnly = true
-- - fullModuleAccess = true
-- - allowCheckout = false
-- - allowPlanMutation = false
-- - enforceLifecycleTransitions = false
--
-- Compatibilidade:
-- O backend aceita flags top-level e dentro de configuracoes.billing.
--
-- Como usar:
-- 1) O UUID padrao e o da Codexa sistemas LTDA.
--    Ajuste v_empresa_id apenas se for outro tenant.
-- 2) Execute este script no banco do ambiente.
-- 3) Verifique os SELECTs finais.
-- =========================================================

BEGIN;

DO $$
DECLARE
  v_empresa_id uuid := '250cc3ac-617b-4d8b-be6e-b14901e4edde';
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM empresas
    WHERE id = v_empresa_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Empresa % nao encontrada em empresas.id', v_empresa_id;
  END IF;

  UPDATE empresas
  SET
    ativo = true,
    status = 'ativa',
    trial_end_date = NULL,
    data_expiracao = NULL,
    configuracoes = (
      jsonb_strip_nulls(
        COALESCE(configuracoes::jsonb, '{}'::jsonb)
        || jsonb_build_object(
          'isPlatformOwner', true,
          'billingExempt', true,
          'billingMonitorOnly', true,
          'fullModuleAccess', true,
          'allowCheckout', false,
          'allowPlanMutation', false,
          'enforceLifecycleTransitions', false,
          'billing', jsonb_build_object(
            'isPlatformOwner', true,
            'exempt', true,
            'monitorOnly', true,
            'fullModuleAccess', true,
            'allowCheckout', false,
            'allowPlanMutation', false,
            'enforceLifecycleTransitions', false
          )
        )
      )
    )::json
  WHERE id = v_empresa_id;

  RAISE NOTICE 'Tenant % marcado como OWNER com billing interno.', v_empresa_id;
END $$;

COMMIT;

-- =========================================================
-- VALIDACAO RAPIDA
-- =========================================================
SELECT
  e.id,
  e.nome,
  e.ativo,
  e.status,
  e.trial_end_date,
  e.data_expiracao,
  e.configuracoes
FROM empresas e
WHERE e.id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'::uuid;

-- =========================================================
-- ROLLBACK (executar manualmente se necessario)
-- =========================================================
-- BEGIN;
-- UPDATE empresas
-- SET
--   configuracoes = (
--     jsonb_strip_nulls(
--       COALESCE(configuracoes::jsonb, '{}'::jsonb)
--       || jsonb_build_object(
--         'isPlatformOwner', false,
--         'billingExempt', false,
--         'billingMonitorOnly', false,
--         'fullModuleAccess', false,
--         'allowCheckout', true,
--         'allowPlanMutation', true,
--         'enforceLifecycleTransitions', true,
--         'billing', jsonb_build_object(
--           'isPlatformOwner', false,
--           'exempt', false,
--           'monitorOnly', false,
--           'fullModuleAccess', false,
--           'allowCheckout', true,
--           'allowPlanMutation', true,
--           'enforceLifecycleTransitions', true
--         )
--       )
--     )
--   )::json
-- WHERE id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'::uuid;
-- COMMIT;
