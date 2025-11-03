# 📊 Documentação do Fluxo de Atendimento Completo

## 🎯 Visão Geral

Este fluxo automatiza o primeiro contato do cliente, coletando dados se necessário e direcionando para o setor adequado.

---

## 🔄 Fluxograma Visual

```
┌─────────────┐
│   INÍCIO    │ → Mensagem de boas-vindas
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ VERIFICAR CADASTRO  │ → Consulta se contato existe
└──────┬──────────────┘
       │
       ├────── SIM ────────┐
       │                    │
       │                    ▼
       │           ┌──────────────────┐
       │           │  BOAS-VINDAS     │
       │           │  PERSONALIZADA   │
       │           └────────┬─────────┘
       │                    │
       ├────── NÃO ─────────┤
       │                    │
       ▼                    │
┌──────────────┐            │
│ MENSAGEM     │            │
│ INICIAL      │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ COLETAR      │            │
│ PRIMEIRO     │            │
│ NOME         │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ COLETAR      │            │
│ SOBRENOME    │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ COLETAR      │            │
│ E-MAIL       │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ COLETAR      │            │
│ EMPRESA      │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ CONFIRMAR    │            │
│ DADOS        │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ SALVAR       │            │
│ CONTATO      │            │
└──────┬───────┘            │
       │                    │
       ▼                    │
┌──────────────┐            │
│ CONFIRMAÇÃO  │            │
│ CADASTRO     │            │
└──────┬───────┘            │
       │                    │
       └────────┬───────────┘
                │
                ▼
        ┌───────────────┐
        │ MENU DE       │
        │ ATENDIMENTO   │
        └───┬───────────┘
            │
            ├─── 1. Comercial ───┐
            │                     │
            ├─── 2. Suporte ──────┤
            │                     │
            ├─── 3. Financeiro ───┤
            │                     │
            └─── 4. Outros ───────┤
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ TRANSFERIR PARA  │
                        │ NÚCLEO           │
                        └────────┬─────────┘
                                 │
                                 ▼
                            ┌─────────┐
                            │   FIM   │
                            └─────────┘
```

---

## 📋 Etapas Detalhadas

### 1️⃣ Início
**ID**: `inicio`  
**Tipo**: Início  
**Mensagem**: "Olá! 👋 Bem-vindo ao atendimento da nossa empresa..."  
**Próximo**: Verificar Cadastro

---

### 2️⃣ Verificação de Cadastro
**ID**: `verificar_cadastro`  
**Tipo**: Condição  
**Verifica**: Se `contato.cadastrado` existe  
**Fluxos**:
- ✅ **Cadastrado**: → Boas-vindas Personalizada
- ❌ **Não Cadastrado**: → Coletar Dados

---

### 3️⃣ Boas-Vindas (Cliente Cadastrado)
**ID**: `boas_vindas_cadastrado`  
**Tipo**: Mensagem  
**Mensagem**: "Olá {{contato.nome}}! 😊 Que bom ter você de volta!"  
**Próximo**: Menu de Atendimento

---

### 4️⃣ Coleta de Dados (Cliente Novo)

#### 4.1. Primeiro Nome
**ID**: `coletar_primeiro_nome`  
**Tipo**: Pergunta  
**Pergunta**: "Qual é o seu primeiro nome? 📝"  
**Variável**: `contato.primeiroNome`  
**Validação**: Mínimo 2 caracteres

#### 4.2. Sobrenome
**ID**: `coletar_sobrenome`  
**Tipo**: Pergunta  
**Pergunta**: "Agora, qual é o seu sobrenome?"  
**Variável**: `contato.sobrenome`  
**Validação**: Mínimo 2 caracteres

#### 4.3. E-mail
**ID**: `coletar_email`  
**Tipo**: Pergunta  
**Pergunta**: "Preciso do seu e-mail para contato 📧"  
**Variável**: `contato.email`  
**Validação**: Formato de e-mail válido

#### 4.4. Empresa
**ID**: `coletar_empresa`  
**Tipo**: Pergunta  
**Pergunta**: "Qual é o nome da sua empresa? 🏢"  
**Variável**: `contato.empresa`  
**Validação**: Mínimo 2 caracteres (opcional)

---

### 5️⃣ Confirmação e Salvamento

#### 5.1. Confirmar Dados
**ID**: `confirmar_dados`  
**Tipo**: Mensagem  
**Exibe**: Resumo dos dados coletados  
**Delay**: 2 segundos

#### 5.2. Salvar Contato
**ID**: `salvar_contato`  
**Tipo**: Ação  
**Ação**: `salvar_contato`  
**Parâmetros**:
```json
{
  "nome": "{{contato.primeiroNome}} {{contato.sobrenome}}",
  "email": "{{contato.email}}",
  "empresa": "{{contato.empresa}}",
  "telefone": "{{contato.telefone}}",
  "origem": "whatsapp_bot"
}
```

#### 5.3. Confirmação Cadastro
**ID**: `confirmacao_cadastro`  
**Tipo**: Mensagem  
**Mensagem**: "🎉 Cadastro realizado com sucesso!"

---

### 6️⃣ Menu de Atendimento
**ID**: `menu_atendimento`  
**Tipo**: Menu  
**Mensagem**: "📋 Como posso ajudá-lo hoje?"  

**Opções**:

| # | Descrição | Núcleo | Prioridade |
|---|-----------|--------|------------|
| 1 | 💼 Comercial - Vendas e Orçamentos | Comercial | Média |
| 2 | 🛠️ Suporte Técnico | Suporte | Alta |
| 3 | 💰 Financeiro - Pagamentos e Faturas | Financeiro | Média |
| 4 | ❓ Outros Assuntos | Atendimento | Normal |

**Validação**: 
- Máximo 3 tentativas
- Mensagem de erro personalizada

---

### 7️⃣ Transferências

Cada opção do menu leva a:
1. **Mensagem de Transição** (1,5s delay)
2. **Ação de Transferência** para o núcleo específico
3. **Fim do Fluxo**

---

## 🎨 Melhorias Implementadas

### ✅ Melhorias de UX
1. **Emojis Contextuais**: Cada mensagem tem emoji apropriado
2. **Confirmação de Dados**: Cliente vê resumo antes de salvar
3. **Mensagens de Espera**: "Aguarde..." antes de transferências
4. **Validações Claras**: Mensagens de erro específicas

### ✅ Melhorias Técnicas
1. **Variáveis Dinâmicas**: Uso de `{{contato.nome}}`, etc.
2. **Validações de Input**: Email, tamanho mínimo, etc.
3. **Delays Estratégicos**: Simula tempo de processamento
4. **Priorização**: Suporte tem prioridade alta

### ✅ Melhorias de Negócio
1. **Coleta Estruturada**: Dados organizados para CRM
2. **Origem Rastreável**: Tag `origem: whatsapp_bot`
3. **Segmentação**: Cliente direcionado para setor correto
4. **Retenção**: Cliente cadastrado tem experiência personalizada

---

## 🚀 Como Importar no Sistema

### Opção 1: Via Construtor Visual
1. Acesse **Gestão → Fluxos**
2. Clique em **"Construtor Visual"**
3. Cole o JSON de `FLUXO_ATENDIMENTO_COMPLETO.json`
4. O sistema converterá automaticamente para visual
5. Edite conforme necessário
6. Clique em **"Salvar Fluxo"**

### Opção 2: Via Importação JSON
1. Acesse **Gestão → Fluxos**
2. Clique em **"Novo Fluxo"**
3. Cole o conteúdo do arquivo JSON
4. Salve

---

## 🧪 Como Testar

### Teste 1: Cliente Novo
```
1. Inicie conversa no WhatsApp
2. Aguarde mensagem de boas-vindas
3. Sistema solicita primeiro nome → Digite "João"
4. Sistema solicita sobrenome → Digite "Silva"
5. Sistema solicita email → Digite "joao@empresa.com"
6. Sistema solicita empresa → Digite "Empresa XYZ"
7. Sistema confirma dados
8. Sistema salva contato
9. Sistema exibe menu
10. Digite "1" (Comercial)
11. Sistema transfere para núcleo Comercial
```

### Teste 2: Cliente Cadastrado
```
1. Inicie conversa com telefone já cadastrado
2. Aguarde mensagem de boas-vindas
3. Sistema reconhece e saúda: "Olá João! Que bom ter você de volta!"
4. Sistema exibe menu diretamente (pula coleta)
5. Digite "2" (Suporte)
6. Sistema transfere para núcleo Suporte
```

### Teste 3: Validação de Email
```
1. Siga fluxo de cliente novo
2. Quando solicitar email, digite "email_invalido"
3. Sistema deve exibir: "Por favor, digite um e-mail válido"
4. Digite "teste@empresa.com"
5. Sistema aceita e prossegue
```

---

## 📊 Métricas Recomendadas

### KPIs para Monitorar
1. **Taxa de Conclusão**: % de clientes que completam cadastro
2. **Tempo Médio de Fluxo**: Duração desde início até transferência
3. **Opção Mais Escolhida**: Qual núcleo recebe mais demandas
4. **Taxa de Abandono**: % de clientes que saem no meio
5. **Taxa de Erro de Validação**: % de inputs inválidos

### Alertas Sugeridos
- ⚠️ Taxa de abandono > 30%
- ⚠️ Tempo médio > 5 minutos
- ⚠️ Taxa de erro de email > 40%

---

## 🔧 Personalizações Possíveis

### Fáceis
- Alterar textos das mensagens
- Adicionar/remover opções do menu
- Ajustar delays
- Modificar validações

### Intermediárias
- Adicionar mais campos de coleta (telefone, CPF, etc.)
- Criar submenus (ex: Suporte → Hardware ou Software?)
- Adicionar horário de atendimento (encerrar fora do expediente)
- Incluir FAQ antes do menu

### Avançadas
- Integração com CRM externo
- Análise de sentimento nas respostas
- Chatbot com IA para responder perguntas simples
- Sistema de agendamento de reuniões

---

## 📝 Observações Importantes

### ⚠️ Atenção
1. **Núcleos**: Os nomes "Comercial", "Suporte", "Financeiro", "Atendimento" devem existir no sistema
2. **Variáveis**: O sistema precisa suportar `contato.cadastrado`, `contato.nome`, etc.
3. **Ações**: A ação `transferir_para_nucleo` deve estar implementada no backend

### 💡 Dicas
1. Teste em ambiente de homologação primeiro
2. Configure alertas para monitorar taxa de sucesso
3. Ajuste textos de acordo com o tom da sua marca
4. Considere adicionar pesquisa de satisfação no final

---

## 📞 Próximos Passos

1. ✅ Importar fluxo no sistema
2. ✅ Testar com telefone real
3. ✅ Ajustar textos se necessário
4. ✅ Configurar núcleos de destino
5. ✅ Ativar em produção
6. ✅ Monitorar métricas
7. ✅ Iterar com base em feedback

---

**Criado em**: Outubro 2025  
**Versão**: 1.0  
**Autor**: Sistema ConectCRM  
**Última atualização**: 24/10/2025
