# 🚀 GUIA RÁPIDO - Sistema de Visibilidade no Bot

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Adicionar Colunas no Banco (30 segundos)

**Opção A - PowerShell + psql:**
```powershell
psql $env:DATABASE_URL -f add-visibilidade-bot-columns.sql
```

**Opção B - pgAdmin/DBeaver/HeidiSQL:**
1. Conecte-se ao banco de dados
2. Abra uma nova query
3. Copie e execute:
```sql
ALTER TABLE nucleos_atendimento 
ADD COLUMN IF NOT EXISTS visivel_no_bot BOOLEAN DEFAULT true;

ALTER TABLE departamentos 
ADD COLUMN IF NOT EXISTS visivel_no_bot BOOLEAN DEFAULT true;
```

### 2️⃣ Testar Interface (2 minutos)

1. Acesse: http://localhost:3000/configuracoes/nucleos
2. Clique em "Novo Núcleo"
3. Veja o checkbox **"✓ Visível no Bot"** (marcado por padrão)
4. Preencha o formulário e salve
5. Na listagem, veja o badge **"👁️ Visível"**
6. Edite e desmarque o checkbox
7. Badge muda para **"🚫 Oculto"**

### 3️⃣ Testar Endpoint (2 minutos)

1. Faça login no sistema
2. Abra DevTools (F12) > Network
3. Clique em qualquer requisição autenticada
4. Copie o valor do header **Authorization: Bearer xxx**
5. Execute no PowerShell:

```powershell
$token = "COLE_O_TOKEN_AQUI"
$headers = @{ "Authorization" = "Bearer $token" }
$response = Invoke-RestMethod -Uri "http://localhost:3001/nucleos/bot/opcoes" -Headers $headers
$response | ConvertTo-Json -Depth 10
```

**Resultado esperado:**
```json
[
  {
    "id": "uuid",
    "nome": "Suporte Técnico",
    "cor": "#3B82F6",
    "departamentos": [...]
  }
]
```

---

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `README_VISIBILIDADE_BOT.md` | 📖 Guia visual completo |
| `SISTEMA_VISIBILIDADE_BOT.md` | 📚 Documentação técnica |
| `IMPLEMENTACAO_VISIBILIDADE_BOT_COMPLETA.md` | ✅ Checklist |
| `RESUMO_EXECUTIVO_VISIBILIDADE_BOT.txt` | 📋 Resumo executivo |
| `add-visibilidade-bot-columns.sql` | 🗄️ Script SQL |
| `test-bot-visibility.ps1` | 🧪 Script de teste |

---

## 🎨 O que mudou na interface?

### Gestão de Núcleos
```
Formulário:
┌────────────────────────────────────┐
│ ☑ Núcleo Ativo                    │
│ ☑ Visível no Bot                  │  ← NOVO
│   (permite seleção por clientes)   │
└────────────────────────────────────┘

Tabela:
┌────────┬────────┬─────────────┐
│ Nome   │ Status │ Bot         │  ← NOVA COLUNA
├────────┼────────┼─────────────┤
│ Vendas │ ✅ Ativo│ 👁️ Visível │
└────────┴────────┴─────────────┘
```

### Gestão de Departamentos
```
Formulário:
┌────────────────────────────────────┐
│ ☑ Departamento Ativo              │
│ ☑ Visível no Bot                  │  ← NOVO
└────────────────────────────────────┘

Lista (badge nas métricas):
SAC - Atendimento
🎯 Suporte │ 👥 5 atendentes │ 👁️ Visível no Bot  ← NOVO
```

---

## 🔧 Integração com Bot (próximo passo)

### Usar no FluxoTriagem:

```typescript
// Buscar opções disponíveis
const response = await axios.get('/nucleos/bot/opcoes', {
  headers: { Authorization: `Bearer ${token}` }
});

// Criar menu interativo WhatsApp
const buttons = response.data.map(nucleo => ({
  id: nucleo.id,
  title: nucleo.nome
}));

await whatsapp.sendButtons(telefone, {
  text: 'Selecione o setor desejado:',
  buttons
});
```

---

## ❓ Troubleshooting

**Erro: "column visivel_no_bot does not exist"**
→ Execute o SQL do passo 1️⃣

**Backend não está rodando**
→ Execute: `npm run start:dev` na pasta backend

**Checkbox não aparece no formulário**
→ Certifique-se que o frontend foi recompilado após as alterações

**Endpoint retorna 401**
→ Normal! Significa que está funcionando, só precisa de autenticação

---

## 📞 Suporte

Leia a documentação completa em:
- `README_VISIBILIDADE_BOT.md` - Guia visual completo
- `SISTEMA_VISIBILIDADE_BOT.md` - Documentação técnica detalhada

---

## ✅ Checklist Rápido

- [ ] Executei o SQL para adicionar as colunas
- [ ] Testei criar um núcleo com checkbox marcado
- [ ] Vi o badge "👁️ Visível" na listagem
- [ ] Testei desmarcar o checkbox
- [ ] Vi o badge mudar para "🚫 Oculto"
- [ ] Testei o endpoint com token JWT
- [ ] Recebi JSON com núcleos e departamentos

**Tudo OK?** → Sistema pronto para uso! 🎉
