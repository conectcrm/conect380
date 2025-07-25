# ⚡ Sistema de API Management para SaaS

## 📋 **Controle de Uso de API por Plano**

### 1. **🚦 Rate Limiting por Tenant**

```typescript
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  constructor(
    private redis: RedisService,
    private assinaturasService: AssinaturasService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) return false;
    
    // Buscar limites do plano
    const assinatura = await this.assinaturasService.getAssinaturaAtiva(user.empresa_id);
    const limits = await this.getApiLimits(assinatura.plano_id);
    
    // Verificar rate limit
    const key = `api_limit:${user.empresa_id}:${this.getTimeWindow()}`;
    const currentCount = await this.redis.incr(key);
    
    if (currentCount === 1) {
      await this.redis.expire(key, 3600); // 1 hora
    }
    
    if (currentCount > limits.requests_per_hour) {
      throw new HttpException(
        'API rate limit exceeded for your plan',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    return true;
  }
}

// Configuração de limites por plano
const API_LIMITS = {
  'starter': { requests_per_hour: 1000, requests_per_day: 10000 },
  'professional': { requests_per_hour: 5000, requests_per_day: 50000 },
  'enterprise': { requests_per_hour: 20000, requests_per_day: 200000 }
};
```

### 2. **📊 Monitoramento de Uso de API**

```sql
-- Tabela de logs de API
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    usuario_id UUID,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agregações diárias para performance
CREATE TABLE api_usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    data DATE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    total_bandwidth_mb DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(empresa_id, data)
);
```

### 3. **🔑 API Keys por Cliente**

```typescript
@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  empresa_id: string;

  @Column({ unique: true })
  key_hash: string; // Hash da chave

  @Column()
  name: string;

  @Column({ type: 'simple-array' })
  scopes: string[]; // ['read:clientes', 'write:propostas']

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ default: 0 })
  usage_count: number;

  @Column({ nullable: true })
  last_used_at: Date;
}

@Injectable()
export class ApiKeyService {
  async generateApiKey(empresaId: string, name: string, scopes: string[]) {
    const rawKey = this.generateRandomKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    
    const apiKey = new ApiKey();
    apiKey.empresa_id = empresaId;
    apiKey.key_hash = keyHash;
    apiKey.name = name;
    apiKey.scopes = scopes;
    
    await this.apiKeyRepository.save(apiKey);
    
    return `fenix_${apiKey.id}_${rawKey}`;
  }
}
```

### 4. **📈 Dashboard de API Usage**

```typescript
@Injectable()
export class ApiAnalyticsService {
  async getApiUsageDashboard(empresaId: string) {
    return {
      current_month: {
        total_requests: await this.getTotalRequestsMonth(empresaId),
        successful_rate: await this.getSuccessRate(empresaId),
        avg_response_time: await this.getAvgResponseTime(empresaId),
        bandwidth_used_mb: await this.getBandwidthUsed(empresaId)
      },
      limits: {
        plan_limits: await this.getPlanLimits(empresaId),
        usage_percentage: await this.getUsagePercentage(empresaId)
      },
      endpoints: {
        most_used: await this.getMostUsedEndpoints(empresaId),
        slowest: await this.getSlowestEndpoints(empresaId),
        error_prone: await this.getErrorProneEndpoints(empresaId)
      },
      trends: {
        daily_usage: await this.getDailyUsageTrend(empresaId),
        peak_hours: await this.getPeakHours(empresaId)
      }
    };
  }
}
