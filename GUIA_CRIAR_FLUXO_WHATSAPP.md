# 🎨 Guia: Como Criar o Fluxo do WhatsApp

**Objetivo:** Criar o fluxo que aparece na mensagem do WhatsApp com as opções:
- ❌ Digite SAIR para cancelar
- ↩️ Suporte Técnico

---

## 🚀 Passo 1: Acessar o Construtor

1. Abra: http://localhost:3000/fluxos/builder
2. Ou: http://localhost:3000/gestao/fluxos → Clique em "Novo Fluxo"

---

## 🧩 Passo 2: Montar o Fluxo Visualmente

### Estrutura Completa:

```
┌─────────────────────────────────┐
│        Início (automático)      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   📨 BLOCO 1: Mensagem Inicial  │
│                                 │
│ Texto:                          │
│ "👋 Olá, {{nome}}! Que bom ter  │
│  você de volta! 😊"             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   📋 BLOCO 2: Menu de Opções    │
│                                 │
│ Texto:                          │
│ "Por favor, escolha uma das     │
│  opções abaixo:"                │
│                                 │
│ Opções:                         │
│ 1️⃣ ❌ Digite SAIR (cancelar)   │──→ Bloco Fim
│ 2️⃣ ↩️ Suporte Técnico          │──→ Bloco Ação (Transferir)
└─────────────────────────────────┘
```

---

## 📝 Passo 3: Configurar Cada Bloco

### 🟦 BLOCO 1: Mensagem de Boas-Vindas

1. **Arraste** o bloco "📨 Mensagem" para o canvas
2. **Clique** no bloco para configurar
3. **Preencha**:
   ```
   Título: Boas-vindas
   
   Mensagem:
   👋 Olá, {{nome}}! Que bom ter você de volta! 😊
   ```
4. **Conecte** o bloco de Início → Boas-vindas (arraste a seta)

**Variáveis disponíveis:**
- `{{nome}}` → Nome do contato
- `{{telefone}}` → Telefone do contato
- `{{hora}}` → Hora atual

---

### 🟪 BLOCO 2: Menu de Opções

1. **Arraste** o bloco "📋 Menu" para o canvas
2. **Clique** no bloco para configurar
3. **Preencha**:
   ```
   Título: Menu Principal
   
   Mensagem:
   Por favor, escolha uma das opções abaixo:
   ```

4. **Adicione as opções** (clique em "+ Adicionar Opção"):

   **Opção 1:**
   ```
   Emoji: ❌
   Texto: Digite SAIR para cancelar
   Valor: SAIR
   Ação: Ir para → Bloco Fim
   ```

   **Opção 2:**
   ```
   Emoji: ↩️
   Texto: Suporte Técnico
   Valor: SUPORTE
   Ação: Ir para → Bloco Transferir
   ```

5. **Conecte** Boas-vindas → Menu (arraste a seta)

---

### 🟠 BLOCO 3: Ação - Transferir para Suporte

1. **Arraste** o bloco "⚡ Ação" para o canvas
2. **Clique** no bloco para configurar
3. **Preencha**:
   ```
   Título: Transferir Suporte
   
   Tipo de Ação: Transferir Atendimento
   
   Departamento: Suporte Técnico
   (ou selecione na lista)
   
   Mensagem ao Transferir:
   "Aguarde, estou conectando você com nosso Suporte Técnico..."
   ```

4. **Conecte** Menu (opção "Suporte Técnico") → Transferir

---

### 🔴 BLOCO 4: Fim do Atendimento

1. **Arraste** o bloco "✅ Fim" para o canvas
2. **Clique** no bloco para configurar
3. **Preencha**:
   ```
   Título: Encerramento
   
   Mensagem Final:
   "Atendimento cancelado. Até logo! 👋"
   ```

4. **Conecte** Menu (opção "SAIR") → Fim

---

## 🎨 Layout Visual no Canvas

```
                    [Início]
                       │
                       ▼
        ┌──────────────────────────┐
        │   📨 Boas-vindas         │
        │ "Olá, {{nome}}! Que bom  │
        │  ter você de volta!"     │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │   📋 Menu Principal      │
        │ "Escolha uma opção:"     │
        ├──────────────────────────┤
        │ 1. ❌ SAIR               │────┐
        │ 2. ↩️ Suporte Técnico    │─┐  │
        └──────────────────────────┘ │  │
                   │                 │  │
                   │                 │  │
         ┌─────────┴──────┐         │  │
         │                │         │  │
         ▼                ▼         │  │
   ┌─────────┐      ┌─────────┐    │  │
   │ ⚡ Ação │      │ ✅ Fim  │◄───┘  │
   │Transferir│      │Encerrar │       │
   └─────────┘      └─────────┘◄──────┘
```

---

## 💾 Passo 4: Salvar e Publicar

### Salvar:
1. Clique no botão **"💾 Salvar"** (canto superior direito)
2. Aguarde: "✅ Fluxo salvo com sucesso!"

### Publicar (Ativar):
1. Clique em **"🚀 Publicar"**
2. Confirme a publicação
3. Agora o fluxo está **ATIVO** no WhatsApp!

---

## 🧪 Passo 5: Testar o Fluxo

### Teste no Simulador:
1. Clique em **"🧪 Testar Fluxo"** (no builder)
2. Simule as respostas do usuário
3. Veja se o fluxo está correto

### Teste no WhatsApp Real:
1. Envie "Olá" para o número do WhatsApp conectado
2. Verifique se o bot responde com:
   ```
   👋 Olá, Dhonleno Lopes! Que bom ter você de volta! 😊

   Por favor, escolha uma das opções abaixo:

   ❌ Digite SAIR para cancelar
   ↩️ Suporte Técnico
   ```
3. Digite "SAIR" → Deve encerrar
4. Digite "SUPORTE" → Deve transferir

---

## ⚙️ Configurações Avançadas

### Adicionar Mais Departamentos:

Se você quiser adicionar mais opções (ex: Financeiro, Comercial):

1. Acesse: http://localhost:3000/gestao/equipes
2. Cadastre os departamentos/equipes
3. No fluxo, adicione novas opções no Menu:
   ```
   3️⃣ 💰 Financeiro
   4️⃣ 🤝 Comercial
   5️⃣ 📞 Atendimento
   ```

### Personalizar Mensagens:

No bloco de Mensagem, você pode usar:
- **Emojis** → 😊 👋 ✅ ❌ ↩️
- **Variáveis** → `{{nome}}`, `{{telefone}}`, `{{data}}`
- **Quebras de linha** → Enter/Shift+Enter
- **Formatação** → *negrito*, _itálico_ (WhatsApp)

---

## 📊 Onde Ver os Dados dos Departamentos

### 1. Cadastrar Equipes/Departamentos:
http://localhost:3000/gestao/equipes

### 2. Ver Atendimentos:
http://localhost:3000/atendimento

### 3. Ver Estatísticas do Fluxo:
http://localhost:3000/gestao/fluxos → Clique no fluxo → Ver Estatísticas

---

## 🔑 Palavra-Chave para Iniciar o Bot

Se o bot não responder automaticamente, configure uma **palavra-gatilho**:

1. Edite o fluxo
2. Vá em **"⚙️ Configurações"**
3. Adicione palavras-gatilho:
   ```
   oi, olá, ola, menu, iniciar, começar
   ```
4. Salve e publique

Agora, quando o usuário enviar qualquer uma dessas palavras, o bot inicia!

---

## 🎯 Resumo Rápido

| Etapa | Ação |
|-------|------|
| 1️⃣ | Acessar http://localhost:3000/fluxos/builder |
| 2️⃣ | Arrastar blocos: Mensagem → Menu → Ação/Fim |
| 3️⃣ | Configurar cada bloco (textos, opções, ações) |
| 4️⃣ | Conectar blocos com setas |
| 5️⃣ | Salvar (💾) e Publicar (🚀) |
| 6️⃣ | Testar no WhatsApp |

---

## 📹 Tutorial em Vídeo (Sugestão)

Se preferir, posso criar um fluxo de exemplo pronto para você importar:

1. Baixe: `exemplo-fluxo-suporte-tecnico.json`
2. No builder, clique em **"📥 Importar"**
3. Selecione o arquivo JSON
4. Pronto! Fluxo criado automaticamente

---

**Última atualização:** 28/10/2025
