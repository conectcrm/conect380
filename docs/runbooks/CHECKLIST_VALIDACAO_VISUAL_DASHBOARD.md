# ✅ Checklist de Validação Visual - Dashboard

**Acesse**: http://localhost:3000/dashboard

---

## 🎯 Validação Visual dos Gráficos

### 1️⃣ Gráfico de Vendas vs Meta (Barras - Superior Esquerdo)

- [ ] Gráfico de barras renderizando
- [ ] Eixo X com meses (Jan, Fev, Mar, Abr, Mai, Jun, Jul)
- [ ] Eixo Y com valores em "R$ XXXk"
- [ ] **2 barras por mês**: 
  - Barra verde-água (#159A9C) = Vendas
  - Barra laranja (#F59E0B) = Meta
- [ ] Tooltip aparece ao passar mouse
- [ ] Tooltip mostra: "Vendas: R$ XXX.XXX" e "Meta: R$ XXX.XXX"

**Valores esperados** (mock data):
- Jan: Vendas R$ 125k, Meta R$ 150k
- Fev: Vendas R$ 145k, Meta R$ 150k
- Mar: Vendas R$ 165k, Meta R$ 180k

---

### 2️⃣ Gráfico de Propostas por Status (Pizza - Superior Direito)

- [ ] Gráfico de pizza (donut) renderizando
- [ ] **4 fatias coloridas**:
  - 🟡 Amarelo (#F59E0B) = Em Análise (25%)
  - 🟢 Verde (#10B981) = Aprovadas (25%)
  - 🔴 Vermelho (#EF4444) = Rejeitadas (25%)
  - 🔵 Azul (#3B82F6) = Aguardando (25%)
- [ ] Legenda abaixo do gráfico
- [ ] Tooltip mostra percentual ao passar mouse

**Valores esperados** (mock data):
- Cada status com 25% (distribuição igual)

---

### 3️⃣ Funil de Vendas (Barras Horizontais - Inferior Esquerdo)

- [ ] 5 barras horizontais renderizando
- [ ] Barras com cores diferentes (gradiente)
- [ ] Largura decrescente (funil):
  - Leads: 100% (maior barra)
  - Qualificados: ~60%
  - Propostas: ~26%
  - Negociação: ~14%
  - Fechamento: ~7% (menor barra)
- [ ] Cada etapa mostra:
  - Nome da etapa
  - Quantidade de leads
  - Valor em oportunidades (R$ X.XXX.XXX)

**Valores esperados** (mock data):
- Leads: 1.250 leads - R$ 2.500.000
- Qualificados: 750 leads - R$ 1.875.000
- Propostas: 320 leads - R$ 1.280.000
- Negociação: 180 leads - R$ 900.000
- Fechamento: 85 leads - R$ 510.000

---

### 4️⃣ Performance dos Vendedores (Barras Horizontais - Inferior Centro)

- [ ] Gráfico de barras horizontais renderizando
- [ ] 5 vendedores listados
- [ ] Barras verdes (#10B981)
- [ ] Nome do vendedor no eixo Y
- [ ] Valor de vendas no eixo X (R$ XXXk)
- [ ] Tooltip mostra valor total ao passar mouse

**Valores esperados** (mock data):
- João Silva: R$ 185.000
- Maria Santos: R$ 165.000
- Ana Oliveira: R$ 145.000
- Pedro Costa: R$ 125.000
- Carlos Lima: R$ 95.000

---

### 5️⃣ Atividades Mensais (Área Empilhada - Inferior Direito)

- [ ] Gráfico de área empilhada renderizando
- [ ] Eixo X com meses (Jan a Jul)
- [ ] **3 áreas sobrepostas**:
  - 🟦 Verde-água (#159A9C) = Reuniões (embaixo)
  - 🟩 Verde (#10B981) = Ligações (meio)
  - 🟦 Azul (#3B82F6) = E-mails (topo)
- [ ] Legenda abaixo com as 3 categorias
- [ ] Tooltip mostra valores ao passar mouse
- [ ] Áreas preenchidas com opacidade

**Valores esperados** (mock data):
- Jan: 45 reuniões, 125 ligações, 280 emails
- Jul: 65 reuniões, 185 ligações, 340 emails

---

## 🔍 Validações Técnicas (Console - F12)

### Network Tab
- [ ] Requisição `GET /dashboard/resumo?periodo=mensal`
- [ ] Status: **200 OK**
- [ ] Response contém `chartsData` com 4 arrays
- [ ] Tempo de resposta < 200ms

### Console Tab
- [ ] **Sem erros vermelhos**
- [ ] Pode ter warnings amarelos (deprecation) - OK
- [ ] Sem erros de props ou TypeScript
- [ ] Sem erros "undefined" ou "null"

### Application Tab (Storage)
- [ ] localStorage contém token de autenticação (se aplicável)
- [ ] Sem erros de CORS

---

## 🎨 Validações de UX

### Responsividade
- [ ] Desktop (1920px): 2 colunas na primeira linha, 3 na segunda
- [ ] Tablet (768px): 1 coluna por linha
- [ ] Mobile (375px): Todos gráficos em coluna única

### Loading States
- [ ] Ao entrar na página, mostra loading (se implementado)
- [ ] Gráficos aparecem após carregamento

### Filtros (se visíveis)
- [ ] Dropdown de período funciona
- [ ] Alterar período → Gráficos recarregam
- [ ] Loading durante recarga

---

## ❌ Problemas Comuns e Soluções

### Gráficos não aparecem
**Possível causa**: Dados não chegando do backend
**Solução**: 
1. Abrir DevTools (F12)
2. Network tab → Verificar requisição /resumo
3. Se erro 404/500 → Backend não está rodando
4. Se 200 OK mas sem gráficos → Verificar console por erros

### Gráficos com dados "undefined"
**Possível causa**: Tipagem TypeScript incorreta
**Solução**:
1. Console → Ver erro específico
2. Verificar se `data.chartsData` existe
3. Verificar se props estão sendo passadas

### Erro CORS
**Possível causa**: Backend não configurado
**Solução**:
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:3000'
});
```

### Página em branco
**Possível causa**: Erro de compilação React
**Solução**:
1. Terminal frontend → Ver erro de compilação
2. Verificar imports (podem estar errados)
3. Rodar `npm start` novamente

---

## ✅ Critério de Sucesso

**A integração está COMPLETA se**:

- ✅ Todos os 5 gráficos renderizam visualmente
- ✅ Nenhum erro vermelho no console
- ✅ Network tab mostra /resumo com status 200
- ✅ Response do /resumo contém `chartsData`
- ✅ Tooltip funciona ao passar mouse
- ✅ Dados mockados aparecem corretamente

---

## 🎉 Se Tudo Passou

**PARABÉNS! A integração do dashboard está 100% funcional!**

Próximos passos recomendados:
1. ✅ Testar com dados reais (inserir propostas no banco)
2. ✅ Testar filtros (alterar período, vendedor)
3. ✅ Testar auto-refresh (aguardar 15 minutos)
4. ✅ Testar em diferentes resoluções (mobile, tablet)
5. ✅ Deploy para staging/produção

---

**Data**: 28 de novembro de 2025  
**Validado por**: [SEU NOME]  
**Status**: [ ] Pendente | [ ] Aprovado | [ ] Com Ressalvas
