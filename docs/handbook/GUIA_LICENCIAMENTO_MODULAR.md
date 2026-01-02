# 🔐 Sistema de Licenciamento Modular - Guia de Uso

**Data**: 03 de novembro de 2025  
**Status**: ✅ 100% Implementado  
**Branch**: consolidacao-atendimento

---

## 🎯 O QUE É

Sistema completo de **licenciamento modular** que permite:
- ✅ Empresa comprar módulos separados
- ✅ Menu dinâmico (mostra apenas módulos contratados)
- ✅ Proteção de rotas (redireciona para tela de bloqueio)
- ✅ Tela de upgrade profissional
- ✅ Backend com API REST completa

---

## 📦 MÓDULOS DISPONÍVEIS

| Módulo | Enum | Preço | Descrição |
|--------|------|-------|-----------|
| **Atendimento** | `ModuloEnum.ATENDIMENTO` | R$ 199/mês | Chat, tickets, triagem, equipes, WhatsApp |
| **CRM** | `ModuloEnum.CRM` | R$ 299/mês | Clientes, contatos, histórico, pipeline |
| **Vendas** | `ModuloEnum.VENDAS` | R$ 349/mês | Propostas, produtos, funil, oportunidades |
| **Financeiro** | `ModuloEnum.FINANCEIRO` | R$ 249/mês | Contas a pagar/receber, fluxo de caixa |
| **Billing** | `ModuloEnum.BILLING` | R$ 199/mês | Assinaturas, faturas, pagamentos recorrentes |
| **Administração** | `ModuloEnum.ADMINISTRACAO` | R$ 999/mês | Multi-tenant, super admin (Enterprise only) |

---

## 🚀 COMO USAR

### 1. Verificar se Módulo Está Ativo (Hook)

```tsx
import { useModuloAtivo } from './hooks/useModuloAtivo';
import { ModuloEnum } from './services/modulosService';

const MinhaPage = () => {
  const [isCRMAtivo, loading] = useModuloAtivo(ModuloEnum.CRM);

  if (loading) return <Loading />;
  
  if (!isCRMAtivo) {
    return <div>Módulo CRM não disponível</div>;
  }

  return <div>Conteúdo da página CRM</div>;
};
```

### 2. Verificar Múltiplos Módulos

```tsx
import { useModulosAtivos } from './hooks/useModuloAtivo';

const Dashboard = () => {
  const [modulosAtivos, loading] = useModulosAtivos();

  if (loading) return <Loading />;

  return (
    <div>
      {modulosAtivos.includes('CRM') && <WidgetCRM />}
      {modulosAtivos.includes('VENDAS') && <WidgetVendas />}
      {modulosAtivos.includes('FINANCEIRO') && <WidgetFinanceiro />}
    </div>
  );
};
```

### 3. Proteger Rota (Método Simples)

```tsx
// App.tsx
import { protegerRota } from './utils/routeGuardHelper';
import { ModuloEnum } from './services/modulosService';

<Route 
  path="/crm/clientes" 
  element={protegerRota(ModuloEnum.CRM, <ClientesPage />)} 
/>
```

**O que acontece**:
- ✅ Se módulo ativo → Renderiza `<ClientesPage />`
- ❌ Se módulo inativo → Mostra tela de bloqueio com informações do módulo

### 4. Proteger Rota (Método Completo)

```tsx
// App.tsx
import RouteGuard from './components/licensing/RouteGuard';
import { ModuloEnum } from './services/modulosService';

<Route 
  path="/vendas/propostas" 
  element={
    <RouteGuard
      modulo={ModuloEnum.VENDAS}
      moduloNome="Vendas"
      moduloDescricao="Gestão completa de vendas e propostas comerciais"
      preco="R$ 349"
      recursos={[
        'Propostas ilimitadas',
        'Funil de vendas visual',
        'Gestão de produtos',
        'Relatórios de performance'
      ]}
    >
      <PropostasPage />
    </RouteGuard>
  } 
/>
```

### 5. Filtrar Menu Dinamicamente

**Já está implementado no DashboardLayout!**

```tsx
// DashboardLayout.tsx (JÁ IMPLEMENTADO)
const [modulosAtivos, loadingModulos] = useModulosAtivos();

const menuFiltrado = useMemo(() => {
  if (loadingModulos) return [];
  return getMenuParaEmpresa(menuConfig, modulosAtivos);
}, [modulosAtivos, loadingModulos]);

// Menu renderiza apenas items com requiredModule ativo
<HierarchicalNavGroup menuItems={menuFiltrado} />
```

### 6. Adicionar Módulo ao Menu

```tsx
// menuConfig.ts
export const menuConfig: MenuConfig[] = [
  {
    id: 'meu-modulo',
    title: 'Meu Módulo',
    icon: Package,
    href: '/meu-modulo',
    color: 'blue',
    requiredModule: 'MEU_MODULO', // ⚡ Módulo será filtrado se não ativo
    children: [
      // ... sub-itens
    ]
  }
];
```

---

## 🔧 API BACKEND

### Endpoints Disponíveis

**Base URL**: `http://localhost:3001/empresas/modulos`

#### 1. Listar Módulos Ativos

```bash
GET /empresas/modulos/ativos
Authorization: Bearer {token}

# Response
[
  "ATENDIMENTO",
  "CRM",
  "VENDAS"
]
```

#### 2. Listar Todos Módulos (com detalhes)

```bash
GET /empresas/modulos
Authorization: Bearer {token}

# Response
[
  {
    "id": "uuid",
    "empresa_id": "uuid",
    "modulo": "ATENDIMENTO",
    "ativo": true,
    "data_ativacao": "2025-11-03T10:00:00Z",
    "data_expiracao": null,
    "plano": "ENTERPRISE",
    "created_at": "2025-11-03T10:00:00Z",
    "updated_at": "2025-11-03T10:00:00Z"
  }
]
```

#### 3. Verificar Módulo Específico

```bash
GET /empresas/modulos/verificar/CRM
Authorization: Bearer {token}

# Response
{
  "ativo": true
}
```

#### 4. Obter Plano Atual

```bash
GET /empresas/modulos/plano
Authorization: Bearer {token}

# Response
{
  "plano": "ENTERPRISE"
}
```

#### 5. Ativar Módulo

```bash
POST /empresas/modulos/ativar
Authorization: Bearer {token}
Content-Type: application/json

{
  "modulo": "CRM",
  "ativo": true,
  "data_expiracao": null,
  "plano": "BUSINESS"
}

# Response
{
  "id": "uuid",
  "empresa_id": "uuid",
  "modulo": "CRM",
  "ativo": true,
  "plano": "BUSINESS",
  ...
}
```

#### 6. Desativar Módulo

```bash
DELETE /empresas/modulos/CRM
Authorization: Bearer {token}

# Response
{
  "message": "Módulo desativado com sucesso"
}
```

#### 7. Atualizar Módulo

```bash
PATCH /empresas/modulos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "ativo": true,
  "data_expiracao": "2026-01-01T00:00:00Z",
  "plano": "ENTERPRISE"
}
```

#### 8. Ativar Plano Completo

```bash
POST /empresas/modulos/plano/ENTERPRISE
Authorization: Bearer {token}

# Response
{
  "message": "Plano ENTERPRISE ativado com sucesso",
  "modulos_ativados": [
    "ATENDIMENTO",
    "CRM",
    "VENDAS",
    "FINANCEIRO",
    "BILLING",
    "ADMINISTRACAO"
  ]
}
```

---

## 💾 BANCO DE DADOS

### Tabela: empresa_modulos

```sql
CREATE TABLE empresa_modulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_ativacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP NULL,
  plano VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE UNIQUE INDEX idx_empresa_modulo ON empresa_modulos(empresa_id, modulo);
CREATE INDEX idx_empresa_id ON empresa_modulos(empresa_id);
CREATE INDEX idx_empresa_ativo ON empresa_modulos(empresa_id, ativo);
```

### Consultas Úteis

```sql
-- Ver módulos ativos de uma empresa
SELECT modulo, ativo, plano, data_expiracao 
FROM empresa_modulos 
WHERE empresa_id = 'ID_DA_EMPRESA' AND ativo = true;

-- Ativar todos módulos (Enterprise)
UPDATE empresa_modulos 
SET ativo = true, plano = 'ENTERPRISE', data_expiracao = NULL 
WHERE empresa_id = 'ID_DA_EMPRESA';

-- Configurar plano Starter (só Atendimento)
UPDATE empresa_modulos 
SET ativo = false 
WHERE empresa_id = 'ID_DA_EMPRESA';

UPDATE empresa_modulos 
SET ativo = true, plano = 'STARTER' 
WHERE empresa_id = 'ID_DA_EMPRESA' AND modulo = 'ATENDIMENTO';

-- Verificar expiração
SELECT modulo, data_expiracao, 
  CASE 
    WHEN data_expiracao IS NULL THEN 'SEM EXPIRACAO'
    WHEN data_expiracao < NOW() THEN 'EXPIRADO'
    ELSE 'ATIVO'
  END AS status
FROM empresa_modulos 
WHERE empresa_id = 'ID_DA_EMPRESA';
```

---

## 🧪 TESTES

### Cenário 1: Empresa com Apenas Atendimento (STARTER)

```sql
-- Configurar
UPDATE empresa_modulos 
SET ativo = false 
WHERE empresa_id = '...' AND modulo != 'ATENDIMENTO';

UPDATE empresa_modulos 
SET ativo = true, plano = 'STARTER' 
WHERE empresa_id = '...' AND modulo = 'ATENDIMENTO';
```

**Resultado Esperado**:
- ✅ Menu mostra: Dashboard, Atendimento, Configurações
- ❌ Menu NÃO mostra: CRM, Vendas, Financeiro, Billing, Administração
- ❌ Acessar `/crm/clientes` → Tela de bloqueio
- ❌ Acessar `/vendas/propostas` → Tela de bloqueio

### Cenário 2: Empresa com Atendimento + CRM + Vendas (BUSINESS)

```sql
-- Configurar
UPDATE empresa_modulos 
SET ativo = true, plano = 'BUSINESS' 
WHERE empresa_id = '...' AND modulo IN ('ATENDIMENTO', 'CRM', 'VENDAS');

UPDATE empresa_modulos 
SET ativo = false 
WHERE empresa_id = '...' AND modulo NOT IN ('ATENDIMENTO', 'CRM', 'VENDAS');
```

**Resultado Esperado**:
- ✅ Menu mostra: Dashboard, Atendimento, CRM, Vendas, Configurações
- ❌ Menu NÃO mostra: Financeiro, Billing, Administração
- ✅ Acessar `/crm/clientes` → Funciona
- ✅ Acessar `/vendas/propostas` → Funciona
- ❌ Acessar `/financeiro/contas-receber` → Tela de bloqueio

### Cenário 3: Empresa Enterprise (TODOS)

```sql
-- Configurar
UPDATE empresa_modulos 
SET ativo = true, plano = 'ENTERPRISE' 
WHERE empresa_id = '...';
```

**Resultado Esperado**:
- ✅ Menu completo visível (todos 8 itens principais)
- ✅ Todas funcionalidades acessíveis
- ✅ Cross-references funcionam (proposta → cliente → ticket → fatura)

---

## 🎨 CUSTOMIZAR TELA DE BLOQUEIO

### Personalizar Informações do Módulo

```tsx
// modulosConfig.ts
export const MODULOS_INFO: Record<ModuloEnum, ModuloInfo> = {
  [ModuloEnum.MEU_MODULO]: {
    id: ModuloEnum.MEU_MODULO,
    nome: 'Meu Módulo',
    descricao: 'Descrição completa das funcionalidades',
    preco: 'R$ 199',
    recursos: [
      'Recurso 1',
      'Recurso 2',
      'Recurso 3'
    ]
  }
};
```

### Customizar Ação de "Contratar"

```tsx
// ModuloBloqueado.tsx - linha 27
const handleContatar = () => {
  // Opção 1: WhatsApp
  window.open('https://wa.me/5511999999999?text=Quero contratar ' + moduloNome, '_blank');
  
  // Opção 2: Abrir modal interno
  setShowModalContratacao(true);
  
  // Opção 3: Redirecionar para página de upgrade
  navigate('/upgrade?modulo=' + moduloNome);
  
  // Opção 4: Enviar email
  window.location.href = 'mailto:vendas@conectcrm.com?subject=Contratar ' + moduloNome;
};
```

---

## 📊 PLANOS COMERCIAIS

### STARTER (R$ 199/mês)
- 1 módulo à escolha
- Até 5 usuários
- Suporte básico

### BUSINESS (R$ 499/mês)
- 3 módulos à escolha
- Até 15 usuários
- Suporte prioritário

### ENTERPRISE (R$ 999/mês)
- Todos os 6 módulos
- Usuários ilimitados
- Módulo Administração incluído
- Suporte premium 24/7

---

## 🔥 CASOS DE USO COMUNS

### 1. Verificar se usuário pode criar cliente

```tsx
const [temCRM] = useModuloAtivo(ModuloEnum.CRM);

if (!temCRM) {
  toast.error('Módulo CRM necessário para criar clientes');
  return;
}

// Criar cliente...
```

### 2. Esconder botão se módulo inativo

```tsx
const [temVendas] = useModuloAtivo(ModuloEnum.VENDAS);

return (
  <div>
    {temVendas && (
      <button onClick={criarProposta}>
        Nova Proposta
      </button>
    )}
  </div>
);
```

### 3. Redirecionar para upgrade

```tsx
const navigate = useNavigate();
const [temCRM] = useModuloAtivo(ModuloEnum.CRM);

const handleCriarCliente = () => {
  if (!temCRM) {
    navigate('/upgrade?modulo=CRM');
    return;
  }
  // Criar cliente...
};
```

### 4. Mostrar badge "Premium" no menu

```tsx
const [temFinanceiro] = useModuloAtivo(ModuloEnum.FINANCEIRO);

<MenuItem 
  title="Financeiro"
  badge={!temFinanceiro ? '🔒 Premium' : undefined}
/>
```

---

## 🚨 TROUBLESHOOTING

### Menu não está filtrando

**Problema**: Menu mostra todos itens mesmo com módulo inativo

**Solução**: Verificar se `getMenuParaEmpresa()` está sendo chamado no DashboardLayout

```tsx
// DashboardLayout.tsx - DEVE ter isso:
const [modulosAtivos, loadingModulos] = useModulosAtivos();
const menuFiltrado = useMemo(() => 
  getMenuParaEmpresa(menuConfig, modulosAtivos),
  [modulosAtivos, loadingModulos]
);
```

### Rota não está protegida

**Problema**: Consigo acessar `/crm/clientes` mesmo sem módulo CRM

**Solução**: Verificar se rota tem `protegerRota()` ou `<RouteGuard>`

```tsx
// ❌ ERRADO
<Route path="/crm/clientes" element={<ClientesPage />} />

// ✅ CORRETO
<Route path="/crm/clientes" element={protegerRota(ModuloEnum.CRM, <ClientesPage />)} />
```

### Hook sempre retorna false

**Problema**: `useModuloAtivo()` sempre retorna `false`

**Solução**: Verificar se empresa_id está no localStorage

```javascript
// No console do navegador:
localStorage.getItem('empresaId')

// Deve retornar UUID da empresa
// Se null, fazer login novamente
```

### API retorna 401

**Problema**: Endpoint `/empresas/modulos` retorna 401 Unauthorized

**Solução**: Verificar token JWT

```javascript
// No console do navegador:
localStorage.getItem('token')

// Teste manual:
curl http://localhost:3001/empresas/modulos/ativos \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

Ao adicionar novo módulo:

- [ ] Adicionar enum em `ModuloEnum` (backend e frontend)
- [ ] Adicionar config em `MODULOS_INFO` (frontend)
- [ ] Adicionar campo `requiredModule` nos itens do `menuConfig`
- [ ] Aplicar `protegerRota()` nas rotas do módulo
- [ ] Testar com módulo ativo
- [ ] Testar com módulo inativo (deve mostrar bloqueio)
- [ ] Testar filtro no menu (deve sumir quando inativo)
- [ ] Documentar preço e recursos

---

## 🎉 CONCLUSÃO

Sistema de licenciamento modular **100% funcional** e pronto para produção!

**Arquivos principais**:
- `useModuloAtivo.ts` - Hook para verificar módulos
- `RouteGuard.tsx` - Proteção de rotas
- `ModuloBloqueado.tsx` - Tela de upgrade
- `modulosConfig.ts` - Configuração de módulos
- `routeGuardHelper.tsx` - Helper para proteger rotas
- `DashboardLayout.tsx` - Menu dinâmico
- `App.tsx` - Rotas protegidas

**Próximos passos (opcional)**:
- [ ] Criar página de gestão de licenças (admin)
- [ ] Integrar com gateway de pagamento
- [ ] Adicionar sistema de trials (período de teste)
- [ ] Criar dashboard comercial (vendas)

---

**Desenvolvido com ❤️ pela equipe ConectCRM**
