# 🚀 Como Reiniciar o Backend

## ❌ Problema Atual
```
PUT http://localhost:3001/nucleos/xxx net::ERR_CONNECTION_REFUSED
```

O backend caiu e precisa ser reiniciado.

---

## ✅ Solução Rápida

### 1️⃣ Abrir Terminal na Pasta Backend
```powershell
cd C:\Projetos\conectcrm\backend
```

### 2️⃣ Iniciar Backend em Modo Dev
```powershell
npm run start:dev
```

### 3️⃣ Aguardar Mensagem de Sucesso
Você verá algo como:
```
[Nest] 12345  - 17/10/2025 10:30:00     LOG [NestApplication] Nest application successfully started +2ms
[Nest] 12345  - 17/10/2025 10:30:00     LOG Backend rodando na porta 3001
```

### 4️⃣ Testar no Frontend
- Acesse a página de Gestão de Núcleos
- Clique em "Editar" em algum núcleo
- Desmarque "Visível no Bot"
- Clique em "Salvar"
- ✅ Deve salvar sem erros

---

## 🔍 Verificar se Backend Está Rodando

### Método 1: Terminal
Procure por terminal com:
```
npm run start:dev
```

### Método 2: Navegador
Abra: http://localhost:3001/health

Deve retornar:
```json
{
  "status": "ok"
}
```

### Método 3: Task Manager
Procure por processo `node.exe` rodando na porta 3001

---

## 🛠️ Se Não Iniciar

### Erro: "Port 3001 is already in use"
```powershell
# Encontrar processo na porta 3001
netstat -ano | findstr :3001

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Tentar novamente
npm run start:dev
```

### Erro: Dependências
```powershell
# Reinstalar dependências
npm install

# Tentar novamente
npm run start:dev
```

### Erro: Build
```powershell
# Limpar e recompilar
npm run build

# Iniciar
npm run start:dev
```

---

## 📋 Checklist Completo

- [ ] Navegar para `C:\Projetos\conectcrm\backend`
- [ ] Executar `npm run start:dev`
- [ ] Ver mensagem "Backend rodando na porta 3001"
- [ ] Testar no navegador: http://localhost:3001/health
- [ ] Atualizar página do frontend
- [ ] Editar núcleo e desmarcar "Visível no Bot"
- [ ] Salvar e verificar que não há erro `ERR_CONNECTION_REFUSED`
- [ ] Verificar no banco que `visivel_no_bot = false`

---

## 🧪 Como Testar a Funcionalidade

### 1. Editar Núcleo
1. Acesse: http://localhost:3000/configuracoes/nucleos
2. Clique em "Editar" no núcleo "Suporte"
3. **Desmarque** ☐ Visível no Bot
4. Clique em "Salvar"
5. ✅ Deve salvar sem erros

### 2. Verificar na Tabela
O badge deve mudar de:
- **Antes:** 👁️ Visível (azul)
- **Depois:** 🚫 Oculto (cinza)

### 3. Verificar no Endpoint
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/nucleos/bot/opcoes" `
  -Headers @{ Authorization = "Bearer SEU_TOKEN" }
```

O núcleo "Suporte" **NÃO deve aparecer** na lista.

### 4. Verificar no Banco
```sql
SELECT nome, ativo, visivel_no_bot 
FROM nucleos_atendimento 
WHERE nome = 'Suporte';
```

Deve mostrar: `visivel_no_bot = false`

---

## 🎯 Resumo

**O código está correto!** O problema é só o backend offline.

**Ação necessária:**
1. Abrir terminal em `backend/`
2. Rodar `npm run start:dev`
3. Aguardar inicialização
4. Testar novamente no frontend

---

## 📞 Precisa de Ajuda?

Se após reiniciar o backend o problema persistir, verifique:
- [ ] Console do navegador (F12) - mensagens de erro
- [ ] Terminal do backend - erros de inicialização
- [ ] Porta 3001 está livre
- [ ] Conexão com banco de dados PostgreSQL

---

## ✨ Melhoria Aplicada

Quando reiniciar, você terá a **melhoria de filtro de núcleos vazios** ativa! 🎉

Núcleos sem departamentos visíveis não aparecerão mais no bot.
