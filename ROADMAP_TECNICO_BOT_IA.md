# 🚀 Roadmap Técnico: Bot com IA - Implementação Detalhada

**Data**: 19/12/2025  
**Objetivo**: Implementar NLP, Analytics e Sentimento no bot ConectCRM  
**Prazo**: 1 mês (4 semanas)  
**Resultado**: Bot sobe de 7.2/10 para 8.5/10

---

## 📋 Índice Rápido

1. [🧠 Semana 1-2: NLP com OpenAI](#semana-1-2-nlp)
2. [📊 Semana 3: Analytics Dashboard](#semana-3-analytics)
3. [😊 Semana 4: Análise de Sentimento](#semana-4-sentimento)
4. [🧪 Testes e Validação](#testes)
5. [💰 Custos e ROI](#custos)

---

## 🧠 SEMANA 1-2: NLP com OpenAI {#semana-1-2-nlp}

### 🎯 Objetivo

Permitir que o bot entenda **texto livre** do usuário, não apenas menus numerados.

**Antes**:
```
Cliente: "preciso de uma fatura"
Bot: ❌ "Opção inválida. Digite 1, 2 ou 3."
```

**Depois**:
```
Cliente: "preciso de uma fatura"
Bot: ✅ "Entendi! Vou te ajudar com o financeiro. 
      Você quer segunda via ou informações de pagamento?"
```

---

### 📦 Dependências Necessárias

```bash
# Backend
cd backend
npm install openai@4.24.0
npm install @anthropic-ai/sdk@0.9.1  # Alternativa

# Variáveis de ambiente (.env)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini  # Mais barato, bom para classificação
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.3  # Baixo = mais consistente
```

**Custo estimado**: ~US$0.01 por conversa (GPT-4o-mini)

---

### 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────┐
│  Cliente WhatsApp                               │
└────────────┬────────────────────────────────────┘
             │ "quero falar sobre minha fatura"
             ▼
┌─────────────────────────────────────────────────┐
│  triagem-bot.service.ts                         │
│  └─ processarMensagemWhatsApp()                 │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  nlp.service.ts (NOVO)                          │
│  └─ detectarIntencao(texto)                     │
│     ├─ Chama OpenAI API                         │
│     └─ Retorna: { categoria, confianca, ... }   │
└────────────┬────────────────────────────────────┘
             │ categoria: "financeiro"
             │ confianca: 0.95
             ▼
┌─────────────────────────────────────────────────┐
│  triagem-bot.service.ts                         │
│  └─ Direciona para etapa correta do fluxo       │
└─────────────────────────────────────────────────┘
```

---

### 📝 Implementação Passo a Passo

#### Passo 1: Criar NLP Service

```bash
# Criar arquivo
touch backend/src/modules/triagem/services/nlp.service.ts
```

**Código completo**:

```typescript
// backend/src/modules/triagem/services/nlp.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface IntencaoDetectada {
  categoria: string; // 'financeiro' | 'suporte' | 'comercial' | 'atendimento' | 'desconhecido'
  confianca: number; // 0.0 a 1.0
  entidades?: {
    // Extrair informações úteis
    numeroTicket?: string;
    dataVencimento?: string;
    valorMencao?: string;
  };
  sugestaoResposta?: string;
  devePerguntarMais?: boolean;
}

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('⚠️ OPENAI_API_KEY não configurada. NLP desabilitado.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ OpenAI NLP configurado');
    }
  }

  /**
   * Detecta intenção do usuário usando GPT-4o-mini
   */
  async detectarIntencao(
    texto: string,
    contexto?: {
      historicoMensagens?: string[];
      nomeCliente?: string;
      ticketsAbertos?: number;
    }
  ): Promise<IntencaoDetectada> {
    // Fallback se OpenAI não configurada
    if (!this.openai) {
      return this.fallbackKeywordDetection(texto);
    }

    try {
      const prompt = this.construirPrompt(texto, contexto);
      
      const response = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Baixo = mais consistente
        max_tokens: 150,
        response_format: { type: 'json_object' }, // Força JSON
      });

      const resultado = JSON.parse(response.choices[0].message.content);
      
      this.logger.debug(`🧠 NLP: "${texto}" → ${resultado.categoria} (${resultado.confianca})`);
      
      return resultado as IntencaoDetectada;
    } catch (error) {
      this.logger.error('Erro ao chamar OpenAI:', error.message);
      return this.fallbackKeywordDetection(texto);
    }
  }

  /**
   * System prompt que define como o GPT deve classificar
   */
  private getSystemPrompt(): string {
    return `Você é um assistente de classificação de mensagens para um sistema de atendimento.

Sua tarefa é analisar mensagens de clientes e retornar um JSON com a seguinte estrutura:

{
  "categoria": "financeiro" | "suporte" | "comercial" | "atendimento" | "desconhecido",
  "confianca": 0.0 a 1.0,
  "entidades": {
    "numeroTicket": "extrair se mencionado (#123, ticket 456, etc)",
    "dataVencimento": "extrair se mencionado",
    "valorMencao": "extrair se mencionado"
  },
  "sugestaoResposta": "breve sugestão de como responder",
  "devePerguntarMais": true/false (se precisa de mais informações)
}

Categorias:
- "financeiro": pagamentos, faturas, boletos, cobranças, valores, preços
- "suporte": problemas técnicos, erros, bugs, não funciona, ajuda técnica
- "comercial": vendas, contratar, comprar, upgrade, planos, demonstração
- "atendimento": falar com humano, atendente, suporte geral, reclamações
- "desconhecido": não se encaixa em nenhuma categoria

Seja preciso. Confiança alta (>0.8) apenas quando tiver certeza.`;
  }

  /**
   * Constrói prompt com contexto
   */
  private construirPrompt(texto: string, contexto?: any): string {
    let prompt = `Mensagem do cliente: "${texto}"`;
    
    if (contexto?.nomeCliente) {
      prompt += `\nNome: ${contexto.nomeCliente}`;
    }
    
    if (contexto?.ticketsAbertos > 0) {
      prompt += `\nCliente tem ${contexto.ticketsAbertos} tickets em aberto.`;
    }
    
    if (contexto?.historicoMensagens?.length > 0) {
      prompt += `\nMensagens anteriores:\n${contexto.historicoMensagens.slice(-3).join('\n')}`;
    }
    
    return prompt;
  }

  /**
   * Fallback: detecção por keywords (caso OpenAI falhe)
   */
  private fallbackKeywordDetection(texto: string): IntencaoDetectada {
    const textoLower = texto.toLowerCase();
    
    // Financeiro
    const keywordsFinanceiro = [
      'boleto', 'fatura', 'pagamento', 'cobrança', 'valor', 
      'preço', 'dinheiro', 'pagar', 'débito', 'crédito',
      'mensalidade', 'vencimento', 'segunda via'
    ];
    
    // Suporte
    const keywordsSuporte = [
      'erro', 'bug', 'problema', 'não funciona', 'travou',
      'lento', 'ajuda', 'socorro', 'quebrado', 'parou'
    ];
    
    // Comercial
    const keywordsComercial = [
      'comprar', 'contratar', 'vender', 'plano', 'upgrade',
      'demonstração', 'demo', 'teste', 'trial', 'preço'
    ];
    
    // Atendimento
    const keywordsAtendimento = [
      'falar', 'atendente', 'humano', 'pessoa', 'alguém',
      'reclamar', 'urgente', 'rápido', 'agora'
    ];

    // Contar matches
    const scoreFinanceiro = keywordsFinanceiro.filter(k => textoLower.includes(k)).length;
    const scoreSuporte = keywordsSuporte.filter(k => textoLower.includes(k)).length;
    const scoreComercial = keywordsComercial.filter(k => textoLower.includes(k)).length;
    const scoreAtendimento = keywordsAtendimento.filter(k => textoLower.includes(k)).length;

    const scores = [
      { categoria: 'financeiro', score: scoreFinanceiro },
      { categoria: 'suporte', score: scoreSuporte },
      { categoria: 'comercial', score: scoreComercial },
      { categoria: 'atendimento', score: scoreAtendimento },
    ];

    const vencedor = scores.reduce((max, curr) => 
      curr.score > max.score ? curr : max
    );

    if (vencedor.score === 0) {
      return {
        categoria: 'desconhecido',
        confianca: 0.2,
        devePerguntarMais: true,
      };
    }

    return {
      categoria: vencedor.categoria,
      confianca: Math.min(vencedor.score * 0.3, 0.8), // Max 0.8 no fallback
      devePerguntarMais: vencedor.score === 1,
    };
  }
}
```

---

#### Passo 2: Registrar no Módulo

```typescript
// backend/src/modules/triagem/triagem.module.ts

import { NLPService } from './services/nlp.service';

@Module({
  // ... outros imports
  providers: [
    // ... outros services
    NLPService, // ← ADICIONAR
  ],
  exports: [
    // ... outros exports
    NLPService, // ← ADICIONAR
  ],
})
export class TriagemModule {}
```

---

#### Passo 3: Integrar no Bot Service

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

import { NLPService, IntencaoDetectada } from './nlp.service';

@Injectable()
export class TriagemBotService {
  constructor(
    // ... outros injects
    private readonly nlpService: NLPService, // ← ADICIONAR
  ) {}

  /**
   * Processar mensagem com NLP
   */
  async processarMensagemWhatsApp(
    empresaId: string,
    payload: any,
  ): Promise<ResultadoProcessamentoWebhook> {
    const dadosMensagem = this.extrairDadosWebhook(payload);
    
    // ... código existente ...

    // 🧠 NOVO: Detectar intenção com NLP
    const intencao = await this.nlpService.detectarIntencao(
      dadosMensagem.texto,
      {
        nomeCliente: dadosMensagem.nome,
        // Adicionar contexto se disponível
      }
    );

    this.logger.debug(`🎯 Intenção detectada: ${intencao.categoria} (${intencao.confianca})`);

    // Se confiança alta, pular direto para categoria
    if (intencao.confianca > 0.8) {
      return this.processarComIntencao(empresaId, dadosMensagem, intencao);
    }

    // Caso contrário, seguir fluxo normal
    // ... código existente ...
  }

  /**
   * NOVO: Processar mensagem quando intenção foi detectada
   */
  private async processarComIntencao(
    empresaId: string,
    dadosMensagem: DadosMensagemWebhook,
    intencao: IntencaoDetectada,
  ): Promise<ResultadoProcessamentoWebhook> {
    // Mapear categoria para núcleo
    const mapaNucleos = {
      financeiro: 'nucleo_financeiro_id',
      suporte: 'nucleo_suporte_id',
      comercial: 'nucleo_comercial_id',
      atendimento: 'nucleo_atendimento_id',
    };

    const nucleoId = mapaNucleos[intencao.categoria];

    if (!nucleoId) {
      // Categoria desconhecida, seguir fluxo normal
      return this.processarFluxoNormal(empresaId, dadosMensagem);
    }

    // Criar ticket direto no núcleo correto
    const ticket = await this.ticketService.create(empresaId, {
      titulo: `${intencao.categoria}: ${dadosMensagem.texto.substring(0, 50)}`,
      descricao: dadosMensagem.texto,
      contatoTelefone: dadosMensagem.telefone,
      nucleoId,
      prioridade: intencao.categoria === 'atendimento' ? 'alta' : 'normal',
      origem: 'whatsapp',
      // Adicionar metadata da detecção
      metadataIntencao: {
        categoria: intencao.categoria,
        confianca: intencao.confianca,
        detectadoPorNLP: true,
      },
    });

    // Enviar confirmação ao cliente
    await this.whatsAppSenderService.enviarMensagem(
      dadosMensagem.telefone,
      `✅ Entendi! Identifiquei sua solicitação como *${intencao.categoria}*.
      
${intencao.sugestaoResposta || 'Estou direcionando você para o setor correto.'}

Seu ticket #${ticket.numero} foi criado. Um atendente te responderá em breve!`
    );

    return {
      novaSessao: false,
      ticketCriado: ticket.id,
      intencaoDetectada: intencao,
      dadosMensagem,
    };
  }
}
```

---

### 🧪 Testes do NLP

```typescript
// backend/src/modules/triagem/services/nlp.service.spec.ts

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NLPService } from './nlp.service';

describe('NLPService', () => {
  let service: NLPService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NLPService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => {
              if (key === 'OPENAI_API_KEY') return 'test-key';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NLPService>(NLPService);
  });

  describe('Detecção de Intenção', () => {
    it('deve detectar categoria financeiro', async () => {
      const resultado = await service.detectarIntencao('preciso da segunda via do boleto');
      
      expect(resultado.categoria).toBe('financeiro');
      expect(resultado.confianca).toBeGreaterThan(0.7);
    });

    it('deve detectar categoria suporte', async () => {
      const resultado = await service.detectarIntencao('sistema está com erro, não consigo acessar');
      
      expect(resultado.categoria).toBe('suporte');
      expect(resultado.confianca).toBeGreaterThan(0.7);
    });

    it('deve usar fallback quando OpenAI falha', async () => {
      // Simular falha da API
      jest.spyOn(service['openai'].chat.completions, 'create').mockRejectedValue(new Error('API Error'));
      
      const resultado = await service.detectarIntencao('quero falar sobre pagamento');
      
      // Deve usar keyword detection
      expect(resultado.categoria).toBe('financeiro');
      expect(resultado.confianca).toBeLessThan(0.8); // Fallback tem confiança menor
    });
  });
});
```

---

### 📊 Métricas de Sucesso (NLP)

Após implementação, acompanhar:

```sql
-- Queries úteis para monitorar NLP

-- 1. Taxa de detecção bem-sucedida
SELECT 
  DATE(created_at) as data,
  COUNT(*) as total_mensagens,
  SUM(CASE WHEN metadata_intencao->>'detectadoPorNLP' = 'true' THEN 1 ELSE 0 END) as detectado_por_nlp,
  ROUND(
    100.0 * SUM(CASE WHEN metadata_intencao->>'detectadoPorNLP' = 'true' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as taxa_nlp_porcento
FROM tickets
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 2. Distribuição por categoria
SELECT 
  metadata_intencao->>'categoria' as categoria,
  AVG((metadata_intencao->>'confianca')::float) as confianca_media,
  COUNT(*) as total
FROM tickets
WHERE metadata_intencao->>'detectadoPorNLP' = 'true'
GROUP BY categoria
ORDER BY total DESC;

-- 3. Taxa de resolução (NLP vs Manual)
SELECT 
  CASE 
    WHEN metadata_intencao->>'detectadoPorNLP' = 'true' THEN 'Com NLP'
    ELSE 'Sem NLP'
  END as tipo,
  COUNT(*) as total_tickets,
  SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as taxa_conclusao_porcento
FROM tickets
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tipo;
```

**Meta de Sucesso**:
- ✅ Taxa de detecção NLP: >70%
- ✅ Confiança média: >0.75
- ✅ Taxa de conclusão: +15% vs sem NLP

---

## 📊 SEMANA 3: Analytics Dashboard {#semana-3-analytics}

### 🎯 Objetivo

Ter visibilidade completa do desempenho do bot.

**Dashboard incluirá**:
1. Funil de conversão (quantos completam vs abandonam)
2. Pontos de abandono (em qual etapa desistem)
3. Tempo médio por etapa
4. Taxa de conclusão por fluxo
5. Mensagens mais/menos efetivas

---

### 📦 Estrutura de Dados (Analytics)

```sql
-- Migration: Tabela de eventos do bot
CREATE TABLE bot_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  sessao_id UUID NOT NULL REFERENCES sessoes_triagem(id),
  fluxo_id UUID NOT NULL REFERENCES fluxos_triagem(id),
  
  -- Evento
  tipo_evento VARCHAR(50) NOT NULL, -- 'inicio', 'etapa_vista', 'opcao_selecionada', 'abandono', 'conclusao'
  etapa_id VARCHAR(100), -- ID da etapa no fluxo
  etapa_tipo VARCHAR(50), -- 'mensagem', 'menu', 'question', etc.
  
  -- Dados do evento
  dados JSONB, -- Dados específicos (opção escolhida, tempo na etapa, etc.)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices
  INDEX idx_bot_eventos_empresa (empresa_id),
  INDEX idx_bot_eventos_sessao (sessao_id),
  INDEX idx_bot_eventos_fluxo (fluxo_id),
  INDEX idx_bot_eventos_tipo (tipo_evento),
  INDEX idx_bot_eventos_data (created_at)
);
```

---

### 🏗️ Implementação Backend

#### Passo 1: Entity do Evento

```typescript
// backend/src/modules/triagem/entities/bot-evento.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SessaoTriagem } from './sessao-triagem.entity';
import { FluxoTriagem } from './fluxo-triagem.entity';
import { Empresa } from '../../empresas/empresa.entity';

@Entity('bot_eventos')
export class BotEvento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @Column({ name: 'sessao_id' })
  sessaoId: string;

  @Column({ name: 'fluxo_id' })
  fluxoId: string;

  @Column({ name: 'tipo_evento' })
  tipoEvento: 'inicio' | 'etapa_vista' | 'opcao_selecionada' | 'abandono' | 'conclusao' | 'transferencia_humano';

  @Column({ name: 'etapa_id', nullable: true })
  etapaId?: string;

  @Column({ name: 'etapa_tipo', nullable: true })
  etapaTipo?: string;

  @Column({ type: 'jsonb', nullable: true })
  dados?: Record<string, any>;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  // Relações
  @ManyToOne(() => SessaoTriagem)
  @JoinColumn({ name: 'sessao_id' })
  sessao: SessaoTriagem;

  @ManyToOne(() => FluxoTriagem)
  @JoinColumn({ name: 'fluxo_id' })
  fluxo: FluxoTriagem;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;
}
```

---

#### Passo 2: Service de Analytics

```typescript
// backend/src/modules/triagem/services/bot-analytics.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEvento } from '../entities/bot-evento.entity';

export interface FunilConversao {
  etapa: string;
  total: number;
  porcentagem: number;
  abandonos: number;
  tempoMedioSegundos: number;
}

export interface AnalyticsResumo {
  periodo: { inicio: Date; fim: Date };
  totalSessoes: number;
  taxaConclusao: number;
  tempoMedioTotal: number;
  funil: FunilConversao[];
  pontosAbandono: Array<{ etapa: string; total: number }>;
  melhorHorario: string;
}

@Injectable()
export class BotAnalyticsService {
  private readonly logger = new Logger(BotAnalyticsService.name);

  constructor(
    @InjectRepository(BotEvento)
    private readonly eventoRepository: Repository<BotEvento>,
  ) {}

  /**
   * Registrar evento do bot
   */
  async registrarEvento(dados: {
    empresaId: string;
    sessaoId: string;
    fluxoId: string;
    tipoEvento: BotEvento['tipoEvento'];
    etapaId?: string;
    etapaTipo?: string;
    dados?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.eventoRepository.save(dados);
      this.logger.debug(`📊 Evento registrado: ${dados.tipoEvento} (${dados.etapaId})`);
    } catch (error) {
      this.logger.error('Erro ao registrar evento:', error);
      // Não falhar a operação principal se analytics falhar
    }
  }

  /**
   * Obter funil de conversão
   */
  async obterFunilConversao(
    empresaId: string,
    fluxoId: string,
    periodo: { inicio: Date; fim: Date }
  ): Promise<FunilConversao[]> {
    // Query complexa para montar funil
    const query = `
      WITH sessoes_periodo AS (
        SELECT DISTINCT sessao_id
        FROM bot_eventos
        WHERE empresa_id = $1
          AND fluxo_id = $2
          AND created_at BETWEEN $3 AND $4
          AND tipo_evento = 'inicio'
      ),
      eventos_etapa AS (
        SELECT 
          e.etapa_id,
          e.etapa_tipo,
          e.sessao_id,
          e.tipo_evento,
          e.created_at,
          LAG(e.created_at) OVER (PARTITION BY e.sessao_id ORDER BY e.created_at) as etapa_anterior_tempo
        FROM bot_eventos e
        INNER JOIN sessoes_periodo sp ON e.sessao_id = sp.sessao_id
        WHERE e.tipo_evento IN ('etapa_vista', 'abandono', 'conclusao')
        ORDER BY e.sessao_id, e.created_at
      )
      SELECT 
        etapa_id,
        etapa_tipo,
        COUNT(DISTINCT sessao_id) as total_sessoes,
        SUM(CASE WHEN tipo_evento = 'abandono' THEN 1 ELSE 0 END) as abandonos,
        AVG(EXTRACT(EPOCH FROM (created_at - etapa_anterior_tempo))) as tempo_medio_segundos
      FROM eventos_etapa
      WHERE etapa_id IS NOT NULL
      GROUP BY etapa_id, etapa_tipo
      ORDER BY MIN(created_at);
    `;

    const resultados = await this.eventoRepository.query(query, [
      empresaId,
      fluxoId,
      periodo.inicio,
      periodo.fim,
    ]);

    // Calcular porcentagens relativas ao início
    const totalInicio = resultados[0]?.total_sessoes || 1;

    return resultados.map((row, index) => ({
      etapa: row.etapa_id,
      total: parseInt(row.total_sessoes),
      porcentagem: (parseInt(row.total_sessoes) / totalInicio) * 100,
      abandonos: parseInt(row.abandonos),
      tempoMedioSegundos: parseFloat(row.tempo_medio_segundos) || 0,
    }));
  }

  /**
   * Obter resumo completo de analytics
   */
  async obterResumo(
    empresaId: string,
    fluxoId: string,
    periodo: { inicio: Date; fim: Date }
  ): Promise<AnalyticsResumo> {
    const funil = await this.obterFunilConversao(empresaId, fluxoId, periodo);

    // Total de sessões
    const totalSessoes = await this.eventoRepository.count({
      where: {
        empresaId,
        fluxoId,
        tipoEvento: 'inicio',
        createdAt: Between(periodo.inicio, periodo.fim),
      },
    });

    // Taxa de conclusão
    const conclusoes = await this.eventoRepository.count({
      where: {
        empresaId,
        fluxoId,
        tipoEvento: 'conclusao',
        createdAt: Between(periodo.inicio, periodo.fim),
      },
    });

    const taxaConclusao = totalSessoes > 0 ? (conclusoes / totalSessoes) * 100 : 0;

    // Pontos de abandono (top 5)
    const pontosAbandono = funil
      .filter(e => e.abandonos > 0)
      .sort((a, b) => b.abandonos - a.abandonos)
      .slice(0, 5)
      .map(e => ({ etapa: e.etapa, total: e.abandonos }));

    // Tempo médio total
    const tempoMedioTotal = funil.reduce((sum, e) => sum + e.tempoMedioSegundos, 0);

    return {
      periodo,
      totalSessoes,
      taxaConclusao,
      tempoMedioTotal,
      funil,
      pontosAbandono,
      melhorHorario: await this.obterMelhorHorario(empresaId, fluxoId, periodo),
    };
  }

  /**
   * Descobrir melhor horário (maior taxa de conclusão)
   */
  private async obterMelhorHorario(
    empresaId: string,
    fluxoId: string,
    periodo: { inicio: Date; fim: Date }
  ): Promise<string> {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hora,
        COUNT(*) as total,
        SUM(CASE WHEN tipo_evento = 'conclusao' THEN 1 ELSE 0 END) as conclusoes
      FROM bot_eventos
      WHERE empresa_id = $1
        AND fluxo_id = $2
        AND created_at BETWEEN $3 AND $4
        AND tipo_evento IN ('inicio', 'conclusao')
      GROUP BY hora
      ORDER BY (conclusoes::float / total) DESC
      LIMIT 1;
    `;

    const resultado = await this.eventoRepository.query(query, [
      empresaId,
      fluxoId,
      periodo.inicio,
      periodo.fim,
    ]);

    if (resultado.length === 0) return 'N/A';

    const hora = parseInt(resultado[0].hora);
    return `${hora}h às ${hora + 1}h`;
  }
}
```

---

#### Passo 3: Integrar no Bot (Tracking)

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

import { BotAnalyticsService } from './bot-analytics.service';

@Injectable()
export class TriagemBotService {
  constructor(
    // ... outros injects
    private readonly analyticsService: BotAnalyticsService, // ← ADICIONAR
  ) {}

  /**
   * Iniciar triagem (registrar evento início)
   */
  async iniciarTriagem(dto: IniciarTriagemDto): Promise<RespostaBot> {
    // ... código existente criar sessão ...

    // 📊 Registrar evento: início
    await this.analyticsService.registrarEvento({
      empresaId: this.empresaId,
      sessaoId: sessao.id,
      fluxoId: fluxo.id,
      tipoEvento: 'inicio',
      dados: { canal: dto.canal },
    });

    // ... continuar ...
  }

  /**
   * Processar resposta (registrar evento por etapa)
   */
  async processarResposta(dto: ResponderTriagemDto): Promise<RespostaBot> {
    // ... código existente ...

    const etapaAtual = fluxo.estrutura.etapas[sessao.etapaAtual];

    // 📊 Registrar evento: etapa vista
    await this.analyticsService.registrarEvento({
      empresaId: sessao.empresaId,
      sessaoId: sessao.id,
      fluxoId: sessao.fluxoId,
      tipoEvento: 'etapa_vista',
      etapaId: sessao.etapaAtual,
      etapaTipo: etapaAtual.tipo,
      dados: { resposta: dto.resposta },
    });

    // Se usuário selecionou opção
    if (etapaAtual.tipo === 'menu' && dto.resposta) {
      await this.analyticsService.registrarEvento({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: sessao.fluxoId,
        tipoEvento: 'opcao_selecionada',
        etapaId: sessao.etapaAtual,
        dados: { opcao: dto.resposta },
      });
    }

    // Se chegou no fim
    if (proximaEtapa.tipo === 'acao' && proximaEtapa.acao === 'finalizar') {
      await this.analyticsService.registrarEvento({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: sessao.fluxoId,
        tipoEvento: 'conclusao',
        dados: { ticketCriado: ticket?.id },
      });
    }

    // ... continuar ...
  }

  /**
   * Detectar abandono (timeout)
   */
  async verificarSessoesExpiradas(): Promise<void> {
    const sessoesExpiradas = await this.sessaoRepository.find({
      where: {
        status: 'ativa',
        updatedAt: LessThan(new Date(Date.now() - 10 * 60 * 1000)), // 10 min
      },
    });

    for (const sessao of sessoesExpiradas) {
      // 📊 Registrar abandono
      await this.analyticsService.registrarEvento({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: sessao.fluxoId,
        tipoEvento: 'abandono',
        etapaId: sessao.etapaAtual,
        dados: { motivo: 'timeout' },
      });

      sessao.status = 'expirada';
      await this.sessaoRepository.save(sessao);
    }
  }
}
```

---

### 🎨 Frontend: Dashboard de Analytics

```typescript
// frontend-web/src/features/atendimento/pages/BotAnalyticsPage.tsx

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { botAnalyticsService } from '../../../services/botAnalyticsService';

interface FunilEtapa {
  etapa: string;
  total: number;
  porcentagem: number;
  abandonos: number;
  tempoMedio: number;
}

const BotAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30d'); // 7d, 30d, 90d
  const [fluxoSelecionado, setFluxoSelecionado] = useState<string | null>(null);
  
  const [analytics, setAnalytics] = useState<{
    totalSessoes: number;
    taxaConclusao: number;
    tempoMedioTotal: number;
    funil: FunilEtapa[];
    pontosAbandono: Array<{ etapa: string; total: number }>;
  } | null>(null);

  useEffect(() => {
    carregarAnalytics();
  }, [periodo, fluxoSelecionado]);

  const carregarAnalytics = async () => {
    try {
      setLoading(true);
      const dados = await botAnalyticsService.obterResumo(fluxoSelecionado, periodo);
      setAnalytics(dados);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#159A9C]" />
            Analytics do Bot
          </h1>
          <p className="text-gray-600 mt-2">
            Métricas de desempenho e otimização dos fluxos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Sessões</p>
                <p className="text-3xl font-bold text-[#002333] mt-2">
                  {analytics?.totalSessoes || 0}
                </p>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {analytics?.taxaConclusao.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-3xl font-bold text-[#002333] mt-2">
                  {formatarTempo(analytics?.tempoMedioTotal || 0)}
                </p>
              </div>
              <Clock className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abandonos</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {analytics?.pontosAbandono.reduce((sum, p) => sum + p.total, 0) || 0}
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Funil de Conversão */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-[#002333] mb-4">
            Funil de Conversão
          </h2>
          
          <div className="space-y-4">
            {analytics?.funil.map((etapa, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#002333]">
                    {etapa.etapa}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {etapa.total} sessões ({etapa.porcentagem.toFixed(1)}%)
                    </span>
                    {etapa.abandonos > 0 && (
                      <span className="text-sm text-red-600 font-medium">
                        🚨 {etapa.abandonos} abandonos
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="bg-[#159A9C] h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${etapa.porcentagem}%` }}
                  >
                    <span className="text-white text-xs font-medium">
                      {etapa.porcentagem.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Overlay de abandonos */}
                  {etapa.abandonos > 0 && (
                    <div
                      className="absolute top-0 right-0 bg-red-500 h-full"
                      style={{ width: `${(etapa.abandonos / etapa.total) * etapa.porcentagem}%` }}
                    />
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  ⏱️ Tempo médio: {formatarTempo(etapa.tempoMedio)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pontos Críticos de Abandono */}
        {analytics?.pontosAbandono.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              ⚠️ Pontos Críticos de Abandono
            </h3>
            
            <div className="space-y-3">
              {analytics.pontosAbandono.map((ponto, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-900">
                    {index + 1}. {ponto.etapa}
                  </span>
                  <span className="text-sm text-red-700 font-bold">
                    {ponto.total} abandonos
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-red-800">
                💡 <strong>Sugestão:</strong> Revise estas etapas para melhorar a experiência e reduzir abandonos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatarTempo = (segundos: number): string => {
  if (segundos < 60) return `${Math.round(segundos)}s`;
  const minutos = Math.floor(segundos / 60);
  const segs = Math.round(segundos % 60);
  return `${minutos}min ${segs}s`;
};

export default BotAnalyticsPage;
```

---

## 😊 SEMANA 4: Análise de Sentimento {#semana-4-sentimento}

### 🎯 Objetivo

Detectar quando cliente está frustrado/urgente e escalar automaticamente.

**Exemplo**:
```
Cliente: "JÁ É A TERCEIRA VEZ que tento resolver isso!!! 😡"
Bot detecta: sentimento = -0.85 (muito negativo)
Ação: Escala imediatamente para supervisor + prioridade alta
```

---

### 📝 Implementação (Rápida)

```typescript
// backend/src/modules/triagem/services/nlp.service.ts

/**
 * Análise de sentimento (usa mesma API do NLP)
 */
async analisarSentimento(texto: string): Promise<{
  score: number; // -1 (negativo) a +1 (positivo)
  magnitude: number; // 0 a 1 (intensidade)
  emocoes: string[]; // ['frustrado', 'urgente', 'satisfeito']
}> {
  if (!this.openai) {
    return this.fallbackSentimentAnalysis(texto);
  }

  try {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analise o sentimento da mensagem e retorne JSON:
{
  "score": -1 a +1 (-1 = muito negativo, 0 = neutro, +1 = muito positivo),
  "magnitude": 0 a 1 (intensidade da emoção),
  "emocoes": ["frustrado", "urgente", "satisfeito", etc]
}`,
        },
        { role: 'user', content: texto },
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    this.logger.error('Erro ao analisar sentimento:', error);
    return this.fallbackSentimentAnalysis(texto);
  }
}

/**
 * Fallback: análise por keywords de emoção
 */
private fallbackSentimentAnalysis(texto: string) {
  const textoLower = texto.toLowerCase();
  
  const negativo = ['péssimo', 'horrível', 'raiva', 'irritado', '😡', '😠', 'não funciona', 'problema'];
  const urgente = ['urgente', 'rápido', 'agora', 'já', 'imediato'];
  const positivo = ['ótimo', 'excelente', 'obrigado', 'perfeito', '😊', '👍'];

  let score = 0;
  let magnitude = 0;
  const emocoes: string[] = [];

  // Caps lock = ênfase
  if (texto === texto.toUpperCase() && texto.length > 5) {
    magnitude += 0.3;
    emocoes.push('enfático');
  }

  // Contar negativo
  const countNeg = negativo.filter(k => textoLower.includes(k)).length;
  if (countNeg > 0) {
    score -= countNeg * 0.3;
    magnitude += 0.4;
    emocoes.push('frustrado');
  }

  // Contar urgente
  const countUrg = urgente.filter(k => textoLower.includes(k)).length;
  if (countUrg > 0) {
    magnitude += 0.3;
    emocoes.push('urgente');
  }

  // Contar positivo
  const countPos = positivo.filter(k => textoLower.includes(k)).length;
  if (countPos > 0) {
    score += countPos * 0.3;
    emocoes.push('satisfeito');
  }

  return {
    score: Math.max(-1, Math.min(1, score)),
    magnitude: Math.min(1, magnitude),
    emocoes: emocoes.length > 0 ? emocoes : ['neutro'],
  };
}
```

---

### 🚨 Integrar Escalonamento Automático

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

async processarMensagemWhatsApp(...): Promise<...> {
  // ... código existente ...

  // 😊 Analisar sentimento
  const sentimento = await this.nlpService.analisarSentimento(dadosMensagem.texto);
  
  this.logger.debug(`😊 Sentimento: ${sentimento.score.toFixed(2)} (${sentimento.emocoes.join(', ')})`);

  // 🚨 Se sentimento muito negativo ou urgente, escalar
  if (sentimento.score < -0.5 || sentimento.emocoes.includes('urgente')) {
    this.logger.warn(`🚨 Cliente frustrado/urgente! Escalando automaticamente...`);
    
    return this.escalarParaHumano(empresaId, dadosMensagem, {
      motivo: 'sentimento_negativo',
      sentimento,
      prioridadeAlta: true,
    });
  }

  // ... continuar fluxo normal ...
}

/**
 * Escalar para atendimento humano com contexto
 */
private async escalarParaHumano(
  empresaId: string,
  dadosMensagem: DadosMensagemWebhook,
  opcoes: {
    motivo: string;
    sentimento?: any;
    prioridadeAlta?: boolean;
  }
): Promise<ResultadoProcessamentoWebhook> {
  // Criar ticket com prioridade alta
  const ticket = await this.ticketService.create(empresaId, {
    titulo: `[URGENTE] ${dadosMensagem.texto.substring(0, 50)}`,
    descricao: `⚠️ Cliente escalado automaticamente por: ${opcoes.motivo}\n\n${dadosMensagem.texto}`,
    contatoTelefone: dadosMensagem.telefone,
    prioridade: 'alta',
    origem: 'whatsapp',
    metadata: {
      escalonamentoAutomatico: true,
      motivo: opcoes.motivo,
      sentimento: opcoes.sentimento,
    },
  });

  // Enviar mensagem ao cliente
  await this.whatsAppSenderService.enviarMensagem(
    dadosMensagem.telefone,
    `🚨 Entendi a urgência da sua situação!

Estou escalando você para um atendente humano AGORA. Seu ticket #${ticket.numero} foi criado com prioridade ALTA.

⏱️ Tempo de resposta esperado: 5 minutos`
  );

  // Notificar supervisores
  await this.notificarSupervisores(empresaId, ticket);

  return {
    escalado: true,
    ticketCriado: ticket.id,
    sentimento: opcoes.sentimento,
    dadosMensagem,
  };
}
```

---

## 🧪 TESTES E VALIDAÇÃO {#testes}

### Checklist de Testes

```markdown
## NLP
- [ ] Detecta "boleto atrasado" → categoria: financeiro
- [ ] Detecta "sistema travou" → categoria: suporte
- [ ] Detecta "quero comprar" → categoria: comercial
- [ ] Fallback funciona se OpenAI falha
- [ ] Confiança >0.8 pula menu direto

## Analytics
- [ ] Registra evento início ao criar sessão
- [ ] Registra evento etapa_vista em cada etapa
- [ ] Registra evento conclusão ao finalizar
- [ ] Dashboard mostra funil correto
- [ ] Pontos de abandono identificados
- [ ] Tempo médio calculado corretamente

## Sentimento
- [ ] Detecta texto em CAPS LOCK como ênfase
- [ ] Detecta palavras negativas (péssimo, horrível)
- [ ] Detecta urgência (urgente, agora, rápido)
- [ ] Score < -0.5 escala automaticamente
- [ ] Supervisor é notificado
- [ ] Cliente recebe confirmação de escalação
```

---

## 💰 CUSTOS E ROI {#custos}

### Custos Mensais (Estimado para 1.000 conversas/mês)

| Item | Custo Unitário | Total Mensal |
|------|----------------|--------------|
| OpenAI API (NLP) | $0.01/conversa | $10 |
| OpenAI API (Sentimento) | $0.005/conversa | $5 |
| Armazenamento (Analytics) | $0.10/GB | $2 |
| **TOTAL** | | **$17/mês** |

**Para 10.000 conversas/mês**: ~$150/mês

---

### ROI Esperado

**Benefícios Mensuráveis**:

1. **+35% Taxa de Conclusão** (NLP)
   - Antes: 1.000 conversas → 530 concluídas (53%)
   - Depois: 1.000 conversas → 715 concluídas (71.5%)
   - **+185 conversas bem-sucedidas**

2. **-60% Reclamações Escaladas** (Sentimento)
   - Antes: 100 reclamações por mês
   - Depois: 40 reclamações (detecção precoce)
   - **+60% satisfação**

3. **Otimização Baseada em Dados** (Analytics)
   - Identificar gargalos
   - Testar melhorias
   - **+15% eficiência operacional**

**ROI Total**:
- Investimento: $150/mês (10k conversas)
- Retorno: +215 conversas bem-sucedidas/mês
- Valor por conversão: ~$50
- **ROI**: $10.750/mês - $150/mês = **$10.600/mês** ✅

**Payback**: Imediato (primeiro mês)

---

## 🎯 Cronograma Consolidado

| Semana | Entregável | Horas | Status |
|--------|-----------|-------|--------|
| 1-2 | NLP Service + Integração | 80h | 🔴 A fazer |
| 3 | Analytics Backend + Frontend | 40h | 🔴 A fazer |
| 4 | Sentimento + Escalonamento | 20h | 🔴 A fazer |
| **TOTAL** | | **140h** | **~1 mês** |

---

## ✅ Checklist Final de Implantação

```markdown
### Pré-requisitos
- [ ] Conta OpenAI criada
- [ ] API key gerada
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados atualizado (migrations)

### Backend
- [ ] NLPService implementado e testado
- [ ] BotAnalyticsService implementado
- [ ] Eventos sendo registrados corretamente
- [ ] Endpoints de analytics criados
- [ ] Testes unitários passando (>80% coverage)

### Frontend
- [ ] Dashboard de analytics criado
- [ ] Funil de conversão exibindo corretamente
- [ ] Pontos de abandono visíveis
- [ ] Gráficos e KPIs funcionando

### Validação
- [ ] Testar NLP com 20+ mensagens diferentes
- [ ] Verificar taxa de acerto >80%
- [ ] Analytics registrando todos eventos
- [ ] Sentimento detectando frustração
- [ ] Escalação automática funcionando
- [ ] Performance OK (<200ms por chamada NLP)

### Documentação
- [ ] README atualizado
- [ ] Documentação API analytics
- [ ] Guia de uso para time de suporte
- [ ] Métricas de sucesso definidas

### Deploy
- [ ] Staging testado
- [ ] Produção com feature flag
- [ ] Monitoramento ativo (Sentry, logs)
- [ ] Rollback plan documentado
```

---

## 📚 Próximos Passos Após Implementação

1. **Monitorar por 2 semanas**:
   - Taxa de acerto do NLP
   - Custos reais da API
   - Feedback dos clientes
   - Taxa de conclusão antes/depois

2. **Otimizar baseado em dados**:
   - Ajustar prompts do GPT
   - Adicionar mais keywords no fallback
   - Refinar threshold de escalação

3. **Expandir funcionalidades**:
   - Suporte multi-idioma
   - Detecção de spam
   - Sugestões de resposta para agentes
   - Aprendizado contínuo (fine-tuning)

---

**Pronto para começar? Quer que eu implemente algum desses módulos primeiro?** 🚀
