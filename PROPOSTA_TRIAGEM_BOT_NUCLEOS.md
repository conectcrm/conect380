# 🤖 PROPOSTA: Sistema de Triagem por Bot + Núcleo de Atendimento

**Data:** 16 de outubro de 2025  
**Objetivo:** Implementar triagem automatizada via bot (não-IA) e gestão de núcleos de atendimento  
**Complexidade:** Alta  
**Tempo Estimado:** 3-5 dias  
**Prioridade:** Alta

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Módulos a Desenvolver](#módulos-a-desenvolver)
4. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
5. [Fluxos de Triagem](#fluxos-de-triagem)
6. [Interface de Administração](#interface-de-administração)
7. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🎯 VISÃO GERAL

### O que é?
Sistema de **triagem automatizada** onde bots (baseados em regras, não IA) conduzem o cliente através de menus e opções para direcioná-lo ao **núcleo de atendimento correto**.

### Exemplo de Fluxo:
```
Cliente: "Oi"
Bot: "Olá! Bem-vindo ao ConectCRM. Como posso ajudar?
      1️⃣ Suporte Técnico
      2️⃣ Financeiro
      3️⃣ Comercial/Vendas
      4️⃣ Cancelamento"

Cliente: "1"
Bot: "Você escolheu Suporte Técnico. Qual problema?
      1️⃣ Sistema fora do ar
      2️⃣ Erro ao acessar
      3️⃣ Problema com relatórios
      4️⃣ Outro"

Cliente: "2"
Bot: "Entendido! Transferindo para nossa equipe de Suporte Técnico - Acesso..."
[TICKET CRIADO E ATRIBUÍDO AO NÚCLEO CORRETO]
```

---

## 🏗️ ARQUITETURA PROPOSTA

### Stack Técnico:
```
Backend:
├── NestJS (já existente)
├── TypeORM (já existente)
├── WebSocket (já implementado)
└── PostgreSQL

Frontend:
├── React + TypeScript
├── TailwindCSS
└── React Query

Integração:
└── WhatsApp Business API (já integrado)
```

### Estrutura de Módulos:
```
backend/src/modules/
├── triagem/                    [NOVO]
│   ├── entities/
│   │   ├── nucleo-atendimento.entity.ts
│   │   ├── fluxo-triagem.entity.ts
│   │   ├── etapa-triagem.entity.ts
│   │   └── resposta-triagem.entity.ts
│   ├── services/
│   │   ├── nucleo.service.ts
│   │   ├── triagem-bot.service.ts
│   │   └── roteamento.service.ts
│   ├── dto/
│   └── triagem.module.ts
│
└── atendimento/               [JÁ EXISTE - ESTENDER]
    └── adicionar integração com triagem

frontend-web/src/
├── pages/
│   └── nucleos/               [NOVO]
│       ├── GestaoNucleosPage.tsx
│       ├── EditorFluxoTriagemPage.tsx
│       └── MonitorTriagemPage.tsx
├── components/
│   └── triagem/               [NOVO]
│       ├── EditorFluxo.tsx
│       ├── VisualizadorArvore.tsx
│       └── ConfiguracaoNucleo.tsx
└── services/
    └── triagemService.ts      [NOVO]
```

---

## 📊 ESTRUTURA DE BANCO DE DADOS

### 1. Tabela: `nucleos_atendimento`
```sql
CREATE TABLE nucleos_atendimento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) DEFAULT '#3B82F6', -- hex color
  icone VARCHAR(50), -- lucide icon name
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0, -- ordem de exibição
  horario_funcionamento JSONB, -- { seg: {inicio: '08:00', fim: '18:00'}, ... }
  
  -- SLA e Métricas
  sla_resposta_minutos INTEGER DEFAULT 60,
  sla_resolucao_horas INTEGER DEFAULT 24,
  
  -- Equipe
  atendentes_ids UUID[], -- array de IDs de usuários
  supervisor_id UUID REFERENCES usuarios(id),
  
  -- Mensagens Automáticas
  mensagem_boas_vindas TEXT,
  mensagem_fora_horario TEXT,
  mensagem_transferencia TEXT,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id),
  
  CONSTRAINT unique_nucleo_empresa UNIQUE(empresa_id, nome)
);

CREATE INDEX idx_nucleo_empresa ON nucleos_atendimento(empresa_id);
CREATE INDEX idx_nucleo_ativo ON nucleos_atendimento(ativo);
```

### 2. Tabela: `fluxos_triagem`
```sql
CREATE TABLE fluxos_triagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Identificação
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'menu_opcoes', -- menu_opcoes, arvore_decisao, keyword_match
  
  -- Configurações
  ativo BOOLEAN DEFAULT true,
  versao INTEGER DEFAULT 1,
  
  -- Triggers/Condições de Ativação
  canais VARCHAR[] DEFAULT ARRAY['whatsapp'], -- whatsapp, telegram, email
  horario_ativo JSONB, -- quando o fluxo está ativo
  
  -- Estrutura do Fluxo (JSON Tree)
  estrutura JSONB NOT NULL,
  /*
  Exemplo estrutura:
  {
    "etapaInicial": "boas_vindas",
    "etapas": {
      "boas_vindas": {
        "tipo": "mensagem_menu",
        "mensagem": "Olá! Como posso ajudar?",
        "opcoes": [
          { "numero": 1, "texto": "Suporte", "proximaEtapa": "menu_suporte" },
          { "numero": 2, "texto": "Financeiro", "proximaEtapa": "menu_financeiro" }
        ],
        "timeout": 300,
        "acaoTimeout": "transferir_humano"
      },
      "menu_suporte": {
        "tipo": "mensagem_menu",
        "mensagem": "Qual tipo de suporte?",
        "opcoes": [
          { "numero": 1, "texto": "Sistema fora", "acao": "criar_ticket", "nucleoId": "uuid-suporte-tecnico" }
        ]
      }
    }
  }
  */
  
  -- Estatísticas
  total_execucoes INTEGER DEFAULT 0,
  taxa_conclusao DECIMAL(5,2) DEFAULT 0.00,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id),
  
  CONSTRAINT unique_fluxo_empresa UNIQUE(empresa_id, nome, versao)
);

CREATE INDEX idx_fluxo_empresa ON fluxos_triagem(empresa_id);
CREATE INDEX idx_fluxo_ativo ON fluxos_triagem(ativo);
```

### 3. Tabela: `sessoes_triagem`
```sql
CREATE TABLE sessoes_triagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  fluxo_id UUID NOT NULL REFERENCES fluxos_triagem(id),
  
  -- Identificação do Usuário
  contato_telefone VARCHAR(20) NOT NULL,
  contato_nome VARCHAR(100),
  ticket_id UUID REFERENCES tickets(id),
  
  -- Estado da Sessão
  etapa_atual VARCHAR(100),
  contexto JSONB DEFAULT '{}', -- variáveis coletadas durante o fluxo
  historico JSONB DEFAULT '[]', -- array de { etapa, resposta, timestamp }
  
  -- Status
  status VARCHAR(50) DEFAULT 'em_andamento', -- em_andamento, concluido, abandonado, transferido
  nucleo_destino_id UUID REFERENCES nucleos_atendimento(id),
  
  -- Métricas
  iniciado_em TIMESTAMP DEFAULT NOW(),
  concluido_em TIMESTAMP,
  tempo_total_segundos INTEGER,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessao_contato ON sessoes_triagem(contato_telefone);
CREATE INDEX idx_sessao_status ON sessoes_triagem(status);
CREATE INDEX idx_sessao_fluxo ON sessoes_triagem(fluxo_id);
```

### 4. Tabela: `templates_mensagem_triagem`
```sql
CREATE TABLE templates_mensagem_triagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  
  -- Identificação
  codigo VARCHAR(50) NOT NULL, -- ex: BOAS_VINDAS, MENU_PRINCIPAL
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(50), -- boas_vindas, menu, confirmacao, erro, despedida
  
  -- Conteúdo
  mensagem TEXT NOT NULL,
  variaveis VARCHAR[] DEFAULT '{}', -- ['{nome}', '{empresa}', '{horario}']
  
  -- Mídia (opcional)
  tipo_midia VARCHAR(20), -- imagem, video, documento
  url_midia TEXT,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Auditoria
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_template_codigo UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_template_empresa ON templates_mensagem_triagem(empresa_id);
CREATE INDEX idx_template_categoria ON templates_mensagem_triagem(categoria);
```

---

## 🔄 FLUXOS DE TRIAGEM

### Fluxo 1: Menu Simples (1 nível)
```
┌─────────────────────────────────┐
│ Mensagem Inicial                │
│ "Olá! Como posso ajudar?"       │
│ 1️⃣ Suporte Técnico              │
│ 2️⃣ Financeiro                   │
│ 3️⃣ Comercial                    │
│ 4️⃣ Falar com atendente          │
└────────────┬────────────────────┘
             │
             ├─[1]─→ Criar Ticket → Núcleo Suporte
             ├─[2]─→ Criar Ticket → Núcleo Financeiro
             ├─[3]─→ Criar Ticket → Núcleo Comercial
             └─[4]─→ Transferir para Atendente Disponível
```

### Fluxo 2: Árvore de Decisão (múltiplos níveis)
```
┌────────────────────────────────┐
│ Nível 1: Departamento          │
│ 1️⃣ Suporte  2️⃣ Financeiro      │
└────────┬───────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│Suporte│ │Financeiro │
└───┬───┘ └─────┬─────┘
    │           │
    │           ├─[1]─→ Boleto
    │           ├─[2]─→ Cancelamento
    │           └─[3]─→ Negociação
    │
    ├─[1]─→ Sistema Fora
    ├─[2]─→ Erro de Login
    └─[3]─→ Bug/Problema
            │
            ▼
    ┌──────────────────┐
    │ Nível 3: Urgência│
    │ 1️⃣ Urgente       │
    │ 2️⃣ Normal        │
    └────────┬─────────┘
             │
             ├─[1]─→ Ticket Prioridade ALTA
             └─[2]─→ Ticket Prioridade MÉDIA
```

### Fluxo 3: Coleta de Informações
```
1. Boas-vindas
   ↓
2. "Qual seu nome?"
   [salvar em contexto.nome]
   ↓
3. "Qual seu CPF/CNPJ?" (validação)
   [salvar em contexto.documento]
   ↓
4. "Qual o problema?"
   [salvar em contexto.descricao]
   ↓
5. "Confirma os dados? 1️⃣Sim 2️⃣Não"
   ↓
6. [Criar Ticket com contexto completo]
   ↓
7. "Ticket #12345 criado! Aguarde atendimento."
```

---

## 🎨 INTERFACE DE ADMINISTRAÇÃO

### Página 1: Gestão de Núcleos
```
┌─────────────────────────────────────────────────────┐
│ 🏢 Núcleos de Atendimento                           │
├─────────────────────────────────────────────────────┤
│ [+ Novo Núcleo]  [🔍 Buscar]  [Filtros ▼]          │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 🛠️ Suporte Técnico              [Ativo ✓]│       │
│ │ 5 atendentes | SLA: 1h                   │       │
│ │ 23 tickets abertos | 89% dentro do SLA   │       │
│ │ [Editar] [Relatório] [Configurar]        │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 💰 Financeiro                   [Ativo ✓]│       │
│ │ 3 atendentes | SLA: 2h                   │       │
│ │ 12 tickets abertos | 95% dentro do SLA   │       │
│ │ [Editar] [Relatório] [Configurar]        │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 🎯 Comercial/Vendas            [Ativo ✓]│       │
│ │ 8 atendentes | SLA: 30min                │       │
│ │ 34 tickets abertos | 92% dentro do SLA   │       │
│ │ [Editar] [Relatório] [Configurar]        │       │
│ └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Página 2: Editor de Fluxo de Triagem (Visual)
```
┌─────────────────────────────────────────────────────┐
│ 🤖 Editor de Fluxo: "Triagem Principal"             │
├─────────────────────────────────────────────────────┤
│ [💾 Salvar] [▶️ Testar] [📋 Duplicar] [🗑️ Excluir] │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│ COMPONENTES  │  ÁREA DE DESIGN (Drag & Drop)        │
│              │                                       │
│ 📝 Mensagem  │   ┌───────────────────┐              │
│ 📋 Menu      │   │  [INÍCIO]         │              │
│ ❓ Pergunta  │   │  Boas-vindas      │              │
│ ✅ Validação │   └────────┬──────────┘              │
│ 🎯 Ação      │            │                         │
│ 🔀 Condição  │   ┌────────▼──────────┐              │
│              │   │  [MENU]           │              │
│              │   │  Departamento?    │              │
│              │   │  1. Suporte       │───┐          │
│              │   │  2. Financeiro    │───┼──┐       │
│              │   │  3. Comercial     │───┼──┼──┐    │
│              │   └───────────────────┘   │  │  │    │
│              │                            ▼  ▼  ▼    │
│              │                         [...]        │
└──────────────┴──────────────────────────────────────┘
```

### Página 3: Monitor de Triagem (Real-time)
```
┌─────────────────────────────────────────────────────┐
│ 📊 Monitor de Triagem - Tempo Real                  │
├─────────────────────────────────────────────────────┤
│ Hoje: 145 triagens | 89% concluídas | Tempo médio: 1m23s │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🟢 EM ANDAMENTO (8)                                 │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 📱 +55 11 99999-1234                      │       │
│ │ Etapa: menu_suporte (2/5)                │       │
│ │ Iniciado: há 30s | Fluxo: Triagem Padrão │       │
│ │ [Ver Detalhes] [Assumir Conversa]        │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ ✅ CONCLUÍDOS HOJE (137)                            │
│ [Ver Todos]                                         │
│                                                      │
│ ❌ ABANDONADOS (12)                                 │
│ [Investigar]                                        │
└─────────────────────────────────────────────────────┘
```

---

## 💻 CÓDIGO PROPOSTO

### Backend: `triagem-bot.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import { FluxoTriagem } from '../entities/fluxo-triagem.entity';

@Injectable()
export class TriagemBotService {
  private readonly logger = new Logger(TriagemBotService.name);

  constructor(
    @InjectRepository(SessaoTriagem)
    private sessaoRepository: Repository<SessaoTriagem>,
    
    @InjectRepository(FluxoTriagem)
    private fluxoRepository: Repository<FluxoTriagem>
  ) {}

  /**
   * Iniciar nova sessão de triagem
   */
  async iniciarTriagem(
    empresaId: string, 
    telefone: string,
    canal: string = 'whatsapp'
  ): Promise<{ mensagem: string; opcoes?: string[] }> {
    
    // Buscar fluxo ativo para o canal
    const fluxo = await this.fluxoRepository.findOne({
      where: { 
        empresaId, 
        ativo: true,
        canais: ArrayContains([canal])
      }
    });

    if (!fluxo) {
      return {
        mensagem: 'Aguarde, vou te transferir para um atendente...'
      };
    }

    // Criar nova sessão
    const sessao = this.sessaoRepository.create({
      empresaId,
      fluxoId: fluxo.id,
      contatoTelefone: telefone,
      etapaAtual: fluxo.estrutura.etapaInicial,
      status: 'em_andamento'
    });

    await this.sessaoRepository.save(sessao);

    // Processar primeira etapa
    return this.processarEtapa(sessao, fluxo);
  }

  /**
   * Processar resposta do usuário
   */
  async processarResposta(
    telefone: string,
    resposta: string
  ): Promise<{ mensagem: string; opcoes?: string[]; finalizado?: boolean }> {
    
    // Buscar sessão ativa
    const sessao = await this.sessaoRepository.findOne({
      where: { 
        contatoTelefone: telefone,
        status: 'em_andamento'
      },
      relations: ['fluxo']
    });

    if (!sessao) {
      return { 
        mensagem: 'Sessão não encontrada. Digite "menu" para começar.',
        finalizado: true
      };
    }

    const fluxo = sessao.fluxo;
    const etapaAtual = fluxo.estrutura.etapas[sessao.etapaAtual];

    // Validar resposta
    const respostaValida = this.validarResposta(etapaAtual, resposta);
    
    if (!respostaValida) {
      return {
        mensagem: `Opção inválida. ${etapaAtual.mensagem}`,
        opcoes: etapaAtual.opcoes?.map(o => `${o.numero} - ${o.texto}`)
      };
    }

    // Atualizar histórico
    sessao.historico = [
      ...sessao.historico,
      {
        etapa: sessao.etapaAtual,
        resposta,
        timestamp: new Date()
      }
    ];

    // Determinar próxima etapa ou ação
    const opcaoSelecionada = etapaAtual.opcoes.find(
      o => o.numero.toString() === resposta
    );

    if (opcaoSelecionada.acao === 'criar_ticket') {
      // Criar ticket e finalizar triagem
      await this.criarTicketEFinalizarTriagem(sessao, opcaoSelecionada);
      
      return {
        mensagem: '✅ Ticket criado! Um atendente irá te atender em breve.',
        finalizado: true
      };
    }

    // Avançar para próxima etapa
    sessao.etapaAtual = opcaoSelecionada.proximaEtapa;
    await this.sessaoRepository.save(sessao);

    return this.processarEtapa(sessao, fluxo);
  }

  /**
   * Processar etapa atual do fluxo
   */
  private processarEtapa(
    sessao: SessaoTriagem, 
    fluxo: FluxoTriagem
  ): { mensagem: string; opcoes?: string[] } {
    
    const etapa = fluxo.estrutura.etapas[sessao.etapaAtual];

    if (etapa.tipo === 'mensagem_menu') {
      return {
        mensagem: etapa.mensagem,
        opcoes: etapa.opcoes.map(o => `${o.numero} - ${o.texto}`)
      };
    }

    if (etapa.tipo === 'pergunta_aberta') {
      return {
        mensagem: etapa.mensagem
      };
    }

    return {
      mensagem: 'Erro ao processar etapa. Aguarde transferência...',
      finalizado: true
    };
  }

  /**
   * Validar resposta do usuário
   */
  private validarResposta(etapa: any, resposta: string): boolean {
    if (etapa.tipo === 'mensagem_menu') {
      const opcoesValidas = etapa.opcoes.map(o => o.numero.toString());
      return opcoesValidas.includes(resposta);
    }

    if (etapa.tipo === 'pergunta_aberta') {
      return resposta.length > 0;
    }

    return false;
  }

  /**
   * Criar ticket e finalizar triagem
   */
  private async criarTicketEFinalizarTriagem(
    sessao: SessaoTriagem,
    opcao: any
  ): Promise<void> {
    // Lógica para criar ticket no núcleo correto
    // Integrar com TicketService existente
    
    sessao.status = 'concluido';
    sessao.nucleoDestinoId = opcao.nucleoId;
    sessao.concluidoEm = new Date();
    sessao.tempoTotalSegundos = Math.floor(
      (sessao.concluidoEm.getTime() - sessao.iniciadoEm.getTime()) / 1000
    );

    await this.sessaoRepository.save(sessao);
  }
}
```

### Frontend: `GestaoNucleosPage.tsx`
```typescript
import React, { useState } from 'react';
import { Plus, Settings, BarChart3, Users } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { nucleoService } from '../../services/nucleoService';

export default function GestaoNucleosPage() {
  const [modalNovoNucleo, setModalNovoNucleo] = useState(false);

  const { data: nucleos, isLoading } = useQuery({
    queryKey: ['nucleos'],
    queryFn: () => nucleoService.listar()
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          🏢 Núcleos de Atendimento
        </h1>
        <p className="text-gray-600">
          Gerencie equipes, SLA e distribuição de tickets
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setModalNovoNucleo(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Núcleo
        </button>
      </div>

      {/* Cards dos Núcleos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nucleos?.map((nucleo) => (
          <div key={nucleo.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {nucleo.nome}
                </h3>
                <p className="text-sm text-gray-600">{nucleo.descricao}</p>
              </div>
              <span 
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nucleo.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {nucleo.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Atendentes:</span>
                <span className="font-medium">{nucleo.atendentesIds?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">SLA Resposta:</span>
                <span className="font-medium">{nucleo.slaRespostaMinutos}min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tickets Abertos:</span>
                <span className="font-medium text-orange-600">
                  {nucleo.ticketsAbertos || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                <Settings className="w-4 h-4 inline mr-1" />
                Configurar
              </button>
              <button className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Relatório
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO

### **Fase 1: Estrutura Base (Dia 1-2)** 🏗️
```
Backend:
✅ Criar entities (Nucleo, FluxoTriagem, SessaoTriagem)
✅ Migrations do banco de dados
✅ Services básicos (CRUD)
✅ DTOs e validações

Frontend:
✅ Página de Gestão de Núcleos (listagem)
✅ Formulário de criação/edição de núcleo
✅ Service de API
```

### **Fase 2: Lógica de Triagem (Dia 2-3)** 🤖
```
Backend:
✅ TriagemBotService completo
✅ Integração com WhatsApp (receber/enviar mensagens)
✅ Processamento de etapas e validações
✅ Criação automática de tickets

Frontend:
✅ Editor básico de fluxo (JSON manual)
✅ Preview do fluxo
✅ Testes de fluxo
```

### **Fase 3: Editor Visual (Dia 3-4)** 🎨
```
Frontend:
✅ Editor drag-and-drop de fluxos
✅ Biblioteca de componentes (menu, pergunta, ação)
✅ Visualização em árvore
✅ Validação de fluxo

Backend:
✅ Endpoint para salvar/validar estrutura de fluxo
```

### **Fase 4: Monitoramento e Métricas (Dia 4-5)** 📊
```
Backend:
✅ Estatísticas de triagem
✅ Relatórios por núcleo
✅ Métricas de SLA

Frontend:
✅ Dashboard de triagem em tempo real
✅ Relatórios e gráficos
✅ Alertas de SLA
```

### **Fase 5: Refinamentos (Dia 5)** ✨
```
✅ Templates de mensagens pré-definidos
✅ Horários de funcionamento dos núcleos
✅ Mensagens automáticas fora de horário
✅ Testes end-to-end
✅ Documentação
```

---

## 🎯 CASOS DE USO PRÁTICOS

### Caso 1: Suporte Técnico com Priorização
```yaml
Fluxo: triagem_suporte_tecnico
Etapas:
  1. Boas-vindas
  2. Menu: "Qual o problema?"
     - Sistema fora do ar [URGENTE]
     - Erro ao acessar [MÉDIO]
     - Dúvida sobre funcionalidade [BAIXO]
  3. Coleta de detalhes (pergunta aberta)
  4. Criar ticket no Núcleo Suporte Técnico
     - Prioridade baseada na escolha
     - Contexto completo no ticket
```

### Caso 2: Financeiro com Validação
```yaml
Fluxo: triagem_financeiro
Etapas:
  1. "Qual seu CPF/CNPJ?" (validação)
  2. Buscar cliente no sistema
  3. Menu: "Como posso ajudar?"
     - 2ª via de boleto [automático - enviar PDF]
     - Negociar dívida [humano]
     - Cancelar serviço [humano + supervisor]
  4. Ação conforme escolha
```

### Caso 3: Vendas com Qualificação
```yaml
Fluxo: triagem_vendas
Etapas:
  1. "Você é cliente ou prospect?"
     - Cliente → verificar cadastro
     - Prospect → coletar dados
  2. "Qual seu interesse?"
     - Upgrade de plano
     - Novos módulos
     - Apenas informações
  3. Calcular score de prioridade
  4. Rotear para vendedor disponível (round-robin)
```

---

## 📊 MÉTRICAS E KPIS

### Métricas por Núcleo:
- ✅ Tempo médio de primeira resposta
- ✅ Taxa de resolução no primeiro contato
- ✅ % de tickets dentro do SLA
- ✅ Carga de trabalho por atendente
- ✅ Satisfação do cliente (CSAT)

### Métricas de Triagem:
- ✅ Taxa de conclusão do fluxo
- ✅ Taxa de abandono por etapa
- ✅ Tempo médio de triagem
- ✅ % de triagens automáticas vs humanas
- ✅ Distribuição por núcleo

---

## 🔒 CONSIDERAÇÕES DE SEGURANÇA

1. **Validação de dados:**
   - CPF/CNPJ com validação de dígitos
   - Sanitização de inputs do usuário
   - Rate limiting para evitar spam

2. **Controle de acesso:**
   - Supervisores veem todos os núcleos
   - Atendentes veem apenas seu núcleo
   - Auditoria de ações administrativas

3. **Privacidade:**
   - LGPD: consentimento para armazenar dados
   - Anonimização de dados sensíveis em relatórios
   - Retenção configurável de histórico

---

## 💡 DIFERENCIAIS COMPETITIVOS

1. **Editor Visual de Fluxos** - sem código
2. **Múltiplos Canais** - WhatsApp, Telegram, Email
3. **Inteligência de Roteamento** - round-robin, skill-based, load-balancing
4. **Templates Prontos** - biblioteca de fluxos comuns
5. **Métricas em Tempo Real** - dashboard live
6. **Integração Nativa** - usa infraestrutura existente do ConectCRM

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **Revisar proposta** - validar escopo e arquitetura
2. ⏳ **Aprovar implementação** - definir prioridades
3. ⏳ **Criar branch** - `feature/triagem-bot-nucleos`
4. ⏳ **Iniciar Fase 1** - estrutura base
5. ⏳ **Testes iterativos** - validar cada fase

---

**O que você acha desta proposta? Quer que eu comece implementando ou prefere ajustar alguma parte?** 🚀
