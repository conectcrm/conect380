# ✅ Checklist Rápido - Templates de Mensagens

**Data**: 7/nov/2025 - 20:50  
**Objetivo**: Validação rápida da funcionalidade completa de Templates

---

## 🚀 Ambiente Verificado

- [x] Backend rodando na porta 3001 (PID: 13664) ✅
- [x] Frontend rodando na porta 3000 (PID: 10500) ✅
- [x] Database conectado ✅
- [x] JWT funcionando (401 sem token) ✅
- [x] Navegador aberto em http://localhost:3000 ✅

---

## 📋 Testes Essenciais (6 testes rápidos)

### ✅ Teste 1: Acessar Página de Templates

**Como fazer**:
1. Fazer login no sistema
2. Clicar em: Menu > Atendimento > Templates de Mensagens
3. Verificar URL: `/nuclei/atendimento/templates`

**O que deve aparecer**:
- [ ] Header: "Templates de Mensagens" com ícone FileText roxo
- [ ] Botão "Novo Template" (roxo #9333EA)
- [ ] Botão "Atualizar" (branco)
- [ ] Barra de busca
- [ ] Dropdown de categorias
- [ ] Grid de cards ou estado vazio

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

### ✅ Teste 2: Criar Template Simples

**Como fazer**:
1. Clicar em "Novo Template"
2. Preencher:
   - **Título**: Boas-vindas
   - **Atalho**: oi
   - **Categoria**: Saudações
   - **Conteúdo**: Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?
3. Clicar em "Salvar"

**O que deve acontecer**:
- [ ] Modal abre com formulário
- [ ] Botão "Salvar" fica habilitado após preencher título
- [ ] Toast de sucesso: "Template criado com sucesso!"
- [ ] Modal fecha automaticamente
- [ ] Novo card aparece na lista com título "Boas-vindas"

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

### ✅ Teste 3: Criar Template com Variáveis

**Como fazer**:
1. Clicar em "Novo Template"
2. Preencher:
   - **Título**: Confirmação de Atendimento
   - **Atalho**: confirm
   - **Categoria**: Atendimento
   - **Conteúdo**: 
     ```
     Olá {{nome}}!
     
     Seu ticket #{{ticket}} foi registrado com sucesso.
     Data: {{data}} às {{hora}}
     Atendente: {{atendente}}
     
     Obrigado por entrar em contato!
     ```
3. Clicar em "Salvar"

**O que deve acontecer**:
- [ ] Conteúdo aceita digitação de {{variáveis}}
- [ ] Seção "Variáveis Disponíveis" mostra 14 botões
- [ ] Clicar em botão de variável (ex: {{nome}}) insere no conteúdo
- [ ] Toast de sucesso aparece
- [ ] Card mostra badge "4 variáveis" (nome, ticket, data, hora, atendente)

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

### ✅ Teste 4: Usar Template no Chat

**Como fazer**:
1. Navegar para: Chat
2. Selecionar um ticket ativo
3. Clicar no botão **Templates** (ícone FileText roxo ao lado do emoji)
4. Clicar no template "Boas-vindas"

**O que deve acontecer**:
- [ ] Botão Templates (FileText roxo) aparece na barra de ferramentas do chat
- [ ] Dropdown abre mostrando lista de templates
- [ ] Ao clicar em "Boas-vindas", o texto é inserido no campo de mensagem:
   ```
   Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?
   ```
- [ ] Dropdown fecha automaticamente
- [ ] Campo de mensagem fica focado, pronto para enviar

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

### ✅ Teste 5: Autocomplete com `/`

**Como fazer**:
1. No chat, no campo de mensagem, digite: `/`
2. Observe o autocomplete aparecer
3. Digite: `/oi`
4. Clique no item "Boas-vindas (/oi)"

**O que deve acontecer**:
- [ ] Ao digitar `/`, popup de autocomplete aparece
- [ ] Lista mostra templates com formato: "Título (/atalho)"
- [ ] Ao digitar `/oi`, filtra apenas "Boas-vindas (/oi)"
- [ ] Ao clicar, template é inserido no campo
- [ ] Popup fecha
- [ ] Texto pronto para enviar

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

### ✅ Teste 6: Substituição de Variáveis no Chat

**Como fazer**:
1. No chat com ticket ativo, clicar no botão Templates
2. Selecionar "Confirmação de Atendimento" (template com variáveis)
3. Observar o texto inserido no campo de mensagem

**O que deve acontecer**:
- [ ] Variáveis são substituídas automaticamente:
   - `{{nome}}` → Nome do cliente do ticket
   - `{{ticket}}` → ID do ticket
   - `{{data}}` → Data atual (ex: 07/11/2025)
   - `{{hora}}` → Hora atual (ex: 20:50)
   - `{{atendente}}` → Nome do atendente logado
- [ ] Texto substituído aparece no campo
- [ ] Pronto para enviar

**Resultado**: [ ] ✅ Passou  [ ] ❌ Falhou  [ ] 🐛 Bug encontrado

**Observações**:
```
[Escreva aqui se encontrou algo diferente do esperado]
```

---

## 📊 Resumo dos Testes

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Acessar Página | [ ] | |
| 2. Criar Template Simples | [ ] | |
| 3. Criar Template com Variáveis | [ ] | |
| 4. Usar Template no Chat | [ ] | |
| 5. Autocomplete `/` | [ ] | |
| 6. Substituição de Variáveis | [ ] | |

**Total Aprovado**: ___/6 (___%)

---

## 🎯 Critério de Aprovação

- **100% (6/6)**: ✅ Feature aprovada para produção
- **83-99% (5/6)**: ⚠️ Aprovado com ressalvas (documentar bugs menores)
- **<83% (<5/6)**: ❌ Precisa correção antes de produção

---

## 🐛 Bugs Encontrados

**Bug #1**:
- **Teste**: [Número do teste]
- **Descrição**: [O que aconteceu de errado]
- **Passos para reproduzir**:
  1. [Passo 1]
  2. [Passo 2]
- **Esperado**: [O que deveria acontecer]
- **Observado**: [O que realmente aconteceu]
- **Gravidade**: [ ] Alta [ ] Média [ ] Baixa

---

## ✅ Aprovação Final

- [ ] Todos os testes passaram
- [ ] Bugs críticos foram corrigidos
- [ ] Feature pronta para produção

**Testado por**: _________________  
**Data**: ___/___/2025  
**Hora**: ___:___

---

## 📝 Próximos Passos

- Se **todos passaram** ✅:
  1. Atualizar RESULTADOS_TESTES_TEMPLATES.md com "6/6 aprovados"
  2. Atualizar AUDITORIA_PROGRESSO_REAL.md com "Testes: 100%"
  3. Feature liberada para produção

- Se **algum falhou** ❌:
  1. Documentar bugs encontrados
  2. Criar plano de correção
  3. Refazer testes após fixes

---

**💡 Dica**: Use este checklist como guia rápido. Para testes detalhados, consulte `GUIA_TESTE_TEMPLATES_MENSAGENS.md` (20 testes completos).
