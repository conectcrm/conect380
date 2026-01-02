# 🧪 Teste UX dos Bugs - SEM Dependência do WhatsApp

## ⚠️ Contexto

O WhatsApp Business API está com erro de configuração (`#133010 - Account not registered`).  
**MAS** os bugs de UX que implementamos são **independentes** do WhatsApp!

---

## ✅ Como Testar Sem WhatsApp

### 🎯 BUG-001: Scroll Automático

**Não depende de WhatsApp** - Funciona com mensagens existentes no banco!

#### Cenário 1: Scroll instantâneo ao abrir chat
1. Login no sistema
2. Ir em **Atendimento → Chat Omnichannel**
3. Clicar em qualquer ticket da lista (que já tenha mensagens)
4. **VERIFICAR**: Scroll vai instantaneamente para o final (sem animação)
5. **EXPECTED**: Última mensagem visível imediatamente

✅ **PASSOU** se scroll foi instantâneo (sem animação suave)

---

#### Cenário 2: Não interromper leitura de histórico
1. Abrir um ticket com várias mensagens
2. **Scrollar MANUALMENTE para cima** (ler mensagens antigas)
3. Esperar 5 segundos (simular usuário lendo)
4. Em outro navegador/aba: enviar mensagem naquele ticket (ou simular via backend)
5. **VERIFICAR**: A tela NÃO deve scrollar automaticamente
6. **EXPECTED**: Você continua vendo as mensagens antigas que estava lendo

✅ **PASSOU** se você continuou vendo as mensagens antigas (não scrollou)

---

#### Cenário 3: Scroll suave quando já está no final
1. Abrir ticket
2. Garantir que está no final (última mensagem visível)
3. Enviar uma nova mensagem (ou receber)
4. **VERIFICAR**: Scroll desce suavemente (com animação)
5. **EXPECTED**: Nova mensagem aparece com scroll suave

✅ **PASSOU** se scroll foi suave (com animação smooth)

---

### 🎯 BUG-002: Progress Bar de Upload

**Problema atual**: WhatsApp API rejeita o upload  
**Solução**: Testar com upload HTTP genérico (mesmo sem WhatsApp processar)

#### Cenário 1: Progress bar aparece
1. Abrir ticket
2. Clicar no botão de **anexar arquivo** (📎)
3. Escolher arquivo pequeno (500KB - 1MB)
4. **VERIFICAR**: Barra de progresso aparece brevemente
5. **EXPECTED**: 
   - Ícone Paperclip 📎
   - Texto "Enviando arquivo... X%"
   - Barra verde (#159A9C) crescendo de 0% → 100%

✅ **PASSOU** se barra apareceu (mesmo que depois dê erro de WhatsApp)

---

#### Cenário 2: Progresso em tempo real
1. Abrir ticket
2. Preparar arquivo GRANDE (10-50MB) - [Gerar arquivo de teste](#gerar-arquivo-teste)
3. Anexar arquivo
4. **VERIFICAR**: 
   - Porcentagem aumenta gradualmente (0% → 10% → 25% → 50% → 75% → 100%)
   - Barra verde cresce proporcionalmente
   - Animação suave (transition-all duration-300)
5. **EXPECTED**: Ver progresso em tempo real

✅ **PASSOU** se viu porcentagem aumentando gradualmente

---

### 🎯 BUG-003: WebSocket Reconnection

**Não depende de WhatsApp** - Testa apenas conexão Socket.IO!

#### Cenário: Reconexão automática
1. Abrir ticket
2. Abrir **DevTools** (F12) → Aba **Console**
3. Verificar logs: `✅ WebSocket conectado`
4. **Desconectar Wi-Fi** (ou desativar adaptador de rede)
5. **VERIFICAR Console**:
   - `⚠️ WebSocket desconectado`
   - `🔄 Tentativa de reconexão 1/5...`
6. **Reconectar Wi-Fi**
7. **VERIFICAR Console**:
   - `✅ WebSocket reconectado`
8. **VERIFICAR UI**: Mensagens voltam a aparecer

✅ **PASSOU** se reconectou automaticamente (até 5 tentativas)

---

## 🔧 Gerar Arquivo de Teste

Para testar progress bar com arquivo grande:

### Windows PowerShell
```powershell
# Criar arquivo de 50MB
fsutil file createnew C:\temp\teste-upload-50mb.bin 52428800

# Criar arquivo de 10MB
fsutil file createnew C:\temp\teste-upload-10mb.bin 10485760
```

### Alternativa: Baixar Vídeo
- Baixar qualquer vídeo MP4 (20-50MB) do YouTube
- Usar para testar upload

---

## 📊 Resumo do Teste

| Bug | Depende WhatsApp? | Como Testar |
|-----|-------------------|-------------|
| **BUG-001** | ❌ NÃO | Usar mensagens existentes no banco |
| **BUG-002** | ⚠️ PARCIAL | Progress bar funciona, mas WhatsApp rejeita |
| **BUG-003** | ❌ NÃO | Socket.IO funciona independente |

---

## 🎯 Critério de Sucesso

**Nossos bugs de UX estão OK se**:
- ✅ Scroll funciona conforme esperado (3 cenários)
- ✅ Progress bar aparece e atualiza em tempo real
- ✅ WebSocket reconecta automaticamente

**O erro do WhatsApp (#133010) é separado** - relacionado a:
- Token expirado
- Permissões
- Configuração da conta Business

---

## 🚀 Próximos Passos

1. **AGORA**: Testar os 3 bugs de UX usando este guia
2. **DEPOIS**: Resolver configuração do WhatsApp (tarefa separada)

---

## 💡 Como Documentar Resultados

No arquivo `RESULTADOS_TESTE_BUGS_OMNICHANNEL.md`:

### Se BUG passou (apesar do erro WhatsApp):
```markdown
#### ✅ BUG-002 - Cenário 1: Upload arquivo pequeno
- Status: ✅ PASSOU
- Observação: Progress bar funcionou perfeitamente.
  WhatsApp rejeitou após upload (erro #133010), mas isso é problema
  de configuração externa, não do código de UX.
- Evidência: [screenshot da progress bar]
```

### Se BUG falhou (problema no código):
```markdown
#### ❌ BUG-002 - Cenário 1: Upload arquivo pequeno
- Status: ❌ FALHOU
- Problema: Progress bar não apareceu
- Erro: [descrever]
- Evidência: [screenshot ou log]
```

---

**Última atualização**: 11/12/2025 11:40  
**Status**: ✅ Pronto para testar UX independente do WhatsApp
