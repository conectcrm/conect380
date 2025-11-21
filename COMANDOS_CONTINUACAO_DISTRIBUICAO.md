# 🚀 Comandos para Continuar - Distribuição Automática

Este arquivo contém comandos prontos para dar continuidade à implementação da Distribuição Automática de Filas.

---

## ✅ O Que Já Está Pronto

- ✅ 3 Entities criadas (`DistribuicaoConfig`, `AtendenteSkill`, `DistribuicaoLog`)
- ✅ 4 DTOs de validação criados
- ✅ Migration executada com sucesso (3 tabelas criadas)
- ✅ Entities registradas em `database.config.ts`
- ✅ Documentação completa (`PLANEJAMENTO_*`, `CONCLUSAO_*`, `RESUMO_*`)

---

## 🎯 Próximo Passo: DistribuicaoService

### Comando para o Copilot:

```
Criar DistribuicaoService em backend/src/modules/atendimento/services/distribuicao.service.ts

O service deve ter:

1. Método principal:
   - distribuirTicket(ticketId: string): Promise<User>
   - Busca config da fila
   - Executa algoritmo configurado
   - Registra log de auditoria
   - Retorna atendente selecionado

2. Algoritmo Round-Robin:
   - roundRobin(filaId: string): Promise<User>
   - Distribuir para próximo atendente da lista circular
   - Pular atendentes offline se priorizarOnline=true
   - Verificar capacidadeMaxima não atingida

3. Algoritmo Menor Carga:
   - menorCarga(filaId: string): Promise<User>
   - SELECT COUNT(*) dos tickets em aberto por atendente
   - Retornar atendente com menor contagem
   - Priorizar online se configurado

4. Algoritmo Skills-Based:
   - skillsBased(filaId: string, skills: string[]): Promise<User>
   - Filtrar atendentes que possuem as skills
   - Ordenar por nível de proficiência (DESC)
   - Considerar disponibilidade

5. Algoritmo Híbrido:
   - hibrido(filaId: string, skills?: string[]): Promise<User>
   - Se há skills: filtrar por skills
   - Entre os que têm skills: escolher menor carga
   - Se ninguém tem skills: fallback para menorCarga

6. Métodos auxiliares:
   - isAtendenteDisponivel(atendenteId: string): Promise<boolean>
   - atingiuCapacidadeMaxima(atendenteId: string, filaId: string): Promise<boolean>
   - registrarLog(ticketId, atendenteId, filaId, algoritmo, motivo): Promise<void>

Usar:
- @Injectable() decorator
- Injetar repositories: DistribuicaoConfig, AtendenteSkill, DistribuicaoLog, Fila, User, Ticket
- Try-catch com logs detalhados
- Retornar NotFoundException se não encontrar atendente disponível
- Validar se fila existe e tem config ativa
```

---

## 📋 Comandos Úteis

### Ver migrations pendentes
```powershell
cd backend
npm run migration:show
```

### Reverter última migration (se necessário)
```powershell
cd backend
npm run migration:revert
```

### Verificar tabelas criadas no banco
```sql
-- Conectar no PostgreSQL (porta 5434)
\dt distribuicao*
\dt atendente_skills

-- Ver estrutura das tabelas
\d distribuicao_config
\d distribuicao_log
\d atendente_skills
```

### Compilar backend
```powershell
cd backend
npm run build
```

### Iniciar backend em modo dev
```powershell
cd backend
npm run start:dev
```

### Testar endpoints (após criar controller)
```powershell
# Criar config de distribuição
curl -X POST http://localhost:3001/atendimento/distribuicao/config `
  -H "Content-Type: application/json" `
  -d '{
    "filaId": "uuid-da-fila",
    "algoritmo": "round-robin",
    "capacidadeMaxima": 10,
    "priorizarOnline": true
  }'

# Buscar config por fila
curl http://localhost:3001/atendimento/distribuicao/config/uuid-da-fila

# Distribuir ticket manualmente
curl -X POST http://localhost:3001/atendimento/distribuicao/distribuir/uuid-do-ticket

# Ver histórico de distribuições
curl http://localhost:3001/atendimento/distribuicao/historico/uuid-da-fila
```

---

## 📂 Estrutura de Arquivos (Referência)

```
backend/src/modules/atendimento/
├── entities/
│   ├── distribuicao-config.entity.ts ✅
│   ├── atendente-skill.entity.ts ✅
│   ├── distribuicao-log.entity.ts ✅
│   ├── fila.entity.ts ✅ (já existia)
│   └── ticket.entity.ts ✅ (já existia)
│
├── dto/distribuicao/
│   ├── create-distribuicao-config.dto.ts ✅
│   ├── update-distribuicao-config.dto.ts ✅
│   ├── create-atendente-skill.dto.ts ✅
│   └── update-atendente-skill.dto.ts ✅
│
├── services/
│   ├── fila.service.ts ✅ (já existia)
│   └── distribuicao.service.ts ⏳ CRIAR AGORA
│
├── controllers/
│   ├── fila.controller.ts ✅ (já existia)
│   └── distribuicao.controller.ts ⏳ CRIAR DEPOIS
│
└── atendimento.module.ts (registrar service/controller)
```

---

## 🧪 Checklist de Validação

Após criar DistribuicaoService:

- [ ] Service compilando sem erros TypeScript
- [ ] Todos os repositories injetados corretamente
- [ ] Método `distribuirTicket()` orquestrando algoritmos
- [ ] 4 algoritmos implementados (round-robin, menor-carga, skills, híbrido)
- [ ] Verificações de disponibilidade funcionando
- [ ] Logs sendo registrados em `distribuicao_log`
- [ ] Testes unitários escritos (opcional mas recomendado)

Após criar DistribuicaoController:

- [ ] Controller compilando sem erros
- [ ] Rotas registradas em `atendimento.module.ts`
- [ ] Endpoint POST `/config` criando configuração
- [ ] Endpoint GET `/config/:filaId` retornando config
- [ ] Endpoint PUT `/config/:id` atualizando config
- [ ] Endpoint POST `/distribuir/:ticketId` funcionando
- [ ] Endpoint GET `/historico/:filaId` retornando logs
- [ ] Validações de DTO ativas (class-validator)
- [ ] Error handling implementado (try-catch)

---

## 📖 Documentação de Referência

### Arquivos a Consultar

1. **Planejamento Geral**:
   - `PLANEJAMENTO_DISTRIBUICAO_AUTOMATICA.md` (roadmap completo)

2. **Backend Concluído**:
   - `CONCLUSAO_DISTRIBUICAO_AUTOMATICA_BACKEND.md` (detalhes de implementação)

3. **Resumo da Sessão**:
   - `RESUMO_SESSAO_DISTRIBUICAO_AUTOMATICA.md` (o que foi feito e próximos passos)

4. **Auditoria Geral**:
   - `AUDITORIA_PROGRESSO_REAL.md` (seção "Etapa 3.5")

5. **Entities Criadas**:
   - `backend/src/modules/atendimento/entities/distribuicao-config.entity.ts`
   - `backend/src/modules/atendimento/entities/atendente-skill.entity.ts`
   - `backend/src/modules/atendimento/entities/distribuicao-log.entity.ts`

6. **DTOs Criados**:
   - `backend/src/modules/atendimento/dto/distribuicao/*.dto.ts` (4 arquivos)

### Exemplos de Código

#### Injeção de Repositories
```typescript
@Injectable()
export class DistribuicaoService {
  constructor(
    @InjectRepository(DistribuicaoConfig)
    private readonly distribuicaoConfigRepo: Repository<DistribuicaoConfig>,
    
    @InjectRepository(AtendenteSkill)
    private readonly atendenteSkillRepo: Repository<AtendenteSkill>,
    
    @InjectRepository(DistribuicaoLog)
    private readonly distribuicaoLogRepo: Repository<DistribuicaoLog>,
    
    @InjectRepository(Fila)
    private readonly filaRepo: Repository<Fila>,
    
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}
}
```

#### Query de Menor Carga
```typescript
const cargasPorAtendente = await this.ticketRepo
  .createQueryBuilder('ticket')
  .select('ticket.atendenteId', 'atendenteId')
  .addSelect('COUNT(ticket.id)', 'totalTickets')
  .where('ticket.status != :status', { status: 'fechado' })
  .andWhere('ticket.filaId = :filaId', { filaId })
  .groupBy('ticket.atendenteId')
  .orderBy('totalTickets', 'ASC')
  .getRawMany();
```

#### Registrar Log
```typescript
await this.distribuicaoLogRepo.save({
  ticketId,
  atendenteId: atendente.id,
  filaId,
  algoritmo: 'round-robin',
  motivo: 'Distribuição circular - próximo da fila',
  cargaAtendente: 5,
  realocacao: false,
});
```

---

## 🎯 Ordem de Implementação Sugerida

1. **Criar DistribuicaoService** (agora)
   - Implementar `distribuirTicket()` básico
   - Implementar `roundRobin()` (mais simples)
   - Implementar `menorCarga()`
   - Implementar `skillsBased()`
   - Implementar `hibrido()`
   - Adicionar verificações e logs

2. **Testar Service Manualmente** (opcional)
   - Criar script de teste em `backend/scripts/test-distribuicao.ts`
   - Popular dados de teste (filas, atendentes, skills)
   - Chamar `distribuirTicket()` e verificar logs

3. **Criar DistribuicaoController**
   - Endpoints CRUD de config
   - Endpoint distribuição manual
   - Endpoint métricas/histórico

4. **Registrar no Module**
   - Adicionar service em `providers`
   - Adicionar controller em `controllers`
   - Adicionar entities em `TypeOrmModule.forFeature()`

5. **Testar Endpoints**
   - Usar Postman/Thunder Client
   - Verificar validações de DTO
   - Verificar logs no banco

6. **Integração WebSocket** (depois)
   - Evento `distribuicao:novo-ticket`
   - Notificação `ticket:atribuido`

7. **Frontend** (depois)
   - ConfiguracaoDistribuicaoPage
   - DashboardDistribuicaoPage
   - GestaoSkillsPage

---

## 💡 Dicas Importantes

### 1. Verificar Disponibilidade
```typescript
// Considerar atendente online se:
// - user.status_atendente === 'online' OU 'disponivel'
// - user.ativo === true
// - Não atingiu capacidade máxima
```

### 2. Tratamento de Overflow
```typescript
// Se nenhum atendente disponível:
// 1. Verificar se config.permitirOverflow === true
// 2. Se sim: distribuir para config.filaBackupId (se existir)
// 3. Se não: throw NotFoundException('Nenhum atendente disponível')
```

### 3. Logs Detalhados
```typescript
// Sempre registrar:
// - Algoritmo usado
// - Motivo DETALHADO (ex: "Selecionado por menor carga (3 tickets)")
// - Carga do atendente no momento
// - Se foi realocação: motivo da realocação
```

### 4. Performance
```typescript
// Usar queries otimizadas:
// - createQueryBuilder() para contagens complexas
// - Evitar N+1 queries (usar relations/joins)
// - Criar índices em foreign keys (já criados pela migration)
```

---

## 🚨 Possíveis Erros e Soluções

### Erro: "Cannot find repository"
**Solução**: Verificar se entity está registrada em `atendimento.module.ts`:
```typescript
TypeOrmModule.forFeature([
  DistribuicaoConfig,
  AtendenteSkill,
  DistribuicaoLog,
  // ... outras entities
])
```

### Erro: "Circular dependency"
**Solução**: Se DistribuicaoService precisar de FilaService, usar `forwardRef()`:
```typescript
@Inject(forwardRef(() => FilaService))
private readonly filaService: FilaService
```

### Erro: "No atendente disponível"
**Solução**: Verificar dados de teste:
- Há atendentes com `ativo=true`?
- Há atendentes com `status_atendente='online'`?
- Há relação em `filas_atendentes` para a fila?

---

**Boa sorte com a implementação! 🚀**

Consulte os arquivos de documentação para mais detalhes.
