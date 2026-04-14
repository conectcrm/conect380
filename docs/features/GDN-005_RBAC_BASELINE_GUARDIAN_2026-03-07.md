# GDN-005 - Baseline RBAC para Guardian (2026-03-07)

## Objetivo

Definir matriz minima de papeis e permissoes para Guardian sem vazamento de privilegio.

## Papeis alvo

1. `OWNER` (proprietario do sistema)
2. `SUPERADMIN` (operacao central do sistema)
3. `ADMIN` (administracao da empresa cliente)

## Estado atual relevante

1. Role existente no backend: `superadmin`, `admin`, `gerente`, `vendedor`, `suporte`, `financeiro`.
2. Permissoes de referencia: `Permission.ADMIN_EMPRESAS_MANAGE`, `Permission.PLANOS_MANAGE`, etc.
3. `SUPERADMIN` atualmente possui todas as permissoes por default.

## Baseline de acesso Guardian v1

| Acao | OWNER | SUPERADMIN | ADMIN |
|---|---|---|---|
| Gerenciar planos globais | Sim | Sim | Nao |
| Gerenciar empresas (multitenant) | Sim | Sim | Nao |
| Operacoes de cobranca global | Sim | Sim | Nao |
| Operacoes da propria empresa | Sim | Sim | Sim (somente propria empresa) |
| Delegar privilegio superadmin | Sim | Nao | Nao |

## Controles obrigatorios

1. MFA obrigatorio para `OWNER` e `SUPERADMIN`.
2. Rotas Guardian exigem role + permissao explicita.
3. Acoes criticas com dupla aprovacao quando aplicavel.
4. Auditoria obrigatoria com before/after, ator e IP.

## Mapeamento inicial para implementacao

1. `SUPERADMIN`:
   - `admin.empresas.manage`
   - `planos.manage`
   - `users.update`
2. `ADMIN`:
   - Sem acesso a escopo global
   - Apenas permissoes da propria empresa

## Gap tecnico a implementar

1. `OWNER` ainda nao existe como role dedicada no modelo atual.
2. Recomendacao: claim dedicada (`isSystemOwner=true`) com guard especifico no namespace `guardian/*`.
