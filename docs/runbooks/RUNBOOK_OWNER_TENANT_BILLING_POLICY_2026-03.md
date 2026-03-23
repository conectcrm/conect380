# Runbook - Tenant Proprietario de Billing (Codexa)

## 1. Objetivo

Padronizar a ativacao da empresa proprietaria do software (owner tenant) em producao, mantendo:

- banco como fonte principal da politica;
- variavel de ambiente como fallback operacional;
- rollback rapido e previsivel.

Tenant alvo atual:

- `empresa_id`: `250cc3ac-617b-4d8b-be6e-b14901e4edde`
- `nome`: `Codexa sistemas LTDA`

## 2. Politica recomendada

Para tenant proprietario:

- `isPlatformOwner=true`
- `billingExempt=true`
- `billingMonitorOnly=true`
- `fullModuleAccess=true`
- `allowCheckout=false`
- `allowPlanMutation=false`
- `enforceLifecycleTransitions=false`

## 3. Pre-check operacional

1. Confirmar backup recente do banco.
2. Confirmar janela de manutencao curta para restart da API.
3. Confirmar que o `empresa_id` alvo e o da empresa proprietaria.

## 4. Aplicacao em producao

### 4.1 Aplicar flags no banco

Executar:

```bash
psql "$DATABASE_URL" -f backend/scripts/set-owner-tenant-billing-policy.sql
```

### 4.2 Aplicar fallback no ambiente da API

Configurar em producao:

```env
PLATFORM_OWNER_EMPRESA_IDS=250cc3ac-617b-4d8b-be6e-b14901e4edde
```

Observacao: se houver mais de um owner no futuro, separar por virgula.

### 4.3 Reiniciar backend

Reiniciar o servico da API para carregar a variavel de ambiente.

## 5. Validacao pos-deploy

1. Validar banco:

```sql
SELECT id, nome, ativo, status, configuracoes
FROM empresas
WHERE id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'::uuid;
```

2. Validar comportamento na UI (tenant owner):
- checkout bloqueado;
- alteracao de plano bloqueada;
- leitura de assinatura/uso sem bloqueio por vencimento.

3. Validar comportamento em tenant comum:
- checkout e mutacao de plano seguem fluxo normal.

## 6. Rollback

### 6.1 Reverter banco

```bash
psql "$DATABASE_URL" -f backend/scripts/unset-owner-tenant-billing-policy.sql
```

### 6.2 Limpar fallback de ambiente

Remover o UUID de `PLATFORM_OWNER_EMPRESA_IDS` e reiniciar a API.

## 7. Observacoes de governanca

- Nunca depender apenas da variavel de ambiente.
- Preferir persistencia no banco para rastreabilidade por tenant.
- Registrar no changelog interno qualquer troca de tenant proprietario.
