# GDN-601 - Plano de Execucao da Separacao Billing x Guardian
Data: 2026-03-08
Status: aprovado para execucao continua
Owner: plataforma/guardian

## 1. Objetivo
Separar definitivamente Billing Administrativo (Guardian) de Billing Self-service (Cliente), removendo sobreposicao com Financeiro e eliminando exposicao de funcoes administrativas no sistema principal.

## 2. Resultado esperado
- Guardian concentra gestao de planos, modulos, precos e governanca comercial.
- Sistema principal mantém apenas assinatura da propria empresa, upgrade/downgrade permitido e historico financeiro proprio.
- Usuario comum nao acessa billing.
- Rotas, menu e permissao refletem exatamente este modelo.

## 3. Regras de execucao (modo sem perguntas)
- Regra 1: ao concluir um sprint com Gate PASS, iniciar automaticamente o sprint seguinte.
- Regra 2: se um teste critico falhar, executar correcao e revalidar no mesmo sprint antes de seguir.
- Regra 3: so interromper para decisao humana em bloqueio externo real:
  - credencial externa indisponivel
  - dependencia de terceiro fora do repositorio
  - aprovacao juridica/comercial obrigatoria
- Regra 4: sem bloqueio externo, nao solicitar autorizacao para proximo passo.
- Regra 5: registrar evidencia minima de cada gate no final do sprint.

## 4. Escopo
Inclui:
- menu, rotas e navegacao de billing
- separacao de endpoint administrativo para namespace guardian
- isolamento de UI administrativa
- RBAC estrito e MFA em operacoes criticas
- auditoria de alteracoes de catalogo/preco/plano

Nao inclui:
- redesenho comercial de pacotes
- troca de gateway de pagamento
- reescrita total do modulo financeiro

## 5. Matriz de acesso final (alvo)
- owner/superadmin plataforma: Guardian completo
- admin da empresa cliente: self-service da propria empresa
- usuario comum: sem acesso billing

## 6. Sprint 0 - Baseline e congelamento (2-3 dias)
### Checklist de execucao
- [ ] congelar novas features no billing atual
- [ ] mapear rotas ativas de billing e financeiro
- [ ] mapear endpoints admin que ainda estao no app principal
- [ ] publicar matriz de acesso final
- [ ] definir plano de rollback por etapa

### Logica de testes e validacoes
- [ ] varredura de rotas: inventario completo sem lacunas
- [ ] varredura de permissoes: cada rota com regra definida
- [ ] baseline capturado: prints + lista de destinos atuais

### Gate S0
PASS quando inventario de rotas/permissoes estiver fechado e congelamento ativo.

## 7. Sprint 1 - Contencao rapida de exposicao (3-5 dias)
### Checklist de execucao
- [ ] remover/ocultar entrada de UI administrativa de billing no app cliente
- [ ] impedir acesso direto a telas admin por rota legada
- [ ] manter apenas self-service no app principal
- [ ] criar redirects seguros para destinos validos

### Logica de testes e validacoes
- [ ] perfil cliente admin: acessa self-service, nao acessa admin
- [ ] perfil usuario comum: nao acessa billing
- [ ] rotas legadas admin: retornam 403 ou redirect seguro
- [ ] smoke de menu lateral sem links quebrados

### Gate S1
PASS quando nao existir caminho funcional do cliente para tela admin.

## 8. Sprint 2 - Hardening backend e namespace Guardian (5-7 dias)
### Checklist de execucao
- [ ] mover endpoints administrativos para namespace guardian
- [ ] aplicar RBAC estrito por acao critica
- [ ] exigir MFA para alteracao de preco/plano/modulo
- [ ] remover endpoints guardian da documentacao publica
- [ ] adicionar auditoria imutavel para operacoes criticas

### Logica de testes e validacoes
- [ ] teste 401/403 por perfil e endpoint
- [ ] teste MFA obrigatorio em operacao critica
- [ ] teste de bypass: endpoint admin inacessivel fora guardian
- [ ] teste de auditoria: evento gravado com ator, antes/depois e timestamp

### Gate S2
PASS quando nenhum endpoint administrativo responder para contexto cliente.

## 9. Sprint 3 - Guardian Web operacional (5-7 dias)
### Checklist de execucao
- [ ] migrar PlanosAdmin/ModulosAdmin para guardian-web
- [ ] remover mock de dashboard administrativo
- [ ] conectar dashboard admin a dados reais
- [ ] garantir trilha de auditoria visivel no guardian

### Logica de testes e validacoes
- [ ] CRUD plano completo no guardian
- [ ] CRUD modulo completo no guardian
- [ ] alteracao de preco com auditoria persistida
- [ ] regressao: app principal sem componente admin embutido

### Gate S3
PASS quando toda gestao administrativa estiver apenas no guardian-web.

## 10. Sprint 4 - Billing self-service do cliente (5-7 dias)
### Checklist de execucao
- [ ] redefinir IA do modulo billing no app principal
- [ ] billing cliente conter apenas:
- [ ] assinatura atual
- [ ] upgrade/downgrade permitido
- [ ] faturamento proprio (quando aplicavel)
- [ ] metodo de pagamento proprio
- [ ] remover duplicidade de Faturas/Pagamentos entre Billing e Financeiro
- [ ] padronizar navegacao por rota + query tab (sem estado local solto)

### Logica de testes e validacoes
- [ ] cada submenu abre destino distinto e coerente
- [ ] refresh de pagina preserva aba correta
- [ ] deep-link para aba funciona
- [ ] nao existe submenu apontando para conteudo identico sem diferenca funcional

### Gate S4
PASS quando navegacao e responsabilidades de Billing/Financeiro estiverem sem sobreposicao.

## 11. Sprint 5 - Seguranca, observabilidade e performance (3-5 dias)
### Checklist de execucao
- [ ] ativar alertas de acao critica (guardian)
- [ ] configurar monitoramento de falhas de autorizacao
- [ ] revisar bundle cliente para garantir ausencia de codigo admin
- [ ] validar politicas de sessao para area guardian

### Logica de testes e validacoes
- [ ] scan de endpoints expostos
- [ ] scan de bundle (strings/rotas admin)
- [ ] teste de alertas (disparo e recebimento)
- [ ] teste de sessao expirada e renovacao com MFA

### Gate S5
PASS quando risco de exposicao estiver controlado tecnicamente e monitorado.

## 12. Sprint 6 - Cutover, legado e encerramento (3-5 dias)
### Checklist de execucao
- [ ] janela de corte controlada
- [ ] legado em read-only por periodo curto
- [ ] descomissionar pontos antigos de billing admin
- [ ] publicar runbook final de operacao
- [ ] registrar licoes aprendidas

### Logica de testes e validacoes
- [ ] smoke pos-corte (cliente + guardian)
- [ ] validacao financeira diaria (consistencia)
- [ ] validacao de auditoria critica diaria
- [ ] teste de rollback documentado (dry-run)

### Gate S6
PASS quando producao operar somente no modelo segregado sem dependencia do legado.

## 13. Checklist global obrigatorio (nao pular)
- [ ] segurança: 401/403/MFA validados
- [ ] funcional: fluxos criticos cliente e guardian validados
- [ ] observabilidade: alertas e logs de auditoria ativos
- [ ] documentacao: runbook atualizado e publicado
- [ ] rollback: passo a passo testado

## 14. Matriz de testes minima por release
- [ ] E2E cliente: login, assinatura, upgrade, pagamento, historico
- [ ] E2E guardian: criar plano, editar preco, vincular modulo, auditar
- [ ] autorizacao negativa: tentativas de acesso indevido por perfil
- [ ] regressao de menu/rotas: nenhum item redundante sem finalidade

## 15. Evidencias obrigatorias por sprint
- [ ] relatorio de testes executados
- [ ] lista de endpoints impactados
- [ ] diff de menu/rotas
- [ ] captura de auditoria das acoes criticas
- [ ] status do gate (PASS/FAIL) com data

## 16. Definicao de concluido
Projeto concluido quando:
- separacao guardian x cliente estiver 100% aplicada
- nao houver rota/endpoints admin no contexto cliente
- billing cliente e financeiro estiverem sem duplicidade funcional
- monitoramento e auditoria estiverem operando em producao
