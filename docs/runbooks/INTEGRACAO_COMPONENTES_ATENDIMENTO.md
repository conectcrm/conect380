# 🔧 Guia Rápido de Integração - Componentes Novos

**Data**: 19 de novembro de 2025  
**Componentes**: UploadArea + useNotificacoesDesktop  
**Tempo Estimado**: 1-2 horas

---

## 🎯 Objetivo

Integrar os componentes criados nas FASES 2 e 3 ao sistema de atendimento existente.

**Componentes a Integrar**:
1. ✨ `UploadArea.tsx` - Upload de arquivos com drag & drop
2. ✨ `useNotificacoesDesktop.ts` - Notificações desktop do navegador

---

## 📋 Checklist Pré-Integração

Antes de começar, verificar:

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Endpoint `POST /atendimento/mensagens/arquivo` existe
- [ ] WebSocket funcionando (testar envio de mensagem)
- [ ] Nenhum erro no console (F12)

---

## 🔨 PASSO 1: Integrar UploadArea

### 1.1 Importar no ChatArea

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/components/ChatArea.tsx`

```tsx
// No topo do arquivo, adicionar import
import { UploadArea } from '../../components/UploadArea';
import { Paperclip } from 'lucide-react'; // Se já não estiver importado
```

### 1.2 Adicionar Estado

```tsx
// Dentro do componente ChatArea, adicionar estado
const [showUploadArea, setShowUploadArea] = useState(false);
```

### 1.3 Adicionar Botão e Área de Upload

**Localização**: Área de input de mensagem (logo acima do textarea)

```tsx
{/* Procurar pela área de input, geralmente linha ~800-900 */}
<div className="p-4 border-t bg-white">
  
  {/* ADICIONAR ESTE BLOCO ⬇️ */}
  
  {/* Área de Upload (colapsável) */}
  {showUploadArea && ticketAtual && (
    <div className="mb-4">
      <UploadArea
        ticketId={ticketAtual.id}
        onUploadSuccess={(arquivos) => {
          console.log('✅ Arquivos enviados:', arquivos);
          setShowUploadArea(false); // Fechar após upload
          // Mensagem aparece automaticamente via WebSocket
        }}
        maxFiles={5}
        maxFileSize={10 * 1024 * 1024} // 10MB
      />
    </div>
  )}
  
  {/* Barra de ações (emojis, anexos, etc) */}
  <div className="flex items-center gap-2 mb-3">
    
    {/* Botão de Anexar */}
    <button
      onClick={() => setShowUploadArea(!showUploadArea)}
      disabled={!ticketAtual}
      className={`p-2 rounded-lg transition-colors ${
        showUploadArea 
          ? 'bg-[#159A9C] text-white' 
          : 'hover:bg-gray-100 text-gray-600'
      }`}
      title="Anexar arquivos"
    >
      <Paperclip className="h-5 w-5" />
    </button>
    
    {/* Botões existentes (emoji, templates, etc) */}
    {/* ... */}
  </div>
  
  {/* Input de mensagem (já existe) */}
  <div className="flex items-center gap-2">
    <textarea ... />
    <button ... /> {/* Botão enviar */}
  </div>
</div>
```

### 1.4 Estilização Extra (Opcional)

Se quiser adicionar animação ao abrir/fechar:

```tsx
{showUploadArea && (
  <div className="mb-4 animate-fadeIn">
    <UploadArea ... />
  </div>
)}

{/* No CSS global ou Tailwind config */}
<style>{`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
`}</style>
```

---

## 🔔 PASSO 2: Integrar Notificações Desktop

### 2.1 Importar no ChatOmnichannel

**Arquivo**: `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`

```tsx
// No topo do arquivo, adicionar import
import { useNotificacoesDesktop } from '../../../hooks/useNotificacoesDesktop';
import { Bell, BellOff } from 'lucide-react'; // Para botão de permissão
```

### 2.2 Adicionar Hook no Componente

```tsx
// Dentro do componente ChatOmnichannel, após outros hooks
const {
  permissao,
  suportado,
  solicitarPermissao,
  mostrarNotificacao,
  fecharTodas
} = useNotificacoesDesktop();
```

### 2.3 Solicitar Permissão ao Montar

```tsx
// useEffect para solicitar permissão na primeira visita
useEffect(() => {
  // Solicitar permissão se ainda não foi solicitada
  if (permissao === 'default' && suportado) {
    // Aguardar 3 segundos para não ser intrusivo
    const timer = setTimeout(() => {
      solicitarPermissao();
    }, 3000);
    
    return () => clearTimeout(timer);
  }
}, [permissao, suportado, solicitarPermissao]);
```

### 2.4 Integrar com WebSocket

**Localização**: No hook `useWebSocket` (já existe no componente)

```tsx
// Procurar pelo useWebSocket (geralmente linha ~200-300)
const { connected, connecting } = useWebSocket({
  enabled: true,
  autoConnect: true,
  events: {
    // ⬇️ MODIFICAR/ADICIONAR ESTAS CALLBACKS
    
    onNovaMensagem: (mensagem) => {
      // Lógica existente de adicionar mensagem
      // ...
      
      // 🆕 ADICIONAR: Notificação desktop se janela não está focada
      if (document.hidden && mensagem.remetente !== 'atendente') {
        mostrarNotificacao({
          titulo: `Nova mensagem de ${mensagem.remetenteNome || 'Cliente'}`,
          corpo: mensagem.conteudo?.substring(0, 100) || 'Nova mensagem recebida',
          tag: `msg-${mensagem.id}`,
          onClick: () => {
            window.focus();
            // Selecionar ticket da mensagem
            if (mensagem.ticketId) {
              selecionarTicketStore(mensagem.ticketId);
            }
          }
        });
      }
    },
    
    onNovoTicket: (ticket) => {
      // Lógica existente de adicionar ticket
      // ...
      
      // 🆕 ADICIONAR: Notificação para novo atendimento
      if (document.hidden) {
        mostrarNotificacao({
          titulo: 'Novo Atendimento',
          corpo: `${ticket.contatoNome || 'Cliente'} via ${ticket.canal || 'Chat'}`,
          tag: `ticket-${ticket.id}`,
          requireInteraction: true, // Não auto-fechar
          onClick: () => {
            window.focus();
            selecionarTicketStore(ticket.id);
          }
        });
      }
    },
    
    // Outros eventos existentes...
  }
});
```

### 2.5 Adicionar Botão de Permissão (Header)

**Localização**: Header do ChatOmnichannel (geralmente linha ~400-500)

```tsx
{/* Procurar pelo header que tem o título "Atendimento" */}
<div className="flex items-center justify-between p-4 border-b bg-white">
  <h1 className="text-2xl font-bold text-[#002333]">
    Atendimento Omnichannel
  </h1>
  
  {/* ⬇️ ADICIONAR ESTE BLOCO */}
  <div className="flex items-center gap-3">
    
    {/* Status WebSocket (já existe?) */}
    {connected && (
      <span className="text-sm text-green-600 flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-green-600"></span>
        Online
      </span>
    )}
    
    {/* 🆕 Botão de Notificações */}
    {suportado && (
      <>
        {permissao === 'default' && (
          <button
            onClick={solicitarPermissao}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
            title="Ativar notificações desktop"
          >
            <Bell className="h-4 w-4" />
            Ativar Notificações
          </button>
        )}
        
        {permissao === 'granted' && (
          <button
            onClick={fecharTodas}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Notificações ativadas"
          >
            <Bell className="h-5 w-5" />
          </button>
        )}
        
        {permissao === 'denied' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <BellOff className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">
              Notificações bloqueadas
            </span>
          </div>
        )}
      </>
    )}
  </div>
</div>
```

---

## 🧪 PASSO 3: Testar Integração

### 3.1 Testar Upload de Arquivos

```bash
# 1. Acessar
http://localhost:3000/atendimento

# 2. Selecionar um ticket ativo

# 3. Clicar no botão de anexo (📎)
- Deve abrir área de upload

# 4. Arrastar uma imagem
- Deve exibir preview
- Barra de progresso deve aparecer
- Mensagem deve aparecer no chat após upload

# 5. Testar erro
- Tentar arquivo > 10MB
- Deve exibir mensagem de erro
```

### 3.2 Testar Notificações Desktop

```bash
# 1. Abrir aplicação
http://localhost:3000/atendimento

# 2. Clicar "Ativar Notificações" (se aparecer)
- Navegador deve solicitar permissão
- Clicar "Permitir"

# 3. Minimizar janela ou mudar de aba

# 4. Usar outro dispositivo/navegador para enviar mensagem

# 5. Verificar
- ✅ Notificação desktop deve aparecer
- ✅ Título deve mudar para "(1) ConectCRM"
- ✅ Clicar na notificação deve focar janela
- ✅ Focar janela deve resetar contador
```

### 3.3 Testar WebSocket (Mensagens Tempo Real)

```bash
# 1. Abrir 2 abas do navegador
http://localhost:3000/atendimento

# 2. Selecionar mesmo ticket nas 2 abas

# 3. Enviar mensagem na aba 1
- Deve aparecer na aba 2 instantaneamente
- Sem necessidade de refresh

# 4. Verificar console (F12)
- Não deve ter erros
- Deve exibir: "💬 Nova mensagem recebida"
```

---

## 🐛 Troubleshooting

### ❌ Upload não funciona

**Erro**: "Endpoint não encontrado" ou 404

**Solução**:
```bash
# Verificar se endpoint existe no backend
curl -X POST http://localhost:3001/atendimento/mensagens/arquivo \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@test.jpg" \
  -F "ticketId=123"

# Se retornar 404, verificar backend/src/modules/atendimento/
```

### ❌ Notificações não aparecem

**Erro**: "Notification is not defined"

**Solução**:
```javascript
// Verificar se navegador suporta
if ('Notification' in window) {
  console.log('✅ Suportado');
} else {
  console.log('❌ Navegador não suporta notificações');
}

// Verificar permissão
console.log('Permissão:', Notification.permission);
// Se "denied", usuário precisa desbloquear nas configurações do navegador
```

### ❌ Badge count não reseta

**Erro**: Título fica "(5) ConectCRM" mesmo após focar janela

**Solução**:
```tsx
// Verificar se evento de focus está registrado
useEffect(() => {
  const handleFocus = () => {
    console.log('Janela focada - resetando badge');
    fecharTodas();
  };
  
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [fecharTodas]);
```

### ❌ WebSocket desconectando

**Erro**: "WebSocket disconnected" no console

**Solução**:
```typescript
// Verificar token
const token = localStorage.getItem('authToken');
console.log('Token existe?', !!token);

// Verificar backend
curl http://localhost:3001/health
// Deve retornar 200 OK

// Verificar CORS no backend (main.ts)
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true
});
```

---

## ✅ Checklist Final

Após integração, verificar:

### Upload:
- [ ] Botão de anexo aparece na área de input
- [ ] Clicar abre área de upload
- [ ] Drag & drop funciona
- [ ] Preview de imagem aparece
- [ ] Barra de progresso funciona
- [ ] Arquivo aparece no chat após upload
- [ ] Erro aparece para arquivo muito grande

### Notificações:
- [ ] Botão "Ativar Notificações" aparece (se não ativado)
- [ ] Clicar solicita permissão do navegador
- [ ] Badge count aparece no título "(1) ConectCRM"
- [ ] Notificação desktop aparece ao receber mensagem
- [ ] Clicar na notificação foca janela e seleciona ticket
- [ ] Badge count reseta ao focar janela
- [ ] Ícone de sino muda para verde quando ativado

### WebSocket:
- [ ] Indicador "● Online" aparece no header
- [ ] Mensagens aparecem em tempo real
- [ ] Abrir 2 abas e enviar mensagem em uma → aparece na outra
- [ ] Sem erros de WebSocket no console

---

## 📚 Referências

- **Documentação completa**: `CONSOLIDACAO_FASE_2_3_ATENDIMENTO.md`
- **Componentes criados**:
  - `frontend-web/src/features/atendimento/components/UploadArea.tsx`
  - `frontend-web/src/hooks/useNotificacoesDesktop.ts`
- **Exemplos de uso**: Ver seção "Como Integrar" no documento de consolidação

---

## 🆘 Precisa de Ajuda?

**Consultar arquivos**:
- `PROXIMOS_PASSOS_ATENDIMENTO.md` - Roadmap completo
- `ATENDIMENTO_SISTEMA_OFICIAL.md` - Documentação do sistema
- `PLANO_FINALIZACAO_ATENDIMENTO.md` - Plano original

**GitHub Copilot disponível para ajudar!** 🤖

---

**Tempo total estimado**: 1-2 horas  
**Dificuldade**: Baixa (apenas adicionar imports e componentes)

**Boa integração!** 🚀
