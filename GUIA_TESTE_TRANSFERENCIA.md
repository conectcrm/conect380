# 🧪 Guia de Teste Manual - Transferência de Tickets

**Data**: 12/12/2025  
**Feature**: Sprint 2 - Transferência de Tickets  
**Status Backend**: ✅ Rodando (porta 3001)  
**Status Frontend**: ✅ Rodando (porta 3000)

---

## 📋 Pré-requisitos

✅ Backend rodando: `http://localhost:3001`  
✅ Frontend rodando: `http://localhost:3000`  
✅ Usuário de teste: `admin@conectsuite.com.br` / `admin123`

---

## 🎯 TESTE 1: Fluxo Completo de Transferência (Happy Path)

### Passo 1: Fazer Login
1. Abra o navegador: `http://localhost:3000`
2. Faça login com:
   - Email: `admin@conectsuite.com.br`
   - Senha: `admin123`
3. ✅ **Verificar**: Você está logado no sistema

### Passo 2: Navegar para Atendimento
1. Clique no menu "Atendimento" ou vá direto para: `http://localhost:3000/atendimento`
2. ✅ **Verificar**: Lista de tickets aparece

### Passo 3: Abrir um Ticket
1. Clique em qualquer ticket da lista que esteja **atribuído a você**
2. ✅ **Verificar**: Chat area abre à direita
3. ✅ **Verificar**: No header do ticket, você vê:
   - Foto do contato
   - Nome do contato
   - Tempo de atendimento
   - Número do ticket
   - Botões de ação (incluindo botão de transferir - ícone de setas circulares azul)

### Passo 4: Abrir Modal de Transferência
1. Clique no **botão "Transferir"** (ícone RefreshCw azul)
2. ✅ **Verificar**: Modal abre com:
   - Título: "Transferir Ticket"
   - Número do ticket no subtítulo
   - Campo de busca
   - Lista de atendentes
   - Campos de motivo e nota interna

### Passo 5: Buscar Atendente
1. Digite um nome no campo de busca (ex: "João", "Maria")
2. ✅ **Verificar**: Lista filtra em tempo real
3. ✅ **Verificar**: Atendente atual do ticket NÃO aparece na lista

### Passo 6: Selecionar Atendente
1. Clique em um dos atendentes da lista (radio button)
2. ✅ **Verificar**: 
   - Atendente fica selecionado (fundo verde claro)
   - Badge de status aparece (Disponível/Ocupado/Ausente)

### Passo 7: Preencher Motivo
1. No campo "Motivo da Transferência", digite:
   ```
   Cliente solicitou suporte técnico especializado
   ```
2. ✅ **Verificar**: Texto aparece no campo

### Passo 8: Preencher Nota Interna (Opcional)
1. No campo "Nota Interna", digite:
   ```
   Cliente mencionou urgência no atendimento
   ```
2. ✅ **Verificar**: Texto aparece no campo

### Passo 9: Confirmar Transferência
1. Clique no botão **"Confirmar Transferência"**
2. ✅ **Verificar**: 
   - Botão muda para "Transferindo..." com spinner
   - Botão fica desabilitado
3. Aguarde resposta (deve ser rápido, ~1-2 segundos)

### Passo 10: Validar Sucesso
1. ✅ **Verificar**: Modal fecha automaticamente
2. ✅ **Verificar**: Ticket **desaparece** da sua lista (ou chat area fecha)
3. ✅ **Verificar**: Nenhuma mensagem de erro aparece

### ✅ Resultado Esperado
- Transferência concluída com sucesso
- Ticket não está mais na sua lista
- Atendente destino recebeu o ticket

---

## 🚨 TESTE 2: Validação de Erros

### Teste 2.1: Tentar Transferir Sem Selecionar Atendente
1. Abra modal de transferência
2. **NÃO selecione** nenhum atendente
3. Preencha o motivo
4. Clique em "Confirmar Transferência"
5. ✅ **Verificar**: Mensagem de erro aparece: "Selecione um atendente para transferir"

### Teste 2.2: Tentar Transferir Sem Motivo
1. Abra modal de transferência
2. Selecione um atendente
3. **Deixe o campo "Motivo" vazio**
4. Clique em "Confirmar Transferência"
5. ✅ **Verificar**: Mensagem de erro aparece: "Informe o motivo da transferência"

### Teste 2.3: Nota Interna é Opcional
1. Abra modal de transferência
2. Selecione um atendente
3. Preencha o motivo
4. **Deixe "Nota Interna" vazia**
5. Clique em "Confirmar Transferência"
6. ✅ **Verificar**: Transferência funciona normalmente (não exige nota interna)

---

## 🔍 TESTE 3: Estados do Modal

### Teste 3.1: Loading Inicial
1. Abra modal de transferência
2. ✅ **Verificar**: Enquanto carrega atendentes, aparece:
   - Spinner animado
   - Mensagem "Carregando..."

### Teste 3.2: Busca Sem Resultados
1. Abra modal de transferência
2. Digite no campo de busca: `XYZXYZXYZ` (nome que não existe)
3. ✅ **Verificar**: Mensagem "Nenhum atendente encontrado" aparece

### Teste 3.3: Lista Vazia
**Cenário**: Não há outros atendentes ativos além de você
1. ✅ **Verificar**: Mensagem "Nenhum atendente disponível" aparece

---

## 📱 TESTE 4: Responsividade

### Desktop (1920x1080)
1. Maximize o navegador
2. Abra modal de transferência
3. ✅ **Verificar**: Modal centralizado, largura ~600px

### Tablet (768px)
1. Redimensione navegador para ~768px
2. Abra modal de transferência
3. ✅ **Verificar**: Modal ajusta largura, mantém padding

### Mobile (375px)
1. Abra DevTools (F12) e simule iPhone/Android
2. Abra modal de transferência
3. ✅ **Verificar**: Modal ocupa quase toda largura (com padding de 16px)

---

## 🎨 TESTE 5: Design e UX

### Cores (Paleta Crevasse)
1. Abra modal de transferência
2. ✅ **Verificar cores**:
   - Botão "Confirmar": `#159A9C` (teal)
   - Hover do botão: `#0F7B7D` (teal escuro)
   - Texto principal: `#002333` (azul escuro)
   - Bordas: `#B4BEC9` (cinza)
   - Foco nos inputs: anel azul `#159A9C`

### Ícones
1. ✅ **Verificar ícones presentes**:
   - Search (lupa) no campo de busca
   - User (pessoa) ao lado de cada atendente
   - AlertCircle (!) nas mensagens de erro
   - X (fechar) no canto superior direito do modal

### Estados Visuais
1. ✅ **Atendente selecionado**:
   - Fundo: `bg-[#159A9C]/10` (verde água claro)
   - Borda: `border-2 border-[#159A9C]`
   
2. ✅ **Atendente não selecionado**:
   - Fundo: `bg-white`
   - Borda: `border border-[#B4BEC9]`
   - Hover: `hover:bg-gray-50`

---

## 🐛 TESTE 6: Casos Edge

### Caso 6.1: Cancelar Modal
1. Abra modal de transferência
2. Preencha alguns campos
3. Clique no **X** (canto superior direito) ou em "Cancelar"
4. ✅ **Verificar**: Modal fecha e dados não são salvos

### Caso 6.2: Múltiplas Aberturas
1. Abra modal → Feche
2. Abra modal novamente
3. ✅ **Verificar**: Modal limpo (sem dados do uso anterior)

### Caso 6.3: Transferência Durante Loading
1. Abra modal
2. Selecione atendente e preencha motivo
3. Clique em "Confirmar"
4. **Enquanto está enviando**, tente:
   - Clicar em "Confirmar" novamente
   - Clicar no X
   - Modificar campos
5. ✅ **Verificar**: Ações estão bloqueadas (disabled)

---

## 🔧 TESTE 7: Verificação no Backend

### Via Terminal (PowerShell)
```powershell
# Ver logs do backend em tempo real
Get-Content "C:\Projetos\conectcrm\backend\logs\app.log" -Wait -Tail 50
```

### Verificar Histórico do Ticket
1. Após transferência bem-sucedida, vá ao banco de dados
2. Consulte a tabela `historico_ticket` ou similar
3. ✅ **Verificar**: Registro de transferência foi criado com:
   - `tipo`: "TRANSFERENCIA"
   - `atendenteOrigemId`: ID do atendente que transferiu
   - `atendenteDestinoId`: ID do atendente que recebeu
   - `motivo`: Texto preenchido
   - `notaInterna`: Texto preenchido (se houver)

---

## 📊 Checklist Final

Antes de considerar o teste completo, verifique:

- [ ] ✅ **TESTE 1**: Fluxo completo funciona (happy path)
- [ ] ✅ **TESTE 2.1**: Valida atendente obrigatório
- [ ] ✅ **TESTE 2.2**: Valida motivo obrigatório
- [ ] ✅ **TESTE 2.3**: Nota interna é opcional
- [ ] ✅ **TESTE 3.1**: Loading inicial aparece
- [ ] ✅ **TESTE 3.2**: Busca sem resultados funciona
- [ ] ✅ **TESTE 4**: Responsividade (desktop/tablet/mobile)
- [ ] ✅ **TESTE 5**: Design segue paleta Crevasse
- [ ] ✅ **TESTE 6.1**: Cancelar modal funciona
- [ ] ✅ **TESTE 6.3**: Botões desabilitam durante envio

---

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:

1. **Marcar ETAPA 4 como concluída** ✅
2. **Opcionalmente implementar**: ETAPA 5 - Notificações WebSocket (30 min)
3. **Seguir para**: Sprint 2 Feature 3 - Histórico de Conversas (3h)

---

## 🐞 Reportar Problemas

Se encontrar algum bug, anote:
1. **Passos para reproduzir**
2. **Comportamento esperado**
3. **Comportamento atual**
4. **Screenshot** (se possível)
5. **Mensagem de erro** (console ou UI)

---

**Testado por**: _____________________  
**Data**: _____________________  
**Resultado**: [ ] ✅ Passou | [ ] ❌ Falhou | [ ] ⚠️ Parcial
