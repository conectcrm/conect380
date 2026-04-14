# Auditoria de Permissoes - Compras MVP (2026-03-05)

- Data/hora: 2026-03-05 08:25
- Ambiente: local (`conectsuite-postgres`, database `conectcrm`)
- Empresa analisada: `250cc3ac-617b-4d8b-be6e-b14901e4edde`

## Consultas executadas

```sql
select email, role, ativo
from users
where empresa_id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'
  and coalesce(permissoes,'') ilike '%financeiro.pagamentos.read%';
```

```sql
select email, role, ativo
from users
where empresa_id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'
  and coalesce(permissoes,'') ilike '%financeiro.pagamentos.manage%';
```

```sql
select email, role, ativo
from users
where empresa_id = '250cc3ac-617b-4d8b-be6e-b14901e4edde'
  and coalesce(permissoes,'') ilike '%comercial.propostas.read%'
  and coalesce(permissoes,'') not ilike '%financeiro.pagamentos.read%'
  and coalesce(permissoes,'') not ilike '%financeiro.pagamentos.manage%';
```

## Resultado

1. Usuarios com `financeiro.pagamentos.read`:
   - `financeiro@conect360.com` (`role=financeiro`, `ativo=true`)
2. Usuarios com `financeiro.pagamentos.manage`:
   - `financeiro@conect360.com` (`role=financeiro`, `ativo=true`)
3. Usuarios ativos com permissao comercial (`comercial.propostas.read`) e sem permissao financeira de compras:
   - `gabriel@conect360.com` (`admin`)
   - `ledayane@conect.com` (`vendedor`)
   - `ledayane@gmail.com` (`vendedor`)
   - `operador@conect360.com` (`gerente`)
   - `vendedor@conect360.com` (`vendedor`)

## Conclusao operacional

1. Perfil comprador/aprovador de compras existe e esta ativo (`financeiro@conect360.com`).
2. Ha usuarios comerciais/administrativos sem permissao financeira de compras, coerente com segregacao de acesso.
3. Para go-live em homolog/producao, repetir a mesma auditoria por tenant e validar matriz de acesso aprovada pelo negocio.
