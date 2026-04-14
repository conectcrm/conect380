-- =========================================================
-- OWNER TENANT POLICY ROLLBACK
-- =========================================================
-- Objetivo:
-- Remover o modo "tenant proprietario" de uma empresa.
--
-- Como usar:
-- 1) Ajuste v_empresa_id se necessario.
-- 2) Execute no banco do ambiente alvo.
-- 3) Verifique o SELECT final.
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
    configuracoes = (
      jsonb_strip_nulls(
        COALESCE(configuracoes::jsonb, '{}'::jsonb)
        || jsonb_build_object(
          'isPlatformOwner', false,
          'billingExempt', false,
          'billingMonitorOnly', false,
          'fullModuleAccess', false,
          'allowCheckout', true,
          'allowPlanMutation', true,
          'enforceLifecycleTransitions', true,
          'billing', jsonb_build_object(
            'isPlatformOwner', false,
            'exempt', false,
            'monitorOnly', false,
            'fullModuleAccess', false,
            'allowCheckout', true,
            'allowPlanMutation', true,
            'enforceLifecycleTransitions', true
          )
        )
      )
    )::json
  WHERE id = v_empresa_id;

  RAISE NOTICE 'Tenant % removido do modo OWNER.', v_empresa_id;
END $$;

COMMIT;

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
