# 🐛 DEBUG - Templates não aparecem

**Data**: 7/nov/2025 - 21:10  
**Status**: Investigando por que templates não são exibidos

---

## 🔍 Checklist de Diagnóstico

### 1. ✅ Verificar Console do Navegador (F12)

Abra o DevTools (F12) e veja se há logs:

**Logs esperados** (após recarregar a página):
```
🔍 Carregando templates para empresaId: empresa-default
🌐 Requisição para: /atendimento/templates?empresaId=empresa-default
📨 Resposta completa: {data: {...}, status: 200, ...}
📦 response.data: {success: true, message: "...", data: [...]}
🎯 response.data.data: [array de templates]
✅ Templates extraídos: [...]
📊 Tipo dos dados: object É array? true
✅ Templates processados: X itens
```

**Se houver erro**:
```
❌ Erro ao carregar templates: AxiosError {...}
```

---

### 2. ✅ Verificar Network (Aba Network no F12)

1. Recarregue a página (Ctrl + F5)
2. Aba Network > Filtrar por "templates"
3. Procure por: `GET /atendimento/templates?empresaId=...`

**Status esperado**: 200 OK  
**Response esperada**:
```json
{
  "success": true,
  "message": "Templates listados com sucesso",
  "data": []  // Array vazio se não há templates
}
```

**Se retornar 401**: Problema de autenticação (JWT)  
**Se retornar 400**: Problema com empresaId  
**Se retornar 404**: Rota não encontrada  
**Se retornar 500**: Erro no backend

---

### 3. ✅ Verificar Backend

No terminal do backend, veja se há logs:

```bash
cd C:\Projetos\conectcrm\backend
# Ver se está rodando
netstat -ano | findstr ":3001"

# Ver logs em tempo real
npm run start:dev
```

---

### 4. ✅ Testar Criação de Template

1. **Clicar** em "Criar Primeiro Template" (botão roxo no centro)
2. **Preencher** formulário:
   - Nome: "Teste Debug"
   - Conteúdo: "Conteúdo de teste"
3. **Clicar** em "Salvar"

**O que deve acontecer**:
- Toast verde: "Template criado com sucesso!"
- Modal fecha
- Template aparece na lista

**Se der erro**:
- Toast vermelho com mensagem
- Verificar console (F12)
- Verificar Network > POST /atendimento/templates

---

### 5. ✅ Inserir Template Manualmente no Banco

Se quiser garantir que há dados no banco:

```sql
-- Execute no PostgreSQL
INSERT INTO message_templates (
  id, nome, conteudo, categoria, atalho, variaveis, ativo, "empresaId", "createdAt", "updatedAt"
) VALUES (
  'test-123', 'Teste Manual', 'Conteúdo teste', 'Testes', 'teste', 
  ARRAY['{{nome}}'], true, 'empresa-default', NOW(), NOW()
);
```

Depois recarregue a página.

---

## 🎯 Possíveis Causas

### Causa 1: Banco vazio (mais provável)
- ✅ **Solução**: Criar primeiro template via UI
- Template será criado com empresaId do localStorage

### Causa 2: EmpresaId diferente
- Se localStorage tem empresaId diferente de 'empresa-default'
- Templates foram criados com outro empresaId
- ✅ **Solução**: Verificar `localStorage.getItem('empresaId')`

### Causa 3: JWT expirado
- Requisição retorna 401
- ✅ **Solução**: Fazer login novamente

### Causa 4: Backend não está rodando
- Porta 3001 não responde
- ✅ **Solução**: Iniciar backend: `npm run start:dev`

### Causa 5: Erro na extração dos dados
- Backend retorna dados mas frontend não processa
- ✅ **Solução**: Já corrigido com logs de debug

---

## 📊 Comandos de Diagnóstico

### Verificar empresaId no navegador
```javascript
// No console (F12)
console.log('empresaId:', localStorage.getItem('empresaId'));
```

### Testar endpoint diretamente
```bash
curl http://localhost:3001/atendimento/templates?empresaId=empresa-default \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Verificar tabela no banco
```sql
-- No PostgreSQL
SELECT COUNT(*) FROM message_templates;
SELECT * FROM message_templates WHERE "empresaId" = 'empresa-default';
```

---

## ✅ Próximos Passos

1. **Abrir F12** no navegador
2. **Recarregar** a página (Ctrl + F5)
3. **Verificar** logs no console
4. **Reportar** o que aparece:
   - Logs no console
   - Status da requisição (Network tab)
   - Erros (se houver)

---

**Aguardando informações do console para continuar o debug!** 🔍
