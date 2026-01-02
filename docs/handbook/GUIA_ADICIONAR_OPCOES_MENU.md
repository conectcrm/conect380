# 🎯 GUIA: Como Adicionar Opções ao Menu no Construtor Visual

## ✅ Passos Corretos para Adicionar Opções

### 1️⃣ Abrir o Construtor
- Acesse: `http://localhost:3000/gestao/fluxos/:id/builder`
- Certifique-se que o fluxo está **despublicado** (caso contrário, despublicar primeiro)

### 2️⃣ Selecionar o Bloco de Menu
- Clique no bloco roxo de "Menu" no canvas
- O painel lateral direito "⚙️ Configurar Bloco" deve abrir

### 3️⃣ Adicionar Nova Opção
- No painel lateral, procure a seção **"Opções do Menu"**
- Clique no botão roxo **"+ Adicionar"**
- Você verá uma nova opção aparecer na lista (ex: "Opção 3", "Opção 4", etc.)

### 4️⃣ Configurar a Nova Opção
- Preencha os campos da nova opção:
  - **Número**: O valor que o usuário digita (ex: "3")
  - **Texto**: O texto que aparece no menu (ex: "Financeiro")
  - **Ação**: O que fazer com essa opção
    - `Próximo Passo` - Vai para outro bloco
    - `Transferir para Núcleo` - Transfere para um núcleo
    - `Finalizar` - Encerra o atendimento

### 5️⃣ SALVAR A CONFIGURAÇÃO DO BLOCO (CRÍTICO!)
- **⚠️ ATENÇÃO**: Depois de adicionar/editar as opções, você DEVE clicar no botão:
  - **💾 Salvar** (na parte inferior do painel lateral)
- Esse botão fecha o painel e aplica as mudanças ao bloco
- ✅ Você verá no console: `💾 Salvando configuração do bloco`

### 6️⃣ Conectar a Nova Opção (Opcional)
- Se escolheu "Próximo Passo", você pode conectar a opção a outro bloco:
  - Arraste do círculo roxo lateral do bloco de menu
  - Solte em outro bloco
- A conexão ficará rotulada com o texto da opção

### 7️⃣ Validar o Fluxo
- Verifique se o cabeçalho mostra: **✅ Fluxo válido**
- Se mostrar erros, corrija-os antes de salvar

### 8️⃣ SALVAR O FLUXO COMPLETO
- Clique no botão **💾 Salvar** (no cabeçalho, canto superior direito)
- ✅ Você verá: "Fluxo atualizado com sucesso!"
- 🔍 Logs no console vão mostrar a estrutura sendo salva

### 9️⃣ Verificar Persistência
- Recarregue a página (F5)
- Abra novamente o bloco de menu
- Confirme que as novas opções ainda estão lá

---

## 🐛 Logs de Debug

Ao seguir os passos acima, você verá estes logs no console (F12):

### Ao Adicionar Opção:
```
➕ Nova opção adicionada: { totalOpcoes: 3, novaOpcao: {...} }
```

### Ao Salvar Configuração do Bloco:
```
💾 Salvando configuração do bloco: { nodeId: 'menu_...', opcoes: [...], totalOpcoes: 3 }
```

### Ao Atualizar Node no Canvas:
```
🔄 Atualizando node: { nodeId: 'menu_...', novosDados: {...}, totalOpcoes: 3, opcoes: [...] }
```

### Ao Salvar Fluxo Completo:
```
🔄 Salvando fluxo - estrutura convertida: { etapas: [...] }
📤 Enviando atualização para API: { id: '...', dto: {...} }
```

### Sucesso:
```
✅ Fluxo atualizado com sucesso!
```

---

## ❌ Problemas Comuns

### Problema 1: "Não vejo a nova opção após recarregar"
**Causa**: Você não clicou em "Salvar" no painel lateral (passo 5️⃣)
**Solução**: 
1. Adicionar opção
2. **Clicar no botão "💾 Salvar" do painel lateral** ← CRÍTICO
3. Depois salvar o fluxo completo

### Problema 2: "Fluxo está publicado e não consigo salvar"
**Causa**: Backend bloqueia alterações em fluxos publicados
**Solução**:
1. Ir para `/gestao/fluxos`
2. Clicar em "Despublicar" no card do fluxo
3. Voltar ao construtor e editar
4. Depois de salvar, publicar novamente

### Problema 3: "Erro 400 ao salvar"
**Causa**: Validação do backend ou fluxo publicado
**Solução**: Verificar logs no console (mensagem de erro completa)

### Problema 4: "Validação mostra erro"
**Causa**: Bloco de menu sem opções ou mensagem vazia
**Solução**:
1. Adicionar pelo menos 1 opção ao menu
2. Preencher a mensagem (pergunta)
3. Salvar configuração do bloco
4. A validação deve passar automaticamente

---

## 🔧 Testando Agora

Abra o console do navegador (F12) e siga os passos acima.

Você verá todos os logs indicando se cada etapa funcionou corretamente.

---

## 📞 Suporte

Se após seguir este guia ainda não funcionar, compartilhe:
1. **Screenshot** do painel lateral com as opções
2. **Logs do console** (copiar todos os logs que aparecem)
3. **URL** da página onde está testando

---

**Data**: 24/10/2025  
**Status**: 🔍 Debug habilitado com logs detalhados
