# 🗺️ Roadmap: Preparação Multi-Tenant para Produção

**Objetivo**: Tornar o ConectCRM pronto para comercialização SaaS com múltiplos clientes  
**Prazo Total**: 3-4 semanas  
**Data Início**: 01/11/2025  
**Data Entrega Estimada**: 29/11/2025  

---

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│  SPRINT 1        │  SPRINT 2        │  SPRINT 3            │
│  (CRÍTICO)       │  (IMPORTANTE)    │  (OTIMIZAÇÃO)        │
│  1 semana        │  1 semana        │  2 semanas           │
├─────────────────────────────────────────────────────────────┤
│  🔴 Segurança    │  🟡 Controles    │  🟢 Features         │
│  - RLS           │  - Rate Limit    │  - Whitelabel        │
│  - Middleware    │  - Auditoria     │  - API Keys          │
│  - Testes        │  - Backup        │  - Analytics         │
│  - Guards        │  - Monitoring    │  - Docs              │
└─────────────────────────────────────────────────────────────┘
```

**Status Atual**: 70% completo  
**Após Roadmap**: 100% pronto para produção

---

## 🚀 SPRINT 1: Segurança Crítica (01/11 - 08/11)

### **Meta**: Garantir isolamento total entre empresas

### 📝 Tarefas

#### 1. Row Level Security (PostgreSQL) - 2 dias
**Prioridade**: 🔴 CRÍTICA  
**Responsável**: Backend Dev  
**Tempo**: 16h

**Arquivos a modificar:**
- `backend/migrations/YYYYMMDDHHMMSS-enable-rls.ts` (novo)
- `backend/src/config/database.config.ts`

**Checklist:**
- [ ] Criar migration para habilitar RLS
- [ ] Habilitar RLS em TODAS as tabelas com `empresaId`:
  ```sql
  ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE atendentes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fluxos_triagem ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessoes_triagem ENABLE ROW LEVEL SECURITY;
  ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
  ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE canais_simples ENABLE ROW LEVEL SECURITY;
  ```

- [ ] Criar políticas de isolamento para cada tabela:
  ```sql
  CREATE POLICY tenant_isolation_clientes ON clientes
      USING (empresa_id = current_setting('app.current_tenant_id')::uuid);
      
  CREATE POLICY tenant_isolation_propostas ON propostas
      USING (empresaId = current_setting('app.current_tenant_id')::uuid);
  
  -- Repetir para todas as tabelas
  ```

- [ ] Criar função para definir tenant atual:
  ```sql
  CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
  RETURNS void AS $$
  BEGIN
      PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] Testar RLS manualmente:
  ```sql
  -- Definir tenant
  SELECT set_current_tenant('uuid-empresa-a');
  SELECT * FROM clientes; -- Deve retornar só clientes da empresa A
  
  -- Trocar tenant
  SELECT set_current_tenant('uuid-empresa-b');
  SELECT * FROM clientes; -- Deve retornar só clientes da empresa B
  ```

- [ ] Documentar comandos para desabilitar RLS (emergência)

**Validação:**
```bash
# Conectar no PostgreSQL
psql -U conectcrm -d conectcrm_prod

# Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

# Deve retornar TODAS as tabelas com empresaId
```

---

#### 2. Middleware de Tenant Context - 1 dia
**Prioridade**: 🔴 CRÍTICA  
**Responsável**: Backend Dev  
**Tempo**: 8h

**Arquivos a criar:**
- `backend/src/common/middleware/tenant-context.middleware.ts`

**Checklist:**
- [ ] Criar middleware que extrai `empresaId` do JWT
- [ ] Definir tenant no PostgreSQL para cada requisição
- [ ] Implementar:
  ```typescript
  import { Injectable, NestMiddleware } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';
  import { DataSource } from 'typeorm';

  @Injectable()
  export class TenantContextMiddleware implements NestMiddleware {
    constructor(private dataSource: DataSource) {}

    async use(req: Request, res: Response, next: NextFunction) {
      const user = req.user as any;
      
      if (user?.empresa_id) {
        try {
          // Definir tenant context no PostgreSQL
          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          
          await queryRunner.query(
            'SELECT set_current_tenant($1)',
            [user.empresa_id]
          );
          
          // Armazenar query runner no request para fechar depois
          req['tenantQueryRunner'] = queryRunner;
          
          // Log para debug
          console.log(`🔐 [TenantContext] Tenant definido: ${user.empresa_id}`);
        } catch (error) {
          console.error('❌ [TenantContext] Erro ao definir tenant:', error);
        }
      }
      
      next();
      
      // Cleanup após resposta
      if (req['tenantQueryRunner']) {
        await req['tenantQueryRunner'].release();
      }
    }
  }
  ```

- [ ] Registrar middleware em `app.module.ts`:
  ```typescript
  export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(TenantContextMiddleware)
        .forRoutes('*'); // Aplicar em todas as rotas
    }
  }
  ```

- [ ] Adicionar logs para debug
- [ ] Testar com Postman/Thunder Client

**Validação:**
```bash
# Fazer requisição autenticada
curl -H "Authorization: Bearer <token-empresa-a>" \
     http://localhost:3001/clientes

# Verificar logs:
# 🔐 [TenantContext] Tenant definido: <uuid-empresa-a>
# ✅ Query: SELECT * FROM clientes WHERE empresa_id = '<uuid-empresa-a>'
```

---

#### 3. Testes de Isolamento E2E - 2 dias
**Prioridade**: 🔴 CRÍTICA  
**Responsável**: QA / Backend Dev  
**Tempo**: 16h

**Arquivos a criar:**
- `backend/test/isolamento-multi-tenant.e2e-spec.ts`

**Checklist:**
- [ ] Criar suite de testes E2E
- [ ] Implementar cenários de teste:

```typescript
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Isolamento Multi-Tenant (E2E)', () => {
  let app: INestApplication;
  let tokenEmpresaA: string;
  let tokenEmpresaB: string;
  let clienteEmpresaA: any;
  let clienteEmpresaB: any;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Setup: Criar 2 empresas e usuários
    const empresaA = await criarEmpresa('Empresa A');
    const empresaB = await criarEmpresa('Empresa B');
    
    tokenEmpresaA = await fazerLogin(empresaA.adminEmail);
    tokenEmpresaB = await fazerLogin(empresaB.adminEmail);
  });

  describe('Isolamento de Clientes', () => {
    it('Empresa A não deve ver clientes da Empresa B', async () => {
      // Criar cliente na Empresa B
      clienteEmpresaB = await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaB}`)
        .send({ nome: 'Cliente B', email: 'b@example.com' })
        .expect(201);

      // Tentar listar como Empresa A
      const response = await request(app.getHttpServer())
        .get('/clientes')
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(200);

      // Validar que cliente B não aparece
      expect(response.body).not.toContainEqual(
        expect.objectContaining({ id: clienteEmpresaB.body.id })
      );
    });

    it('Empresa A não deve conseguir acessar cliente da Empresa B por ID', async () => {
      await request(app.getHttpServer())
        .get(`/clientes/${clienteEmpresaB.body.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404); // Não encontrado (ou 403 Forbidden)
    });

    it('Empresa A não deve conseguir atualizar cliente da Empresa B', async () => {
      await request(app.getHttpServer())
        .put(`/clientes/${clienteEmpresaB.body.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .send({ nome: 'Tentativa de Hack' })
        .expect(404); // Ou 403
    });

    it('Empresa A não deve conseguir deletar cliente da Empresa B', async () => {
      await request(app.getHttpServer())
        .delete(`/clientes/${clienteEmpresaB.body.id}`)
        .set('Authorization', `Bearer ${tokenEmpresaA}`)
        .expect(404); // Ou 403
    });
  });

  describe('Isolamento de Propostas', () => {
    it('Empresa A não deve ver propostas da Empresa B', async () => {
      // Implementar teste similar
    });
  });

  describe('Isolamento de Produtos', () => {
    it('Empresa A não deve ver produtos da Empresa B', async () => {
      // Implementar teste similar
    });
  });

  describe('Isolamento de Usuários', () => {
    it('Empresa A não deve listar usuários da Empresa B', async () => {
      // Implementar teste similar
    });
  });

  describe('Tentativas de Manipulação de Token', () => {
    it('Não deve permitir trocar empresaId via manipulação de JWT', async () => {
      // Tentar modificar token e fazer requisição
      // Deve retornar 401 Unauthorized
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

- [ ] Implementar funções auxiliares (`criarEmpresa`, `fazerLogin`)
- [ ] Executar testes: `npm run test:e2e`
- [ ] Garantir 100% dos testes passando
- [ ] Integrar testes no CI/CD

**Validação:**
```bash
npm run test:e2e -- isolamento-multi-tenant.e2e-spec.ts

# Output esperado:
# ✓ Empresa A não deve ver clientes da Empresa B
# ✓ Empresa A não deve conseguir acessar cliente da Empresa B por ID
# ✓ Empresa A não deve conseguir atualizar cliente da Empresa B
# ✓ Empresa A não deve conseguir deletar cliente da Empresa B
# ... (todos os testes passando)
```

---

#### 4. Habilitar Guards de Autenticação - 1 dia
**Prioridade**: 🔴 CRÍTICA  
**Responsável**: Backend Dev  
**Tempo**: 8h

**Arquivos a modificar:**
- `backend/src/modules/faturamento/faturamento.controller.ts`
- `backend/src/modules/planos/planos.controller.ts`
- `backend/src/modules/oportunidades/oportunidades.controller.ts`

**Checklist:**
- [ ] Buscar todos os controllers com guards comentados:
  ```bash
  grep -r "// @UseGuards(JwtAuthGuard)" backend/src/
  ```

- [ ] Descomentar `@UseGuards(JwtAuthGuard)` em:
  - `faturamento.controller.ts` (linhas 27, 65, 108)
  - `planos.controller.ts` (linha 10)
  - `oportunidades.controller.ts` (linha 22)

- [ ] Testar cada endpoint com JWT válido e inválido:
  ```bash
  # Sem token (deve retornar 401)
  curl http://localhost:3001/faturas
  
  # Com token válido (deve retornar 200)
  curl -H "Authorization: Bearer <token>" http://localhost:3001/faturas
  ```

- [ ] Verificar logs de acesso negado
- [ ] Documentar endpoints que requerem autenticação

**Validação:**
```bash
# Verificar que TODOS os controllers críticos têm guard
grep -r "@Controller" backend/src/modules/ | \
  xargs -I {} sh -c 'echo {}; grep -A 5 "@Controller" {}'

# Conferir manualmente se controllers sensíveis têm @UseGuards(JwtAuthGuard)
```

---

#### 5. Code Review de Queries - 1 dia
**Prioridade**: 🟡 IMPORTANTE  
**Responsável**: Tech Lead  
**Tempo**: 8h

**Checklist:**
- [ ] Buscar queries sem filtro de `empresaId`:
  ```bash
  # Buscar .find() sem where
  grep -rn "\.find()" backend/src/modules/ --include="*.service.ts"
  
  # Buscar .findOne() sem empresaId
  grep -rn "\.findOne({ where: { id" backend/src/modules/
  ```

- [ ] Revisar manualmente cada ocorrência
- [ ] Adicionar filtro de `empresaId` onde necessário:
  ```typescript
  // ❌ ANTES (sem empresaId)
  async findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
  
  // ✅ DEPOIS (com empresaId)
  async findById(empresaId: string, id: string) {
    return this.repository.findOne({ 
      where: { id, empresaId } 
    });
  }
  ```

- [ ] Atualizar controllers para passar `empresaId`:
  ```typescript
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.service.findById(empresaId, id);
  }
  ```

- [ ] Criar lista de queries revisadas
- [ ] Documentar padrão obrigatório para novos métodos

**Validação:**
```bash
# Executar busca novamente - deve ter ZERO resultados suspeitos
grep -rn "\.find()" backend/src/modules/ --include="*.service.ts" | \
  grep -v "empresaId" | \
  grep -v "where"
```

---

### 📊 Entregáveis Sprint 1

- ✅ PostgreSQL com RLS habilitado (migration executada)
- ✅ Middleware TenantContext funcionando
- ✅ 15+ testes E2E de isolamento (todos passando)
- ✅ Guards de autenticação habilitados (100%)
- ✅ Code review completo de queries
- ✅ Documentação de segurança atualizada

### ✅ Critérios de Aceite Sprint 1

- [ ] RLS habilitado em 15+ tabelas
- [ ] Testes E2E com 100% de sucesso
- [ ] Zero queries sem `empresaId` em métodos críticos
- [ ] Pentest manual aprovado (Empresa A vs Empresa B)
- [ ] Aprovação do Tech Lead

---

## 🛡️ SPRINT 2: Controles e Monitoramento (08/11 - 15/11)

### **Meta**: Implementar rate limiting, auditoria e backup

### 📝 Tarefas

#### 6. Rate Limiting por Plano - 2 dias
**Prioridade**: 🟡 IMPORTANTE  
**Responsável**: Backend Dev  
**Tempo**: 16h

**Arquivos a criar:**
- `backend/src/common/guards/rate-limit.guard.ts`
- `backend/src/common/decorators/api-limit.decorator.ts`

**Checklist:**
- [ ] Instalar dependências:
  ```bash
  npm install --save @nestjs/throttler redis ioredis
  ```

- [ ] Criar tabela de controle de API:
  ```sql
  CREATE TABLE api_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id UUID NOT NULL,
      mes VARCHAR(7) NOT NULL, -- '2025-11'
      total_calls INTEGER DEFAULT 0,
      limite_mensal INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(empresa_id, mes)
  );
  
  CREATE INDEX idx_api_usage_empresa_mes ON api_usage(empresa_id, mes);
  ```

- [ ] Implementar guard de rate limit:
  ```typescript
  @Injectable()
  export class ApiRateLimitGuard implements CanActivate {
    constructor(
      private assinaturasService: AssinaturasService,
      @InjectRepository(ApiUsage)
      private apiUsageRepo: Repository<ApiUsage>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const empresaId = request.user?.empresa_id;
      
      if (!empresaId) return false;
      
      // Buscar assinatura e limites
      const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
      const limite = this.getLimiteApiCalls(assinatura.plano.codigo);
      
      // Verificar uso no mês atual
      const mesAtual = new Date().toISOString().substring(0, 7); // '2025-11'
      
      let usage = await this.apiUsageRepo.findOne({
        where: { empresaId, mes: mesAtual }
      });
      
      if (!usage) {
        usage = this.apiUsageRepo.create({
          empresaId,
          mes: mesAtual,
          limiteMensal: limite,
          totalCalls: 0
        });
      }
      
      // Verificar se atingiu limite
      if (usage.totalCalls >= usage.limiteMensal) {
        throw new HttpException({
          message: `Limite de API calls atingido (${usage.totalCalls}/${usage.limiteMensal})`,
          code: 'API_LIMIT_EXCEEDED',
          resetDate: this.getNextMonthDate()
        }, HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Incrementar contador
      usage.totalCalls++;
      await this.apiUsageRepo.save(usage);
      
      return true;
    }
    
    private getLimiteApiCalls(plano: string): number {
      const limites = {
        'starter': 1000,
        'professional': 5000,
        'enterprise': 50000
      };
      return limites[plano] || 1000;
    }
  }
  ```

- [ ] Aplicar guard nos controllers:
  ```typescript
  @UseGuards(JwtAuthGuard, ApiRateLimitGuard)
  @Controller('clientes')
  export class ClientesController { ... }
  ```

- [ ] Criar endpoint para consultar uso:
  ```typescript
  @Get('usage')
  async getApiUsage(@Req() req) {
    const empresaId = req.user.empresa_id;
    // Retornar uso atual
  }
  ```

- [ ] Testar limites manualmente

**Validação:**
```bash
# Fazer 1001 requisições para empresa Starter
for i in {1..1001}; do
  curl -H "Authorization: Bearer <token-starter>" \
       http://localhost:3001/clientes
done

# A 1001ª deve retornar 429 Too Many Requests
```

---

#### 7. Sistema de Auditoria Completo - 2 dias
**Prioridade**: 🟡 IMPORTANTE  
**Responsável**: Backend Dev  
**Tempo**: 16h

**Arquivos a criar:**
- `backend/src/modules/auditoria/auditoria.module.ts`
- `backend/src/modules/auditoria/entities/audit-log.entity.ts`
- `backend/src/modules/auditoria/auditoria.service.ts`
- `backend/src/common/interceptors/audit.interceptor.ts`

**Checklist:**
- [ ] Criar entity de auditoria:
  ```typescript
  @Entity('audit_logs')
  export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    empresaId: string;

    @Column('uuid', { nullable: true })
    usuarioId: string;

    @Column()
    entidade: string; // 'cliente', 'proposta', etc

    @Column('uuid', { nullable: true })
    entidadeId: string;

    @Column()
    acao: string; // 'CREATE', 'UPDATE', 'DELETE', 'READ'

    @Column('jsonb', { nullable: true })
    dadosAnteriores: any;

    @Column('jsonb', { nullable: true })
    dadosNovos: any;

    @Column('inet', { nullable: true })
    ipAddress: string;

    @Column('text', { nullable: true })
    userAgent: string;

    @CreateDateColumn()
    createdAt: Date;
  }
  ```

- [ ] Criar service de auditoria:
  ```typescript
  @Injectable()
  export class AuditoriaService {
    async registrar(config: {
      empresaId: string;
      usuarioId?: string;
      entidade: string;
      entidadeId?: string;
      acao: string;
      dadosAnteriores?: any;
      dadosNovos?: any;
      ipAddress?: string;
      userAgent?: string;
    }) {
      const log = this.auditLogRepo.create(config);
      await this.auditLogRepo.save(log);
      return log;
    }
    
    async listarPorEmpresa(empresaId: string, filtros?: any) {
      return this.auditLogRepo.find({
        where: { empresaId, ...filtros },
        order: { createdAt: 'DESC' },
        take: 100
      });
    }
  }
  ```

- [ ] Criar interceptor para auditar automaticamente:
  ```typescript
  @Injectable()
  export class AuditInterceptor implements NestInterceptor {
    constructor(private auditoriaService: AuditoriaService) {}
    
    intercept(context: ExecutionContext, next: CallHandler) {
      const request = context.switchToHttp().getRequest();
      const method = request.method;
      const url = request.url;
      const user = request.user;
      
      // Auditar apenas operações críticas
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const entidade = this.extractEntidadeFromUrl(url);
        
        return next.handle().pipe(
          tap(async (response) => {
            await this.auditoriaService.registrar({
              empresaId: user.empresa_id,
              usuarioId: user.id,
              entidade,
              acao: method,
              dadosNovos: response,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent']
            });
          })
        );
      }
      
      return next.handle();
    }
  }
  ```

- [ ] Registrar interceptor globalmente
- [ ] Criar endpoint para consultar logs

**Validação:**
```bash
# Criar um cliente
curl -X POST http://localhost:3001/clientes \
     -H "Authorization: Bearer <token>" \
     -d '{"nome":"Teste"}'

# Consultar logs
curl http://localhost:3001/auditoria/logs \
     -H "Authorization: Bearer <token>"

# Deve retornar o log da criação do cliente
```

---

#### 8. Backup Automático por Tenant - 1 dia
**Prioridade**: 🟡 IMPORTANTE  
**Responsável**: DevOps / Backend Dev  
**Tempo**: 8h

**Arquivos a criar:**
- `backend/scripts/backup-tenant.sh`
- `backend/src/modules/backup/backup.service.ts`

**Checklist:**
- [ ] Criar script de backup:
  ```bash
  #!/bin/bash
  # backup-tenant.sh
  
  EMPRESA_ID=$1
  BACKUP_DIR="/backups/tenants"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  
  # Criar backup de dados da empresa
  pg_dump -U conectcrm -d conectcrm_prod \
    --table=clientes \
    --table=propostas \
    --table=produtos \
    --table=usuarios \
    --where="empresa_id='$EMPRESA_ID'" \
    -F c -f "$BACKUP_DIR/${EMPRESA_ID}_${TIMESTAMP}.dump"
  
  # Comprimir
  gzip "$BACKUP_DIR/${EMPRESA_ID}_${TIMESTAMP}.dump"
  
  # Limpar backups antigos (manter últimos 30 dias)
  find $BACKUP_DIR -name "${EMPRESA_ID}_*.dump.gz" -mtime +30 -delete
  
  echo "Backup concluído: ${EMPRESA_ID}_${TIMESTAMP}.dump.gz"
  ```

- [ ] Criar service de backup no NestJS:
  ```typescript
  @Injectable()
  export class BackupService {
    async criarBackup(empresaId: string): Promise<string> {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const script = `./scripts/backup-tenant.sh ${empresaId}`;
      const { stdout, stderr } = await execPromise(script);
      
      if (stderr) {
        throw new Error(`Erro no backup: ${stderr}`);
      }
      
      return stdout;
    }
    
    async listarBackups(empresaId: string): Promise<string[]> {
      // Listar arquivos de backup da empresa
    }
    
    async restaurarBackup(empresaId: string, backupId: string): Promise<void> {
      // Implementar restore
    }
  }
  ```

- [ ] Configurar cron job para backup diário:
  ```typescript
  @Injectable()
  export class BackupScheduler {
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleCron() {
      const empresas = await this.empresaService.findAll();
      
      for (const empresa of empresas) {
        try {
          await this.backupService.criarBackup(empresa.id);
          console.log(`✅ Backup concluído: ${empresa.nome}`);
        } catch (error) {
          console.error(`❌ Erro no backup ${empresa.nome}:`, error);
        }
      }
    }
  }
  ```

- [ ] Testar backup manual
- [ ] Testar restore em ambiente de teste

**Validação:**
```bash
# Executar backup manual
./backend/scripts/backup-tenant.sh <empresa-id>

# Verificar arquivo criado
ls -lh /backups/tenants/<empresa-id>_*.dump.gz

# Testar restore
pg_restore -U conectcrm -d conectcrm_test \
  /backups/tenants/<empresa-id>_*.dump.gz
```

---

#### 9. Monitoramento e Alertas - 1 dia
**Prioridade**: 🟡 IMPORTANTE  
**Responsável**: DevOps  
**Tempo**: 8h

**Checklist:**
- [ ] Configurar Prometheus + Grafana (se ainda não tiver)
- [ ] Criar dashboard de métricas por tenant:
  - Número de requisições por empresa
  - Tempo de resposta médio por empresa
  - Erros por empresa (taxa de erro)
  - Uso de API calls (% do limite)
  - Storage usado por empresa

- [ ] Configurar alertas:
  - Empresa atingiu 80% do limite de API calls
  - Empresa atingiu 90% do storage
  - Taxa de erro > 5% para uma empresa
  - Tempo de resposta > 2s para uma empresa

- [ ] Implementar endpoint de health check por tenant:
  ```typescript
  @Get('health/:empresaId')
  async checkTenantHealth(@Param('empresaId') empresaId: string) {
    const assinatura = await this.assinaturasService.buscarPorEmpresa(empresaId);
    const apiUsage = await this.getApiUsage(empresaId);
    const storageUsage = await this.getStorageUsage(empresaId);
    
    return {
      empresaId,
      plano: assinatura.plano.nome,
      status: assinatura.status,
      apiUsage: {
        current: apiUsage.totalCalls,
        limit: apiUsage.limiteMensal,
        percentage: (apiUsage.totalCalls / apiUsage.limiteMensal) * 100
      },
      storageUsage: {
        current: storageUsage.used,
        limit: storageUsage.limit,
        percentage: (storageUsage.used / storageUsage.limit) * 100
      }
    };
  }
  ```

- [ ] Documentar dashboards criados

**Validação:**
- Grafana mostra métricas de pelo menos 2 empresas separadamente
- Alertas disparam quando limites são atingidos

---

### 📊 Entregáveis Sprint 2

- ✅ Rate limiting implementado (por plano)
- ✅ Sistema de auditoria completo (tabela + service)
- ✅ Backup automático diário (cron job)
- ✅ Monitoramento por tenant (Grafana)
- ✅ Alertas configurados

### ✅ Critérios de Aceite Sprint 2

- [ ] Rate limit funcionando (Starter bloqueado após 1000 calls)
- [ ] Auditoria registrando todas as operações críticas
- [ ] Backup executado com sucesso (teste manual)
- [ ] Dashboard Grafana com métricas de 2+ empresas
- [ ] Alertas disparando corretamente

---

## 🎨 SPRINT 3: Features e Otimização (15/11 - 29/11)

### **Meta**: Implementar whitelabel, API keys e documentação

### 📝 Tarefas

#### 10. Whitelabel Básico - 3 dias
**Prioridade**: 🟢 DESEJÁVEL  
**Responsável**: Full Stack Dev  
**Tempo**: 24h

**Arquivos a modificar:**
- `backend/src/modules/empresas/empresa.entity.ts`
- `frontend-web/src/contexts/WhitelabelContext.tsx`
- `frontend-web/src/App.tsx`

**Checklist:**

**Backend:**
- [ ] Adicionar campos na entity `Empresa`:
  ```typescript
  @Column({ nullable: true })
  logo_url: string;
  
  @Column('jsonb', { nullable: true })
  whitelabel_config: {
    corPrimaria?: string;
    corSecundaria?: string;
    corAcento?: string;
    favicon?: string;
    dominioCustomizado?: string;
  };
  ```

- [ ] Criar endpoint de upload de logo:
  ```typescript
  @Post(':empresaId/logo')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @Param('empresaId') empresaId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    // Upload para S3/storage
    const logoUrl = await this.storageService.upload(file);
    
    // Atualizar empresa
    await this.empresaService.update(empresaId, { logo_url: logoUrl });
    
    return { logoUrl };
  }
  ```

- [ ] Criar endpoint para atualizar cores:
  ```typescript
  @Patch(':empresaId/whitelabel')
  async updateWhitelabel(
    @Param('empresaId') empresaId: string,
    @Body() config: WhitelabelConfigDto
  ) {
    return this.empresaService.updateWhitelabel(empresaId, config);
  }
  ```

**Frontend:**
- [ ] Criar context de whitelabel:
  ```typescript
  interface WhitelabelConfig {
    logoUrl?: string;
    corPrimaria?: string;
    corSecundaria?: string;
    nomeEmpresa?: string;
  }
  
  export const WhitelabelContext = createContext<WhitelabelConfig>({});
  
  export const WhitelabelProvider: React.FC = ({ children }) => {
    const [config, setConfig] = useState<WhitelabelConfig>({});
    const { empresaAtiva } = useEmpresas();
    
    useEffect(() => {
      if (empresaAtiva) {
        setConfig({
          logoUrl: empresaAtiva.logo_url,
          corPrimaria: empresaAtiva.whitelabel_config?.corPrimaria,
          corSecundaria: empresaAtiva.whitelabel_config?.corSecundaria,
          nomeEmpresa: empresaAtiva.nome
        });
      }
    }, [empresaAtiva]);
    
    return (
      <WhitelabelContext.Provider value={config}>
        {children}
      </WhitelabelContext.Provider>
    );
  };
  ```

- [ ] Aplicar cores dinamicamente:
  ```typescript
  // App.tsx
  const { corPrimaria, corSecundaria } = useWhitelabel();
  
  useEffect(() => {
    if (corPrimaria) {
      document.documentElement.style.setProperty('--cor-primaria', corPrimaria);
    }
    if (corSecundaria) {
      document.documentElement.style.setProperty('--cor-secundaria', corSecundaria);
    }
  }, [corPrimaria, corSecundaria]);
  ```

- [ ] Criar página de configuração de whitelabel:
  - Upload de logo
  - Seletor de cores (color picker)
  - Preview em tempo real

- [ ] Substituir logo hardcoded pelo logo da empresa

**Validação:**
- Empresa A vê seu próprio logo
- Empresa B vê seu próprio logo (diferente)
- Cores aplicadas corretamente em toda a UI

---

#### 11. Sistema de API Keys - 3 dias
**Prioridade**: 🟢 DESEJÁVEL  
**Responsável**: Backend Dev  
**Tempo**: 24h

**Arquivos a criar:**
- `backend/src/modules/api-keys/api-key.entity.ts`
- `backend/src/modules/api-keys/api-keys.service.ts`
- `backend/src/modules/api-keys/api-keys.controller.ts`
- `backend/src/common/guards/api-key-auth.guard.ts`

**Checklist:**
- [ ] Criar entity de API Key:
  ```typescript
  @Entity('api_keys')
  export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    empresaId: string;

    @Column({ unique: true })
    keyHash: string; // Hash SHA-256 da chave

    @Column()
    name: string; // Nome descritivo (ex: "Integração ERP")

    @Column('simple-array')
    scopes: string[]; // ['read:clientes', 'write:propostas']

    @Column({ default: true })
    active: boolean;

    @Column({ nullable: true })
    expiresAt: Date;

    @Column({ default: 0 })
    usageCount: number;

    @Column({ nullable: true })
    lastUsedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
  }
  ```

- [ ] Implementar geração de API Key:
  ```typescript
  @Injectable()
  export class ApiKeysService {
    async generateApiKey(
      empresaId: string, 
      name: string, 
      scopes: string[]
    ): Promise<{ key: string; keyHash: string }> {
      // Gerar chave aleatória
      const rawKey = `ck_${randomBytes(32).toString('hex')}`;
      
      // Hash da chave (salvar apenas o hash)
      const keyHash = createHash('sha256').update(rawKey).digest('hex');
      
      // Salvar no banco
      const apiKey = this.apiKeyRepo.create({
        empresaId,
        keyHash,
        name,
        scopes,
        active: true
      });
      
      await this.apiKeyRepo.save(apiKey);
      
      // Retornar chave apenas UMA VEZ (nunca mais)
      return { key: rawKey, keyHash };
    }
    
    async validateApiKey(rawKey: string): Promise<ApiKey | null> {
      const keyHash = createHash('sha256').update(rawKey).digest('hex');
      
      const apiKey = await this.apiKeyRepo.findOne({
        where: { keyHash, active: true }
      });
      
      if (!apiKey) return null;
      
      // Verificar expiração
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }
      
      // Atualizar uso
      apiKey.usageCount++;
      apiKey.lastUsedAt = new Date();
      await this.apiKeyRepo.save(apiKey);
      
      return apiKey;
    }
  }
  ```

- [ ] Criar guard de autenticação por API Key:
  ```typescript
  @Injectable()
  export class ApiKeyAuthGuard implements CanActivate {
    constructor(private apiKeysService: ApiKeysService) {}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];
      
      if (!apiKey) {
        throw new UnauthorizedException('API Key não fornecida');
      }
      
      const validKey = await this.apiKeysService.validateApiKey(apiKey);
      
      if (!validKey) {
        throw new UnauthorizedException('API Key inválida');
      }
      
      // Adicionar info da empresa no request
      request.user = { 
        empresa_id: validKey.empresaId,
        scopes: validKey.scopes 
      };
      
      return true;
    }
  }
  ```

- [ ] Criar endpoints CRUD:
  ```typescript
  @Post('keys')
  async createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.generateApiKey(
      dto.empresaId, 
      dto.name, 
      dto.scopes
    );
  }
  
  @Get('keys')
  async listApiKeys(@Req() req) {
    return this.apiKeysService.findByEmpresa(req.user.empresa_id);
  }
  
  @Delete('keys/:id')
  async revokeApiKey(@Param('id') id: string) {
    return this.apiKeysService.revoke(id);
  }
  ```

- [ ] Permitir autenticação por JWT OU API Key:
  ```typescript
  @UseGuards(JwtAuthGuard, ApiKeyAuthGuard)
  @Controller('api/v1/clientes')
  export class ClientesApiController { ... }
  ```

- [ ] Documentar uso de API Keys

**Validação:**
```bash
# Gerar API Key
curl -X POST http://localhost:3001/api-keys/keys \
     -H "Authorization: Bearer <jwt-token>" \
     -d '{"name":"Teste","scopes":["read:clientes"]}'

# Response: { "key": "ck_abc123...", "keyHash": "..." }

# Usar API Key
curl http://localhost:3001/api/v1/clientes \
     -H "X-Api-Key: ck_abc123..."

# Deve retornar clientes da empresa
```

---

#### 12. Dashboard de Analytics - 2 dias
**Prioridade**: 🟢 DESEJÁVEL  
**Responsável**: Frontend Dev  
**Tempo**: 16h

**Arquivos a criar:**
- `frontend-web/src/pages/empresas/AnalyticsTenantPage.tsx`

**Checklist:**
- [ ] Criar página de analytics da empresa
- [ ] Mostrar métricas:
  - **Uso de API**: calls usado / limite
  - **Storage**: GB usado / limite
  - **Usuários**: ativos / limite
  - **Clientes**: total cadastrados / limite
  - **Gráfico**: API calls por dia (últimos 30 dias)
  - **Logs de auditoria**: últimas 50 ações

- [ ] Criar service:
  ```typescript
  export const analyticsService = {
    async getMetricasEmpresa(empresaId: string) {
      const response = await api.get(`/empresas/${empresaId}/metricas`);
      return response.data;
    },
    
    async getApiUsageHistory(empresaId: string, periodo: string) {
      const response = await api.get(
        `/empresas/${empresaId}/api-usage/history?periodo=${periodo}`
      );
      return response.data;
    }
  };
  ```

- [ ] Implementar gráficos (usar Recharts):
  ```tsx
  <LineChart data={apiUsageHistory}>
    <XAxis dataKey="data" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="calls" stroke="#8884d8" />
  </LineChart>
  ```

- [ ] Adicionar cards de métricas:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <MetricCard
      title="API Calls"
      current={1234}
      limit={5000}
      icon={<Activity />}
      color="blue"
    />
    <MetricCard
      title="Storage"
      current="2.3 GB"
      limit="5 GB"
      icon={<HardDrive />}
      color="green"
    />
    {/* ... */}
  </div>
  ```

- [ ] Adicionar alertas visuais quando perto do limite

**Validação:**
- Dashboard carrega métricas corretamente
- Gráficos renderizam sem erros
- Valores atualizados em tempo real

---

#### 13. Documentação Completa - 2 dias
**Prioridade**: 🟢 DESEJÁVEL  
**Responsável**: Tech Writer / Dev  
**Tempo**: 16h

**Arquivos a criar:**
- `docs/MULTI_TENANT_ARCHITECTURE.md`
- `docs/API_KEYS_GUIDE.md`
- `docs/WHITELABEL_SETUP.md`
- `docs/SECURITY_BEST_PRACTICES.md`
- `docs/TROUBLESHOOTING.md`

**Checklist:**
- [ ] **Documentar arquitetura multi-tenant**:
  - Como funciona o isolamento
  - Row Level Security explicado
  - Diagrama de fluxo de autenticação
  - Exemplos de queries

- [ ] **Guia de uso de API Keys**:
  - Como gerar API Key
  - Como usar em requisições
  - Scopes disponíveis
  - Renovação e revogação

- [ ] **Setup de Whitelabel**:
  - Como fazer upload de logo
  - Como personalizar cores
  - Como configurar domínio customizado
  - Limites por plano

- [ ] **Best Practices de Segurança**:
  - Como escrever queries seguras
  - Checklist de segurança para novos endpoints
  - Como fazer code review focado em multi-tenant
  - Testes obrigatórios

- [ ] **Troubleshooting**:
  - "Empresa A está vendo dados da Empresa B" → Como investigar
  - "Rate limit atingido" → Como aumentar
  - "Backup falhou" → Como recuperar
  - "API Key não funciona" → Validações

- [ ] **README de deploy**:
  - Como executar migrations de RLS
  - Como configurar backup automático
  - Como configurar monitoramento
  - Variáveis de ambiente necessárias

- [ ] Criar exemplos de código (Postman collection)

**Validação:**
- Documentação revisada por 2+ pessoas
- Exemplos testados e funcionando
- Links internos válidos

---

#### 14. Testes de Carga - 2 dias
**Prioridade**: 🟢 DESEJÁVEL  
**Responsável**: QA / DevOps  
**Tempo**: 16h

**Checklist:**
- [ ] Instalar ferramenta de teste de carga:
  ```bash
  npm install -g artillery k6
  ```

- [ ] Criar cenários de teste:
  ```yaml
  # artillery-test.yml
  config:
    target: "https://conecthelp.com.br"
    phases:
      - duration: 60
        arrivalRate: 10 # 10 usuários/segundo
        name: "Warm up"
      - duration: 300
        arrivalRate: 50 # 50 usuários/segundo
        name: "Carga normal"
      - duration: 120
        arrivalRate: 100 # 100 usuários/segundo
        name: "Pico"
  
  scenarios:
    - name: "Login e Listar Clientes"
      flow:
        - post:
            url: "/auth/login"
            json:
              email: "{{ $randomEmail() }}"
              password: "senha123"
            capture:
              - json: "$.token"
                as: "token"
        - get:
            url: "/clientes"
            headers:
              Authorization: "Bearer {{ token }}"
  ```

- [ ] Executar testes de carga:
  ```bash
  artillery run artillery-test.yml --output report.json
  artillery report report.json
  ```

- [ ] Analisar métricas:
  - Tempo de resposta (p50, p95, p99)
  - Taxa de erro
  - Throughput (requisições/segundo)
  - Uso de CPU/memória

- [ ] Identificar gargalos
- [ ] Otimizar queries lentas
- [ ] Adicionar índices no banco se necessário
- [ ] Documentar capacidade máxima

**Validação:**
- Sistema aguenta 50 usuários simultâneos com p95 < 500ms
- Taxa de erro < 1%
- Banco não trava sob carga

---

#### 15. Pentest Externo - 2 dias
**Prioridade**: 🔴 CRÍTICA  
**Responsável**: Security Consultant (externo)  
**Tempo**: 16h

**Checklist:**
- [ ] Contratar empresa de pentest (ou usar HackerOne)
- [ ] Fornecer acesso controlado:
  - 2 contas de teste (Empresa A e Empresa B)
  - Ambiente de staging (não produção)
  - Lista de endpoints críticos

- [ ] Solicitar testes específicos:
  - **Isolamento de dados**: Tentar acessar dados de outra empresa
  - **Manipulação de JWT**: Tentar trocar `empresaId` no token
  - **SQL Injection**: Tentar bypassar RLS
  - **API Rate Limiting**: Tentar burlar limites
  - **Enumeração de IDs**: Tentar adivinhar IDs de outras empresas

- [ ] Receber relatório de vulnerabilidades
- [ ] Corrigir vulnerabilidades encontradas
- [ ] Re-testar (validação)

**Validação:**
- Relatório de pentest com score > 8/10
- Zero vulnerabilidades críticas
- Vulnerabilidades médias/baixas documentadas e priorizadas

---

### 📊 Entregáveis Sprint 3

- ✅ Whitelabel funcionando (logo + cores)
- ✅ Sistema de API Keys implementado
- ✅ Dashboard de analytics por tenant
- ✅ Documentação completa (5+ docs)
- ✅ Testes de carga executados
- ✅ Pentest externo aprovado

### ✅ Critérios de Aceite Sprint 3

- [ ] Whitelabel funciona (2+ empresas com logos diferentes)
- [ ] API Keys geradas e funcionando
- [ ] Dashboard analytics mostra métricas reais
- [ ] Documentação completa e revisada
- [ ] Sistema aguenta 50+ usuários simultâneos
- [ ] Pentest aprovado (score > 8/10)

---

## 📈 Resumo da Roadmap

### Linha do Tempo
```
Semana 1 (01/11-08/11): SPRINT 1 - Segurança Crítica
├─ RLS + Middleware + Testes + Guards
└─ Resultado: Sistema SEGURO para multi-tenant

Semana 2 (08/11-15/11): SPRINT 2 - Controles
├─ Rate Limit + Auditoria + Backup + Monitoring
└─ Resultado: Sistema CONTROLADO e AUDITÁVEL

Semanas 3-4 (15/11-29/11): SPRINT 3 - Features
├─ Whitelabel + API Keys + Analytics + Docs + Pentest
└─ Resultado: Sistema COMPLETO para vendas
```

### Investimento Total
- **Tempo**: 3-4 semanas (80-120 horas)
- **Equipe mínima**:
  - 1 Backend Dev (sênior)
  - 1 Frontend Dev (pleno)
  - 1 DevOps (pleno)
  - 1 QA (pleno)
  - 1 Security Consultant (externo, 2 dias)

### ROI Esperado
- **Antes**: Sistema mono-tenant (1 cliente)
- **Depois**: Sistema multi-tenant (10+ clientes)
- **Receita projetada**: R$ 5.000-10.000/mês por cliente
- **Payback**: 1-2 meses

---

## ✅ Checklist Final de Produção

Antes de liberar o sistema para vendas, validar:

### Segurança
- [ ] RLS habilitado em 15+ tabelas
- [ ] Middleware TenantContext funcionando
- [ ] 100% dos testes de isolamento passando
- [ ] Guards habilitados em todos os controllers críticos
- [ ] Pentest aprovado (score > 8/10)
- [ ] SSL/HTTPS configurado corretamente

### Performance
- [ ] Sistema aguenta 50+ usuários simultâneos
- [ ] p95 de tempo de resposta < 500ms
- [ ] Taxa de erro < 1%
- [ ] Queries otimizadas (índices criados)

### Controles
- [ ] Rate limiting por plano funcionando
- [ ] Auditoria registrando todas as operações
- [ ] Backup automático diário configurado
- [ ] Monitoramento com alertas configurado

### Features
- [ ] Registro de empresa funcionando
- [ ] Login multi-tenant funcionando
- [ ] Whitelabel básico implementado (opcional)
- [ ] API Keys disponíveis (opcional)
- [ ] Dashboard de analytics (opcional)

### Documentação
- [ ] Arquitetura multi-tenant documentada
- [ ] Guia de segurança criado
- [ ] Troubleshooting documentado
- [ ] Postman collection com exemplos

### Legal / Compliance
- [ ] Termos de uso atualizados
- [ ] Política de privacidade (LGPD)
- [ ] SLA definido por plano
- [ ] Contrato de serviço (SaaS agreement)

---

## 🎯 Próximos Passos IMEDIATOS

1. **Reunir equipe** e apresentar roadmap
2. **Priorizar Sprint 1** (segurança crítica)
3. **Alocar desenvolvedores** full-time
4. **Criar projeto no Jira/Trello** com todas as tarefas
5. **Iniciar Sprint 1** na segunda-feira

---

**Conclusão**: Com esta roadmap, o ConectCRM estará 100% pronto para comercialização SaaS em **3-4 semanas**, com segurança de nível empresarial, controles robustos e features para competir no mercado.

Quer que eu ajude a implementar alguma das sprints? Posso começar pela **Sprint 1 (RLS + Middleware + Testes)** que é a mais crítica! 🚀
