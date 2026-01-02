# 🧪 Teste Manual SLA Tracking - Roteiro Rápido

**Data**: 8 de novembro de 2025  
**Ambiente**: Desenvolvimento (Backend porta 3001, Frontend porta 3000)  
**Status Sistema**: ✅ Backend e Frontend rodando

---

## 📋 **Pré-requisitos**

- [x] Backend rodando na porta 3001
- [x] Frontend rodando na porta 3000
- [x] Migration executada (tabelas sla_configs e sla_event_logs criadas)
- [x] Browser aberto em: http://localhost:3000/nuclei/atendimento/sla/configuracoes

---

## 🎯 **Cenários de Teste - ConfiguracaoSLAPage**

### **Teste 1: Visualização Inicial** ⏱️ 1 min

**Objetivo**: Verificar carregamento inicial da página

**Passos**:
1. Acessar: `http://localhost:3000/nuclei/atendimento/sla/configuracoes`
2. Verificar elementos visíveis:
   - [ ] Header "Configuração de SLA" com ícone Clock
   - [ ] Botão "Nova Configuração" (verde Crevasse)
   - [ ] 3 KPI Cards (Total Configurações, Configs Ativas, Mais Restritiva)
   - [ ] Barra de filtros (Prioridade, Canal, Ativo, Busca)
   - [ ] Grid de cards responsivo (3 colunas desktop)

**Resultado Esperado**: 
- Loading inicial aparece
- Página carrega sem erros no console
- Se não houver configs, mostra estado vazio com mensagem

---

### **Teste 2: Criar Nova Configuração** ⏱️ 3 min

**Objetivo**: Validar criação de config SLA via modal

**Passos**:
1. Clicar em "Nova Configuração" (botão verde)
2. Verificar modal abre com 5 seções
3. Preencher formulário:
   - **Nome**: "SLA Atendimento Urgente"
   - **Descrição**: "Atendimento prioritário para casos urgentes"
   - **Prioridade**: Urgente
   - **Canal**: WhatsApp
   - **Tempo Resposta**: 00:15 (15 minutos)
   - **Tempo Resolução**: 02:00 (2 horas)
   - **Horários**: Segunda a Sexta, 09:00 - 18:00
   - **Alerta**: 80%
   - **Notificações**: Email ✅, Sistema ✅
   - **Ativo**: ✅
4. Clicar em "Salvar"

**Validações**:
- [ ] Campos obrigatórios destacados se vazio
- [ ] Validação: Tempo Resposta < Tempo Resolução
- [ ] Toast success aparece
- [ ] Modal fecha automaticamente
- [ ] Novo card aparece no grid
- [ ] KPI cards atualizam (Total +1, Ativas +1)

**Resultado Esperado**: 
- Config criada com sucesso
- Aparece no grid com badges corretos (Urgente, WhatsApp, Ativo)

---

### **Teste 3: Editar Configuração** ⏱️ 2 min

**Objetivo**: Validar edição de config existente

**Passos**:
1. Localizar config criada no Teste 2
2. Clicar no ícone de editar (lápis)
3. Modal abre com dados preenchidos
4. Alterar:
   - **Tempo Resposta**: 00:10 (10 minutos - mais restritivo)
   - **Alerta**: 70%
5. Clicar em "Salvar"

**Validações**:
- [ ] Modal carrega dados corretos
- [ ] Alterações salvas
- [ ] Toast success aparece
- [ ] Card atualiza no grid
- [ ] Se for tempo mais restritivo, KPI "Mais Restritiva" pode mudar

**Resultado Esperado**: Config atualizada corretamente

---

### **Teste 4: Filtros** ⏱️ 2 min

**Objetivo**: Validar funcionamento dos filtros

**Passos**:
1. Criar mais 2 configs (variando prioridade e canal)
2. Testar filtros:
   - **Prioridade**: Selecionar "Urgente" → Mostra só configs urgentes
   - **Canal**: Selecionar "WhatsApp" → Mostra só WhatsApp
   - **Ativo**: Selecionar "Apenas Ativas" → Mostra só ativas
   - **Busca**: Digitar "urgente" → Filtra por nome
3. Clicar "Limpar Filtros"

**Validações**:
- [ ] Cada filtro funciona isoladamente
- [ ] Filtros combinados funcionam (E lógico)
- [ ] Busca é case-insensitive
- [ ] "Limpar Filtros" reseta todos

**Resultado Esperado**: Filtros funcionam corretamente

---

### **Teste 5: Deletar Configuração** ⏱️ 1 min

**Objetivo**: Validar exclusão com confirmação

**Passos**:
1. Localizar uma config
2. Clicar no ícone de deletar (lixeira)
3. Verificar dialog de confirmação aparece
4. Clicar "Confirmar"

**Validações**:
- [ ] Dialog de confirmação aparece
- [ ] Toast success após deletar
- [ ] Card removido do grid
- [ ] KPI cards atualizam (Total -1)

**Resultado Esperado**: Config deletada com confirmação

---

## 📊 **Cenários de Teste - DashboardSLAPage**

### **Teste 6: Visualização Dashboard** ⏱️ 2 min

**Objetivo**: Verificar carregamento do dashboard

**Passos**:
1. Acessar: `http://localhost:3000/nuclei/atendimento/sla/dashboard`
2. Verificar elementos:
   - [ ] Header "Dashboard SLA" com filtros (Período, Prioridade, Canal)
   - [ ] 4 KPI Cards:
     - Taxa de Cumprimento (%)
     - Tickets em Risco (count)
     - Tickets Violados (count)
     - Tempo Médio de Resposta (min/horas)
   - [ ] 3 Gráficos:
     - Pizza: Distribuição de Status
     - Barra: Violações por Prioridade
     - Linha: Tendência 7 dias
   - [ ] Tabela de Violações (com paginação)

**Validações**:
- [ ] Loading inicial aparece
- [ ] Se não houver dados, mostra estado vazio
- [ ] Gráficos renderizam (recharts)
- [ ] Cores seguem padrão: Verde (cumprido), Amarelo (em risco), Vermelho (violado)

**Resultado Esperado**: Dashboard carrega sem erros

---

### **Teste 7: Filtros Dashboard** ⏱️ 2 min

**Objetivo**: Validar filtros de período e classificação

**Passos**:
1. Testar filtro de Período:
   - Hoje
   - 7 dias
   - 30 dias
   - 90 dias
2. Testar filtro de Prioridade (todas, baixa, normal, alta, urgente)
3. Testar filtro de Canal (todos, whatsapp, chat, email, telefone)
4. Clicar botão "Refresh" (ícone atualizar)

**Validações**:
- [ ] Cada filtro atualiza métricas
- [ ] Gráficos respondem aos filtros
- [ ] Tabela filtra dados
- [ ] Botão refresh recarrega dados

**Resultado Esperado**: Filtros funcionam corretamente

---

### **Teste 8: Auto-Refresh** ⏱️ 1 min

**Objetivo**: Validar atualização automática a cada 30 segundos

**Passos**:
1. Ficar na página do dashboard
2. Aguardar 30 segundos
3. Observar se há indicação de refresh automático

**Validações**:
- [ ] useEffect com interval de 30s está ativo
- [ ] Dados recarregam automaticamente

**Resultado Esperado**: Dashboard atualiza sozinho a cada 30s

---

### **Teste 9: Exportar CSV** ⏱️ 1 min

**Objetivo**: Validar exportação de dados

**Passos**:
1. Clicar em botão "Exportar CSV" (se visível)
2. Verificar download do arquivo

**Validações**:
- [ ] Arquivo CSV gerado
- [ ] Dados corretos no arquivo

**Resultado Esperado**: CSV baixado com dados das violações

---

## 📱 **Teste de Responsividade** ⏱️ 2 min

### **Teste 10: Layout Responsivo**

**Objetivo**: Validar adaptação mobile/tablet

**Passos**:
1. Abrir DevTools (F12)
2. Testar resoluções:
   - **Mobile** (375px): Grid 1 coluna
   - **Tablet** (768px): Grid 2 colunas
   - **Desktop** (1920px): Grid 3 colunas
3. Testar ambas as páginas (Configuração + Dashboard)

**Validações**:
- [ ] Grid adapta corretamente
- [ ] Botões acessíveis
- [ ] Formulário modal responsivo
- [ ] Gráficos ajustam tamanho
- [ ] Menu lateral colapsa em mobile

**Resultado Esperado**: Layout totalmente responsivo

---

## 🔍 **Teste de Console** ⏱️ 1 min

### **Teste 11: Verificar Erros**

**Objetivo**: Garantir ausência de erros críticos

**Passos**:
1. Abrir DevTools (F12) → Console
2. Navegar entre as páginas SLA
3. Executar todas as operações (criar, editar, deletar)
4. Verificar console

**Validações**:
- [ ] Sem erros vermelhos (errors)
- [ ] Warnings são aceitáveis (TS warnings não-bloqueantes)
- [ ] Requests HTTP retornam 200/201/204 (Network tab)

**Resultado Esperado**: Console limpo (sem errors críticos)

---

## 🎨 **Teste de Design** ⏱️ 2 min

### **Teste 12: Conformidade Design System**

**Objetivo**: Validar tema Crevasse e padrões visuais

**Passos**:
1. Verificar cores:
   - **Primary**: #159A9C (botões principais)
   - **Text**: #002333 (textos principais)
   - **Success**: Verde (badges cumprido)
   - **Warning**: Amarelo (badges em risco)
   - **Error**: Vermelho (badges violado)
2. Verificar componentes:
   - Botões com hover suave
   - Cards com shadow-sm e hover:shadow-lg
   - Inputs com focus:ring-2 focus:ring-[#159A9C]
   - Badges arredondados com cores contextuais
3. Verificar ícones (lucide-react):
   - Clock no menu SLA
   - Settings em Configurações
   - BarChart3 em Dashboard

**Validações**:
- [ ] Cores seguem paleta Crevasse exata
- [ ] Botões primários sempre #159A9C
- [ ] Hover effects funcionam
- [ ] Ícones corretos e proporcionais

**Resultado Esperado**: Design 100% conforme guidelines

---

## ✅ **Checklist Final de Validação**

### **Funcionalidades Core**:
- [ ] ✅ Criar configuração SLA
- [ ] ✅ Editar configuração SLA
- [ ] ✅ Deletar configuração SLA (com confirmação)
- [ ] ✅ Listar configurações com filtros
- [ ] ✅ Visualizar dashboard com métricas
- [ ] ✅ Gráficos renderizam corretamente
- [ ] ✅ Tabela de violações funciona
- [ ] ✅ Auto-refresh a cada 30s

### **UX/UI**:
- [ ] ✅ Loading states em todas operações
- [ ] ✅ Toast notifications (success, error)
- [ ] ✅ Empty states com mensagens úteis
- [ ] ✅ Validações de formulário funcionam
- [ ] ✅ Responsividade mobile/tablet/desktop
- [ ] ✅ Menu lateral com item SLA + submenu

### **Performance**:
- [ ] ✅ Página carrega em < 3 segundos
- [ ] ✅ Sem memory leaks (observar DevTools)
- [ ] ✅ Requests otimizadas (sem N+1)

### **Integração**:
- [ ] ✅ Backend responde corretamente (200/201/204/401)
- [ ] ✅ Frontend consome API correta (/atendimento/sla/*)
- [ ] ✅ Rotas registradas (App.tsx)
- [ ] ✅ Menu funcional (menuConfig.ts)

---

## 📝 **Resultado dos Testes**

### **Execução**:
- **Data**: 8 de novembro de 2025
- **Testador**: [Nome]
- **Duração Total**: ~20 minutos

### **Status**:
- [ ] ✅ Todos os testes passaram
- [ ] ⚠️ Alguns testes falharam (listar abaixo)
- [ ] ❌ Testes bloqueados

### **Observações**:
```
[Espaço para anotações durante os testes]

Exemplo:
- Teste 2: Config criada com sucesso ✅
- Teste 5: Confirmação de delete funcionou ✅
- Teste 10: Responsividade perfeita ✅
```

---

## 🚀 **Próximos Passos**

Após validação manual bem-sucedida:

1. **Testes E2E Automatizados** (Opcional - 20 cenários definidos)
2. **Integração com Chat** (Badges SLA nos tickets)
3. **Notificações por Email** (Alertas e violações)
4. **Relatórios Avançados** (Export PDF, gráficos customizados)

---

## 📚 **Referências**

- **Planejamento**: `PLANEJAMENTO_SLA_TRACKING.md`
- **Conclusão**: `CONCLUSAO_SLA_TRACKING.md`
- **Audit**: `AUDITORIA_PROGRESSO_REAL.md`
- **Design Guidelines**: `frontend-web/DESIGN_GUIDELINES.md`
- **Código Fonte**:
  - Backend: `backend/src/modules/atendimento/sla/`
  - Frontend: `frontend-web/src/services/slaService.ts`
  - Páginas: `frontend-web/src/pages/ConfiguracaoSLAPage.tsx` e `DashboardSLAPage.tsx`

---

**Última atualização**: 8 de novembro de 2025 - 11:30  
**Status**: Pronto para teste manual 🎯
