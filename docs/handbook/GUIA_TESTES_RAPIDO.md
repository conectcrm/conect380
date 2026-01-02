# 🎯 Guia Rápido de Testes Manuais - Interface Web

**Você está em**: http://localhost:3000/gestao/departamentos

---

## ✅ **Status Atual**
- ✅ Backend rodando (porta 3001)
- ✅ Frontend rodando (porta 3000)
- ✅ Warning do react-beautiful-dnd **CORRIGIDO** (migrado para @hello-pangea/dnd)
- ✅ Console limpo, sem erros

---

## 🧪 **Testes Visuais Rápidos** (10 minutos)

### **1️⃣ Teste Criar Departamento (1 min)**

1. Clique no botão **"Novo Departamento"** (roxo, canto superior direito)
2. Preencha:
   - **Nome**: `Teste Drag`
   - **Descrição**: `Para testar drag and drop`
   - **Núcleo**: Deixe em branco
   - **Status**: ✓ Ativo
3. Clique **"Salvar"**

**✅ Resultado Esperado**:
- Modal fecha
- Toast verde de sucesso
- Novo card aparece no grid
- Badge "Sem Núcleo" visível

---

### **2️⃣ Teste Drag-and-Drop (2 min)**

**Pré-requisito**: Ter pelo menos 2 departamentos criados

1. Localize o ícone **`⋮⋮`** no canto superior esquerdo do card
2. **Clique e segure** nesse ícone
3. **Arraste** o card para outra posição
4. **Solte** o mouse

**✅ Resultado Esperado**:
- Card "levanta" com sombra roxa durante o arrasto
- Posição muda instantaneamente ao soltar
- Toast verde "Departamentos reordenados com sucesso"
- **Faça F5** → Ordem deve ser **mantida** após refresh

---

### **3️⃣ Teste Vincular a Núcleo (3 min)**

1. No menu lateral: **Gestão → Núcleos**
2. Clique no ícone **▼** para expandir um núcleo
3. Clique no botão **"Vincular Departamentos"**
4. No modal que abre:
   - Use o campo de busca para filtrar (opcional)
   - **Marque o checkbox** de 2 departamentos
5. Clique **"Salvar"**

**✅ Resultado Esperado**:
- Modal fecha
- 2 departamentos aparecem listados no núcleo expandido
- Cada card mostra:
  - Nome do departamento
  - Badge com nome do núcleo (cor roxa)
  - Contador de agentes

---

### **4️⃣ Teste Desvincular Departamento (1 min)**

1. Ainda no núcleo expandido, clique **"Vincular Departamentos"** novamente
2. **Desmarque** um departamento que estava selecionado
3. Clique **"Salvar"**

**✅ Resultado Esperado**:
- Departamento removido da lista do núcleo
- Toast de sucesso

---

### **5️⃣ Teste Editar Departamento (1 min)**

1. Volte para **Gestão → Departamentos**
2. Em um card, clique no ícone **✏️ (editar)**
3. Altere o nome para: `Departamento EDITADO`
4. Clique **"Salvar"**

**✅ Resultado Esperado**:
- Nome atualizado no card
- Toast de sucesso

---

### **6️⃣ Teste Alterar Status (30 seg)**

1. Em um departamento **Ativo** (badge verde)
2. Clique no **toggle/switch** de status

**✅ Resultado Esperado**:
- Badge muda: Verde "Ativo" → Vermelho "Inativo"
- Card fica com opacidade reduzida (60%)
- Toast de sucesso

---

### **7️⃣ Teste Filtros (1 min)**

1. **Filtro por Núcleo**:
   - Dropdown "Filtrar por Núcleo" → Selecione um núcleo
   - **Resultado**: Apenas departamentos daquele núcleo aparecem

2. **Filtro por Status**:
   - Dropdown "Status" → Selecione "Inativos"
   - **Resultado**: Apenas departamentos inativos aparecem

3. **Busca por Nome**:
   - Digite no campo de busca
   - **Resultado**: Filtragem em tempo real (case-insensitive)

---

## 🎨 **Teste de Responsividade** (2 min)

1. Abra **DevTools** (F12)
2. Clique no ícone de **Toggle Device Toolbar** (Ctrl+Shift+M)
3. Teste nos 3 tamanhos:

| Tamanho | Largura | Grid Esperado |
|---------|---------|---------------|
| **Mobile** | 375px | 1 coluna |
| **Tablet** | 768px | 2 colunas |
| **Desktop** | 1920px | 3 colunas |

---

## 🐛 **O Que Verificar**

Durante todos os testes, mantenha o **Console aberto** (F12) e verifique:

### ✅ **Positivo** (Tudo OK):
- ✅ Sem erros vermelhos no console
- ✅ Network tab: Status 200/201 nas requisições
- ✅ Toast de sucesso aparece
- ✅ Animações suaves
- ✅ Dados persistem após F5

### ❌ **Negativo** (Reportar):
- ❌ Erros vermelhos no console
- ❌ Network tab: Status 400/500
- ❌ Toast de erro
- ❌ Tela travada/branca
- ❌ Dados não persistem após F5

---

## 📊 **Checklist Rápido**

Após concluir os testes, marque:

- [ ] Criar departamento funciona
- [ ] Drag-and-drop funciona e persiste
- [ ] Vincular departamento a núcleo funciona
- [ ] Desvincular departamento funciona
- [ ] Editar departamento funciona
- [ ] Alterar status funciona
- [ ] Filtros funcionam (núcleo, status, busca)
- [ ] Responsividade funciona (mobile, tablet, desktop)
- [ ] Console sem erros
- [ ] Dados persistem após F5

---

## 🚨 **Se Encontrar Bugs**

**Reporte assim**:

```
❌ BUG: [Descrição curta]

Passos para reproduzir:
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

Resultado esperado: [O que deveria acontecer]
Resultado obtido: [O que aconteceu]

Console: [Copiar mensagem de erro do console]
Network: [Status HTTP, ex: 400 Bad Request]

Screenshot: [Se possível, anexar print da tela]
```

---

## ✅ **Todos os Testes Passaram?**

**Parabéns! 🎉** O sistema de Núcleos e Departamentos está **100% funcional**!

**Próximos passos**:
1. ✅ Validação completa (você acabou de fazer)
2. 🚀 Integrar com Bot/Triagem (testar fluxo end-to-end)
3. 📊 Adicionar Analytics (dashboards, métricas)
4. 🎨 Melhorias de UX (animações, feedback visual)

---

**Última atualização**: 28 de outubro de 2025  
**Tempo estimado**: ~10 minutos para todos os testes
