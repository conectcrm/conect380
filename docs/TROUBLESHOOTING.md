# 🔧 Troubleshooting - ConectSuite

**Versão**: 1.0.0  
**Última atualização**: 6 de novembro de 2025

Este guia lista **problemas comuns** e suas soluções. Se você encontrar um erro, consulte aqui antes de pedir ajuda.

---

## 📋 Índice

1. [Loops Infinitos (React)](#-loops-infinitos-react)
2. [Erros TypeScript](#-erros-typescript)
3. [Erros de Build](#-erros-de-build)
4. [Problemas de Banco de Dados](#-problemas-de-banco-de-dados)
5. [WebSocket não conecta](#-websocket-não-conecta)
6. [Erros de Autenticação](#-erros-de-autenticação)
7. [Performance lenta](#-performance-lenta)
8. [WhatsApp Webhook](#-whatsapp-webhook)
9. [Docker Issues](#-docker-issues)
10. [Comandos Úteis](#-comandos-úteis)

---

## 🔄 Loops Infinitos (React)

### 🐛 Problema #1: "Maximum update depth exceeded"

**Sintomas**:
```
Warning: Maximum update depth exceeded. This can happen when a component 
calls setState inside useEffect, but useEffect doesn't have a dependency 
array, or one of the dependencies changes on every render.
```

**Causa**: Composite selectors em Zustand retornam novos objetos a cada render.

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const { tickets, ticketSelecionado } = useAtendimentoStore((state) => ({
  tickets: state.tickets,
  ticketSelecionado: state.ticketSelecionado,
}));
```

**Solução**: Use individual selectors.

```typescript
// ✅ SOLUÇÃO
const tickets = useAtendimentoStore((state) => state.tickets);
const ticketSelecionado = useAtendimentoStore((state) => state.ticketSelecionado);
```

**Arquivos afetados**:
- `frontend-web/src/features/atendimento/omnichannel/hooks/useAtendimentos.ts`

**Referência**: [ETAPA3_BUGS_CORRIGIDOS.md](../ETAPA3_BUGS_CORRIGIDOS.md#bug-1)

---

### 🐛 Problema #2: Múltiplas chamadas API duplicadas

**Sintomas**:
```
📜 Carregando histórico do cliente: 11870d4f-...
📜 Carregando histórico do cliente: 11870d4f-...  ← DUPLICADO
📜 Carregando histórico do cliente: 11870d4f-...  ← DUPLICADO
```

**Causa**: Função de `useCallback` incluída nas dependências de `useEffect`.

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
const carregarDados = useCallback(async () => {
  // ...
}, [clienteId]);

useEffect(() => {
  carregarDados();
}, [carregarDados]);  // ← Loop: função recriada → useEffect dispara
```

**Solução**: Remover função das dependências.

```typescript
// ✅ SOLUÇÃO
const carregarDados = useCallback(async () => {
  // ...
}, [clienteId]);

useEffect(() => {
  carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [clienteId]);  // ← Sem a função nas deps!
```

**Arquivos afetados**:
- `frontend-web/src/features/atendimento/omnichannel/hooks/useHistoricoCliente.ts`
- `frontend-web/src/features/atendimento/omnichannel/hooks/useContextoCliente.ts`

**Referência**: [ETAPA3_BUGS_CORRIGIDOS.md](../ETAPA3_BUGS_CORRIGIDOS.md#bug-2)

---

### 🐛 Problema #3: Loop por referência instável

**Sintomas**: Ainda 2x chamadas mesmo após correções anteriores.

**Causa**: Objetos aninhados criam novas referências a cada render.

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
useHistoricoCliente({
  clienteId: ticketSelecionado?.contato?.clienteVinculado?.id || null,
  autoLoad: true
});

// Mesmo ID, mas nova referência do objeto → useEffect dispara
```

**Solução**: Estabilizar referência com `useMemo`.

```typescript
// ✅ SOLUÇÃO
const clienteIdEstavel = useMemo(
  () => ticketSelecionado?.contato?.clienteVinculado?.id || null,
  [ticketSelecionado?.contato?.clienteVinculado?.id]
);

useHistoricoCliente({
  clienteId: clienteIdEstavel,  // ← Referência estável
  autoLoad: true
});
```

**Arquivos afetados**:
- `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`

**Referência**: [ETAPA3_BUGS_CORRIGIDOS.md](../ETAPA3_BUGS_CORRIGIDOS.md#bug-3)

---

### 🔍 Como Detectar Loops

1. **Console cheio de logs duplicados** - Mesmo log aparece 2x, 3x ou infinitamente
2. **CPU 100%** - Navegador trava, ventilador acelera
3. **Warning no console** - "Maximum update depth exceeded"
4. **DevTools Performance** - Muitos re-renders seguidos

### 🛠️ Ferramentas de Debug

```bash
# Chrome DevTools
1. F12 → Performance Tab
2. Clique em Record
3. Faça a ação que causa loop
4. Stop → Ver flamegraph de re-renders

# React DevTools Profiler
1. Instalar extensão React DevTools
2. Aba Profiler
3. Gravar ação
4. Ver quais componentes re-renderizaram e por quê
```

---

## 🔷 Erros TypeScript

### 🐛 "Property 'X' does not exist on type 'Y'"

**Causa**: Type incompleto ou incorreto.

**Solução**:
```typescript
// ❌ Type incompleto
interface Ticket {
  id: string;
  titulo: string;
  // Faltando 'status'
}

// ✅ Type completo
interface Ticket {
  id: string;
  titulo: string;
  status: StatusAtendimento;
}
```

---

### 🐛 "Cannot find module or its corresponding type declarations"

**Causa**: Pacote sem types ou não instalado.

**Solução**:
```bash
# 1. Verificar se pacote está instalado
npm list axios

# 2. Instalar types (se necessário)
npm install --save-dev @types/node
npm install --save-dev @types/react

# 3. Reiniciar TypeScript server no VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### 🐛 "Type 'X' is not assignable to type 'Y'"

**Causa**: Tipos incompatíveis.

**Solução**:
```typescript
// ❌ String quando espera enum
const status: StatusAtendimento = "aberto";  // ❌

// ✅ Usar valor correto do enum/union type
const status: StatusAtendimento = "ABERTO";  // ✅
```

---

### 🐛 "Object is possibly 'null' or 'undefined'"

**Causa**: TypeScript strict mode detecta possível null.

**Solução**:
```typescript
// ❌ Não verifica null
const nome = user.nome.toUpperCase();  // ❌ E se user for null?

// ✅ Verificar antes
if (user) {
  const nome = user.nome.toUpperCase();
}

// ✅ Ou usar optional chaining
const nome = user?.nome?.toUpperCase();

// ✅ Ou nullish coalescing
const nome = user?.nome ?? 'Desconhecido';
```

---

## 🏗️ Erros de Build

### 🐛 "Cannot find module '...'"

**Causa**: Import path incorreto ou módulo não instalado.

**Solução**:
```bash
# 1. Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# 2. Verificar import path
// ❌ Path errado
import { X } from './components/X';  // Não existe

// ✅ Path correto
import { X } from '@/components/X';
```

---

### 🐛 "Module build failed: Error: ENOENT"

**Causa**: Arquivo foi deletado mas ainda referenciado.

**Solução**:
```bash
# 1. Limpar build cache
npm run clean  # Se tiver script
rm -rf dist/ build/ .next/

# 2. Rebuild
npm run build
```

---

### 🐛 Backend não inicia: "Address already in use"

**Causa**: Porta 3001 já está ocupada.

**Solução**:
```powershell
# Windows
netstat -ano | findstr :3001
# Anotar PID
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

---

## 🗄️ Problemas de Banco de Dados

### 🐛 "EntityMetadataNotFoundError: No metadata for 'X' was found"

**Causa**: Entity não registrada no TypeORM.

**Solução**:
```typescript
// backend/src/config/database.config.ts

// ❌ Entity não está no array
export const databaseConfig: TypeOrmModuleOptions = {
  entities: [
    Ticket,
    Mensagem,
    // Faltando: Contato
  ],
};

// ✅ Adicionar entity
import { Contato } from '../modules/atendimento/entities/contato.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  entities: [
    Ticket,
    Mensagem,
    Contato,  // ← Adicionar aqui
  ],
};
```

---

### 🐛 "relation already exists"

**Causa**: Migration tentando criar tabela que já existe.

**Solução**:
```bash
# 1. Ver migrations executadas
npm run migration:show

# 2. Reverter última migration
npm run migration:revert

# 3. Ou dropar tabela manualmente
psql -U conectcrm -d conectcrm_db
DROP TABLE tickets;

# 4. Rodar migration novamente
npm run migration:run
```

---

### 🐛 "password authentication failed"

**Causa**: Credenciais do banco incorretas.

**Solução**:
```bash
# 1. Verificar .env
DATABASE_HOST=localhost
DATABASE_PORT=5434  # ← Verificar porta (Docker = 5434, local = 5432)
DATABASE_USERNAME=conectcrm
DATABASE_PASSWORD=conectcrm123
DATABASE_NAME=conectcrm_db

# 2. Testar conexão direta
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db

# 3. Se Docker, verificar se container está rodando
docker ps | grep postgres
```

---

### 🐛 Erro de RLS (Row-Level Security)

**Causa**: `empresa_id` não foi setado na sessão.

**Solução**:
```typescript
// Verificar se EmpresaInterceptor está registrado

// backend/src/app.module.ts
import { EmpresaInterceptor } from './common/interceptors/empresa.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: EmpresaInterceptor,  // ← Obrigatório para RLS
    },
  ],
})
```

---

## 🔌 WebSocket não conecta

### 🐛 "WebSocket connection failed"

**Sintomas**: Mensagens não chegam em tempo real.

**Causa**: Backend não está rodando ou CORS bloqueando.

**Solução**:
```typescript
// 1. Verificar se backend está rodando
curl http://localhost:3001

// 2. Verificar CORS no backend
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3900'],  // ← Adicionar origens
  credentials: true,
});

// 3. Verificar URL no frontend
// frontend-web/src/hooks/useWebSocket.ts
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
```

---

### 🐛 WebSocket desconecta constantemente

**Causa**: Timeout do ngrok (plano gratuito = 2h).

**Solução**:
```bash
# 1. Verificar se ngrok expirou
curl https://seu-dominio.ngrok-free.app

# 2. Reiniciar ngrok
.\start-dev-with-ngrok.ps1 -SkipBackend -SkipFrontend

# 3. Atualizar webhook da Meta com nova URL
```

---

## 🔐 Erros de Autenticação

### 🐛 "Unauthorized" em todas as requisições

**Causa**: Token JWT expirado ou não enviado.

**Solução**:
```typescript
// 1. Verificar se token está sendo enviado
// frontend-web/src/services/api.ts
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Verificar se token expirou
// Fazer login novamente

// 3. Verificar JWT_SECRET no backend
// backend/.env
JWT_SECRET=sua_chave_secreta_aqui  // Deve ser a mesma!
```

---

### 🐛 "Forbidden" ao acessar recurso

**Causa**: Usuário não tem permissão ou `empresa_id` diferente.

**Solução**:
```typescript
// 1. Verificar se x-empresa-id está sendo enviado
axios.defaults.headers.common['x-empresa-id'] = user.empresaId;

// 2. Verificar RLS policy no banco
SELECT * FROM pg_policies WHERE tablename = 'tickets';

// 3. Verificar se recurso pertence à empresa correta
```

---

## ⚡ Performance Lenta

### 🐛 Listagem de tickets muito lenta

**Causa**: Consulta sem paginação ou N+1 queries.

**Solução**:
```typescript
// ❌ Busca tudo de uma vez
const tickets = await this.ticketRepo.find();

// ✅ Paginação
const tickets = await this.ticketRepo.find({
  skip: (page - 1) * limit,
  take: limit,
});

// ❌ N+1 queries
for (const ticket of tickets) {
  ticket.contato = await this.contatoRepo.findOne(ticket.contatoId);
}

// ✅ Eager loading
const tickets = await this.ticketRepo.find({
  relations: ['contato', 'mensagens'],
});
```

---

### 🐛 Frontend lento, muitos re-renders

**Causa**: Componente re-renderiza desnecessariamente.

**Solução**:
```typescript
// Use React DevTools Profiler para identificar

// ✅ Memoizar componentes pesados
const ChatArea = React.memo(({ mensagens }) => {
  // ...
});

// ✅ useCallback para funções
const handleClick = useCallback(() => {
  // ...
}, [deps]);

// ✅ useMemo para cálculos pesados
const total = useMemo(() => {
  return items.reduce((acc, item) => acc + item.valor, 0);
}, [items]);
```

---

## 📱 WhatsApp Webhook

### 🐛 Webhook não recebe mensagens

**Sintomas**: Mensagens não aparecem no sistema.

**Causa**: Webhook não configurado ou URL inválida.

**Solução**:
```bash
# 1. Verificar se ngrok está rodando
curl http://127.0.0.1:4040/api/tunnels

# 2. Verificar URL no Meta Developers
https://developers.facebook.com/apps
→ WhatsApp → Configuração → Webhook
URL: https://SEU-DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp
Token: conectcrm_webhook_token_123

# 3. Testar webhook manualmente
curl -X POST https://SEU-DOMINIO.ngrok-free.app/api/atendimento/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'

# 4. Ver logs do backend
# Deve aparecer: [WhatsApp] Webhook recebido
```

---

### 🐛 "Verification failed"

**Causa**: Token de verificação incorreto.

**Solução**:
```typescript
// backend/.env
WHATSAPP_WEBHOOK_VERIFY_TOKEN=conectcrm_webhook_token_123

// Meta Developers
Token de verificação: conectcrm_webhook_token_123  // ← Deve ser IGUAL!
```

---

### 🐛 Mensagens enviadas não aparecem no WhatsApp

**Causa**: Access token inválido ou expirado.

**Solução**:
```bash
# 1. Verificar token no .env
WHATSAPP_ACCESS_TOKEN=EAALQrbLuMHw...  # Token longo

# 2. Gerar novo token no Meta Developers
https://developers.facebook.com/apps
→ WhatsApp → API Setup → Access Token

# 3. Atualizar .env e reiniciar backend
```

---

## 🐳 Docker Issues

### 🐛 "Cannot connect to Docker daemon"

**Causa**: Docker não está rodando.

**Solução**:
```bash
# Windows
# Abrir Docker Desktop

# Linux
sudo systemctl start docker
sudo systemctl enable docker

# Verificar
docker ps
```

---

### 🐛 Container sempre reiniciando

**Sintomas**: `docker ps` mostra status "Restarting".

**Solução**:
```bash
# 1. Ver logs do container
docker logs conectcrm-backend

# 2. Comum: erro no .env ou migration
# Verificar variáveis de ambiente

# 3. Parar e remover container
docker-compose down
docker-compose up -d
```

---

### 🐛 "port is already allocated"

**Causa**: Porta já está em uso por outro processo.

**Solução**:
```powershell
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou mudar porta no docker-compose.yml
ports:
  - "3002:3001"  # Host:Container
```

---

## 🛠️ Comandos Úteis

### Reiniciar Tudo (Fresh Start)

```bash
# 1. Parar todos os processos
docker-compose down
Get-Process -Name node | Stop-Process -Force

# 2. Limpar caches
cd backend
rm -rf node_modules dist
npm install

cd ../frontend-web
rm -rf node_modules build
npm install

# 3. Rodar migrations
cd ../backend
npm run migration:run

# 4. Iniciar tudo
docker-compose up -d
cd backend && npm run start:dev
cd frontend-web && npm start
```

---

### Debug Backend

```bash
# Ver logs em tempo real
npm run start:dev

# Ver queries SQL
# backend/src/config/database.config.ts
logging: true,

# Testar endpoint direto
curl http://localhost:3001/api/auth/health
```

---

### Debug Frontend

```bash
# Limpar cache React
rm -rf node_modules/.cache

# Build sem cache
GENERATE_SOURCEMAP=false npm run build

# Ver bundle size
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

---

### Debug PostgreSQL

```bash
# Conectar ao banco
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db

# Ver tabelas
\dt

# Ver policies RLS
SELECT * FROM pg_policies;

# Ver conexões ativas
SELECT * FROM pg_stat_activity WHERE datname = 'conectcrm_db';

# Matar conexão travada
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;
```

---

## 🆘 Quando Pedir Ajuda

Antes de pedir ajuda, **SEMPRE** inclua:

1. **Mensagem de erro completa** (print ou copiar texto)
2. **Arquivo e linha** onde ocorreu
3. **O que você tentou fazer** (passos para reproduzir)
4. **Logs relevantes** (backend terminal, browser console)
5. **Ambiente** (desenvolvimento/produção, Windows/Linux)

### Template de Issue

```markdown
## 🐛 Descrição do Problema
[Explique o que aconteceu]

## 📋 Passos para Reproduzir
1. Fazer login
2. Clicar em "Novo Ticket"
3. Erro aparece

## ❌ Erro Recebido
```
[Copiar erro completo aqui]
```

## 💻 Ambiente
- OS: Windows 11
- Node: 18.17.0
- Navegador: Chrome 120

## 🔍 O que já tentei
- Limpei cache
- Reiniciei servidor
- Verifiquei .env
```

---

## 📚 Documentos Relacionados

- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender estrutura do projeto
- 📐 [CODE_PATTERNS.md](./CODE_PATTERNS.md) - Padrões para seguir
- 🐛 [ETAPA3_BUGS_CORRIGIDOS.md](../ETAPA3_BUGS_CORRIGIDOS.md) - Bugs de loop resolvidos
- 🚀 [ONBOARDING.md](./ONBOARDING.md) - Setup inicial

---

## 🔄 Atualizações

Este documento é **vivo** - novos problemas e soluções serão adicionados conforme descobertos.

**Última revisão**: 6 de novembro de 2025  
**Próxima revisão**: Quando novos problemas comuns forem identificados

---

**💡 Dica**: Use Ctrl+F para procurar erro específico neste documento!
