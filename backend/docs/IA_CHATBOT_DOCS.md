# 🤖 Integração IA/Chatbot - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Uso Básico](#uso-básico)
6. [Uso Avançado](#uso-avançado)
7. [API Reference](#api-reference)
8. [Prompts e Contexto](#prompts-e-contexto)
9. [Detecção de Atendimento Humano](#detecção-de-atendimento-humano)
10. [Cache e Performance](#cache-e-performance)
11. [Custos e Otimização](#custos-e-otimização)
12. [Troubleshooting](#troubleshooting)

---

## 📖 Visão Geral

Sistema de IA para respostas automáticas em tickets de atendimento, com suporte para **OpenAI GPT-4** e **Azure OpenAI**.

### Funcionalidades

✅ **Respostas automáticas** usando GPT-4/GPT-3.5  
✅ **Detecção inteligente** de quando transferir para atendimento humano  
✅ **Contexto de conversa** (histórico de mensagens)  
✅ **Cache de respostas** para reduzir custos  
✅ **Confiança score** (0-1) para cada resposta  
✅ **Fallback** quando IA não está disponível  
✅ **Suporte a OpenAI e Azure OpenAI**  
✅ **Prompts customizáveis**  

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│         MensagensController                 │
│         (recebe mensagem do cliente)        │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      IAAutoRespostaService                  │
│      - Decide se deve responder auto        │
│      - Prepara contexto                     │
│      - Aplica regras de negócio             │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│           IAService                         │
│      - Gerencia conexão com OpenAI         │
│      - Cache de respostas                   │
│      - Calcula confiança                    │
│      - Detecta necessidade de humano        │
└───────────────┬─────────────────────────────┘
                │
        ┌───────▼────────┐
        │  OpenAI API    │
        │  gpt-4/gpt-3.5 │
        └────────────────┘
```

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
cd backend
npm install openai @azure/openai
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.ia.example .env
```

Edite o `.env` com suas credenciais:

```env
# OpenAI
IA_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
IA_MODEL=gpt-4o-mini

# Parâmetros
IA_TEMPERATURE=0.7
IA_MAX_TOKENS=500
IA_CONTEXT_WINDOW=10

# Auto-resposta
IA_AUTO_RESPOSTA_ENABLED=true
IA_MIN_CONFIANCA=0.6
```

### 3. Reiniciar Backend

```bash
npm run start:dev
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Valores |
|----------|-----------|---------|---------|
| `IA_PROVIDER` | Provider de IA | `openai` | `openai`, `azure` |
| `OPENAI_API_KEY` | Chave da API | **Obrigatório** | `sk-...` |
| `IA_MODEL` | Modelo a usar | `gpt-4o-mini` | `gpt-4`, `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo` |
| `IA_TEMPERATURE` | Criatividade (0-1) | `0.7` | `0.0` - `1.0` |
| `IA_MAX_TOKENS` | Tokens máximos | `500` | `100` - `4000` |
| `IA_CONTEXT_WINDOW` | Msgs de histórico | `10` | `1` - `50` |
| `IA_AUTO_RESPOSTA_ENABLED` | Habilitar auto-resposta | `true` | `true`, `false` |
| `IA_MIN_CONFIANCA` | Confiança mínima | `0.6` | `0.0` - `1.0` |

### Azure OpenAI (Opcional)

Se usar Azure:

```env
IA_PROVIDER=azure
OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-01
IA_MODEL=gpt-4
```

---

## 🚀 Uso Básico

### 1. Endpoint de API

#### POST `/ia/resposta`

Gera resposta automática para uma mensagem.

**Request:**

```json
{
  "ticketId": "uuid-do-ticket",
  "clienteNome": "João Silva",
  "empresaNome": "ConectCRM",
  "historico": [
    {
      "role": "user",
      "content": "Olá, preciso de ajuda"
    },
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudar?"
    },
    {
      "role": "user",
      "content": "Como faço para resetar minha senha?"
    }
  ],
  "metadata": {
    "categoria": "suporte",
    "prioridade": "media"
  }
}
```

**Response:**

```json
{
  "resposta": "Para resetar sua senha, siga estes passos:\n\n1. Acesse a página de login\n2. Clique em 'Esqueci minha senha'\n3. Digite seu e-mail cadastrado\n4. Você receberá um link por e-mail\n\nSe tiver problemas, posso transferir você para um atendente humano. 😊",
  "confianca": 0.85,
  "requerAtendimentoHumano": false,
  "metadata": {
    "tokensUsados": 234,
    "tempo": 1250,
    "model": "gpt-4o-mini"
  }
}
```

#### GET `/ia/stats`

Retorna estatísticas do serviço.

**Response:**

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "cacheSize": 15,
  "isEnabled": true
}
```

---

## 🔧 Uso Avançado

### Integração com Mensagens

```typescript
import { IAAutoRespostaService } from './modules/ia/ia-auto-resposta.service';

@Injectable()
export class MensagensService {
  constructor(
    private readonly iaAutoResposta: IAAutoRespostaService,
  ) {}

  async processarNovaMensagem(mensagem: Mensagem) {
    // Verificar se deve gerar resposta automática
    const resultado = await this.iaAutoResposta.processarMensagem({
      ticketId: mensagem.ticketId,
      clienteNome: mensagem.cliente?.nome,
      empresaNome: mensagem.empresa?.nome,
      conteudo: mensagem.conteudo,
      historicoMensagens: await this.buscarHistorico(mensagem.ticketId),
    });

    if (resultado.deveResponder && resultado.resposta) {
      // Salvar resposta automática
      await this.criarMensagemAutomatica({
        ticketId: mensagem.ticketId,
        conteudo: resultado.resposta,
        tipo: 'TEXTO',
        direcao: 'enviada',
        metadata: {
          ia: true,
          confianca: resultado.confianca,
          model: resultado.metadata?.model,
        },
      });

      // Se requer atendimento humano, notificar atendentes
      if (resultado.requerAtendimentoHumano) {
        await this.notificarAtendentes(mensagem.ticketId);
      }
    } else {
      // Sempre notificar atendentes se IA não responder
      await this.notificarAtendentes(mensagem.ticketId);
    }
  }
}
```

### Prompt Customizado

Defina no `.env`:

```env
IA_SYSTEM_PROMPT="Você é um assistente virtual da empresa XYZ.

Suas responsabilidades:
- Responder dúvidas sobre produtos
- Ajudar com processos de compra
- Fornecer informações de rastreamento

Diretrizes:
- Seja sempre educado e profissional
- Use linguagem simples
- Encaminhe questões complexas para humanos

Produtos disponíveis:
- Plano Basic: R$ 99/mês
- Plano Pro: R$ 199/mês
- Plano Enterprise: R$ 499/mês"
```

---

## 📚 API Reference

### IAService

#### `gerarResposta(contexto: ContextoConversa): Promise<IAResponse>`

Gera resposta usando IA.

**Parâmetros:**

```typescript
interface ContextoConversa {
  ticketId: string;
  clienteNome?: string;
  empresaNome?: string;
  historico: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  metadata?: Record<string, any>;
}
```

**Retorno:**

```typescript
interface IAResponse {
  resposta: string;
  confianca: number; // 0-1
  requerAtendimentoHumano: boolean;
  metadata?: {
    tokensUsados?: number;
    tempo?: number;
    model?: string;
  };
}
```

#### `getStats()`

Retorna estatísticas do serviço.

#### `clearExpiredCache()`

Limpa cache expirado (TTL: 5 minutos).

---

### IAAutoRespostaService

#### `processarMensagem(mensagem: MensagemParaIA): Promise<...>`

Processa mensagem e decide se deve responder automaticamente.

**Parâmetros:**

```typescript
interface MensagemParaIA {
  ticketId: string;
  clienteNome?: string;
  empresaNome?: string;
  conteudo: string;
  historicoMensagens?: Array<{
    direcao: 'enviada' | 'recebida';
    conteudo: string;
    criadoEm: Date;
  }>;
}
```

**Retorno:**

```typescript
{
  deveResponder: boolean;
  resposta?: string;
  confianca?: number;
  requerAtendimentoHumano?: boolean;
  metadata?: any;
}
```

#### `getStatus()`

Retorna status do serviço.

---

## 💬 Prompts e Contexto

### System Prompt Padrão

O prompt padrão do sistema instrui a IA a:

1. ✅ Responder de forma educada e profissional
2. ✅ Fornecer informações claras e objetivas
3. ✅ Usar emojis com moderação
4. ✅ Encaminhar questões complexas para humanos
5. ✅ Admitir quando não sabe a resposta
6. ✅ Manter respostas concisas (máximo 3 parágrafos)

### Contexto Automático

O sistema automaticamente adiciona ao contexto:

- Nome do cliente
- Nome da empresa
- Histórico de mensagens (últimas N)
- Metadata customizada (se fornecida)

**Exemplo de contexto final enviado à IA:**

```
SYSTEM:
Você é um assistente virtual inteligente...

**Contexto atual:**
- Cliente: João Silva
- Empresa: ConectCRM
- categoria: suporte
- prioridade: media

USER:
Como faço para resetar minha senha?
```

---

## 🎯 Detecção de Atendimento Humano

O sistema detecta automaticamente quando transferir para humano:

### Palavras-Chave na Resposta

Se a resposta da IA contém:

- "atendente humano"
- "transferir"
- "encaminhar"
- "não consigo"
- "não posso"
- "supervisor"
- "gerente"

→ `requerAtendimentoHumano = true`

### Detecção de Frustração do Cliente

Se a mensagem do cliente contém:

- "péssimo"
- "horrível"
- "terrível"
- "reclamação"
- "absurdo"
- "revoltado"
- "insatisfeito"
- "cancelar"
- "processo"

→ `requerAtendimentoHumano = true`

### Regras de Negócio

Auto-resposta NÃO é enviada se:

1. ❌ `requerAtendimentoHumano = true`
2. ❌ `confianca < IA_MIN_CONFIANCA` (padrão: 0.6)
3. ❌ Resposta vazia ou muito curta (< 10 caracteres)

---

## ⚡ Cache e Performance

### Cache de Respostas

O sistema implementa cache simples em memória:

- **TTL**: 5 minutos
- **Chave**: `${ticketId}_${primeiros50CharsMsg}`
- **Objetivo**: Reduzir custos em mensagens duplicadas

**Produção**: Recomenda-se usar Redis para cache distribuído.

### Limpeza de Cache

```typescript
// Limpar cache expirado manualmente
iaService.clearExpiredCache();

// Ou configurar cron job (recomendado)
@Cron('*/5 * * * *') // A cada 5 minutos
async limparCache() {
  this.iaService.clearExpiredCache();
}
```

---

## 💰 Custos e Otimização

### Modelos e Preços (OpenAI - Jan 2025)

| Modelo | Input (1M tokens) | Output (1M tokens) | Velocidade | Qualidade |
|--------|-------------------|-------------------|------------|-----------|
| `gpt-4o` | $2.50 | $10.00 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| `gpt-4o-mini` | $0.15 | $0.60 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| `gpt-4-turbo` | $10.00 | $30.00 | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| `gpt-3.5-turbo` | $0.50 | $1.50 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |

### Estimativa de Custos

**Exemplo: 1.000 mensagens/dia com gpt-4o-mini**

```
- Tokens médios por request: 500 (300 input + 200 output)
- Custo por request: ~$0.0002
- Custo diário: $0.20
- Custo mensal: ~$6.00
```

### Dicas de Otimização

1. ✅ Use `gpt-4o-mini` para produção (custo-benefício)
2. ✅ Configure `IA_CONTEXT_WINDOW` menor (5-10 mensagens)
3. ✅ Configure `IA_MAX_TOKENS` adequado (300-500)
4. ✅ Use cache efetivo (Redis em produção)
5. ✅ Monitore `IA_MIN_CONFIANCA` (evitar respostas ruins)
6. ✅ Implemente rate limiting por cliente

---

## 🐛 Troubleshooting

### IA não responde

**Problema**: Todas as mensagens vão para atendente humano.

**Soluções**:

1. Verificar `OPENAI_API_KEY` no `.env`
2. Verificar logs: `this.logger` mostra erros
3. Testar endpoint: `GET /ia/stats`
4. Verificar `IA_AUTO_RESPOSTA_ENABLED=true`
5. Verificar `IA_MIN_CONFIANCA` (não muito alto)

### Erro de autenticação OpenAI

```
Error: Invalid API key
```

**Soluções**:

1. Verificar formato da chave: `sk-proj-...` (OpenAI) ou chave Azure
2. Verificar se chave tem créditos
3. Verificar se chave tem permissões para o modelo

### Respostas de baixa qualidade

**Problema**: IA responde coisas erradas ou irrelevantes.

**Soluções**:

1. Ajustar `IA_TEMPERATURE` (menor = mais determinístico)
2. Customizar `IA_SYSTEM_PROMPT` com instruções específicas
3. Aumentar `IA_CONTEXT_WINDOW` (mais contexto)
4. Trocar modelo (`gpt-4o` é mais inteligente que `gpt-4o-mini`)

### Timeout ou lentidão

**Problema**: Requisições demoram muito.

**Soluções**:

1. Reduzir `IA_MAX_TOKENS`
2. Usar modelo mais rápido (`gpt-4o-mini` ou `gpt-3.5-turbo`)
3. Implementar timeout nas requisições
4. Verificar latência de rede (Azure pode ser mais rápido dependendo da região)

### Cache não funciona

**Problema**: Mesma mensagem gera múltiplas requisições.

**Soluções**:

1. Verificar se chave de cache está correta
2. Implementar Redis em vez de cache em memória
3. Aumentar TTL se necessário

---

## 📊 Métricas Recomendadas

Monitore as seguintes métricas em produção:

1. **Taxa de resposta automática**: quantas mensagens foram respondidas pela IA
2. **Confiança média**: média dos scores de confiança
3. **Taxa de transferência para humano**: quantas vezes IA solicitou humano
4. **Tokens usados por dia**: para controlar custos
5. **Tempo médio de resposta**: latência da API
6. **Taxa de erro**: falhas na geração de resposta

---

## 🔒 Segurança

### Boas Práticas

1. ✅ Nunca commitar `OPENAI_API_KEY` no git
2. ✅ Usar variáveis de ambiente para configurações sensíveis
3. ✅ Implementar rate limiting por cliente
4. ✅ Sanitizar inputs (evitar prompt injection)
5. ✅ Logar todas as interações com IA (auditoria)
6. ✅ Implementar retry com backoff exponencial

---

## 📝 Próximos Passos

- [ ] Implementar fine-tuning com dados históricos
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Implementar análise de sentimento
- [ ] Adicionar métricas de satisfação (feedback)
- [ ] Integrar com base de conhecimento (RAG)
- [ ] Implementar A/B testing de prompts

---

**Desenvolvido com ❤️ para ConectCRM**  
**Task 7: Integração IA/Chatbot - Documentação Completa**
