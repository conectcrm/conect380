# 🏗️ ARQUITETURA DAS MELHORIAS - Visão Técnica

**Status**: ✅ **Implementado e Testado**  
**Data**: 10 de novembro de 2025

---

## 🔄 FLUXO GERAL DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO (WhatsApp)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Envia mensagem
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK WHATSAPP                              │
│                                                                  │
│  • Recebe mensagem do usuário                                   │
│  • Identifica telefone e contexto                               │
│  • Encaminha para TriagemBotService                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              TriagemBotService.processarResposta()              │
│                                                                  │
│  1️⃣  Buscar ou criar sessão ativa                              │
│  2️⃣  Verificar se é resposta a timeout                         │
│  3️⃣  Detectar keywords (KeywordShortcuts.detectar())           │
│  4️⃣  Processar etapa atual do fluxo                            │
│  5️⃣  Executar ação (FlowEngine.executarEtapa())               │
└─────────┬───────────────────┬───────────────────────────────────┘
          │                   │
          │                   │ Se confiança ≥ 80%
          │                   ▼
          │         ┌─────────────────────────┐
          │         │  KeywordShortcuts       │
          │         │                         │
          │         │  • 50+ keywords         │
          │         │  • 6 categorias         │
          │         │  • Confiança 0.0-1.0   │
          │         │  • Urgência/frustração │
          │         └─────────┬───────────────┘
          │                   │
          │                   │ Redireciona para
          │                   ▼
          │         ┌─────────────────────────┐
          │         │  Etapa: confirmar-atalho│
          │         │                         │
          │         │  "Entendi que você quer │
          │         │   falar sobre X.        │
          │         │   Confirma?"            │
          │         │                         │
          │         │  1️⃣  Sim, encaminhar   │
          │         │  2️⃣  Não, outra opção  │
          │         └─────────────────────────┘
          │
          │ Processa etapa normal
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FlowEngine.executarEtapa()                  │
│                                                                  │
│  • Busca etapa no JSON do fluxo                                 │
│  • Renderiza mensagem com variáveis                             │
│  • Adiciona opções (incluindo "❓ Não entendi")                │
│  • Executa ações (transferir, coletar, etc.)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Envia resposta
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WhatsAppSenderService                          │
│                                                                  │
│  • Formata mensagem para WhatsApp                              │
│  • Adiciona botões interativos (reply/list)                    │
│  • Envia via API oficial Meta                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Retorna para
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO (WhatsApp)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏰ SISTEMA DE TIMEOUT (Paralelo)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TimeoutCheckerJob (Cron)                      │
│                                                                  │
│  • Executa a cada 1 minuto                                      │
│  • Busca sessões inativas há 5+ minutos                        │
│  • Busca sessões inativas há 10+ minutos                       │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ├─────────────────────────────────────────┐
          │                                         │
          │ 5 minutos inativo                       │ 10 minutos inativo
          ▼                                         ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│  enviarAvisoTimeout()   │           │  cancelarSessao()       │
│                         │           │                         │
│  1. Marca flag timeout  │           │  1. Atualiza status     │
│  2. Envia mensagem:     │           │     para 'cancelada'    │
│                         │           │  2. Define motivo       │
│  "⏰ Você ficou sem     │           │  3. Envia mensagem:     │
│   responder.            │           │                         │
│   Gostaria de:          │           │  "⏰ Atendimento        │
│   1️⃣ Continuar         │           │   cancelado por         │
│   2️⃣ Atendente         │           │   inatividade."         │
│   3️⃣ Cancelar"         │           │                         │
└─────────┬───────────────┘           └─────────────────────────┘
          │
          │ Usuário responde "1", "2" ou "3"
          ▼
┌─────────────────────────────────────────────────────────────────┐
│           TriagemBotService.processarResposta()                 │
│           (verifica metadados.timeoutAvisoEnviado)              │
│                                                                  │
│  • Resposta "1" ou "continuar"  → Reseta flag, continua        │
│  • Resposta "2" ou "atendente"  → Transfere para núcleo        │
│  • Resposta "3" ou "cancelar"   → Cancela sessão               │
│  • Qualquer outro texto         → Continua e processa          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 DETECÇÃO DE KEYWORDS

```
Usuário envia texto livre: "quero 2ª via do boleto"
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              KeywordShortcuts.detectar(texto)                    │
│                                                                  │
│  1. Normaliza texto (lowercase, remove acentos)                 │
│  2. Tokeniza em palavras                                        │
│  3. Busca em 6 categorias de keywords                          │
│  4. Calcula confiança por categoria                            │
│  5. Detecta urgência ("urgente", "agora")                      │
│  6. Detecta frustração ("ridículo", "péssimo")                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Resultado
                      ▼
        {
          categoria: 'financeiro',
          confianca: 0.90,
          palavrasEncontradas: ['boleto'],
          urgente: false,
          frustrado: false
        }
                      │
                      │ Se confiança ≥ 0.80
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TriagemBotService                            │
│                                                                  │
│  1. Busca núcleo pela categoria ('financeiro')                  │
│  2. Salva nucleoIdAtalho no contexto da sessão                 │
│  3. Redireciona para etapa 'confirmar-atalho'                  │
│  4. Log: "🎯 [ATALHO] Detectado: financeiro (90%)"            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
        Usuário confirma → Transfere para núcleo correto
```

---

## 📋 ESTRUTURA DE DADOS

### Sessão de Triagem
```typescript
interface SessaoTriagem {
  id: string;                          // UUID
  telefone: string;                    // +5511999999999
  status: 'em_andamento' | 'concluida' | 'cancelada';
  fluxoId: string;                     // FK para fluxos_triagem
  etapaAtual: string;                  // ID da etapa atual
  contexto: {
    nucleoIdAtalho?: string;           // ✨ NOVO: ID do núcleo via atalho
    ...
  };
  metadados?: {
    timeoutAvisoEnviado?: boolean;     // ✨ NOVO: Flag de aviso enviado
    timeoutAvisoDataHora?: Date;       // ✨ NOVO: Quando aviso foi enviado
    timeoutContinuado?: boolean;       // ✨ NOVO: Usuário escolheu continuar
    timeoutTransferido?: boolean;      // ✨ NOVO: Usuário pediu atendente
    motivoCancelamento?: string;       // ✨ NOVO: 'timeout_automatico' | ...
  };
  createdAt: Date;
  updatedAt: Date;                     // ✨ Usado para calcular inatividade
}
```

### Fluxo de Triagem
```typescript
interface FluxoTriagem {
  id: string;
  nome: string;
  ativo: boolean;
  estrutura: {
    etapas: {
      'boas-vindas': {
        id: 'boas-vindas',
        tipo: 'menu',
        mensagem: '👋 Olá! Eu sou a assistente virtual...', // ✨ MELHORADO
        opcoes: [...],
      },
      'confirmar-atalho': {              // ✨ NOVO: Etapa de confirmação
        id: 'confirmar-atalho',
        tipo: 'menu',
        mensagem: 'Entendi que você quer falar sobre {{categoria}}. Confirma?',
        opcoes: [
          { numero: '1', texto: 'Sim, pode encaminhar', proximaEtapa: 'transferir' },
          { numero: '2', texto: 'Não, quero outra opção', proximaEtapa: 'menu-nucleos' },
        ],
      },
      ...
    },
  };
}
```

---

## 🔧 COMPONENTES IMPLEMENTADOS

### 1. KeywordShortcuts (Utilitário)
**Arquivo**: `backend/src/modules/triagem/utils/keyword-shortcuts.util.ts`  
**Linhas**: 140

```typescript
export class KeywordShortcuts {
  // Categorias de keywords
  private static readonly KEYWORDS_FINANCEIRO = ['boleto', 'fatura', ...];
  private static readonly KEYWORDS_SUPORTE = ['erro', 'bug', ...];
  private static readonly KEYWORDS_COMERCIAL = ['plano', 'upgrade', ...];
  // ... 6 categorias no total

  // Método principal
  static detectar(texto: string): DeteccaoResult | null {
    // 1. Normaliza texto
    // 2. Busca em todas as categorias
    // 3. Calcula confiança
    // 4. Detecta urgência/frustração
    // 5. Retorna resultado ou null
  }

  static detectarMultiplos(texto: string): DeteccaoResult[] {
    // Para casos ambíguos (múltiplas categorias detectadas)
  }

  static detectarUrgencia(texto: string): boolean {
    // "urgente", "agora", "imediato", "já"
  }

  static detectarFrustracao(texto: string): boolean {
    // "ridículo", "péssimo", "horrível"
  }
}
```

---

### 2. TimeoutCheckerJob (Cron Service)
**Arquivo**: `backend/src/modules/triagem/jobs/timeout-checker.job.ts`  
**Linhas**: 156

```typescript
@Injectable()
export class TimeoutCheckerJob {
  constructor(
    @InjectRepository(SessaoTriagem)
    private readonly sessaoRepository: Repository<SessaoTriagem>,
    private readonly whatsappSender: WhatsAppSenderService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async verificarTimeouts() {
    // 1. Buscar sessões ativas
    // 2. Calcular tempo de inatividade
    // 3. Processar avisos (5 minutos)
    // 4. Processar cancelamentos (10 minutos)
  }

  private async enviarAvisoTimeout(sessao: SessaoTriagem) {
    // 1. Marcar flag timeoutAvisoEnviado
    // 2. Enviar mensagem com opções (1/2/3)
    // 3. Log
  }

  private async cancelarSessaoPorTimeout(sessao: SessaoTriagem) {
    // 1. Atualizar status para 'cancelada'
    // 2. Definir motivoCancelamento
    // 3. Enviar mensagem de despedida
    // 4. Log
  }
}
```

---

### 3. TriagemBotService (Modificações)
**Arquivo**: `backend/src/modules/triagem/services/triagem-bot.service.ts`  
**Linhas Adicionadas**: +197

#### Adição 1: Detecção de Keywords (linhas 696-770)
```typescript
async processarResposta(telefone: string, mensagem: string) {
  // ... código existente ...

  // 🎯 NOVO: Detecção de keywords antes de processar menu
  if (!sessao.contexto?.nucleoIdAtalho && etapaAtual.tipo === 'menu') {
    const deteccao = KeywordShortcuts.detectar(mensagem);
    
    if (deteccao && deteccao.confianca >= 0.80) {
      console.log(`🎯 [ATALHO] Detectado: ${deteccao.categoria} (${deteccao.confianca * 100}%)`);
      
      // Buscar núcleo correspondente
      const nucleo = await this.buscarNucleoPorCategoria(deteccao.categoria);
      
      if (nucleo) {
        // Salvar no contexto
        sessao.contexto.nucleoIdAtalho = nucleo.id;
        sessao.contexto.categoriaAtalho = deteccao.categoria;
        
        // Redirecionar para etapa de confirmação
        sessao.etapaAtual = 'confirmar-atalho';
        await this.sessaoRepository.save(sessao);
        
        // Executar etapa de confirmação
        return await this.flowEngine.executarEtapa(sessao, 'confirmar-atalho');
      }
    }
  }

  // ... restante do código ...
}
```

#### Adição 2: Processamento de Timeout (linhas 501-618)
```typescript
async processarResposta(telefone: string, mensagem: string) {
  // ... buscar sessão ...

  // 🎯 NOVO: Verificar se é resposta a timeout
  if (sessao.metadados?.timeoutAvisoEnviado) {
    console.log('⏰ Processando resposta após aviso de timeout');

    // Normalizar resposta
    const respostaNormalizada = mensagem.trim().toLowerCase();

    // Opção 1: Continuar
    if (respostaNormalizada === '1' || respostaNormalizada.includes('continuar')) {
      sessao.metadados.timeoutAvisoEnviado = false;
      sessao.metadados.timeoutContinuado = true;
      await this.sessaoRepository.save(sessao);
      
      console.log('✅ Usuário escolheu continuar após timeout');
      // Continua processamento normal abaixo
    }
    
    // Opção 2: Falar com atendente
    else if (respostaNormalizada === '2' || respostaNormalizada.includes('atendente')) {
      sessao.metadados.timeoutTransferido = true;
      await this.sessaoRepository.save(sessao);
      
      console.log('➡️ Transferindo para atendente após escolha de timeout');
      
      return await this.transferirParaAtendente(sessao, 'timeout_escolheu_atendente');
    }
    
    // Opção 3: Cancelar
    else if (respostaNormalizada === '3' || respostaNormalizada.includes('cancelar')) {
      sessao.status = 'cancelada';
      sessao.metadados.motivoCancelamento = 'timeout_usuario_cancelou';
      await this.sessaoRepository.save(sessao);
      
      console.log('🚫 Cancelando sessão a pedido do usuário (timeout)');
      
      await this.whatsappSender.enviarMensagem(
        telefone,
        'Atendimento cancelado. Até logo! 👋'
      );
      
      return;
    }
    
    // Qualquer outra resposta: interpreta como continuar
    else {
      sessao.metadados.timeoutAvisoEnviado = false;
      sessao.metadados.timeoutContinuadoAutomatico = true;
      await this.sessaoRepository.save(sessao);
      
      console.log('✅ Resposta não reconhecida, continuando automaticamente');
      // Continua processamento normal abaixo
    }
  }

  // ... processamento normal da etapa ...
}
```

---

### 4. FlowEngine (Modificações)
**Arquivo**: `backend/src/modules/triagem/engine/flow-engine.ts`  
**Linhas Adicionadas**: +13

```typescript
async executarEtapa(sessao: SessaoTriagem, etapaId: string) {
  // ... código existente ...

  // Preparar opções
  const opcoes = [...etapa.opcoes];

  // 🎯 NOVO: Adicionar botão "Não entendi" em todos os menus
  if (etapa.tipo === 'menu') {
    opcoes.push({
      numero: 'ajuda',
      valor: 'ajuda',
      texto: '❓ Não entendi essas opções',
      descricao: 'Falar com um atendente humano',
      acao: 'transferir_nucleo',
    });
  }

  // ... enviar mensagem com opções ...
}
```

---

## 📊 MÉTRICAS E LOGS

### Logs Implementados

```typescript
// Keywords
console.log(`🎯 [ATALHO] Detectado: ${categoria} (categoria: ${categoria}, confiança: ${conf}%)`);
console.log(`🎯 [ATALHO] Palavras encontradas: ${palavras.join(', ')}`);

// Timeout
console.log(`⏰ [TimeoutChecker] Verificando timeouts... (${total} sessões ativas)`);
console.log(`⏰ Enviando aviso de timeout para sessão ${sessaoId}`);
console.log(`⏰ Cancelando sessão por timeout: ${sessaoId}`);

// Processamento
console.log('✅ Usuário escolheu continuar após timeout');
console.log('➡️ Transferindo para atendente após escolha de timeout');
console.log('🚫 Cancelando sessão a pedido do usuário (timeout)');
```

### Queries Úteis

```sql
-- Sessões com atalho detectado
SELECT 
  COUNT(*) as total_atalhos,
  contexto->>'categoriaAtalho' as categoria,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as tempo_medio_min
FROM sessoes_triagem
WHERE contexto->>'nucleoIdAtalho' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY categoria;

-- Timeouts enviados
SELECT 
  COUNT(*) as total_avisos,
  COUNT(CASE WHEN metadados->>'timeoutContinuado' = 'true' THEN 1 END) as continuaram,
  COUNT(CASE WHEN metadados->>'timeoutTransferido' = 'true' THEN 1 END) as transferiram,
  COUNT(CASE WHEN status = 'cancelada' AND metadados->>'motivoCancelamento' = 'timeout_automatico' THEN 1 END) as cancelados_auto
FROM sessoes_triagem
WHERE metadados->>'timeoutAvisoEnviado' IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## 🔗 INTEGRAÇÕES

```
┌─────────────────────┐
│   WhatsApp API      │ ← Webhook incoming
│   (Meta Official)   │ → Envio de mensagens
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  TriagemBotService  │
└──────────┬──────────┘
           │
           ├──────────→ KeywordShortcuts (utilitário)
           ├──────────→ FlowEngine (motor de fluxo)
           ├──────────→ NucleoService (buscar núcleos)
           ├──────────→ TicketService (criar ticket)
           └──────────→ WhatsAppSenderService (enviar msg)

┌─────────────────────┐
│  TimeoutCheckerJob  │ ← Cron (1min)
└──────────┬──────────┘
           │
           ├──────────→ SessaoRepository (buscar/atualizar)
           └──────────→ WhatsAppSenderService (avisos)

┌─────────────────────┐
│   PostgreSQL        │
└─────────────────────┘
  • sessoes_triagem
  • fluxos_triagem
  • nucleos
  • departamentos
```

---

## 🎯 PONTOS DE ENTRADA

### Webhook WhatsApp → Bot
```typescript
@Post('/webhook/whatsapp')
async webhook(@Body() body: any) {
  const telefone = body.from;
  const mensagem = body.text;
  
  await this.triagemBotService.processarResposta(telefone, mensagem);
}
```

### Cron Timeout → Verificação
```typescript
@Cron(CronExpression.EVERY_MINUTE)
async verificarTimeouts() {
  await this.timeoutCheckerJob.verificarTimeouts();
}
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **Visão Geral**: `PROJETO_CONCLUIDO_MELHORIAS_BOT.md`
- **Guia Técnico**: `GUIA_IMPLEMENTACAO_MELHORIAS_BOT.md`
- **Testes**: `ROTEIRO_TESTES_QUICK_WINS.md`
- **Validação**: `VALIDACAO_COMPLETA_QUICK_WINS.md`

---

**Arquitetura preparada por**: GitHub Copilot  
**Data**: 10 de novembro de 2025  
**Status**: ✅ Implementado e Documentado
