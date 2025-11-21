# 🛠️ Guia de Implementação - Melhorias do Bot ConectCRM

**Data**: 10 de novembro de 2025  
**Referência**: ANALISE_BOT_VS_MERCADO.md  
**Objetivo**: Guia prático passo-a-passo para implementar as melhorias sugeridas

---

## 📋 ÍNDICE

1. [Quick Wins (1-2 dias)](#quick-wins)
2. [Sprint 1: NLP + Base Conhecimento (2 semanas)](#sprint-1)
3. [Sprint 2: Sentimento + Contexto (1 semana)](#sprint-2)
4. [Sprint 3: Analytics + Handoff (1 semana)](#sprint-3)
5. [Testes e Validação](#testes)

---

## 🚀 QUICK WINS (1-2 dias cada)

### 1. Atalhos de Texto (2 horas)

**Objetivo**: Reconhecer palavras-chave óbvias sem precisar de NLP completo

#### Backend - Criar Utilitário

```typescript
// backend/src/modules/triagem/utils/keyword-shortcuts.util.ts

export interface ShortcutMatch {
  nucleoId?: string;
  departamentoId?: string;
  etapaId?: string;
  confianca: number;
}

export class KeywordShortcuts {
  private static readonly ATALHOS = {
    financeiro: {
      keywords: [
        'boleto', 'fatura', 'pagamento', 'cobrança', 'nota fiscal',
        'nf', 'danfe', '2 via', 'segunda via', 'vencimento',
        'débito', 'crédito', 'cancelar assinatura', 'reembolso'
      ],
      tipo: 'nucleo',
      codigo: 'NUC_FINANCEIRO',
      confianca: 0.9,
    },
    suporte: {
      keywords: [
        'erro', 'bug', 'problema', 'não funciona', 'lento', 'travou',
        'caiu', 'offline', 'integração', 'api', 'webhook', 'suporte',
        'técnico', 'ajuda', 'dúvida', 'como fazer'
      ],
      tipo: 'nucleo',
      codigo: 'NUC_SUPORTE',
      confianca: 0.85,
    },
    comercial: {
      keywords: [
        'plano', 'upgrade', 'downgrade', 'proposta', 'orçamento',
        'contratar', 'renovar', 'contrato', 'preço', 'valor',
        'demonstração', 'demo', 'apresentação', 'trial', 'teste'
      ],
      tipo: 'nucleo',
      codigo: 'NUC_COMERCIAL',
      confianca: 0.88,
    },
    humano: {
      keywords: [
        'humano', 'atendente', 'pessoa', 'gente', 'falar com alguém',
        'representante', 'operador', 'não quero bot', 'sair do bot'
      ],
      tipo: 'acao',
      acao: 'transferir_geral',
      confianca: 0.95,
    },
  };

  /**
   * Detecta atalhos na mensagem do usuário
   */
  static detectar(mensagem: string): ShortcutMatch | null {
    const texto = mensagem.toLowerCase().trim();
    
    for (const [categoria, config] of Object.entries(this.ATALHOS)) {
      for (const keyword of config.keywords) {
        // Busca palavra completa ou frase
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(texto)) {
          return {
            nucleoCodigo: config.tipo === 'nucleo' ? config.codigo : undefined,
            acao: config.tipo === 'acao' ? config.acao : undefined,
            confianca: config.confianca,
            palavraEncontrada: keyword,
            categoria,
          };
        }
      }
    }

    return null;
  }

  /**
   * Busca múltiplos matches (para sugerir opções)
   */
  static detectarMultiplos(mensagem: string): ShortcutMatch[] {
    const texto = mensagem.toLowerCase().trim();
    const matches: ShortcutMatch[] = [];

    for (const [categoria, config] of Object.entries(this.ATALHOS)) {
      let score = 0;
      const palavrasEncontradas: string[] = [];

      for (const keyword of config.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(texto)) {
          score += 1;
          palavrasEncontradas.push(keyword);
        }
      }

      if (score > 0) {
        matches.push({
          nucleoCodigo: config.tipo === 'nucleo' ? config.codigo : undefined,
          acao: config.tipo === 'acao' ? config.acao : undefined,
          confianca: Math.min(0.95, config.confianca + (score * 0.05)),
          palavrasEncontradas,
          categoria,
        });
      }
    }

    // Ordenar por confiança
    return matches.sort((a, b) => b.confianca - a.confianca);
  }
}
```

#### Integrar no Processamento

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

import { KeywordShortcuts } from '../utils/keyword-shortcuts.util';

async processarResposta(
  empresaId: string,
  responderDto: ResponderTriagemDto,
  opcoes?: ProcessarRespostaOpcoes,
): Promise<RespostaBot> {
  // ... código existente ...

  // 🆕 ADICIONAR: Detectar atalhos ANTES de processar fluxo normal
  const atalho = KeywordShortcuts.detectar(responderDto.resposta);
  
  if (atalho && atalho.confianca > 0.8) {
    this.logger.log(
      `🎯 Atalho detectado: ${atalho.categoria} (${atalho.confianca * 100}% confiança)`
    );

    if (atalho.nucleoCodigo) {
      // Buscar núcleo pelo código
      const nucleo = await this.nucleoRepository.findOne({
        where: { codigo: atalho.nucleoCodigo, empresaId, ativo: true },
      });

      if (nucleo) {
        // Confirmar antes de transferir
        sessao.contexto.destinoNucleoId = nucleo.id;
        sessao.contexto.areaTitulo = nucleo.nome.toLowerCase();
        sessao.etapaAtual = 'confirmar-atalho';
        
        await this.sessaoRepository.save(sessao);

        return {
          mensagem: `Entendi! Você precisa de ajuda com ${nucleo.nome}. 

Posso te encaminhar agora para nossa equipe?

1️⃣ Sim, pode encaminhar
2️⃣ Não, quero escolher outra opção`,
          tipo: 'texto',
          aguardaResposta: true,
        };
      }
    }

    if (atalho.acao === 'transferir_geral') {
      // Transferir direto para atendente geral
      const nucleoGeral = await this.nucleoRepository.findOne({
        where: { codigo: 'NUC_GERAL', empresaId, ativo: true },
      });

      if (nucleoGeral) {
        await this.transferirParaNucleo(sessao, nucleoGeral.id);
        return {
          mensagem: '✅ Conectando você com um atendente humano agora...',
          tipo: 'texto',
          aguardaResposta: false,
          transferido: true,
        };
      }
    }
  }

  // Continuar com fluxo normal se não detectou atalho
  // ... código existente do FlowEngine ...
}
```

#### Adicionar Etapa de Confirmação de Atalho

```sql
-- Adicionar no fluxo padrão via migration ou update manual
UPDATE fluxos_triagem
SET estrutura = jsonb_set(
  estrutura,
  '{etapas,confirmar-atalho}',
  '{
    "id": "confirmar-atalho",
    "tipo": "mensagem_menu",
    "mensagem": "Posso te encaminhar agora para nossa equipe?",
    "opcoes": [
      {
        "valor": "1",
        "texto": "Sim, pode encaminhar",
        "acao": "transferir_nucleo",
        "nucleoContextKey": "destinoNucleoId"
      },
      {
        "valor": "2",
        "texto": "Não, quero escolher outra opção",
        "acao": "proximo_passo",
        "proximaEtapa": "boas-vindas"
      }
    ]
  }'::jsonb
)
WHERE codigo = 'FLUXO_PADRAO_WHATSAPP';
```

---

### 2. Melhorar Mensagem de Boas-Vindas (30 min)

```sql
-- Atualizar mensagem de boas-vindas no fluxo
UPDATE fluxos_triagem
SET estrutura = jsonb_set(
  estrutura,
  '{etapas,boas-vindas,mensagem}',
  '"👋 Olá! Eu sou a assistente virtual da ConectCRM.\n\n💡 DICA RÁPIDA: Você pode digitar livremente o que precisa!\nExemplos:\n• \"Quero 2ª via do boleto\"\n• \"Sistema está com erro\"\n• \"Preciso de uma proposta\"\n\nOu escolha uma das opções:\n\n1️⃣ 🔧 Suporte Técnico\n2️⃣ 💰 Financeiro\n3️⃣ 📊 Comercial\n4️⃣ 📋 Acompanhar atendimento\n0️⃣ 👤 Falar com humano\n\n❌ Digite SAIR para cancelar"'::jsonb
)
WHERE codigo = 'FLUXO_PADRAO_WHATSAPP';
```

---

### 3. Adicionar Botão "Não Entendi" (1 hora)

```typescript
// backend/src/modules/triagem/engine/flow-engine.ts

private async construirOpcoes(etapa: Etapa): Promise<BotOption[]> {
  const opcoes = etapa.opcoes || [];

  // 🆕 SEMPRE adicionar opção de ajuda
  opcoes.push({
    valor: 'ajuda',
    texto: '❓ Não entendi essas opções',
    descricao: 'Falar com um atendente humano',
    acao: 'transferir_nucleo',
    nucleoId: await this.buscarNucleoGeralId(),
  });

  return opcoes;
}

private async buscarNucleoGeralId(): Promise<string> {
  const nucleo = await this.nucleoRepository.findOne({
    where: { 
      codigo: 'NUC_GERAL',
      empresaId: this.config.sessao.empresaId,
      ativo: true 
    },
  });
  return nucleo?.id;
}
```

---

### 4. Timeout Automático (2 horas)

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

async verificarTimeout(sessaoId: string): Promise<void> {
  const sessao = await this.sessaoRepository.findOne({
    where: { id: sessaoId },
  });

  if (!sessao || sessao.status !== 'ativa') return;

  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
  const tempoInativo = Date.now() - sessao.updatedAt.getTime();

  if (tempoInativo > TIMEOUT_MS) {
    // Enviar mensagem de timeout
    await this.whatsAppSenderService.enviarMensagemTexto(
      sessao.telefone,
      `⏰ Oi! Percebi que você ficou um tempo sem responder.

Gostaria de:

1️⃣ Continuar de onde parou
2️⃣ Falar com atendente agora
3️⃣ Cancelar (pode voltar depois)`,
    );

    // Marcar como "aguardando_timeout"
    sessao.metadados.timeoutEnviado = true;
    await this.sessaoRepository.save(sessao);
  }
}
```

```typescript
// Criar Job para verificar timeouts (usar Bull Queue ou cron)
// backend/src/modules/triagem/jobs/timeout-checker.job.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TriagemBotService } from '../services/triagem-bot.service';

@Injectable()
export class TimeoutCheckerJob {
  constructor(private readonly botService: TriagemBotService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async verificarTimeouts() {
    // Buscar sessões ativas há mais de 5 minutos
    const sessoes = await this.sessaoRepository.find({
      where: {
        status: 'ativa',
        updatedAt: LessThan(new Date(Date.now() - 5 * 60 * 1000)),
      },
    });

    for (const sessao of sessoes) {
      await this.botService.verificarTimeout(sessao.id);
    }
  }
}
```

---

### 5. Confirmação de Dados Melhorada (1 hora)

```typescript
// backend/src/modules/triagem/utils/confirmation-format.util.ts

export function formatarConfirmacaoDados(contato: Contato): string {
  return `✅ Encontrei seu cadastro em nosso sistema:

┌────────────────────────────────┐
│ 👤 Nome: ${contato.nome || 'Não informado'}
│ 📧 Email: ${contato.email || 'Não informado'}
│ 🏢 Empresa: ${contato.empresa?.nome || 'Não informada'}
│ 📱 Telefone: ${contato.telefone}
└────────────────────────────────┘

Esses dados estão corretos?

💡 Se algo mudou, posso atualizar para você agora!

1️⃣ Sim, está tudo certo
2️⃣ Atualizar meus dados`;
}
```

---

## 🔥 SPRINT 1: NLP + Base de Conhecimento (2 semanas)

### Parte 1: NLP / Intent Recognition (Semana 1)

#### 1.1. Instalar Dependências

```bash
cd backend
npm install openai --save
npm install @types/node --save-dev
```

#### 1.2. Configurar OpenAI

```typescript
// backend/src/config/openai.config.ts

import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

export const openAIProvider = {
  provide: 'OPENAI',
  useFactory: (configService: ConfigService) => {
    return new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
  },
  inject: [ConfigService],
};
```

```typescript
// backend/src/modules/triagem/triagem.module.ts

import { openAIProvider } from '../../config/openai.config';

@Module({
  providers: [
    // ... providers existentes
    openAIProvider,
  ],
})
export class TriagemModule {}
```

#### 1.3. Criar Serviço de NLP

```typescript
// backend/src/modules/triagem/services/nlp.service.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';

export interface IntentDetectionResult {
  intencao: 'financeiro' | 'tecnico' | 'comercial' | 'status' | 'outro';
  confianca: number; // 0.0 - 1.0
  entidades?: {
    tipo: string;
    valor: string;
  }[];
  explicacao?: string;
}

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);

  constructor(@Inject('OPENAI') private readonly openai: OpenAI) {}

  /**
   * Detecta a intenção do usuário usando GPT-4
   */
  async detectarIntencao(mensagem: string): Promise<IntentDetectionResult> {
    try {
      const prompt = this.construirPrompt(mensagem);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Baixa temperatura para mais consistência
        max_tokens: 500,
      });

      const resultado = JSON.parse(response.choices[0].message.content);
      
      this.logger.log(
        `🧠 NLP: "${mensagem}" → ${resultado.intencao} (${resultado.confianca * 100}%)`
      );

      return resultado;
    } catch (error) {
      this.logger.error('Erro ao detectar intenção com GPT-4:', error);
      
      // Fallback para detecção baseada em keywords
      return this.fallbackKeywordDetection(mensagem);
    }
  }

  private construirPrompt(mensagem: string): string {
    return `Você é um assistente de classificação de intenções para um sistema de atendimento ao cliente.

Analise a mensagem do cliente e identifique:
1. Intenção principal (financeiro, tecnico, comercial, status, outro)
2. Nível de confiança (0.0 a 1.0)
3. Entidades relevantes (se houver)

**Categorias de Intenção:**
- **financeiro**: boleto, fatura, pagamento, cobrança, nota fiscal, reembolso, cancelamento de assinatura
- **tecnico**: erro, bug, problema técnico, não funciona, lentidão, integração, API, suporte
- **comercial**: plano, upgrade, proposta, orçamento, demonstração, trial, contratação
- **status**: acompanhar ticket, status do atendimento, protocolo, número do chamado
- **outro**: qualquer coisa que não se encaixe nas categorias acima

**Mensagem do cliente:**
"${mensagem}"

**Responda APENAS em JSON válido no seguinte formato:**
{
  "intencao": "financeiro" | "tecnico" | "comercial" | "status" | "outro",
  "confianca": 0.85,
  "entidades": [
    { "tipo": "documento", "valor": "boleto" },
    { "tipo": "acao", "valor": "segunda via" }
  ],
  "explicacao": "Cliente solicita segunda via de boleto - claro indicador de intenção financeira"
}`;
  }

  /**
   * Fallback usando keywords caso GPT-4 falhe
   */
  private fallbackKeywordDetection(mensagem: string): IntentDetectionResult {
    const texto = mensagem.toLowerCase();

    const padroes = {
      financeiro: ['boleto', 'fatura', 'pagamento', 'cobrança', 'nf', 'nota fiscal'],
      tecnico: ['erro', 'bug', 'problema', 'não funciona', 'lento', 'suporte'],
      comercial: ['plano', 'upgrade', 'proposta', 'orçamento', 'demonstração'],
      status: ['status', 'protocolo', 'ticket', 'chamado', 'acompanhar'],
    };

    for (const [intencao, keywords] of Object.entries(padroes)) {
      for (const keyword of keywords) {
        if (texto.includes(keyword)) {
          return {
            intencao: intencao as any,
            confianca: 0.7, // Confiança média para fallback
            explicacao: `Fallback: palavra-chave "${keyword}" detectada`,
          };
        }
      }
    }

    return {
      intencao: 'outro',
      confianca: 0.3,
      explicacao: 'Nenhum padrão conhecido identificado',
    };
  }

  /**
   * Extrai entidades nomeadas (NER) da mensagem
   */
  async extrairEntidades(mensagem: string): Promise<Array<{ tipo: string; valor: string }>> {
    // Implementar se necessário (CPF, CNPJ, números de protocolo, etc.)
    const entidades: Array<{ tipo: string; valor: string }> = [];

    // Regex para CPF
    const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
    const cpfs = mensagem.match(cpfRegex);
    if (cpfs) {
      cpfs.forEach(cpf => entidades.push({ tipo: 'cpf', valor: cpf }));
    }

    // Regex para protocolo/ticket
    const protocoloRegex = /#?\d{4,}/g;
    const protocolos = mensagem.match(protocoloRegex);
    if (protocolos) {
      protocolos.forEach(p => entidades.push({ tipo: 'protocolo', valor: p }));
    }

    return entidades;
  }
}
```

#### 1.4. Integrar NLP no Bot

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

import { NLPService } from './nlp.service';

constructor(
  // ... injeções existentes
  private readonly nlpService: NLPService,
) {}

async processarMensagemWhatsApp(
  empresaId: string,
  payload: any,
): Promise<ResultadoProcessamentoWebhook> {
  // ... código existente ...

  // 🆕 Se não há sessão ativa, usar NLP para detectar intenção
  if (!sessaoAtiva) {
    const intencao = await this.nlpService.detectarIntencao(dadosMensagem.texto);

    if (intencao.confianca > 0.75) {
      // Confiança alta - ir direto para núcleo correspondente
      const nucleoCodigo = this.mapearIntencaoParaNucleo(intencao.intencao);
      const nucleo = await this.buscarNucleoPorCodigo(empresaId, nucleoCodigo);

      if (nucleo) {
        // Criar sessão e iniciar direto na confirmação
        const sessao = await this.criarSessaoComIntencao(
          empresaId,
          dadosMensagem,
          nucleo,
          intencao
        );

        return {
          novaSessao: true,
          sessaoId: sessao.id,
          intencaoDetectada: intencao,
          bypassMenu: true,
        };
      }
    }
  }

  // ... continuar com fluxo normal
}

private mapearIntencaoParaNucleo(intencao: string): string {
  const mapeamento = {
    financeiro: 'NUC_FINANCEIRO',
    tecnico: 'NUC_SUPORTE',
    comercial: 'NUC_COMERCIAL',
    status: 'NUC_GERAL',
  };
  return mapeamento[intencao] || 'NUC_GERAL';
}
```

---

### Parte 2: Base de Conhecimento (Semana 2)

#### 2.1. Criar Entidades

```typescript
// backend/src/modules/triagem/entities/article.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Empresa } from '../../empresas/empresa.entity';

@Entity('articles_base_conhecimento')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text')
  conteudo: string;

  @Column({ nullable: true })
  resumo: string;

  @Column('simple-array', { default: '' })
  palavrasChave: string[];

  @Column('simple-array', { default: '' })
  categorias: string[]; // ['financeiro', 'tecnico', etc]

  @Column({ default: true })
  visivelNoBot: boolean;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'int', default: 0 })
  visualizacoes: number;

  @Column({ type: 'int', default: 0 })
  ajudouClientes: number; // Contador de "sim, resolveu"

  @Column({ type: 'int', default: 0 })
  naoAjudouClientes: number; // Contador de "não resolveu"

  @Column({ nullable: true })
  urlExterna: string; // Link para central de ajuda externa

  @ManyToOne(() => Empresa)
  empresa: Empresa;

  @Column()
  empresaId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

```typescript
// Criar migration
npm run migration:generate -- src/migrations/CreateArticlesTable
npm run migration:run
```

#### 2.2. Criar Service de Busca

```typescript
// backend/src/modules/triagem/services/knowledge-base.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';

export interface ArticleSearchResult {
  article: Article;
  relevancia: number;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  /**
   * Busca artigos relevantes para a mensagem do usuário
   */
  async buscarArtigosRelevantes(
    empresaId: string,
    mensagem: string,
    limite: number = 3,
  ): Promise<ArticleSearchResult[]> {
    const palavras = this.extrairPalavrasChave(mensagem);

    // Buscar artigos usando full-text search
    const query = this.articleRepository
      .createQueryBuilder('article')
      .where('article.empresaId = :empresaId', { empresaId })
      .andWhere('article.ativo = TRUE')
      .andWhere('article.visivelNoBot = TRUE');

    // Adicionar condições de busca para cada palavra
    palavras.forEach((palavra, idx) => {
      query.orWhere(
        `(
          article.titulo ILIKE :palavra${idx} OR
          article.conteudo ILIKE :palavra${idx} OR
          :palavra${idx} = ANY(article.palavrasChave)
        )`,
        { [`palavra${idx}`]: `%${palavra}%` }
      );
    });

    const artigos = await query.getMany();

    // Calcular relevância
    const resultados = artigos.map(article => ({
      article,
      relevancia: this.calcularRelevancia(article, palavras),
    }));

    // Ordenar por relevância
    resultados.sort((a, b) => b.relevancia - a.relevancia);

    return resultados.slice(0, limite);
  }

  private extrairPalavrasChave(mensagem: string): string[] {
    // Remover stopwords e palavras curtas
    const stopwords = ['o', 'a', 'de', 'da', 'do', 'para', 'com', 'em', 'que', 'como'];
    
    return mensagem
      .toLowerCase()
      .split(/\s+/)
      .filter(p => p.length > 3 && !stopwords.includes(p));
  }

  private calcularRelevancia(article: Article, palavras: string[]): number {
    let score = 0;

    palavras.forEach(palavra => {
      // Título (peso maior)
      if (article.titulo.toLowerCase().includes(palavra)) {
        score += 3;
      }

      // Palavras-chave (peso médio)
      if (article.palavrasChave.some(k => k.toLowerCase().includes(palavra))) {
        score += 2;
      }

      // Conteúdo (peso menor)
      if (article.conteudo.toLowerCase().includes(palavra)) {
        score += 1;
      }
    });

    // Bonus por taxa de sucesso
    const sucessoRate = article.ajudouClientes / (article.ajudouClientes + article.naoAjudouClientes + 1);
    score *= (1 + sucessoRate);

    return score;
  }

  /**
   * Registra feedback do usuário
   */
  async registrarFeedback(articleId: string, ajudou: boolean): Promise<void> {
    await this.articleRepository.increment(
      { id: articleId },
      ajudou ? 'ajudouClientes' : 'naoAjudouClientes',
      1
    );
  }
}
```

#### 2.3. Adicionar Etapa de Self-Service no Fluxo

```json
{
  "busca-artigos": {
    "id": "busca-artigos",
    "tipo": "acao",
    "acao": "buscar_artigos",
    "mensagem": "🔍 Deixe-me buscar na central de ajuda...",
    "autoAvancar": true,
    "proximaEtapa": "exibir-artigos"
  },
  "exibir-artigos": {
    "id": "exibir-artigos",
    "tipo": "mensagem_menu",
    "mensagem": "📚 Encontrei estes artigos que podem te ajudar:\n\n{artigos}\n\nAlgum desses resolveu sua dúvida?",
    "opcoes": [
      {
        "valor": "sim",
        "texto": "✅ Sim, resolveu!",
        "acao": "finalizar_com_feedback",
        "feedbackPositivo": true
      },
      {
        "valor": "nao",
        "texto": "❌ Não, quero falar com atendente",
        "acao": "transferir_nucleo"
      },
      {
        "valor": "ver_mais",
        "texto": "📖 Ver mais artigos",
        "acao": "buscar_mais_artigos"
      }
    ]
  }
}
```

#### 2.4. Implementar Ação no FlowEngine

```typescript
// backend/src/modules/triagem/engine/flow-engine.ts

import { KnowledgeBaseService } from '../services/knowledge-base.service';

async processarAcao(etapa: Etapa): Promise<StepBuildResult> {
  if (etapa.acao === 'buscar_artigos') {
    const artigos = await this.helpers.buscarArtigos(
      this.config.sessao,
      this.config.sessao.contexto.resumoSolicitacao || ''
    );

    // Salvar artigos no contexto
    this.config.sessao.metadados.artigosSugeridos = artigos.map(a => ({
      id: a.article.id,
      titulo: a.article.titulo,
      relevancia: a.relevancia,
    }));

    // Formatar mensagem com artigos
    const mensagemArtigos = artigos
      .map((a, idx) => `${idx + 1}. 📄 *${a.article.titulo}*\n   ${a.article.resumo}\n   ${a.article.urlExterna || ''}`)
      .join('\n\n');

    this.config.sessao.contexto.artigos = mensagemArtigos;

    return {
      resposta: {
        mensagem: etapa.mensagem,
        tipo: 'texto',
      },
      autoAvancar: true,
      proximaEtapaId: etapa.proximaEtapa,
    };
  }

  // ... outras ações
}
```

---

## 🎯 SPRINT 2: Sentimento + Contexto (1 semana)

### Parte 1: Análise de Sentimento (3 dias)

#### 2.1. Instalar Biblioteca

```bash
npm install sentiment natural --save
npm install @types/natural --save-dev
```

#### 2.2. Criar Serviço

```typescript
// backend/src/modules/triagem/services/sentiment-analysis.service.ts

import { Injectable, Logger } from '@nestjs/common';
import Sentiment from 'sentiment';

export interface SentimentResult {
  score: number; // -5 (muito negativo) a +5 (muito positivo)
  nivel: 'muito_negativo' | 'negativo' | 'neutro' | 'positivo' | 'muito_positivo';
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  acoesSugeridas: string[];
  palavrasChave: {
    positivas: string[];
    negativas: string[];
  };
}

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);
  private readonly sentiment = new Sentiment();

  // Dicionário customizado português
  private readonly customDict = {
    excelente: 5,
    ótimo: 4,
    bom: 3,
    obrigado: 2,
    ridículo: -4,
    péssimo: -5,
    horrível: -5,
    lento: -2,
    travando: -3,
    urgente: -2,
    'não funciona': -4,
    frustrado: -3,
    indignado: -4,
  };

  analisar(mensagem: string, historico: string[] = []): SentimentResult {
    // Análise da mensagem atual
    const result = this.sentiment.analyze(mensagem, {
      extras: this.customDict,
    });

    // Considerar histórico (se usuário já estava frustrado)
    let scoreAjustado = result.score;
    if (historico.length > 0) {
      const historicoNegativo = historico.filter(m => 
        this.sentiment.analyze(m).score < -1
      ).length;
      
      if (historicoNegativo > 2) {
        scoreAjustado -= 2; // Penaliza se já estava frustrado antes
      }
    }

    // Classificar nível
    let nivel: SentimentResult['nivel'];
    if (scoreAjustado <= -3) nivel = 'muito_negativo';
    else if (scoreAjustado < -1) nivel = 'negativo';
    else if (scoreAjustado >= 3) nivel = 'muito_positivo';
    else if (scoreAjustado > 1) nivel = 'positivo';
    else nivel = 'neutro';

    // Determinar urgência
    const palavrasUrgencia = ['urgente', 'agora', 'imediato', 'crítico', 'parado'];
    const temUrgencia = palavrasUrgencia.some(p => 
      mensagem.toLowerCase().includes(p)
    );

    let urgencia: SentimentResult['urgencia'];
    if (nivel === 'muito_negativo' || temUrgencia) {
      urgencia = 'critica';
    } else if (nivel === 'negativo') {
      urgencia = 'alta';
    } else if (result.comparative < -0.5) {
      urgencia = 'media';
    } else {
      urgencia = 'baixa';
    }

    // Ações sugeridas
    const acoes = this.determinarAcoes(nivel, urgencia);

    this.logger.log(
      `😊 Sentimento: "${mensagem}" → ${nivel} (score: ${scoreAjustado}, urgência: ${urgencia})`
    );

    return {
      score: scoreAjustado,
      nivel,
      urgencia,
      acoesSugeridas: acoes,
      palavrasChave: {
        positivas: result.positive,
        negativas: result.negative,
      },
    };
  }

  private determinarAcoes(
    nivel: SentimentResult['nivel'],
    urgencia: SentimentResult['urgencia'],
  ): string[] {
    const acoes: string[] = [];

    if (nivel === 'muito_negativo') {
      acoes.push('priorizar_ticket');
      acoes.push('notificar_supervisor');
      acoes.push('bypass_para_humano');
    }

    if (nivel === 'negativo') {
      acoes.push('priorizar_ticket');
      acoes.push('reduzir_burocracia');
    }

    if (urgencia === 'critica') {
      acoes.push('prioridade_maxima');
      acoes.push('atendimento_imediato');
    }

    if (nivel === 'positivo' || nivel === 'muito_positivo') {
      acoes.push('agradecer');
      acoes.push('pedir_avaliacao');
    }

    return acoes;
  }
}
```

#### 2.3. Integrar no Bot

```typescript
// backend/src/modules/triagem/services/triagem-bot.service.ts

import { SentimentAnalysisService } from './sentiment-analysis.service';

async processarResposta(...): Promise<RespostaBot> {
  // ... código existente ...

  // 🆕 Análisar sentimento
  const historicoMensagens = sessao.historico
    .filter(h => h.tipo === 'usuario')
    .map(h => h.mensagem);

  const sentimento = await this.sentimentService.analisar(
    responderDto.resposta,
    historicoMensagens
  );

  // Salvar no contexto
  sessao.metadados.sentimento = sentimento;

  // Aplicar ações
  if (sentimento.acoesSugeridas.includes('bypass_para_humano')) {
    this.logger.warn(
      `⚠️ Cliente muito insatisfeito! Transferindo imediatamente para supervisor.`
    );

    // Buscar núcleo com flag "supervisor"
    const nucleoSupervisor = await this.nucleoRepository.findOne({
      where: { 
        codigo: 'NUC_SUPERVISOR',
        empresaId: sessao.empresaId,
      },
    });

    if (nucleoSupervisor) {
      await this.transferirParaNucleo(sessao, nucleoSupervisor.id, {
        prioridade: 'URGENTE',
        tags: ['cliente-insatisfeito', 'escalado'],
      });

      return {
        mensagem: `Entendo sua frustração. Vou conectar você AGORA com um supervisor que pode te ajudar melhor. Aguarde só um instante.`,
        tipo: 'texto',
        transferido: true,
      };
    }
  }

  if (sentimento.acoesSugeridas.includes('priorizar_ticket')) {
    sessao.metadados.prioridade = 'ALTA';
  }

  // ... continuar fluxo normal
}
```

---

### Parte 2: Contexto entre Sessões (4 dias)

```typescript
// backend/src/modules/triagem/services/context-manager.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import { Ticket } from '../../atendimento/entities/ticket.entity';

export interface ClienteContexto {
  ultimaSessao?: SessaoTriagem;
  sessoesRecentes: SessaoTriagem[];
  ticketsAbertos: Ticket[];
  ticketsRecentes: Ticket[];
  assuntosFrequentes: string[];
  nucleoPreferido?: string;
}

@Injectable()
export class ContextManagerService {
  constructor(
    @InjectRepository(SessaoTriagem)
    private readonly sessaoRepository: Repository<SessaoTriagem>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async buscarContextoCliente(
    empresaId: string,
    telefone: string,
  ): Promise<ClienteContexto> {
    const dataLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias

    // Sessões recentes
    const sessoesRecentes = await this.sessaoRepository.find({
      where: {
        empresaId,
        telefone,
        createdAt: MoreThan(dataLimite),
      },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Tickets abertos
    const ticketsAbertos = await this.ticketRepository.find({
      where: {
        empresaId,
        'contato.telefone': telefone,
        status: In(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE']),
      },
    });

    // Tickets recentes (fechados nos últimos 7 dias)
    const ticketsRecentes = await this.ticketRepository.find({
      where: {
        empresaId,
        'contato.telefone': telefone,
        status: In(['RESOLVIDO', 'FECHADO']),
        updatedAt: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      },
      order: { updatedAt: 'DESC' },
      take: 3,
    });

    // Analisar assuntos frequentes
    const assuntos = sessoesRecentes
      .map(s => s.contexto?.areaTitulo)
      .filter(Boolean);
    const assuntosFrequentes = this.contarFrequencia(assuntos);

    // Núcleo mais usado
    const nucleos = sessoesRecentes
      .map(s => s.nucleoId)
      .filter(Boolean);
    const nucleoPreferido = nucleos.length > 0 ? nucleos[0] : undefined;

    return {
      ultimaSessao: sessoesRecentes[0],
      sessoesRecentes,
      ticketsAbertos,
      ticketsRecentes,
      assuntosFrequentes,
      nucleoPreferido,
    };
  }

  private contarFrequencia(items: string[]): string[] {
    const contador = {};
    items.forEach(item => {
      contador[item] = (contador[item] || 0) + 1;
    });

    return Object.entries(contador)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([item]) => item);
  }

  gerarMensagemContextual(contexto: ClienteContexto, nomeCliente: string): string {
    let mensagem = `👋 Olá ${nomeCliente}! `;

    if (contexto.ticketsAbertos.length > 0) {
      mensagem += `\n\n📋 Vejo que você tem ${contexto.ticketsAbertos.length} atendimento(s) em aberto:\n`;
      
      contexto.ticketsAbertos.forEach((ticket, idx) => {
        mensagem += `\n${idx + 1}. *Ticket #${ticket.numero}*`;
        mensagem += `\n   ${ticket.assunto}`;
        mensagem += `\n   Status: ${this.traduzirStatus(ticket.status)}`;
      });

      mensagem += `\n\nVocê gostaria de:`;
      mensagem += `\n1️⃣ Acompanhar um desses atendimentos`;
      mensagem += `\n2️⃣ Abrir um novo atendimento`;
    } else if (contexto.ticketsRecentes.length > 0) {
      const ultimo = contexto.ticketsRecentes[0];
      mensagem += `Vejo que recentemente você teve um atendimento sobre "${ultimo.assunto}" que foi ${this.traduzirStatus(ultimo.status)}.`;
      mensagem += `\n\nEm que posso ajudar hoje?`;
    } else {
      mensagem += `Como posso te ajudar hoje?`;
    }

    return mensagem;
  }

  private traduzirStatus(status: string): string {
    const traducao = {
      ABERTO: 'Aberto',
      EM_ANDAMENTO: 'Em andamento',
      AGUARDANDO_CLIENTE: 'Aguardando sua resposta',
      RESOLVIDO: 'Resolvido',
      FECHADO: 'Concluído',
    };
    return traducao[status] || status;
  }
}
```

---

## 📊 SPRINT 3: Analytics + Handoff (1 semana)

### Dashboard de Analytics do Bot

```typescript
// backend/src/modules/triagem/controllers/bot-analytics.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BotAnalyticsService } from '../services/bot-analytics.service';

@Controller('bot-analytics')
@UseGuards(JwtAuthGuard)
export class BotAnalyticsController {
  constructor(private readonly analyticsService: BotAnalyticsService) {}

  @Get('/metrics')
  async getMetrics(
    @Query('empresaId') empresaId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.calcularMetricas(
      empresaId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('/intent-distribution')
  async getIntentDistribution(@Query('empresaId') empresaId: string) {
    return this.analyticsService.distribuicaoIntencoes(empresaId);
  }

  @Get('/fallback-points')
  async getFallbackPoints(@Query('empresaId') empresaId: string) {
    return this.analyticsService.pontosFalha(empresaId);
  }
}
```

```typescript
// backend/src/modules/triagem/services/bot-analytics.service.ts

export interface BotMetrics {
  totalSessoes: number;
  deflectionRate: number; // % resolvidos sem humano
  resolutionRate: number;
  handoffRate: number;
  tempoMedioTriagem: number; // segundos
  csatMedio: number;
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  pontosFalha: Array<{ etapa: string; taxa: number }>;
}

@Injectable()
export class BotAnalyticsService {
  async calcularMetricas(
    empresaId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BotMetrics> {
    const sessoes = await this.sessaoRepository.find({
      where: {
        empresaId,
        createdAt: Between(startDate, endDate),
      },
    });

    const total = sessoes.length;
    const resolvidas = sessoes.filter(s => s.metadados?.resolveuComBot).length;
    const transferidas = sessoes.filter(s => s.status === 'transferida').length;

    const deflectionRate = (resolvidas / total) * 100;
    const handoffRate = (transferidas / total) * 100;

    const tempoMedioTriagem = 
      sessoes.reduce((acc, s) => acc + (s.metadados?.duracaoSegundos || 0), 0) / total;

    const csats = sessoes
      .map(s => s.metadados?.csat)
      .filter(c => c !== undefined && c !== null);
    const csatMedio = csats.length > 0
      ? csats.reduce((a, b) => a + b, 0) / csats.length
      : 0;

    return {
      totalSessoes: total,
      deflectionRate,
      resolutionRate: deflectionRate, // Simplificado
      handoffRate,
      tempoMedioTriagem,
      csatMedio,
      topIntents: await this.calcularTopIntents(sessoes),
      pontosFalha: await this.calcularPontosFalha(sessoes),
    };
  }
}
```

---

## ✅ TESTES E VALIDAÇÃO

### Checklist de Testes

#### Quick Wins
- [ ] Atalhos de texto funcionando (boleto → Financeiro)
- [ ] Mensagem de boas-vindas melhorada exibida
- [ ] Botão "Não entendi" aparece em todos os menus
- [ ] Timeout automático funciona (após 5min)
- [ ] Confirmação de dados formatada corretamente

#### Sprint 1 - NLP
- [ ] GPT-4 detecta intenção com >75% confiança
- [ ] Fallback para keywords funciona se GPT-4 falha
- [ ] Cliente consegue escrever livremente
- [ ] Base de conhecimento retorna artigos relevantes
- [ ] Feedback "sim/não" registrado corretamente
- [ ] Deflection rate sendo medido

#### Sprint 2 - Sentimento
- [ ] Sentimento negativo detectado corretamente
- [ ] Cliente frustrado priorizado automaticamente
- [ ] Bypass para supervisor funciona
- [ ] Contexto de sessões anteriores carregado
- [ ] Tickets abertos exibidos ao reiniciar conversa

#### Sprint 3 - Analytics
- [ ] Dashboard exibe métricas corretas
- [ ] Deflection rate calculado
- [ ] Top intents exibidos
- [ ] Pontos de falha identificados
- [ ] Warm handoff com contexto completo

---

## 📈 MÉTRICAS DE ACOMPANHAMENTO

### KPIs Semanais

```sql
-- Deflection Rate (última semana)
SELECT 
  COUNT(CASE WHEN metadados->>'resolveuComBot' = 'true' THEN 1 END)::float / 
  COUNT(*)::float * 100 as deflection_rate
FROM sessoes_triagem
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND status IN ('finalizada', 'transferida');

-- Tempo médio de triagem
SELECT 
  AVG((metadados->>'duracaoSegundos')::int) as tempo_medio_segundos
FROM sessoes_triagem
WHERE created_at >= NOW() - INTERVAL '7 days';

-- CSAT Bot
SELECT 
  AVG((metadados->>'csat')::float) as csat_medio
FROM sessoes_triagem
WHERE metadados->>'csat' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days';

-- Top 5 Intents
SELECT 
  metadados->>'intencaoDetectada'->>'intencao' as intent,
  COUNT(*) as total,
  COUNT(*)::float / SUM(COUNT(*)) OVER () * 100 as percentual
FROM sessoes_triagem
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND metadados->>'intencaoDetectada' IS NOT NULL
GROUP BY metadados->>'intencaoDetectada'->>'intencao'
ORDER BY total DESC
LIMIT 5;
```

---

## 🎯 CRONOGRAMA RESUMIDO

| Sprint | Duração | Entregáveis | Impacto Esperado |
|---|---|---|---|
| **Quick Wins** | 2-3 dias | Atalhos, mensagens, timeout | +15% satisfação |
| **Sprint 1** | 2 semanas | NLP + Base Conhecimento | 30-40% deflection |
| **Sprint 2** | 1 semana | Sentimento + Contexto | +20% CSAT |
| **Sprint 3** | 1 semana | Analytics + Handoff | Visibilidade total |

**Total**: ~5 semanas para transformação completa

---

**Próxima Ação**: Começar pelos Quick Wins (2-3 dias) para ganhos imediatos!

**Última atualização**: 10 de novembro de 2025
