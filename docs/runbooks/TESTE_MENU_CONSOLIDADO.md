# ✅ Guia Rápido: Testar Consolidação do Menu

## 🚀 Passo a Passo para Testar

### 1️⃣ Reiniciar o Frontend
```powershell
# No terminal do frontend
Ctrl + C  # Parar o servidor atual
npm start # Reiniciar
```

### 2️⃣ Acessar a Nova Tela
1. Fazer login no sistema
2. No menu lateral, clicar em **"Atendimento"**
3. Clicar em **"Configurações"**
4. Você verá 7 abas:
   - 🎯 Núcleos
   - 👥 Equipes
   - 👤 Atendentes
   - 🔀 Atribuições
   - 🏢 Departamentos
   - 📊 Fluxos
   - ⚙️ Geral

### 3️⃣ Testar Navegação por Abas
- Clicar em cada aba
- Verificar que a URL muda (ex: `?tab=equipes`)
- Verificar que o conteúdo carrega corretamente
- Verificar que o título/descrição da aba é exibido

### 4️⃣ Testar URLs Antigas (Redirects)
Acessar diretamente no navegador:
```
http://localhost:3000/gestao/nucleos
http://localhost:3000/gestao/equipes
http://localhost:3000/gestao/atendentes
http://localhost:3000/gestao/atribuicoes
http://localhost:3000/gestao/departamentos
http://localhost:3000/gestao/fluxos
```
**Resultado esperado**: Todas devem redirecionar para `/atendimento/configuracoes?tab=[nome]`

### 5️⃣ Verificar Menu Lateral
No menu de Atendimento, agora deve ter **apenas 6 itens**:
- ✅ Dashboard
- ✅ Central de Atendimentos
- ✅ Chat
- ✅ Configurações ⭐ (nova)
- ✅ Relatórios
- ✅ Supervisão (se admin)

**Antes tinha 12 itens** → **Agora tem 6 itens** (redução de 50%)

### 6️⃣ Testar Funcionalidades das Tabs

#### Tab Núcleos
- [ ] Listar núcleos existentes
- [ ] Criar novo núcleo
- [ ] Editar núcleo
- [ ] Deletar núcleo
- [ ] Expandir para ver departamentos
- [ ] Gerenciar agentes

#### Tab Equipes
- [ ] Listar equipes
- [ ] Criar nova equipe
- [ ] Editar equipe
- [ ] Adicionar membros

#### Tab Atendentes
- [ ] Listar atendentes
- [ ] Criar novo atendente
- [ ] Editar atendente
- [ ] Alterar status

#### Tab Atribuições
- [ ] Visualizar matriz
- [ ] Adicionar atribuição
- [ ] Editar atribuição
- [ ] Remover atribuição

#### Tab Departamentos
- [ ] Listar departamentos
- [ ] Criar departamento
- [ ] Editar departamento
- [ ] Vincular com núcleo

#### Tab Fluxos
- [ ] Listar fluxos
- [ ] Criar novo fluxo
- [ ] Editar fluxo
- [ ] Acessar builder de fluxo

#### Tab Geral
- [ ] Editar mensagem de boas-vindas
- [ ] Editar mensagem de ausência
- [ ] Alterar tempo máximo de sessão
- [ ] Toggle de notificações
- [ ] Toggle de sons
- [ ] Salvar configurações

## 🐛 Problemas Conhecidos

### Erro TypeScript Temporário
Se aparecer erros de "módulo não encontrado" no editor:
```powershell
# Solução 1: Reload da janela VS Code
Ctrl + Shift + P → "Reload Window"

# Solução 2: Restart TypeScript Server
Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Página em Branco
Se a página ficar em branco:
1. Abrir DevTools (F12)
2. Ver console para erros
3. Verificar se há imports faltando
4. Limpar cache do navegador (Ctrl + Shift + R)

### Redirects Não Funcionam
Se as URLs antigas não redirecionarem:
1. Verificar se `Navigate` foi importado no `App.tsx`
2. Verificar se as rotas estão na ordem correta (redirects antes de rotas genéricas)

## 📱 Teste de Responsividade

### Mobile (375px)
```
1. F12 → Toggle Device Toolbar
2. Selecionar "iPhone SE" ou similar
3. Verificar:
   - Abas em scroll horizontal
   - Conteúdo responsivo
   - Botões acessíveis
```

### Tablet (768px)
```
1. Selecionar "iPad" ou similar
2. Verificar:
   - Layout em 2 colunas onde aplicável
   - Menu lateral visível
   - Cards organizados
```

### Desktop (1920px)
```
1. Fullscreen no navegador
2. Verificar:
   - Layout em 3-4 colunas
   - Espaçamento adequado
   - Sem elementos cortados
```

## ✅ Checklist Final

### Navegação
- [ ] Menu de Atendimento tem 6 itens (não 12)
- [ ] Item "Configurações" está presente
- [ ] Clicar em "Configurações" abre tela com abas
- [ ] URLs antigas redirecionam corretamente

### Funcionalidade
- [ ] Todas as 7 abas carregam
- [ ] Trocar de aba atualiza URL
- [ ] Conteúdo de cada aba é exibido corretamente
- [ ] Formulários funcionam (criar/editar/deletar)

### UX/UI
- [ ] Cor roxa (#9333EA) está aplicada
- [ ] Ícones corretos em cada aba
- [ ] Descrição da aba é exibida
- [ ] Hover effects funcionam
- [ ] Transições suaves

### Performance
- [ ] Troca de aba é instantânea (sem reload)
- [ ] Sem erros no console
- [ ] Sem warnings de performance
- [ ] Loading states funcionam

## 🎯 Resultado Esperado

Ao final dos testes, você deve ter:
1. ✅ Menu mais limpo (6 itens ao invés de 12)
2. ✅ Navegação rápida por abas
3. ✅ Todas as funcionalidades mantidas
4. ✅ URLs antigas funcionando (redirects)
5. ✅ Design moderno e consistente

---

**Dúvidas?** Consulte `CONSOLIDACAO_MENU_ATENDIMENTO.md` para detalhes técnicos.
