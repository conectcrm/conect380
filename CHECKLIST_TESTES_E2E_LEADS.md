# ✅ Checklist de Testes End-to-End - Módulo de Leads

**Data**: 12 de novembro de 2025  
**Testador**: GitHub Copilot + Usuário  
**Ambiente**: Desenvolvimento (localhost:3000)  
**Backend**: http://localhost:3001  
**Navegador**: Chrome/Edge

---

## 📋 Preparação dos Testes

- [x] Backend rodando na porta 3001
- [x] Frontend disponível em http://localhost:3000
- [x] Usuário autenticado com acesso ao módulo CRM
- [x] Arquivo CSV de teste criado: `test-leads-import.csv`

---

## 🧪 Cenários de Teste

### ✅ Teste 1: Criar Lead Manual

**Objetivo**: Validar criação de lead através da interface  
**Passos**:
1. Acessar http://localhost:3000/leads
2. Clicar no botão "Novo Lead"
3. Preencher formulário:
   - Nome: "Teste Lead Manual"
   - Email: "teste@manual.com"
   - Telefone: "(11) 91234-5678"
   - Empresa: "Empresa Teste"
   - Origem: "Site"
   - Observações: "Lead criado para teste E2E"
4. Clicar em "Salvar"

**Resultado Esperado**:
- [ ] Lead aparece na lista
- [ ] Score calculado automaticamente (esperado: ~70-75)
- [ ] Status inicial: "Novo"
- [ ] Card do lead mostra todas as informações

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 2: Editar Lead

**Objetivo**: Validar edição de dados do lead  
**Passos**:
1. Clicar no botão "Editar" (ícone lápis) em um lead existente
2. Modificar campo "Observações": adicionar " - EDITADO"
3. Clicar em "Salvar"

**Resultado Esperado**:
- [ ] Alterações salvas
- [ ] Observações exibem texto atualizado
- [ ] Modal fecha automaticamente

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 3: Filtros e Busca

**Objetivo**: Validar funcionamento de filtros  
**Passos**:
1. Na barra de busca, digitar "teste"
2. Verificar resultados filtrados
3. Selecionar filtro "Status: Qualificado"
4. Selecionar filtro "Status: Todos"

**Resultado Esperado**:
- [ ] Busca por texto filtra leads por nome/email/empresa
- [ ] Filtro por status funciona corretamente
- [ ] Filtro "Todos" mostra todos os leads novamente
- [ ] Contador de leads se ajusta aos filtros

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 4: Qualificar Lead

**Objetivo**: Validar mudança de status para qualificado  
**Passos**:
1. Localizar um lead com status "Novo"
2. Clicar no botão "Qualificar"
3. Verificar atualização

**Resultado Esperado**:
- [ ] Status muda para "Qualificado"
- [ ] Badge do status muda de cor (cinza → verde)
- [ ] Score pode aumentar
- [ ] Dashboard atualiza (contador de qualificados +1)

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 5: Converter Lead → Oportunidade

**Objetivo**: Validar conversão de lead qualificado em oportunidade  
**Passos**:
1. Localizar um lead com status "Qualificado"
2. Clicar no botão "Converter" (ícone seta)
3. Preencher modal de conversão:
   - Título: "Oportunidade Teste E2E"
   - Valor Estimado: "50000"
   - Data Prevista: "2025-12-31"
   - Observações: "Teste de conversão"
4. Clicar em "Converter em Oportunidade"

**Resultado Esperado**:
- [ ] Modal fecha
- [ ] Status do lead muda para "Convertido"
- [ ] Badge de status atualiza
- [ ] Oportunidade criada no Pipeline (verificar em /pipeline)
- [ ] Dashboard atualiza (taxa de conversão aumenta)

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 6: Import CSV

**Objetivo**: Validar importação em massa via CSV  
**Passos**:
1. Clicar no botão "Importar CSV"
2. Selecionar arquivo `test-leads-import.csv`
3. Clicar em "Importar Leads"
4. Aguardar processamento

**Resultado Esperado**:
- [ ] Modal mostra progresso
- [ ] Relatório exibido:
  - Total: 5
  - Importados: 5
  - Erros: 0
- [ ] 5 novos leads aparecem na lista
- [ ] Dashboard atualiza contadores
- [ ] Leads importados têm origem correta (site, formulário, etc)

**Arquivo CSV Teste** (`test-leads-import.csv`):
```csv
nome,email,telefone,empresa_nome,origem,observacoes,responsavel_email
Maria Silva,maria@exemplo.com,(11) 98888-8888,Tech Solutions,site,Interessada em solução de CRM,
João Santos,joao@exemplo.com,(21) 97777-7777,Inovação Digital,formulario,Solicitou demonstração,
Ana Costa,ana@exemplo.com,(11) 96666-6666,Consultoria XYZ,email,Pediu orçamento,
Pedro Oliveira,pedro@exemplo.com,(31) 95555-5555,StartupABC,telefone,Cliente indicado,
Carla Souza,carla@exemplo.com,,Empresa DEF,redes_sociais,Viu anúncio no LinkedIn,
```

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 7: Formulário Público

**Objetivo**: Validar captura de leads sem autenticação  
**Passos**:
1. Abrir nova aba anônima (Ctrl+Shift+N)
2. Acessar http://localhost:3000/capturar-lead
3. Preencher formulário:
   - Nome: "Lead Público Teste"
   - Email: "publico@teste.com"
   - Telefone: "(11) 99999-9999"
   - Empresa: "Empresa Pública"
   - Mensagem: "Teste de captura pública"
4. Clicar em "Enviar Mensagem"

**Resultado Esperado**:
- [ ] Formulário acessível sem login
- [ ] Tela de confirmação exibida após envio
- [ ] Lead criado com status "Novo" e origem "Formulário"
- [ ] Verificar em /leads se lead aparece (após login)

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 8: Dashboard e Estatísticas

**Objetivo**: Validar métricas do dashboard  
**Passos**:
1. Na página /leads, observar KPI cards no topo
2. Contar manualmente leads da lista por status
3. Comparar com valores exibidos nos cards

**Resultado Esperado**:
- [ ] **Total de Leads**: Bate com contagem total
- [ ] **Leads Qualificados**: Bate com filtro "Qualificado"
- [ ] **Taxa de Conversão**: % correto (convertidos / total)
- [ ] **Score Médio**: Média aritmética dos scores
- [ ] Cards responsivos (layout 4 colunas → 2 → 1)

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 9: Deletar Lead

**Objetivo**: Validar exclusão de lead  
**Passos**:
1. Clicar no botão "Deletar" (ícone lixeira) em um lead de teste
2. Confirmar exclusão no prompt/modal
3. Verificar atualização

**Resultado Esperado**:
- [ ] Lead removido da lista
- [ ] Dashboard atualiza (total -1)
- [ ] Não é possível deletar lead convertido (validação backend)

**Status**: ⏳ Aguardando teste manual

---

### ✅ Teste 10: Responsividade Mobile

**Objetivo**: Validar interface em dispositivos móveis  
**Passos**:
1. Abrir DevTools (F12)
2. Ativar modo responsivo (Ctrl+Shift+M)
3. Selecionar viewport "iPhone SE" (375px)
4. Navegar pela página /leads
5. Testar todos os botões e modais

**Resultado Esperado**:
- [ ] Layout adapta para 1 coluna
- [ ] KPI cards empilham verticalmente
- [ ] Botões de ação são clicáveis (touch-friendly)
- [ ] Modais ocupam largura total (mobile-friendly)
- [ ] Formulários preenchem tela sem scroll horizontal
- [ ] Barra de busca responsiva

**Viewports Testados**:
- [ ] Mobile: 375px (iPhone SE)
- [ ] Tablet: 768px (iPad)
- [ ] Desktop: 1920px (Full HD)

**Status**: ⏳ Aguardando teste manual

---

## 🔒 Teste 11: Isolamento Multi-Tenant

**Objetivo**: Validar que empresas não veem leads de outras  
**Passos**:
1. Fazer login com usuário da Empresa A
2. Criar lead "Lead Empresa A"
3. Fazer logout
4. Fazer login com usuário da Empresa B
5. Acessar /leads
6. Tentar buscar "Lead Empresa A"

**Resultado Esperado**:
- [ ] Lead da Empresa A NÃO aparece para Empresa B
- [ ] Dashboard mostra apenas leads da Empresa B
- [ ] Import CSV só cria leads para empresa autenticada

**Status**: ⏳ Aguardando teste manual (requer 2 empresas)

---

## 📊 Resumo dos Testes

| # | Cenário | Status | Observações |
|---|---------|--------|-------------|
| 1 | Criar Lead Manual | ⏳ Pendente | - |
| 2 | Editar Lead | ⏳ Pendente | - |
| 3 | Filtros e Busca | ⏳ Pendente | - |
| 4 | Qualificar Lead | ⏳ Pendente | - |
| 5 | Converter → Oportunidade | ⏳ Pendente | - |
| 6 | Import CSV | ⏳ Pendente | - |
| 7 | Formulário Público | ⏳ Pendente | - |
| 8 | Dashboard/Estatísticas | ⏳ Pendente | - |
| 9 | Deletar Lead | ⏳ Pendente | - |
| 10 | Responsividade Mobile | ⏳ Pendente | - |
| 11 | Isolamento Multi-Tenant | ⏳ Pendente | Requer 2 empresas |

---

## 🐛 Bugs Encontrados

*(Nenhum até o momento)*

---

## 📝 Notas Adicionais

- **Performance**: Observar tempo de resposta em listas grandes (>100 leads)
- **UX**: Verificar feedback visual em todas as ações (loading, sucesso, erro)
- **Acessibilidade**: Testar navegação por teclado (Tab, Enter, Esc)

---

## ✅ Conclusão

**Status Geral**: ⏳ Em Progresso  
**Testes Passados**: 0/11  
**Testes Falhados**: 0/11  
**Bloqueadores**: Nenhum

**Próximos Passos**:
1. Executar testes manualmente no navegador
2. Documentar resultados neste arquivo
3. Corrigir bugs encontrados
4. Marcar Task 14 como completa

---

**Última Atualização**: 12/11/2025 - Checklist criada
