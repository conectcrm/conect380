# ⚡ COMANDOS PRONTOS - Testes Store Zustand

**Use este arquivo para copiar/colar comandos rapidamente**

---

## 🚀 1. Iniciar Ambiente de Desenvolvimento

### Backend (Terminal 1)

```powershell
# Navegar para pasta backend
cd C:\Projetos\conectcrm\backend

# Iniciar servidor NestJS (porta 3001)
npm run start:dev
```

**Espera-se ver**:
```
[Nest] 26312  - 06/11/2025, 18:00:00     LOG [NestFactory] Starting Nest application...
[Nest] 26312  - 06/11/2025, 18:00:01     LOG [InstanceLoader] AppModule dependencies initialized +100ms
[Nest] 26312  - 06/11/2025, 18:00:02     LOG [NestApplication] Nest application successfully started +200ms
Application is running on: http://localhost:3001
```

---

### Frontend (Terminal 2 - Nova Janela)

```powershell
# Navegar para pasta frontend
cd C:\Projetos\conectcrm\frontend-web

# Iniciar servidor React (porta 3000)
npm start
```

**Espera-se ver**:
```
Compiled successfully!

You can now view frontend-web in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

---

## 🧪 2. Verificar Se Está Rodando

### Verificar Backend

```powershell
# Ver se porta 3001 está em uso
netstat -ano | findstr :3001
```

**Espera-se ver**:
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       26312
```

### Verificar Frontend

```powershell
# Ver se porta 3000 está em uso
netstat -ano | findstr :3000
```

**Espera-se ver**:
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       28456
```

### Testar Backend (API)

```powershell
# Testar endpoint de health
curl http://localhost:3001

# OU testar endpoint de atendimentos
curl http://localhost:3001/api/atendimentos
```

---

## 🌐 3. Abrir Aplicação no Navegador

```powershell
# Abrir navegador no chat
start http://localhost:3000/chat
```

---

## 🔧 4. Se Algo Não Funcionar

### Backend Não Inicia (Porta Ocupada)

```powershell
# 1. Identificar processo na porta 3001
netstat -ano | findstr :3001
# Anote o PID (última coluna)

# 2. Matar processo (substitua 12345 pelo PID real)
Stop-Process -Id 12345 -Force

# 3. Iniciar novamente
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

### Frontend Não Inicia (Porta Ocupada)

```powershell
# 1. Identificar processo na porta 3000
netstat -ano | findstr :3000
# Anote o PID

# 2. Matar processo
Stop-Process -Id <PID> -Force

# 3. Iniciar novamente
cd C:\Projetos\conectcrm\frontend-web
npm start
```

### Erro de Dependências

```powershell
# Backend - Reinstalar dependências
cd C:\Projetos\conectcrm\backend
Remove-Item -Recurse -Force node_modules
npm install

# Frontend - Reinstalar dependências
cd C:\Projetos\conectcrm\frontend-web
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📋 5. Checklist Rápido de Testes

**Copie esta lista e vá marcando conforme testar**:

```
TESTES STORE ZUSTAND:

[ ] 1. Backend rodando (porta 3001)?
[ ] 2. Frontend rodando (porta 3000)?
[ ] 3. Navegador aberto em http://localhost:3000/chat?
[ ] 4. DevTools aberto (F12)?
[ ] 5. Redux tab mostra "atendimentoStore"?
[ ] 6. Tickets carregam na sidebar?
[ ] 7. Clicar em ticket → mensagens carregam?
[ ] 8. Enviar mensagem → aparece no chat?
[ ] 9. Console sem erros vermelhos?
[ ] 10. Network: requests retornam 200/201?

TESTE MULTI-TAB:
[ ] 11. Abrir 2 abas do navegador
[ ] 12. Selecionar mesmo ticket em ambas
[ ] 13. Enviar mensagem em uma aba
[ ] 14. Mensagem aparece na outra aba (<1s)?

TESTE PERSISTÊNCIA:
[ ] 15. Selecionar um ticket
[ ] 16. Recarregar página (F5)
[ ] 17. Ticket continua selecionado?

SCORE: ____/17

✅ APROVADO se ≥ 12/17 (70%)
```

---

## 🎯 6. Após Testes Aprovados

### Marcar Etapa 2 como Concluída

```powershell
# Abrir arquivo de progresso no VS Code
code C:\Projetos\conectcrm\CHECKLIST_PROGRESSO_VISUAL.md

# Atualizar linha da Etapa 2:
# ██████████████████████████████ 100%  ✅ COMPLETO
```

### Atualizar Documentação

```markdown
Em PROXIMOS_PASSOS_ACAO_IMEDIATA.md:

✅ Etapa 2: Store Zustand (Zustand) - 100% COMPLETO
   - Store criada: ✅
   - Hooks integrados: ✅
   - WebSocket conectado: ✅
   - Testes validados: ✅
```

### Começar Próxima Etapa

```markdown
🎯 PRIORIDADE 2 (Próximos 5-7 dias):

Auto-distribuição de Filas:
- Algoritmos de distribuição
- Regras de negócio
- UI de configuração
- Testes de carga
```

---

## 📚 7. Arquivos de Referência

**Documentação Criada Hoje**:
```
C:\Projetos\conectcrm\TESTE_STORE_ZUSTAND_FINAL.md
C:\Projetos\conectcrm\CONCLUSAO_INTEGRACAO_STORE.md
C:\Projetos\conectcrm\RESUMO_SESSAO_06NOV2025.md
C:\Projetos\conectcrm\COMANDOS_PRONTOS_TESTES.md (este arquivo)
```

**Código Principal**:
```
C:\Projetos\conectcrm\frontend-web\src\stores\atendimentoStore.ts
C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\hooks\useAtendimentos.ts
C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\hooks\useMensagens.ts
C:\Projetos\conectcrm\frontend-web\src\features\atendimento\omnichannel\ChatOmnichannel.tsx
```

---

## 🆘 8. Em Caso de Erro

### Erro 404 - Endpoint não encontrado

```
Problema: GET http://localhost:3001/api/atendimentos → 404

Solução:
1. Verificar se backend está rodando
2. Verificar logs do backend
3. Verificar se migration rodou: npm run migration:run
```

### Erro de CORS

```
Problema: blocked by CORS policy

Solução:
1. Verificar backend/src/main.ts tem:
   app.enableCors({ origin: 'http://localhost:3000' });
2. Reiniciar backend
```

### Store não aparece no Redux DevTools

```
Problema: Redux tab vazia

Solução:
1. Instalar extensão Redux DevTools:
   https://chrome.google.com/webstore/detail/redux-devtools
2. Recarregar página (F5)
3. Verificar se devtools middleware está ativo em atendimentoStore.ts
```

### Mensagens não sincronizam (multi-tab)

```
Problema: Enviar em aba 1 não aparece em aba 2

Solução:
1. Verificar WebSocket conectado (console deve mostrar "WebSocket connected")
2. Verificar callbacks do useWebSocket em ChatOmnichannel.tsx
3. Verificar se localStorage está habilitado no navegador
```

---

## ✅ 9. Critério de Sucesso

**APROVADO se**:
- Score ≥ 12/17 (70%) nos testes
- Console sem erros críticos (warnings são OK)
- WebSocket sincroniza em <1s
- Persistência funciona após F5

**APROVADO COM RESSALVAS se**:
- Score 10-11/17 (60-65%)
- Alguns bugs não críticos
- Performance aceitável

**REPROVADO se**:
- Score <10/17 (<60%)
- Erros críticos bloqueantes
- WebSocket não conecta

---

## 🎓 10. Próximo Passo

**Se APROVADO**:
1. Marcar Etapa 2 como 100%
2. Começar Auto-distribuição de Filas
3. Rating: 8.5 → 9.0/10

**Se REPROVADO**:
1. Revisar logs de erro
2. Consultar `TESTE_STORE_ZUSTAND_FINAL.md` seção "Se Algum Teste Falhar"
3. Corrigir problemas
4. Re-testar

---

**BOA SORTE!** 🚀

Qualquer dúvida, consulte:
- `TESTE_STORE_ZUSTAND_FINAL.md` - Detalhes dos testes
- `CONCLUSAO_INTEGRACAO_STORE.md` - Resumo executivo
- `RESUMO_SESSAO_06NOV2025.md` - Contexto da sessão
