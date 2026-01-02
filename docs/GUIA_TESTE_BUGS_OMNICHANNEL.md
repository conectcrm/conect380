# 🧪 Guia de Testes - Bugs Omnichannel

**Data**: 11 de dezembro de 2025  
**Bugs Implementados**: BUG-001, BUG-002, BUG-003  
**Tempo Estimado de Teste**: 30-45 minutos

---

## 🎯 Objetivo

Validar que os 3 bugs críticos de UX foram corrigidos corretamente:

- ✅ **BUG-001**: Scroll automático inteligente
- ✅ **BUG-002**: Progress bar para uploads
- ✅ **BUG-003**: Reconexão WebSocket

---

## 📋 Pré-requisitos

### 1. Iniciar Backend

```powershell
cd backend
npm run start:dev
```

**Aguardar mensagem**: `Application is running on: http://localhost:3001`

### 2. Iniciar Frontend

```powershell
cd frontend-web
npm start
```

**Aguardar**: Browser abrir em `http://localhost:3000`

### 3. Fazer Login

- **Email**: `admin@conectsuite.com.br`
- **Senha**: `admin123`

### 4. Navegar para Omnichannel

- Menu: **Atendimento** → **Chat Omnichannel**
- Deve abrir tela com lista de tickets e área de chat

---

## 🧪 Teste 1: Scroll Automático Inteligente (BUG-001)

### Objetivo

Verificar que o scroll não interrompe o usuário ao ler histórico, mas funciona quando está acompanhando conversa.

### Passos

#### Cenário 1: Scroll ao abrir chat ✅

1. Selecionar um ticket com muitas mensagens (50+)
2. **Resultado esperado**: 
   - ✅ Chat faz scroll **instantâneo** até última mensagem
   - ✅ Usuário vê mensagem mais recente primeiro
   - ✅ Sem animação (scroll é imediato)

#### Cenário 2: Usuário lendo histórico ✅

1. Abrir ticket com muitas mensagens
2. Rolar o chat **para cima** (ler mensagens antigas)
3. Parar em algum ponto do histórico (ex: metade da tela)
4. Simular chegada de nova mensagem:
   - Abrir outra aba do navegador
   - Logar como outro usuário
   - Enviar mensagem no mesmo ticket
5. **Resultado esperado**:
   - ✅ Chat **NÃO** faz scroll automático
   - ✅ Usuário continua vendo o histórico que estava lendo
   - ✅ Nova mensagem não interrompe a leitura

#### Cenário 3: Usuário no final da conversa ✅

1. Abrir ticket com algumas mensagens
2. Rolar até o final (última mensagem visível)
3. Enviar uma mensagem ou receber nova mensagem
4. **Resultado esperado**:
   - ✅ Chat faz scroll **suave** até nova mensagem
   - ✅ Animação smooth visível
   - ✅ Nova mensagem fica visível automaticamente

#### Cenário 4: Trocar de ticket ✅

1. Abrir ticket A (rolar até meio do histórico)
2. Clicar em ticket B
3. **Resultado esperado**:
   - ✅ Chat faz scroll **instantâneo** até última mensagem do ticket B
   - ✅ Sem animação (scroll imediato)

### Critérios de Sucesso

- [x] Scroll instantâneo ao abrir chat
- [x] Não interrompe usuário lendo histórico (> 150px do final)
- [x] Scroll suave quando usuário está no final (< 150px)
- [x] Scroll instantâneo ao trocar de ticket

---

## 🧪 Teste 2: Progress Bar de Upload (BUG-002)

### Objetivo

Verificar que o usuário tem feedback visual durante upload de arquivos.

### Passos

#### Cenário 1: Upload de arquivo pequeno ✅

1. Abrir ticket qualquer
2. Clicar no ícone de **Anexar arquivo** (📎 Paperclip)
3. Selecionar arquivo pequeno (< 1MB, ex: imagem PNG)
4. Enviar
5. **Resultado esperado**:
   - ✅ Progress bar aparece brevemente (pode ser rápido)
   - ✅ Mostra "Enviando arquivo... X%"
   - ✅ Barra de progresso com cor `#159A9C` (Crevasse)
   - ✅ Progress bar desaparece ao completar

#### Cenário 2: Upload de arquivo grande ✅

1. Abrir ticket qualquer
2. Clicar no ícone de **Anexar arquivo** (📎 Paperclip)
3. Selecionar arquivo grande (10-50MB, ex: vídeo, PDF grande)
4. Enviar
5. **Resultado esperado**:
   - ✅ Progress bar aparece imediatamente
   - ✅ Percentual atualiza em tempo real: `0% → 25% → 50% → 75% → 100%`
   - ✅ Barra de progresso cresce suavemente (animação fluida)
   - ✅ Texto: "Enviando arquivo... X%"
   - ✅ Ícone Paperclip visível
   - ✅ Progress bar desaparece ao atingir 100%

#### Cenário 3: Design e Responsividade ✅

1. Fazer upload de arquivo
2. Verificar design do progress bar:
   - ✅ Card branco com borda cinza
   - ✅ Cor da barra: `#159A9C` (teal)
   - ✅ Cor de fundo: `#DEEFE7` (teal light)
   - ✅ Ícone Paperclip à esquerda
   - ✅ Percentual à direita (fonte mono)
3. Testar em mobile (F12 → Device Toolbar):
   - ✅ Progress bar responsivo
   - ✅ Texto legível em telas pequenas

#### Cenário 4: Múltiplos tipos de arquivo ✅

Testar progress bar com:
- ✅ Imagem (PNG, JPG)
- ✅ PDF
- ✅ Vídeo (MP4)
- ✅ Documento (DOCX, XLSX)

**Resultado esperado**: Progress bar funciona para todos os tipos.

### Critérios de Sucesso

- [x] Progress bar aparece durante upload
- [x] Percentual atualiza em tempo real (0% → 100%)
- [x] Design limpo seguindo paleta Crevasse
- [x] Funciona para todos os tipos de arquivo
- [x] Desaparece automaticamente ao completar
- [x] Responsivo (mobile e desktop)

---

## 🧪 Teste 3: Reconexão WebSocket (BUG-003)

### Objetivo

Verificar que o chat reconecta automaticamente após perda de conexão de rede.

### Passos

#### Cenário 1: Desconexão de rede ✅

1. Abrir ticket qualquer
2. Abrir DevTools (F12) → Aba **Console**
3. Desligar Wi-Fi ou desconectar cabo de rede
4. Aguardar 5 segundos
5. **Resultado esperado**:
   - ✅ Console mostra: `⚠️ WebSocket desconectado: transport close`
   - ✅ (Opcional) Indicador visual de "desconectado" aparece

#### Cenário 2: Reconexão automática ✅

1. Após desconexão (passo anterior)
2. Religar Wi-Fi ou reconectar cabo
3. Aguardar até 5 segundos
4. **Resultado esperado**:
   - ✅ Console mostra: `🔄 Tentativa de reconexão 1...`
   - ✅ Console mostra: `✅ WebSocket conectado`
   - ✅ Console mostra: `🔄 WebSocket reconectado após N tentativas`
   - ✅ Chat continua funcionando normalmente

#### Cenário 3: Sincronização após reconexão ✅

1. Após reconexão (passo anterior)
2. Enviar uma mensagem
3. **Resultado esperado**:
   - ✅ Mensagem é enviada com sucesso
   - ✅ Mensagem aparece no chat
   - ✅ Sem necessidade de recarregar página

#### Cenário 4: Falha permanente (opcional) ⚠️

1. Desconectar rede
2. Parar o backend: `Ctrl+C` no terminal do backend
3. Aguardar 10 segundos (5 tentativas de reconexão)
4. **Resultado esperado**:
   - ✅ Console mostra tentativas: `🔄 Tentativa 1, 2, 3, 4, 5...`
   - ✅ Console mostra: `❌ Falha permanente ao reconectar`
   - ✅ (Opcional) Mensagem de erro exibida ao usuário

### Critérios de Sucesso

- [x] Desconexão detectada
- [x] Reconexão automática (até 5 tentativas)
- [x] Estado sincronizado após reconexão
- [x] Chat funciona normalmente após reconectar
- [x] Logs estruturados no console

---

## ✅ Checklist Final

Após completar todos os testes, verificar:

### Console do Navegador (F12 → Console)

- [ ] **Sem erros vermelhos** (exceto desconexão intencional do teste 3)
- [ ] Logs estruturados (ex: `✅ WebSocket conectado`, `🔄 Reconectando...`)
- [ ] Sem warnings críticos

### Network Tab (F12 → Network)

- [ ] Requisições POST para upload retornam **200** ou **201**
- [ ] WebSocket mostra status **101 Switching Protocols**
- [ ] Sem requisições falhando (status 4xx ou 5xx)

### UX Geral

- [ ] Chat responde rapidamente
- [ ] Sem travamentos ou delays perceptíveis
- [ ] Animações suaves (scroll, progress bar)
- [ ] Design consistente (cores Crevasse)

### Responsividade

- [ ] Testar em Desktop (1920x1080)
- [ ] Testar em Tablet (768x1024)
- [ ] Testar em Mobile (375x667)

---

## 🐛 Reportar Problemas

Se encontrar algum problema durante os testes:

### Template de Bug Report

```markdown
## 🐛 Bug Encontrado

**Teste**: [Teste 1, 2 ou 3]
**Cenário**: [Qual cenário falhou]
**Passos para Reproduzir**:
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Resultado Esperado**: [O que deveria acontecer]
**Resultado Obtido**: [O que realmente aconteceu]

**Evidências**:
- Screenshot: [anexar]
- Console logs: [copiar]
- Erro específico: [copiar mensagem]

**Ambiente**:
- Browser: [Chrome 120, Firefox 121, etc]
- SO: [Windows 11, macOS 14, etc]
- Resolução: [1920x1080, etc]
```

### Onde Reportar

1. Criar issue no GitHub: `conectsuite/issues/new`
2. Ou adicionar em: `docs/BUGS_ENCONTRADOS.md`

---

## 📊 Resultado dos Testes

### Status

| Bug | Status | Observações |
|-----|--------|-------------|
| BUG-001: Scroll Automático | ⏳ Aguardando teste | - |
| BUG-002: Progress Bar | ⏳ Aguardando teste | - |
| BUG-003: WebSocket Reconnection | ⏳ Aguardando teste | - |

### Próximos Passos

Após testes passarem:

1. ✅ Marcar bugs como ✅ Testados
2. 🚀 Fazer commit das alterações
3. 📝 Atualizar CHANGELOG.md
4. 🎉 Feature pronta para produção!

---

**Criado por**: AI Assistant  
**Data**: 11 de dezembro de 2025  
**Versão**: 1.0
