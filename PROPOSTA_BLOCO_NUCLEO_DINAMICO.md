# 🎯 Proposta: Bloco Dinâmico de Núcleos/Departamentos

**Data**: 27/10/2025  
**Objetivo**: Sincronização automática entre cadastro e fluxo visual

---

## 💡 Sua Ideia Original (EXCELENTE!)

> "No menu de opções, ao inserir um núcleo no bot, pudesse selecionar o núcleo e departamentos, descrição deles e a ação se já pode transferir ou próximos ou algo do tipo, dessa forma ao adicionar qualquer modificação relacionado ao menu, já sincroniza com o que temos cadastrados no sistema."

✅ **Validação**: Ideia **PERFEITA**! Resolve 100% do problema atual.

---

## 🚀 Minha Proposta Melhorada

### Criar **3 Novos Tipos de Blocos** no Editor Visual:

1. **📋 Bloco "Menu de Núcleos"** (Busca Dinâmica)
2. **🏢 Bloco "Menu de Departamentos"** (Busca Dinâmica)
3. **🎯 Bloco "Transferir para Atendimento"** (Configurável)

---

## 🎨 Visualização no Editor

### Paleta de Blocos (Sidebar Esquerda):

```
┌─────────────────────────────────────┐
│  📦 BLOCOS DISPONÍVEIS              │
├─────────────────────────────────────┤
│                                     │
│  🟢 Início                          │
│  💬 Mensagem                        │
│  ❓ Pergunta                        │
│  🔀 Condição                        │
│                                     │
│  ════ MENUS DINÂMICOS ════          │
│                                     │
│  📋 Menu de Núcleos      [NOVO!]   │
│     └─ Busca automática do banco   │
│                                     │
│  🏢 Menu de Departamentos [NOVO!]  │
│     └─ Filtra por núcleo escolhido │
│                                     │
│  🎯 Transferir Atendimento [NOVO!] │
│     └─ Criar ticket + transferir   │
│                                     │
│  🛑 Finalizar                       │
│                                     │
└─────────────────────────────────────┘
```

---

## 📋 Bloco 1: "Menu de Núcleos" (Dinâmico)

### Visual do Bloco no Canvas:

```
┌─────────────────────────────────────────┐
│  📋 Menu de Núcleos                     │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Busca Automática: SIM               │
│  📊 Núcleos Encontrados: 6              │
│                                         │
│  Mensagem:                              │
│  ┌─────────────────────────────────┐   │
│  │ Como posso ajudá-lo? Selecione  │   │
│  │ o setor desejado:               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🎨 Formato: [Botões Reply ▼]          │
│  ⏱️ Timeout: 5 minutos                  │
│                                         │
│  ⚙️ Opções Avançadas:                   │
│  □ Incluir núcleo "Atendimento Geral"  │
│  □ Ordenar por nome                     │
│  □ Mostrar descrição                    │
│                                         │
└─────────────────────────────────────────┘
         │
         ├─→ [Próxima Etapa] Menu Departamentos
         └─→ [Se Timeout] Mensagem de Ajuda
```

### Configuração do Bloco (Painel Direito):

```
┌─────────────────────────────────────────┐
│  ⚙️ CONFIGURAÇÕES - Menu de Núcleos     │
├─────────────────────────────────────────┤
│                                         │
│  📝 Mensagem do Menu:                   │
│  ┌─────────────────────────────────┐   │
│  │ Como posso ajudá-lo? Selecione  │   │
│  │ o setor desejado:               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🔄 Tipo de Busca:                      │
│  ● Dinâmica (atualiza automaticamente) │
│  ○ Estática (lista fixa)                │
│                                         │
│  🎯 Origem dos Dados:                   │
│  [✓] Buscar do banco de dados           │
│  [✓] Apenas núcleos ativos              │
│  [ ] Incluir inativos                   │
│                                         │
│  🎨 Formato de Exibição:                │
│  ┌─────────────────────────────────┐   │
│  │ Botões Reply (até 3)        [▼]│   │
│  │ Menu de Lista (4-10)            │   │
│  │ Texto Numerado (10+)            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📊 Preview em Tempo Real:              │
│  ┌─────────────────────────────────┐   │
│  │ 1️⃣ Atendimento Geral             │   │
│  │ 2️⃣ CSI                            │   │
│  │ 3️⃣ Comercial                      │   │
│  │ 4️⃣ Financeiro                     │   │
│  │ 5️⃣ Suporte Técnico                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🔗 Ação Após Escolha:                  │
│  ● Ir para Menu de Departamentos        │
│  ○ Transferir Direto (sem departamento) │
│  ○ Próximo Bloco Personalizado          │
│                                         │
│  💾 Salvar em Variável:                 │
│  [✓] nucleoEscolhido                    │
│  [✓] nucleoId                           │
│  [✓] nucleoNome                         │
│                                         │
│  ⏱️ Comportamento de Timeout:           │
│  Tempo: [5] minutos                     │
│  Ação: [Enviar mensagem ▼]             │
│  Msg: "Ainda está aí? Precisa de ajuda?"│
│                                         │
│  [💾 Salvar]  [🔄 Atualizar Preview]   │
│                                         │
└─────────────────────────────────────────┘
```

### Dados Salvos no Contexto da Sessão:

Quando usuário escolhe "Suporte Técnico":
```json
{
  "nucleoEscolhido": "suporte_tecnico",
  "nucleoId": "997b7cd3-fd59-4ceb-8d5f-2ea3de52cf96",
  "nucleoNome": "Suporte Técnico",
  "nucleoDescricao": "Atendimento para problemas técnicos..."
}
```

---

## 🏢 Bloco 2: "Menu de Departamentos" (Dinâmico)

### Visual do Bloco no Canvas:

```
┌─────────────────────────────────────────┐
│  🏢 Menu de Departamentos               │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Busca Automática: SIM               │
│  🔗 Filtro: Núcleo Selecionado          │
│  📊 Departamentos: 2                    │
│                                         │
│  Mensagem:                              │
│  ┌─────────────────────────────────┐   │
│  │ Escolha o departamento de       │   │
│  │ {{nucleoNome}}:                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🎨 Formato: [Botões Reply ▼]          │
│  ⏱️ Timeout: 5 minutos                  │
│                                         │
│  ⚙️ Comportamento Especial:             │
│  [✓] Se apenas 1 depto → auto-avançar  │
│  [✓] Se 0 deptos → ir para "geral"     │
│                                         │
└─────────────────────────────────────────┘
         │
         ├─→ [Próxima Etapa] Transferir Atendimento
         └─→ [Se 0 deptos] Atendimento Geral
```

### Configuração do Bloco (Painel Direito):

```
┌─────────────────────────────────────────┐
│  ⚙️ CONFIGURAÇÕES - Menu Departamentos  │
├─────────────────────────────────────────┤
│                                         │
│  📝 Mensagem do Menu:                   │
│  ┌─────────────────────────────────┐   │
│  │ Escolha o departamento de       │   │
│  │ {{nucleoNome}}:                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🔗 Filtrar Por:                        │
│  ● Núcleo selecionado ({{nucleoId}})   │
│  ○ Todos os departamentos               │
│  ○ Departamento específico [   ]        │
│                                         │
│  🎯 Origem dos Dados:                   │
│  [✓] Buscar do banco de dados           │
│  [✓] Apenas departamentos ativos        │
│  [✓] Apenas com atendentes disponíveis  │
│                                         │
│  🎨 Formato de Exibição:                │
│  ┌─────────────────────────────────┐   │
│  │ Botões Reply (até 3)        [▼]│   │
│  └─────────────────────────────────┘   │
│                                         │
│  📊 Preview (baseado em {{nucleoId}}):  │
│  ┌─────────────────────────────────┐   │
│  │ 1️⃣ Suporte Nível 1                │   │
│  │    └─ 3 atendentes online        │   │
│  │ 2️⃣ Suporte Nível 2                │   │
│  │    └─ 1 atendente online         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  🤖 Comportamento Inteligente:          │
│  [✓] Se 1 depto → avançar automaticamente│
│  [✓] Se 0 deptos → ir para "geral"     │
│  [ ] Permitir voltar para núcleos       │
│                                         │
│  💾 Salvar em Variável:                 │
│  [✓] departamentoEscolhido              │
│  [✓] departamentoId                     │
│  [✓] departamentoNome                   │
│                                         │
│  🔗 Próxima Ação:                       │
│  ● Transferir para Atendimento          │
│  ○ Coletar mais dados                   │
│  ○ Próximo Bloco Personalizado          │
│                                         │
│  [💾 Salvar]  [🔄 Atualizar Preview]   │
│                                         │
└─────────────────────────────────────────┘
```

### Dados Salvos no Contexto:

Quando usuário escolhe "Suporte Nível 1":
```json
{
  "nucleoId": "997b7cd3-fd59-4ceb-8d5f-2ea3de52cf96",
  "nucleoNome": "Suporte Técnico",
  "departamentoEscolhido": "suporte_nivel_1",
  "departamentoId": "4e782ac9-5a79-47a6-8d41-0338ffb7864a",
  "departamentoNome": "Suporte Nível 1",
  "departamentoDescricao": "Primeiro nível de suporte técnico..."
}
```

---

## 🎯 Bloco 3: "Transferir para Atendimento"

### Visual do Bloco no Canvas:

```
┌─────────────────────────────────────────┐
│  🎯 Transferir para Atendimento         │
├─────────────────────────────────────────┤
│                                         │
│  🎫 Ação: Criar Ticket + Transferir     │
│  🏢 Departamento: {{departamentoNome}}  │
│  👤 Atendente: Automático (fila)        │
│                                         │
│  Mensagem Final:                        │
│  ┌─────────────────────────────────┐   │
│  │ Encaminhando para                │   │
│  │ {{departamentoNome}}...          │   │
│  │                                  │   │
│  │ Em breve um atendente irá        │   │
│  │ ajudá-lo! 😊                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚙️ Configurações:                      │
│  [✓] Criar ticket automaticamente       │
│  [✓] Prioridade: Normal                 │
│  [✓] Incluir histórico da conversa      │
│                                         │
│  ✅ Finaliza Triagem                    │
│                                         │
└─────────────────────────────────────────┘
         │
         └─→ [FIM] (Sessão transferida)
```

### Configuração do Bloco (Painel Direito):

```
┌─────────────────────────────────────────┐
│  ⚙️ CONFIGURAÇÕES - Transferência       │
├─────────────────────────────────────────┤
│                                         │
│  🎫 Tipo de Transferência:              │
│  ● Criar Ticket + Transferir Fila       │
│  ○ Transferir Direto para Atendente     │
│  ○ Apenas Criar Ticket (sem transferir) │
│                                         │
│  🏢 Destino da Transferência:           │
│  ● Departamento Selecionado:            │
│    {{departamentoNome}}                 │
│  ○ Núcleo Selecionado (sem depto)       │
│  ○ Departamento Específico [   ]        │
│                                         │
│  👤 Atribuição de Atendente:            │
│  ● Automático (próximo da fila)         │
│  ○ Round-robin (distribuir igualmente)  │
│  ○ Menos ocupado                        │
│  ○ Especialista (por tag/skill)         │
│                                         │
│  📋 Dados do Ticket:                    │
│  Assunto:                               │
│  ┌─────────────────────────────────┐   │
│  │ Atendimento via WhatsApp        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Descrição:                             │
│  ┌─────────────────────────────────┐   │
│  │ Cliente: {{nome}}               │   │
│  │ Telefone: {{telefone}}          │   │
│  │ Núcleo: {{nucleoNome}}          │   │
│  │ Departamento: {{departamentoNome}}│  │
│  └─────────────────────────────────┘   │
│                                         │
│  🎯 Prioridade do Ticket:               │
│  ┌─────────────────────────────────┐   │
│  │ Normal                      [▼]│   │
│  │ ────────────────────────────    │   │
│  │ Baixa                           │   │
│  │ Normal                          │   │
│  │ Alta                            │   │
│  │ Urgente                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📝 Mensagem Final ao Cliente:          │
│  ┌─────────────────────────────────┐   │
│  │ Encaminhando para               │   │
│  │ {{departamentoNome}}...         │   │
│  │                                 │   │
│  │ Em breve um atendente irá       │   │
│  │ ajudá-lo! 😊                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📎 Anexar à Conversa:                  │
│  [✓] Histórico completo de mensagens    │
│  [✓] Dados coletados (nome, email, etc)│
│  [✓] Núcleo e departamento escolhidos   │
│  [ ] Anexos enviados pelo cliente       │
│                                         │
│  🔔 Notificações:                       │
│  [✓] Notificar atendente por WhatsApp   │
│  [✓] Notificar atendente no sistema     │
│  [ ] Enviar email para supervisor       │
│                                         │
│  [💾 Salvar]  [✅ Transferir Agora]    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎬 Exemplo de Fluxo Completo no Editor

### Canvas Visual:

```
┌──────────────┐
│   🟢 INÍCIO  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│   💬 Mensagem de Boas-Vindas │
│                              │
│  "Olá! Seja bem-vindo ao     │
│   ConectCRM!"                │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   ❓ Pergunta: Nome          │
│                              │
│  "Por favor, informe seu     │
│   nome completo:"            │
│                              │
│  Variável: {{nome}}          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   ❓ Pergunta: Email         │
│                              │
│  "Informe seu e-mail:"       │
│                              │
│  Variável: {{email}}         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   📋 Menu de Núcleos         │ ← DINÂMICO!
│   (Busca Automática)         │
│                              │
│  📊 6 núcleos encontrados    │
│  🔄 Atualiza automaticamente │
└──────┬───────────────────────┘
       │
       ├─→ [Usuário escolheu núcleo]
       │
       ▼
┌──────────────────────────────┐
│   🏢 Menu de Departamentos   │ ← DINÂMICO!
│   (Filtrado por Núcleo)      │
│                              │
│  📊 2 deptos encontrados     │
│  🔄 Filtra por {{nucleoId}}  │
└──────┬───────────────────────┘
       │
       ├─→ [Usuário escolheu depto]
       │
       ▼
┌──────────────────────────────┐
│   🎯 Transferir Atendimento  │
│                              │
│  🎫 Criar Ticket             │
│  👤 Atribuir Atendente       │
│  📝 "Encaminhando..."        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│   🛑 FIM     │
└──────────────┘
```

---

## 💾 Estrutura JSON Gerada (Backend)

### Novo Formato:

```json
{
  "etapaInicial": "boas-vindas",
  "versao": "2.0",
  "etapas": {
    "boas-vindas": {
      "id": "boas-vindas",
      "tipo": "menu_nucleos_dinamico",
      "mensagem": "Como posso ajudá-lo? Selecione o setor desejado:",
      "buscarDinamicamente": true,
      "origemDados": "banco_dados",
      "filtros": {
        "apenasAtivos": true,
        "incluirSemDepartamentos": false
      },
      "formatoExibicao": "botoes_reply",
      "acaoAposEscolha": "menu_departamentos",
      "salvarContexto": {
        "nucleoId": "{{nucleoSelecionado.id}}",
        "nucleoNome": "{{nucleoSelecionado.nome}}"
      },
      "proximaEtapa": "escolha-departamento"
    },
    
    "escolha-departamento": {
      "id": "escolha-departamento",
      "tipo": "menu_departamentos_dinamico",
      "mensagem": "Escolha o departamento de {{nucleoNome}}:",
      "buscarDinamicamente": true,
      "filtrarPor": {
        "campo": "nucleoId",
        "valor": "{{nucleoId}}"
      },
      "comportamentoEspecial": {
        "seZeroDepartamentos": "transferir_nucleo_direto",
        "seUmDepartamento": "auto_avancar"
      },
      "acaoAposEscolha": "transferir",
      "salvarContexto": {
        "departamentoId": "{{departamentoSelecionado.id}}",
        "departamentoNome": "{{departamentoSelecionado.nome}}"
      },
      "proximaEtapa": "transferir-atendimento"
    },
    
    "transferir-atendimento": {
      "id": "transferir-atendimento",
      "tipo": "acao",
      "acao": "transferir_com_ticket",
      "configuracao": {
        "criarTicket": true,
        "destino": {
          "tipo": "departamento",
          "departamentoId": "{{departamentoId}}"
        },
        "atribuicao": {
          "metodo": "automatico",
          "prioridade": "normal"
        },
        "dadosTicket": {
          "assunto": "Atendimento via WhatsApp - {{departamentoNome}}",
          "descricao": "Cliente: {{nome}}\nTelefone: {{telefone}}\nNúcleo: {{nucleoNome}}\nDepartamento: {{departamentoNome}}",
          "tags": ["whatsapp", "triagem", "{{nucleoNome}}"]
        },
        "notificacoes": {
          "notificarAtendente": true,
          "metodo": "whatsapp_e_sistema"
        }
      },
      "mensagemFinal": "Encaminhando para {{departamentoNome}}...\n\nEm breve um atendente irá ajudá-lo! 😊",
      "finalizar": true
    }
  }
}
```

---

## 🔄 Backend: Lógica de Resolução Dinâmica

### No FlowEngine (já existe, só precisa detectar novos tipos):

```typescript
// backend/src/modules/triagem/engine/flow-engine.ts

private async buildSingleStep(): Promise<StepBuildResult> {
  const etapa = fluxo.estrutura?.etapas?.[etapaId];
  
  // ✅ NOVO: Detectar tipo de menu dinâmico
  if (etapa.tipo === 'menu_nucleos_dinamico' || etapa.buscarDinamicamente) {
    return await this.buildMenuNucleosDinamico(etapa);
  }
  
  if (etapa.tipo === 'menu_departamentos_dinamico') {
    return await this.buildMenuDepartamentosDinamico(etapa);
  }
  
  // Lógica existente...
}

private async buildMenuNucleosDinamico(etapa: Etapa): Promise<StepBuildResult> {
  // Buscar núcleos do banco
  const nucleos = await this.helpers.buscarNucleosParaBot(this.config.sessao);
  
  // Converter para opções do menu
  const opcoes: BotOption[] = nucleos.map(nucleo => ({
    id: nucleo.id,
    texto: nucleo.nome,
    descricao: nucleo.descricao,
    valor: nucleo.id,
    acao: 'proximo_passo',
    proximaEtapa: etapa.proximaEtapa,
    salvarContexto: {
      nucleoId: nucleo.id,
      nucleoNome: nucleo.nome,
      nucleoDescricao: nucleo.descricao
    }
  }));
  
  return {
    resposta: {
      mensagem: etapa.mensagem,
      opcoes,
      usarBotoes: true,
      tipoBotao: opcoes.length <= 3 ? 'reply' : 'list'
    }
  };
}

private async buildMenuDepartamentosDinamico(etapa: Etapa): Promise<StepBuildResult> {
  const nucleoId = this.config.sessao.contexto?.nucleoId;
  
  if (!nucleoId) {
    throw new Error('Núcleo não selecionado. Não é possível listar departamentos.');
  }
  
  // Buscar departamentos do núcleo específico
  const departamentos = await this.departamentoService.findByNucleoId(nucleoId, {
    apenasAtivos: true,
    apenasComAtendentes: etapa.filtros?.apenasComAtendentes || false
  });
  
  // ✅ Comportamento especial: 0 departamentos
  if (departamentos.length === 0) {
    if (etapa.comportamentoEspecial?.seZeroDepartamentos === 'transferir_nucleo_direto') {
      return {
        resposta: { mensagem: 'Transferindo para atendimento geral...' },
        autoAvancar: true,
        proximaEtapaId: 'transferir-atendimento-geral'
      };
    }
  }
  
  // ✅ Comportamento especial: 1 departamento apenas
  if (departamentos.length === 1 && etapa.comportamentoEspecial?.seUmDepartamento === 'auto_avancar') {
    this.config.sessao.contexto.departamentoId = departamentos[0].id;
    this.config.sessao.contexto.departamentoNome = departamentos[0].nome;
    
    return {
      resposta: { 
        mensagem: `Encaminhando para ${departamentos[0].nome}...` 
      },
      autoAvancar: true,
      proximaEtapaId: etapa.proximaEtapa
    };
  }
  
  // Converter para opções
  const opcoes: BotOption[] = departamentos.map(dept => ({
    id: dept.id,
    texto: dept.nome,
    descricao: dept.descricao,
    valor: dept.id,
    acao: 'proximo_passo',
    proximaEtapa: etapa.proximaEtapa,
    salvarContexto: {
      departamentoId: dept.id,
      departamentoNome: dept.nome
    }
  }));
  
  return {
    resposta: {
      mensagem: this.substituirVariaveisNaMensagem(etapa.mensagem, this.config.sessao),
      opcoes,
      usarBotoes: true,
      tipoBotao: opcoes.length <= 3 ? 'reply' : 'list'
    }
  };
}
```

---

## 🎨 Frontend: Novos Componentes

### 1. `NucleosMenuBlock.tsx` (Configuração do Bloco):

```typescript
import React, { useState, useEffect } from 'react';
import { Building2, RefreshCw, Settings } from 'lucide-react';

interface NucleosMenuBlockProps {
  etapa: Etapa;
  onChange: (etapa: Etapa) => void;
}

export const NucleosMenuBlock: React.FC<NucleosMenuBlockProps> = ({ etapa, onChange }) => {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buscar preview dos núcleos
  useEffect(() => {
    carregarNucleos();
  }, []);
  
  const carregarNucleos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/nucleos/atendimento', {
        params: { ativo: true }
      });
      setNucleos(response.data.data);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Menu de Núcleos</h3>
            <p className="text-sm text-gray-500">Busca automática do banco de dados</p>
          </div>
        </div>
        <button
          onClick={carregarNucleos}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Atualizar preview"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Mensagem do Menu */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensagem do Menu
        </label>
        <textarea
          value={etapa.mensagem || ''}
          onChange={(e) => onChange({ ...etapa, mensagem: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Como posso ajudá-lo? Selecione o setor desejado:"
        />
      </div>
      
      {/* Tipo de Busca */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Busca
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={etapa.buscarDinamicamente === true}
              onChange={() => onChange({ ...etapa, buscarDinamicamente: true })}
              className="text-blue-600"
            />
            <span className="text-sm">Dinâmica (atualiza automaticamente)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={etapa.buscarDinamicamente === false}
              onChange={() => onChange({ ...etapa, buscarDinamicamente: false })}
              className="text-blue-600"
            />
            <span className="text-sm">Estática (lista fixa)</span>
          </label>
        </div>
      </div>
      
      {/* Filtros */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtros
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={etapa.filtros?.apenasAtivos !== false}
              onChange={(e) => onChange({
                ...etapa,
                filtros: { ...etapa.filtros, apenasAtivos: e.target.checked }
              })}
              className="rounded text-blue-600"
            />
            <span className="text-sm">Apenas núcleos ativos</span>
          </label>
        </div>
      </div>
      
      {/* Preview em Tempo Real */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview dos Núcleos
        </label>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Carregando...</span>
            </div>
          ) : nucleos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum núcleo encontrado
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                {nucleos.length} núcleo(s) encontrado(s):
              </p>
              {nucleos.map((nucleo, index) => (
                <div 
                  key={nucleo.id}
                  className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}️⃣
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {nucleo.nome}
                    </p>
                    {nucleo.descricao && (
                      <p className="text-xs text-gray-500">
                        {nucleo.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Formato de Exibição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formato de Exibição
        </label>
        <select
          value={etapa.formatoExibicao || 'botoes_reply'}
          onChange={(e) => onChange({ ...etapa, formatoExibicao: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="botoes_reply">Botões Reply (até 3)</option>
          <option value="menu_lista">Menu de Lista (4-10)</option>
          <option value="texto_numerado">Texto Numerado (10+)</option>
        </select>
      </div>
    </div>
  );
};
```

---

## ✅ Benefícios da Solução Proposta

### Para o Usuário do Editor:
- ✅ **Simples**: Arrasta bloco → configura → pronto!
- ✅ **Visual**: Preview em tempo real dos dados
- ✅ **Intuitivo**: Não precisa saber código
- ✅ **Flexível**: Pode customizar mensagens e comportamentos

### Para a Gestão:
- ✅ **Sincronização Automática**: Cadastrou núcleo → aparece no bot
- ✅ **Sem Manutenção**: Zero edição manual de fluxos
- ✅ **Consistência**: Dados sempre atualizados
- ✅ **Rastreabilidade**: Histórico de mudanças

### Para os Desenvolvedores:
- ✅ **Reutilizável**: Blocos funcionam em qualquer fluxo
- ✅ **Extensível**: Fácil adicionar novos tipos de blocos
- ✅ **Testável**: Preview facilita validação
- ✅ **Manutenível**: Lógica centralizada no FlowEngine

---

## 🎯 Implementação Sugerida (Fases)

### Fase 1: Básico (2-3 dias) ✅ RECOMENDADO COMEÇAR
- [ ] Criar tipo `menu_nucleos_dinamico` no flow-builder.types.ts
- [ ] Adicionar ícone na paleta de blocos
- [ ] Criar componente `NucleosMenuBlock.tsx`
- [ ] Implementar busca dinâmica no FlowEngine
- [ ] Testar com fluxo simples

### Fase 2: Departamentos (2-3 dias)
- [ ] Criar tipo `menu_departamentos_dinamico`
- [ ] Criar componente `DepartamentosMenuBlock.tsx`
- [ ] Implementar filtro por núcleo
- [ ] Adicionar comportamentos especiais (0 ou 1 depto)

### Fase 3: Transferência (1-2 dias)
- [ ] Criar bloco "Transferir Atendimento"
- [ ] Implementar criação automática de ticket
- [ ] Configurar notificações
- [ ] Testar fluxo end-to-end

### Fase 4: Melhorias (1 semana)
- [ ] Adicionar preview de atendentes disponíveis
- [ ] Implementar histórico de mudanças
- [ ] Adicionar validação de fluxo
- [ ] Criar templates prontos

---

## 💬 Comparação: Antes vs Depois

### ❌ ANTES (Hardcoded):
```
1. Criar fluxo manualmente
2. Adicionar cada núcleo à mão
3. Adicionar cada departamento à mão
4. Salvar e publicar
5. Cadastraram novo núcleo? → Editar fluxo novamente
6. Desativaram departamento? → Editar fluxo novamente
```

### ✅ DEPOIS (Dinâmico):
```
1. Arrastar bloco "Menu de Núcleos"
2. Arrastar bloco "Menu de Departamentos"
3. Arrastar bloco "Transferir Atendimento"
4. Conectar blocos
5. Salvar e publicar
6. Cadastraram novo núcleo? → Aparece automaticamente! 🎉
7. Desativaram departamento? → Some automaticamente! 🎉
```

---

## 🎓 Conclusão

Sua ideia é **PERFEITA** e resolve o problema raiz! 

Minha proposta adiciona:
- 🎨 **Interface visual** no editor
- 🔄 **Preview em tempo real**
- 🤖 **Comportamentos inteligentes** (auto-avançar, fallback)
- 📊 **Validação e feedback** para o usuário

**Resultado**: Sistema 100% sincronizado e fácil de usar!

---

**Quer que eu implemente a Fase 1 agora?** 🚀

Posso começar criando:
1. Tipos TypeScript novos
2. Componente NucleosMenuBlock
3. Ícone na paleta de blocos
4. Lógica no FlowEngine

**Me avise e começamos!** 😊
