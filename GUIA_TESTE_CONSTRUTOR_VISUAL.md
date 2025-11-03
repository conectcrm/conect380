# 🧪 GUIA DE TESTE - Construtor Visual de Fluxos

## 🚀 Como Testar

### 1️⃣ Iniciar o Frontend

```powershell
cd frontend-web
npm start
```

Aguarde o browser abrir em `http://localhost:3000`

---

### 2️⃣ Fazer Login

- Email: (seu usuário de teste)
- Senha: (sua senha)

---

### 3️⃣ Acessar o Construtor Visual

**Opção A - Criar Novo Fluxo**:
1. Menu lateral → **Gestão**
2. Clique em **Fluxos de Triagem**
3. Clique no botão **"🔷 Construtor Visual"** (roxo, canto superior direito)

**Opção B - Editar Fluxo Existente**:
1. Menu lateral → **Gestão** → **Fluxos de Triagem**
2. Em qualquer card de fluxo, clique em **"Visual"** (botão roxo)

---

## ✅ Cenários de Teste

### Teste 1: Criar Fluxo Simples

**Objetivo**: Criar fluxo "Atendimento Básico" com menu de 2 opções

**Passos**:
1. ✅ Acesse o construtor (Novo Fluxo)
2. ✅ Arraste bloco **"Mensagem"** para o canvas
3. ✅ Conecte **Início** → **Mensagem** (clique no círculo de saída do Início, arraste até entrada da Mensagem)
4. ✅ Clique na **Mensagem** para configurar:
   - Nome: "Boas-vindas"
   - Mensagem: "Olá! Bem-vindo ao atendimento."
   - Clique **"💾 Salvar"**
5. ✅ Arraste bloco **"Menu"** para o canvas
6. ✅ Conecte **Mensagem** → **Menu**
7. ✅ Clique no **Menu** para configurar:
   - Nome: "Menu Principal"
   - Mensagem: "Como podemos ajudar?"
   - Clique **"+ Adicionar"** (2 vezes)
   - Opção 1: número "1", texto "Suporte", ação "Próximo Passo"
   - Opção 2: número "2", texto "Vendas", ação "Próximo Passo"
   - Clique **"💾 Salvar"**
8. ✅ Arraste 2 blocos **"Fim"** para o canvas
9. ✅ Conecte **Menu** → **Fim 1** e **Menu** → **Fim 2** (use os handles na direita do menu)
10. ✅ Verifique indicador **✅ "Fluxo válido"** no header
11. ✅ Clique em **"💾 Salvar"**
12. ✅ Confirme salvamento bem-sucedido

**Resultado esperado**: Fluxo salvo sem erros, redirecionado para lista de fluxos

---

### Teste 2: Editar Fluxo Existente

**Objetivo**: Carregar fluxo JSON e editar visualmente

**Passos**:
1. ✅ Na lista de fluxos, clique em **"Visual"** em um fluxo existente
2. ✅ Aguarde carregamento (JSON → Visual automático)
3. ✅ Verifique se todos os blocos aparecem no canvas
4. ✅ Verifique se conexões estão corretas
5. ✅ Clique em um bloco para ver configuração
6. ✅ Modifique mensagem de um bloco
7. ✅ Clique **"💾 Salvar"** no painel de configuração
8. ✅ Clique **"💾 Salvar"** no header principal
9. ✅ Confirme atualização bem-sucedida

**Resultado esperado**: Fluxo atualizado sem perder dados

---

### Teste 3: Validação de Erros

**Objetivo**: Verificar se validação funciona

**Passos**:
1. ✅ Acesse construtor (Novo Fluxo)
2. ✅ Arraste bloco **"Menu"** para canvas
3. ✅ **NÃO conecte** ao Início (deixar órfão)
4. ✅ Verifique indicador **❌ "X erros"** no header
5. ✅ Leia mensagem de erro: "Bloco desconectado"
6. ✅ Conecte **Início** → **Menu**
7. ✅ Tente salvar **SEM configurar o menu**
8. ✅ Verifique erro: "Menu sem opções"
9. ✅ Configure menu (adicionar opções)
10. ✅ Verifique se erro desaparece: **✅ "Fluxo válido"**

**Resultado esperado**: Validação bloqueia salvamento até corrigir erros

---

### Teste 4: Transferir para Núcleo

**Objetivo**: Configurar transferência para equipe

**Passos**:
1. ✅ Crie fluxo com Menu
2. ✅ Configure opção do menu:
   - Texto: "Falar com Suporte"
   - Ação: **"Transferir para Núcleo"**
   - Núcleo: Selecione um núcleo da lista
3. ✅ Arraste bloco **"Ação"** para canvas
4. ✅ Conecte opção do menu → Ação
5. ✅ Configure Ação:
   - Tipo: **"Transferir para Núcleo"**
   - Núcleo: Selecione o mesmo núcleo
6. ✅ Conecte Ação → Fim
7. ✅ Salve fluxo
8. ✅ Publique fluxo (voltar para lista)
9. ✅ Teste no WhatsApp (se possível)

**Resultado esperado**: Transferência configurada corretamente

---

### Teste 5: Drag & Drop

**Objetivo**: Testar interface drag & drop

**Passos**:
1. ✅ **Método 1 - Arrastar**:
   - Clique e segure bloco "Mensagem"
   - Arraste para canvas
   - Solte
   - Verifique se bloco aparece
2. ✅ **Método 2 - Clicar**:
   - Clique uma vez em bloco "Menu"
   - Verifique se aparece automaticamente no canvas
3. ✅ **Conectar blocos**:
   - Clique no círculo de saída (embaixo) de Início
   - Arraste até círculo de entrada (topo) de Mensagem
   - Solte
   - Verifique linha de conexão aparece
4. ✅ **Mover blocos**:
   - Clique e arraste bloco pelo centro
   - Mova para outra posição
   - Solte
5. ✅ **Deletar bloco**:
   - Clique em bloco
   - No painel direito, clique **"🗑️"**
   - Confirme que bloco sumiu

**Resultado esperado**: Todas as interações funcionam suavemente

---

### Teste 6: Recursos Visuais

**Objetivo**: Testar recursos de visualização

**Passos**:
1. ✅ **Zoom**:
   - Use scroll do mouse para zoom in/out
   - Ou clique em **"+"** / **"-"** nos controles (canto esquerdo)
2. ✅ **Panning** (mover canvas):
   - Clique com botão direito do mouse
   - Arraste canvas
   - Ou use scroll bars
3. ✅ **Fit View** (ajustar na tela):
   - Clique no botão **"⚙️"** nos controles
   - Verifique se todos os blocos ficam visíveis
4. ✅ **Mini-mapa**:
   - Olhe canto inferior direito
   - Verifique preview do fluxo
   - Clique em área do mini-mapa para navegar
5. ✅ **Background**:
   - Verifique pontos de grade no fundo
   - Ajuda a alinhar blocos

**Resultado esperado**: Todos os controles funcionam

---

## 🐛 Problemas Conhecidos e Como Reportar

### ❌ Bloco não aparece após arrastar
**Solução**: Recarregue página (F5) e tente novamente

### ❌ Conexão não se cria
**Solução**: Certifique-se de clicar exatamente no círculo (handle) e arrastar até outro círculo

### ❌ Configuração não salva
**Solução**: Clique em **"💾 Salvar"** no painel de configuração (direita) ANTES de salvar o fluxo principal

### ❌ Erro ao salvar
**Solução**: Verifique se backend está rodando na porta 3001

### ❌ Lista de núcleos vazia
**Solução**: Cadastre ao menos um núcleo em **Gestão → Núcleos**

---

## 📊 Checklist Final de Testes

Antes de aprovar para produção, confirme:

- [ ] ✅ Criar fluxo do zero funciona
- [ ] ✅ Editar fluxo existente funciona
- [ ] ✅ Validação detecta erros
- [ ] ✅ Salvamento persiste dados
- [ ] ✅ Conversão JSON ↔ Visual preserva tudo
- [ ] ✅ Drag & drop funciona suavemente
- [ ] ✅ Configuração de blocos funciona
- [ ] ✅ Transferência para núcleo funciona
- [ ] ✅ Responsividade ok (teste em mobile se possível)
- [ ] ✅ Sem erros no console (F12)
- [ ] ✅ Performance ok (não trava com muitos blocos)

---

## 🚀 Feedback

Após testar, forneça feedback sobre:

1. **UX**: A interface é intuitiva?
2. **Performance**: O canvas responde rapidamente?
3. **Bugs**: Encontrou algum erro?
4. **Melhorias**: O que poderia ser melhor?
5. **Documentação**: Este guia foi claro?

---

**Bons testes! 🎉**
