# 🏢 Proposta: Sistema de Departamentos Dinâmicos por Núcleo

## 📋 Contexto

Cada cliente que utiliza o ConectCRM terá **departamentos diferentes** dentro de cada núcleo de atendimento. Por exemplo:

### Cliente A - E-commerce
- **Núcleo Vendas**: Televendas, E-commerce, Atacado
- **Núcleo Suporte**: SAC, Pós-venda, Trocas e Devoluções

### Cliente B - Consultoria
- **Núcleo Vendas**: Inside Sales, Field Sales
- **Núcleo Suporte**: Implementação, Suporte Técnico, Treinamento

---

## 🎯 Solução Proposta: Estrutura Hierárquica

### **Modelo Recomendado**
```
EMPRESA
  └─ NÚCLEO (Vendas, Suporte, Financeiro)
      └─ DEPARTAMENTO (Configurável por cliente)
          └─ ATENDENTES
```

---

## 🗄️ Estrutura do Banco de Dados

### **1. Tabela Existente: `nucleos_atendimento`**
✅ Já implementado - Não precisa alteração estrutural

```typescript
// Campos principais:
- id: UUID
- empresaId: UUID
- nome: "Vendas", "Suporte", "Financeiro"
- ativo: boolean
- prioridade: number
- atendentesIds: string[] // Array de IDs
```

### **2. Nova Tabela: `departamentos`**
🆕 **CRIAR NOVA ENTIDADE**

```sql
CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nucleo_id UUID NOT NULL,
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  codigo VARCHAR(50),
  cor VARCHAR(7) DEFAULT '#6366F1',
  icone VARCHAR(50) DEFAULT 'briefcase',
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  
  -- Equipe
  atendentes_ids UUID[] DEFAULT '{}',
  supervisor_id UUID,
  
  -- Horário Específico (herda do núcleo se null)
  horario_funcionamento JSONB,
  
  -- SLA Específico (herda do núcleo se null)
  sla_resposta_minutos INTEGER,
  sla_resolucao_horas INTEGER,
  
  -- Mensagens Personalizadas
  mensagem_boas_vindas TEXT,
  mensagem_transferencia TEXT,
  
  -- Configurações de Roteamento
  tipo_distribuicao VARCHAR(30) DEFAULT 'round_robin',
  capacidade_maxima_tickets INTEGER DEFAULT 30,
  
  -- Skills/Competências (para roteamento inteligente)
  skills JSONB, -- ex: ["produto_x", "ingles", "nivel_avancado"]
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (nucleo_id) REFERENCES nucleos_atendimento(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_departamentos_empresa ON departamentos(empresa_id);
CREATE INDEX idx_departamentos_nucleo ON departamentos(nucleo_id);
CREATE INDEX idx_departamentos_ativo ON departamentos(ativo);
```

---

## 🏗️ Implementação Backend (NestJS)

### **1. Entidade: `departamento.entity.ts`**

```typescript
// backend/src/modules/triagem/entities/departamento.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../../empresas/entities/empresa.entity';
import { NucleoAtendimento } from './nucleo-atendimento.entity';
import { User } from '../../users/user.entity';

export interface HorarioFuncionamento {
  seg?: { inicio: string; fim: string };
  ter?: { inicio: string; fim: string };
  qua?: { inicio: string; fim: string };
  qui?: { inicio: string; fim: string };
  sex?: { inicio: string; fim: string };
  sab?: { inicio: string; fim: string };
  dom?: { inicio: string; fim: string };
}

export type TipoDistribuicao = 'round_robin' | 'load_balancing' | 'skill_based' | 'manual';

@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'nucleo_id', type: 'uuid' })
  nucleoId: string;

  @ManyToOne(() => NucleoAtendimento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nucleo_id' })
  nucleo: NucleoAtendimento;

  // Identificação
  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 7, default: '#6366F1' })
  cor: string;

  @Column({ type: 'varchar', length: 50, default: 'briefcase' })
  icone: string;

  // Status
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'integer', default: 0 })
  ordem: number;

  // Equipe
  @Column({ type: 'uuid', array: true, default: '{}', name: 'atendentes_ids' })
  atendentesIds: string[];

  @Column({ type: 'uuid', nullable: true, name: 'supervisor_id' })
  supervisorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: User;

  // Horário (opcional - herda do núcleo se null)
  @Column({ type: 'jsonb', nullable: true, name: 'horario_funcionamento' })
  horarioFuncionamento: HorarioFuncionamento;

  // SLA (opcional - herda do núcleo se null)
  @Column({ type: 'integer', nullable: true, name: 'sla_resposta_minutos' })
  slaRespostaMinutos: number;

  @Column({ type: 'integer', nullable: true, name: 'sla_resolucao_horas' })
  slaResolucaoHoras: number;

  // Mensagens Personalizadas
  @Column({ type: 'text', nullable: true, name: 'mensagem_boas_vindas' })
  mensagemBoasVindas: string;

  @Column({ type: 'text', nullable: true, name: 'mensagem_transferencia' })
  mensagemTransferencia: string;

  // Roteamento
  @Column({ type: 'varchar', length: 30, default: 'round_robin', name: 'tipo_distribuicao' })
  tipoDistribuicao: TipoDistribuicao;

  @Column({ type: 'integer', default: 30, name: 'capacidade_maxima_tickets' })
  capacidadeMaximaTickets: number;

  // Skills para roteamento inteligente
  @Column({ type: 'jsonb', nullable: true })
  skills: string[];

  // Auditoria
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy: string;
}
```

### **2. DTOs**

```typescript
// backend/src/modules/triagem/dto/departamento.dto.ts

import { IsString, IsUUID, IsBoolean, IsOptional, IsInt, IsArray, IsEnum } from 'class-validator';

export class CreateDepartamentoDto {
  @IsUUID()
  nucleoId: string;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  icone?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  ordem?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  atendentesIds?: string[];

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  horarioFuncionamento?: any;

  @IsOptional()
  @IsInt()
  slaRespostaMinutos?: number;

  @IsOptional()
  @IsInt()
  slaResolucaoHoras?: number;

  @IsOptional()
  @IsString()
  mensagemBoasVindas?: string;

  @IsOptional()
  @IsString()
  mensagemTransferencia?: string;

  @IsOptional()
  @IsEnum(['round_robin', 'load_balancing', 'skill_based', 'manual'])
  tipoDistribuicao?: string;

  @IsOptional()
  @IsInt()
  capacidadeMaximaTickets?: number;

  @IsOptional()
  @IsArray()
  skills?: string[];
}

export class UpdateDepartamentoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  ordem?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  atendentesIds?: string[];

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  horarioFuncionamento?: any;

  @IsOptional()
  @IsInt()
  slaRespostaMinutos?: number;

  @IsOptional()
  @IsInt()
  slaResolucaoHoras?: number;

  @IsOptional()
  @IsString()
  mensagemBoasVindas?: string;

  @IsOptional()
  @IsString()
  mensagemTransferencia?: string;
}

export class FilterDepartamentoDto {
  @IsOptional()
  @IsUUID()
  nucleoId?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  nome?: string;
}
```

### **3. Service**

```typescript
// backend/src/modules/triagem/services/departamento.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from '../entities/departamento.entity';
import { CreateDepartamentoDto, UpdateDepartamentoDto, FilterDepartamentoDto } from '../dto/departamento.dto';

@Injectable()
export class DepartamentoService {
  private readonly logger = new Logger(DepartamentoService.name);

  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
  ) {}

  async create(empresaId: string, createDto: CreateDepartamentoDto): Promise<Departamento> {
    this.logger.log(`Criando departamento "${createDto.nome}" para empresa ${empresaId}`);

    const departamento = this.departamentoRepository.create({
      ...createDto,
      empresaId,
    });

    return this.departamentoRepository.save(departamento);
  }

  async findAll(empresaId: string, filters?: FilterDepartamentoDto): Promise<Departamento[]> {
    const query = this.departamentoRepository
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.nucleo', 'nucleo')
      .where('dept.empresaId = :empresaId', { empresaId })
      .orderBy('dept.ordem', 'ASC')
      .addOrderBy('dept.nome', 'ASC');

    if (filters?.nucleoId) {
      query.andWhere('dept.nucleoId = :nucleoId', { nucleoId: filters.nucleoId });
    }

    if (filters?.ativo !== undefined) {
      query.andWhere('dept.ativo = :ativo', { ativo: filters.ativo });
    }

    if (filters?.nome) {
      query.andWhere('dept.nome ILIKE :nome', { nome: `%${filters.nome}%` });
    }

    return query.getMany();
  }

  async findByNucleo(empresaId: string, nucleoId: string): Promise<Departamento[]> {
    return this.departamentoRepository.find({
      where: {
        empresaId,
        nucleoId,
        ativo: true,
      },
      order: {
        ordem: 'ASC',
        nome: 'ASC',
      },
    });
  }

  async findOne(empresaId: string, id: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findOne({
      where: { id, empresaId },
      relations: ['nucleo'],
    });

    if (!departamento) {
      throw new NotFoundException(`Departamento com ID ${id} não encontrado`);
    }

    return departamento;
  }

  async update(empresaId: string, id: string, updateDto: UpdateDepartamentoDto): Promise<Departamento> {
    const departamento = await this.findOne(empresaId, id);

    Object.assign(departamento, updateDto);

    return this.departamentoRepository.save(departamento);
  }

  async remove(empresaId: string, id: string): Promise<void> {
    const departamento = await this.findOne(empresaId, id);
    await this.departamentoRepository.remove(departamento);
  }
}
```

### **4. Controller**

```typescript
// backend/src/modules/triagem/controllers/departamento.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { DepartamentoService } from '../services/departamento.service';
import { CreateDepartamentoDto, UpdateDepartamentoDto, FilterDepartamentoDto } from '../dto/departamento.dto';

@Controller('departamentos')
@UseGuards(JwtAuthGuard)
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createDto: CreateDepartamentoDto) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.create(empresaId, createDto);
  }

  @Get()
  async findAll(@Request() req, @Query() filters: FilterDepartamentoDto) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findAll(empresaId, filters);
  }

  @Get('nucleo/:nucleoId')
  async findByNucleo(@Request() req, @Param('nucleoId') nucleoId: string) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findByNucleo(empresaId, nucleoId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.findOne(empresaId, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateDepartamentoDto) {
    const empresaId = req.user.empresa_id;
    return this.departamentoService.update(empresaId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id') id: string) {
    const empresaId = req.user.empresa_id;
    await this.departamentoService.remove(empresaId, id);
  }
}
```

---

## 🎨 Interface Frontend (React)

### **Tela de Gestão de Departamentos**

```tsx
// frontend-web/src/pages/configuracoes/DepartamentosPage.tsx

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, Clock } from 'lucide-react';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';

const DepartamentosPage: React.FC = () => {
  const [nucleoSelecionado, setNucleoSelecionado] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50">
      <BackToNucleus />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departamentos</h1>
            <p className="text-gray-600 mt-2">
              Configure departamentos personalizados dentro de cada núcleo
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="w-5 h-5" />
            Novo Departamento
          </button>
        </div>

        {/* Seletor de Núcleo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o Núcleo
          </label>
          <select 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={nucleoSelecionado}
            onChange={(e) => setNucleoSelecionado(e.target.value)}
          >
            <option value="">Todos os núcleos</option>
            <option value="vendas">Vendas</option>
            <option value="suporte">Suporte</option>
            <option value="financeiro">Financeiro</option>
          </select>
        </div>

        {/* Lista de Departamentos */}
        <div className="grid gap-6">
          {/* Exemplo de card de departamento */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Televendas</h3>
                  <p className="text-sm text-gray-600">Núcleo: Vendas</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      5 atendentes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Seg-Sex 8h-18h
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartamentosPage;
```

---

## 🔄 Fluxo de Roteamento com Departamentos

### **No WhatsApp/Chat:**

```
Cliente: "Olá"
Bot: "Bem-vindo! Qual núcleo você precisa?"
  1️⃣ Vendas
  2️⃣ Suporte
  3️⃣ Financeiro

Cliente: "1"
Bot: "Ótimo! Qual departamento de Vendas?"
  1️⃣ Televendas
  2️⃣ E-commerce
  3️⃣ Atacado

Cliente: "2"
Bot: "Direcionando para E-commerce... ⏳"
[Atendente do departamento E-commerce assume]
```

---

## ✅ Benefícios da Solução

### **1. Flexibilidade Total**
- Cada cliente cria seus próprios departamentos
- Personalização por núcleo
- Fácil adaptação a diferentes modelos de negócio

### **2. Escalabilidade**
- Adicionar/remover departamentos sem alterar código
- Suporta crescimento da operação do cliente

### **3. Roteamento Inteligente**
- Distribuição por skills/competências
- Balanceamento de carga por departamento
- SLA específico por departamento

### **4. Multi-tenant**
- Isolamento completo entre empresas
- Configurações independentes

### **5. Auditoria Completa**
- Rastreamento de criação/alterações
- Histórico de roteamentos

---

## 📦 Checklist de Implementação

### **Backend**
- [ ] Criar migration da tabela `departamentos`
- [ ] Criar entidade `Departamento`
- [ ] Criar DTOs (Create, Update, Filter)
- [ ] Criar `DepartamentoService`
- [ ] Criar `DepartamentoController`
- [ ] Adicionar ao `TriagemModule`
- [ ] Criar seeds com departamentos padrão

### **Frontend**
- [ ] Criar `DepartamentosPage`
- [ ] Criar `departamentoService.ts`
- [ ] Criar componente `ModalDepartamento`
- [ ] Criar componente `CardDepartamento`
- [ ] Adicionar rota `/configuracoes/departamentos`
- [ ] Integrar com API de departamentos

### **Integração Triagem/Chat**
- [ ] Atualizar lógica de roteamento
- [ ] Adicionar seleção de departamento no fluxo
- [ ] Atualizar mensagens automáticas
- [ ] Adicionar filtro por departamento

---

## 🚀 Próximos Passos

1. **Aprovar a estrutura proposta**
2. **Criar migration do banco de dados**
3. **Implementar backend (entidade, service, controller)**
4. **Implementar frontend (página de gestão)**
5. **Integrar com sistema de triagem**
6. **Criar seeds de departamentos padrão**
7. **Testar fluxo completo**
8. **Documentar uso para clientes**

---

## 💡 Sugestões Adicionais

### **Departamentos Padrão por Segmento**

Você pode oferecer **templates prontos** baseados no segmento do cliente:

**E-commerce:**
- Vendas: Televendas, E-commerce, Marketplace
- Suporte: SAC, Trocas e Devoluções, Pós-venda

**SaaS/Software:**
- Vendas: Inside Sales, Enterprise
- Suporte: Implementação, Suporte Técnico, Sucesso do Cliente

**Serviços:**
- Vendas: Novos Clientes, Renovações
- Suporte: Atendimento, Emergência, Agendamentos

---

## 🎓 Documentação Complementar

- [Estrutura de Núcleos](./ESTRUTURA_NUCLEOS.md)
- [Sistema de Triagem](./SISTEMA_TRIAGEM.md)
- [Roteamento Inteligente](./ROTEAMENTO_INTELIGENTE.md)

---

**Status:** 📝 Proposta - Aguardando Aprovação  
**Data:** 17/10/2025  
**Autor:** GitHub Copilot
