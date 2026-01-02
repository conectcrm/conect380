# 🚀 Guia Rápido - Importar Fluxo de Atendimento

## 📥 Passo a Passo para Importar

### Método 1: Criar Novo Fluxo (Recomendado)

1. **Abra o Frontend**
   ```bash
   cd frontend-web
   npm start
   ```

2. **Navegue até Fluxos**
   - Clique em **"Gestão"** no menu lateral
   - Clique em **"Fluxos"**

3. **Inicie o Construtor Visual**
   - Clique no botão verde **"+ Construtor Visual"**
   - Ou clique em **"Novo Fluxo"** → depois clique em **"Construtor Visual"**

4. **Cole o JSON**
   - Abra o arquivo `FLUXO_ATENDIMENTO_COMPLETO.json`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   - No construtor, você verá um botão **"Importar JSON"**
   - Cole o conteúdo
   - Clique em **"Converter para Visual"**

5. **Visualize o Fluxo**
   - O sistema automaticamente converterá para blocos visuais
   - Você verá todos os 22 blocos conectados
   - Use a minimap (canto inferior direito) para navegar

6. **Ajuste se Necessário**
   - Clique em cada bloco para ver/editar configurações
   - Arraste blocos para reorganizar
   - Conecte novos blocos se desejar

7. **Salve o Fluxo**
   - Preencha os campos:
     - **Nome**: "Atendimento Completo - Cadastro e Triagem"
     - **Descrição**: "Fluxo automático que verifica cadastro, coleta dados e direciona"
     - **Status**: Ativo ✅
   - Clique em **"Salvar Fluxo"**

---

### Método 2: Importar JSON Direto (Alternativo)

1. **Acesse Gestão → Fluxos**

2. **Clique em "Novo Fluxo"**

3. **Modo JSON**
   - Clique na aba **"JSON"** (ao lado de "Visual")
   - Cole o conteúdo de `FLUXO_ATENDIMENTO_COMPLETO.json`
   - Clique em **"Salvar"**

4. **Converter para Visual** (opcional)
   - Após salvar, clique no botão **"Visual"** no card do fluxo
   - O sistema abrirá o construtor visual
   - Você poderá editar visualmente

---

## 🎨 O Que Você Verá no Construtor Visual

### Layout Esperado

```
[Biblioteca de Blocos]              [Canvas Principal]                    [Configuração]
┌──────────────┐         ┌─────────────────────────────────┐          ┌──────────────┐
│ 🟢 Início    │         │                                 │          │              │
│ 💬 Mensagem  │         │    ┌──────┐                     │          │  Bloco       │
│ 📋 Menu      │         │    │Início│                     │          │  Selecionado │
│ ❓ Pergunta  │         │    └───┬──┘                     │          │              │
│ ↔️ Condição  │         │        │                        │          │  [Campos de  │
│ ⚙️ Ação      │         │        ▼                        │          │   Edição]    │
│ 🔴 Fim       │         │   ┌─────────┐                   │          │              │
└──────────────┘         │   │Verificar│                   │          │  [Salvar]    │
                         │   │Cadastro │                   │          │  [Deletar]   │
  Arraste ou clique      │   └────┬────┘                   │          └──────────────┘
  para adicionar         │        │                        │
                         │     ┌──┴──┐                     │           Clique em um
                         │   SIM    NÃO                    │           bloco para
                         │   ...    ...                    │           configurar
                         │                                 │
                         └─────────────────────────────────┘
                                      ▲
                         [Zoom] [Fit] [Minimap] [Validar]
```

### Cores dos Blocos

- 🟢 **Verde**: Início
- 🔵 **Azul**: Mensagem
- 🟣 **Roxo**: Menu
- 🟡 **Amarelo**: Pergunta
- 🔷 **Teal**: Condição
- 🟠 **Laranja**: Ação
- 🔴 **Vermelho**: Fim

---

## ✅ Checklist de Verificação

Após importar, verifique:

- [ ] **22 blocos** foram criados
- [ ] Todos os blocos estão **conectados** (linhas entre eles)
- [ ] Bloco **"Início"** está no topo
- [ ] Bloco **"Fim"** está no final
- [ ] Não há **blocos órfãos** (desconectados)
- [ ] **Menu** tem 4 opções (Comercial, Suporte, Financeiro, Outros)
- [ ] **Perguntas** têm validações configuradas
- [ ] **Ações** têm parâmetros preenchidos
- [ ] Não há **erros** no painel de validação

---

## 🧪 Teste Rápido

### 1. Validar Fluxo
- Clique no botão **"Validar Fluxo"** (ícone de verificação)
- Deve aparecer: ✅ **"Fluxo válido! Sem erros encontrados."**
- Se houver erros, corrija antes de salvar

### 2. Teste Visual
- Siga o fluxo visualmente:
  - Início → Verifica Cadastro → [SIM/NÃO]
  - Se NÃO: Nome → Sobrenome → Email → Empresa → Salvar
  - Se SIM: Boas-vindas direto
  - Menu → [1/2/3/4] → Transferir → Fim

### 3. Teste Real (Após Salvar)
- Use um número de WhatsApp de teste
- Inicie conversa
- Verifique se mensagens aparecem corretamente
- Teste opções do menu
- Confirme que transferência funciona

---

## 🔧 Personalizações Rápidas

### Mudar Texto de Boas-Vindas
1. Clique no bloco **"Início"** (verde)
2. No painel direito, edite o campo **"Mensagem de Boas-Vindas"**
3. Clique em **"Salvar"**

### Adicionar Opção no Menu
1. Clique no bloco **"Menu de Atendimento"** (roxo)
2. Role até **"Opções"**
3. Clique em **"+ Adicionar Opção"**
4. Preencha:
   - **Número**: 5
   - **Texto**: "🎯 Sua opção aqui"
5. Crie bloco de **Mensagem** para essa opção
6. Crie bloco de **Ação** para transferir
7. Conecte: Menu → Mensagem → Ação → Fim

### Remover Campo "Empresa"
1. Clique no bloco **"Coletar Empresa"** (amarelo)
2. Clique em **"Deletar Bloco"**
3. Conecte **"Coletar Email"** diretamente para **"Confirmar Dados"**
4. Clique no bloco **"Confirmar Dados"**
5. Remova a linha `{{contato.empresa}}` da mensagem

---

## 🚨 Solução de Problemas

### ❌ "Erro ao importar JSON"
**Causa**: JSON mal formatado  
**Solução**: 
- Copie TODO o conteúdo do arquivo (Ctrl+A)
- Certifique-se de não ter caracteres extras
- Tente colar novamente

### ❌ "Blocos desconectados"
**Causa**: Erro na conversão  
**Solução**:
- Clique e arraste da **bolinha direita** de um bloco
- Até a **bolinha esquerda** do bloco seguinte
- Solte para conectar

### ❌ "Núcleo não encontrado"
**Causa**: Nome do núcleo não existe no sistema  
**Solução**:
- Vá em **Gestão → Núcleos**
- Crie os núcleos: "Comercial", "Suporte", "Financeiro", "Atendimento"
- Ou edite o fluxo para usar núcleos existentes

### ❌ "Validação falhou"
**Causa**: Configuração incompleta  
**Solução**:
- Clique no bloco com erro (ícone vermelho)
- Preencha os campos obrigatórios
- Salve e valide novamente

---

## 💡 Dicas Profissionais

### 1. Use Zoom e Minimap
- **Zoom**: Scroll do mouse ou botões +/- no canto
- **Fit**: Botão para ajustar todo o fluxo na tela
- **Minimap**: Navegue rapidamente em fluxos grandes

### 2. Organize Visualmente
- Arraste blocos para alinhar verticalmente
- Mantenha blocos relacionados próximos
- Use espaço para facilitar leitura

### 3. Teste Incrementalmente
- Crie parte do fluxo
- Salve e teste
- Adicione mais blocos
- Teste novamente
- Repita até completar

### 4. Documente Alterações
- Use o campo **"Descrição"** do fluxo
- Anote versões e mudanças
- Exemplo: "v1.1 - Adicionado opção de agendamento"

---

## 📞 Contato e Suporte

Se tiver dúvidas:
1. Consulte **MANUAL_CONSTRUTOR_VISUAL.md** (guia completo)
2. Veja **DOCUMENTACAO_FLUXO_ATENDIMENTO.md** (detalhes do fluxo)
3. Teste em ambiente de desenvolvimento primeiro
4. Após validar, ative em produção

---

**Boa sorte com seu novo fluxo automatizado! 🚀**
