# 🧪 Guia de Teste Manual - Melhorias Pipeline de Vendas

**Data**: 02/12/2025  
**Status**: ✅ Backend pronto | 🧪 Aguardando teste frontend

---

## 📋 Pré-requisitos

1. ✅ Backend rodando em `http://localhost:3001`
2. ✅ Frontend rodando em `http://localhost:3000`
3. 🔑 Credenciais válidas para login

---

## 🎯 Teste 1: Modal de Motivo de Perda (Loss Reason Tracking)

### Objetivo
Validar que ao arrastar uma oportunidade para a coluna "PERDIDO", o sistema obriga a seleção de um motivo.

### Passos

1. **Acesse o Pipeline**
   ```
   http://localhost:3000/pipeline
   ```

2. **Crie uma nova oportunidade** (se não houver nenhuma)
   - Clique em "Nova Oportunidade"
   - Preencha:
     - Título: `Teste Modal Motivo Perda`
     - Valor: `R$ 50.000`
     - Estágio: `Proposta`
     - Prioridade: `Alta`
   - Salve

3. **Arraste a oportunidade para a coluna "Perdido"**
   - Localize a oportunidade criada
   - Arraste (drag) para a última coluna do Kanban: **"Perdido"**

4. **Verifique o Modal**
   
   ✅ **Deve abrir automaticamente** o modal "Motivo da Perda"
   
   ✅ **Deve exibir**:
   - Título: ⚠️ Motivo da Perda
   - Informações da oportunidade (título, valor)
   - 8 cards com motivos:
     ```
     💰 Preço              🏆 Concorrente        ⏰ Timing
     💸 Sem Orçamento      ❌ Produto/Serviço    🚫 Projeto Cancelado
     👻 Sem Resposta       📝 Outro
     ```
   - Botão "Confirmar Perda" **DESABILITADO** (cinza)

5. **Tente fechar o modal sem selecionar motivo**
   - Clique no X (canto superior direito)
   - ✅ Modal deve fechar
   - ✅ Oportunidade **NÃO** deve ter mudado de estágio

6. **Reabra e selecione um motivo**
   - Arraste novamente para "Perdido"
   - Clique em um dos 8 cards (ex: `💰 Preço`)
   - ✅ Card selecionado deve ter:
     - Borda verde
     - Fundo verde claro
   - ✅ Botão "Confirmar Perda" deve estar **HABILITADO** (verde)

7. **Preencha campos opcionais**
   - Detalhes Adicionais: `Cliente achou valor 30% acima do orçamento`
   - *(Não preencher Data de Revisão por enquanto)*

8. **Confirme a perda**
   - Clique em "Confirmar Perda"
   - ✅ Modal deve fechar
   - ✅ Oportunidade deve aparecer na coluna "Perdido"
   - ✅ Loading spinner deve aparecer durante requisição

---

## 🎯 Teste 2: Campo Condicional - Nome do Concorrente

### Objetivo
Validar que o campo "Nome do Concorrente" só aparece quando selecionar motivo CONCORRENTE.

### Passos

1. **Crie nova oportunidade**
   - Título: `Teste Concorrente`
   - Valor: `R$ 75.000`
   - Estágio: `Negociação`

2. **Arraste para "Perdido"**

3. **Selecione diferentes motivos e observe**:

   - Selecionar `💰 Preço`
     - ❌ Campo "Nome do Concorrente" **NÃO** deve aparecer

   - Selecionar `🏆 Concorrente`
     - ✅ Campo "Nome do Concorrente" **DEVE APARECER**
     - ✅ Input text vazio, placeholder: "Nome da empresa concorrente"

4. **Preencha e confirme**
   - Nome do Concorrente: `Empresa X Tecnologia`
   - Detalhes: `Cliente escolheu solução mais completa`
   - Data de Revisão: `01/06/2025` (6 meses no futuro)
   - Clique "Confirmar Perda"

5. **Verifique no DevTools (F12) → Network**
   - Procure requisição `PATCH /oportunidades/:id/estagio`
   - ✅ Payload deve incluir:
     ```json
     {
       "estagio": "lost",
       "motivoPerda": "CONCORRENTE",
       "concorrenteNome": "Empresa X Tecnologia",
       "motivoPerdaDetalhes": "Cliente escolheu solução mais completa",
       "dataRevisao": "2025-06-01"
     }
     ```
   - ✅ Response deve ser `200 OK`

---

## 🎯 Teste 3: Badge de SLA Alert

### Objetivo
Validar que oportunidades com mais de 7 dias no mesmo estágio exibem badge vermelho de alerta.

### Passos

1. **Crie oportunidade recente**
   - Título: `Teste SLA - Nova`
   - Valor: `R$ 30.000`
   - Estágio: `Qualificação`
   - Salve

2. **Verifique o card no Kanban**
   - ❌ **NÃO** deve ter badge vermelho
   - ✅ Motivo: oportunidade acabou de ser criada (< 7 dias)

3. **Simule oportunidade antiga (via SQL)**
   
   Abra ferramenta de banco de dados (DBeaver, pgAdmin, etc.) e execute:
   
   ```sql
   -- Criar oportunidade de teste
   INSERT INTO oportunidade (
     titulo, 
     valor, 
     estagio, 
     prioridade,
     "diasNoEstagioAtual",
     "precisaAtencao",
     "dataUltimaMudancaEstagio"
   ) VALUES (
     'Teste SLA - Antiga',
     40000,
     'qualification',
     'medium',
     10,                                    -- 10 dias no estágio
     true,                                  -- precisa atenção
     NOW() - INTERVAL '10 days'            -- criada há 10 dias
   );
   ```

4. **Recarregue a página do Pipeline**
   - Procure o card "Teste SLA - Antiga"
   - ✅ **DEVE** ter badge vermelho:
     ```
     ┌──────────────────────────┐
     │ ⚠️ 10 dias neste estágio  │  ← Badge vermelho
     └──────────────────────────┘
     ```
   - ✅ Cor: `bg-red-50`, `text-red-700`, `border-red-200`
   - ✅ Ícone: `AlertCircle` (círculo com ponto de exclamação)

---

## 🎯 Teste 4: Ícone de Probabilidade Auto-Calculada

### Objetivo
Validar que todas as oportunidades exibem ícone de raio (⚡) ao lado da probabilidade, indicando ajuste automático.

### Passos

1. **Verifique cards existentes no Kanban**
   
   Para **CADA** card de oportunidade, verifique:
   
   ✅ **Probabilidade com ícone**:
   ```
   75% ⚡  ← Ícone de raio amarelo
   ```
   
   ✅ **Ao passar mouse (hover)**, tooltip deve aparecer:
   ```
   "Probabilidade ajustada automaticamente baseada no estágio"
   ```

2. **Crie nova oportunidade em diferentes estágios**

   | Estágio        | Probabilidade Esperada | Visual      |
   |----------------|------------------------|-------------|
   | Leads          | 10%                    | `10% ⚡`     |
   | Qualificação   | 20%                    | `20% ⚡`     |
   | Proposta       | 50%                    | `50% ⚡`     |
   | Negociação     | 75%                    | `75% ⚡`     |
   | Fechamento     | 90%                    | `90% ⚡`     |

3. **Mova oportunidade entre estágios**
   - Crie em "Proposta" (50%)
   - Arraste para "Negociação"
   - ✅ Probabilidade deve mudar: `50%` → `75%`
   - ✅ Ícone ⚡ deve continuar visível

---

## 🎯 Teste 5: Validação Backend (400 sem motivo)

### Objetivo
Validar que o backend rejeita tentativas de marcar como PERDIDO sem motivo.

### Passos

1. **Abra DevTools (F12) → Console**

2. **Execute no console do navegador**:
   
   ```javascript
   // Obter token (assumindo que você está logado)
   const token = localStorage.getItem('token'); // ou sessionStorage
   
   // Buscar primeira oportunidade
   fetch('http://localhost:3001/oportunidades', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   .then(r => r.json())
   .then(oportunidades => {
     const opId = oportunidades[0].id;
     console.log('Testando oportunidade ID:', opId);
     
     // Tentar marcar como PERDIDO SEM motivo
     return fetch(`http://localhost:3001/oportunidades/${opId}/estagio`, {
       method: 'PATCH',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ estagio: 'lost' }) // SEM motivoPerda
     });
   })
   .then(r => {
     console.log('Status:', r.status); // Deve ser 400
     return r.json();
   })
   .then(data => {
     console.log('Resposta:', data);
     // Deve ter mensagem sobre motivo obrigatório
   });
   ```

3. **Verifique a resposta**:
   
   ✅ **Status**: `400 Bad Request`
   
   ✅ **Mensagem**: Algo como:
   ```json
   {
     "statusCode": 400,
     "message": ["motivoPerda é obrigatório quando o estágio é PERDIDO"],
     "error": "Bad Request"
   }
   ```

---

## 🎯 Teste 6: Fluxo Completo End-to-End

### Objetivo
Testar o ciclo completo de uma oportunidade desde criação até marcá-la como perdida.

### Cenário: Oportunidade perdida por preço alto

1. **Criar Oportunidade**
   - Título: `Sistema CRM - Empresa ABC`
   - Valor: `R$ 120.000`
   - Estágio: `Leads`
   - Prioridade: `Alta`
   - ✅ Probabilidade deve ser: `10% ⚡`

2. **Qualificar**
   - Arraste para "Qualificação"
   - ✅ Probabilidade deve mudar: `10%` → `20%`

3. **Enviar Proposta**
   - Arraste para "Proposta"
   - ✅ Probabilidade deve mudar: `20%` → `50%`

4. **Iniciar Negociação**
   - Arraste para "Negociação"
   - ✅ Probabilidade deve mudar: `50%` → `75%`

5. **Perder por Preço Alto**
   - Arraste para "Perdido"
   - ✅ Modal abre automaticamente
   - Selecione: `💰 Preço`
   - Detalhes: `Cliente solicitou desconto de 40%, inviável para nós`
   - Data de Revisão: `01/03/2026` (quando cliente terá budget maior)
   - Clique "Confirmar Perda"

6. **Verificações Finais**
   - ✅ Card aparece na coluna "Perdido"
   - ✅ Probabilidade: `0% ⚡`
   - ✅ Se oportunidade ficou >7 dias em algum estágio: badge vermelho apareceu

---

## 📊 Checklist de Validação

Ao final dos testes, verifique se TODOS os itens estão OK:

### Funcionalidade: Loss Reason Tracking
- [ ] Modal abre ao arrastar para "Perdido"
- [ ] 8 motivos de perda aparecem
- [ ] Botão "Confirmar" desabilitado sem seleção
- [ ] Campo "Concorrente" só aparece para motivo CONCORRENTE
- [ ] Backend rejeita perda sem motivo (400)
- [ ] Backend aceita perda com motivo (200)

### Funcionalidade: SLA Alerts
- [ ] Badge vermelho aparece quando `diasNoEstagioAtual > 7`
- [ ] Badge mostra "X dias neste estágio"
- [ ] Badge tem cor vermelha (`bg-red-50`, `text-red-700`)
- [ ] Ícone AlertCircle aparece no badge

### Funcionalidade: Auto-Probability
- [ ] Ícone ⚡ aparece ao lado da probabilidade
- [ ] Tooltip explica "ajustada automaticamente"
- [ ] Probabilidade muda ao mover estágios:
  - [ ] LEADS → 10%
  - [ ] QUALIFICACAO → 20%
  - [ ] PROPOSTA → 50%
  - [ ] NEGOCIACAO → 75%
  - [ ] FECHAMENTO → 90%
  - [ ] GANHO → 100%
  - [ ] PERDIDO → 0%

---

## 🐛 Problemas Conhecidos

### Issue 1: Login Falhando (401)
**Sintoma**: Não consegue fazer login com `admin@conectsuite.com.br`  
**Solução Temporária**: Verificar se usuário existe no banco ou criar novo usuário

### Issue 2: Endpoint /faturas retorna 500
**Sintoma**: Smoke test falha no endpoint de faturas  
**Impacto**: NÃO afeta funcionalidades do pipeline  
**Status**: Não bloqueia testes das melhorias

---

## 📝 Relatório de Teste

Ao concluir os testes, preencha:

**Data do Teste**: _______________  
**Testador**: _______________  
**Ambiente**: Local (http://localhost:3000)

### Resultados

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Loss Reason Modal | ⬜ Passou / ⬜ Falhou | |
| Campo Condicional Concorrente | ⬜ Passou / ⬜ Falhou | |
| SLA Badge | ⬜ Passou / ⬜ Falhou | |
| Auto-Probability Icon | ⬜ Passou / ⬜ Falhou | |
| Validação Backend 400 | ⬜ Passou / ⬜ Falhou | |
| Fluxo E2E Completo | ⬜ Passou / ⬜ Falhou | |

### Bugs Encontrados

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Aprovação

⬜ **APROVADO** - Todas as funcionalidades funcionam conforme especificado  
⬜ **REPROVADO** - Encontrados bugs críticos que impedem uso

---

**Assinatura**: _______________  
**Data**: _______________
