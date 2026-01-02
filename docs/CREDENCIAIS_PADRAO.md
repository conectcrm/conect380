# Credenciais Padrao do Ambiente Local

> Objetivo: centralizar as credenciais padrao usadas em desenvolvimento, smoke tests e scripts de verificacao do ConectSuite.

## 1. Usuario Administrador (default)

| Campo | Valor |
|-------|-------|
| Email | `admin@conectsuite.com.br` |
| Senha | `admin123` |
| Papel | `superadmin` (acesso total, inclusive Admin Console) |

### Onde usar
- Login no frontend local (`http://localhost:3000`).
- Smoke test oficial: `scripts/verify-backend.ps1` (parametros padrao `-Email`/`-Senha`).
- Scripts de diagnostico rapido (ex.: `test-cache-invalidation.ps1`, `testar-endpoints.ps1`).
- Playwright / Cypress fixtures que precisam autenticar antes dos testes.

### Boas praticas
- **Nao** expor essas credenciais fora do ambiente local.
- Para preservar o acesso ao Admin Console, mantenha o papel `superadmin` para pelo menos um usuario. Caso o papel seja alterado acidentalmente, execute `node backend/create-admin-user.js` para promover novamente.
- Para alterar temporariamente, passe novos valores via parametros (`-Email`, `-Senha`) ou `.env.local` do frontend, evitando editar os scripts.
- Atualize este arquivo sempre que o usuario padrao for substituido.

### Criar/Promover superadmin rapidamente
Execute um dos scripts abaixo (ambos ajustam a role para `superadmin` e evitam divergencias entre ambientes):

```bash
# Ambiente local
cd backend
node create-admin-user.js

# Ambiente configurado com .env.production
cd backend
node scripts/create-admin-user.js
```

> Esses scripts atualizam a senha para `admin123` (ou a informada na execução) e garantem que o usuario volte a ter o papel `superadmin`.

## 2. Como redefinir a senha padrao
1. Acesse o banco local (PostgreSQL na porta 5432).
2. Execute um `UPDATE` na tabela `users` para gerar um novo hash (use `bcrypt` 10 rounds).
3. Ajuste os scripts que dependem da senha (ou forneca a nova senha via parametros).

```sql
-- Exemplo (substitua HASH_BCRYPT pela senha gerada)
UPDATE users
SET senha = 'HASH_BCRYPT'
WHERE email = 'admin@conectsuite.com.br';
```

> Dica: execute `npm run build` no backend apos alterar credenciais hardcoded (caso existam) para garantir que a pasta `dist/` seja atualizada.

## 3. Referencias uteis
- `docs/ONBOARDING.md` — primeiro acesso ao sistema.
- `docs/TESTES_INTEGRACOES.md` — exemplo de cURL para autenticacao.
- `scripts/verify-backend.ps1` — smoke test automatico de login + faturamento.
- `docs/GUIA_ACESSO_RAPIDO.md` — fluxo completo de login + chat.

Manter as credenciais documentadas aqui evita divergencias entre guias, scripts e testes automatizados.
