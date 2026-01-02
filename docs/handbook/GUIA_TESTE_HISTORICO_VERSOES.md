# 🧪 Guia de Teste - Histórico de Versões

**Data**: 27/10/2025  
**Status**: ✅ Servidores Iniciados - Pronto para Testar!

---

## ✅ Ambiente Verificado

- ✅ **Backend**: Rodando na porta 3001
- ✅ **Frontend**: Rodando na porta 3000
- ✅ **Migrations**: Executadas com sucesso
- ✅ **Código**: 100% implementado

---

## 🎯 Teste Completo - Passo a Passo

### 1️⃣ Acessar Gestão de Fluxos

**URL**: http://localhost:3000/gestao/fluxos

**O que fazer**:
1. Abrir browser (já aberto no Simple Browser)
2. Ver lista de fluxos existentes
3. Se não houver fluxos, clicar em "Criar Novo Fluxo"

**Resultado esperado**:
- ✅ Página carrega sem erros
- ✅ Lista de fluxos aparece (ou tela vazia se novo)
- ✅ Botão "Criar Novo Fluxo" visível

---

### 2️⃣ Criar ou Abrir Fluxo Existente

**Opção A - Criar novo fluxo**:
1. Clicar em "Criar Novo Fluxo"
2. Preencher:
   - Nome: "Teste Histórico Versões"
   - Descrição: "Fluxo para testar versionamento"
   - Departamento: Selecionar qualquer um
3. Clicar em "Criar"

**Opção B - Abrir fluxo existente**:
1. Clicar no card de qualquer fluxo
2. Ou clicar no ícone de edição (lápis)

**Resultado esperado**:
- ✅ Abre o construtor visual (FluxoBuilderPage)
- ✅ Canvas aparece no centro
- ✅ Header tem botões: Voltar, Preview, **Histórico**, Salvar

---

### 3️⃣ Verificar Botão "Histórico"

**O que procurar no header**:
```
┌─────────────────────────────────────────────────────┐
│ [← Voltar] | [👁 Preview] [🕒 Histórico] [💾 Salvar] │
└─────────────────────────────────────────────────────┘
                              ↑
                    Botão ROXO com ícone de relógio
```

**Verificar**:
- ✅ Botão "Histórico" aparece (roxo, entre Preview e Salvar)
- ✅ Botão só aparece se for fluxo existente (não aparece em novo)
- ✅ Hover no botão muda cor (roxo mais escuro)

**Se botão NÃO aparecer**:
- ⚠️ Verificar se fluxo tem ID na URL (`/builder/[id]`)
- ⚠️ Abrir console (F12) e ver erros

---

### 4️⃣ Criar Primeira Versão

**Antes de testar histórico, precisamos criar versões:**

1. Adicionar alguns blocos no canvas:
   - Bloco "Mensagem" com texto "Olá!"
   - Bloco "Menu" com 2 opções
   - Conectar os blocos
   
2. **Salvar o fluxo**:
   - Clicar em "Salvar" (botão verde)
   - Aguardar toast "Fluxo salvo com sucesso"

3. **Publicar o fluxo** (cria versão automática):
   - Voltar para `/gestao/fluxos`
   - No card do fluxo, clicar em "⋮" (menu)
   - Clicar em "Publicar"
   - ✅ **Versão 1 criada automaticamente!**

---

### 5️⃣ Criar Segunda Versão

**Modificar o fluxo**:

1. Voltar ao editor (clicar no card do fluxo)
2. Adicionar mais blocos:
   - Bloco "Condição" com regra
   - Bloco "Mensagem" com "Fim do atendimento"
   - Conectar novos blocos

3. **Salvar novamente**:
   - Clicar em "Salvar"
   - Aguardar confirmação

4. **Publicar novamente**:
   - Voltar para `/gestao/fluxos`
   - Publicar o fluxo
   - ✅ **Versão 2 criada!**

---

### 6️⃣ Abrir Modal de Histórico

**Agora vem o teste principal!**

1. Abrir fluxo no editor
2. Clicar em **"Histórico"** (botão roxo)

**Resultado esperado**:
```
┌─────────────────────────────────────────────────────┐
│ 🕒 Histórico de Versões              [X]            │
│ 2 versão(ões) salva(s)                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ v2  ✅ PUBLICADA  há X min        [Restaurar]  ││
│ │ Versão publicada                               ││
│ │ Autor: [seu user id]                           ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ v1  ✅ PUBLICADA  há X min        [Restaurar]  ││
│ │ Versão publicada                               ││
│ │ Autor: [seu user id]                           ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Verificar**:
- ✅ Modal abre corretamente
- ✅ Título "Histórico de Versões" aparece
- ✅ Contador mostra "2 versão(ões) salva(s)"
- ✅ Cards de versões aparecem
- ✅ Versões ordenadas (v2 primeiro, v1 depois)
- ✅ Badge verde "PUBLICADA" aparece
- ✅ Timestamp formatado ("há X min/horas/dias")
- ✅ Botão "Restaurar" em cada versão
- ✅ Botão X no canto superior direito

---

### 7️⃣ Testar Restauração de Versão

**Este é o teste mais importante!**

1. No modal de histórico, **clicar em "Restaurar"** na versão 1
   
2. **Dialog de confirmação aparece**:
   ```
   ⚠️ Restaurar versão 1?
   
   A versão atual será salva automaticamente
   antes da restauração.
   
   [Cancelar] [Restaurar]
   ```

3. **Clicar em "Restaurar"**

4. **Aguardar**:
   - Spinner aparece
   - Texto "Restaurando versão 1..."
   - Modal fecha automaticamente
   - Canvas recarrega

**Resultado esperado**:
- ✅ Canvas volta ao estado da versão 1
- ✅ Blocos da versão 2 desaparecem
- ✅ Blocos da versão 1 aparecem
- ✅ Toast de sucesso: "Versão 1 restaurada com sucesso!"
- ✅ Backup da versão atual foi salvo antes

---

### 8️⃣ Verificar que Backup Foi Criado

**Após restaurar, abrir histórico novamente**:

1. Clicar em "Histórico" novamente
2. Ver lista atualizada

**Resultado esperado**:
```
3 versão(ões) salva(s)

v3  ✅ PUBLICADA  agora         [Restaurar]
Backup antes de restaurar para versão 1

v2  ✅ PUBLICADA  há X min      [Restaurar]
Versão publicada

v1  ✅ PUBLICADA  há X min      [Restaurar]
Versão publicada
```

- ✅ Nova versão (v3) foi criada automaticamente
- ✅ Descrição da v3 explica que é um backup
- ✅ Total agora é "3 versão(ões)"

---

## 🎨 Checklist Visual

### Interface do Modal:
- [ ] Modal abre com animação suave
- [ ] Fundo escuro (overlay) cobre página
- [ ] Modal centralizado na tela
- [ ] Botão X funciona para fechar
- [ ] Clicar fora do modal fecha ele
- [ ] Scroll funciona se muitas versões

### Cards de Versão:
- [ ] Borda verde em versões publicadas
- [ ] Borda cinza em versões não publicadas
- [ ] Badge "PUBLICADA" verde e redondo
- [ ] Ícone de relógio (Clock) antes do timestamp
- [ ] Número da versão em destaque (v1, v2, v3...)
- [ ] Hover no card aumenta sombra

### Botão Restaurar:
- [ ] Cor roxa (text-purple-600)
- [ ] Background roxo claro (bg-purple-50)
- [ ] Ícone de seta circular (RotateCcw)
- [ ] Hover muda para bg-purple-100
- [ ] Desabilita durante restauração

### Estados:
- [ ] Loading: spinner animado + texto "Carregando histórico..."
- [ ] Empty: ícone Clock + mensagem "Nenhuma versão salva"
- [ ] Error: ícone AlertCircle vermelho + mensagem de erro
- [ ] Success: versões listadas corretamente

---

## 🐛 Troubleshooting

### Modal não abre:
```
1. Abrir DevTools (F12)
2. Verificar console:
   - Erros de import?
   - Erro de state?
3. Verificar Network:
   - Requisição para /fluxos/[id]/historico foi feita?
   - Status 200 ou erro?
```

### Lista vazia:
```
Causa: Fluxo nunca foi publicado
Solução: 
1. Voltar para /gestao/fluxos
2. Publicar o fluxo
3. Tentar novamente
```

### Erro 404 ao carregar:
```
Causa: Backend não está rodando ou rota incorreta
Solução:
1. Verificar se backend está na porta 3001
2. Testar endpoint:
   curl http://localhost:3001/fluxos/[id]/historico
```

### Erro ao restaurar:
```
Causa: Versão não existe ou erro no backend
Solução:
1. Ver logs do backend (terminal)
2. Ver console do browser (F12)
3. Verificar se numeroVersao está correto
```

### Botão "Histórico" não aparece:
```
Causa: Fluxo novo (sem ID) ou código não foi salvo
Solução:
1. Verificar URL: deve ter /builder/[algum-id]
2. Salvar o arquivo FluxoBuilderPage.tsx
3. Recarregar página (Ctrl+R)
```

---

## 📊 Testes Adicionais

### Teste de Performance:
1. Criar 10+ versões
2. Abrir modal de histórico
3. Verificar se carrega rápido (<1s)
4. Scroll deve ser suave

### Teste de Responsividade:
1. Redimensionar browser (F12 → Device toolbar)
2. Testar mobile (375px)
3. Testar tablet (768px)
4. Modal deve se ajustar ao tamanho

### Teste de Navegação:
1. Abrir modal
2. Clicar ESC (deve fechar)
3. Clicar fora do modal (deve fechar)
4. Clicar X (deve fechar)

### Teste de Múltiplas Restaurações:
1. Restaurar v1
2. Ver que canvas mudou
3. Restaurar v2
4. Ver que canvas voltou
5. Cada restauração cria backup

---

## ✅ Critérios de Sucesso

Para considerar o teste **APROVADO**, todos devem funcionar:

- [x] ✅ Backend rodando (porta 3001)
- [x] ✅ Frontend rodando (porta 3000)
- [ ] ✅ Botão "Histórico" aparece no editor
- [ ] ✅ Modal abre ao clicar no botão
- [ ] ✅ Lista de versões carrega (se houver)
- [ ] ✅ Formatação de datas funciona
- [ ] ✅ Badge "PUBLICADA" aparece
- [ ] ✅ Botão "Restaurar" funciona
- [ ] ✅ Confirmação aparece antes de restaurar
- [ ] ✅ Canvas recarrega após restaurar
- [ ] ✅ Backup é criado automaticamente
- [ ] ✅ Toast de sucesso aparece
- [ ] ✅ Sem erros no console

---

## 🎓 Comandos Úteis

### Ver logs do backend:
```bash
# No terminal do backend (já está rodando)
# Ver output em tempo real
```

### Verificar rotas:
```bash
# Listar histórico
curl http://localhost:3001/fluxos/[id]/historico

# Restaurar versão
curl -X POST http://localhost:3001/fluxos/[id]/restaurar-versao \
  -H "Content-Type: application/json" \
  -d '{"numeroVersao": 1}'
```

### Verificar banco (se tiver acesso):
```sql
-- Ver fluxos com versões
SELECT id, nome, versao_atual, 
       jsonb_array_length(historico_versoes) as total_versoes
FROM fluxos_triagem;

-- Ver histórico de um fluxo específico
SELECT historico_versoes 
FROM fluxos_triagem 
WHERE id = '[id-do-fluxo]';
```

---

## 🚀 Próximos Passos Após Teste

### Se tudo funcionou:
1. ✅ Marcar feature como 100% completa
2. 📝 Documentar no README do projeto
3. 🎉 Comemorar! Sistema de versionamento funcionando!
4. 🔄 Partir para próxima feature (reconhecimento de departamento)

### Se houver bugs:
1. 🐛 Listar bugs encontrados
2. 🔧 Corrigir um por um
3. 🧪 Re-testar após correções
4. ✅ Validar novamente

---

**Ambiente Pronto!** 🎉  
**Agora é só testar no browser!**

Acesse: http://localhost:3000/gestao/fluxos
