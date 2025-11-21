# 🚫 REGRAS ANTI-GAMBIARRAS - CÓDIGO LIMPO OBRIGATÓRIO

**ATENÇÃO**: Este arquivo contém **REGRAS INEGOCIÁVEIS** para o desenvolvimento do ConectCRM.  
**TODO desenvolvedor** (incluindo AIs) **DEVE** seguir estas regras **SEM EXCEÇÃO**.

---

## 🎯 PRINCÍPIO FUNDAMENTAL

> **"Gambiarra é débito técnico disfarçado de solução rápida."**

**Regra de Ouro**: Se você precisa explicar por que o código funciona, ele está errado.

---

## ❌ PROIBIDO TERMINANTEMENTE

### 1. NUNCA usar `any` em TypeScript

```typescript
// ❌ PROIBIDO
function processar(dados: any) {
  return dados.nome;
}

// ✅ CORRETO
interface Usuario {
  nome: string;
  email: string;
}

function processar(dados: Usuario) {
  return dados.nome;
}
```

**Punição**: PR rejeitado imediatamente.

---

### 2. NUNCA deixar `console.log` em produção

```typescript
// ❌ PROIBIDO
console.log('Debug aqui');
console.log(dados);

// ✅ CORRETO (usar Logger)
this.logger.log('Processando dados', { userId: dados.id });
this.logger.debug('Detalhes:', dados);
```

**Punição**: Build falha, commit bloqueado.

---

### 3. NUNCA fazer queries N+1

```typescript
// ❌ PROIBIDO - N+1 Query
const tickets = await this.ticketRepository.find();
for (const ticket of tickets) {
  ticket.mensagens = await this.mensagemRepository.find({
    where: { ticketId: ticket.id }
  }); // ⚠️ 1 query por ticket = N queries!
}

// ✅ CORRETO - Eager Loading
const tickets = await this.ticketRepository.find({
  relations: ['mensagens']
}); // ⚠️ Apenas 1 query!
```

**Punição**: PR rejeitado + explicação obrigatória.

---

### 4. NUNCA duplicar código

```typescript
// ❌ PROIBIDO
async function buscarUsuarioAtivo(id: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) throw new NotFoundException();
  if (!user.ativo) throw new BadRequestException();
  return user;
}

async function buscarUsuarioPorEmail(email: string) {
  const user = await this.userRepository.findOne({ where: { email } });
  if (!user) throw new NotFoundException();
  if (!user.ativo) throw new BadRequestException(); // ⚠️ DUPLICADO!
  return user;
}

// ✅ CORRETO - Extrair lógica comum
private validarUsuarioAtivo(user: User | null): User {
  if (!user) {
    throw new NotFoundException('Usuário não encontrado');
  }
  if (!user.ativo) {
    throw new BadRequestException('Usuário inativo');
  }
  return user;
}

async buscarUsuarioAtivo(id: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  return this.validarUsuarioAtivo(user);
}

async buscarUsuarioPorEmail(email: string) {
  const user = await this.userRepository.findOne({ where: { email } });
  return this.validarUsuarioAtivo(user);
}
```

**Punição**: Refatoração obrigatória antes de merge.

---

### 5. NUNCA fazer lógica de negócio no Controller

```typescript
// ❌ PROIBIDO
@Post()
async criar(@Body() dto: CreateUserDto) {
  // ⚠️ Lógica NO CONTROLLER!
  if (!dto.email.includes('@')) {
    throw new BadRequestException('Email inválido');
  }
  
  const hash = await bcrypt.hash(dto.senha, 10);
  
  const user = this.userRepository.create({
    ...dto,
    senha: hash
  });
  
  return this.userRepository.save(user);
}

// ✅ CORRETO - Lógica no SERVICE
@Post()
async criar(@Body() dto: CreateUserDto) {
  return this.userService.criar(dto); // Controller só delega!
}

// No service:
async criar(dto: CreateUserDto): Promise<User> {
  this.validarEmail(dto.email);
  const senhaHash = await this.hashSenha(dto.senha);
  return this.salvar({ ...dto, senha: senhaHash });
}
```

**Punição**: PR rejeitado + revisão de arquitetura.

---

### 6. NUNCA fazer upload sem validação

```typescript
// ❌ PROIBIDO
@Post('upload')
async upload(@UploadedFile() file: Express.Multer.File) {
  const filename = `${Date.now()}_${file.originalname}`;
  await fs.writeFile(`./uploads/${filename}`, file.buffer);
  return { url: `/uploads/${filename}` };
}

// ✅ CORRETO
@Post('upload')
async upload(@UploadedFile() file: Express.Multer.File) {
  // 1. Validar tamanho
  if (file.size > 50 * 1024 * 1024) { // 50MB
    throw new BadRequestException('Arquivo muito grande');
  }
  
  // 2. Validar tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Tipo não permitido');
  }
  
  // 3. Sanitizar nome
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${randomUUID()}_${safeName}`;
  
  // 4. Salvar
  await this.uploadService.salvar(filename, file.buffer);
  
  return { url: `/uploads/${filename}` };
}
```

**Punição**: PR rejeitado (vulnerabilidade de segurança).

---

### 7. NUNCA fazer requisições HTTP sem timeout e retry

```typescript
// ❌ PROIBIDO
async enviarWhatsApp(telefone: string, mensagem: string) {
  const response = await axios.post('https://api.whatsapp.com/send', {
    to: telefone,
    message: mensagem
  });
  return response.data;
}

// ✅ CORRETO
async enviarWhatsApp(telefone: string, mensagem: string) {
  const config = {
    timeout: 10000, // 10 segundos
    retry: {
      retries: 3,
      retryDelay: (retryCount: number) => {
        return retryCount * 1000; // 1s, 2s, 3s
      },
      retryCondition: (error: any) => {
        return error.response?.status >= 500; // Retry apenas em erros 5xx
      }
    }
  };
  
  try {
    const response = await axios.post(
      'https://api.whatsapp.com/send',
      { to: telefone, message: mensagem },
      config
    );
    return response.data;
  } catch (error) {
    this.logger.error(`Erro ao enviar WhatsApp: ${error.message}`);
    throw new ServiceUnavailableException('Falha ao enviar mensagem');
  }
}
```

**Punição**: PR rejeitado (requisito de confiabilidade).

---

### 8. NUNCA usar magic numbers

```typescript
// ❌ PROIBIDO
if (tickets.length > 50) {
  return tickets.slice(0, 50);
}

setTimeout(() => {
  this.verificar();
}, 300000); // ⚠️ O que é 300000?

// ✅ CORRETO
const MAX_TICKETS_PER_PAGE = 50;
const VERIFICACAO_INTERVALO_MS = 5 * 60 * 1000; // 5 minutos

if (tickets.length > MAX_TICKETS_PER_PAGE) {
  return tickets.slice(0, MAX_TICKETS_PER_PAGE);
}

setTimeout(() => {
  this.verificar();
}, VERIFICACAO_INTERVALO_MS);
```

**Punição**: Refatoração obrigatória.

---

### 9. NUNCA usar reconexão sem backoff exponencial

```typescript
// ❌ PROIBIDO - Reconnect storm
socket.on('disconnect', () => {
  socket.connect(); // ⚠️ Reconecta imediatamente = loop infinito!
});

// ✅ CORRETO - Backoff exponencial
let retryCount = 0;
const MAX_RETRIES = 10;
const INITIAL_DELAY = 1000;

function conectar() {
  socket = io(URL);
  
  socket.on('disconnect', () => {
    if (retryCount >= MAX_RETRIES) {
      console.error('Máximo de tentativas atingido');
      return;
    }
    
    const delay = Math.min(
      INITIAL_DELAY * Math.pow(2, retryCount),
      30000 // max 30s
    );
    
    retryCount++;
    
    setTimeout(() => {
      conectar();
    }, delay);
  });
}
```

**Punição**: PR rejeitado (pode derrubar servidor).

---

### 10. NUNCA retornar dados sensíveis sem sanitização

```typescript
// ❌ PROIBIDO
@Get('perfil')
async perfil(@CurrentUser() user: User) {
  return user; // ⚠️ Retorna senha, tokens, etc!
}

// ✅ CORRETO
@Get('perfil')
async perfil(@CurrentUser() user: User) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    foto: user.foto,
    // ⚠️ NÃO retorna: senha, token, etc
  };
}

// OU usar class-transformer
export class UserResponseDto {
  @Expose()
  id: string;
  
  @Expose()
  nome: string;
  
  @Expose()
  email: string;
  
  @Exclude()
  senha: string; // Nunca expor
  
  @Exclude()
  token: string; // Nunca expor
}
```

**Punição**: PR rejeitado (vulnerabilidade crítica).

---

## ✅ OBRIGATÓRIO EM TODO CÓDIGO

### 1. TODO método público tem JSDoc

```typescript
/**
 * Busca tickets por status com paginação
 * 
 * @param status - Status do ticket (ABERTO, EM_ATENDIMENTO, RESOLVIDO)
 * @param page - Número da página (1-based)
 * @param limit - Itens por página (padrão: 20, máximo: 100)
 * @returns Lista paginada de tickets
 * @throws NotFoundException se nenhum ticket encontrado
 * @throws BadRequestException se parâmetros inválidos
 * 
 * @example
 * const result = await ticketService.buscarPorStatus('ABERTO', 1, 20);
 * console.log(result.tickets); // Array de tickets
 */
async buscarPorStatus(
  status: StatusTicket,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Ticket>> {
  // Implementação
}
```

---

### 2. TODO endpoint REST tem validação (DTO)

```typescript
// DTO com validações
export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  assunto: string;
  
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  descricao: string;
  
  @IsEnum(PrioridadeTicket)
  prioridade: PrioridadeTicket;
  
  @IsUUID()
  canalId: string;
  
  @IsOptional()
  @IsEmail()
  clienteEmail?: string;
}

// Controller
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async criar(@Body() dto: CreateTicketDto) {
  return this.ticketService.criar(dto);
}
```

---

### 3. TODO serviço externo tem tratamento de erro

```typescript
async enviarEmail(to: string, subject: string, body: string) {
  try {
    await this.emailService.send({ to, subject, body });
    this.logger.log(`Email enviado para ${to}`);
  } catch (error) {
    this.logger.error(
      `Erro ao enviar email para ${to}: ${error.message}`,
      error.stack
    );
    
    // Não lança erro, apenas loga (email não é crítico)
    // OU
    throw new ServiceUnavailableException('Falha ao enviar email');
  }
}
```

---

### 4. TODO estado no React usa useState/Zustand corretamente

```typescript
// ❌ PROIBIDO
let tickets = []; // ⚠️ Variável global!

function ChatOmnichannel() {
  tickets = await api.get('/tickets'); // ⚠️ Não re-renderiza!
  return <div>{tickets.length}</div>;
}

// ✅ CORRETO
function ChatOmnichannel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  useEffect(() => {
    const carregar = async () => {
      const data = await api.get('/tickets');
      setTickets(data);
    };
    carregar();
  }, []);
  
  return <div>{tickets.length}</div>;
}
```

---

### 5. TODO componente React tem estados de loading/error/empty

```typescript
function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get('/tickets');
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);
  
  // ✅ Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // ✅ Error state
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // ✅ Empty state
  if (tickets.length === 0) {
    return <EmptyState message="Nenhum ticket encontrado" />;
  }
  
  // ✅ Success state
  return (
    <div>
      {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
    </div>
  );
}
```

---

## 🔍 CHECKLIST PRÉ-COMMIT (AUTOMÁTICO)

Adicionar no `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Executando verificações..."

# 1. Lint
echo "📝 Lint..."
npm run lint || exit 1

# 2. Type check
echo "🔧 Type check..."
npm run type-check || exit 1

# 3. Testes
echo "🧪 Testes..."
npm test -- --coverage --coverageThreshold='{"global":{"lines":70}}' || exit 1

# 4. Verificar console.log
echo "🔍 Procurando console.log..."
git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -n "console\.log" && {
  echo "❌ ERRO: console.log encontrado! Remova antes de commitar."
  exit 1
}

# 5. Verificar any
echo "🔍 Procurando 'any'..."
git diff --cached --name-only | grep -E '\.ts$' | xargs grep -n ": any" && {
  echo "❌ ERRO: Tipo 'any' encontrado! Use tipos corretos."
  exit 1
}

# 6. Verificar TODO sem issue
echo "🔍 Procurando TODO sem issue..."
git diff --cached | grep -E "// TODO(?! #\d+)" && {
  echo "⚠️ AVISO: TODO encontrado sem issue. Crie uma issue no GitHub."
  echo "Formato correto: // TODO #123: Descrição"
}

echo "✅ Todas as verificações passaram!"
```

---

## 📊 MÉTRICAS DE QUALIDADE (AUTOMÁTICAS)

### SonarQube/SonarCloud (Recomendado)

```yaml
# sonar-project.properties
sonar.projectKey=conectcrm
sonar.organization=your-org

# Paths
sonar.sources=backend/src,frontend-web/src
sonar.tests=backend/src/**/*.spec.ts,frontend-web/src/**/*.test.tsx

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Quality Gates
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# Rules
sonar.issue.ignore.multicriteria=e1,e2

# Ignorar console.log temporários em dev
sonar.issue.ignore.multicriteria.e1.ruleKey=typescript:S2228
sonar.issue.ignore.multicriteria.e1.resourceKey=**/*.dev.ts

# Complexity máxima
sonar.typescript.complexity.max=10
```

### GitHub Actions (CI/CD)

```yaml
# .github/workflows/quality-check.yml
name: Quality Check

on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Check console.log
        run: |
          if git diff origin/main --name-only | grep -E '\.(ts|tsx)$' | xargs grep -n "console\.log"; then
            echo "❌ console.log encontrado!"
            exit 1
          fi
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

## 🎓 RESPONSABILIDADES

### Tech Lead
- Revisar TODOS os PRs
- Garantir cumprimento das regras
- Atualizar este documento
- Treinar novos desenvolvedores

### Desenvolvedores
- Seguir TODAS as regras
- Executar checklist pré-commit
- Solicitar code review antes de merge
- Reportar possíveis melhorias

### QA
- Validar qualidade do código
- Executar testes E2E
- Reportar violações de regras

---

## 🚨 VIOLAÇÕES E CONSEQUÊNCIAS

### 1ª Violação
- ⚠️ Aviso formal
- 📚 Leitura obrigatória deste documento
- 🔄 Refatoração imediata do código

### 2ª Violação
- ⚠️⚠️ Aviso com registro
- 👥 Pair programming obrigatório (1 semana)
- 📖 Treinamento de código limpo

### 3ª Violação
- 🚫 Revogação de permissão de merge
- 📝 Plano de melhoria obrigatório
- 👨‍🏫 Mentoria individual

---

## 📚 RECURSOS RECOMENDADOS

1. **Clean Code** - Robert C. Martin
2. **Refactoring** - Martin Fowler
3. **Design Patterns** - Gang of Four
4. **NestJS Documentation** - https://docs.nestjs.com/
5. **React Best Practices** - https://react.dev/
6. **TypeScript Deep Dive** - https://basarat.gitbook.io/typescript/

---

## 🎯 LEMA

> **"Código é escrito uma vez, mas lido mil vezes. Escreva para o próximo desenvolvedor, não para a máquina."**

---

**Última Atualização**: 06/11/2025  
**Versão**: 1.0  
**Mantenedor**: Tech Lead ConectCRM  
**Revisão**: Trimestral
