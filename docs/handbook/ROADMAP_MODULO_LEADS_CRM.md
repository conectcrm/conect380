# 🎯 ROADMAP - Módulo de Leads CRM

## Status do documento

Documento historico de planejamento inicial.

Nao usar este arquivo como unica fonte de verdade para o estado atual do modulo de Leads.

Motivo:

1. este roadmap foi escrito quando Leads ainda era tratado como gap funcional;
2. o backend atual ja possui evidencias de implementacao e validacao que superam este retrato inicial.

Referencias mais confiaveis para o estado atual:

1. `backend/docs/AUDITORIA_ENTITIES_MULTI_TENANCY.md`
2. `backend/docs/TESTE_E2E_MULTI_TENANCY_RESULTADOS.md`
3. `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
4. `docs/features/CRM-LEADS-001_CONTRATO_FUNCIONAL_MODULO_LEADS_2026-03.md`

Uso recomendado deste arquivo:

1. contexto historico de intencao de produto;
2. comparacao entre plano inicial e estado atual;
3. contexto complementar ao contrato vigente de Leads publicado em `docs/features/CRM-LEADS-001_CONTRATO_FUNCIONAL_MODULO_LEADS_2026-03.md`.

**Data de Criação**: 12 de novembro de 2025  
**Objetivo**: Implementar módulo completo de Leads para fechar o ciclo do funil de vendas  
**Prioridade**: 🔴 **CRÍTICA**  
**Tempo Estimado**: 3-5 dias (24-40 horas)  
**Status Atual**: CRM 70/100 → **Meta: 85/100**

---

## 📊 CONTEXTO E JUSTIFICATIVA

### Situação Atual
- ✅ Clientes: 100% funcional
- ✅ Contatos: 100% funcional  
- ✅ Pipeline/Oportunidades: 90% funcional
- ❌ **Leads: 0% - GAP CRÍTICO**

### Por Que Leads é Crítico?
1. **Entrada do Funil**: Sem leads, não há início do ciclo de vendas
2. **Captura**: Formulários web, importação, API precisam de destino
3. **Qualificação**: Separar prospects quentes de frios
4. **Conversão**: Lead → Oportunidade → Cliente (funil completo)
5. **Competitividade**: Todos os CRMs do mercado têm gestão de leads

### Impacto Comercial
- **Pipedrive, HubSpot, RD Station**: Todos têm leads como feature core
- **Sem leads**: Cliente questiona "onde capturo prospects?"
- **Com leads**: Funil completo = argumento de venda forte

---

## 🎯 OBJETIVOS SMART

### Objetivo Geral
Implementar módulo completo de Leads com captura, qualificação e conversão para Oportunidades.

### Objetivos Específicos
1. ✅ Backend completo (Entity, DTO, Service, Controller)
2. ✅ Frontend com CRUD intuitivo
3. ✅ Formulário público de captura
4. ✅ Conversão Lead → Oportunidade (1 clique)
5. ✅ Import CSV em massa
6. ✅ Dashboard com KPIs de leads
7. ✅ Integração com Pipeline existente

### Métricas de Sucesso
- [ ] CRUD de leads funcionando (criar, listar, editar, deletar)
- [ ] Formulário público capturando leads (testado)
- [ ] Conversão Lead → Oportunidade em <3 cliques
- [ ] Import de 100+ leads via CSV (testado)
- [ ] Dashboard mostrando taxa de conversão
- [ ] Zero erros no console (frontend e backend)

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

### Estrutura de Dados (Entity)

```typescript
// lead.entity.ts
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Dados Básicos
  @Column()
  nome: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  empresa: string;

  // Qualificação
  @Column({
    type: 'enum',
    enum: ['novo', 'contatado', 'qualificado', 'desqualificado', 'convertido'],
    default: 'novo'
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  score: number; // 0-100 (qualificação automática)

  @Column({ nullable: true })
  origem: string; // 'formulario', 'importacao', 'api', 'whatsapp', 'manual'

  // Contexto
  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ type: 'jsonb', nullable: true })
  campos_customizados: any;

  // Relacionamentos
  @Column({ nullable: true })
  responsavel_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: User;

  @Column()
  empresa_id: string; // Multi-tenant

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  // Conversão
  @Column({ nullable: true })
  oportunidade_id: string;

  @ManyToOne(() => Oportunidade)
  @JoinColumn({ name: 'oportunidade_id' })
  oportunidade: Oportunidade;

  @Column({ type: 'timestamp', nullable: true })
  convertido_em: Date;

  // Auditoria
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### Fluxo de Dados

```
1. CAPTURA
   ├─ Formulário Público → POST /api/leads/capture (sem auth)
   ├─ Import CSV → POST /api/leads/import
   ├─ API Externa → POST /api/leads (com API key)
   └─ Manual → POST /api/leads (interface)

2. QUALIFICAÇÃO
   ├─ Status manual (usuário altera)
   ├─ Score automático (algoritmo simples)
   └─ Atribuição para responsável

3. CONVERSÃO
   ├─ Lead qualificado → Botão "Converter"
   ├─ Cria Oportunidade automaticamente
   ├─ Marca lead como 'convertido'
   └─ Redireciona para Pipeline
```

---

## 📅 PLANO DE EXECUÇÃO DETALHADO

### 🔴 DIA 1 - Backend Core (6-8 horas)

#### Tarefa 1.1: Setup do Módulo (1h)
```bash
cd backend/src/modules
mkdir leads
cd leads
```

**Arquivos a criar**:
- `leads.module.ts`
- `lead.entity.ts`
- `dto/create-lead.dto.ts`
- `dto/update-lead.dto.ts`
- `dto/convert-lead.dto.ts`
- `leads.service.ts`
- `leads.controller.ts`

**Checklist**:
- [ ] Estrutura de pastas criada
- [ ] Module registrado no `app.module.ts`
- [ ] Entity configurada no TypeORM
- [ ] DTOs com validações (class-validator)

#### Tarefa 1.2: Service - CRUD Básico (2h)
```typescript
// leads.service.ts - Métodos principais
@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(Oportunidade)
    private oportunidadesRepository: Repository<Oportunidade>,
  ) {}

  async create(dto: CreateLeadDto, user: User): Promise<Lead> {
    // Validação + criação
    // Score automático baseado em campos preenchidos
    // Atribuição automática se não informado
  }

  async findAll(user: User, filters?: any): Promise<Lead[]> {
    // Filtros: status, origem, responsavel_id, periodo
    // Ordenação padrão: created_at DESC
    // Isolamento multi-tenant (empresa_id)
  }

  async findOne(id: string, user: User): Promise<Lead> {
    // Verificar empresa_id (multi-tenant)
  }

  async update(id: string, dto: UpdateLeadDto, user: User): Promise<Lead> {
    // Validação de ownership
    // Atualização de score se campos mudaram
  }

  async remove(id: string, user: User): Promise<void> {
    // Soft delete ou hard delete?
  }

  async calcularScore(lead: Lead): Promise<number> {
    // Algoritmo simples:
    // +20 se tem email
    // +20 se tem telefone
    // +20 se tem empresa
    // +20 se tem observações
    // +20 se foi contatado
  }
}
```

**Checklist**:
- [ ] CRUD implementado (create, findAll, findOne, update, remove)
- [ ] Isolamento multi-tenant (empresa_id em todas queries)
- [ ] Score automático funcionando
- [ ] Testes unitários (opcional, mas recomendado)

#### Tarefa 1.3: Controller - Rotas HTTP (2h)
```typescript
// leads.controller.ts
@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: User) {
    return this.leadsService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() filters: any) {
    return this.leadsService.findAll(user, filters);
  }

  @Get('estatisticas')
  getEstatisticas(@CurrentUser() user: User) {
    return this.leadsService.getEstatisticas(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: User
  ) {
    return this.leadsService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.leadsService.remove(id, user);
  }

  @Post(':id/converter')
  converter(
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() user: User
  ) {
    return this.leadsService.converterParaOportunidade(id, dto, user);
  }
}
```

**Checklist**:
- [ ] Rotas CRUD completas
- [ ] Rota `/estatisticas` para dashboard
- [ ] Rota `/converter` para conversão Lead → Oportunidade
- [ ] Decorators JWT funcionando
- [ ] Validação de DTOs ativa

#### Tarefa 1.4: Migration (1h)
```typescript
// XXXXX-CreateLeadsTable.ts
export class CreateLeadsTable implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'leads',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'nome', type: 'varchar', length: '255' },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'telefone', type: 'varchar', length: '50', isNullable: true },
          { name: 'empresa', type: 'varchar', length: '255', isNullable: true },
          { name: 'status', type: 'varchar', default: "'novo'" },
          { name: 'score', type: 'int', default: 0 },
          { name: 'origem', type: 'varchar', isNullable: true },
          { name: 'observacoes', type: 'text', isNullable: true },
          { name: 'campos_customizados', type: 'jsonb', isNullable: true },
          { name: 'responsavel_id', type: 'uuid', isNullable: true },
          { name: 'empresa_id', type: 'uuid' },
          { name: 'oportunidade_id', type: 'uuid', isNullable: true },
          { name: 'convertido_em', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
    );

    // Índices para performance
    await queryRunner.createIndex('leads', new TableIndex({
      name: 'IDX_leads_empresa_id',
      columnNames: ['empresa_id'],
    }));

    await queryRunner.createIndex('leads', new TableIndex({
      name: 'IDX_leads_status',
      columnNames: ['status'],
    }));

    // RLS (Row Level Security) Multi-tenant
    await queryRunner.query(`
      ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY leads_isolation_policy ON leads
      USING (empresa_id = current_setting('app.current_tenant')::uuid);
    `);
  }
}
```

**Checklist**:
- [ ] Migration criada: `npm run migration:generate -- src/migrations/CreateLeadsTable`
- [ ] Migration executada: `npm run migration:run`
- [ ] Tabela `leads` criada no PostgreSQL
- [ ] RLS ativado (multi-tenant)
- [ ] Índices criados

#### Tarefa 1.5: Testes Backend (2h)
```bash
# Testar com Thunder Client / Postman / curl
POST http://localhost:3001/leads
GET http://localhost:3001/leads
GET http://localhost:3001/leads/estatisticas
PATCH http://localhost:3001/leads/:id
POST http://localhost:3001/leads/:id/converter
```

**Checklist**:
- [ ] POST cria lead com sucesso
- [ ] GET retorna lista (isolado por empresa_id)
- [ ] Score calculado automaticamente
- [ ] Conversão Lead → Oportunidade funciona
- [ ] Erros retornam status HTTP corretos

---

### 🟡 DIA 2 - Frontend CRUD (6-8 horas)

#### Tarefa 2.1: Service Layer (1h)
```typescript
// frontend-web/src/services/leadsService.ts
import { api } from './api';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  status: 'novo' | 'contatado' | 'qualificado' | 'desqualificado' | 'convertido';
  score: number;
  origem?: string;
  observacoes?: string;
  responsavel_id?: string;
  responsavel?: {
    id: string;
    nome: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDto {
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  observacoes?: string;
  responsavel_id?: string;
}

export interface LeadEstatisticas {
  total: number;
  novos: number;
  contatados: number;
  qualificados: number;
  convertidos: number;
  taxaConversao: number;
  scoreMedio: number;
}

export const leadsService = {
  async listar(filtros?: any): Promise<Lead[]> {
    const { data } = await api.get('/leads', { params: filtros });
    return data;
  },

  async buscarPorId(id: string): Promise<Lead> {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  async criar(dto: CreateLeadDto): Promise<Lead> {
    const { data } = await api.post('/leads', dto);
    return data;
  },

  async atualizar(id: string, dto: Partial<CreateLeadDto>): Promise<Lead> {
    const { data } = await api.patch(`/leads/${id}`, dto);
    return data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  async getEstatisticas(): Promise<LeadEstatisticas> {
    const { data } = await api.get('/leads/estatisticas');
    return data;
  },

  async converter(id: string, estagio?: string): Promise<any> {
    const { data } = await api.post(`/leads/${id}/converter`, { estagio });
    return data;
  },
};
```

**Checklist**:
- [ ] Service criado com todos os métodos
- [ ] Interfaces TypeScript definidas
- [ ] Axios configurado (api.ts já existe)

#### Tarefa 2.2: Página de Leads - Base (3h)
```bash
# Copiar template
cp frontend-web/src/pages/_TemplateWithKPIsPage.tsx frontend-web/src/pages/LeadsPage.tsx
```

**Estrutura da Página**:
```tsx
// LeadsPage.tsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Filter, TrendingUp, UserCheck, UserX, Target } from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import { leadsService, Lead, LeadEstatisticas } from '../services/leadsService';

const LeadsPage: React.FC = () => {
  // Estados
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estatisticas, setEstatisticas] = useState<LeadEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroBusca, setFiltroBusca] = useState('');

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, [filtroStatus]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadsData, statsData] = await Promise.all([
        leadsService.listar({ status: filtroStatus }),
        leadsService.getEstatisticas(),
      ]);

      setLeads(leadsData);
      setEstatisticas(statsData);
    } catch (err: unknown) {
      console.error('Erro ao carregar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCriar = async (dados: any) => {
    try {
      await leadsService.criar(dados);
      await carregarDados();
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    }
  };

  const handleConverter = async (lead: Lead) => {
    if (!confirm(`Converter "${lead.nome}" em Oportunidade?`)) return;

    try {
      await leadsService.converter(lead.id);
      await carregarDados();
      alert('Lead convertido com sucesso!');
    } catch (err) {
      console.error('Erro ao converter lead:', err);
    }
  };

  // Filtros locais
  const leadsFiltrados = useMemo(() => {
    return leads.filter(lead => {
      const buscaMatch = 
        lead.nome.toLowerCase().includes(filtroBusca.toLowerCase()) ||
        lead.email?.toLowerCase().includes(filtroBusca.toLowerCase()) ||
        lead.empresa?.toLowerCase().includes(filtroBusca.toLowerCase());
      
      return buscaMatch;
    });
  }, [leads, filtroBusca]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="CRM" nucleusPath="/nuclei/crm" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Users className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Gestão de Leads
                </h1>
                <p className="text-gray-600 mt-2">
                  Capture, qualifique e converta leads em oportunidades
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Novo Lead
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Total */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Total de Leads
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.total}
                    </p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Capturados no sistema
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <Users className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>

              {/* Card 2: Qualificados */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Qualificados
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.qualificados}
                    </p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Prontos para conversão
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-sm">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Card 3: Taxa de Conversão */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Taxa de Conversão
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.taxaConversao.toFixed(1)}%
                    </p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Lead → Oportunidade
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>

              {/* Card 4: Score Médio */}
              <div className="p-5 rounded-2xl border border-[#DEEFE7] shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#002333]/60">
                      Score Médio
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#002333]">
                      {estatisticas.scoreMedio}
                    </p>
                    <p className="mt-3 text-sm text-[#002333]/70">
                      Qualificação automática
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm">
                    <Target className="h-6 w-6 text-[#159A9C]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barra de Busca e Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou empresa..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />
              </div>

              {/* Filtro Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C]"
              >
                <option value="">Todos os status</option>
                <option value="novo">Novos</option>
                <option value="contatado">Contatados</option>
                <option value="qualificado">Qualificados</option>
                <option value="desqualificado">Desqualificados</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#159A9C]"></div>
              <p className="mt-2 text-gray-600">Carregando leads...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Lista de Leads */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leadsFiltrados.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow p-6"
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#002333] mb-1">
                        {lead.nome}
                      </h3>
                      {lead.empresa && (
                        <p className="text-sm text-gray-600">{lead.empresa}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.status === 'qualificado' ? 'bg-green-100 text-green-800' :
                      lead.status === 'contatado' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'convertido' ? 'bg-purple-100 text-purple-800' :
                      lead.status === 'desqualificado' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lead.status}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 mb-4">
                    {lead.email && (
                      <p className="text-sm text-gray-600">📧 {lead.email}</p>
                    )}
                    {lead.telefone && (
                      <p className="text-sm text-gray-600">📱 {lead.telefone}</p>
                    )}
                    {lead.origem && (
                      <p className="text-sm text-gray-500">Origem: {lead.origem}</p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Qualificação</span>
                      <span className="text-xs font-semibold text-[#159A9C]">
                        {lead.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#159A9C] h-2 rounded-full transition-all"
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setLeadSelecionado(lead);
                        setShowModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Editar
                    </button>
                    {lead.status === 'qualificado' && (
                      <button
                        onClick={() => handleConverter(lead)}
                        className="flex-1 px-3 py-2 text-sm bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
                      >
                        Converter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado Vazio */}
          {!loading && !error && leadsFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum lead encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece capturando leads para construir sua base de prospects
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Adicionar Primeiro Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal (implementar componente separado depois) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Conteúdo do modal */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#002333] mb-4">
                {leadSelecionado ? 'Editar Lead' : 'Novo Lead'}
              </h2>
              {/* Formulário aqui */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setLeadSelecionado(null);
                }}
                className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
```

**Checklist**:
- [ ] Página criada com estrutura completa
- [ ] KPI cards implementados (padrão Funil de Vendas)
- [ ] Lista de leads com cards responsivos
- [ ] Filtros funcionando (busca + status)
- [ ] Botão "Converter" aparecendo para leads qualificados
- [ ] Estados: loading, error, empty

#### Tarefa 2.3: Registrar Rota (10min)
```tsx
// frontend-web/src/App.tsx
import LeadsPage from './pages/LeadsPage';

// Na seção de rotas CRM:
<Route path="/leads" element={protegerRota(ModuloEnum.CRM, <LeadsPage />)} />
```

**Checklist**:
- [ ] Import adicionado
- [ ] Rota registrada
- [ ] Proteção de módulo ativa
- [ ] Navegação testada

#### Tarefa 2.4: Adicionar no Menu (10min)
```typescript
// frontend-web/src/config/menuConfig.ts
{
  id: 'crm',
  title: 'CRM',
  icon: Users,
  children: [
    { id: 'crm-dashboard', title: 'Dashboard', href: '/nuclei/crm' },
    { id: 'crm-leads', title: 'Leads', href: '/leads' }, // ← NOVO
    { id: 'crm-clientes', title: 'Clientes', href: '/clientes' },
    { id: 'crm-pipeline', title: 'Pipeline', href: '/pipeline' },
  ],
},
```

**Checklist**:
- [ ] Menu item adicionado
- [ ] Ordem correta (Leads antes de Clientes)
- [ ] Navegação funcionando

---

### 🟢 DIA 3 - Features Avançadas (6-8 horas)

#### Tarefa 3.1: Modal de Formulário (2h)
```tsx
// frontend-web/src/components/leads/LeadFormModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Lead } from '../../services/leadsService';

interface Props {
  lead?: Lead | null;
  onSave: (dados: any) => Promise<void>;
  onClose: () => void;
}

export const LeadFormModal: React.FC<Props> = ({ lead, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    observacoes: '',
    responsavel_id: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome,
        email: lead.email || '',
        telefone: lead.telefone || '',
        empresa: lead.empresa || '',
        observacoes: lead.observacoes || '',
        responsavel_id: lead.responsavel_id || '',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#002333]">
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="Ex: João Silva"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="joao@empresa.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="Ex: Empresa LTDA"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                placeholder="Notas sobre o lead..."
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors"
              >
                {lead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
```

**Checklist**:
- [ ] Modal criado como componente separado
- [ ] Formulário com validações
- [ ] Modo criar e editar
- [ ] Design consistente com sistema

#### Tarefa 3.2: Conversão Lead → Oportunidade (2h)

**Backend - Service Method**:
```typescript
// leads.service.ts
async converterParaOportunidade(
  leadId: string,
  dto: ConvertLeadDto,
  user: User,
): Promise<Oportunidade> {
  // 1. Buscar lead
  const lead = await this.findOne(leadId, user);
  
  if (lead.status === 'convertido') {
    throw new BadRequestException('Lead já foi convertido');
  }

  // 2. Criar oportunidade
  const oportunidade = this.oportunidadesRepository.create({
    titulo: `${lead.nome} - ${lead.empresa || 'Lead'}`,
    descricao: lead.observacoes || '',
    valor: dto.valor || 0,
    estagio: dto.estagio || EstagioOportunidade.LEADS,
    clienteNome: lead.nome,
    clienteEmail: lead.email,
    clienteTelefone: lead.telefone,
    clienteEmpresa: lead.empresa,
    responsavel_id: lead.responsavel_id || user.id,
    probabilidade: 20,
    empresa_id: user.empresa_id,
  });

  await this.oportunidadesRepository.save(oportunidade);

  // 3. Atualizar lead
  lead.status = 'convertido';
  lead.oportunidade_id = oportunidade.id;
  lead.convertido_em = new Date();
  await this.leadsRepository.save(lead);

  return oportunidade;
}
```

**Frontend - Fluxo**:
1. Botão "Converter" só aparece para status 'qualificado'
2. Confirmar conversão (modal ou confirm)
3. Chamar API: `POST /leads/:id/converter`
4. Redirecionar para `/pipeline` (opcional)
5. Mostrar toast de sucesso

**Checklist**:
- [ ] Service method implementado
- [ ] Frontend chamando API corretamente
- [ ] Lead marcado como 'convertido'
- [ ] Oportunidade criada no banco
- [ ] Redirecionamento funcionando

#### Tarefa 3.3: Import CSV (2h)

**Backend - Endpoint**:
```typescript
// leads.controller.ts
@Post('import')
@UseInterceptors(FileInterceptor('file'))
async importCsv(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
) {
  return this.leadsService.importFromCsv(file, user);
}

// leads.service.ts
async importFromCsv(file: Express.Multer.File, user: User): Promise<any> {
  // 1. Parse CSV (usar biblioteca como 'csv-parser')
  // 2. Validar colunas obrigatórias (nome)
  // 3. Inserir em batch
  // 4. Retornar relatório (importados, erros)
}
```

**Frontend - Upload**:
```tsx
<input
  type="file"
  accept=".csv"
  onChange={handleFileUpload}
/>
```

**Formato CSV**:
```csv
nome,email,telefone,empresa,observacoes
João Silva,joao@empresa.com,(11) 99999-9999,Empresa A,Lead vindo do site
Maria Santos,maria@empresa.com,(11) 88888-8888,Empresa B,Indicação
```

**Checklist**:
- [ ] Endpoint `/import` criado
- [ ] Frontend com input file
- [ ] Parse CSV funcionando
- [ ] Batch insert no banco
- [ ] Relatório de importação (X importados, Y erros)

#### Tarefa 3.4: Dashboard no Nucleus CRM (1h)
```tsx
// frontend-web/src/pages/nuclei/CrmNucleusPage.tsx
// Adicionar card de Leads

{
  id: 'leads',
  name: 'Leads',
  description: 'Capture e qualifique prospects para o funil de vendas',
  href: '/leads',
  icon: Users,
  notifications: estatisticas?.novos || 0, // Leads novos
  badge: 'Novo',
  badgeColor: 'green',
  status: 'active'
},
```

**Checklist**:
- [ ] Card de Leads adicionado ao Nucleus CRM
- [ ] Badge "Novo" configurado
- [ ] Notificações mostrando leads novos
- [ ] Ordem: Dashboard → Leads → Clientes → Pipeline

---

### ⚡ DIA 4 - Polimento e Testes (4-6 horas)

#### Tarefa 4.1: Formulário Público de Captura (2h)

**Rota Pública (sem autenticação)**:
```typescript
// leads.controller.ts
@Post('capture')
async capturePublic(@Body() dto: CaptureLeadDto) {
  return this.leadsService.captureFromPublic(dto);
}
```

**Página Pública**:
```tsx
// frontend-web/src/pages/public/CaptureLeadPage.tsx
// Formulário simples (nome, email, telefone, mensagem)
// Sem autenticação
// Pode ser incorporado via iframe
```

**URL**: `https://conectcrm.com.br/capture-lead` (pública)

**Checklist**:
- [ ] Endpoint público funcionando (sem JWT)
- [ ] Página pública criada
- [ ] Validação anti-spam (Recaptcha opcional)
- [ ] Lead criado com origem='formulario'
- [ ] Email de confirmação (opcional)

#### Tarefa 4.2: Testes End-to-End (2h)

**Cenários de Teste**:
1. ✅ Criar lead manualmente
2. ✅ Editar lead existente
3. ✅ Filtrar por status
4. ✅ Buscar por nome/email
5. ✅ Converter lead qualificado → oportunidade
6. ✅ Import CSV com 10+ leads
7. ✅ Formulário público capturando lead
8. ✅ Dashboard mostrando estatísticas corretas
9. ✅ Isolamento multi-tenant (2 empresas)
10. ✅ Responsividade mobile

**Checklist**:
- [ ] Todos os cenários testados
- [ ] Sem erros no console (frontend e backend)
- [ ] Performance aceitável (<2s para listar)
- [ ] UX fluida (transições, loading states)

#### Tarefa 4.3: Documentação (1h)

**Criar arquivo**:
```markdown
// docs/MODULO_LEADS_MANUAL.md
# Manual do Módulo de Leads

## O que são Leads?
Leads são prospects que demonstraram interesse...

## Como Capturar Leads
1. Manualmente (botão "Novo Lead")
2. Formulário público (https://...)
3. Import CSV em massa
4. Integração API

## Como Qualificar Leads
- Score automático (0-100)
- Status manual (novo → contatado → qualificado)
...

## Como Converter em Oportunidade
1. Selecionar lead com status 'qualificado'
2. Clicar em "Converter"
3. Oportunidade criada automaticamente no Pipeline
...
```

**Checklist**:
- [ ] Manual criado
- [ ] Screenshots adicionados (opcional)
- [ ] FAQ respondido
- [ ] Link no README principal

---

## ✅ CHECKLIST FINAL DE CONCLUSÃO

### Backend
- [ ] Entity `Lead` criada e registrada
- [ ] DTOs com validações (class-validator)
- [ ] Service com CRUD completo
- [ ] Controller com todas as rotas
- [ ] Migration executada com sucesso
- [ ] RLS (multi-tenant) ativo
- [ ] Endpoint de conversão funcionando
- [ ] Endpoint de import CSV funcionando
- [ ] Endpoint público de captura funcionando
- [ ] Testes manuais (Postman/Thunder) passando

### Frontend
- [ ] Service layer completo (`leadsService.ts`)
- [ ] Página de Leads (`/leads`) funcional
- [ ] KPI cards implementados
- [ ] Filtros (busca + status) funcionando
- [ ] Modal de formulário (criar/editar)
- [ ] Botão "Converter" funcionando
- [ ] Import CSV implementado
- [ ] Formulário público de captura
- [ ] Rota registrada no App.tsx
- [ ] Menu item adicionado no menuConfig
- [ ] Card no Nucleus CRM
- [ ] Responsividade mobile
- [ ] Estados: loading, error, empty, success
- [ ] Zero erros no console

### Integração
- [ ] Lead → Oportunidade funcionando
- [ ] Isolamento multi-tenant validado
- [ ] Performance aceitável (<2s)
- [ ] Testes end-to-end passando

### Documentação
- [ ] Manual do módulo criado
- [ ] README atualizado
- [ ] Comentários no código

---

## 📈 MÉTRICAS DE SUCESSO

Após conclusão, o sistema deve ter:

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Score CRM** | 70/100 | 85/100 | +21% |
| **Funcionalidades Core** | 24/35 | 30/35 | +86% |
| **Taxa de Completude** | 69% | 86% | +17pp |
| **Diferenciais** | 3 | 4 | +33% |
| **Argumentos de Venda** | 3 | 5 | +66% |

### Novos Argumentos de Venda
1. ✅ "Funil completo: Lead → Oportunidade → Cliente"
2. ✅ "Captura de leads automatizada (formulário público)"
3. ✅ "Import massivo via CSV (onboarding rápido)"
4. ✅ "Qualificação automática com score inteligente"
5. ✅ "Conversão 1-clique: Lead → Pipeline"

---

## 🚀 PRÓXIMOS PASSOS (Pós-Leads)

Após concluir módulo de Leads, priorizar:

### Sprint Seguinte (2-3 semanas)
1. **Relatórios Avançados** (3 dias)
   - Taxa de conversão por origem
   - Tempo médio no funil
   - Performance por vendedor
   
2. **Email Integrado** (5 dias)
   - Envio de emails do CRM
   - Templates personalizados
   - Histórico por cliente
   
3. **Automações Básicas** (5 dias)
   - Ações automáticas por estágio
   - Follow-up automático
   - Notificações programadas

### Roadmap Trimestral
- Campos customizáveis (Enterprise)
- App mobile nativo
- IA para scoring de leads
- Integrações marketplace (Zapier, etc.)

---

## 🎯 RESPONSABILIDADES

| Tarefa | Responsável | Tempo |
|--------|-------------|-------|
| Backend Core | Backend Dev | 6-8h |
| Frontend CRUD | Frontend Dev | 6-8h |
| Features Avançadas | Fullstack | 6-8h |
| Testes e Polimento | QA + Dev | 4-6h |
| **TOTAL** | **Time** | **24-40h** |

---

## 📞 CONTATOS E SUPORTE

**Dúvidas Técnicas**: Verificar documentação em `docs/`  
**Bugs**: Reportar no GitHub Issues  
**Sugestões**: Product team via Slack

---

**Última Atualização**: 12 de novembro de 2025  
**Versão**: 1.0  
**Status**: 🟢 **PRONTO PARA EXECUÇÃO**
