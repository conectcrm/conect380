# 🎨 Construtor Visual de Fluxos - Manual do Usuário

## 📋 Visão Geral

O **Construtor Visual de Fluxos** é uma ferramenta que permite a gestores criarem fluxos de atendimento bot **sem precisar escrever código**. A interface usa **drag & drop** (arrastar e soltar) para conectar blocos que representam as etapas do atendimento.

---

## 🚀 Como Acessar

1. Acesse **Gestão** → **Fluxos de Triagem**
2. Clique no botão **"🔷 Construtor Visual"** (roxo) no canto superior direito
3. Ou clique em **"Visual"** em qualquer fluxo existente para editá-lo

---

## 🧩 Tipos de Blocos

### 1️⃣ Início (Verde)
- **O que faz**: Ponto de partida de todo fluxo
- **Como usar**: Conecte ao primeiro bloco do seu fluxo
- **Não configurável**: Este bloco não precisa de configuração

### 2️⃣ Mensagem (Azul)
- **O que faz**: Envia uma mensagem simples para o cliente
- **Configurar**:
  - Nome do bloco
  - Texto da mensagem
- **Exemplo**: "Bem-vindo ao nosso atendimento!"

### 3️⃣ Menu (Roxo)
- **O que faz**: Apresenta opções para o cliente escolher
- **Configurar**:
  - Nome do bloco
  - Mensagem de pergunta
  - Lista de opções (número + texto)
  - Ação de cada opção:
    - **Próximo Passo**: Vai para outro bloco
    - **Transferir para Núcleo**: Direciona para equipe específica
    - **Finalizar**: Encerra atendimento
- **Exemplo**:
  ```
  Pergunta: "Como podemos ajudar?"
  1. Suporte Técnico → Transferir para Núcleo "Suporte"
  2. Vendas → Transferir para Núcleo "Comercial"
  3. Financeiro → Transferir para Núcleo "Financeiro"
  ```

### 4️⃣ Pergunta (Amarelo)
- **O que faz**: Faz uma pergunta e aguarda resposta do cliente
- **Configurar**:
  - Nome do bloco
  - Pergunta
- **Exemplo**: "Qual seu nome?"
- **Dica**: A resposta será salva para uso posterior

### 5️⃣ Condição (Teal/Verde-água)
- **O que faz**: Cria ramificação (if/else) baseada em condição
- **Configurar**:
  - Campo a verificar
  - Operador (igual, diferente, contém, etc.)
  - Valor
- **Saídas**:
  - **Sim** (verde, direita): Condição verdadeira
  - **Não** (vermelha, esquerda): Condição falsa
- **Exemplo**: "Se clienteCadastrado = Sim → ir para Boas-vindas | Senão → ir para Cadastro"

### 6️⃣ Ação (Laranja)
- **O que faz**: Executa uma ação específica
- **Tipos de Ação**:
  - **Transferir para Núcleo**: Direciona para equipe
  - **Criar Ticket**: Abre ticket no sistema
  - **Finalizar Atendimento**: Encerra conversa
- **Configurar**:
  - Tipo de ação
  - Núcleo (se transferir)
  - Mensagem final (opcional)

### 7️⃣ Fim (Vermelho)
- **O que faz**: Marca o final do fluxo
- **Como usar**: Conecte blocos que encerram o atendimento a este
- **Não configurável**

---

## 🎯 Como Criar um Fluxo

### Passo 1: Adicionar Blocos

**Método 1 - Arrastar**:
1. Clique e segure um bloco na biblioteca (esquerda)
2. Arraste para o canvas (meio)
3. Solte onde deseja posicionar

**Método 2 - Clicar**:
1. Clique uma vez no bloco na biblioteca
2. Ele será adicionado automaticamente ao canvas

### Passo 2: Conectar Blocos

1. Clique no **círculo** (handle) de saída de um bloco
2. Arraste até o **círculo** de entrada de outro bloco
3. Solte para criar a conexão
4. A linha aparecerá conectando os blocos

**Dicas de Conexão**:
- **Mensagens/Perguntas**: 1 saída (embaixo)
- **Menus**: Múltiplas saídas (direita, uma por opção)
- **Condições**: 2 saídas (esquerda = Não, direita = Sim)

### Passo 3: Configurar Blocos

1. Clique em um bloco no canvas
2. Painel de configuração abre à direita
3. Preencha os campos:
   - **Nome do Bloco**: Identificação visual (ex: "Menu Principal")
   - **Mensagem**: Texto que será enviado
   - **Opções** (se menu): Lista de escolhas
4. Clique em **"💾 Salvar"**

### Passo 4: Validar Fluxo

Antes de salvar, o sistema verifica automaticamente:
- ✅ **Bloco Início** conectado
- ✅ **Sem blocos órfãos** (desconectados)
- ✅ **Mensagens preenchidas**
- ✅ **Menus com opções**
- ✅ **Sem loops infinitos**

**Indicadores**:
- ✅ Verde: "Fluxo válido"
- ❌ Vermelho: "X erros" (corrigir antes de salvar)

### Passo 5: Salvar

1. Revise todo o fluxo
2. Certifique-se que está válido (✅ verde)
3. Clique em **"💾 Salvar"**
4. Fluxo é salvo e pode ser publicado

---

## 📘 Exemplo Prático: Atendimento Simples

**Objetivo**: Cliente escolhe entre Suporte, Vendas ou Financeiro

### Estrutura:

```
[Início]
   ↓
[Mensagem] "Olá! Bem-vindo à nossa empresa."
   ↓
[Menu] "Como podemos ajudar?"
   ├─ 1. Suporte → [Ação] Transferir para Núcleo "Suporte" → [Fim]
   ├─ 2. Vendas → [Ação] Transferir para Núcleo "Comercial" → [Fim]
   └─ 3. Financeiro → [Ação] Transferir para Núcleo "Financeiro" → [Fim]
```

### Passo a Passo:

1. **Adicionar Blocos**:
   - Mensagem (arrastar da biblioteca)
   - Menu (arrastar da biblioteca)
   - 3x Ação (arrastar 3 vezes)
   - 3x Fim (arrastar 3 vezes)

2. **Conectar**:
   - Início → Mensagem
   - Mensagem → Menu
   - Menu opção 1 → Ação 1 → Fim 1
   - Menu opção 2 → Ação 2 → Fim 2
   - Menu opção 3 → Ação 3 → Fim 3

3. **Configurar Mensagem**:
   - Nome: "Boas-vindas"
   - Mensagem: "Olá! Bem-vindo à nossa empresa."

4. **Configurar Menu**:
   - Nome: "Menu Principal"
   - Mensagem: "Como podemos ajudar?"
   - Opções:
     - Opção 1: valor "1", texto "Suporte"
     - Opção 2: valor "2", texto "Vendas"
     - Opção 3: valor "3", texto "Financeiro"

5. **Configurar Ações**:
   - Ação 1: Transferir para Núcleo "Suporte"
   - Ação 2: Transferir para Núcleo "Comercial"
   - Ação 3: Transferir para Núcleo "Financeiro"

6. **Salvar**!

---

## ⚙️ Recursos Avançados

### 🔍 Mini-Mapa
- Canto inferior direito
- Mostra visão geral do fluxo
- Útil para fluxos grandes
- Clique para navegar

### 🎛️ Controles
- **+** / **-**: Zoom in/out
- **⚙️**: Ajustar na tela (fit view)
- **🔒**: Travar posição dos blocos

### 📱 Responsividade
- Zoom com scroll do mouse
- Arrastar canvas com clique direito
- Touch em dispositivos móveis

---

## 🚨 Erros Comuns

### ❌ "Bloco desconectado"
- **Problema**: Bloco sem conexão
- **Solução**: Conecte-o ou delete

### ❌ "Menu sem opções"
- **Problema**: Menu criado mas sem opções adicionadas
- **Solução**: Clique no menu → Configurar → Adicionar opções

### ❌ "Início não conectado"
- **Problema**: Bloco Início sem saída
- **Solução**: Conecte Início ao primeiro bloco

### ❌ "Loop infinito"
- **Problema**: Fluxo volta para si mesmo indefinidamente
- **Solução**: Revise conexões, certifique-se que há um Fim

---

## 💡 Dicas Pro

1. **Nomeie blocos claramente**: "Menu Inicial", "Transferir Suporte", etc.
2. **Use cores como guia**: Roxo = decisões, Laranja = ações
3. **Teste antes de publicar**: Use botão "▶️ Testar" (em breve)
4. **Salve frequentemente**: Ctrl+S ou botão "💾 Salvar"
5. **Duplique fluxos**: Use base de fluxo existente (botão "Duplicar")
6. **Organize visualmente**: Alinhe blocos verticalmente para fácil leitura

---

## 🆘 Suporte

**Dúvidas?**
- Documentação completa: `/docs/bot-builder`
- Vídeo tutorial: `/videos/bot-builder-tutorial`
- Suporte técnico: suporte@conectcrm.com

---

## 🎓 Próximos Passos

Após criar seu fluxo:
1. ✅ Salvar
2. 🚀 Publicar (lista de fluxos)
3. 📊 Acompanhar estatísticas
4. 🔧 Ajustar baseado em métricas

**Bom trabalho! 🚀**
