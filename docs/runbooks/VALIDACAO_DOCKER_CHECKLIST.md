# ✅ Checklist de Validação Docker (Hot Reload + Bootstrap)

Use esta lista sempre que aplicar alterações no ambiente Docker. Marque cada etapa e registre evidências (logs, screenshots, hash do commit).

## 1. Preparação
- [ ] Atualizar o repositório (`git pull`) e instalar dependências necessárias.
- [ ] Verificar se não há containers ativos: `docker ps`.
- [x] (Opcional) Rodar `scripts/validate-docker.ps1 -FreshStart` para subir os serviços automaticamente e já checar /health. _(28/11/2025 – ambiente subiu limpo e ambos healthchecks responderam 200.)_
- [ ] Caso não use o script, limpar estado anterior manualmente: `docker compose down -v`.

## 2. Validação do Hot Reload (Backend)
1. `.\docker-helper.ps1 dev -Follow` (ou `docker compose up backend postgres redis -d`).
2. Confirmar log `Nest application successfully started`.
3. Editar qualquer arquivo em `backend/src` (ex.: adicionar comentário em `main.ts`).
4. Observar no terminal a mensagem `File change detected` seguida de `Successfully compiled`.
5. Desfazer a alteração e garantir que o hot reload dispare novamente.

> **Resultado esperado:** tempo de recompilação < 3s e API respondendo `200` em `http://localhost:3001/health`.

## 3. Validação do Hot Reload (Frontend)
1. Com o ambiente dev ativo, acessar `http://localhost:3000`.
2. Editar um componente simples (`frontend-web/src/App.tsx`, por exemplo) e salvar.
3. Confirmar que o navegador atualiza automaticamente sem rebuild manual.
4. Verificar no console do container `frontend-dev` a mensagem `webpack compiled successfully`.

## 4. Testes Funcionais Rápidos
- [ ] `curl http://localhost:3001/health` retorna `{"status":"ok"}`.
- [ ] WebSocket conecta (ver log `Cliente conectado`).
- [ ] Login básico no frontend (se possível) utilizando usuários de teste.

## 5. Bootstrap Completo Pós-Limpeza
1. `docker compose down -v`.
2. `docker compose build backend frontend-dev`.
3. `docker compose up -d` (ou `.\docker-helper.ps1 dev`).
4. Garantir que todos os containers ficam `healthy` (`docker compose ps`).

> Documente o tempo total desde `up` até tudo ficar saudável. Esperado: < 60s no backend, < 20s no frontend.

## 6. Registro
- [x] Atualizar `RELATORIO_ANALISE_DOCKER.md` marcando os itens 8.5 adequadamente. _(Seção 8.5 preenchida com evidências da execução em 28/11/2025.)_
- [ ] Se algum passo falhar, anotar detalhes e abrir issue antes de marcar a checklist como concluída.

## 7. Evidências – 28/11/2025
- Backend hot reload: `docker compose logs --tail 50 backend` exibiu `Restarting: /app/src/main.ts has been modified` e recompilou via `ts-node-dev` após inserir comentário temporário.
- Frontend hot reload: `docker compose logs --tail 200 frontend-dev` registrou recompilação automática (múltiplos `TSxxxx` warnings já existentes); alteração em `App.tsx` propagou para o watcher.
- API health manual: `curl http://localhost:3001/health` retornou `{"status":"ok", ...}` às 11:48 BRT.
- Observação: validação de WebSocket/log `Cliente conectado` ainda depende de disparar um cliente; manter como próximo passo quando houver usuário de teste disponível.

---
**Última atualização:** 27/11/2025 – GitHub Copilot
