# 🧪 Guia de Testes - Módulo Omnichannel

**Data de Criação**: 11 de dezembro de 2025  
**Versão**: 1.0.0  
**Responsável**: Equipe de QA + Desenvolvimento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pirâmide de Testes](#pirâmide-de-testes)
3. [Testes E2E (End-to-End)](#testes-e2e-end-to-end)
4. [Testes de Integração](#testes-de-integração)
5. [Testes Unitários](#testes-unitários)
6. [Testes de Performance](#testes-de-performance)
7. [Testes de Segurança](#testes-de-segurança)
8. [CI/CD](#cicd)

---

## 🎯 Visão Geral

### Objetivos dos Testes

- ✅ **Prevenir Regressões**: Garantir que mudanças não quebrem funcionalidades existentes
- ✅ **Documentação Viva**: Testes servem como documentação de comportamento esperado
- ✅ **Refatoração Segura**: Permitir mudanças arquiteturais com confiança
- ✅ **Qualidade Produção**: Código testado = código confiável

### Métricas de Qualidade

| Métrica | Meta | Atual |
|---------|------|-------|
| Cobertura de Código | >=80% | 0% |
| Testes E2E | >=20 cenários críticos | 0 |
| Testes de Integração | >=50 casos | 0 |
| Testes Unitários | >=200 casos | 0 |
| Build CI/CD | <5min | N/A |
| Taxa de Sucesso CI/CD | >=95% | N/A |

---

## 🏗️ Pirâmide de Testes

```
        🔺 E2E (20%)
         Poucos, lentos, abrangentes
         
      🔶 INTEGRAÇÃO (30%)
       Médios, médios, integrados
       
    🔷 UNITÁRIOS (50%)
     Muitos, rápidos, focados
```

### Distribuição Recomendada

- **50%** Testes Unitários (rápidos, isolados, muitos)
- **30%** Testes de Integração (médios, com banco/APIs)
- **20%** Testes E2E (lentos, completos, poucos)

---

## 🌐 Testes E2E (End-to-End)

### Ferramentas

- **Playwright** (recomendado)
- Cypress (alternativa)

### Estrutura de Pastas

```
test/
├── e2e/
│   ├── omnichannel/
│   │   ├── auth.spec.ts
│   │   ├── chat-flow.spec.ts
│   │   ├── ticket-management.spec.ts
│   │   ├── file-upload.spec.ts
│   │   ├── websocket-realtime.spec.ts
│   │   └── multi-user.spec.ts
│   ├── fixtures/
│   │   ├── test-image.png
│   │   ├── test-document.pdf
│   │   └── test-users.json
│   └── helpers/
│       ├── auth.helper.ts
│       └── page-objects/
│           ├── LoginPage.ts
│           ├── ChatPage.ts
│           └── TicketPage.ts
└── playwright.config.ts
```

### Configuração Playwright

```typescript
// test/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Casos de Teste Críticos

#### TC001: Login e Navegação

```typescript
// test/e2e/omnichannel/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('TC001: Login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@conectsuite.com.br');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Bem-vindo')).toBeVisible();
  });

  test('TC002: Login com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@conectsuite.com.br');
    await page.fill('input[name="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });

  test('TC003: Logout', async ({ page }) => {
    // Login primeiro
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@conectsuite.com.br');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');
    
    await expect(page).toHaveURL(/.*login/);
  });
});
```

#### TC002: Fluxo Completo de Chat

```typescript
// test/e2e/omnichannel/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Omnichannel', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'atendente@conectsuite.com.br');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC004: Selecionar ticket e enviar mensagem', async ({ page }) => {
    // Navegar para chat
    await page.click('text=Atendimento');
    await page.click('text=Chat Omnichannel');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="ticket-list"]');
    
    // Selecionar primeiro ticket
    const firstTicket = page.locator('[data-testid="ticket-card"]').first();
    await firstTicket.click();
    
    // Aguardar chat carregar
    await page.waitForSelector('[data-testid="chat-area"]');
    
    // Digitar mensagem
    const mensagem = `Teste E2E - ${new Date().toISOString()}`;
    await page.fill('[data-testid="chat-input"]', mensagem);
    
    // Enviar
    await page.click('[data-testid="send-button"]');
    
    // Verificar mensagem enviada
    await expect(page.locator(`text=${mensagem}`)).toBeVisible();
    
    // Verificar indicador de "enviado"
    await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
  });

  test('TC005: Upload de arquivo', async ({ page }) => {
    await page.click('text=Atendimento');
    await page.click('text=Chat Omnichannel');
    await page.waitForSelector('[data-testid="ticket-list"]');
    await page.locator('[data-testid="ticket-card"]').first().click();
    await page.waitForSelector('[data-testid="chat-area"]');
    
    // Selecionar arquivo
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/test-image.png');
    
    // Aguardar preview
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    
    // Enviar
    await page.click('[data-testid="send-button"]');
    
    // Verificar upload concluído
    await expect(page.locator('[data-testid="file-message"]')).toBeVisible();
  });

  test('TC006: Transferir ticket para outro atendente', async ({ page }) => {
    await page.click('text=Atendimento');
    await page.click('text=Chat Omnichannel');
    await page.waitForSelector('[data-testid="ticket-list"]');
    await page.locator('[data-testid="ticket-card"]').first().click();
    
    // Abrir menu de ações
    await page.click('[data-testid="ticket-actions"]');
    
    // Clicar em transferir
    await page.click('text=Transferir');
    
    // Selecionar atendente
    await page.click('[data-testid="atendente-select"]');
    await page.click('text=João Silva');
    
    // Confirmar transferência
    await page.click('[data-testid="confirm-transfer"]');
    
    // Verificar mensagem de sucesso
    await expect(page.locator('text=Ticket transferido com sucesso')).toBeVisible();
  });
});
```

#### TC003: Websocket Realtime

```typescript
// test/e2e/omnichannel/websocket-realtime.spec.ts
import { test, expect } from '@playwright/test';

test.describe('WebSocket Realtime', () => {
  test('TC007: Dois atendentes veem mensagem em tempo real', async ({ browser }) => {
    // Criar dois contextos (dois usuários)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login Atendente 1
    await page1.goto('/login');
    await page1.fill('input[name="email"]', 'atendente1@conectsuite.com.br');
    await page1.fill('input[name="password"]', 'senha123');
    await page1.click('button[type="submit"]');
    
    // Login Atendente 2
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'atendente2@conectsuite.com.br');
    await page2.fill('input[name="password"]', 'senha123');
    await page2.click('button[type="submit"]');
    
    // Ambos acessam mesmo ticket
    await page1.goto('/atendimento/chat');
    await page2.goto('/atendimento/chat');
    
    const ticketId = 'ticket-123'; // Usar fixture
    await page1.click(`[data-ticket-id="${ticketId}"]`);
    await page2.click(`[data-ticket-id="${ticketId}"]`);
    
    // Atendente 1 envia mensagem
    const mensagem = `Realtime test - ${Date.now()}`;
    await page1.fill('[data-testid="chat-input"]', mensagem);
    await page1.click('[data-testid="send-button"]');
    
    // Verificar que Atendente 2 recebeu em tempo real
    await expect(page2.locator(`text=${mensagem}`)).toBeVisible({ timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('TC008: Indicador "digitando..." funciona', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login ambos
    await page1.goto('/login');
    await page1.fill('input[name="email"]', 'atendente1@conectsuite.com.br');
    await page1.fill('input[name="password"]', 'senha123');
    await page1.click('button[type="submit"]');
    
    await page2.goto('/login');
    await page2.fill('input[name="email"]', 'atendente2@conectsuite.com.br');
    await page2.fill('input[name="password"]', 'senha123');
    await page2.click('button[type="submit"]');
    
    // Ambos acessam mesmo ticket
    const ticketId = 'ticket-123';
    await page1.goto(`/atendimento/chat/${ticketId}`);
    await page2.goto(`/atendimento/chat/${ticketId}`);
    
    // Atendente 1 começa a digitar
    await page1.fill('[data-testid="chat-input"]', 'Test');
    
    // Atendente 2 deve ver indicador "digitando..."
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 3000 });
    await expect(page2.locator('text=está digitando...')).toBeVisible();
    
    // Atendente 1 para de digitar
    await page1.fill('[data-testid="chat-input"]', '');
    
    // Indicador deve desaparecer
    await expect(page2.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });
});
```

### Helpers e Page Objects

```typescript
// test/helpers/auth.helper.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Sair');
  await page.waitForURL(/.*login/);
}

// test/helpers/page-objects/ChatPage.ts
export class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.click('text=Atendimento');
    await this.page.click('text=Chat Omnichannel');
    await this.page.waitForSelector('[data-testid="ticket-list"]');
  }

  async selectTicket(ticketId: string) {
    await this.page.click(`[data-ticket-id="${ticketId}"]`);
    await this.page.waitForSelector('[data-testid="chat-area"]');
  }

  async sendMessage(text: string) {
    await this.page.fill('[data-testid="chat-input"]', text);
    await this.page.click('[data-testid="send-button"]');
  }

  async uploadFile(filePath: string) {
    const fileInput = await this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.click('[data-testid="send-button"]');
  }

  async transferTicket(atendenteNome: string) {
    await this.page.click('[data-testid="ticket-actions"]');
    await this.page.click('text=Transferir');
    await this.page.click('[data-testid="atendente-select"]');
    await this.page.click(`text=${atendenteNome}`);
    await this.page.click('[data-testid="confirm-transfer"]');
  }
}
```

### Comandos

```bash
# Instalar Playwright
npm install --save-dev @playwright/test
npx playwright install

# Executar todos os testes E2E
npm run test:e2e

# Executar teste específico
npx playwright test chat-flow.spec.ts

# Executar com UI (debug)
npx playwright test --ui

# Executar em modo headed (ver browser)
npx playwright test --headed

# Gerar relatório
npx playwright show-report
```

---

## 🔗 Testes de Integração

### Ferramentas

- Jest (runner)
- Supertest (HTTP requests)
- TypeORM (banco de dados de teste)

### Estrutura de Pastas

```
backend/src/modules/atendimento/tests/
├── integration/
│   ├── ticket.integration.spec.ts
│   ├── mensagem.integration.spec.ts
│   ├── websocket.integration.spec.ts
│   ├── distribuicao.integration.spec.ts
│   └── whatsapp.integration.spec.ts
└── fixtures/
    ├── tickets.fixture.ts
    ├── mensagens.fixture.ts
    └── users.fixture.ts
```

### Configuração Jest

```typescript
// backend/test/jest-integration.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../src',
  testRegex: '.*\\.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage-integration',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup-integration.ts'],
};
```

### Setup de Testes

```typescript
// backend/test/setup-integration.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

let app: TestingModule;
let dataSource: DataSource;

beforeAll(async () => {
  app = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'test',
        password: 'test',
        database: 'conectcrm_test',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true,
        dropSchema: true, // Limpa banco antes de cada suite
      }),
    ],
  }).compile();

  dataSource = app.get(DataSource);
});

afterAll(async () => {
  await dataSource.destroy();
  await app.close();
});

afterEach(async () => {
  // Limpar dados após cada teste
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
});
```

### Casos de Teste

#### IT001: Criar Ticket

```typescript
// backend/src/modules/atendimento/tests/integration/ticket.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from '../../services/ticket.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../../entities/ticket.entity';

describe('TicketService (Integration)', () => {
  let service: TicketService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'conectcrm_test',
          entities: [Ticket],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Ticket]),
      ],
      providers: [TicketService],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('criar', () => {
    it('IT001: deve criar ticket e persistir no banco', async () => {
      const dto = {
        contato_nome: 'João Silva',
        contato_telefone: '5511999998888',
        empresaId: 'empresa-123',
        canalId: 'canal-whatsapp',
        filaId: 'fila-suporte',
      };

      const ticket = await service.criar(dto);

      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.contato_nome).toBe('João Silva');
      expect(ticket.status).toBe('ABERTO');

      // Verificar que foi salvo no banco
      const ticketSalvo = await service.buscarPorId(ticket.id);
      expect(ticketSalvo).toBeDefined();
      expect(ticketSalvo.contato_nome).toBe('João Silva');
    });

    it('IT002: deve lançar erro se dados inválidos', async () => {
      const dto = {
        contato_nome: '', // Nome vazio
        contato_telefone: '5511999998888',
        empresaId: 'empresa-123',
      };

      await expect(service.criar(dto)).rejects.toThrow();
    });
  });

  describe('atualizar', () => {
    it('IT003: deve atualizar status do ticket', async () => {
      // Criar ticket
      const ticket = await service.criar({
        contato_nome: 'Maria',
        contato_telefone: '5511999997777',
        empresaId: 'empresa-123',
      });

      // Atualizar status
      const ticketAtualizado = await service.atualizar(ticket.id, {
        status: 'EM_ANDAMENTO',
      });

      expect(ticketAtualizado.status).toBe('EM_ANDAMENTO');

      // Verificar no banco
      const ticketBanco = await service.buscarPorId(ticket.id);
      expect(ticketBanco.status).toBe('EM_ANDAMENTO');
    });
  });
});
```

#### IT002: WebSocket Gateway

```typescript
// backend/src/modules/atendimento/tests/integration/websocket.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { AtendimentoGateway } from '../../gateways/atendimento.gateway';

describe('AtendimentoGateway (Integration)', () => {
  let app: INestApplication;
  let client: Socket;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [AtendimentoGateway],
    }).compile();

    app = module.createNestApplication();
    await app.listen(3002); // Porta de teste
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach((done) => {
    client = io('http://localhost:3002', {
      auth: { token: 'test-token' },
    });
    client.on('connect', done);
  });

  afterEach(() => {
    if (client.connected) {
      client.disconnect();
    }
  });

  it('IT004: deve conectar ao WebSocket', (done) => {
    expect(client.connected).toBe(true);
    done();
  });

  it('IT005: deve entrar em sala de ticket', (done) => {
    const ticketId = 'ticket-123';

    client.emit('ticket:entrar', { ticketId });

    client.on('ticket:entrado', (data) => {
      expect(data.ticketId).toBe(ticketId);
      done();
    });
  });

  it('IT006: deve receber evento de nova mensagem', (done) => {
    const ticketId = 'ticket-123';
    const mensagem = {
      id: 'msg-1',
      conteudo: 'Teste',
      ticketId,
    };

    client.emit('ticket:entrar', { ticketId });

    client.on('nova_mensagem', (data) => {
      expect(data.id).toBe(mensagem.id);
      expect(data.conteudo).toBe(mensagem.conteudo);
      done();
    });

    // Simular envio de mensagem
    setTimeout(() => {
      client.emit('mensagem:enviar', mensagem);
    }, 100);
  });
});
```

### Comandos

```bash
# Executar testes de integração
npm run test:integration

# Com cobertura
npm run test:integration -- --coverage

# Teste específico
npm run test:integration -- ticket.integration.spec.ts
```

---

## ⚙️ Testes Unitários

### Estrutura de Pastas

```
backend/src/modules/atendimento/services/__tests__/
├── ticket.service.spec.ts
├── mensagem.service.spec.ts
└── distribuicao.service.spec.ts

frontend-web/src/features/atendimento/omnichannel/__tests__/
├── hooks/
│   ├── useWebSocket.test.ts
│   └── useTickets.test.ts
├── services/
│   └── atendimentoService.test.ts
└── utils/
    └── statusUtils.test.ts
```

### Casos de Teste (Backend)

```typescript
// backend/src/modules/atendimento/services/__tests__/ticket.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from '../ticket.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../../entities/ticket.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('TicketService (Unit)', () => {
  let service: TicketService;
  let repository: Repository<Ticket>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    repository = module.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('UT001: deve retornar array de tickets', async () => {
      const mockTickets = [
        { id: '1', contato_nome: 'João', status: 'ABERTO' },
        { id: '2', contato_nome: 'Maria', status: 'EM_ANDAMENTO' },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(mockTickets as any);

      const result = await service.listar({ empresaId: 'empresa-123' });

      expect(result).toEqual(mockTickets);
      expect(repository.find).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('UT002: deve retornar array vazio se não houver tickets', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.listar({ empresaId: 'empresa-123' });

      expect(result).toEqual([]);
    });
  });

  describe('buscarPorId', () => {
    it('UT003: deve retornar ticket quando encontrado', async () => {
      const mockTicket = { id: '1', contato_nome: 'João' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockTicket as any);

      const result = await service.buscarPorId('1');

      expect(result).toEqual(mockTicket);
    });

    it('UT004: deve lançar NotFoundException quando não encontrado', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.buscarPorId('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('criar', () => {
    it('UT005: deve criar ticket com dados válidos', async () => {
      const dto = {
        contato_nome: 'João',
        contato_telefone: '5511999998888',
        empresaId: 'empresa-123',
      };
      const mockTicket = { id: '1', ...dto, status: 'ABERTO' };

      jest.spyOn(repository, 'save').mockResolvedValue(mockTicket as any);

      const result = await service.criar(dto);

      expect(result).toEqual(mockTicket);
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
    });
  });
});
```

### Casos de Teste (Frontend)

```typescript
// frontend-web/src/features/atendimento/omnichannel/__tests__/hooks/useWebSocket.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

describe('useWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('UT006: deve conectar ao WebSocket na montagem', () => {
    renderHook(() => useWebSocket());

    expect(io).toHaveBeenCalledWith(expect.stringContaining('/atendimento'), expect.any(Object));
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('UT007: deve desconectar na desmontagem', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('UT008: deve registrar listeners de eventos', () => {
    renderHook(() => useWebSocket());

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nova_mensagem', expect.any(Function));
  });

  it('UT009: deve emitir evento de "entrar em ticket"', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.entrarTicket('ticket-123');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('ticket:entrar', { ticketId: 'ticket-123' });
  });

  it('UT010: deve chamar callback ao receber nova mensagem', async () => {
    const mockCallback = jest.fn();
    const mockMensagem = { id: 'msg-1', conteudo: 'Teste' };

    renderHook(() => useWebSocket({ onNovaMensagem: mockCallback }));

    // Simular recebimento de mensagem
    const novaMensagemCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'nova_mensagem'
    )[1];

    act(() => {
      novaMensagemCallback(mockMensagem);
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(mockMensagem);
    });
  });
});
```

### Comandos

```bash
# Backend
cd backend
npm test -- --coverage

# Frontend
cd frontend-web
npm test -- --coverage

# Watch mode
npm test -- --watch

# Teste específico
npm test -- ticket.service.spec.ts
```

---

## ⚡ Testes de Performance

### Ferramentas

- k6 (load testing)
- Artillery (alternativa)

### Cenários de Teste

#### Teste de Carga: WebSocket

```javascript
// test/performance/websocket-load.js
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 500 },   // Stay at 500
    { duration: '30s', target: 0 },    // Ramp down
  ],
};

export default function () {
  const url = 'ws://localhost:3001/atendimento';
  const params = {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` },
  };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({ event: 'ticket:entrar', data: { ticketId: 'test-123' } }));
    });

    socket.on('message', (data) => {
      check(data, { 'received message': (m) => m.length > 0 });
    });

    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });

  check(res, { 'WebSocket connected': (r) => r && r.status === 101 });
}
```

**Comandos**:

```bash
# Instalar k6
# Windows: choco install k6
# Mac: brew install k6

# Executar teste
k6 run test/performance/websocket-load.js
```

---

## 🔒 Testes de Segurança

### Checklist de Segurança

- [ ] **Autenticação**: Todas as rotas protegidas?
- [ ] **Autorização**: Usuários acessam apenas seus dados?
- [ ] **SQL Injection**: Queries parametrizadas?
- [ ] **XSS**: Inputs sanitizados?
- [ ] **CSRF**: Tokens CSRF implementados?
- [ ] **Rate Limiting**: APIs protegidas contra abuso?
- [ ] **CORS**: Apenas origens confiáveis?
- [ ] **Secrets**: Sem credenciais no código?

### Testes Automatizados

```typescript
// test/security/auth.security.spec.ts
describe('Security: Autenticação', () => {
  it('SEC001: não deve acessar rota protegida sem token', async () => {
    const response = await request(app.getHttpServer())
      .get('/atendimento/tickets')
      .expect(401);

    expect(response.body.message).toContain('Unauthorized');
  });

  it('SEC002: não deve acessar dados de outra empresa', async () => {
    const tokenEmpresa1 = 'token-empresa-1';

    const response = await request(app.getHttpServer())
      .get('/atendimento/tickets')
      .query({ empresaId: 'empresa-2' })
      .set('Authorization', `Bearer ${tokenEmpresa1}`)
      .expect(403);

    expect(response.body.message).toContain('Forbidden');
  });

  it('SEC003: não deve aceitar JWT expirado', async () => {
    const expiredToken = 'expired-jwt-token';

    await request(app.getHttpServer())
      .get('/atendimento/tickets')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});
```

---

## 🚀 CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: conectcrm_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run unit tests
        run: |
          cd backend
          npm run test:cov

      - name: Run integration tests
        run: |
          cd backend
          npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: |
          cd frontend-web
          npm ci

      - name: Run tests
        run: |
          cd frontend-web
          npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend-web/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install Playwright
        run: |
          cd test
          npm ci
          npx playwright install --with-deps

      - name: Start backend
        run: |
          cd backend
          npm ci
          npm run build
          npm start &
          sleep 10

      - name: Start frontend
        run: |
          cd frontend-web
          npm ci
          npm start &
          sleep 10

      - name: Run E2E tests
        run: |
          cd test
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test/playwright-report/
```

---

## 📊 Relatórios

### Coverage Report

```bash
# Gerar relatório HTML
npm run test:cov

# Abrir relatório
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html  # Windows
```

### Playwright Report

```bash
# Gerar e abrir relatório
npx playwright show-report
```

---

## ✅ Checklist de Qualidade

### Antes de Fazer PR

- [ ] Todos os testes passando localmente
- [ ] Cobertura >= 80%
- [ ] Novo código tem testes
- [ ] Testes E2E para features críticas
- [ ] CI/CD passando
- [ ] Code review solicitado

---

**Documento vivo**: Atualizar este guia conforme novos padrões de teste são adotados.

**Última atualização**: 11 de dezembro de 2025  
**Responsável**: Equipe de QA + Desenvolvimento ConectCRM
