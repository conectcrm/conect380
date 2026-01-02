# 🧪 Guia de Testes - Templates de Mensagens

**Data**: 7 de novembro de 2025  
**Feature**: Templates de Mensagens com Variáveis Dinâmicas  
**Ambiente**: Desenvolvimento Local  

---

## 🎯 Objetivo dos Testes

Validar que o sistema de templates de mensagens funciona completamente:
- ✅ CRUD de templates (backend + frontend)
- ✅ Integração com chat (botão + dropdown + autocomplete)
- ✅ Substituição de variáveis dinâmicas
- ✅ Atalhos de teclado (`/comando`)

---

## 📋 Pré-requisitos

### 1. Backend Rodando
```powershell
cd backend
npm run start:dev
```
**Esperado**: Backend iniciado na porta 3001

### 2. Frontend Rodando
```powershell
cd frontend-web
npm start
```
**Esperado**: Frontend iniciado na porta 3000

### 3. Login no Sistema
- Acesse: http://localhost:3000
- Faça login com usuário válido
- **Empresaid**: Será usado para filtrar templates

---

## ✅ Teste 1: Acessar Página de Templates

### Passos:
1. No menu lateral, clique em **"Atendimento"**
2. Procure o item **"Templates de Mensagens"** (ícone FileText roxo)
3. Clique no menu item

### Resultado Esperado:
- ✅ Página carrega em `/nuclei/atendimento/templates`
- ✅ Header mostra "Templates de Mensagens" com ícone
- ✅ Botão "Novo Template" visível (roxo)
- ✅ Botão "Atualizar" visível
- ✅ Barra de busca presente
- ✅ Filtro de categoria presente
- ✅ Se não houver templates, mostra estado vazio com call-to-action

### Screenshot:
```
┌─────────────────────────────────────────────────┐
│ ← Atendimento                                   │
├─────────────────────────────────────────────────┤
│ 📄 Templates de Mensagens                       │
│ Gerencie mensagens rápidas para atendimento     │
│                                      [🔄] [+ Novo]│
├─────────────────────────────────────────────────┤
│ Buscar: [_______________]  Categoria: [Todas ▼] │
├─────────────────────────────────────────────────┤
│                                                 │
│         📄 Nenhum template cadastrado           │
│    Crie seu primeiro template de mensagem...   │
│              [+ Criar Primeiro Template]        │
└─────────────────────────────────────────────────┘
```

---

## ✅ Teste 2: Criar Template Simples

### Passos:
1. Clique em **"Novo Template"**
2. Preencha o formulário:
   - **Nome do Template**: `Boas-vindas`
   - **Atalho**: `oi`
   - **Categoria**: `Atendimento`
   - **Conteúdo**: 
     ```
     Olá! Bem-vindo ao ConectCRM. 
     Como posso ajudá-lo hoje?
     ```
3. Clique em **"Criar Template"**

### Resultado Esperado:
- ✅ Modal fecha
- ✅ Template aparece na lista
- ✅ Card mostra:
  - Nome: "Boas-vindas"
  - Categoria: "Atendimento" (badge roxo)
  - Atalho: `/oi` (código em cinza)
  - Status: "Ativo" (badge verde)
  - Preview do conteúdo (3 linhas max)
- ✅ Botões: Ver, Copiar, Editar, Deletar

### Validação Backend:
```powershell
# Verificar no banco de dados
curl http://localhost:3001/atendimento/templates?empresaId=empresa-default
```

**Esperado**: JSON com template criado

---

## ✅ Teste 3: Criar Template com Variáveis

### Passos:
1. Clique em **"Novo Template"**
2. Preencha:
   - **Nome**: `Confirmação de Atendimento`
   - **Atalho**: `confirm`
   - **Categoria**: `Suporte`
   - **Conteúdo**:
     ```
     Olá {{nome}},
     
     Recebi seu ticket #{{ticket}} às {{hora}}.
     Estou analisando sua solicitação e retorno em breve.
     
     Atenciosamente,
     {{atendente}}
     ```
3. **IMPORTANTE**: Clique nos botões de variáveis disponíveis:
   - Clique em `{{nome}}`
   - Clique em `{{ticket}}`
   - Clique em `{{hora}}`
   - Clique em `{{atendente}}`

### Resultado Esperado:
- ✅ Variáveis inseridas no conteúdo ao clicar nos botões
- ✅ Preview mostra as variáveis em código: `{{nome}}`, `{{ticket}}`, etc.
- ✅ Ao salvar, backend extrai automaticamente as variáveis
- ✅ Card mostra seção "Variáveis:" com badges: `{{nome}}`, `{{ticket}}`, `{{hora}}`, `{{atendente}}`

### Validação:
```powershell
# Verificar extração automática de variáveis
curl http://localhost:3001/atendimento/templates?empresaId=empresa-default
```

**Esperado**: 
```json
{
  "nome": "Confirmação de Atendimento",
  "variaveis": ["{{nome}}", "{{ticket}}", "{{hora}}", "{{atendente}}"]
}
```

---

## ✅ Teste 4: Preview de Template

### Passos:
1. Localize o card do template "Confirmação de Atendimento"
2. Clique no botão **"Ver"** (ícone Eye)

### Resultado Esperado:
- ✅ Modal de preview abre
- ✅ Título: "Preview do Template"
- ✅ Nome do template aparece
- ✅ Badge de categoria aparece
- ✅ Conteúdo completo exibido (sem line-clamp)
- ✅ Seção "Variáveis utilizadas:" mostra todas as variáveis
- ✅ Info box azul: "Atalho: Digite `/confirm` no chat"
- ✅ Botões: "Fechar" e "Copiar Conteúdo"

### Screenshot:
```
┌─────────────────────────────────────────────────┐
│ Preview do Template                          [X]│
├─────────────────────────────────────────────────┤
│ Confirmação de Atendimento                      │
│ [Suporte]                                       │
│                                                 │
│ ╔═══════════════════════════════════════════╗   │
│ ║ Olá {{nome}},                             ║   │
│ ║                                           ║   │
│ ║ Recebi seu ticket #{{ticket}} às {{hora}}.║   │
│ ║ Estou analisando...                       ║   │
│ ╚═══════════════════════════════════════════╝   │
│                                                 │
│ Variáveis utilizadas:                           │
│ [{{nome}}] [{{ticket}}] [{{hora}}] [{{atendente}}]│
│                                                 │
│ ℹ️ Atalho: Digite /confirm no chat              │
│                                                 │
│                          [Fechar] [📋 Copiar]   │
└─────────────────────────────────────────────────┘
```

---

## ✅ Teste 5: Copiar Conteúdo

### Passos:
1. No card do template "Boas-vindas"
2. Clique no botão **"Copiar"** (ícone Copy)

### Resultado Esperado:
- ✅ Conteúdo copiado para clipboard
- ✅ (Opcional) Toast/notificação: "Conteúdo copiado!"

### Validação:
- Cole (Ctrl+V) em um editor de texto
- **Esperado**: Conteúdo completo do template

---

## ✅ Teste 6: Buscar Templates

### Passos:
1. Na barra de busca, digite: `confirm`
2. Observe os resultados

### Resultado Esperado:
- ✅ Mostra apenas "Confirmação de Atendimento"
- ✅ Esconde "Boas-vindas"
- ✅ Busca funciona em: nome, conteúdo, atalho

### Teste 2: Buscar por atalho
1. Limpe a busca
2. Digite: `oi`
3. **Esperado**: Mostra "Boas-vindas" (que tem atalho `/oi`)

---

## ✅ Teste 7: Filtrar por Categoria

### Passos:
1. No dropdown "Categoria", selecione **"Atendimento"**

### Resultado Esperado:
- ✅ Mostra apenas template "Boas-vindas"
- ✅ Esconde "Confirmação de Atendimento" (categoria "Suporte")

### Teste 2: Todas as categorias
1. Selecione **"Todas as categorias"**
2. **Esperado**: Mostra ambos os templates novamente

---

## ✅ Teste 8: Editar Template

### Passos:
1. No card "Boas-vindas", clique no botão **Editar** (ícone Edit2)
2. Modifique o conteúdo:
   ```
   Olá {{nome}}! Bem-vindo ao ConectCRM. 
   Como posso ajudá-lo hoje?
   Estou à disposição!
   ```
3. Clique em **"Salvar Alterações"**

### Resultado Esperado:
- ✅ Modal fecha
- ✅ Card atualiza com novo conteúdo
- ✅ Seção "Variáveis:" agora mostra `{{nome}}`
- ✅ Backend atualizou e re-extraiu variáveis automaticamente

### Validação:
```powershell
curl http://localhost:3001/atendimento/templates?empresaId=empresa-default
```

**Esperado**: Template "Boas-vindas" com variável `{{nome}}` extraída

---

## ✅ Teste 9: Listar Variáveis Disponíveis

### Passos:
1. Clique em **"Novo Template"**
2. Observe a seção **"Variáveis Disponíveis"**

### Resultado Esperado:
- ✅ Mostra 14 botões de variáveis:
  - `{{nome}}`, `{{email}}`, `{{telefone}}`
  - `{{ticket}}`, `{{atendente}}`, `{{empresa}}`
  - `{{data}}`, `{{hora}}`, `{{protocolo}}`
  - `{{assunto}}`, `{{prioridade}}`, `{{status}}`
  - `{{fila}}`, `{{departamento}}`
- ✅ Botões têm hover effect
- ✅ Clicar insere variável no textarea

### Teste:
1. Clique em `{{nome}}`
2. Clique em `{{ticket}}`
3. **Esperado**: Conteúdo = ` {{nome}} {{ticket}}`

---

## ✅ Teste 10: Integração com Chat - Botão Template

### Passos:
1. Navegue para o **Chat Omnichannel** (Atendimento > Chat)
2. Selecione um ticket ativo
3. Observe a barra de ferramentas abaixo do input de mensagem

### Resultado Esperado:
- ✅ Botão de template visível (ícone FileText roxo)
- ✅ Posição: **ANTES** do botão de anexo (Paperclip)
- ✅ Hover mostra tooltip: "Templates de Mensagens"

### Screenshot da barra:
```
┌─────────────────────────────────────────────────┐
│ [📄] [📎] [━━━━━━━━━━━━━━━━━━━━━━━] [😊] [📤]   │
│  ↑    ↑           Textarea            ↑    ↑   │
│Template Anexo                       Emoji Send │
└─────────────────────────────────────────────────┘
```

---

## ✅ Teste 11: Dropdown de Templates no Chat

### Passos:
1. No chat, clique no botão **Template** (FileText roxo)

### Resultado Esperado:
- ✅ Dropdown abre **ACIMA** do input (position: bottom-full)
- ✅ Largura: 320px (w-80)
- ✅ Header: "Selecione um template"
- ✅ Lista mostra ambos os templates:
  - "Boas-vindas" (categoria Atendimento, atalho `/oi`)
  - "Confirmação de Atendimento" (categoria Suporte, atalho `/confirm`)
- ✅ Cada item mostra:
  - Nome (font-medium)
  - Atalho (código em cinza)
  - Preview do conteúdo (line-clamp-2)
  - Badge de categoria (roxo)
- ✅ Hover nos itens muda cor de fundo

### Screenshot:
```
┌─────────────────────────────────────────┐
│ Selecione um template                   │
├─────────────────────────────────────────┤
│ Boas-vindas               [Atendimento] │
│ /oi                                     │
│ Olá {{nome}}! Bem-vindo ao ConectCRM... │
├─────────────────────────────────────────┤
│ Confirmação de Atendimento    [Suporte] │
│ /confirm                                │
│ Olá {{nome}}, Recebi seu ticket...     │
└─────────────────────────────────────────┘
```

---

## ✅ Teste 12: Selecionar Template no Chat

### Pré-requisito:
- Ter um ticket aberto com dados:
  - Nome do cliente: "João Silva"
  - Número do ticket: "TKT-12345"
  - Telefone: "(11) 99999-9999"

### Passos:
1. Abra o dropdown de templates
2. Clique em **"Confirmação de Atendimento"**

### Resultado Esperado:
- ✅ Dropdown fecha
- ✅ Textarea recebe conteúdo **COM VARIÁVEIS SUBSTITUÍDAS**:
  ```
  Olá João Silva,
  
  Recebi seu ticket #TKT-12345 às 20:30.
  Estou analisando sua solicitação e retorno em breve.
  
  Atenciosamente,
  [Nome do Atendente Logado]
  ```
- ✅ Variáveis substituídas:
  - `{{nome}}` → "João Silva"
  - `{{ticket}}` → "TKT-12345"
  - `{{hora}}` → "20:30" (hora atual)
  - `{{atendente}}` → Nome do usuário logado
- ✅ Cursor foca no textarea
- ✅ Template pronto para editar ou enviar

---

## ✅ Teste 13: Autocomplete de Atalhos (`/comando`)

### Passos:
1. No textarea do chat, digite: `/`
2. Observe a resposta do sistema

### Resultado Esperado:
- ✅ Autocomplete abre **ACIMA** do input
- ✅ Header: "Sugestões de atalhos"
- ✅ Mostra TODOS os templates com atalho:
  - `/oi` - Boas-vindas
  - `/confirm` - Confirmação de Atendimento

### Screenshot:
```
┌─────────────────────────────────────────┐
│ Sugestões de atalhos                    │
├─────────────────────────────────────────┤
│ /oi        Boas-vindas                  │
│ Olá {{nome}}! Bem-vindo ao...           │
├─────────────────────────────────────────┤
│ /confirm   Confirmação de Atendimento   │
│ Olá {{nome}}, Recebi seu ticket...     │
└─────────────────────────────────────────┘
```

---

## ✅ Teste 14: Filtrar Autocomplete

### Passos:
1. No textarea, digite: `/oi`
2. Observe o autocomplete

### Resultado Esperado:
- ✅ Mostra APENAS "Boas-vindas"
- ✅ Esconde "Confirmação de Atendimento"
- ✅ Filtro case-insensitive (funciona com `/OI`, `/Oi`, etc.)

### Teste 2: Filtrar por "conf"
1. Digite: `/conf`
2. **Esperado**: Mostra apenas "Confirmação de Atendimento"

---

## ✅ Teste 15: Selecionar no Autocomplete

### Passos:
1. Digite: `/oi`
2. Clique no item "Boas-vindas" no autocomplete

### Resultado Esperado:
- ✅ Autocomplete fecha
- ✅ Textarea recebe conteúdo **COM VARIÁVEIS SUBSTITUÍDAS**:
  ```
  Olá João Silva! Bem-vindo ao ConectCRM. 
  Como posso ajudá-lo hoje?
  Estou à disposição!
  ```
- ✅ Variável `{{nome}}` substituída por "João Silva"
- ✅ `/oi` removido do input (não aparece no conteúdo final)

---

## ✅ Teste 16: Fechar Dropdown/Autocomplete

### Passos:
1. Abra o dropdown de templates
2. Clique **FORA** do dropdown (em qualquer parte da tela)

### Resultado Esperado:
- ✅ Dropdown fecha

### Teste 2: Autocomplete
1. Digite `/oi` para abrir autocomplete
2. Apague o texto (backspace)
3. **Esperado**: Autocomplete fecha automaticamente

---

## ✅ Teste 17: Deletar Template

### Passos:
1. No card "Boas-vindas", clique no botão **Deletar** (ícone Trash2, vermelho)
2. Confirme na mensagem de confirmação

### Resultado Esperado:
- ✅ Alerta: "Deseja realmente deletar este template?"
- ✅ Ao confirmar, card desaparece da lista
- ✅ Template removido do banco de dados

### Validação:
```powershell
curl http://localhost:3001/atendimento/templates?empresaId=empresa-default
```

**Esperado**: Apenas "Confirmação de Atendimento" na lista

---

## ✅ Teste 18: Estados de Loading e Erro

### Teste Loading:
1. Desconecte a internet ou pare o backend
2. Acesse a página de templates
3. **Esperado**: 
   - Spinner de loading
   - Texto: "Carregando templates..."

### Teste Erro:
1. Com backend parado, tente criar template
2. **Esperado**:
   - Mensagem de erro em vermelho
   - Texto: "Erro ao salvar template" ou mensagem da API

---

## ✅ Teste 19: Responsividade

### Desktop (1920px):
- ✅ Grid: 3 colunas (`lg:grid-cols-3`)
- ✅ Dropdown: 320px de largura

### Tablet (768px):
- ✅ Grid: 2 colunas (`md:grid-cols-2`)

### Mobile (375px):
- ✅ Grid: 1 coluna (`grid-cols-1`)
- ✅ Dropdown: Ajusta à largura da tela

---

## ✅ Teste 20: Validação de Formulário

### Teste 1: Campos obrigatórios
1. Clique em "Novo Template"
2. Deixe "Nome" vazio
3. Tente salvar

**Esperado**: Botão "Criar Template" desabilitado (opacity-50)

### Teste 2: Conteúdo vazio
1. Preencha nome mas deixe conteúdo vazio
2. Tente salvar

**Esperado**: Botão desabilitado

### Teste 3: Validação OK
1. Preencha nome E conteúdo
2. **Esperado**: Botão habilitado (cor roxo vibrante)

---

## 📊 Resumo dos Testes

| # | Teste | Status | Observações |
|---|-------|--------|-------------|
| 1 | Acessar página | ⬜ | Verificar rota e UI |
| 2 | Criar template simples | ⬜ | CRUD básico |
| 3 | Criar com variáveis | ⬜ | Extração automática |
| 4 | Preview | ⬜ | Modal de visualização |
| 5 | Copiar conteúdo | ⬜ | Clipboard |
| 6 | Buscar | ⬜ | Filtro por texto |
| 7 | Filtrar categoria | ⬜ | Dropdown de categoria |
| 8 | Editar | ⬜ | Atualizar template |
| 9 | Listar variáveis | ⬜ | 14 variáveis disponíveis |
| 10 | Botão no chat | ⬜ | UI integration |
| 11 | Dropdown no chat | ⬜ | Lista de templates |
| 12 | Selecionar template | ⬜ | Substituição de variáveis |
| 13 | Autocomplete `/` | ⬜ | Mostrar sugestões |
| 14 | Filtrar autocomplete | ⬜ | Filtro por atalho |
| 15 | Selecionar autocomplete | ⬜ | Inserir template |
| 16 | Fechar dropdown | ⬜ | Click outside |
| 17 | Deletar | ⬜ | Remover template |
| 18 | Loading/Erro | ⬜ | Estados de UI |
| 19 | Responsividade | ⬜ | Mobile/Tablet/Desktop |
| 20 | Validação form | ⬜ | Campos obrigatórios |

---

## 🎯 Critérios de Aprovação

Para considerar a feature **100% funcional**:

- ✅ **CRUD completo**: Criar, ler, editar, deletar templates
- ✅ **Variáveis funcionando**: Extração automática e substituição correta
- ✅ **Chat integration**: Botão, dropdown e autocomplete funcionais
- ✅ **Atalhos**: Sistema `/comando` detecta e insere templates
- ✅ **UI/UX**: Estados de loading, erro, vazio funcionam
- ✅ **Responsivo**: Funciona em mobile, tablet e desktop
- ✅ **Performance**: Templates carregam rápido (<500ms)
- ✅ **Sem bugs**: Console sem erros, substituição correta

---

## 🐛 Como Reportar Bugs

Se encontrar algum problema:

1. **Descrever o bug**: O que aconteceu vs. o que deveria acontecer
2. **Passos para reproduzir**: Sequência exata de ações
3. **Screenshots**: Se possível, anexar imagem
4. **Console**: Verificar erros no DevTools (F12)
5. **Network**: Verificar requisições na aba Network

**Exemplo**:
```
Bug: Variável {{nome}} não substitui no chat

Passos:
1. Criar template com {{nome}}
2. Selecionar no chat
3. Resultado: "Olá {{nome}}" (não substituiu)

Esperado: "Olá João Silva"

Console: Erro: "ticket.nomeCliente is undefined"
```

---

## ✅ Próximos Passos Após Testes

1. ✅ Corrigir bugs encontrados
2. ✅ Otimizar performance se necessário
3. ✅ Adicionar mais variáveis se solicitado
4. ✅ Documentar uso para usuários finais
5. ✅ Deploy em staging para testes com equipe

---

**Bons testes!** 🚀
