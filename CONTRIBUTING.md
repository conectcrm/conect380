# 🤝 Guia de Contribuição - Conect360

Obrigado por contribuir com o **Conect360**! Este guia ajudará você a contribuir de forma profissional e organizada.

## 📋 Índice

- [Configuração do Ambiente](#-configuração-do-ambiente)
- [Padrões de Código](#-padrões-de-código)
- [Estrutura de Branches](#-estrutura-de-branches)
- [Commits Convencionais](#-commits-convencionais)
- [Pull Requests](#-pull-requests)
- [Testes](#-testes)

---

## 🚀 Configuração do Ambiente

### Pré-requisitos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14
- **Redis** >= 6.x (para filas)
- **Git** >= 2.30

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/Dhonleno/conect360.git
cd conect360

# 2. Backend
cd backend
cp .env.example .env
# Editar .env com suas credenciais
npm install
npm run migration:run
npm run start:dev

# 3. Frontend
cd ../frontend-web
cp .env.example .env
npm install
npm start
```

---

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM - Tipos explícitos
interface Usuario {
  id: string;
  nome: string;
  email: string;
}

async function buscarUsuario(id: string): Promise<Usuario> {
  // ...
}

// ❌ RUIM - any e sem tipos
async function buscarUsuario(id: any) {
  // ...
}
```

### Nomenclatura

```typescript
// Backend (NestJS)
user.entity.ts       → export class User
user.service.ts      → export class UserService
user.controller.ts   → export class UserController
create-user.dto.ts   → export class CreateUserDto

// Frontend (React)
UserPage.tsx         → export default UserPage
userService.ts       → export const userService
useUsers.ts          → export const useUsers
```

### Formatação

- **Indentação**: 2 espaços (não tabs)
- **Aspas**: Simples `'` (TypeScript) ou Template Literals `` ` ``
- **Ponto e vírgula**: Sempre usar
- **Max linha**: 100 caracteres

---

## 🌿 Estrutura de Branches

### Convenção de Nomes

```bash
# Features
feature/nome-da-feature
feature/gestao-equipes
feature/integracao-whatsapp

# Bugfixes
bugfix/nome-do-bug
bugfix/correcao-scroll-chat
bugfix/erro-500-nucleos

# Hotfixes (produção)
hotfix/nome-do-hotfix
hotfix/security-jwt-leak

# Melhorias
enhancement/nome-da-melhoria
enhancement/performance-queries

# Documentação
docs/nome-da-documentacao
docs/atualizar-readme
```

### Fluxo de Trabalho

```bash
# 1. Criar branch a partir de main/develop
git checkout main
git pull origin main
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e commitar
# (veja seção de commits)

# 3. Atualizar com main antes de PR
git checkout main
git pull origin main
git checkout feature/nova-funcionalidade
git rebase main

# 4. Push e criar PR
git push origin feature/nova-funcionalidade
```

---

## 📦 Commits Convencionais

### Formato

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional - detalhes>

<footer opcional - breaking changes, issues>
```

### Tipos

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(atendimento): adicionar chat omnichannel` |
| `fix` | Correção de bug | `fix(chat): corrigir scroll automático` |
| `docs` | Documentação | `docs: atualizar guia de instalação` |
| `style` | Formatação | `style: aplicar prettier em services` |
| `refactor` | Refatoração | `refactor(auth): extrair lógica JWT para helper` |
| `perf` | Performance | `perf(queries): otimizar consulta de tickets` |
| `test` | Testes | `test(users): adicionar testes unitários` |
| `build` | Build/dependências | `build: atualizar TypeORM para 0.3.x` |
| `ci` | CI/CD | `ci: adicionar workflow de testes` |
| `chore` | Tarefas diversas | `chore: limpar arquivos temporários` |

### Exemplos Completos

```bash
# Feature simples
git commit -m "feat(comercial): adicionar gestão de cotações"

# Bugfix com detalhes
git commit -m "fix(websocket): resolver loop infinito de mensagens

- Adicionar debounce de 300ms no listener
- Verificar duplicação por messageId
- Atualizar dependências do socket.io

Closes #123"

# Breaking change
git commit -m "feat(auth)!: migrar JWT para RS256

BREAKING CHANGE: Tokens antigos não funcionarão mais.
Usuários precisam fazer logout/login após deploy."
```

### Regras de Commit

✅ **Faça**:
- Commits pequenos e focados (uma mudança por commit)
- Mensagens claras em português
- Referenciar issues quando aplicável (`Closes #123`)
- Usar escopo quando relevante (`feat(auth):`, `fix(chat):`)

❌ **Não faça**:
- Commits com 50+ arquivos modificados
- Mensagens genéricas ("fix", "update", "changes")
- Commitar código comentado ou debug logs
- Commitar `.env` ou credenciais

---

## 🔀 Pull Requests

### Template de PR

```markdown
## 📋 Descrição

Breve descrição do que foi implementado/corrigido.

## 🎯 Tipo de mudança

- [ ] 🚀 Nova feature
- [ ] 🐛 Bugfix
- [ ] 📝 Documentação
- [ ] 🎨 Refatoração
- [ ] ⚡ Performance
- [ ] 🔒 Segurança

## ✅ Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes escritos e passando
- [ ] Documentação atualizada
- [ ] Branch atualizada com main
- [ ] Sem conflitos

## 🧪 Como testar

1. Passo a passo para testar a mudança
2. Cenários de teste
3. Comportamento esperado

## 📸 Screenshots (se aplicável)

(antes/depois para mudanças visuais)

## 🔗 Issues relacionadas

Closes #123
Refs #456
```

### Processo de Review

1. **Auto-review**: Revise seu próprio código antes de criar o PR
2. **Descrição completa**: Preencha o template completamente
3. **Testes**: Garanta que todos os testes passam
4. **CI/CD**: Aguarde pipelines passarem
5. **Feedback**: Responda aos comentários prontamente

---

## 🧪 Testes

### Backend (NestJS)

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('deve criar usuário', async () => {
    const dto = { nome: 'Teste', email: 'teste@example.com' };
    const result = await service.criar(dto);
    expect(result).toHaveProperty('id');
  });
});
```

```bash
# Executar testes
npm run test              # Unitários
npm run test:e2e          # End-to-end
npm run test:cov          # Com cobertura
```

### Frontend (React)

```typescript
// UserPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import UserPage from './UserPage';

describe('UserPage', () => {
  it('deve renderizar lista de usuários', async () => {
    render(<UserPage />);
    
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });
});
```

```bash
# Executar testes
npm test                  # Watch mode
npm run test:coverage     # Com cobertura
```

---

## 🔒 Segurança

### ❌ NUNCA Commitar:

- Credenciais (API keys, passwords, tokens)
- Arquivos `.env` (use `.env.example`)
- Dados sensíveis de clientes
- Certificados privados (`.pem`, `.key`)

### ✅ Sempre:

- Usar variáveis de ambiente
- Validar entrada do usuário
- Sanitizar dados antes de queries
- Manter dependências atualizadas

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Dhonleno/conect360/issues)
- **Discussões**: [GitHub Discussions](https://github.com/Dhonleno/conect360/discussions)
- **Email**: suporte@conectcrm.com

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Última atualização**: Novembro 2025
