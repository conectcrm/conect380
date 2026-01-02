# 🎨 Guia Passo a Passo - Recriar Fluxo no Editor Visual

## 📋 Objetivo
Adicionar as etapas de coleta de dados e confirmação ao fluxo de triagem.

---

## 🚀 PASSO 1: Abrir Editor Visual

1. Acesse: **http://localhost:3000/admin/bot-builder**
2. Encontre o fluxo: **"Triagem Inteligente WhatsApp (cópia)"**
3. Clique em **"Editar"** (ícone de lápis)

✅ **Resultado**: Editor visual abre com os blocos existentes (13 blocos de menus)

---

## 🧹 PASSO 2: Limpar Blocos Antigos (Opcional)

Se quiser começar do zero, você pode:
- Selecionar todos os blocos (Ctrl+A)
- Deletar (Delete)

**OU** manter os blocos de menu e adicionar os novos antes deles.

---

## ➕ PASSO 3: Adicionar Bloco "Início"

Este bloco já deve existir. Se não:

1. Clique em **"+ Adicionar Bloco"** (ou arraste da paleta)
2. Escolha tipo: **"Início"**
3. Configure:
   - **ID**: `inicio`
   - **Nome**: Início
4. Posicione no canto superior esquerdo

---

## 📝 PASSO 4: Adicionar Bloco "Boas-vindas"

1. **Adicionar bloco** tipo **"Mensagem"**
2. **Configurar**:
   ```
   ID: boas-vindas
   Nome: Boas-vindas
   Tipo: Mensagem
   
   Mensagem:
   👋 Olá! Seja bem-vindo ao ConectCRM!
   
   Para melhor atendê-lo, vou precisar de algumas informações.
   ```
3. **Conectar**: `Início` → `Boas-vindas`

---

## 👤 PASSO 5: Adicionar Bloco "Coleta de Nome"

1. **Adicionar bloco** tipo **"Input"** ou **"Coleta de Dados"**
2. **Configurar**:
   ```
   ID: coleta-nome
   Nome: Coleta de Nome
   Tipo: Input
   
   Mensagem:
   👤 Por favor, informe seu nome completo:
   
   Variável: nome
   
   Validação:
   ☑️ Ativar validação
   Tipo: Nome Completo
   Obrigatório: ✅ Sim
   
   Mensagem de Erro:
   ❌ Por favor, informe seu nome completo (nome e sobrenome).
   ```
3. **Conectar**: `Boas-vindas` → `Coleta de Nome`

---

## 📧 PASSO 6: Adicionar Bloco "Coleta de Email"

1. **Adicionar bloco** tipo **"Input"**
2. **Configurar**:
   ```
   ID: coleta-email
   Nome: Coleta de E-mail
   Tipo: Input
   
   Mensagem:
   📧 Agora, informe seu e-mail:
   
   Variável: email
   
   Validação:
   ☑️ Ativar validação
   Tipo: E-mail
   Obrigatório: ✅ Sim
   
   Mensagem de Erro:
   ❌ E-mail inválido. Por favor, informe um e-mail válido (ex: seu@email.com).
   ```
3. **Conectar**: `Coleta de Nome` → `Coleta de Email`

---

## 🏢 PASSO 7: Adicionar Bloco "Coleta de Empresa"

1. **Adicionar bloco** tipo **"Input"**
2. **Configurar**:
   ```
   ID: coleta-empresa
   Nome: Coleta de Empresa
   Tipo: Input
   
   Mensagem:
   🏢 Por último, qual o nome da sua empresa?
   
   Variável: empresa
   
   Validação:
   ☐ Não obrigatório (pode deixar em branco)
   ```
3. **Conectar**: `Coleta de Email` → `Coleta de Empresa`

---

## ✅ PASSO 8: Adicionar Bloco "Confirmação de Dados" ⭐ NOVO!

**Este é o bloco mais importante - com formatação automática!**

1. **Adicionar bloco** tipo **"Menu"** (não é Input!)
2. **Configurar**:
   ```
   ID: confirmar-dados-cliente
   Nome: Confirmação de Dados
   Tipo: Menu
   
   Mensagem:
   (Pode deixar qualquer texto - será substituído automaticamente)
   Por exemplo: "Confirmando dados..."
   
   Opções:
   (Deixe vazio - não precisa de botões)
   
   ⚠️ IMPORTANTE: Não adicione opções "SIM/NÃO" manualmente!
   O sistema processa texto livre.
   ```

3. **Metadados** (se houver campo avançado):
   ```json
   {
     "formatacaoEspecial": "confirmacao_dados",
     "validacao": "sim_nao"
   }
   ```

4. **Conectar**: `Coleta de Empresa` → `Confirmação de Dados`

---

## 🎯 PASSO 9: Adicionar/Conectar Menu de Núcleos

Se já existir o bloco `menu_nucleos`:
- **Conectar**: `Confirmação de Dados` → `menu_nucleos`

Se NÃO existir, criar:

1. **Adicionar bloco** tipo **"Menu"**
2. **Configurar**:
   ```
   ID: menu_nucleos
   Nome: Menu de Núcleos
   Tipo: Menu
   
   Mensagem:
   Como posso ajudá-lo hoje?
   
   Opções:
   (Deixe vazio - será preenchido automaticamente com núcleos ativos)
   ```
3. **Conectar**: `Confirmação de Dados` → `Menu de Núcleos`

---

## 🔗 PASSO 10: Conectar aos Submenus Existentes

Se você manteve os blocos antigos (`menu_suporte`, `menu_administrativo`, `menu_comercial`):

**Conectar do Menu de Núcleos para cada submenu:**
- `menu_nucleos` → `menu_suporte` (opção 1)
- `menu_nucleos` → `menu_administrativo` (opção 2)
- `menu_nucleos` → `menu_comercial` (opção 3)

**Cada submenu deve ter opções que levam às transferências:**
- Exemplo `menu_suporte`:
  - Opção "Help Desk" → `transferir_helpdesk`
  - Opção "Sistemas" → `transferir_sistemas`
  - Opção "Infraestrutura" → `transferir_infraestrutura`

---

## 💾 PASSO 11: Salvar Automaticamente

✅ **Autosave está ativado!** (3 segundos após última mudança)

Você verá no header:
- 💾 "Salvando..." (durante o save)
- ✅ "Salvo há X min" (após sucesso)

**Não precisa clicar em "Salvar" manualmente!**

---

## 🧪 PASSO 12: Validar Fluxo (Opcional)

Antes de publicar, você pode:
1. Clicar em **"Validar"** ou **"Verificar Loops"**
2. Sistema detecta se há loops infinitos
3. Se houver, clique em **"🔧 Corrigir Automaticamente"**

---

## 🚀 PASSO 13: Publicar Fluxo

1. Clique em **"Publicar"** (canto superior direito)
2. Confirme a publicação
3. Sistema valida e ativa o fluxo automaticamente

✅ **Mensagem esperada**: "Fluxo publicado com sucesso!"

---

## 📊 Visualização Final do Fluxo

```
┌─────────┐
│ Início  │
└────┬────┘
     │
     ▼
┌──────────────┐
│ Boas-vindas  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Coleta Nome  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Coleta Email │
└──────┬───────┘
       │
       ▼
┌───────────────┐
│Coleta Empresa │
└──────┬────────┘
       │
       ▼
┌────────────────────┐
│ ✨ Confirmação    │ ← NOVO! Formatação automática
│ (SIM/NÃO)         │
└──────┬─────────────┘
       │ SIM
       ▼
┌──────────────┐
│ Menu Núcleos │
└──────┬───────┘
       │
   ┌───┼────┬──────────┐
   │   │    │          │
   ▼   ▼    ▼          ▼
┌─────┐┌────┐┌──────┐┌──────┐
│Sup. ││Adm.││Comer.││Outros│
└─────┘└────┘└──────┘└──────┘
```

---

## ✅ Checklist Final

Antes de fechar o editor, verifique:

- [ ] Todos os blocos estão conectados (sem blocos soltos)
- [ ] Fluxo começa em "Início" e vai até as transferências
- [ ] Bloco `confirmar-dados-cliente` existe
- [ ] Bloco `confirmar-dados-cliente` está conectado DEPOIS de `coleta-empresa`
- [ ] Bloco `confirmar-dados-cliente` está conectado ANTES de `menu_nucleos`
- [ ] Autosave salvou (veja "✅ Salvo há X")
- [ ] Publicação feita com sucesso

---

## 🧪 PASSO 14: Testar no WhatsApp

Após publicar, teste enviando mensagem:

1. **Enviar**: "Oi" para o número WhatsApp configurado
2. **Esperar**: Mensagem de boas-vindas
3. **Preencher**:
   - Nome: João Silva
   - Email: joao@empresa.com
   - Empresa: Empresa X
4. **Verificar**: Tela de confirmação formatada ✨

**Mensagem esperada:**
```
✅ *Dados Cadastrados*

👤 **Nome:** João Silva
📧 **E-mail:** joao@empresa.com
🏢 **Empresa:** Empresa X

Os dados estão corretos?

Digite *SIM* para confirmar ou *NÃO* para corrigir.
```

5. **Confirmar**: Digite "SIM"
6. **Ver**: Menu de núcleos aparecer

---

## 🐛 Problemas Comuns

### Problema 1: Bloco de confirmação não formata

**Causa**: ID do bloco está errado  
**Solução**: Certifique-se que o ID é **exatamente** `confirmar-dados-cliente`

### Problema 2: Validação de email não funciona

**Causa**: Tipo de validação incorreto  
**Solução**: Selecione "E-mail" no dropdown de tipo de validação

### Problema 3: Fluxo não publica

**Causa**: Loops detectados  
**Solução**: Clique em "🔧 Corrigir Automaticamente"

### Problema 4: Autosave não funciona

**Causa**: Navegador bloqueou  
**Solução**: Salve manualmente (botão "Salvar")

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas durante o processo:
1. Tire print do editor
2. Descreva o problema
3. Eu te ajudo a resolver! 😊

---

**Tempo estimado**: 10-15 minutos  
**Dificuldade**: ⭐⭐☆☆☆ Fácil

Boa sorte! 🚀
