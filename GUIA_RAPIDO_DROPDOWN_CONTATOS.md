# 🎯 GUIA RÁPIDO: Como Usar o Dropdown de Contatos

**Criado:** 12/10/2025  
**Status:** ✅ PRONTO PARA USO  
**API Backend:** ✅ 11 testes passando

---

## 🚀 Uso Básico (Copy & Paste)

### **1. Importação**

```tsx
import { DropdownContatos, type Contato } from '@/features/atendimento/chat';
```

### **2. Setup Mínimo**

```tsx
function MeuComponente() {
  return (
    <DropdownContatos
      clienteId="uuid-do-cliente"
    />
  );
}
```

### **3. Setup Completo**

```tsx
function MeuComponente() {
  const [contatoAtual, setContatoAtual] = useState<Contato | null>(null);
  
  return (
    <DropdownContatos
      clienteId="uuid-do-cliente"
      contatoAtualId={contatoAtual?.id}
      onContatoSelecionado={(contato) => {
        console.log('Contato selecionado:', contato);
        setContatoAtual(contato);
      }}
      onContatoAdicionado={(contato) => {
        console.log('Novo contato:', contato);
        setContatoAtual(contato);
        // Atualizar lista de tickets, histórico, etc
      }}
      className="shadow-lg" // opcional
    />
  );
}
```

---

## 🎯 Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `clienteId` | `string` | ✅ Sim | UUID do cliente (obrigatório) |
| `contatoAtualId` | `string` | ❌ Não | UUID do contato atual selecionado |
| `onContatoSelecionado` | `(contato: Contato) => void` | ❌ Não | Callback ao clicar em contato |
| `onContatoAdicionado` | `(contato: Contato) => void` | ❌ Não | Callback ao adicionar novo contato |
| `className` | `string` | ❌ Não | Classes CSS adicionais |

---

## 📦 Interface Contato

```typescript
export interface Contato {
  id: string;                    // UUID gerado automaticamente
  nome: string;                  // Nome completo (obrigatório)
  email: string | null;          // Email (opcional)
  telefone: string;              // Telefone (obrigatório)
  cargo: string | null;          // Cargo (opcional)
  departamento: string | null;   // Departamento (opcional)
  principal: boolean;            // Flag de contato principal (default: false)
  ativo: boolean;                // Status ativo (soft delete)
  observacoes: string | null;    // Notas internas
  criadoEm: Date;                // Timestamp de criação
  atualizadoEm: Date;            // Timestamp de última atualização
}
```

---

## 🎨 Exemplos de Uso

### **Exemplo 1: Básico (sem callbacks)**

```tsx
// Use quando só quer exibir a lista de contatos
<DropdownContatos clienteId="3a8b5f7e-4d1c-4b9a-8e2f-1a3c5d7e9b4f" />
```

### **Exemplo 2: Com callback de seleção**

```tsx
function ChatPage() {
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  
  return (
    <div>
      <DropdownContatos
        clienteId="3a8b5f7e-4d1c-4b9a-8e2f-1a3c5d7e9b4f"
        onContatoSelecionado={setContatoSelecionado}
      />
      
      {contatoSelecionado && (
        <div>
          <h3>Conversando com: {contatoSelecionado.nome}</h3>
          <p>{contatoSelecionado.email}</p>
        </div>
      )}
    </div>
  );
}
```

### **Exemplo 3: Integração com PainelContexto**

```tsx
// Já está integrado! Basta usar:
import { PainelContextoCliente } from '@/components/chat/PainelContextoCliente';

function ChatLayout() {
  return (
    <div className="flex">
      <div className="flex-1">{/* Área de chat */}</div>
      
      <PainelContextoCliente
        clienteId="uuid-do-cliente"
        ticketId="uuid-do-ticket"
      />
    </div>
  );
}
```

### **Exemplo 4: Custom styling**

```tsx
<DropdownContatos
  clienteId="uuid-do-cliente"
  className="shadow-xl rounded-xl border-2 border-blue-300"
/>
```

### **Exemplo 5: Atualizar UI após adicionar**

```tsx
function MeuComponente() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [totalContatos, setTotalContatos] = useState(0);
  
  return (
    <>
      <div>Total de contatos: {totalContatos}</div>
      
      <DropdownContatos
        clienteId="uuid-do-cliente"
        onContatoAdicionado={(novoContato) => {
          // Atualizar contador
          setTotalContatos(prev => prev + 1);
          
          // Adicionar à lista local
          setContatos(prev => [...prev, novoContato]);
          
          // Mostrar notificação
          toast.success(`Contato ${novoContato.nome} adicionado!`);
        }}
      />
    </>
  );
}
```

---

## 🔌 APIs Backend Utilizadas

O componente usa automaticamente estes endpoints:

### **1. Listar contatos**
```
GET /api/crm/clientes/:clienteId/contatos
Headers: { Authorization: 'Bearer {token}' }

Response 200:
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "telefone": "(11) 98888-8888",
    "cargo": "Diretor Comercial",
    "departamento": "Vendas",
    "principal": true,
    "ativo": true,
    "criadoEm": "2025-10-12T10:00:00Z",
    "atualizadoEm": "2025-10-12T10:00:00Z"
  }
]
```

### **2. Criar contato**
```
POST /api/crm/clientes/:clienteId/contatos
Headers: { Authorization: 'Bearer {token}' }
Body: {
  "nome": "Maria Santos",
  "telefone": "(11) 97777-7777",
  "email": "maria@empresa.com",
  "cargo": "Gerente de Compras",
  "departamento": "Compras",
  "principal": false
}

Response 201: { /* contato criado */ }
```

### **3. Tornar principal**
```
PATCH /api/crm/contatos/:id/principal
Headers: { Authorization: 'Bearer {token}' }

Response 200: { /* contato atualizado */ }
```

---

## 🎨 Features Visuais

### **Ordenação Automática**
- ⭐ Contatos principais aparecem primeiro
- 🔤 Depois ordenados alfabeticamente

### **Indicadores Visuais**
- ⭐ Badge amarelo para contato principal
- ✅ Badge azul para "Contato atual"
- 💼 Ícones para cargo/departamento
- 📞 Ícone para telefone
- 📧 Ícone para email

### **Estados**
- 🔄 Loading spinner durante carregamento
- ❌ Mensagem de erro com retry
- 📭 Empty state quando não há contatos
- ✏️ Form inline para adicionar

### **Interações**
- Hover nos cards (bg-gray-50)
- Click no card (callback + badge "Contato atual")
- Botão ⭐ em hover para tornar principal
- Form com validações visuais

---

## 🎯 Casos de Uso

### **1. Chat de Atendimento**
```tsx
// Mostrar contatos do cliente durante atendimento
<DropdownContatos
  clienteId={ticket.clienteId}
  onContatoSelecionado={(contato) => {
    // Atualizar header do chat
    setChatHeader(`Conversando com: ${contato.nome}`);
  }}
/>
```

### **2. CRM - Página de Cliente**
```tsx
// Listar contatos na página de detalhes do cliente
<DropdownContatos
  clienteId={cliente.id}
  onContatoSelecionado={(contato) => {
    // Abrir modal de edição
    setEditandoContato(contato);
  }}
/>
```

### **3. Envio de Propostas**
```tsx
// Selecionar contato para enviar proposta
<DropdownContatos
  clienteId={proposta.clienteId}
  onContatoSelecionado={(contato) => {
    // Preencher destinatário da proposta
    setProposta({
      ...proposta,
      destinatarioNome: contato.nome,
      destinatarioEmail: contato.email,
      destinatarioTelefone: contato.telefone
    });
  }}
/>
```

### **4. Relatórios**
```tsx
// Selecionar contato para filtrar relatório
<DropdownContatos
  clienteId={filtros.clienteId}
  onContatoSelecionado={(contato) => {
    // Filtrar relatório por contato
    setFiltros({ ...filtros, contatoId: contato.id });
  }}
/>
```

---

## 🔧 Troubleshooting

### **Problema: Dropdown não carrega**

**Causa:** clienteId inválido ou backend offline

**Solução:**
```tsx
// Verificar se clienteId é UUID válido
const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clienteId);

if (!isValidUUID) {
  console.error('❌ clienteId inválido:', clienteId);
}

// Verificar se backend está rodando
fetch('http://localhost:3001/api/health')
  .then(res => console.log('✅ Backend OK'))
  .catch(err => console.error('❌ Backend offline:', err));
```

### **Problema: Erro 401 Unauthorized**

**Causa:** Token expirado ou ausente

**Solução:**
```tsx
// Verificar se token existe
const token = localStorage.getItem('authToken');
if (!token) {
  console.error('❌ Token ausente');
  // Redirecionar para login
  navigate('/login');
}
```

### **Problema: Contato não aparece após criar**

**Causa:** API retornou sucesso mas lista não atualizou

**Solução:** O componente já faz `carregarContatos()` automaticamente após criar. Se não funcionar:
```tsx
// Force reload manual
const dropdownRef = useRef<any>(null);

<DropdownContatos
  ref={dropdownRef}
  clienteId={clienteId}
  onContatoAdicionado={(contato) => {
    // Forçar reload se necessário
    dropdownRef.current?.carregarContatos();
  }}
/>
```

### **Problema: Validações não aparecem**

**Causa:** Estado de erro não foi limpo

**Solução:** O componente já limpa automaticamente. Se persistir:
```tsx
// Verificar console.error para mensagens de validação
console.log('Erros de validação:', erro);
```

---

## ✅ Checklist de Validação

Antes de usar em produção:

- [ ] Backend está rodando (`npm run start:dev`)
- [ ] Migration de contatos foi executada
- [ ] Tabela `contatos` existe no banco
- [ ] Token de autenticação está válido
- [ ] Cliente existe no banco (clienteId válido)
- [ ] Permissões de CORS configuradas
- [ ] Axios interceptors configurados
- [ ] Error boundary configurado no app

---

## 📚 Links Úteis

- **Documentação Completa:** `FASE3_DROPDOWN_CONTATOS_COMPLETO.md`
- **Backend APIs:** `FASE1_BACKEND_COMPLETO.md`
- **Página de Exemplo:** `/exemplo-contatos` (se rota configurada)
- **Testes Backend:** `backend/test-contatos-api.js`

---

## 🎉 Pronto!

Agora você pode usar o DropdownContatos em qualquer lugar do seu app!

**Dúvidas?** Consulte a documentação completa em `FASE3_DROPDOWN_CONTATOS_COMPLETO.md`

**Bugs?** Verifique o console.log para mensagens de debug (todas começam com ✅ ou ❌)

---

**Última atualização:** 12/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ ESTÁVEL
