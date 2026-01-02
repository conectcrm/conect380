# 📱 Guia: Gestão de Núcleos - Configurar Menu do WhatsApp

**Última atualização:** 28 de outubro de 2025

---

## 🎯 O Que São Núcleos?

**Núcleos** são departamentos/equipes de atendimento que aparecem como **opções no menu inicial do bot do WhatsApp**.

### Exemplo Real:

Quando um cliente envia "Olá" no WhatsApp, o bot responde:

```
👋 Olá, João! Que bom ter você de volta! 😊

Por favor, escolha uma das opções abaixo:

❌ Digite SAIR para cancelar
↩️ Suporte Técnico
💰 Financeiro
🤝 Comercial
```

Cada opção (exceto "SAIR") vem de um **núcleo cadastrado** com `visível_no_bot = TRUE`.

---

## 📍 Como Acessar

**URL:** http://localhost:3000/gestao/nucleos

**Ou pelo menu:**
```
Dashboard → Gestão → Núcleos de Atendimento
```

---

## ✨ Recursos da Página

### 1️⃣ **Listagem de Núcleos**

A tabela mostra:
- ✅ **Nome** e **Descrição**
- ✅ **Código** (identificador único)
- ✅ **Tipo de Distribuição** (round robin, load balancing, etc.)
- ✅ **Capacidade** e **Tickets Abertos**
- ✅ **Status** (Ativo/Inativo)
- ✅ **Bot** (Visível/Oculto no WhatsApp) ← **IMPORTANTE!**

### 2️⃣ **Filtros**

- Buscar por nome
- Filtrar por status (Ativo/Inativo)
- Filtrar por tipo de distribuição

### 3️⃣ **Criar/Editar Núcleo**

Botão **"+ Novo Núcleo"** ou **Editar** na linha.

---

## 🛠️ Como Adicionar uma Nova Opção no Menu do WhatsApp

### **Passo 1: Criar Novo Núcleo**

1. Clique em **"+ Novo Núcleo"**

2. **Preencha os campos obrigatórios:**

   ```
   Nome: Financeiro
   Código: FINANCEIRO (não pode repetir)
   Descrição: Atendimento para questões financeiras
   ```

3. **Configure a aparência:**

   ```
   Cor: #10B981 (verde)
   Ícone: dollar-sign
   ```

4. **Configure o comportamento:**

   ```
   Tipo de Distribuição: Round Robin
   Prioridade: 2 (ordem no menu - menor número = primeiro)
   SLA Resposta: 60 minutos
   SLA Resolução: 24 horas
   Capacidade Máxima: 50 tickets
   ```

5. **Mensagem de Transferência:**

   ```
   💰 Você foi direcionado para o Financeiro. 
   Nossa equipe irá te auxiliar em breve!
   ```

6. **IMPORTANTE: Ative os checkboxes:**

   - ✅ **Núcleo Ativo** → Permite receber atendimentos
   - ✅ **Visível no Menu do WhatsApp** ← **CRUCIAL!**

7. Clique em **"Criar"**

### **Passo 2: Verificar no WhatsApp**

1. Abra o WhatsApp
2. Envie "Olá" para o número do bot
3. Verifique se a nova opção aparece no menu
4. Teste clicando/digitando o nome

---

## 📊 Campos Importantes

### 🔴 **Campos Obrigatórios (*)**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Nome** | Nome exibido no menu | "Suporte Técnico" |
| **Código** | Identificador único (não muda depois) | "SUPORTE_TEC" |
| **Tipo Distribuição** | Como distribuir atendimentos | "Round Robin" |

### 🟢 **Campos Recomendados**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Descrição** | Detalhes internos | "Atendimento para bugs..." |
| **Prioridade** | Ordem no menu WhatsApp | 1 (primeiro), 2 (segundo)... |
| **Mensagem Boas-Vindas** | Mensagem ao transferir | "🛠️ Bem-vindo ao Suporte!" |
| **SLA Resposta** | Tempo máximo de primeira resposta | 15 minutos |
| **SLA Resolução** | Tempo máximo de resolução | 4 horas |
| **Capacidade Máxima** | Limite de tickets simultâneos | 50 |

### 🎨 **Campos Visuais**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Cor** | Cor do núcleo na interface | #3B82F6 (azul) |
| **Ícone** | Nome do ícone | "wrench", "dollar-sign" |

### ⚙️ **Checkboxes**

| Checkbox | Função | Padrão |
|----------|--------|--------|
| **Núcleo Ativo** | Se o núcleo pode receber atendimentos | ✅ Sim |
| **Visível no Bot** | Se aparece no menu do WhatsApp | ✅ Sim |

---

## 🎯 Ordem das Opções no WhatsApp

A ordem das opções no menu é definida pelo campo **"Prioridade"**:

```
Prioridade 1 → Aparece PRIMEIRO
Prioridade 2 → Aparece SEGUNDO
Prioridade 3 → Aparece TERCEIRO
...

Exemplo:
┌─────────────────────────────────┐
│ ❌ Digite SAIR (automático)     │ ← Sempre no topo
│ 🛠️ Suporte Técnico (prioridade: 1) │
│ 💰 Financeiro (prioridade: 2)   │
│ 🤝 Comercial (prioridade: 3)    │
└─────────────────────────────────┘
```

**Dica:** Use intervalos de 10 (10, 20, 30) para facilitar inserções futuras.

---

## 🔧 Tipos de Distribuição

| Tipo | Descrição | Quando Usar |
|------|-----------|-------------|
| **Round Robin** | Distribui sequencialmente | Equipe balanceada |
| **Load Balancing** | Para atendente com menos tickets | Equipe com capacidades diferentes |
| **Skill Based** | Por habilidade do atendente | Atendimentos especializados |
| **Manual** | Atendente escolhe pegar | Atendimentos complexos |

---

## 📱 Como Funciona a Integração com WhatsApp

### **Fluxo Completo:**

```
┌─────────────────────────────────┐
│  Cliente envia "Olá"            │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Bot busca núcleos com:         │
│  - ativo = TRUE                 │
│  - visivelNoBot = TRUE          │
│  ORDER BY prioridade ASC        │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Bot monta mensagem:            │
│  "Escolha uma opção:"           │
│  + Lista de núcleos             │
│  + "Digite SAIR" (automático)   │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Cliente escolhe opção          │
│  (ex: "Suporte Técnico")        │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│  Bot transfere para núcleo      │
│  + Envia mensagemBoasVindas     │
└─────────────────────────────────┘
```

### **Lógica do Backend:**

Arquivo: `backend/src/modules/triagem/engine/flow-engine.ts`

```typescript
// Busca núcleos visíveis
const nucleosVisiveis = nucleos.filter(n => 
  n.ativo && n.visivelNoBot
).sort((a, b) => 
  a.prioridade - b.prioridade
);

// Monta menu
const opcoes = nucleosVisiveis.map((nucleo, index) => ({
  numero: index + 1,
  texto: nucleo.nome,
  nucleoId: nucleo.id
}));

// Adiciona "SAIR" automaticamente
opcoes.push({
  texto: '❌ Digite SAIR para cancelar',
  acao: 'encerrar'
});
```

---

## ✅ Checklist de Criação

Ao criar um novo núcleo para o WhatsApp:

- [ ] Nome descritivo e curto (ex: "Financeiro", não "Departamento Financeiro Ltda")
- [ ] Código único em UPPERCASE (ex: "FINANCEIRO")
- [ ] Descrição clara (uso interno)
- [ ] Cor escolhida (para interface)
- [ ] Ícone definido
- [ ] Tipo de distribuição configurado
- [ ] Prioridade definida (ordem no menu)
- [ ] SLA configurado (resposta + resolução)
- [ ] Capacidade máxima definida
- [ ] Mensagem de boas-vindas personalizada
- [ ] ✅ Checkbox "Núcleo Ativo" marcado
- [ ] ✅ Checkbox "Visível no Menu do WhatsApp" marcado
- [ ] Testado no WhatsApp

---

## 🧪 Como Testar

### Teste Rápido:

1. **Crie/edite um núcleo**
2. **Marque "Visível no Bot"**
3. **Salve**
4. **Abra WhatsApp**
5. **Envie "Olá"**
6. **Verifique se a opção aparece**
7. **Clique/digite a opção**
8. **Veja se transfere corretamente**

### Teste de Ordem:

1. **Crie 3 núcleos com prioridades: 1, 2, 3**
2. **Envie "Olá" no WhatsApp**
3. **Verifique se aparecem nesta ordem**

### Teste de Ocultar:

1. **Desmarque "Visível no Bot"**
2. **Salve**
3. **Envie "Olá" no WhatsApp**
4. **Verifique que a opção NÃO aparece mais**

---

## 🎨 Exemplos Práticos

### Exemplo 1: Suporte Técnico

```
Nome: Suporte Técnico
Código: SUPORTE_TEC
Descrição: Atendimento para problemas técnicos e bugs
Cor: #3B82F6 (azul)
Ícone: wrench
Prioridade: 1
SLA Resposta: 15 min
SLA Resolução: 4 horas
Capacidade: 30
Mensagem: 🛠️ Bem-vindo ao Suporte Técnico! Um especialista irá te atender em breve.
✅ Ativo
✅ Visível no Bot
```

### Exemplo 2: Financeiro

```
Nome: Financeiro
Código: FINANCEIRO
Descrição: Dúvidas sobre cobrança, pagamentos e negociação
Cor: #10B981 (verde)
Ícone: dollar-sign
Prioridade: 2
SLA Resposta: 60 min
SLA Resolução: 24 horas
Capacidade: 50
Mensagem: 💰 Você foi direcionado para o Financeiro. Nossa equipe irá te auxiliar!
✅ Ativo
✅ Visível no Bot
```

### Exemplo 3: Comercial

```
Nome: Comercial
Código: COMERCIAL
Descrição: Vendas, upgrades e contratação de serviços
Cor: #8B5CF6 (roxo)
Ícone: briefcase
Prioridade: 3
SLA Resposta: 15 min
SLA Resolução: 2 horas
Capacidade: 20
Mensagem: 🤝 Você foi direcionado para o Comercial. Vamos te ajudar!
✅ Ativo
✅ Visível no Bot
```

### Exemplo 4: Núcleo Interno (NÃO aparece no bot)

```
Nome: Administrativo Interno
Código: ADMIN_INT
Descrição: Tarefas administrativas internas
Cor: #6B7280 (cinza)
Ícone: file-text
Prioridade: 99
Capacidade: 100
✅ Ativo
❌ Visível no Bot ← NÃO aparece no WhatsApp
```

---

## 🚨 Problemas Comuns

### Problema 1: Opção não aparece no WhatsApp

**Causa:** Checkbox "Visível no Bot" desmarcado

**Solução:**
1. Edite o núcleo
2. Marque ✅ "Visível no Menu do WhatsApp"
3. Salve
4. Teste novamente

### Problema 2: Opção aparece em ordem errada

**Causa:** Campo "Prioridade" incorreto

**Solução:**
1. Verifique a prioridade de todos os núcleos
2. Ajuste para a ordem desejada (1, 2, 3...)
3. Salve
4. Teste no WhatsApp

### Problema 3: Erro ao criar núcleo

**Causa:** Código duplicado

**Solução:**
- Use código único (ex: SUPORTE_TEC_2)
- Não use espaços ou caracteres especiais

### Problema 4: Cliente não é transferido

**Causa:** Núcleo inativo ou sem equipe

**Solução:**
1. Verifique se ✅ "Núcleo Ativo" está marcado
2. Cadastre atendentes na equipe deste núcleo
3. Em **Gestão de Equipes**, associe atendentes ao núcleo

---

## 🔗 Páginas Relacionadas

- **Gestão de Equipes**: Associar atendentes aos núcleos
- **Gestão de Departamentos**: Estrutura hierárquica
- **Fluxos de Triagem**: Construtor visual de fluxos
- **Atendimento**: Ver tickets por núcleo

---

## 💡 Dicas Avançadas

### Dica 1: Use Emojis nos Nomes

```
✅ BOM: "🛠️ Suporte Técnico"
✅ BOM: "💰 Financeiro"
❌ RUIM: "Suporte Técnico" (sem emoji)
```

Emojis chamam atenção e melhoram UX no WhatsApp!

### Dica 2: Mensagens de Boas-Vindas Personalizadas

```
✅ BOM: "🛠️ Bem-vindo ao Suporte! Descreva seu problema e nossa equipe irá te ajudar."
❌ RUIM: "Você foi transferido." (genérico)
```

### Dica 3: Nomes Curtos e Claros

```
✅ BOM: "Financeiro"
✅ BOM: "Suporte"
❌ RUIM: "Departamento de Atendimento Financeiro da Empresa"
```

WhatsApp tem limite de caracteres!

### Dica 4: Use Prioridades Espaçadas

```
✅ BOM: 10, 20, 30, 40
❌ RUIM: 1, 2, 3, 4
```

Facilita inserir novos núcleos no meio depois!

---

**Última atualização:** 28/10/2025  
**Versão:** 2.0  
**Autor:** Equipe ConectCRM
