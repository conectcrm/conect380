# ✅ Guia de Teste Manual - Integração Propostas ↔ Oportunidades

**Data**: 02/12/2025  
**Tempo estimado**: 5-10 minutos

---

## 🎯 Objetivo

Validar manualmente que a integração entre **Propostas** e **Pipeline de Vendas** está funcionando corretamente.

---

## 📋 Pré-requisitos

- ✅ Backend rodando: `http://localhost:3001`
- ✅ Frontend rodando: `http://localhost:3000`
- ✅ Credenciais: `admin@conectsuite.com.br` / `admin123`

---

## 🧪 Cenário 1: Gerar Proposta de Oportunidade

### Passo 1: Acessar Pipeline de Vendas

1. Abra o navegador em: `http://localhost:3000`
2. Faça login com:
   - Email: `admin@conectsuite.com.br`
   - Senha: `admin123`
3. Navegue até: **Comercial → Pipeline de Vendas**
   - URL: `http://localhost:3000/comercial/pipeline`

### Passo 2: Localizar Botão "Proposta"

1. **Visualização Kanban**:
   - Localize um card de oportunidade
   - Na parte inferior do card, você verá 3 botões:
     - **Editar** (cinza)
     - **Proposta** (verde) ← **Este é o novo botão!**
     - **Deletar** (vermelho)

2. **Visualização Lista**:
   - Alterne para visualização de lista (ícone no topo)
   - Na coluna "Ações", você verá ícones:
     - **Editar** (lápis)
     - **Proposta** (documento) ← **Este é o novo ícone!**
     - **Deletar** (lixeira)

### Passo 3: Gerar Proposta

1. Clique no botão/ícone **"Proposta"**
2. ✅ **Resultado Esperado**:
   - Toast de sucesso: "Proposta gerada com sucesso!"
   - Redirecionamento para página de Propostas
   - Nova proposta aparece na lista

### Passo 4: Verificar Vínculo

1. Na página de Propostas, localize a proposta recém-criada
2. ✅ **Resultado Esperado**:
   - Abaixo do número e título da proposta
   - Há uma **badge verde** com ícone de alvo
   - Badge mostra o título da oportunidade original

**Exemplo visual**:
```
Proposta #2025001
"Proposta para Cliente XYZ"
Criada em 02/12/2025

🎯 Oportunidade Lead Comercial  ← Badge de vínculo
```

---

## 🔄 Cenário 2: Sincronização Automática - Aprovação

### Passo 1: Aprovar Proposta

1. Na tela de Propostas, encontre uma proposta vinculada
2. Clique em **"Aprovar"** (ou mude status para "Aprovada")
3. ✅ **Resultado Esperado**:
   - Proposta marcada como "Aprovada"
   - Toast de confirmação

### Passo 2: Verificar Sincronização

1. Volte para: **Comercial → Pipeline de Vendas**
2. Localize a oportunidade original
3. ✅ **Resultado Esperado**:
   - Oportunidade movida automaticamente para coluna **"Ganho"**
   - Data de fechamento registrada

---

## 🔄 Cenário 3: Sincronização Automática - Rejeição

### Passo 1: Rejeitar Proposta

1. Na tela de Propostas, encontre outra proposta vinculada
2. Clique em **"Rejeitar"** (ou mude status para "Rejeitada")
3. ✅ **Resultado Esperado**:
   - Proposta marcada como "Rejeitada"
   - Toast de confirmação

### Passo 2: Verificar Sincronização

1. Volte para: **Comercial → Pipeline de Vendas**
2. Localize a oportunidade original
3. ✅ **Resultado Esperado**:
   - Oportunidade movida automaticamente para coluna **"Perdido"**
   - Data de fechamento registrada

---

## 🛠️ Cenário 4: Verificar Histórico (Backend)

### Via Console do Navegador (F12)

1. Na página de Pipeline, abra **DevTools** (F12)
2. Vá para aba **"Network"**
3. Clique no botão "Proposta"
4. ✅ **Resultado Esperado**:
   - Requisição: `POST /oportunidades/{id}/gerar-proposta`
   - Status: `201 Created`
   - Response body contém:
     ```json
     {
       "success": true,
       "message": "Proposta gerada com sucesso",
       "proposta": {
         "id": "...",
         "numero": "2025001",
         "oportunidade_id": 123
       }
     }
     ```

### Via Histórico da Oportunidade

1. Clique na oportunidade para ver detalhes
2. Acesse aba **"Atividades"** ou **"Histórico"**
3. ✅ **Resultado Esperado**:
   - Atividade registrada: "Proposta #2025001 gerada automaticamente"
   - Data/hora do registro

---

## ❌ Problemas Comuns

### Erro: "empresaId é obrigatório"

**Causa**: Sistema precisa de uma empresa cadastrada  
**Solução**:
1. Vá para: **Configurações → Gestão de Empresas**
2. Crie uma empresa nova
3. Tente gerar proposta novamente

### Botão "Proposta" não aparece

**Causa**: Frontend não foi atualizado  
**Solução**:
```bash
cd frontend-web
npm start
# Aguarde rebuild
# Recarregue página (Ctrl+F5)
```

### Sincronização não funciona

**Causa**: Backend não está rodando ou migration não foi aplicada  
**Solução**:
```bash
cd backend
npm run migration:run
npm run start:dev
```

### Badge de oportunidade não aparece

**Causa**: Proposta foi criada antes da integração  
**Solução**: Gere uma nova proposta usando o botão do Pipeline

---

## ✅ Checklist Final

Marque cada item conforme testar:

- [ ] Botão "Proposta" aparece nos cards do Kanban
- [ ] Botão "Proposta" aparece na visualização de lista
- [ ] Clicar no botão cria proposta e redireciona
- [ ] Badge de oportunidade aparece na proposta criada
- [ ] Aprovar proposta move oportunidade para "Ganho"
- [ ] Rejeitar proposta move oportunidade para "Perdido"
- [ ] Atividade é registrada no histórico da oportunidade
- [ ] Endpoint retorna status 201 e proposta.oportunidade_id preenchido

---

## 📸 Screenshots Recomendados

Para documentação futura, tire prints de:

1. **Botão "Proposta"** no card do Kanban
2. **Badge de oportunidade** na tela de Propostas
3. **Oportunidade "Ganho"** após aprovação
4. **Atividade no histórico** da oportunidade

---

## 🎉 Conclusão

Se todos os itens do checklist estão ✅, a integração está **100% funcional**!

**Próximos passos**:
- Deploy em staging
- Testes E2E automatizados (Playwright)
- Treinamento da equipe comercial

---

**Documentação relacionada**:
- `INTEGRACAO_PROPOSTAS_OPORTUNIDADES_CONCLUIDA.md` - Detalhes técnicos
- `ANALISE_ALINHAMENTO_PROPOSTAS_VENDAS.md` - Análise inicial

**Autor**: GitHub Copilot  
**Última atualização**: 02/12/2025
