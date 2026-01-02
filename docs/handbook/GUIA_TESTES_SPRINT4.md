# 🧪 Guia de Testes - Sprint 4 (Filtros e Exportação)

**Data**: 2025-01-18  
**Implementado**: Filtros Avançados + Export Excel/PDF  
**Status**: ✅ Backend ONLINE | ✅ Frontend ONLINE

---

## 🎯 Objetivo dos Testes

Validar as **2 novas funcionalidades** implementadas:
1. **Filtros Avançados** (7 filtros interativos)
2. **Exportação Completa** (CSV + Excel + PDF)

---

## 📋 PRÉ-REQUISITOS

### 1. Verificar Serviços
- ✅ Backend: http://localhost:3001/health
- ✅ Frontend: http://localhost:3000

### 2. Acessar Sistema
1. Navegue para: **http://localhost:3000/login**
2. Faça login com suas credenciais
3. Acesse: **Comercial → Pipeline de Vendas**
   - URL: http://localhost:3000/comercial/pipeline

---

## 🧪 CHECKLIST DE TESTES

### ✅ TESTE 1: Visualização Inicial

**Objetivo**: Confirmar que a página carrega corretamente

- [ ] Página carrega sem erros
- [ ] KPI cards aparecem no topo (6 cards coloridos)
- [ ] Abas (Kanban, Lista, Pipeline) visíveis
- [ ] Botões "Nova Oportunidade" e "Exportar" aparecem
- [ ] **NOVO**: Botão "Filtros Avançados" aparece ao lado de "Exportar"

**Resultado Esperado**:
```
✅ KPI Cards com cores vibrantes:
   - Leads: cinza azulado
   - Qualificação: azul
   - Proposta: índigo
   - Negociação: âmbar
   - Fechamento: laranja
   - Ganho: verde esmeralda
   - Perdido: rosa/vermelho

✅ Barra de botões no topo:
   [Nova Oportunidade] [Filtros Avançados ▼] [Exportar]
```

---

### 🎨 TESTE 2: Paleta de Cores (Kanban)

**Objetivo**: Confirmar que as cores estão corretas

1. Clique na aba **"Kanban"**
2. Observe as colunas coloridas

**Verificar**:
- [ ] **Leads**: fundo cinza azulado (slate-500)
- [ ] **Qualificação**: fundo azul (blue-500)
- [ ] **Proposta**: fundo índigo (indigo-500)
- [ ] **Negociação**: fundo âmbar/amarelo (amber-500)
- [ ] **Fechamento**: fundo laranja (orange-500)
- [ ] **Ganho**: fundo verde esmeralda (emerald-500)
- [ ] **Perdido**: fundo rosa/vermelho (rose-500)
- [ ] **Texto dos cabeçalhos**: branco e legível em TODAS as colunas

**Cores Exatas** (para referência):
```
#64748b (slate-500)   → Leads
#3b82f6 (blue-500)    → Qualificação
#6366f1 (indigo-500)  → Proposta
#f59e0b (amber-500)   → Negociação
#f97316 (orange-500)  → Fechamento
#10b981 (emerald-500) → Ganho
#f43f5e (rose-500)    → Perdido
```

---

### 🔍 TESTE 3: Filtros Avançados (NOVO!)

**Objetivo**: Testar os 7 novos filtros

#### 3.1. Abrir Painel de Filtros
1. Clique no botão **"Filtros Avançados ▼"**
2. Painel de filtros deve expandir abaixo dos KPI cards

**Verificar**:
- [ ] Painel abre suavemente (animação)
- [ ] Exibe 7 campos de filtro em grid responsivo
- [ ] Botão muda para **"Ocultar Filtros ▲"**

#### 3.2. Filtro: Estágio
1. Clique no dropdown **"Estágio"**
2. Selecione **"Qualificação"**

**Resultado Esperado**:
- [ ] Apenas oportunidades em "Qualificação" aparecem
- [ ] Kanban: só coluna "Qualificação" tem cards
- [ ] Lista: só oportunidades de "Qualificação"
- [ ] Pipeline: só barra de "Qualificação" visível

#### 3.3. Filtro: Prioridade
1. Mantenha filtro de estágio
2. Selecione **"Prioridade: Alta"**

**Resultado Esperado**:
- [ ] Oportunidades filtradas por estágio E prioridade
- [ ] Total de oportunidades diminui
- [ ] Filtros são cumulativos (AND, não OR)

#### 3.4. Filtro: Origem
1. Selecione **"Origem: Site"** (ou outro)

**Resultado Esperado**:
- [ ] Mais uma camada de filtro aplicada
- [ ] Só oportunidades que atendem TODOS os critérios aparecem

#### 3.5. Filtro: Valor Mínimo/Máximo
1. Digite **Valor Mínimo**: 1000
2. Digite **Valor Máximo**: 50000

**Resultado Esperado**:
- [ ] Apenas oportunidades entre R$ 1.000 e R$ 50.000 aparecem
- [ ] KPI "Valor Total" é recalculado considerando filtros
- [ ] Valores fora do range são ocultados

#### 3.6. Filtro: Responsável
1. Selecione um **responsável** da lista

**Resultado Esperado**:
- [ ] Apenas oportunidades daquele responsável aparecem
- [ ] Dropdown mostra todos os responsáveis disponíveis

#### 3.7. Filtro: Busca Geral
1. Digite **"cliente"** (ou nome de oportunidade)

**Resultado Esperado**:
- [ ] Busca em tempo real (debounce 300ms)
- [ ] Filtra por: nome, empresa, cliente
- [ ] Case-insensitive (maiúsculas e minúsculas)
- [ ] Combina com filtros anteriores

#### 3.8. Limpar Filtros
1. Clique em **"Limpar Filtros"**

**Resultado Esperado**:
- [ ] Todos os filtros resetam
- [ ] Todas as oportunidades aparecem novamente
- [ ] KPI cards voltam aos valores originais
- [ ] Campos de filtro ficam vazios

#### 3.9. Fechar Painel
1. Clique em **"Ocultar Filtros ▲"**

**Resultado Esperado**:
- [ ] Painel fecha suavemente
- [ ] Filtros aplicados permanecem ativos
- [ ] Botão volta para **"Filtros Avançados ▼"**

---

### 📊 TESTE 4: Exportação CSV (Melhorado)

**Objetivo**: Validar exportação CSV com UTF-8 BOM

1. Aplique alguns filtros (ex: estágio + prioridade)
2. Clique em **"Exportar"**
3. Selecione **"CSV"**
4. Clique em **"Exportar"**

**Verificar**:
- [ ] Arquivo baixa instantaneamente
- [ ] Nome: `oportunidades_YYYY-MM-DD_HH-mm-ss.csv`
- [ ] **Abra no Excel**: caracteres especiais (ç, á, ã) aparecem corretamente
- [ ] Total de linhas = total de oportunidades filtradas

**Colunas Esperadas** (12 colunas):
```
ID | Título | Empresa | Cliente | Valor | Estágio | Prioridade | 
Origem | Responsável | Data Criação | Última Atualização | Contato
```

**Teste Especial - Caracteres**:
- [ ] "Proposta Açúcar & Café" → aparece correto no Excel
- [ ] "João" → não vira "Jo√£o"
- [ ] "Orçamento" → não vira "Or√ßamento"

---

### 📗 TESTE 5: Exportação Excel (NOVO!)

**Objetivo**: Validar exportação Excel com múltiplas sheets

1. Aplique filtros variados
2. Clique em **"Exportar"**
3. Selecione **"Excel"**
4. Clique em **"Exportar"**

**Verificar**:
- [ ] Arquivo baixa com nome: `oportunidades_YYYY-MM-DD_HH-mm-ss.xlsx`
- [ ] Tamanho do arquivo > 5KB (tem conteúdo real)

**Abrir arquivo Excel e verificar**:

#### Sheet 1: "Oportunidades"
- [ ] Contém todas as oportunidades filtradas
- [ ] **12 colunas** com mesmos dados do CSV
- [ ] Cabeçalhos em **negrito** (bold)
- [ ] Colunas com **largura automática** (readable)
- [ ] Valores monetários formatados: `R$ 1.234,56`

#### Sheet 2: "Estatísticas"
- [ ] Existe segunda aba "Estatísticas"
- [ ] Mostra resumo:
  ```
  Total de Oportunidades: [número]
  Valor Total: R$ [valor]
  Ticket Médio: R$ [valor]
  Taxa de Conversão: [%]
  ```
- [ ] Dados correspondem aos filtros aplicados
- [ ] Formatação limpa e profissional

#### Sheet 3: "Por Estágio"
- [ ] Existe terceira aba "Por Estágio"
- [ ] Tabela com breakdown por estágio:
  ```
  Estágio          | Quantidade | Valor Total  | Percentual
  -----------------|------------|--------------|------------
  Leads            | 5          | R$ 10.000    | 20%
  Qualificação     | 3          | R$ 15.000    | 30%
  ...
  ```
- [ ] Total geral na última linha
- [ ] Percentuais somam ~100%

**Teste de Fórmulas**:
- [ ] Valores são números (não texto)
- [ ] É possível criar fórmulas no Excel com os dados
- [ ] SUM() funciona nas colunas de valor

---

### 📕 TESTE 6: Exportação PDF (NOVO!)

**Objetivo**: Validar exportação PDF profissional

1. Aplique filtros (para ter conjunto menor de dados)
2. Clique em **"Exportar"**
3. Selecione **"PDF"**
4. Clique em **"Exportar"**

**Verificar**:
- [ ] Arquivo baixa: `oportunidades_YYYY-MM-DD_HH-mm-ss.pdf`
- [ ] Tamanho > 10KB (tem conteúdo)

**Abrir PDF e verificar**:

#### Cabeçalho (Header)
- [ ] **Logo/Título**: "ConectCRM" ou logo da empresa
- [ ] **Título**: "Relatório de Oportunidades"
- [ ] **Data de geração**: formato "18 de janeiro de 2025 às 14:30"
- [ ] Cor #159A9C (teal principal)

#### Resumo Estatístico
- [ ] Box com fundo colorido (#DEEFE7)
- [ ] **4 estatísticas**:
  - Total de Oportunidades
  - Valor Total (R$)
  - Ticket Médio (R$)
  - Taxa de Conversão (%)
- [ ] Valores corretos e formatados

#### Tabela de Oportunidades
- [ ] **Colunas**: Título, Empresa, Valor, Estágio, Responsável
- [ ] Cabeçalho com fundo #159A9C e texto branco
- [ ] Linhas alternadas (zebra striping) para leitura
- [ ] Alinhamento correto:
  - Texto: esquerda
  - Valores: direita
  - Estágio: centro
- [ ] Valores formatados: `R$ 1.234,56`

#### Paginação
- [ ] Se mais de 20 oportunidades: múltiplas páginas
- [ ] Cabeçalho da tabela repete em cada página
- [ ] Rodapé com número da página: "Página 1 de 3"

#### Rodapé (Footer)
- [ ] Texto: "Gerado por ConectCRM - Pipeline de Vendas"
- [ ] Data/hora de geração
- [ ] Alinhamento centralizado
- [ ] Cor cinza (#B4BEC9)

#### Qualidade Visual
- [ ] Texto legível (fonte >= 10pt)
- [ ] Margens adequadas (não colado nas bordas)
- [ ] Sem texto cortado
- [ ] Cores profissionais (tema Crevasse)
- [ ] Pronto para impressão ou compartilhamento

---

### 🔄 TESTE 7: Compatibilidade com Views

**Objetivo**: Confirmar que filtros funcionam em todas as views

#### 7.1. View Kanban
1. Aplique filtro de **Estágio: Proposta**
2. Mude para view **Kanban**

**Resultado Esperado**:
- [ ] Colunas "Leads" e "Qualificação" ficam vazias
- [ ] Apenas coluna "Proposta" tem cards
- [ ] Drag-and-drop ainda funciona
- [ ] Cards mantêm cores corretas

#### 7.2. View Lista
1. Mantenha filtro de estágio
2. Mude para view **Lista**

**Resultado Esperado**:
- [ ] Tabela mostra apenas oportunidades filtradas
- [ ] Ordenação (sort) funciona nos dados filtrados
- [ ] Ações (editar, deletar) funcionam normalmente

#### 7.3. View Pipeline
1. Aplique filtro de **Valor Mínimo: 10000**
2. Mude para view **Pipeline**

**Resultado Esperado**:
- [ ] Barras horizontais mostram apenas valores >= R$ 10.000
- [ ] Percentuais são recalculados
- [ ] Soma total corresponde ao filtro

---

### 🎨 TESTE 8: Responsividade

**Objetivo**: Garantir que funciona em diferentes tamanhos de tela

#### 8.1. Desktop (1920px)
- [ ] Filtros em grid de 3 colunas
- [ ] Todos os elementos visíveis
- [ ] Espaçamento adequado

#### 8.2. Tablet (768px)
1. Redimensione janela para ~768px (F12 → Device Toolbar)

**Verificar**:
- [ ] Filtros em grid de 2 colunas
- [ ] Kanban com scroll horizontal (se necessário)
- [ ] Botões empilham verticalmente

#### 8.3. Mobile (375px)
1. Redimensione para 375px (iPhone)

**Verificar**:
- [ ] Filtros em 1 coluna (stacked)
- [ ] Botões de ação ficam full-width
- [ ] Kanban continua funcional (scroll horizontal)
- [ ] Modal de exportação responsivo

---

### 🐛 TESTE 9: Edge Cases

**Objetivo**: Testar cenários extremos

#### 9.1. Filtros Sem Resultados
1. Aplique: **Estágio: Perdido** + **Valor Mínimo: 1000000**
2. Provavelmente não há oportunidades perdidas com R$ 1M

**Resultado Esperado**:
- [ ] Mensagem: "Nenhuma oportunidade encontrada"
- [ ] Ícone de pasta vazia
- [ ] Sugestão: "Ajuste os filtros ou crie nova oportunidade"
- [ ] KPI cards mostram ZERO (não erro)

#### 9.2. Exportar Sem Dados
1. Mantenha filtros impossíveis (0 resultados)
2. Clique em **"Exportar" → "Excel"**

**Resultado Esperado**:
- [ ] Arquivo Excel baixa normalmente
- [ ] Sheet "Oportunidades": só cabeçalho (sem linhas)
- [ ] Sheet "Estatísticas": todos zeros
- [ ] Sheet "Por Estágio": todas linhas com 0

#### 9.3. Valor Mínimo > Valor Máximo
1. Digite **Valor Mínimo: 50000**
2. Digite **Valor Máximo: 1000**
3. (Min > Max = inválido)

**Resultado Esperado**:
- [ ] Sistema aceita (não trava)
- [ ] 0 resultados (nenhuma oportunidade entre 50k e 1k)
- [ ] **OU**: campo "Valor Máximo" fica vermelho (validação)

#### 9.4. Busca com Caracteres Especiais
1. Digite na busca: `@#$%&*()`

**Resultado Esperado**:
- [ ] Não quebra a aplicação
- [ ] 0 resultados (provável)
- [ ] Não exibe erro no console

---

### ✅ TESTE 10: Performance

**Objetivo**: Garantir que filtros são rápidos

#### 10.1. Filtro em Tempo Real
1. Digite lentamente na **busca**: "o-p-o-r-t-u-n-i-d-a-d-e"
2. Observe o debounce (300ms)

**Verificar**:
- [ ] Não filtra a cada letra (debounce funciona)
- [ ] Espera 300ms após última tecla
- [ ] Sem lag ou freeze da UI

#### 10.2. Múltiplos Filtros Simultâneos
1. Aplique 6 filtros ao mesmo tempo:
   - Estágio
   - Prioridade
   - Origem
   - Valor Min
   - Valor Max
   - Responsável

**Verificar**:
- [ ] Filtro aplica instantaneamente (< 100ms)
- [ ] Não recarrega página
- [ ] KPI cards atualizam suavemente
- [ ] Sem erros no console (F12)

#### 10.3. Exportação de Muitos Dados
1. Remova todos os filtros (máximo de oportunidades)
2. Exporte para **Excel**

**Verificar**:
- [ ] Arquivo gera em < 3 segundos
- [ ] Não trava o navegador
- [ ] Arquivo completo (todas as linhas)

---

## 🎯 CRITÉRIOS DE SUCESSO

### ✅ Funcionalidades Obrigatórias
- [ ] Todos os 7 filtros funcionam individualmente
- [ ] Filtros funcionam combinados (AND)
- [ ] CSV exporta com UTF-8 correto
- [ ] Excel gera 3 sheets corretamente
- [ ] PDF tem layout profissional
- [ ] Responsivo em 3 breakpoints
- [ ] Sem erros no console

### 🎨 Qualidade Visual
- [ ] Cores vibrantes e consistentes
- [ ] Texto legível em todos os backgrounds
- [ ] Animações suaves (não abruptas)
- [ ] Ícones alinhados e proporcionais

### ⚡ Performance
- [ ] Filtros aplicam instantaneamente
- [ ] Exportação < 3 segundos
- [ ] Sem lag na digitação (busca debounced)

---

## 🐛 REGISTRO DE BUGS

**Se encontrar problemas, anote aqui**:

| # | Problema | Prioridade | Reprodução |
|---|----------|------------|------------|
| 1 |          | 🔴/🟡/🟢   |            |
| 2 |          |            |            |
| 3 |          |            |            |

**Prioridades**:
- 🔴 **Alta**: Impede uso da funcionalidade
- 🟡 **Média**: Funciona, mas tem bug visual/comportamento estranho
- 🟢 **Baixa**: Melhoria de UX, não bloqueia

---

## 📝 FEEDBACK

Após completar os testes, responda:

1. **Filtros Avançados**:
   - Intuitivos de usar? ⭐⭐⭐⭐⭐
   - Úteis para o dia-a-dia? ⭐⭐⭐⭐⭐
   - Algo faltando?

2. **Exportação**:
   - CSV funcional? ✅/❌
   - Excel profissional? ✅/❌
   - PDF pronto para impressão? ✅/❌

3. **Performance**:
   - Rápido? ✅/❌
   - Travou em algum momento? ✅/❌

4. **Próximos Passos**:
   - Pronto para continuar Sprint 4? ✅/❌
   - Algo urgente para ajustar antes? 

---

## 🚀 APÓS TESTES

**Se tudo OK** ✅:
- Marcar Sprint 4 (Filtros + Export) como **CONCLUÍDO**
- Seguir para próxima feature: **Visualização Calendário**

**Se bugs encontrados** 🐛:
- Reportar bugs na seção acima
- Priorizar correções antes de continuar

---

**Criado em**: 2025-01-18  
**Tempo estimado de testes**: 30-45 minutos  
**Versão**: 1.0
