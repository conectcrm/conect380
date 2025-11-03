# ✅ Checklist de Testes - Sistema de Triagem Completo

**Data**: 27 de outubro de 2025  
**Objetivo**: Validar todas as funcionalidades do bot de triagem integrado com WhatsApp Cloud API

---

## 📋 Pré-requisitos (Verificar Antes de Começar)

### Backend
- [ ] Backend rodando na porta 3001
  ```powershell
  cd backend
  npm run start:dev
  ```
- [ ] Console sem erros críticos
- [ ] Banco de dados conectado (verificar logs de TypeORM)
- [ ] Webhook WhatsApp configurado:
  - [ ] Token de verificação cadastrado
  - [ ] URL pública configurada (ngrok ou similar)
  - [ ] Meta App com permissões corretas

### Frontend
- [ ] Frontend rodando na porta 3000
  ```powershell
  cd frontend-web
  npm start
  ```
- [ ] Login funcionando (usar credenciais de teste)
- [ ] Acesso ao módulo "Gestão de Triagem"

### WhatsApp Cloud API
- [ ] Número de teste ativo na Meta
- [ ] Token de acesso válido (não expirado)
- [ ] Webhook verificado (check verde no painel Meta)
- [ ] Telefone de teste registrado

### Dados de Teste
- [ ] Fluxo padrão carregado no banco de dados
- [ ] Núcleos de atendimento configurados:
  - [ ] Suporte Técnico (com horário de funcionamento)
  - [ ] Administrativo (com horário de funcionamento)
  - [ ] Comercial (com horário de funcionamento)
- [ ] Pelo menos 1 atendente cadastrado em cada núcleo

---

## 🎨 FASE 1: Editor Visual e Publicação

### 1.1. Autosave no Editor Visual

**Objetivo**: Validar que mudanças são salvas automaticamente a cada 3 segundos

**Passos**:
1. [ ] Acessar `http://localhost:3000/admin/bot-builder` (lista de fluxos)
2. [ ] Clicar em "Editar" no fluxo de teste
3. [ ] Verificar que editor visual carregou corretamente
4. [ ] Contar blocos renderizados: **Esperado: 9 blocos**
   - [ ] 1x Início
   - [ ] 1x Boas-vindas
   - [ ] 1x Menu Principal (Núcleos)
   - [ ] 3x Submenus (Suporte, Administrativo, Comercial)
   - [ ] 1x Coleta Nome
   - [ ] 1x Coleta Email
   - [ ] 1x Confirmação de Dados

**Teste de Autosave**:
5. [ ] Clicar em um bloco de mensagem (ex: "Boas-vindas")
6. [ ] Modificar o texto (ex: adicionar "🎉" no final)
7. [ ] Aguardar **exatamente 3 segundos** sem fazer nada
8. [ ] **VALIDAR**: Apareceu "💾 Salvando..." no header? ✅/❌
9. [ ] Aguardar mais 2 segundos
10. [ ] **VALIDAR**: Mudou para "✅ Salvo há X min/seg"? ✅/❌
11. [ ] Recarregar página (F5)
12. [ ] **VALIDAR**: Modificação foi persistida? ✅/❌

**Teste de Indicador "Não Salvo"**:
13. [ ] Fazer nova modificação em qualquer bloco
14. [ ] **ANTES** de esperar 3 segundos, clicar em "Voltar" ou fechar aba
15. [ ] **VALIDAR**: Apareceu alerta "⚠️ Alterações não salvas"? ✅/❌
16. [ ] Cancelar saída
17. [ ] Aguardar autosave (3s)
18. [ ] Tentar sair novamente
19. [ ] **VALIDAR**: Agora permite sair sem aviso? ✅/❌

**Resultado Esperado**:
- ✅ Todas as validações passaram
- ✅ Autosave funciona em 3 segundos
- ✅ Indicadores visuais corretos
- ✅ Warning ao sair com mudanças não salvas

---

### 1.2. Validação e Publicação de Fluxo

**Objetivo**: Publicar fluxo sem loops e ativá-lo automaticamente

**Passos**:
1. [ ] No editor visual, clicar botão **"Publicar"** (canto superior direito)
2. [ ] Sistema executa validação automática:
   - [ ] **VALIDAR**: Apareceu mensagem de validação? ✅/❌
   - [ ] **VALIDAR**: Validação passou (sem loops detectados)? ✅/❌
3. [ ] Após validação, confirmar publicação
4. [ ] **VALIDAR**: Mensagem de sucesso apareceu? ✅/❌
5. [ ] **VALIDAR**: Fluxo foi marcado como "Ativo"? ✅/❌

**Verificação Backend**:
6. [ ] Abrir logs do backend
7. [ ] Procurar por: `"Fluxo publicado com sucesso"`
8. [ ] **VALIDAR**: Log encontrado? ✅/❌

**Verificação Banco de Dados** (Opcional):
```sql
SELECT id, nome, ativo, publicado_em, versao 
FROM fluxo_triagem 
ORDER BY publicado_em DESC 
LIMIT 1;
```
9. [ ] **VALIDAR**: Campo `ativo` = TRUE? ✅/❌
10. [ ] **VALIDAR**: Campo `publicado_em` tem timestamp recente? ✅/❌

**Resultado Esperado**:
- ✅ Publicação bem-sucedida
- ✅ Fluxo ativo no sistema
- ✅ Sem erros de validação

---

## 📱 FASE 2: Testes no WhatsApp (Cenário A - Novo Cliente)

### 2.1. Iniciação do Bot

**Objetivo**: Validar que bot responde à primeira mensagem

**Preparação**:
- Usar número de WhatsApp **SEM histórico** de atendimento (novo contato)
- Ter WhatsApp Web aberto para facilitar testes

**Passos**:
1. [ ] Enviar mensagem: **"Oi"** para o número configurado
2. [ ] **VALIDAR**: Bot respondeu em até 3 segundos? ✅/❌
3. [ ] **VALIDAR**: Resposta foi a mensagem de boas-vindas? ✅/❌

**Mensagem Esperada**:
```
Olá! 👋 Seja bem-vindo ao ConectCRM!

Como posso ajudá-lo hoje?
```

**Verificação de Logs**:
4. [ ] Abrir console do backend
5. [ ] Procurar por: `[TriagemBotService] Iniciando triagem para contato`
6. [ ] **VALIDAR**: Log encontrado com número correto? ✅/❌

---

### 2.2. Menu Principal (Botões Interativos)

**Objetivo**: Validar botões interativos da Meta API

**Passos**:
1. [ ] **VALIDAR**: Bot enviou menu com botões? ✅/❌
2. [ ] **VALIDAR**: Quantidade de botões = 3? ✅/❌
3. [ ] **VALIDAR**: Textos dos botões corretos:
   - [ ] "1️⃣ Suporte Técnico"
   - [ ] "2️⃣ Administrativo"
   - [ ] "3️⃣ Comercial"

**Teste de Horário Comercial**:
4. [ ] Verificar hora atual
5. [ ] Se **DENTRO do horário** (ex: Segunda 14h):
   - [ ] Todos os 3 botões devem estar visíveis
6. [ ] Se **FORA do horário** (ex: Domingo 22h):
   - [ ] **VALIDAR**: Mensagem mostra horários de funcionamento? ✅/❌
   - [ ] **VALIDAR**: Botões de núcleos fechados desabilitados? ✅/❌

**Teste de Seleção**:
7. [ ] Clicar no botão **"1️⃣ Suporte Técnico"**
8. [ ] **VALIDAR**: Bot confirmou seleção? ✅/❌

**Mensagem Esperada**:
```
✅ Você selecionou: Suporte Técnico

Vou precisar de algumas informações...
```

**Verificação Backend**:
9. [ ] Console do backend mostra: `[FlowEngine] Processando menu_nucleos → opcao selecionada: 1`
10. [ ] **VALIDAR**: Log correto? ✅/❌

---

### 2.3. Coleta de Dados (Validações)

**Objetivo**: Validar validações de email, nome e telefone

#### Teste 2.3.1: Coleta de Nome

**Passos**:
1. [ ] Bot pergunta: **"Qual o seu nome completo?"**
2. [ ] **Teste inválido**: Digitar **"João"** (nome incompleto)
3. [ ] **VALIDAR**: Bot rejeitou e pediu nome completo? ✅/❌

**Mensagem Esperada**:
```
❌ Por favor, informe seu nome completo (nome e sobrenome).
```

4. [ ] **Teste válido**: Digitar **"João Silva"**
5. [ ] **VALIDAR**: Bot aceitou e avançou? ✅/❌

#### Teste 2.3.2: Coleta de Email

**Passos**:
6. [ ] Bot pergunta: **"Qual o seu e-mail?"**
7. [ ] **Teste inválido**: Digitar **"joao@invalido"** (sem TLD)
8. [ ] **VALIDAR**: Bot rejeitou? ✅/❌

**Mensagem Esperada**:
```
❌ E-mail inválido. Por favor, informe um e-mail válido (ex: seu@email.com).
```

9. [ ] **Teste válido**: Digitar **"joao.silva@empresa.com.br"**
10. [ ] **VALIDAR**: Bot aceitou? ✅/❌

#### Teste 2.3.3: Coleta de Empresa (Opcional)

**Passos**:
11. [ ] Bot pergunta: **"Qual o nome da sua empresa?"** (se configurado)
12. [ ] Digitar **"Empresa Teste Ltda"**
13. [ ] **VALIDAR**: Bot aceitou? ✅/❌

---

### 2.4. Confirmação de Dados (Nova Funcionalidade)

**Objetivo**: Validar tela de confirmação formatada com emojis

**Passos**:
1. [ ] Após coletar todos os dados, bot exibe confirmação
2. [ ] **VALIDAR**: Mensagem tem formatação correta? ✅/❌

**Mensagem Esperada**:
```
✅ *Dados Cadastrados*

👤 **Nome:** João Silva
📧 **E-mail:** joao.silva@empresa.com.br
🏢 **Empresa:** Empresa Teste Ltda

Os dados estão corretos?

Digite *SIM* para confirmar ou *NÃO* para corrigir.
```

**Teste de Confirmação (SIM)**:
3. [ ] Digitar **"SIM"**
4. [ ] **VALIDAR**: Bot confirmou e encaminhou? ✅/❌

**Mensagem Esperada**:
```
✅ Seus dados foram registrados com sucesso!

Você será encaminhado para um atendente de Suporte Técnico em breve.
```

**Teste de Correção (NÃO)**:
5. [ ] **REINICIAR** conversa (enviar "Oi" novamente)
6. [ ] Repetir fluxo até chegar na confirmação
7. [ ] Digitar **"NÃO"**
8. [ ] **VALIDAR**: Bot voltou para coleta de nome? ✅/❌

**Mensagem Esperada**:
```
🔄 *Vamos corrigir seus dados*

Por favor, informe seu nome completo novamente:
```

9. [ ] Preencher dados novamente
10. [ ] Confirmar com **"SIM"**
11. [ ] **VALIDAR**: Ticket criado com novos dados? ✅/❌

---

### 2.5. Criação de Ticket e Encaminhamento

**Objetivo**: Validar criação de ticket no banco de dados

**Verificação Backend**:
1. [ ] Após confirmação com "SIM", verificar logs:
   ```
   [TriagemBotService] Ticket criado: { id: 'uuid...', contatoId: '...', nucleoId: '...' }
   ```
2. [ ] **VALIDAR**: Log encontrado? ✅/❌

**Verificação Banco de Dados**:
```sql
SELECT t.id, t.protocolo, t.status, c.nome, c.email, n.nome as nucleo
FROM ticket t
JOIN contato c ON t.contato_id = c.id
JOIN nucleo_atendimento n ON t.nucleo_id = n.id
ORDER BY t.created_at DESC
LIMIT 1;
```
3. [ ] **VALIDAR**: Ticket criado? ✅/❌
4. [ ] **VALIDAR**: Status = 'aguardando_atendente'? ✅/❌
5. [ ] **VALIDAR**: Núcleo correto (Suporte Técnico)? ✅/❌
6. [ ] **VALIDAR**: Dados do contato corretos (nome, email)? ✅/❌

**Verificação de Sessão**:
```sql
SELECT id, contato_id, etapa_atual, contexto, finalizada_em
FROM sessao_triagem
ORDER BY iniciada_em DESC
LIMIT 1;
```
7. [ ] **VALIDAR**: Sessão finalizada (finalizada_em NOT NULL)? ✅/❌
8. [ ] **VALIDAR**: Contexto salvou todos os dados? ✅/❌

---

## 🔄 FASE 3: Cliente Retornando (Cenário B)

### 3.1. Reconhecimento de Cliente Antigo

**Objetivo**: Validar opção "Continuar atendimento anterior"

**Preparação**:
- Usar o **MESMO número** do teste anterior (Cenário A)
- Aguardar pelo menos 5 minutos após primeiro teste
- Garantir que ticket anterior está no banco (<7 dias)

**Passos**:
1. [ ] Enviar mensagem: **"Olá"** (do mesmo número)
2. [ ] **VALIDAR**: Bot identificou cliente antigo? ✅/❌
3. [ ] **VALIDAR**: Menu mostra opção extra no topo? ✅/❌

**Mensagem Esperada**:
```
Olá novamente, João Silva! 👋

Vejo que você tem um atendimento recente em Suporte Técnico.

Como posso ajudá-lo hoje?

🔄 0️⃣ Continuar atendimento em Suporte Técnico
1️⃣ Suporte Técnico
2️⃣ Administrativo
3️⃣ Comercial
```

**Verificação Backend**:
4. [ ] Console mostra: `[TriagemBotService] Último ticket encontrado: { id: '...', nucleoNome: 'Suporte Técnico' }`
5. [ ] **VALIDAR**: Log correto? ✅/❌

---

### 3.2. Teste de Continuação

**Objetivo**: Validar que opção "0" reabre ticket anterior

**Passos**:
1. [ ] Digitar **"0"** (ou clicar botão "0️⃣")
2. [ ] **VALIDAR**: Bot confirmou continuação? ✅/❌

**Mensagem Esperada**:
```
✅ Continuando atendimento anterior em Suporte Técnico

Ticket: #PROT-12345
Status: Aguardando atendente

Um atendente entrará em contato em breve.
```

**Verificação Banco de Dados**:
```sql
SELECT id, protocolo, status, reaberto_em
FROM ticket
WHERE contato_id = (SELECT id FROM contato WHERE telefone = '+5511999999999')
ORDER BY created_at DESC
LIMIT 1;
```
3. [ ] **VALIDAR**: Mesmo ticket anterior? ✅/❌
4. [ ] **VALIDAR**: Campo `reaberto_em` foi atualizado? ✅/❌
5. [ ] **VALIDAR**: Status = 'aguardando_atendente'? ✅/❌

---

### 3.3. Teste de Novo Atendimento (Cliente Retornando)

**Objetivo**: Validar que cliente antigo pode abrir NOVO ticket

**Passos**:
1. [ ] Reiniciar conversa (enviar "Oi")
2. [ ] Menu mostra opção "0️⃣ Continuar" + opções 1/2/3
3. [ ] Digitar **"2"** (Administrativo) ao invés de "0"
4. [ ] **VALIDAR**: Bot iniciou NOVO fluxo de triagem? ✅/❌
5. [ ] Preencher dados novamente (mesmo nome/email)
6. [ ] Confirmar com "SIM"
7. [ ] **VALIDAR**: NOVO ticket criado? ✅/❌

**Verificação Banco de Dados**:
```sql
SELECT id, protocolo, nucleo_id, created_at
FROM ticket
WHERE contato_id = (SELECT id FROM contato WHERE telefone = '+5511999999999')
ORDER BY created_at DESC
LIMIT 2;
```
8. [ ] **VALIDAR**: 2 tickets diferentes? ✅/❌
9. [ ] **VALIDAR**: Segundo ticket tem núcleo = Administrativo? ✅/❌

---

## 🕐 FASE 4: Horário Comercial e Feriados

### 4.1. Teste Fora do Horário

**Objetivo**: Validar mensagem de indisponibilidade

**Preparação**:
- Modificar horário de funcionamento no banco para simular "fechado"
- OU executar teste real fora do horário

**Passos**:
1. [ ] Enviar "Oi" fora do horário comercial
2. [ ] **VALIDAR**: Menu mostra apenas núcleos abertos? ✅/❌
3. [ ] **VALIDAR**: Núcleos fechados têm mensagem de horário? ✅/❌

**Mensagem Esperada**:
```
Olá! 👋 Seja bem-vindo ao ConectCRM!

⚠️ Alguns departamentos estão indisponíveis no momento:

❌ **Suporte Técnico**
Horário: Segunda a Sexta, 8h às 18h
Próxima abertura: Segunda-feira às 08:00

✅ **Comercial** (disponível agora)
```

**Verificação Backend**:
4. [ ] Console mostra: `[HorarioUtil] Núcleo 'Suporte' indisponível - Fora do horário`
5. [ ] **VALIDAR**: Log correto? ✅/❌

---

### 4.2. Teste em Feriado (Opcional)

**Preparação**:
- Adicionar feriado no campo `feriados` do núcleo

**Passos**:
1. [ ] Enviar mensagem em data de feriado cadastrado
2. [ ] **VALIDAR**: Núcleo mostra como indisponível? ✅/❌
3. [ ] **VALIDAR**: Mensagem informa sobre feriado? ✅/❌

**Mensagem Esperada**:
```
❌ **Suporte Técnico**
⚠️ Fechado hoje (feriado: Natal)
Próxima abertura: 26/12 às 08:00
```

---

## 🔍 FASE 5: Testes de Estresse e Edge Cases

### 5.1. Múltiplas Mensagens Simultâneas

**Objetivo**: Validar que bot não quebra com spam

**Passos**:
1. [ ] Enviar 5 mensagens rápidas seguidas:
   ```
   Oi
   Oi
   Oi
   Oi
   Oi
   ```
2. [ ] **VALIDAR**: Bot respondeu apenas uma vez? ✅/❌
3. [ ] **VALIDAR**: Sem duplicação de sessões? ✅/❌

**Verificação Backend**:
```sql
SELECT COUNT(*) as total
FROM sessao_triagem
WHERE contato_id = (SELECT id FROM contato WHERE telefone = '+5511999999999')
AND finalizada_em IS NULL;
```
4. [ ] **VALIDAR**: total = 1 (apenas uma sessão ativa)? ✅/❌

---

### 5.2. Timeout de Sessão

**Objetivo**: Validar que sessão expira após inatividade

**Preparação**:
- Configurar timeout de sessão para 5 minutos (ou usar padrão de 30 min)

**Passos**:
1. [ ] Iniciar conversa e parar no meio (ex: após menu)
2. [ ] Aguardar 5+ minutos sem enviar mensagem
3. [ ] Enviar mensagem qualquer
4. [ ] **VALIDAR**: Bot reiniciou triagem do zero? ✅/❌

**Mensagem Esperada**:
```
⚠️ Sua sessão expirou por inatividade.

Vamos começar novamente! 👋
```

---

### 5.3. Caracteres Especiais e Emojis

**Objetivo**: Validar que bot aceita unicode

**Passos**:
1. [ ] No campo "Nome", digitar: **"José 日本語 Müller"**
2. [ ] **VALIDAR**: Bot aceitou? ✅/❌
3. [ ] No campo "Empresa", digitar: **"Café & Cia 🍕"**
4. [ ] **VALIDAR**: Bot aceitou? ✅/❌
5. [ ] Verificar banco de dados:
   ```sql
   SELECT nome, empresa FROM contato WHERE telefone = '+5511999999999';
   ```
6. [ ] **VALIDAR**: Dados salvos corretamente (sem corrupção)? ✅/❌

---

### 5.4. Navegação Inválida

**Objetivo**: Validar tratamento de respostas inválidas

**Passos**:
1. [ ] No menu principal, digitar **"999"** (opção inexistente)
2. [ ] **VALIDAR**: Bot pediu para escolher opção válida? ✅/❌

**Mensagem Esperada**:
```
❌ Opção inválida.

Por favor, escolha uma das opções acima (1, 2 ou 3).
```

3. [ ] Digitar **"xyz"** (texto aleatório)
4. [ ] **VALIDAR**: Mesma mensagem de erro? ✅/❌

---

## 📊 FASE 6: Logs e Monitoramento

### 6.1. Auditoria de Logs

**Objetivo**: Validar que todas as interações são logadas

**Verificação Banco de Dados**:
```sql
SELECT acao, detalhes, created_at
FROM triagem_log
WHERE sessao_id = (
  SELECT id FROM sessao_triagem 
  ORDER BY iniciada_em DESC 
  LIMIT 1
)
ORDER BY created_at;
```

**Logs Esperados (ordem cronológica)**:
1. [ ] `sessao_iniciada` - com telefone do contato
2. [ ] `mensagem_recebida` - "Oi"
3. [ ] `mensagem_enviada` - Boas-vindas
4. [ ] `mensagem_enviada` - Menu principal
5. [ ] `mensagem_recebida` - "1" (seleção Suporte)
6. [ ] `opcao_selecionada` - { opcao: '1', nucleoNome: 'Suporte Técnico' }
7. [ ] `mensagem_recebida` - "João Silva"
8. [ ] `validacao_sucesso` - { campo: 'nome', valor: 'João Silva' }
9. [ ] `mensagem_recebida` - "joao@empresa.com"
10. [ ] `validacao_sucesso` - { campo: 'email' }
11. [ ] `mensagem_enviada` - Confirmação de dados
12. [ ] `mensagem_recebida` - "SIM"
13. [ ] `ticket_criado` - { ticketId: 'uuid...', protocolo: 'PROT-...' }
14. [ ] `sessao_finalizada` - sucesso

**VALIDAR**: Todos os logs presentes? ✅/❌

---

### 6.2. Métricas de Performance

**Objetivo**: Validar tempos de resposta

**Consulta SQL**:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (created_at - iniciada_em))) as tempo_medio_segundos,
  MIN(EXTRACT(EPOCH FROM (created_at - iniciada_em))) as tempo_min,
  MAX(EXTRACT(EPOCH FROM (created_at - iniciada_em))) as tempo_max
FROM sessao_triagem
WHERE finalizada_em IS NOT NULL
AND created_at >= NOW() - INTERVAL '1 day';
```

**Benchmarks**:
1. [ ] Tempo médio < 120 segundos (2 minutos)
2. [ ] Tempo máximo < 300 segundos (5 minutos)
3. [ ] Tempo de resposta do bot < 2 segundos (verificar logs)

---

## 🎯 FASE 7: Teste End-to-End Completo

### 7.1. Fluxo Completo (Cliente Novo → Atendimento)

**Objetivo**: Simular jornada completa de um cliente

**Cenário**: Novo cliente, horário comercial, seleciona Comercial, preenche dados, confirma, aguarda atendente

**Passos**:
1. [ ] **INÍCIO**: Enviar "Bom dia" de número novo
2. [ ] **VALIDAR**: Boas-vindas recebidas (< 3s)
3. [ ] **MENU**: Selecionar "3️⃣ Comercial"
4. [ ] **VALIDAR**: Confirmação de seleção
5. [ ] **NOME**: Digitar "Maria Santos"
6. [ ] **VALIDAR**: Aceito e perguntou email
7. [ ] **EMAIL**: Digitar "maria.santos@empresax.com"
8. [ ] **VALIDAR**: Aceito e perguntou empresa
9. [ ] **EMPRESA**: Digitar "Empresa X Ltda"
10. [ ] **VALIDAR**: Tela de confirmação formatada corretamente
11. [ ] **CONFIRMAR**: Digitar "SIM"
12. [ ] **VALIDAR**: Ticket criado, protocolo informado
13. [ ] **VALIDAR**: Mensagem de encaminhamento enviada

**Verificação Final**:
14. [ ] Banco de dados tem ticket com status 'aguardando_atendente'
15. [ ] Sessão finalizada com sucesso
16. [ ] Todos os logs registrados
17. [ ] Atendente consegue visualizar ticket no painel

**Tempo Total Esperado**: < 3 minutos (interação completa)

---

## ✅ Critérios de Aceitação

### Mínimo Obrigatório (Bloqueante)
- [ ] ✅ Bot responde a mensagens em < 3 segundos
- [ ] ✅ Menu interativo funciona (botões ou lista)
- [ ] ✅ Validações de email/nome funcionam
- [ ] ✅ Confirmação de dados formatada corretamente
- [ ] ✅ Tickets são criados no banco de dados
- [ ] ✅ Logs de todas as interações são salvos
- [ ] ✅ Autosave funciona no editor visual
- [ ] ✅ Publicação de fluxo sem loops

### Recomendado (Importante)
- [ ] ✅ Reconhecimento de cliente retornando
- [ ] ✅ Horário comercial respeitado
- [ ] ✅ Tratamento de erros e respostas inválidas
- [ ] ✅ Sem duplicação de sessões
- [ ] ✅ Caracteres especiais aceitos

### Opcional (Nice to Have)
- [ ] ✅ Feriados configuráveis
- [ ] ✅ Métricas de performance
- [ ] ✅ Timeout de sessão

---

## 🐛 Registro de Bugs Encontrados

| # | Fase | Descrição | Severidade | Status |
|---|------|-----------|------------|--------|
| 1 |      |           |            |        |
| 2 |      |           |            |        |
| 3 |      |           |            |        |

**Severidades**:
- 🔴 **Crítica**: Bloqueia funcionalidade principal
- 🟡 **Alta**: Impacto significativo na experiência
- 🟢 **Média**: Problema menor, tem workaround
- 🔵 **Baixa**: Cosmético ou edge case

---

## 📝 Notas e Observações

### Configurações Usadas
```
Backend URL: http://localhost:3001
Frontend URL: http://localhost:3000
Webhook URL: [preencher com ngrok/público]
WhatsApp Número: [preencher]
Token Meta: [últimos 4 dígitos]
```

### Horários de Teste
```
Início dos testes: ____/____/____ às ____:____
Fim dos testes: ____/____/____ às ____:____
Duração total: _______ minutos
```

### Ambiente
- [ ] Desenvolvimento (local)
- [ ] Homologação
- [ ] Produção

### Responsáveis
- Testador: ___________________________
- Revisor: ___________________________
- Aprovação final: ___________________________

---

## 🚀 Próximos Passos Após Testes

### Se TODOS os testes passaram:
1. [ ] Documentar configurações finais
2. [ ] Criar backup do banco de dados
3. [ ] Preparar deploy para produção
4. [ ] Treinar equipe de atendimento
5. [ ] Ativar bot para clientes reais

### Se ALGUM teste falhou:
1. [ ] Registrar bugs na tabela acima
2. [ ] Priorizar correções (críticas primeiro)
3. [ ] Corrigir e re-testar
4. [ ] Validar que correção não quebrou outras funcionalidades
5. [ ] Executar checklist novamente

---

**Assinatura**: ___________________________  
**Data**: ____/____/____

