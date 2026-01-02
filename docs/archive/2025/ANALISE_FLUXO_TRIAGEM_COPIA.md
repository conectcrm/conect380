# 🔍 Análise: Fluxo "Triagem Inteligente WhatsApp (cópia)"

**Data**: 27/10/2025, 14:15  
**Fluxo ID**: `c87c962a-74bf-402e-b9e4-aaae09403c15`

---

## ❌ PROBLEMA IDENTIFICADO: Núcleos e Departamentos HARDCODED

### 🎯 Resumo Executivo:

O fluxo **NÃO está buscando** núcleos e departamentos do banco de dados. Todos estão **hardcoded (fixos)** na estrutura JSON do fluxo.

---

## 📊 Comparação: Banco vs Fluxo

### Núcleos no Banco de Dados (6 núcleos ativos):
```
1. ✅ Atendimento Geral
2. ✅ CSI
3. ✅ Comercial (2 registros)
4. ✅ Financeiro (4 registros)
5. ✅ Suporte Técnico (4 registros)
```

### Núcleos no Fluxo (3 núcleos hardcoded):
```
❌ MENU_NUCLEOS (etapa):
   1. Suporte Técnico      → menu_suporte
   2. Administrativo       → menu_administrativo
   3. Comercial            → menu_comercial
```

**Problema**: 
- ❌ Falta: "Atendimento Geral", "CSI"
- ❌ Inventado: "Administrativo" (não existe no banco)

---

### Departamentos no Banco (14 departamentos ativos):
```
1. ✅ Agrícola
2. ✅ Cobranças
3. ✅ Configuração de balança e bastão
4. ✅ Confinamento
5. ✅ Estoque Animais
6. ✅ Financeiro
7. ✅ Infraestrutura
8. ✅ PMG e Comunicação para Associação
9. ✅ Reprodução
10. ✅ Sisbov
11. ✅ Suporte Nível 1
12. ✅ Suporte Nível 2
13. ✅ Vendas Externas
14. ✅ Vendas Internas
```

### Departamentos no Fluxo (9 departamentos hardcoded):
```
❌ MENU_SUPORTE (3 departamentos):
   1. Infraestrutura   → transferir_infraestrutura
   2. Sistemas         → transferir_sistemas
   3. Help Desk        → transferir_helpdesk

❌ MENU_ADMINISTRATIVO (3 departamentos):
   1. Financeiro       → transferir_financeiro
   2. RH               → transferir_rh
   3. Processos        → transferir_processos

❌ MENU_COMERCIAL (3 departamentos):
   1. Vendas           → transferir_vendas
   2. Contratos        → transferir_contratos
   3. Pós-Vendas       → transferir_pos_vendas
```

**Problema**:
- ❌ Falta: 11 departamentos reais (Agrícola, Cobranças, Sisbov, etc.)
- ❌ Inventados: "Sistemas", "Help Desk", "RH", "Processos", "Contratos", "Pós-Vendas" (não existem no banco)
- ❌ Duplicado: "Financeiro" (existe, mas está no menu errado)

---

## 🎨 Estrutura Atual do Fluxo (Hardcoded)

### Etapa: boas-vindas
```json
{
  "id": "boas-vindas",
  "tipo": "mensagem",
  "mensagem": "Olá! Seja bem-vindo ao ConectCRM!\n\nPor favor, escolha uma das opções abaixo:",
  "proximaEtapa": "coleta-nome"
}
```

### Etapa: menu_nucleos
```json
{
  "id": "menu_nucleos",
  "tipo": "menu",
  "mensagem": "Olá! Bem-vindo ao ConectCRM.\n\nComo posso ajudá-lo? Selecione o núcleo desejado:",
  "usarBotoes": true,
  "opcoes": [
    {
      "id": "nucleo_suporte",
      "texto": "Suporte Tecnico",
      "valor": "suporte",
      "proximaEtapa": "menu_suporte"
    },
    {
      "id": "nucleo_administrativo",
      "texto": "Administrativo",
      "valor": "administrativo",
      "proximaEtapa": "menu_administrativo"
    },
    {
      "id": "nucleo_comercial",
      "texto": "Comercial",
      "valor": "comercial",
      "proximaEtapa": "menu_comercial"
    }
  ]
}
```

**Problema**: 
- ❌ 3 opções fixas (deveria buscar do banco)
- ❌ Não sincroniza com cadastro real

---

### Etapa: menu_suporte
```json
{
  "id": "menu_suporte",
  "tipo": "menu",
  "mensagem": "Suporte Técnico - Escolha o departamento:",
  "usarBotoes": true,
  "opcoes": [
    {"texto": "Infraestrutura", "proximaEtapa": "transferir_infraestrutura"},
    {"texto": "Sistemas", "proximaEtapa": "transferir_sistemas"},
    {"texto": "Help Desk", "proximaEtapa": "transferir_helpdesk"}
  ]
}
```

**Problema**:
- ❌ 3 opções fixas (deveria buscar departamentos do núcleo "Suporte Técnico")
- ❌ Ignora "Suporte Nível 1" e "Suporte Nível 2" que existem no banco

---

## ✅ Como DEVERIA Funcionar (Dinâmico)

### Busca de Núcleos (Backend):
```typescript
// Em FlowEngine ou TriagemBotService
const nucleos = await nucleoService.findOpcoesParaBot(empresaId);
// Retorna: [
//   { id: 'uuid-1', nome: 'Atendimento Geral', ativo: true },
//   { id: 'uuid-2', nome: 'CSI', ativo: true },
//   { id: 'uuid-3', nome: 'Comercial', ativo: true },
//   { id: 'uuid-4', nome: 'Financeiro', ativo: true },
//   { id: 'uuid-5', nome: 'Suporte Técnico', ativo: true }
// ]
```

### Busca de Departamentos (Backend):
```typescript
// Após usuário escolher núcleo
const departamentos = await departamentoService.findByNucleoId(nucleoId);
// Retorna departamentos daquele núcleo específico
```

### Menu Dinâmico (Resposta):
```json
{
  "mensagem": "Selecione o núcleo desejado:",
  "opcoes": [
    {"id": "nucleo-uuid-1", "texto": "Atendimento Geral"},
    {"id": "nucleo-uuid-2", "texto": "CSI"},
    {"id": "nucleo-uuid-3", "texto": "Comercial"},
    {"id": "nucleo-uuid-4", "texto": "Financeiro"},
    {"id": "nucleo-uuid-5", "texto": "Suporte Técnico"}
  ]
}
```

---

## 🔧 Código Existente que Faz Busca Dinâmica

### ✅ Já existe lógica no FlowEngine!

**Arquivo**: `backend/src/modules/triagem/engine/flow-engine.ts`

**Linha ~115**:
```typescript
if (etapaId === 'boas-vindas') {
  const menuNucleos = await this.resolverMenuNucleos(opcoesMenu, mensagem);
  if (menuNucleos) {
    mensagem = menuNucleos.mensagem;
    opcoesMenu = menuNucleos.opcoes;  // ← BUSCA DINÂMICA!
  }
}
```

**Linha ~130**:
```typescript
if (etapaId === 'escolha-departamento') {
  const menuDepartamentos = await this.resolverMenuDepartamentos();
  if (menuDepartamentos?.autoAvancar) {
    return { /* ... */ };
  }
  
  if (menuDepartamentos && 'mensagem' in menuDepartamentos) {
    mensagem = menuDepartamentos.mensagem;
    opcoesMenu = menuDepartamentos.opcoes;  // ← BUSCA DINÂMICA!
  }
}
```

**Problema**: 
- ✅ Código existe e funciona
- ❌ Só funciona se etapa se chamar **"boas-vindas"** ou **"escolha-departamento"**
- ❌ Fluxo atual usa **"menu_nucleos"** e **"menu_suporte"** (não ativa busca dinâmica!)

---

## 🎯 Solução: Renomear Etapas ou Adicionar IDs Especiais

### Opção 1: Renomear Etapas (MAIS SIMPLES)

**Etapa de núcleos**: Renomear `menu_nucleos` → `boas-vindas`  
**Etapa de departamentos**: Renomear `menu_suporte` → `escolha-departamento`

**Vantagem**: Código já funciona, zero mudança no backend!

---

### Opção 2: Adicionar Metadata nas Etapas

**No fluxo JSON**:
```json
{
  "id": "menu_nucleos",
  "tipo": "menu",
  "metadata": {
    "buscarNucleosDinamicamente": true
  }
}
```

**No FlowEngine**, adicionar verificação:
```typescript
if (etapa.metadata?.buscarNucleosDinamicamente) {
  const menuNucleos = await this.resolverMenuNucleos(opcoesMenu, mensagem);
  // ...
}
```

**Vantagem**: Mais flexível, mas requer mudança no backend.

---

## 📋 Checklist de Correção

### Para ativar busca dinâmica IMEDIATAMENTE:

- [ ] Abrir fluxo no editor visual
- [ ] Localizar etapa **"menu_nucleos"**
- [ ] Renomear ID para **"boas-vindas"**
- [ ] Salvar e publicar
- [ ] Testar no WhatsApp
- [ ] ✅ Deve listar TODOS os 6 núcleos do banco!

### Para departamentos:

- [ ] Criar etapa com ID **"escolha-departamento"**
- [ ] Conectar após escolha de núcleo
- [ ] Remover etapas hardcoded (`menu_suporte`, `menu_administrativo`, `menu_comercial`)
- [ ] Salvar e publicar
- [ ] Testar no WhatsApp
- [ ] ✅ Deve listar departamentos do núcleo escolhido!

---

## 🚨 Impactos do Problema Atual

### Para o Cliente:
- ❌ Não vê núcleos reais ("Atendimento Geral", "CSI")
- ❌ Vê núcleos inexistentes ("Administrativo")
- ❌ Falta 11 departamentos reais
- ❌ Vê departamentos que não existem

### Para a Gestão:
- ❌ Cadastrar novo núcleo → não aparece no bot
- ❌ Cadastrar novo departamento → não aparece no bot
- ❌ Desativar núcleo → continua aparecendo no bot
- ❌ Impossível sincronizar estrutura organizacional

### Para a Manutenção:
- ❌ Toda mudança requer editar fluxo manualmente
- ❌ Difícil manter consistência
- ❌ Risco de divergência entre cadastro e bot

---

## ✅ Benefícios da Busca Dinâmica

### Para o Cliente:
- ✅ Vê opções reais e atualizadas
- ✅ Direcionamento correto
- ✅ Experiência consistente

### Para a Gestão:
- ✅ Cadastrou núcleo → aparece automaticamente
- ✅ Desativou → some automaticamente
- ✅ Estrutura sempre sincronizada

### Para a Manutenção:
- ✅ Zero edição manual do fluxo
- ✅ Mudanças apenas no cadastro
- ✅ Consistência garantida

---

## 🎓 Exemplo de Fluxo Correto

### Estrutura Ideal:
```json
{
  "etapaInicial": "boas-vindas",
  "etapas": {
    "boas-vindas": {
      "id": "boas-vindas",
      "tipo": "menu",
      "mensagem": "Olá! Selecione o núcleo desejado:",
      "opcoes": []  // ← Busca dinâmica ativa!
    },
    "escolha-departamento": {
      "id": "escolha-departamento",
      "tipo": "menu",
      "mensagem": "Escolha o departamento:",
      "opcoes": []  // ← Busca dinâmica ativa!
    },
    "transferir-atendimento": {
      "id": "transferir-atendimento",
      "tipo": "acao",
      "acao": "transferir",
      "mensagem": "Encaminhando para {{departamentoNome}}..."
    }
  }
}
```

---

## 🛠️ Próximos Passos Recomendados

### Curto Prazo (HOJE):
1. ✅ Documentar problema (CONCLUÍDO)
2. ⏸️ Abrir editor visual
3. ⏸️ Renomear `menu_nucleos` → `boas-vindas`
4. ⏸️ Criar etapa `escolha-departamento`
5. ⏸️ Remover menus hardcoded
6. ⏸️ Salvar e publicar
7. ⏸️ Testar com WhatsApp

### Médio Prazo (ESTA SEMANA):
1. ⏸️ Revisar todos os fluxos existentes
2. ⏸️ Padronizar nomenclatura de etapas
3. ⏸️ Criar template de fluxo dinâmico
4. ⏸️ Documentar best practices

### Longo Prazo (MÊS):
1. ⏸️ Adicionar validação no editor visual
2. ⏸️ Warning ao usar opções hardcoded
3. ⏸️ Sugestão automática de busca dinâmica
4. ⏸️ Migração automática de fluxos antigos

---

## 📊 Estatísticas

### Dados do Banco:
- **Núcleos Ativos**: 6 (10 registros total)
- **Departamentos Ativos**: 14
- **Cobertura do Fluxo**: 33% (3/6 núcleos parcialmente)
- **Precisão**: 0% (todos os dados são fictícios)

### Impacto Estimado:
- **Clientes afetados**: 100% (todos que usam WhatsApp)
- **Tempo para corrigir**: 15-30 minutos
- **Risco de regressão**: BAIXO (só renomear etapas)

---

**Conclusão**: O fluxo atual está completamente **hardcoded** e **NÃO** busca dados do banco. É necessário renomear etapas para ativar a busca dinâmica já implementada no backend.

---

**Desenvolvido por**: GitHub Copilot + Equipe ConectCRM  
**Data**: 27/10/2025
