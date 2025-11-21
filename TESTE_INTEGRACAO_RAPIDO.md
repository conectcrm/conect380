# 🚀 Guia Rápido: Testar Integração Bot → Núcleos → Departamentos

**Tempo estimado**: 15-20 minutos  
**Objetivo**: Validar fluxo completo end-to-end

---

## 📋 Checklist Inicial

Antes de começar, verifique:

- [x] ✅ Backend rodando (porta 3001)
- [x] ✅ Frontend rodando (porta 3000)
- [ ] ⚠️ Banco com dados:
  - [ ] Pelo menos 2 núcleos ativos
  - [ ] Pelo menos 2 departamentos vinculados
  - [ ] Pelo menos 2 agentes ativos
- [ ] ⚠️ WhatsApp conectado (opcional para teste completo)

---

## 🎯 Teste Rápido 1: Verificar Dados no Banco (5 min)

### **1.1. Verificar Núcleos**

1. Acesse: http://localhost:3000/gestao/nucleos
2. Verifique se há **pelo menos 2 núcleos** listados
3. Expanda um núcleo (▼)
4. **Confirme**:
   - ✅ Tem departamentos vinculados? OU
   - ✅ Tem "Agentes Destinados" (número > 0)?

**Se não tiver dados**: Crie agora!
- Crie 2 núcleos: "Suporte" e "Vendas"
- Vincule departamentos ou agentes

---

### **1.2. Verificar Departamentos**

1. Acesse: http://localhost:3000/gestao/departamentos
2. Verifique se há **pelo menos 2 departamentos**
3. **Confirme**:
   - ✅ Pelo menos 1 departamento vinculado a núcleo
   - ✅ Pelo menos 1 departamento com agentes (contador > 0)

**Se não tiver agentes**: Vincule agora!
- Clique "Gerenciar Agentes" em um departamento
- Selecione pelo menos 2 agentes

---

## 🎯 Teste Rápido 2: Criar Fluxo Dinâmico (10 min)

### **2.1. Acessar FluxoBuilder**

1. Acesse: http://localhost:3000/gestao/fluxos
2. Clique **"Novo Fluxo"**
3. Preencha:
   - **Nome**: `Teste Integração Dinâmica`
   - **Descrição**: `Teste de núcleos e departamentos dinâmicos`
   - **Tipo**: `triagem`
   - **Canais**: ✓ WhatsApp
4. Clique **"Criar"**
5. Clique **"Editar no Builder"** (ícone de editar)

---

### **2.2. Criar Estrutura de Blocos**

**No canvas do FluxoBuilder**, crie esta estrutura:

#### **Bloco 1: Início/Boas-vindas**
- **Tipo**: Menu (ou Message + Menu)
- **ID/Nome**: `boas-vindas`
- **Mensagem**: `Olá! Escolha o núcleo:`
- **Opções**: Deixe VAZIO ou adicione apenas 1 opção genérica
- **Conectar a**: Bloco 2

#### **Bloco 2: Escolha de Departamento**
- **Tipo**: Menu
- **ID/Nome**: `escolha-departamento`
- **Mensagem**: `Selecione o departamento:`
- **Opções**: Deixe VAZIO
- **Conectar a**: Bloco 3

#### **Bloco 3: Coleta de Nome**
- **Tipo**: Question (Pergunta)
- **ID/Nome**: `coleta-nome`
- **Mensagem**: `Qual é o seu nome?`
- **Salvar em**: `nomeCliente`
- **Conectar a**: Bloco 4

#### **Bloco 4: Fim/Transferir**
- **Tipo**: End ou Action
- **ID/Nome**: `fim`
- **Mensagem**: `Obrigado! Em breve você será atendido.`

---

### **2.3. Salvar e Publicar**

1. Clique **"Salvar"** (canto superior direito)
2. Aguarde confirmação
3. Clique **"Publicar"**
4. Confirme publicação

**✅ Resultado Esperado**:
- Badge "Publicado" aparece
- Status: Ativo

---

## 🎯 Teste Rápido 3: Validar JSON (3 min)

### **3.1. Visualizar JSON Gerado**

1. Volte para: http://localhost:3000/gestao/fluxos
2. Localize o fluxo "Teste Integração Dinâmica"
3. Clique no ícone **`</>`** (Visualizar JSON)

### **3.2. Verificar Estrutura**

**O JSON DEVE ter esta estrutura**:

```json
{
  "etapaInicial": "boas-vindas",
  "etapas": {
    "boas-vindas": {
      "id": "boas-vindas",
      "tipo": "menu",
      "mensagem": "Olá! Escolha o núcleo:",
      "opcoes": []  // ← DEVE ESTAR VAZIO!
    },
    "escolha-departamento": {
      "id": "escolha-departamento",
      "tipo": "menu",
      "mensagem": "Selecione o departamento:",
      "opcoes": []  // ← DEVE ESTAR VAZIO!
    }
  }
}
```

**✅ Confirmações**:
- [ ] ID das etapas são exatamente: `boas-vindas` e `escolha-departamento`
- [ ] Campo `opcoes` está vazio: `[]`
- [ ] NÃO tem etapas hardcoded tipo: `menu_suporte`, `menu_administrativo`

**❌ Se estiver ERRADO**:
- Volte ao FluxoBuilder
- Delete blocos com IDs errados
- Recrie com IDs corretos
- Salve e republique

---

## 🎯 Teste Rápido 4: Simular Execução (5 min)

**Como o backend não tem autenticação funcionando nos testes**, vamos verificar logs:

### **4.1. Abrir Terminal do Backend**

1. Localize o terminal onde o backend está rodando
2. Procure por mensagens do tipo:

```
[FLOW ENGINE] 🔍 Resolvendo menu de núcleos...
[FLOW ENGINE] 📊 Encontrados X núcleos ativos
[FLOW ENGINE] 🎯 Núcleos: Suporte, Vendas, ...
```

### **4.2. Verificar Logs Esperados**

**Se você enviar uma mensagem no WhatsApp** (se estiver conectado), deve ver:

```
[TRIAGEM] Nova mensagem recebida
[FLOW ENGINE] Iniciando fluxo: Teste Integração Dinâmica
[FLOW ENGINE] Etapa atual: boas-vindas
[FLOW ENGINE] 🔍 Resolvendo menu de núcleos...
[FLOW ENGINE] 📊 Encontrados 2 núcleos ativos
[FLOW ENGINE] ✅ Opções geradas: 2
```

**Se o usuário escolher opção 1**:

```
[FLOW ENGINE] Etapa atual: escolha-departamento
[FLOW ENGINE] 🔍 Resolvendo menu de departamentos...
[FLOW ENGINE] 🏢 Núcleo selecionado: Suporte
[FLOW ENGINE] 📊 Encontrados 3 departamentos no núcleo
[FLOW ENGINE] ✅ Opções geradas: 3
```

---

## ✅ Checklist de Validação Final

Após todos os testes, confirme:

### Dados:
- [ ] Pelo menos 2 núcleos ativos no sistema
- [ ] Pelo menos 2 departamentos vinculados a núcleos
- [ ] Pelo menos 2 agentes vinculados a departamentos

### Fluxo:
- [ ] Fluxo criado no FluxoBuilder
- [ ] JSON com etapas: `boas-vindas` e `escolha-departamento`
- [ ] Campo `opcoes` vazio (`[]`) nas duas etapas
- [ ] Fluxo publicado e ativo

### Backend:
- [ ] Logs mostram "Resolvendo menu de núcleos"
- [ ] Logs mostram quantidade correta de núcleos/departamentos
- [ ] Sem erros no terminal do backend

---

## 🐛 Troubleshooting

### **Problema 1**: Fluxo não aparece no WhatsApp

**Solução**:
1. Verificar se fluxo está publicado
2. Verificar se canal "WhatsApp" está marcado
3. Verificar se WhatsApp está conectado (Evolution API / Baileys)
4. Verificar webhook configurado

---

### **Problema 2**: Núcleos não aparecem dinamicamente

**Verificar**:
1. JSON do fluxo tem `opcoes: []` vazio?
2. ID da etapa é exatamente `boas-vindas`?
3. Backend tem núcleos ativos no banco?
4. Logs do backend mostram "Resolvendo menu de núcleos"?

**Se logs NÃO aparecem**:
- FlowEngine não está reconhecendo a etapa
- Verificar se ID está correto (case-sensitive)
- Verificar se tipo da etapa é `menu`

---

### **Problema 3**: Departamentos não aparecem

**Verificar**:
1. JSON tem etapa `escolha-departamento` com `opcoes: []`?
2. Núcleo escolhido TEM departamentos vinculados?
3. Departamentos estão ATIVOS?
4. Logs mostram "Resolvendo menu de departamentos"?

---

### **Problema 4**: Backend retorna erro 401/Unauthorized nos testes

**Esperado**: Testes automatizados requerem autenticação

**Solução**:
- Testes automatizados precisam de usuário válido
- Para teste manual: use WhatsApp real ou UI do sistema
- Para teste API: criar token JWT válido primeiro

---

## 🎉 Sucesso! O Que Significa?

Se todos os checklis estão ✅, significa que:

1. ✅ **Sistema de Núcleos e Departamentos funcional**
2. ✅ **FlowEngine buscando dados dinamicamente**
3. ✅ **Integração Backend ↔ Frontend OK**
4. ✅ **Pronto para testes reais com WhatsApp**

---

## 🚀 Próximo Passo

**Se tudo funcionou**: Teste real com WhatsApp!

1. Conecte WhatsApp (Evolution API ou Baileys)
2. Configure webhook
3. Envie mensagem real
4. Valide fluxo completo:
   - Escolha de núcleo
   - Escolha de departamento
   - Coleta de dados
   - Criação de ticket
   - Atribuição de atendente

**Se algo falhou**: Reporte os detalhes!

---

**Última Atualização**: 28 de outubro de 2025  
**Autor**: Equipe ConectCRM
