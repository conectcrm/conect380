# 🎯 Configuração de Inatividade por Departamento

**Data:** 05/11/2025  
**Status:** 🔄 EM IMPLEMENTAÇÃO

---

## 📋 Requisito do Usuário

> "No sistema temos atendimento por departamento, então seria interessante que tivesse a opção de configurar a inatividade por departamento e com tempo personalizado também"

---

## ✅ O Que Foi Implementado

### 1️⃣ **Backend - Entity Atualizada**

📄 `backend/src/modules/atendimento/entities/configuracao-inatividade.entity.ts`

**Mudanças:**
- ✅ Adicionado campo `departamentoId` (nullable)
- ✅ Adicionado relação `ManyToOne` com `Departamento`
- ✅ Índice único alterado: `[empresaId, departamentoId]`

**Lógica:**
```typescript
// NULL = configuração global da empresa
{ empresaId: 'uuid', departamentoId: null, timeout: 1440 }

// Específico = configuração do departamento
{ empresaId: 'uuid', departamentoId: 'dept-uuid', timeout: 120 }
```

---

### 2️⃣ **Backend - Migration**

📄 `backend/src/migrations/1730860000000-AdicionarDepartamentoConfiguracaoInatividade.ts`

**O que faz:**
1. Remove índice único anterior (apenas `empresaId`)
2. Adiciona coluna `departamento_id` (UUID, nullable)
3. Cria índice único composto `[empresa_id, departamento_id]`
4. Cria foreign key para tabela `departamentos`

**Para executar:**
```bash
cd backend
npm run migration:run
```

---

### 3️⃣ **Backend - Controller Atualizado**

📄 `backend/src/modules/atendimento/controllers/configuracao-inatividade.controller.ts`

**Novos Endpoints:**

#### **GET** `/atendimento/configuracao-inatividade/:empresaId?departamentoId=uuid`
Busca configuração específica (global ou por departamento)

```typescript
// Global
GET /atendimento/configuracao-inatividade/empresa-uuid

// Departamento específico
GET /atendimento/configuracao-inatividade/empresa-uuid?departamentoId=dept-uuid
```

#### **POST** `/atendimento/configuracao-inatividade/:empresaId`
Salva configuração (body define se é global ou departamento)

```json
{
  "departamentoId": "dept-uuid", // null ou omitir = global
  "timeoutMinutos": 120,
  "enviarAviso": true,
  "avisoMinutosAntes": 60,
  "ativo": true
}
```

#### **GET** `/atendimento/configuracao-inatividade/departamentos/:empresaId`
Lista departamentos disponíveis para seleção

```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "uuid",
      "nome": "Suporte Técnico",
      "descricao": "...",
      "cor": "#6366F1",
      "icone": "headset"
    }
  ]
}
```

#### **GET** `/atendimento/configuracao-inatividade/lista/:empresaId`
Lista TODAS as configurações de uma empresa (global + departamentos)

```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "uuid1",
      "empresaId": "empresa-uuid",
      "departamentoId": null,
      "departamento": null,
      "timeoutMinutos": 1440,
      "ativo": true
    },
    {
      "id": "uuid2",
      "empresaId": "empresa-uuid",
      "departamentoId": "dept-uuid",
      "departamento": {
        "id": "dept-uuid",
        "nome": "Suporte"
      },
      "timeoutMinutos": 120,
      "ativo": true
    }
  ]
}
```

---

### 4️⃣ **Backend - Módulo Atualizado**

📄 `backend/src/modules/atendimento/atendimento.module.ts`

**Mudanças:**
- ✅ Importado `Departamento` entity
- ✅ Adicionado ao `TypeOrmModule.forFeature()`
- ✅ Injetado no `ConfiguracaoInactividadeController`

---

## 🔄 O Que Falta Fazer

### 5️⃣ **Backend - Service de Monitoramento** (PRÓXIMO PASSO)

📄 `backend/src/modules/atendimento/services/inactivity-monitor.service.ts`

**Lógica necessária:**

1. Ao processar ticket, verificar `ticket.departamentoId`
2. Buscar configuração ESPECÍFICA do departamento primeiro
3. Se não existir, buscar configuração GLOBAL da empresa
4. Aplicar timeout correto conforme prioridade

```typescript
// Prioridade de busca:
// 1º: Configuração do departamento (se ticket tiver departamentoId)
// 2º: Configuração global da empresa (departamentoId = null)

async obterConfiguracao(ticket: Ticket) {
  // Se ticket tem departamento, buscar config específica
  if (ticket.departamentoId) {
    const configDept = await this.configuracaoRepository.findOne({
      where: {
        empresaId: ticket.empresaId,
        departamentoId: ticket.departamentoId,
        ativo: true,
      },
    });
    
    if (configDept) return configDept;
  }
  
  // Fallback: config global
  return await this.configuracaoRepository.findOne({
    where: {
      empresaId: ticket.empresaId,
      departamentoId: null, // Global
      ativo: true,
    },
  });
}
```

---

### 6️⃣ **Frontend - Service Atualizado** (PRÓXIMO PASSO)

📄 `frontend-web/src/services/configuracaoInactividadeService.ts`

**Adicionar:**

```typescript
// Listar departamentos
export const listarDepartamentos = async (empresaId: string) => {
  const response = await api.get(`/atendimento/configuracao-inatividade/departamentos/${empresaId}`);
  return response.data;
};

// Listar todas as configurações
export const listarConfiguracoes = async (empresaId: string) => {
  const response = await api.get(`/atendimento/configuracao-inatividade/lista/${empresaId}`);
  return response.data;
};

// Buscar por departamento
export const buscarPorDepartamento = async (empresaId: string, departamentoId: string) => {
  const response = await api.get(`/atendimento/configuracao-inatividade/${empresaId}?departamentoId=${departamentoId}`);
  return response.data;
};
```

---

### 7️⃣ **Frontend - Interface Atualizada** (PRÓXIMO PASSO)

📄 `frontend-web/src/features/atendimento/configuracoes/tabs/FechamentoAutomaticoTab.tsx`

**Mudanças necessárias:**

#### A) Seletor de Departamento no Topo

```tsx
{/* Seletor: Global ou Departamento */}
<div className="mb-6">
  <label className="text-sm font-medium text-[#002333] mb-2 block">
    Configurar para:
  </label>
  
  <div className="flex gap-4">
    <button
      onClick={() => setDepartamentoSelecionado(null)}
      className={`px-4 py-2 rounded-lg ${
        departamentoSelecionado === null
          ? 'bg-[#159A9C] text-white'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <Building2 className="h-4 w-4 inline mr-2" />
      Configuração Global (Toda Empresa)
    </button>
    
    <select
      value={departamentoSelecionado || ''}
      onChange={(e) => setDepartamentoSelecionado(e.target.value || null)}
      className="flex-1 px-4 py-2 border rounded-lg"
    >
      <option value="">Selecione um departamento...</option>
      {departamentos.map(dept => (
        <option key={dept.id} value={dept.id}>
          {dept.nome}
        </option>
      ))}
    </select>
  </div>
</div>
```

#### B) Lista de Configurações Existentes

```tsx
{/* Lista de Configurações Ativas */}
<div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
  <h3 className="text-lg font-semibold text-[#002333] mb-4">
    Configurações Ativas
  </h3>
  
  <div className="space-y-3">
    {configuracoes.map(config => (
      <div key={config.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            {config.departamento ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {config.departamento.nome}
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                Global
              </span>
            )}
            <span className="text-sm text-[#002333]">
              {config.timeoutMinutos} min
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.ativo
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {config.ativo ? 'Ativo' : 'Inativo'}
          </span>
          
          <button onClick={() => editarConfig(config)} className="text-[#159A9C]">
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 🎯 Prioridade de Configuração

### Como o Sistema Vai Funcionar:

1. **Ticket com Departamento:**
   ```
   Ticket { departamentoId: 'suporte-uuid' }
   → Busca config de 'suporte-uuid'
   → Se não existir, busca config global
   ```

2. **Ticket sem Departamento:**
   ```
   Ticket { departamentoId: null }
   → Busca config global diretamente
   ```

3. **Exemplo Prático:**
   ```
   Empresa "Acme Corp":
   - Config Global: 24 horas (1440 min)
   - Departamento "Suporte": 2 horas (120 min)
   - Departamento "Vendas": 8 horas (480 min)
   - Departamento "Financeiro": usa global (sem config específica)
   
   Ticket de Suporte → fecha em 2h
   Ticket de Vendas → fecha em 8h
   Ticket de Financeiro → fecha em 24h (global)
   ```

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| **Entity** | ✅ Completa |
| **Migration** | ✅ Executada com sucesso |
| **Controller** | ✅ Atualizado |
| **Module** | ✅ Atualizado |
| **Service Monitor** | ✅ Completo (lógica de prioridade implementada) |
| **Service Frontend** | ✅ Completo |
| **Interface Frontend** | ✅ Completa (seletor + lista) |
| **Testes** | ⏭️ Próximo passo |
| **Documentação** | ✅ Este arquivo |

---

## ✅ O QUE FOI FEITO AGORA (Sessão Atual)

### 1. Migration Executada ✅
```bash
Migration AdicionarDepartamentoConfiguracaoInatividade1730860000000 has been executed successfully.
```

### 2. InactivityMonitorService Atualizado ✅

**Novo método**: `obterConfiguracaoParaTicket(ticket)`

Implementa lógica de prioridade:
1. Se ticket tem `departamentoId` → busca config do departamento
2. Se não encontrar (ou ticket sem departamento) → busca config global (departamentoId = null)
3. Se não encontrar nenhuma → retorna null (pula ticket)

**Método atualizado**: `processarEmpresa(config)`
- Agora busca todos os tickets ativos da empresa
- Para cada ticket, chama `obterConfiguracaoParaTicket()` para obter config correta
- Aplica timeout específico do departamento ou global
- Processa 200 tickets por vez (aumentado de 100)

**Método atualizado**: `verificarImediatamente(empresaId, departamentoId)`
- Agora aceita `departamentoId` opcional
- Permite forçar verificação de departamento específico via API

### 3. Controller Atualizado ✅

**Endpoint atualizado**: `POST /atendimento/configuracao-inatividade/verificar-agora`
- Aceita `?empresaId=...&departamentoId=...`
- Passa ambos os parâmetros para o service

### 4. Frontend Service Atualizado ✅

**Novas funções**:
```typescript
listarDepartamentos(empresaId) // Lista departamentos disponíveis
listarConfiguracoes(empresaId) // Lista TODAS as configs (global + departamentos)
```

**Funções atualizadas**:
```typescript
buscarConfiguracao(empresaId, departamentoId?) // Agora aceita departamentoId opcional
verificarAgora(empresaId?, departamentoId?)    // Idem
```

**Nova interface**: `Departamento`

### 5. Frontend Interface Completa ✅

**Componente recriado**: `FechamentoAutomaticoTab.tsx`

**Novos recursos**:
- 🌐 Seletor "Configuração Global" vs "Departamento Específico"
- 📋 Lista de configurações existentes (cards coloridos)
  - Verde: Global 🌐
  - Azul: Departamento específico 👥
- ✏️ Botão "Editar" em cada configuração
- 🔄 Recarregamento automático após salvar
- 🎯 Visual indicador de qual configuração está selecionada

**Estados da interface**:
- Loading inicial (carrega departamentos + configurações)
- Modo edição (quando existe config)
- Modo criação (quando não existe config)
- Auto-limpeza de formulário ao trocar seleção

---

## 🚀 Próximos Passos

1. ✅ ~~Executar migration~~
2. ✅ ~~Atualizar `InactivityMonitorService`~~
3. ✅ ~~Atualizar service frontend~~
4. ✅ ~~Atualizar interface com seletor~~
5. ⏭️ **Testar fluxo completo** (PRÓXIMO)
6. ⏭️ Documentar uso no README

---

## 🧪 COMO TESTAR

### Teste 1: Criar Configuração Global
1. Acessar: http://localhost:3000/atendimento/configuracoes?tab=fechamento
2. Clicar em "Configuração Global"
3. Definir timeout: 24 horas (1440 min)
4. Ativar e salvar
5. ✅ Deve aparecer na lista com badge verde "Global"

### Teste 2: Criar Configuração de Departamento
1. Selecionar dropdown: "Suporte Técnico"
2. Definir timeout: 2 horas (120 min)
3. Ativar e salvar
4. ✅ Deve aparecer na lista com badge azul "Suporte Técnico"

### Teste 3: Verificação Manual
1. Clicar em "Verificar Agora" na config global
2. ✅ Deve processar todos os tickets sem config específica
3. Clicar em "Verificar Agora" na config de departamento
4. ✅ Deve processar apenas tickets daquele departamento

### Teste 4: Prioridade de Configuração
**Cenário**: Empresa tem config global (24h) e config Suporte (2h)

1. Criar ticket no departamento Suporte
2. Aguardar 2 horas sem resposta
3. ✅ Sistema deve fechar usando config do Suporte (2h)

4. Criar ticket no departamento Vendas (sem config específica)
5. Aguardar 24 horas sem resposta
6. ✅ Sistema deve fechar usando config global (24h)

---

**Status Final**: 🎉 **IMPLEMENTAÇÃO COMPLETA** - Pronto para testes!
