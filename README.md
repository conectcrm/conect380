# ConectCRM 🚀

Sistema completo de CRM com portal do cliente integrado, desenvolvido com NestJS (backend) e React (frontend). 

Sistema especializado em gestão de propostas comerciais com sincronização automática em tempo real entre o CRM e o portal do cliente.

## 🚀 Características Principais

- **Portal do Cliente Integrado**: Sistema completo de visualização e aprovação de propostas
- **Sincronização em Tempo Real**: Atualizações automáticas entre portal e CRM
- **Sistema de Email Automatizado**: Envio e rastreamento de propostas por email
- **Interface Responsiva**: Design mobile-first e totalmente responsivo
- **Autenticação JWT**: Sistema seguro de autenticação e autorização
- **Debug e Monitoramento**: Ferramentas completas de debug e teste

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + **TypeScript**
- **NestJS** (Framework)
- **PostgreSQL** (Banco de dados)
- **JWT** (Autenticação)
- **TypeORM** (ORM)
- **Nodemailer** (Sistema de emails)

### Frontend Web
- **React** + **TypeScript**
- **Tailwind CSS** (Estilização)
- **React Router** (Roteamento)
- **Custom Hooks** (Lógica reutilizável)

### Portal do Cliente
- **Links únicos** por proposta
- **Interface dedicada** para clientes
- **Sistema de ações** (visualizar, aprovar, rejeitar)
- **Notificações automáticas**

## 📋 Funcionalidades Implementadas

### ✅ Sistema de Propostas
- [x] Criação e edição de propostas comerciais
- [x] Sistema de status (enviada, visualizada, aprovada, rejeitada)
- [x] Envio automático por email
- [x] Portal do cliente integrado
- [x] Sincronização em tempo real

### ✅ Portal do Cliente
- [x] Links únicos e seguros por proposta
- [x] Interface responsiva de visualização
- [x] Botões de ação (aprovar/rejeitar/visualizar)
- [x] Atualizações em tempo real
- [x] Sistema de notificações

### ✅ Sistema de Email
- [x] Templates responsivos
- [x] Envio automático de propostas
- [x] Sistema de rastreamento
- [x] Notificações de status

### ✅ Sincronização Automática
- [x] Eventos customizados (propostaAtualizada, atualizarPropostas)
- [x] Polling automático a cada 30 segundos
- [x] Atualização visual em tempo real
- [x] Monitoramento de status

### ✅ Ferramentas de Debug
- [x] Scripts de teste completos
- [x] Console de debug frontend
- [x] APIs de teste backend
- [x] Monitoramento de eventos
- [x] Verificação de sincronização

## 📁 Estrutura do Projeto

```
conectcrm/
├── backend/                 # API Backend (NestJS)
│   ├── src/
│   │   ├── modules/        # Módulos da aplicação
│   │   │   ├── propostas/  # Sistema de propostas
│   │   │   │   ├── propostas.controller.ts
│   │   │   │   ├── propostas.service.ts
│   │   │   │   ├── portal.controller.ts    # 🆕 Portal do cliente
│   │   │   │   ├── portal.service.ts       # 🆕 Lógica do portal
│   │   │   │   └── email.controller.ts     # 🆕 Sistema de email
│   │   │   ├── users/      # Gestão de usuários
│   │   │   └── contatos/   # Gestão de contatos
│   │   └── config/         # Configurações
├── frontend-web/           # Interface React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── features/       # Funcionalidades principais
│   │   │   ├── propostas/  # Gestão de propostas
│   │   │   ├── contatos/   # Gestão de contatos
│   │   │   └── portal/     # 🆕 Portal do cliente
│   │   └── services/       # Serviços de API
├── docs/                   # Documentação completa
│   ├── implementation/     # Funcionalidades implementadas
│   ├── debug/             # Logs de debug
│   └── guides/            # Guias técnicos
├── scripts/               # Scripts de automação e debug
│   ├── debug-frontend-console.js    # 🆕 Debug frontend
│   ├── teste-apis-backend.js        # 🆕 Teste APIs
│   ├── iniciar-sistema-completo.bat # 🆕 Inicialização
│   └── teste-portal-api.js          # 🆕 Teste portal
└── README.md              # Este arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/dhonlenofreitas/conectcrm.git
cd conectcrm
```

### 2. Configuração do Backend
```bash
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações de banco
```

### 3. Configuração do Frontend
```bash
cd frontend-web
npm install
```

### 4. Configuração do Banco de Dados
```bash
# No diretório backend
npm run migration:run
```

### 5. Iniciar os serviços

**Opção 1: Script automatizado (Recomendado)**
```bash
# Execute o script na raiz do projeto
.\iniciar-sistema-completo.bat
```

**Opção 2: Manual**
```bash
# Backend (porta 3001)
cd backend
npm run start:dev

# Frontend (porta 3000) - novo terminal
cd frontend-web
npm start
```

## 🔧 URLs do Sistema

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend CRM** | http://localhost:3000 | Interface principal do CRM |
| **Backend API** | http://localhost:3001 | API REST do sistema |
| **Portal Cliente** | http://localhost:3000/portal/:token | Portal do cliente (link único) |

## 🧪 Testes e Debug

### Scripts de Debug Disponíveis

#### Frontend (Execute no console do navegador)
```javascript
// Sincronizar frontend com backend
sincronizarFrontendComBackend("PROP-2025-051")

// Verificar status visual na interface
verificarStatusVisualInterface("PROP-2025-051")

// Teste completo do ciclo
testarCicloCompletoComVerificacao("PROP-2025-051")

// Monitorar estado do React
monitorarEstadoReact()

// Monitorar requisições de rede
monitorarRequisicoes()
```

#### Backend (PowerShell)
```powershell
# Testar APIs do backend
node teste-apis-backend.js

# Testar ação específica do portal
Invoke-RestMethod -Uri "http://localhost:3001/api/portal/proposta/PROP-2025-051/acao" -Method POST -ContentType "application/json" -Body '{"acao":"visualizada"}'

# Verificar propostas
Invoke-RestMethod -Uri "http://localhost:3001/propostas" -Method GET
```

## � Fluxo do Sistema

### � Portal do Cliente - Fluxo Completo
1. **Criação da Proposta**: Usuário cria proposta no CRM
2. **Envio por Email**: Sistema envia email com link único do portal
3. **Acesso do Cliente**: Cliente acessa portal via link único
4. **Ações do Cliente**: Cliente pode visualizar, aprovar ou rejeitar
5. **Sincronização Automática**: Status atualiza automaticamente no CRM
6. **Notificações**: Sistema notifica sobre mudanças de status

### � Tecnologias de Sincronização
- **CustomEvents**: Eventos personalizados para comunicação
- **Polling**: Verificação automática a cada 30 segundos
- **UUID Mapping**: Sistema de tokens únicos para segurança
- **Real-time Updates**: Atualizações visuais instantâneas

## � Como Usar o Sistema

### 1. **Acesso ao CRM**
```
URL: http://localhost:3000
Login: Use as credenciais configuradas no sistema
```

### 2. **Criar Nova Proposta**
- Acesse a seção "Propostas"
- Clique em "Nova Proposta"
- Preencha os dados do cliente e detalhes
- Salve a proposta

### 3. **Enviar para Cliente**
- Na lista de propostas, clique no botão "Enviar Email"
- Sistema enviará email com link único do portal
- Cliente receberá link seguro: `http://localhost:3000/portal/PROP-2025-XXX`

### 4. **Acompanhar Status**
- Status é atualizado automaticamente quando cliente acessa portal
- Disponível: `enviada`, `visualizada`, `aprovada`, `rejeitada`
- Interface atualiza em tempo real

## 🔐 Segurança e Tokens

### Sistema de Tokens Únicos
- Cada proposta recebe um token único (ex: PROP-2025-051)
- Tokens são mapeados para UUIDs no banco de dados
- Acesso ao portal requer token válido
- Sistema de validação no backend

### Exemplo de Mapeamento
```typescript
// Portal Service - Token Mappings
const tokenMappings = {
  'PROP-2025-049': 'bff61bbe-b645-4581-a3d1-d8447b8c2b75',
  'PROP-2025-051': 'e0003dcb-f81a-4ac5-9661-76233446bfa8'
};
```

## �️ Scripts de Automação

### Inicialização do Sistema
```bash
# Windows
.\iniciar-sistema-completo.bat
.\iniciar-sistema-completo.ps1

# Inicia backend e frontend simultaneamente
```

### Scripts de Debug
```bash
# Debug específico do frontend
node debug-frontend-console.js

# Teste das APIs do backend  
node teste-apis-backend.js

# Teste do portal do cliente
node teste-portal-api.js
```

## 📊 Monitoramento e Debug

### Console do Frontend
Execute no console do navegador para debug avançado:

```javascript
// Funções principais disponíveis
sincronizarFrontendComBackend()     // Sincroniza com backend
verificarStatusVisualInterface()    // Verifica interface visual
testarCicloCompletoComVerificacao() // Teste completo do sistema
monitorarEstadoReact()             // Monitora componentes React
monitorarRequisicoes()             // Monitora requisições de rede
```

### APIs de Teste Backend
```powershell
# Testar ação do portal
$body = '{"acao":"visualizada"}'
Invoke-RestMethod -Uri "http://localhost:3001/api/portal/proposta/PROP-2025-051/acao" -Method POST -ContentType "application/json" -Body $body

# Listar propostas
Invoke-RestMethod -Uri "http://localhost:3001/propostas" -Method GET
```

## ✅ Status do Projeto

### � Funcionalidades Prontas para Produção
- ✅ **Sistema de Propostas**: Criação, edição e gestão completa
- ✅ **Portal do Cliente**: Interface responsiva e funcional
- ✅ **Sistema de Email**: Envio automático com templates
- ✅ **Sincronização**: Tempo real entre portal e CRM
- ✅ **Segurança**: Tokens únicos e validação
- ✅ **Debug Tools**: Ferramentas completas de teste e monitoramento

### 🔧 Últimas Correções Implementadas
- ✅ **UUID Mapping**: Resolvido problema de mapeamento de tokens
- ✅ **Frontend Sync**: Sincronização visual funcionando perfeitamente
- ✅ **Portal Service**: Todos os endpoints validados e funcionais
- ✅ **Real-time Events**: Eventos customizados operacionais
- ✅ **Status Updates**: Atualizações de status persistindo corretamente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 👨‍💻 Desenvolvedor

**Dhonleno Freitas**
- Sistema desenvolvido com foco em propostas comerciais
- Portal do cliente integrado
- Sincronização em tempo real implementada

---

## 🚀 **Sistema Pronto para Uso!**

O ConectCRM está completamente funcional com todas as funcionalidades principais implementadas e testadas. O sistema de propostas com portal do cliente está operacional e sincronizando perfeitamente em tempo real.

⭐ **Dê uma estrela se este projeto foi útil para você!**
