# 🔧 Guia Completo de Troubleshooting - ConectCRM

**Última atualização**: 3 de novembro de 2025  
**Nível**: Iniciante a Avançado

---

## 📋 Índice Rápido

1. [🚨 Problemas Críticos](#-problemas-críticos)
2. [🔐 Autenticação e Login](#-autenticação-e-login)
3. [💬 Sistema de Chat/Atendimento](#-sistema-de-chatatendimento)
4. [🔌 WebSocket e Tempo Real](#-websocket-e-tempo-real)
5. [📱 Integração WhatsApp](#-integração-whatsapp)
6. [🗄️ Banco de Dados](#️-banco-de-dados)
7. [🐳 Docker e Containers](#-docker-e-containers)
8. [⚡ Performance e Otimização](#-performance-e-otimização)
9. [🧪 Ambiente de Desenvolvimento](#-ambiente-de-desenvolvimento)
10. [📊 Logs e Debugging](#-logs-e-debugging)

---

## 🚨 Problemas Críticos

### ❌ Backend não inicia

**Sintomas:**
```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Diagnóstico:**
```powershell
# Verificar se porta 3001 está em uso
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# Verificar processos Node rodando
Get-Process -Name node | Select-Object Id, ProcessName, StartTime
```

**Soluções:**

**Opção 1: Matar processo (Rápido)**
```powershell
# Encontrar PID
$pid = (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Matar processo
Stop-Process -Id $pid -Force

# Verificar se foi morto
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
# Output vazio = porta livre ✅
```

**Opção 2: Usar outra porta (Alternativa)**
```bash
# backend/.env
PORT=3002  # Trocar porta

# Atualizar frontend/src/services/api.ts
baseURL: 'http://localhost:3002'
```

**Opção 3: Reinstalar dependências (Se corrupto)**
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run start:dev
```

---

### ❌ Frontend com erro de compilação

**Sintomas:**
```bash
Module not found: Error: Can't resolve './SomeComponent'
Failed to compile.
```

**Diagnóstico:**
```powershell
# Verificar imports do arquivo problemático
code frontend-web/src/path/to/file.tsx

# Verificar se arquivo existe
Test-Path frontend-web/src/components/SomeComponent.tsx
```

**Soluções:**

**Opção 1: Corrigir import**
```typescript
// ❌ ERRADO - case-sensitive incorreto
import { Component } from './somecomponent';

// ✅ CORRETO
import { Component } from './SomeComponent';
```

**Opção 2: Limpar cache**
```powershell
cd frontend-web
Remove-Item -Recurse -Force node_modules/.cache
npm start
```

**Opção 3: Reinstalar dependências**
```powershell
cd frontend-web
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

---

### ❌ Erro 500 - Internal Server Error

**Sintomas:**
```
GET /api/tickets → 500 Internal Server Error
```

**Diagnóstico:**
```powershell
# Ver logs do backend
cd backend
npm run start:dev

# Procurar por erro vermelho no console
# Verificar linha do erro e stack trace
```

**Causas Comuns:**

**1. empresaId não encontrado**
```typescript
// Erro típico
Error: empresaId não encontrado no token

// Solução
localStorage.removeItem('token');
// Fazer logout e login novamente
```

**2. Relação TypeORM ausente**
```typescript
// Erro típico
EntityMetadataNotFoundError: No metadata for "Entity"

// Solução: Verificar backend/src/config/database.config.ts
entities: [
  Ticket,
  Mensagem,
  Equipe,  // ← Adicionar entity faltante
]
```

**3. Migration não rodada**
```bash
# Erro típico
QueryFailedError: column "campo_novo" does not exist

# Solução
cd backend
npm run migration:run
```

---

## 🔐 Autenticação e Login

### ❌ Não consigo fazer login

**Sintomas:**
```
Email ou senha incorretos
```

**Diagnóstico:**
```sql
-- Verificar se usuário existe
SELECT id, nome, email, ativo, empresaId 
FROM usuarios 
WHERE email = 'seu@email.com';
```

**Soluções:**

**Opção 1: Senha incorreta**
```javascript
// Resetar senha via script
node backend/reset-admin-password.js

// Ou via SQL (hash bcrypt de "Admin@123")
UPDATE usuarios 
SET senha = '$2b$10$YourBcryptHashHere'
WHERE email = 'admin@conectcrm.com';
```

**Opção 2: Usuário inativo**
```sql
UPDATE usuarios 
SET ativo = true 
WHERE email = 'seu@email.com';
```

**Opção 3: Token JWT corrompido**
```javascript
// Limpar storage no console do browser (F12)
localStorage.clear();
sessionStorage.clear();

// Tentar login novamente
```

---

### ❌ Token expirou rapidamente

**Sintomas:**
```
401 Unauthorized logo após login
```

**Diagnóstico:**
```bash
# Verificar configuração de expiração
cat backend/.env | grep JWT

# Deve ter
JWT_SECRET=sua-chave-secreta-forte
JWT_EXPIRATION=7d  # 7 dias
```

**Solução:**
```bash
# Atualizar .env
JWT_EXPIRATION=7d

# Reiniciar backend
cd backend
npm run start:dev
```

---

## 💬 Sistema de Chat/Atendimento

### ❌ Lista de tickets vazia

**Sintomas:**
- Página carrega mas sem tickets
- Loading aparece e desaparece
- Console sem erros

**Diagnóstico:**
```sql
-- Verificar se existem tickets no banco
SELECT COUNT(*) FROM tickets;

-- Se vazio, criar dados de teste
INSERT INTO tickets (numero, contatoId, canalId, departamentoId, status, empresaId)
VALUES ('T-001', 'uuid-contato', 'uuid-canal', 'uuid-departamento', 'aberto', 'uuid-empresa');
```

**Soluções:**

**Opção 1: Criar via SQL (Rápido)**
```sql
-- Ver script completo em MISSAO_CUMPRIDA_ATENDIMENTO.md linha 380
INSERT INTO contatos (...) VALUES (...);
INSERT INTO canais (...) VALUES (...);
INSERT INTO departamentos (...) VALUES (...);
INSERT INTO tickets (...) VALUES (...);
```

**Opção 2: Criar via interface**
```
1. Clicar "+ Novo Atendimento"
2. Preencher formulário
3. Salvar
4. Lista deve atualizar automaticamente
```

---

### ❌ Mensagens não aparecem no chat

**Sintomas:**
- Ticket abre mas área de mensagens vazia
- Loading infinito de mensagens

**Diagnóstico:**
```sql
-- Verificar mensagens do ticket
SELECT id, conteudo, tipo, remetente, timestamp 
FROM mensagens 
WHERE ticketId = 'uuid-do-ticket'
ORDER BY timestamp DESC;
```

**Soluções:**

**Opção 1: Mensagens não existem**
```sql
-- Criar mensagem de teste
INSERT INTO mensagens (id, ticketId, conteudo, tipo, remetente, timestamp)
VALUES (
  gen_random_uuid(), 
  'uuid-do-ticket', 
  'Olá! Como posso ajudar?', 
  'texto', 
  'atendente', 
  NOW()
);
```

**Opção 2: Erro de carregamento**
```typescript
// Abrir DevTools (F12) → Console
// Procurar por erro:
// "Failed to fetch messages" ou similar

// Verificar endpoint no backend
GET http://localhost:3001/mensagens?ticketId=uuid
```

---

### ❌ Envio de mensagem falha

**Sintomas:**
```
Erro ao enviar mensagem
Network Error ou 400 Bad Request
```

**Diagnóstico:**
```javascript
// Abrir DevTools (F12) → Network tab
// Enviar mensagem
// Ver request que falhou
// Clicar em "Payload" para ver dados enviados
```

**Causas Comuns:**

**1. Formato incorreto (não é JSON)**
```typescript
// ❌ ERRADO
const formData = new FormData();
formData.append('conteudo', texto);

// ✅ CORRETO
const payload = {
  ticketId: ticketAtual.id,
  conteudo: texto,
  tipo: 'texto',
  remetente: 'atendente'
};

api.post('/mensagens', payload);  // JSON automático
```

**2. ticketId ausente**
```typescript
// Verificar se ticketAtual existe
if (!ticketAtual || !ticketAtual.id) {
  console.error('Ticket não selecionado!');
  return;
}
```

---

## 🔌 WebSocket e Tempo Real

### ❌ WebSocket não conecta

**Sintomas:**
```javascript
// Console do browser
WebSocket connection failed
Error during WebSocket handshake
```

**Diagnóstico:**
```javascript
// Console do browser (F12)
// Procurar por mensagens de socket

// Verificar se SocketProvider está configurado
// Em App.tsx, deve ter:
<SocketProvider>
  <Routes>...</Routes>
</SocketProvider>
```

**Soluções:**

**Opção 1: Backend não está rodando**
```powershell
# Verificar se backend responde
curl http://localhost:3001

# Se não responder, iniciar
cd backend
npm run start:dev
```

**Opção 2: Token ausente/inválido**
```javascript
// Console do browser
const token = localStorage.getItem('token');
console.log('Token:', token);

// Se null, fazer login novamente
// Se existe mas socket não conecta:
localStorage.removeItem('token');
// Fazer logout e login
```

**Opção 3: Porta incorreta**
```typescript
// Verificar frontend-web/src/contexts/SocketContext.tsx
const socket = io('http://localhost:3001', {  // ← Verificar porta
  auth: { token }
});
```

---

### ❌ Mensagens não aparecem em tempo real

**Sintomas:**
- Envio funciona mas atendente não recebe notificação
- Precisa atualizar página manualmente

**Diagnóstico:**
```javascript
// Console do browser (ambos atendentes)
// Verificar se socket está ouvindo eventos

// Adicionar log temporário em SocketContext.tsx
socket.on('mensagem_recebida', (data) => {
  console.log('🔔 Nova mensagem via socket:', data);
});
```

**Soluções:**

**Opção 1: Socket não está emitindo evento**
```typescript
// Backend - verificar mensagem.service.ts
// Após criar mensagem, deve emitir:
this.socketGateway.server.to(`ticket:${ticketId}`).emit('mensagem_recebida', {
  mensagem: novaMensagem
});
```

**Opção 2: Frontend não está subscrito**
```typescript
// Em ChatPage.tsx, deve ter useEffect:
useEffect(() => {
  if (!ticketAtual?.id) return;
  
  socket.on('mensagem_recebida', (data) => {
    if (data.mensagem.ticketId === ticketAtual.id) {
      setMensagens(prev => [...prev, data.mensagem]);
    }
  });
  
  return () => {
    socket.off('mensagem_recebida');
  };
}, [ticketAtual?.id]);
```

---

### ❌ WebSocket duplicando conexões

**Sintomas:**
- Mensagens aparecem 2x, 3x ou mais
- Múltiplas notificações do mesmo evento

**Diagnóstico:**
```javascript
// Console do backend
// Ver múltiplas conexões do mesmo usuário:
Socket connected: abc123
Socket connected: abc123  // ← DUPLICADO
```

**Solução:**
```typescript
// Implementar singleton pattern em SocketContext.tsx

let socketInstance: Socket | null = null;

export const useSocket = () => {
  if (!socketInstance) {
    socketInstance = io('http://localhost:3001', { auth: { token } });
  }
  return socketInstance;
};

// Cleanup ao desmontar
useEffect(() => {
  return () => {
    socketInstance?.disconnect();
    socketInstance = null;
  };
}, []);
```

---

## 📱 Integração WhatsApp

### ❌ Webhook não recebe mensagens

**Sintomas:**
- Cliente envia mensagem no WhatsApp
- Backend não registra nada

**Diagnóstico:**
```powershell
# Verificar se webhook está configurado
# Meta Developer Console → App → WhatsApp → Configuration

# URL deve ser: https://seu-dominio.com/webhook/whatsapp
# Token de verificação deve estar em .env
```

**Soluções:**

**Opção 1: Webhook não está público**
```bash
# Usar ngrok para teste local
ngrok http 3001

# Copiar URL HTTPS gerado (ex: https://abc123.ngrok.io)
# Atualizar no Meta Developer Console:
# Webhook URL: https://abc123.ngrok.io/webhook/whatsapp
```

**Opção 2: Token de verificação incorreto**
```bash
# backend/.env
WHATSAPP_VERIFY_TOKEN=seu-token-secreto-aqui

# Deve bater com o configurado no Meta
```

**Opção 3: Endpoint retornando erro**
```typescript
// Verificar backend/src/modules/whatsapp/whatsapp.controller.ts

@Get('webhook/whatsapp')
verificarWebhook(@Query() query: any) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;  // ← Deve retornar challenge
  }
  
  throw new UnauthorizedException('Token inválido');
}
```

---

### ❌ Erro 401 - Token WhatsApp expirou

**Sintomas:**
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "code": 190
  }
}
```

**Solução:**
```
1. Acessar Meta Developer Console
2. Tools → Graph API Explorer
3. Gerar novo User Access Token (24h) ou System User Token (permanente)
4. Copiar token
5. No frontend: Configurações → WhatsApp → Colar novo token → Salvar
6. Testar envio de mensagem
```

---

### ❌ Número não está na whitelist

**Sintomas:**
```json
{
  "error": {
    "message": "(#131030) Recipient phone number not in allowed list",
    "code": 131030
  }
}
```

**Solução:**
```
1. Meta Developer Console → App → WhatsApp → API Setup
2. Section: "To"
3. Clicar "Manage phone number list"
4. Adicionar número com código do país (ex: +5511999999999)
5. Salvar
6. Aguardar 1-2 minutos
7. Testar novamente
```

---

## 🗄️ Banco de Dados

### ❌ Erro de conexão com PostgreSQL

**Sintomas:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Diagnóstico:**
```powershell
# Verificar se PostgreSQL está rodando
docker ps | findstr postgres

# Se vazio, PostgreSQL não está rodando
```

**Soluções:**

**Opção 1: Iniciar via Docker**
```powershell
cd c:\Projetos\conectcrm
docker-compose up -d postgres

# Verificar logs
docker-compose logs -f postgres
```

**Opção 2: Credenciais incorretas**
```bash
# Verificar backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua-senha
DB_NAME=conectcrm

# Testar conexão
psql -h localhost -U postgres -d conectcrm
# Se pedir senha, digite a do .env
```

---

### ❌ Migration não roda

**Sintomas:**
```
QueryFailedError: relation "tabela" does not exist
```

**Diagnóstico:**
```bash
# Ver migrations pendentes
cd backend
npm run migration:show

# Ver migrations rodadas
# [X] marca = já rodou
# [ ] vazio = pendente
```

**Soluções:**

**Opção 1: Rodar migrations**
```bash
cd backend
npm run migration:run

# Ver output
query: SELECT * FROM "migrations"
query: SELECT * FROM "information_schema"."tables"
Migration SuaMigration1234567890 has been executed successfully!
```

**Opção 2: Criar migration nova**
```bash
# Após alterar entity
npm run migration:generate -- src/migrations/NomeDaMigracao

# Rodar migration
npm run migration:run
```

**Opção 3: Reverter migration (se erro)**
```bash
npm run migration:revert

# Corrigir migration
# Rodar novamente
npm run migration:run
```

---

## 🐳 Docker e Containers

### ❌ Container não inicia

**Sintomas:**
```powershell
docker-compose up -d
Error: Container exited with code 1
```

**Diagnóstico:**
```powershell
# Ver logs do container
docker-compose logs backend

# Ver status
docker-compose ps
```

**Soluções:**

**Opção 1: Porta já em uso**
```powershell
# Verificar se porta está ocupada
Get-NetTCPConnection -LocalPort 3001

# Matar processo ou alterar porta em docker-compose.yml
```

**Opção 2: Rebuild imagem**
```powershell
# Forçar rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

**Opção 3: Limpar volumes**
```powershell
# ⚠️ CUIDADO: Apaga dados do banco!
docker-compose down -v
docker-compose up -d
```

---

### ❌ Frontend servindo página default

**Sintomas:**
```html
<!-- Browser mostra -->
Welcome to nginx!
```

**Diagnóstico:**
```powershell
# Verificar se build foi feito
Test-Path frontend-web/build/

# Se não existe, build não foi gerado
```

**Solução:**
```powershell
# Fazer build do frontend
cd frontend-web
npm run build

# Verificar se gerou build/
ls build/

# Rebuild container
cd ..
docker-compose build frontend
docker-compose up -d frontend

# Testar
curl http://localhost:3000
# Deve mostrar HTML do React
```

---

## ⚡ Performance e Otimização

### ❌ Página está lenta

**Sintomas:**
- Cliques demoram para responder
- Scroll travando
- FPS baixo

**Diagnóstico:**
```javascript
// Abrir DevTools (F12) → Performance
// Clicar Record
// Interagir com página lenta
// Parar gravação
// Ver Flame Chart - procurar barras longas (amarelo/vermelho)
```

**Soluções:**

**Opção 1: Re-renders excessivos**
```typescript
// Adicionar React.memo em componentes puros
export const MeuComponente = React.memo(({ prop1, prop2 }) => {
  return <div>...</div>;
});

// Usar useMemo para cálculos pesados
const resultado = useMemo(() => {
  return calcularAlgoComplexo(dados);
}, [dados]);

// Usar useCallback para funções
const handleClick = useCallback(() => {
  fazAlgo();
}, [dependencia]);
```

**Opção 2: Lista muito grande sem virtualização**
```typescript
// Instalar react-window
npm install react-window

// Usar FixedSizeList
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index].nome}</div>
  )}
</FixedSizeList>
```

---

### ❌ Bundle JavaScript muito grande

**Sintomas:**
```
main.js → 5MB
Página demora para carregar
```

**Diagnóstico:**
```powershell
# Analisar bundle
cd frontend-web
npm run build

# Instalar analyzer
npm install --save-dev webpack-bundle-analyzer

# Gerar relatório
npx webpack-bundle-analyzer build/static/js/*.js
```

**Soluções:**

**Opção 1: Code splitting**
```typescript
// Lazy load páginas
import { lazy, Suspense } from 'react';

const GestaoEquipesPage = lazy(() => import('./pages/GestaoEquipesPage'));

<Suspense fallback={<div>Carregando...</div>}>
  <GestaoEquipesPage />
</Suspense>
```

**Opção 2: Remover bibliotecas não usadas**
```bash
# Encontrar imports não usados
npm install -g depcheck
depcheck

# Remover
npm uninstall biblioteca-nao-usada
```

---

## 🧪 Ambiente de Desenvolvimento

### ❌ Hot reload não funciona

**Sintomas:**
- Altera arquivo
- Precisa reiniciar manualmente
- Mudanças não aparecem

**Soluções:**

**Frontend:**
```bash
# Verificar se está usando npm start
cd frontend-web
npm start  # Deve ter Fast Refresh habilitado

# Se não funcionar, limpar cache
rm -rf node_modules/.cache
npm start
```

**Backend:**
```bash
# Verificar se está usando start:dev (watch mode)
cd backend
npm run start:dev  # NestJS watch mode

# Se não funcionar, rodar diretamente
npx nest start --watch
```

---

### ❌ Dependência não encontrada após install

**Sintomas:**
```
Module not found: '@types/nome-biblioteca'
```

**Solução:**
```powershell
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e package-lock
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstalar
npm install

# Se ainda falhar, instalar tipo explicitamente
npm install --save-dev @types/nome-biblioteca
```

---

## 📊 Logs e Debugging

### 🔍 Como ler logs do backend

**Localização:**
```bash
# Logs em tempo real
cd backend
npm run start:dev

# Ou via Docker
docker-compose logs -f backend
```

**Tipos de log:**
```
[Nest] 12345  - INFO  [NestFactory] Starting Nest application...  ← Inicialização
[Nest] 12345  - LOG   [TicketService] Listando tickets...        ← Operação normal
[Nest] 12345  - WARN  [AuthGuard] Token expirado                 ← Aviso
[Nest] 12345  - ERROR [ExceptionsHandler] Erro interno +123ms    ← Erro crítico
```

**Procurar por:**
- `ERROR` = Problemas críticos
- `WARN` = Avisos importantes
- `401` / `403` = Problemas de autenticação/autorização
- `500` = Erros internos do servidor
- `stack trace` = Caminho completo do erro

---

### 🔍 Como ler logs do frontend

**Console do Browser:**
```javascript
// Abrir DevTools (F12) → Console

// Tipos de mensagem
console.log('Info')     // ⚪ Branco - Informação
console.warn('Aviso')   // 🟡 Amarelo - Aviso
console.error('Erro')   // 🔴 Vermelho - Erro

// Procurar por
'Failed to fetch'       // Erro de rede/API
'undefined is not'      // Erro de null/undefined
'Cannot read property' // Erro de acesso a propriedade
'404 Not Found'        // Endpoint não existe
```

**Network Tab:**
```
1. Abrir DevTools (F12) → Network
2. Filtrar por XHR/Fetch
3. Reproduzir problema
4. Ver requests que falharam (vermelho)
5. Clicar no request → Headers → ver Status Code
6. Preview → ver resposta do servidor
```

---

### 🔍 Debug avançado com breakpoints

**Backend (NestJS):**
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229,
  "restart": true
}
```

```bash
# Iniciar em debug mode
npm run start:debug

# VS Code → Run and Debug → Attach to NestJS
# Adicionar breakpoint clicando na margem esquerda (bolinha vermelha)
```

**Frontend (React):**
```javascript
// Adicionar debugger no código
function MeuComponente() {
  debugger;  // ← Execução para aqui quando DevTools aberto
  return <div>...</div>;
}

// Ou usar breakpoints no Sources tab do DevTools
```

---

## 📞 Suporte Adicional

### Quando procurar ajuda:

1. **Procure neste guia primeiro** → 90% dos problemas estão aqui
2. **Consulte documentos específicos**:
   - `MISSAO_CUMPRIDA_ATENDIMENTO.md` - Sistema de atendimento
   - `JORNADA_COMPLETA_WHATSAPP.md` - Integração WhatsApp
   - `WEBSOCKET_RESUMO.md` - WebSocket e tempo real
3. **Verifique issues no GitHub** → Pode já estar reportado
4. **Abra nova issue** → Incluir:
   - Descrição clara do problema
   - Passos para reproduzir
   - Logs relevantes
   - Versão do sistema
   - Ambiente (dev/prod, OS, Node version)

### Templates de Issue:

**Bug Report:**
```markdown
## Descrição
[Descreva o problema claramente]

## Passos para Reproduzir
1. Acesse página X
2. Clique em botão Y
3. Veja erro Z

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Logs
```
[Cole logs relevantes aqui]
```

## Ambiente
- OS: Windows 11
- Node: 18.17.0
- Branch: consolidacao-atendimento
- Commit: abc123
```

---

**Última atualização**: 3 de novembro de 2025  
**Mantenedores**: Equipe ConectCRM  
**Contribuições**: Pull requests bem-vindos!
