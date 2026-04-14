# 🧪 Cenários de Teste - Fluxo de Atendimento

## 📋 Overview

Este documento contém **cenários práticos** para testar o fluxo de atendimento completo.

---

## ✅ Cenário 1: Cliente Novo - Fluxo Completo Bem-Sucedido

### 📝 Pré-requisitos
- Telefone +55 11 98888-0001 **não cadastrado** no sistema
- Núcleos "Comercial", "Suporte", "Financeiro", "Atendimento" existem
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1 | Enviar "Oi" para o WhatsApp | "Olá! 👋 Bem-vindo ao atendimento da nossa empresa. Por favor, aguarde enquanto verificamos seus dados..." |
| 2 | Aguardar 1 segundo | "Vejo que é seu primeiro contato conosco! 🎉 Para oferecer um atendimento personalizado, preciso de algumas informações." |
| 3 | Aguardar mensagem | "Qual é o seu *primeiro nome*? 📝" |
| 4 | Responder: "Carlos" | "Obrigado, Carlos! 👍 Agora, qual é o seu *sobrenome*?" |
| 5 | Responder: "Silva" | "Perfeito! Agora preciso do seu *e-mail* para contato. 📧 _(Digite um e-mail válido)_" |
| 6 | Responder: "carlos.silva@empresa.com" | "Qual é o nome da sua *empresa*? 🏢" |
| 7 | Responder: "Tech Solutions" | "✅ *Dados recebidos:* <br>👤 Nome: Carlos Silva<br>📧 E-mail: carlos.silva@empresa.com<br>🏢 Empresa: Tech Solutions<br>_Salvando suas informações..._" |
| 8 | Aguardar 2 segundos | "🎉 *Cadastro realizado com sucesso!* Agora você faz parte da nossa base de clientes. Vamos prosseguir com seu atendimento!" |
| 9 | Aguardar mensagem | "📋 *Como posso ajudá-lo hoje?* Escolha uma das opções abaixo:<br>1️⃣ 💼 Comercial - Vendas e Orçamentos<br>2️⃣ 🛠️ Suporte Técnico<br>3️⃣ 💰 Financeiro - Pagamentos e Faturas<br>4️⃣ ❓ Outros Assuntos" |
| 10 | Responder: "1" | "💼 *Área Comercial* Você será transferido para um consultor de vendas. Aguarde um momento..." |
| 11 | Aguardar 1.5 segundos | "Você está sendo transferido para um atendente humano. Obrigado! 🙏" |
| 12 | Verificar sistema | Atendimento criado e atribuído ao núcleo "Comercial" |

### ✅ Resultado Esperado
- Contato criado no banco de dados
- Atendimento criado e atribuído ao núcleo "Comercial"
- Prioridade: Média
- Status: Aguardando atendente

---

## ✅ Cenário 2: Cliente Cadastrado - Acesso Rápido

### 📝 Pré-requisitos
- Telefone +55 11 98888-0002 **já cadastrado** no sistema
- Nome do contato: "Maria Santos"
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1 | Enviar "Olá" para o WhatsApp | "Olá! 👋 Bem-vindo ao atendimento da nossa empresa. Por favor, aguarde enquanto verificamos seus dados..." |
| 2 | Aguardar 1 segundo | "Olá Maria Santos! 😊 Que bom ter você de volta! Como posso ajudá-lo hoje?" |
| 3 | Aguardar mensagem | "📋 *Como posso ajudá-lo hoje?* Escolha uma das opções abaixo:<br>1️⃣ 💼 Comercial...<br>2️⃣ 🛠️ Suporte...<br>3️⃣ 💰 Financeiro...<br>4️⃣ ❓ Outros..." |
| 4 | Responder: "2" | "🛠️ *Suporte Técnico* Você será conectado com um técnico especializado. Aguarde..." |
| 5 | Aguardar 1.5 segundos | "Você está sendo transferido para um atendente humano. Obrigado! 🙏" |
| 6 | Verificar sistema | Atendimento atribuído ao núcleo "Suporte" com prioridade ALTA ⚠️ |

### ✅ Resultado Esperado
- Nenhum cadastro novo (cliente já existia)
- Atendimento criado e atribuído ao núcleo "Suporte"
- Prioridade: **Alta** (Suporte tem prioridade maior)
- Tempo total: ~30 segundos

---

## ⚠️ Cenário 3: Validação de Email Inválido

### 📝 Pré-requisitos
- Telefone +55 11 98888-0003 **não cadastrado**
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1-4 | Seguir passos 1-4 do Cenário 1 | Nome: "Pedro", Sobrenome: "Oliveira" |
| 5 | Bot pergunta email | "Perfeito! Agora preciso do seu *e-mail* para contato. 📧" |
| 6 | Responder: "pedro.oliveira" (sem @) | "Por favor, digite um e-mail válido (exemplo: seunome@empresa.com)." |
| 7 | Responder: "pedro@" (incompleto) | "Por favor, digite um e-mail válido (exemplo: seunome@empresa.com)." |
| 8 | Responder: "pedro@oliveira.com" | ✅ Aceita e prossegue para pergunta da empresa |

### ✅ Resultado Esperado
- Validação funciona corretamente
- Cliente recebe feedback claro sobre erro
- Após email válido, fluxo continua normalmente

---

## ⚠️ Cenário 4: Nome Muito Curto

### 📝 Pré-requisitos
- Telefone +55 11 98888-0004 **não cadastrado**
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1-3 | Seguir passos 1-3 do Cenário 1 | Bot pergunta primeiro nome |
| 4 | Responder: "A" (1 caractere) | "Por favor, digite um nome válido (mínimo 2 caracteres)." |
| 5 | Responder: "J" (1 caractere) | "Por favor, digite um nome válido (mínimo 2 caracteres)." |
| 6 | Responder: "João" | ✅ Aceita e prossegue para sobrenome |

### ✅ Resultado Esperado
- Validação de tamanho mínimo funciona
- Cliente pode tentar novamente
- Após nome válido (≥2 chars), continua

---

## ⚠️ Cenário 5: Opção de Menu Inválida

### 📝 Pré-requisitos
- Telefone +55 11 98888-0005 (novo ou cadastrado)
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1-9 | Chegar até o menu | "📋 *Como posso ajudá-lo hoje?*... (opções 1-4)" |
| 10 | Responder: "5" (inválido) | "Opção inválida. Por favor, digite um número de 1 a 4." |
| 11 | Responder: "abc" (inválido) | "Opção inválida. Por favor, digite um número de 1 a 4." |
| 12 | Responder: "0" (inválido) | "Opção inválida. Por favor, digite um número de 1 a 4." |
| 13 | Responder: "3" (válido) | ✅ "💰 *Setor Financeiro*..." → Transfere para Financeiro |

### ✅ Resultado Esperado
- Validação de opções funciona
- Máximo 3 tentativas (após 3ª tentativa inválida, deve encerrar ou escalar)
- Cliente recebe feedback claro

---

## ✅ Cenário 6: Campo Empresa Opcional

### 📝 Pré-requisitos
- Telefone +55 11 98888-0006 **não cadastrado**
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1-6 | Seguir até pergunta da empresa | "Qual é o nome da sua *empresa*? 🏢" |
| 7 | Responder: "não tenho" | ✅ Aceita e prossegue |
| 8 | Verificar confirmação | "✅ *Dados recebidos:*... 🏢 Empresa: não tenho" |
| 9 | Verificar banco de dados | Campo empresa = "não tenho" ou NULL |

### ✅ Resultado Esperado
- Campo empresa aceita resposta "não tenho"
- Cadastro é criado mesmo sem empresa
- Fluxo continua normalmente

---

## ✅ Cenário 7: Todas as Opções do Menu

### 📝 Pré-requisitos
- Telefone +55 11 98888-0007 a 0010 (4 números)
- Bot está ativo

### 🎬 Passos (Repetir 4 vezes, mudando opção)

| Teste | Opção | Núcleo Esperado | Prioridade |
|-------|-------|-----------------|------------|
| A | "1" (Comercial) | Comercial | Média |
| B | "2" (Suporte) | Suporte | **Alta** ⚠️ |
| C | "3" (Financeiro) | Financeiro | Média |
| D | "4" (Outros) | Atendimento | Normal |

### ✅ Resultado Esperado
- Cada opção direciona para núcleo correto
- Prioridades corretas (Suporte = Alta)
- Mensagens de transição aparecem
- Atendimentos criados e atribuídos

---

## ⏱️ Cenário 8: Timeout e Abandono

### 📝 Pré-requisitos
- Telefone +55 11 98888-0011
- Bot está ativo
- Sistema tem timeout configurado (ex: 5 minutos)

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1-3 | Chegar até pergunta do nome | "Qual é o seu *primeiro nome*? 📝" |
| 4 | **Não responder por 5 minutos** | Sistema marca atendimento como "Abandonado" ou "Timeout" |
| 5 | Verificar sistema | Status: Inativo/Timeout, não foi atribuído a nenhum núcleo |

### ✅ Resultado Esperado
- Sistema não fica travado esperando resposta
- Atendimento marcado como abandonado
- Métricas de abandono são registradas

---

## 🔄 Cenário 9: Retorno Após Abandono

### 📝 Pré-requisitos
- Telefone +55 11 98888-0012
- Cliente abandonou fluxo anteriormente
- Bot está ativo

### 🎬 Passos

| # | Ação | Resposta Esperada do Bot |
|---|------|--------------------------|
| 1 | Cliente envia nova mensagem: "Oi" | Bot **reinicia** fluxo do início (não continua de onde parou) |
| 2 | Verificar se é tratado como novo atendimento | Sim, novo atendimento criado |

### ✅ Resultado Esperado
- Fluxo sempre começa do início
- Não mantém estado entre sessões (por padrão)
- Cliente pode recomeçar quantas vezes quiser

---

## 📊 Cenário 10: Carga de Teste (Performance)

### 📝 Pré-requisitos
- 10 telefones diferentes (+55 11 98888-0101 a 0110)
- Bot está ativo
- Sistema de fila funcionando

### 🎬 Passos

| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1 | Enviar mensagem simultaneamente de todos os 10 números | Todos recebem boas-vindas |
| 2 | Completar cadastro simultaneamente | Todos 10 são cadastrados |
| 3 | Escolher opções do menu | Todos transferidos corretamente |
| 4 | Verificar banco de dados | 10 contatos criados, 10 atendimentos criados |
| 5 | Verificar logs de erro | Nenhum erro de concorrência |

### ✅ Resultado Esperado
- Sistema suporta múltiplos atendimentos simultâneos
- Sem perda de dados
- Sem travamentos
- Performance aceitável (<2s de resposta)

---

## 📋 Checklist de Validação Final

Antes de ativar em produção, confirme:

- [ ] ✅ Cenário 1: Fluxo completo novo cliente funciona
- [ ] ✅ Cenário 2: Cliente cadastrado reconhecido
- [ ] ✅ Cenário 3: Validação de email funciona
- [ ] ✅ Cenário 4: Validação de nome funciona
- [ ] ✅ Cenário 5: Validação de menu funciona
- [ ] ✅ Cenário 6: Campo empresa opcional funciona
- [ ] ✅ Cenário 7: Todas 4 opções do menu funcionam
- [ ] ✅ Cenário 8: Timeout é tratado corretamente
- [ ] ✅ Cenário 9: Retorno após abandono funciona
- [ ] ✅ Cenário 10: Performance com carga aceitável
- [ ] 📊 Métricas de sucesso configuradas
- [ ] 🚨 Alertas de erro configurados
- [ ] 📖 Equipe treinada para suportar fluxo
- [ ] 🔐 Dados sensíveis protegidos (LGPD)
- [ ] 🌍 Horário de atendimento configurado (se aplicável)

---

## 🎯 Métricas de Sucesso

### KPIs Esperados
- **Taxa de Conclusão**: ≥ 85%
- **Taxa de Abandono**: ≤ 15%
- **Tempo Médio**: 2-3 minutos (cliente novo), 30s (cliente cadastrado)
- **Taxa de Erro de Validação**: ≤ 20%
- **Satisfação do Cliente**: ≥ 4.0/5.0

### Alertas Críticos
- 🚨 Taxa de abandono > 30%
- 🚨 Erro em transferência > 5%
- 🚨 Tempo médio > 5 minutos
- 🚨 Taxa de erro de validação > 40%

---

## 📞 Suporte e Troubleshooting

### Se algo falhar durante os testes:

1. **Verificar logs** do backend (erros de API, banco)
2. **Verificar núcleos** existem no sistema
3. **Verificar webhook** do WhatsApp está funcionando
4. **Verificar token** do WhatsApp não expirou
5. **Reiniciar** backend se necessário
6. **Consultar** DOCUMENTACAO_FLUXO_ATENDIMENTO.md

---

**Boa sorte nos testes! 🚀**
