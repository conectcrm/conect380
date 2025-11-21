# 🤝 Guia de Contribuição - ConectSuite

**Versão**: 1.0.0  
**Última atualização**: 6 de novembro de 2025

Obrigado por contribuir com o ConectSuite! Este guia explica como fazer isso de forma eficiente e profissional.

---

## 📋 Índice

1. [Código de Conduta](#-código-de-conduta)
2. [Como Contribuir](#-como-contribuir)
3. [Workflow Git](#-workflow-git)
4. [Padrões de Commit](#-padrões-de-commit)
5. [Pull Requests](#-pull-requests)
6. [Code Review](#-code-review)
7. [Testes](#-testes)
8. [Documentação](#-documentação)

---

## 📜 Código de Conduta

Ao contribuir, você concorda em:

- ✅ Ser respeitoso com todos os colaboradores
- ✅ Aceitar feedback construtivo
- ✅ Focar no que é melhor para o projeto
- ✅ Manter comunicação clara e profissional
- ❌ Não tolerar assédio, discriminação ou comportamento tóxico

**Reportar problemas**: Se você testemunhar comportamento inadequado, contate os mantenedores.

---

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Reportar Bugs**
   - Use o template de issue em [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#-quando-pedir-ajuda)
   - Inclua: descrição, passos para reproduzir, erro completo, ambiente
   - Verifique se já não existe issue similar

2. **✨ Sugerir Features**
   - Abra uma issue com tag `enhancement`
   - Explique: problema que resolve, solução proposta, alternativas consideradas
   - Aguarde discussão antes de implementar

3. **📝 Melhorar Documentação**
   - Erros de digitação, exemplos, clarificações são sempre bem-vindos
   - Siga estrutura existente dos docs

4. **💻 Contribuir com Código**
   - Siga workflow Git abaixo
   - Respeite padrões em [CODE_PATTERNS.md](./CODE_PATTERNS.md)
   - Adicione testes para código novo
   - Atualize documentação relevante

---

## 🌳 Workflow Git

### Estrutura de Branches

```
main (produção)
  ↓
develop (desenvolvimento)
  ↓
feature/nome-da-feature
hotfix/nome-do-bug
```

### Branches Principais

- **`main`**: Código em produção (protegida, só via PR)
- **`develop`**: Integração de features (protegida, só via PR)

### Branches de Trabalho

- **`feature/`**: Nova funcionalidade
  - Exemplo: `feature/chat-audio-mensagens`
  - Base: `develop`

- **`bugfix/`**: Correção de bug não crítico
  - Exemplo: `bugfix/scroll-chat-automatico`
  - Base: `develop`

- **`hotfix/`**: Bug crítico em produção
  - Exemplo: `hotfix/webhook-whatsapp-timeout`
  - Base: `main`

- **`refactor/`**: Refatoração sem mudar comportamento
  - Exemplo: `refactor/zustand-selectors`
  - Base: `develop`

- **`docs/`**: Apenas documentação
  - Exemplo: `docs/troubleshooting-guide`
  - Base: `develop`

---

## 🔧 Passo a Passo

### 1️⃣ Criar Nova Branch

```bash
# Atualizar develop
git checkout develop
git pull origin develop

# Criar branch de feature
git checkout -b feature/minha-feature

# Ou criar branch de bugfix
git checkout -b bugfix/corrigir-problema
```

### 2️⃣ Fazer Alterações

```bash
# Fazer mudanças no código

# Verificar status
git status

# Ver diff
git diff

# Adicionar arquivos
git add caminho/do/arquivo.ts

# OU adicionar tudo (cuidado!)
git add .
```

### 3️⃣ Commitar

```bash
# Commit com mensagem seguindo padrão
git commit -m "feat(atendimento): adicionar áudio em mensagens"

# Ver commits
git log --oneline
```

### 4️⃣ Push

```bash
# Push da branch
git push origin feature/minha-feature

# Se primeira vez, pode precisar:
git push --set-upstream origin feature/minha-feature
```

### 5️⃣ Criar Pull Request

1. Ir no GitHub: https://github.com/Dhonleno/conectsuite
2. Clicar em "Compare & pull request"
3. Preencher template (veja seção [Pull Requests](#-pull-requests))
4. Solicitar revisores
5. Aguardar code review

---

## 💬 Padrões de Commit

Seguimos **Conventional Commits**: `<tipo>(<escopo>): <descrição>`

### Tipos de Commit

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `feat` | Nova funcionalidade | `feat(chat): adicionar envio de áudio` |
| `fix` | Correção de bug | `fix(auth): corrigir validação de JWT` |
| `docs` | Apenas documentação | `docs: atualizar README com setup` |
| `style` | Formatação (sem mudança lógica) | `style: formatar código com Prettier` |
| `refactor` | Refatoração | `refactor(store): usar selectors individuais` |
| `perf` | Melhoria de performance | `perf(api): adicionar paginação em tickets` |
| `test` | Adicionar/modificar testes | `test(hooks): adicionar testes useAtendimentos` |
| `chore` | Tarefas de build/configs | `chore: atualizar dependências` |
| `ci` | CI/CD | `ci: adicionar workflow GitHub Actions` |
| `revert` | Reverter commit anterior | `revert: reverter "feat(chat): áudio"` |

### Escopos Comuns

- `atendimento`: Módulo de atendimento
- `chat`: Chat omnichannel
- `auth`: Autenticação
- `api`: Backend geral
- `ui`: Interface/componentes
- `db`: Banco de dados
- `webhook`: Integrações webhook
- `store`: Estado Zustand

### Exemplos de Commits

```bash
# ✅ BOM - Descrição clara e concisa
git commit -m "feat(atendimento): adicionar triagem automática por IA"
git commit -m "fix(chat): corrigir scroll infinito em useEffect"
git commit -m "docs(troubleshooting): documentar loops infinitos"
git commit -m "refactor(store): usar selectors individuais"
git commit -m "test(api): adicionar testes para webhook WhatsApp"
git commit -m "perf(queries): otimizar N+1 com eager loading"

# ❌ RUIM - Vago, sem contexto
git commit -m "fix bug"
git commit -m "update"
git commit -m "teste"
git commit -m "ajustes"
```

### Commits com Breaking Changes

Se mudança quebra compatibilidade:

```bash
git commit -m "feat(api)!: mudar estrutura de response de tickets

BREAKING CHANGE: campo 'cliente' agora é 'contato' na response"
```

### Commits Longos (Body + Footer)

```bash
git commit -m "feat(chat): adicionar suporte a áudio

Implementa gravação, envio e reprodução de mensagens de áudio.

- Gravador com botão hold-to-record
- Player customizado com waveform
- Upload para S3 com presigned URLs

Closes #123"
```

---

## 🔀 Pull Requests

### Template de PR

Ao criar PR, preencha:

```markdown
## 📋 Descrição

[Explique o que essa PR faz]

## 🎯 Motivação e Contexto

[Por que essa mudança é necessária? Que problema resolve?]

## 🧪 Como Testar

1. Fazer checkout da branch: `git checkout feature/minha-feature`
2. Instalar dependências: `npm install`
3. Rodar migrations: `npm run migration:run`
4. Iniciar backend: `npm run start:dev`
5. Testar funcionalidade X, Y, Z

## ✅ Checklist

- [ ] Código segue padrões de [CODE_PATTERNS.md](./docs/CODE_PATTERNS.md)
- [ ] Testes unitários adicionados/atualizados
- [ ] Testes passando (`npm test`)
- [ ] Documentação atualizada (se necessário)
- [ ] Build sem erros (`npm run build`)
- [ ] Sem console.log esquecidos
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Commits seguem Conventional Commits
- [ ] PR tem título descritivo

## 🔗 Issues Relacionadas

Closes #123
Fixes #456
Related to #789

## 📸 Screenshots (se UI)

[Adicionar prints antes/depois]

## 🚨 Breaking Changes

- [ ] Sim (descrever abaixo)
- [x] Não

[Se sim, descrever o que quebra e como migrar]
```

---

### Tamanho da PR

**Mantenha PRs pequenas e focadas!**

- ✅ **Ideal**: 1 feature/fix por PR
- ✅ **Bom**: < 500 linhas alteradas
- ⚠️ **Aceitável**: 500-1000 linhas (se justificado)
- ❌ **Evitar**: > 1000 linhas (dificulta review)

**Se PR está grande**:
1. Separar em múltiplas PRs menores
2. Usar feature flags para merge incremental
3. Documentar bem o contexto

---

### Draft PRs

Use Draft PR para:
- Mostrar progresso (WIP - Work in Progress)
- Pedir feedback antecipado
- CI rodar antes de review final

```bash
# Criar Draft PR no GitHub
1. Abrir PR
2. Clicar "Create draft pull request"
3. Quando pronto: "Ready for review"
```

---

## 👀 Code Review

### Para Quem Revisa

#### O Que Verificar

1. **Funcionalidade**:
   - [ ] Código faz o que diz fazer?
   - [ ] Edge cases cobertos?
   - [ ] Não quebra funcionalidades existentes?

2. **Qualidade**:
   - [ ] Segue padrões de [CODE_PATTERNS.md](./CODE_PATTERNS.md)?
   - [ ] Código legível e bem estruturado?
   - [ ] Nomes descritivos?
   - [ ] Sem duplicação desnecessária?

3. **Segurança**:
   - [ ] Sem credenciais hardcoded?
   - [ ] Validação de entrada (backend E frontend)?
   - [ ] Sem SQL injection ou XSS?
   - [ ] RLS funcionando (multi-tenancy)?

4. **Performance**:
   - [ ] Queries otimizadas (sem N+1)?
   - [ ] Paginação em listagens grandes?
   - [ ] Memoização onde necessário?
   - [ ] Sem loops infinitos?

5. **Testes**:
   - [ ] Testes passando?
   - [ ] Cobertura adequada?
   - [ ] Testa casos de erro?

6. **Documentação**:
   - [ ] JSDoc em funções complexas?
   - [ ] README atualizado (se necessário)?
   - [ ] CHANGELOG atualizado (se necessário)?

---

#### Como Dar Feedback

**✅ BOM**:
```markdown
💡 Sugestão: Podemos extrair essa lógica para um hook reutilizável?

```typescript
const { dados, loading, error } = useFetch('/api/tickets');
```

Isso evita duplicação em outros componentes.
```

**❌ RUIM**:
```markdown
Esse código está horrível. Refatore.
```

---

#### Tipos de Comentários

- **🚨 Blocker**: Deve ser corrigido antes de merge
  - Exemplo: Bug, segurança, quebra sistema

- **💡 Sugestão**: Melhorias opcionais
  - Exemplo: Refatoração, padrão alternativo

- **❓ Pergunta**: Esclarecer intenção
  - Exemplo: "Por que usar X em vez de Y?"

- **✅ Aprovação**: Elogie bom código!
  - Exemplo: "Excelente uso de useMemo aqui!"

---

### Para Quem Recebe Review

#### Como Responder

1. **Agradeça o feedback** 🙏
2. **Faça perguntas** se não entendeu
3. **Explique decisões** se necessário
4. **Implemente sugestões** ou argumente se discordar
5. **Resolve comentários** após implementar

**Exemplo**:
```markdown
> 💡 Sugestão: Extrair para hook reutilizável?

Boa ideia! Vou criar `useFetchTickets` e atualizar. ✅

[Commit implementando sugestão]

Implementado no commit abc123. Pode revisar?
```

---

#### Discordância Respeitosa

Se discordar de sugestão:

```markdown
> 💡 Sugestão: Usar Redux em vez de Zustand

Entendo a sugestão, mas mantive Zustand porque:

1. Já é usado no resto do projeto (consistência)
2. Menos boilerplate (actions/reducers)
3. Performance similar no nosso caso de uso

Referência: [Link para discussão anterior]

Mas estou aberto a discutir mais se você tiver outros pontos!
```

---

## 🧪 Testes

### Requisitos

**TODA PR deve incluir testes!**

- ✅ **Backend**: Testes unitários (Jest)
  - Services com lógica de negócio
  - Controllers (se lógica complexa)
  - Casos de sucesso + erro

- ✅ **Frontend**: Testes de componentes (React Testing Library)
  - Componentes com lógica
  - Hooks customizados
  - Estados (loading, error, success)

---

### Comandos de Teste

```bash
# Backend
cd backend
npm test                    # Rodar todos
npm test -- useAtendimentos # Rodar específico
npm test -- --coverage      # Com cobertura

# Frontend
cd frontend-web
npm test                    # Rodar todos
npm test -- Chat            # Rodar específico
npm run test:coverage       # Com cobertura
```

---

### Exemplo de Teste (Backend)

```typescript
// backend/src/modules/atendimento/services/ticket.service.spec.ts

describe('TicketService', () => {
  let service: TicketService;
  let repository: Repository<Ticket>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    repository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  });

  describe('criar', () => {
    it('deve criar ticket com sucesso', async () => {
      const dto = { titulo: 'Novo Ticket', prioridade: 'ALTA' };
      const mockTicket = { id: '1', ...dto };

      jest.spyOn(repository, 'save').mockResolvedValue(mockTicket as any);

      const result = await service.criar(dto);

      expect(result).toEqual(mockTicket);
      expect(repository.save).toHaveBeenCalledWith(dto);
    });

    it('deve lançar erro se validação falhar', async () => {
      const dto = { titulo: '', prioridade: 'INVALIDA' };

      await expect(service.criar(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
```

---

### Exemplo de Teste (Frontend)

```typescript
// frontend-web/src/features/atendimento/ChatArea.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatArea from './ChatArea';

describe('ChatArea', () => {
  it('deve renderizar mensagens', () => {
    const mensagens = [
      { id: '1', texto: 'Olá', tipo: 'recebida' },
      { id: '2', texto: 'Oi', tipo: 'enviada' },
    ];

    render(<ChatArea mensagens={mensagens} />);

    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(screen.getByText('Oi')).toBeInTheDocument();
  });

  it('deve enviar mensagem ao clicar botão', async () => {
    const onEnviar = jest.fn();
    const user = userEvent.setup();

    render(<ChatArea mensagens={[]} onEnviar={onEnviar} />);

    const input = screen.getByPlaceholderText('Digite uma mensagem...');
    const botao = screen.getByRole('button', { name: /enviar/i });

    await user.type(input, 'Teste');
    await user.click(botao);

    expect(onEnviar).toHaveBeenCalledWith('Teste');
  });

  it('deve mostrar loading enquanto envia', async () => {
    render(<ChatArea mensagens={[]} loading={true} />);

    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });
});
```

---

## 📝 Documentação

### O Que Documentar

1. **Código**:
   - JSDoc em funções públicas
   - Comentários em lógica complexa
   - TODO/FIXME quando necessário

2. **README**:
   - Se adicionar nova dependência
   - Se mudar setup/instalação
   - Se adicionar comando novo

3. **Docs técnicos**:
   - Arquitetura (se mudar estrutura): [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Padrões (se criar novo padrão): [CODE_PATTERNS.md](./CODE_PATTERNS.md)
   - Troubleshooting (se resolver bug comum): [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

4. **CHANGELOG**:
   - Breaking changes (sempre!)
   - Features importantes
   - Bug fixes críticos

---

### Exemplo JSDoc

```typescript
/**
 * Busca tickets por filtros com paginação
 * 
 * @param filtros - Objeto com filtros opcionais
 * @param filtros.status - Status do ticket (ABERTO, EM_ANDAMENTO, FECHADO)
 * @param filtros.prioridade - Prioridade (BAIXA, MEDIA, ALTA, URGENTE)
 * @param filtros.departamento - ID do departamento
 * @param page - Número da página (1-based)
 * @param limit - Itens por página (padrão: 20)
 * 
 * @returns Promise com objeto contendo items, total, page, totalPages
 * 
 * @throws {NotFoundException} Se nenhum ticket encontrado
 * @throws {BadRequestException} Se filtros inválidos
 * 
 * @example
 * ```typescript
 * const resultado = await buscarTickets(
 *   { status: 'ABERTO', prioridade: 'ALTA' },
 *   1,
 *   20
 * );
 * console.log(resultado.items); // Tickets da página 1
 * ```
 */
async buscarTickets(
  filtros: FiltroTicketsDto,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Ticket>> {
  // ...
}
```

---

## 🎯 Checklist Final

Antes de abrir PR, verifique:

### Código
- [ ] Segue padrões de [CODE_PATTERNS.md](./CODE_PATTERNS.md)
- [ ] Sem console.log esquecidos
- [ ] Sem código comentado (deletar em vez de comentar)
- [ ] Imports organizados e sem não usados
- [ ] TypeScript sem erros (`npm run type-check`)

### Testes
- [ ] Testes unitários adicionados
- [ ] Testes passando (`npm test`)
- [ ] Casos de erro testados
- [ ] Cobertura adequada (>80% ideal)

### Build
- [ ] Build sem erros (`npm run build`)
- [ ] Sem warnings críticos
- [ ] Migrations criadas (se mudou DB)
- [ ] Migrations testadas (`npm run migration:run`)

### Git
- [ ] Commits seguem Conventional Commits
- [ ] Mensagens de commit descritivas
- [ ] Branch atualizada com develop/main
- [ ] Conflitos resolvidos

### Documentação
- [ ] JSDoc em código novo (se complexo)
- [ ] README atualizado (se necessário)
- [ ] CHANGELOG atualizado (se breaking change)
- [ ] Docs técnicos atualizados (se aplicável)

### Segurança
- [ ] Sem credenciais hardcoded
- [ ] Validação de entrada implementada
- [ ] RLS verificado (multi-tenancy)
- [ ] Sem vulnerabilidades conhecidas

### Performance
- [ ] Queries otimizadas (sem N+1)
- [ ] Paginação implementada (se lista grande)
- [ ] Memoização onde necessário (React)
- [ ] Sem loops infinitos (useEffect deps corretos)

---

## 🆘 Precisa de Ajuda?

- 📖 **Documentação**: Comece por [ARCHITECTURE.md](./ARCHITECTURE.md) e [CODE_PATTERNS.md](./CODE_PATTERNS.md)
- 🐛 **Problemas**: Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 🚀 **Setup inicial**: Veja [ONBOARDING.md](./ONBOARDING.md)
- 💬 **Dúvidas**: Abra uma issue com tag `question`
- 👥 **Discussão**: Use Discussions no GitHub

---

## 🎓 Recursos Úteis

### Git & GitHub
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Como escrever boas mensagens de commit](https://chris.beams.io/posts/git-commit/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### React
- [React Docs](https://react.dev/)
- [React Testing Library](https://testing-library.com/react)

### NestJS
- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)

---

## 🙏 Agradecimentos

**Obrigado por contribuir!** Cada PR, issue, review ou sugestão torna o ConectSuite melhor para todos. 🚀

---

**Última revisão**: 6 de novembro de 2025  
**Mantenedores**: Equipe ConectSuite
