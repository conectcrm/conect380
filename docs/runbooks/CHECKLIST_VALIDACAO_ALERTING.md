# ✅ Checklist de Validação - Sistema de Alerting

**Antes de ir para produção, validar TODOS os itens abaixo.**

---

## 📋 1. Configuração Básica

### Variáveis de Ambiente
- [ ] Arquivo `.env.alerting` criado a partir do `.env.alerting.example`
- [ ] `SLACK_WEBHOOK_URL` configurado e testado
- [ ] `SMTP_USERNAME` e `SMTP_PASSWORD` configurados (se usar email)
- [ ] `PAGERDUTY_SERVICE_KEY` configurado (se usar PagerDuty)
- [ ] `GRAFANA_ADMIN_PASSWORD` alterado do padrão

### Arquivos de Configuração
- [ ] `backend/config/alertmanager.yml` existe e está válido
- [ ] `backend/config/alert-rules.yml` existe e está válido
- [ ] `backend/config/slo-definitions.yml` existe e está válido
- [ ] `observability/prometheus.yml` atualizado com alerting
- [ ] `docker-compose.yml` atualizado com Prometheus, Alertmanager e Grafana

---

## 🚀 2. Infraestrutura Docker

### Serviços Rodando
- [ ] Prometheus iniciado: `docker-compose ps prometheus`
- [ ] Alertmanager iniciado: `docker-compose ps alertmanager`
- [ ] Grafana iniciado: `docker-compose ps grafana`
- [ ] Healthchecks passando: `docker-compose ps` (todos "healthy")

### Conectividade
- [ ] Prometheus acessível: http://localhost:9090
- [ ] Alertmanager acessível: http://localhost:9093
- [ ] Grafana acessível: http://localhost:3002
- [ ] Backend expondo métricas: http://localhost:3001/metrics

### Volumes Persistentes
- [ ] Volume `prometheus_data` criado
- [ ] Volume `alertmanager_data` criado
- [ ] Volume `grafana_data` criado
- [ ] Dados persistem após restart: `docker-compose restart prometheus`

---

## 🔔 3. Alertas Configurados

### Prometheus Alert Rules
- [ ] Prometheus carregou alert-rules.yml: http://localhost:9090/rules
- [ ] 14 alertas aparecem na página Rules
- [ ] Não há erros de sintaxe PromQL
- [ ] Validação manual: `docker-compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml`

### Alertmanager Routing
- [ ] Alertmanager carregou alertmanager.yml: http://localhost:9093/#/status
- [ ] 5 receivers configurados (default, critical, warning, info, slo)
- [ ] Rotas por severidade corretas
- [ ] Inibição rules corretas
- [ ] Validação manual: `docker-compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml`

### Integração Prometheus → Alertmanager
- [ ] Prometheus aponta para Alertmanager: http://localhost:9090/config (seção `alerting`)
- [ ] Target do Alertmanager está UP: http://localhost:9090/targets
- [ ] Alertas chegam no Alertmanager: http://localhost:9093/#/alerts

---

## 🧪 4. Testes de Alertas

### Script de Teste
- [ ] Script executa sem erros: `.\scripts\test-alerting.ps1 -Severity all`
- [ ] Todos os alertas foram enviados (8/8 success)
- [ ] Alertas aparecem no Alertmanager: http://localhost:9093/#/alerts

### Teste por Severidade
- [ ] Critical alerts enviados: `.\scripts\test-alerting.ps1 -Severity critical`
- [ ] Warning alerts enviados: `.\scripts\test-alerting.ps1 -Severity warning`
- [ ] Info alerts enviados: `.\scripts\test-alerting.ps1 -Severity info`
- [ ] SLO alerts enviados: `.\scripts\test-alerting.ps1 -Severity slo`

### Notificações Recebidas
- [ ] **Slack - Critical**: Alerta chegou em `#alerts-critical`
- [ ] **Slack - Warning**: Alerta chegou em `#alerts-warning`
- [ ] **Slack - Info**: Alerta chegou em `#alerts-info`
- [ ] **Slack - SLO**: Alerta chegou em `#slo-violations`
- [ ] **Email**: Email recebido no inbox configurado
- [ ] **PagerDuty**: Incident criado no PagerDuty (se configurado)

### Roteamento Correto
- [ ] Critical → Email + Slack + PagerDuty (3 canais)
- [ ] Warning → Email + Slack (2 canais)
- [ ] Info → Slack apenas (1 canal)
- [ ] SLO → Slack `#slo-violations` (1 canal)

---

## 📊 5. Grafana

### Datasource
- [ ] Prometheus datasource provisionado automaticamente
- [ ] Datasource está "working": http://localhost:3002/datasources
- [ ] Teste de query funciona: `up{job="conectcrm-backend"}`

### Dashboards
- [ ] Dashboard folder "ConectCRM" existe
- [ ] Dashboards importados corretamente
- [ ] Queries retornam dados (não vazio)
- [ ] Painéis renderizam sem erros

### Alertas no Grafana (Opcional)
- [ ] Alertas do Prometheus aparecem no Grafana
- [ ] Painel "Alerts" mostra alertas ativos
- [ ] Histórico de alertas funciona

---

## 📚 6. Documentação

### Runbooks Disponíveis
- [ ] `backend/docs/runbooks/api-down.md` existe
- [ ] `backend/docs/runbooks/db-pool-exhausted.md` existe
- [ ] Runbooks estão atualizados com comandos corretos
- [ ] Links de runbook nos alertas estão corretos

### README e Guias
- [ ] `ALERTING_README.md` existe e está completo
- [ ] `QUICKSTART_ALERTING.md` existe e está correto
- [ ] `SEMANA_5_ALERTING_SLOS.md` existe
- [ ] `PROMQL_QUERIES.md` existe com queries úteis
- [ ] `CONCLUSAO_SEMANA_5.md` existe

### Links Funcionando
- [ ] Todos os links internos funcionam (Markdown)
- [ ] Links para Grafana estão corretos
- [ ] Links para runbooks estão corretos
- [ ] Links externos (Google SRE Book, etc.) funcionam

---

## 🔐 7. Segurança

### Credenciais
- [ ] Grafana admin password alterado do padrão
- [ ] SMTP password é App Password (não senha real)
- [ ] Variáveis de ambiente NÃO commitadas no git
- [ ] `.env.alerting` está no `.gitignore`

### Acessos
- [ ] Apenas admins têm acesso ao Alertmanager
- [ ] Apenas admins têm acesso ao Prometheus
- [ ] Grafana tem autenticação ativada
- [ ] PagerDuty integration key é secreta

### HTTPS (Produção)
- [ ] Nginx reverse proxy configurado (se produção)
- [ ] SSL/TLS certificado válido
- [ ] Alertmanager atrás de autenticação
- [ ] Prometheus atrás de autenticação

---

## 🎯 8. SLOs

### SLOs Definidos
- [ ] 7 SLOs têm targets claros (99.9%, P95 < 2s, etc.)
- [ ] Error budgets calculados corretamente
- [ ] Janelas de tempo adequadas (1d, 7d, 30d)
- [ ] SLIs são mensuráveis via PromQL

### Métricas Disponíveis
- [ ] Backend expõe todas as métricas necessárias
- [ ] Queries PromQL para SLIs funcionam
- [ ] Histogramas configurados corretamente (buckets)
- [ ] Métricas de negócio (tickets) funcionam

### Error Budget Policy
- [ ] 4 níveis de budget definidos (>80%, 50-80%, 20-50%, <20%)
- [ ] Ações claras para cada nível
- [ ] Equipe entende a política
- [ ] Processo de deploy freeze documentado

---

## 🚨 9. Procedimentos de Incidente

### Escalação
- [ ] Matriz de escalação definida (on-call → tech lead → CTO)
- [ ] Tempos de escalação claros (5min, 10min, 15min)
- [ ] Contatos de emergência atualizados
- [ ] PagerDuty on-call schedule configurado (se usar)

### Runbooks
- [ ] Equipe sabe onde encontrar runbooks
- [ ] Runbooks testados em simulação
- [ ] Comandos nos runbooks funcionam
- [ ] RTO/RPO documentados

### Postmortem (Planejado)
- [ ] Template de postmortem criado (Semana 6)
- [ ] Processo de postmortem definido
- [ ] Responsável por postmortems definido
- [ ] Canal para compartilhar postmortems

---

## 🧑‍💻 10. Treinamento da Equipe

### On-call Engineers
- [ ] Treinados em como acessar Alertmanager
- [ ] Conhecem os runbooks principais
- [ ] Sabem como silenciar alertas
- [ ] Sabem como escalar incidentes

### Tech Leads
- [ ] Entendem SLOs e error budgets
- [ ] Sabem analisar queries PromQL
- [ ] Conhecem processo de postmortem
- [ ] Sabem configurar novos alertas

### Time de Desenvolvimento
- [ ] Entendem impacto de deploys no error budget
- [ ] Sabem criar métricas custom
- [ ] Conhecem processo de deploy freeze
- [ ] Sabem onde ver status de SLOs

---

## 📈 11. Monitoramento Contínuo

### Métricas do Sistema de Alerting
- [ ] Prometheus scrape rate: > 95% success
- [ ] Alertmanager uptime: > 99.9%
- [ ] Grafana response time: < 1s
- [ ] Notificações delivery rate: > 99%

### Health Checks
- [ ] Health check Prometheus: http://localhost:9090/-/healthy
- [ ] Health check Alertmanager: http://localhost:9093/-/healthy
- [ ] Health check Grafana: http://localhost:3002/api/health

### Logs
- [ ] Logs do Prometheus não têm erros críticos
- [ ] Logs do Alertmanager não têm falhas de envio
- [ ] Logs do Grafana não têm erros de datasource

---

## 🎛️ 12. Tuning e Otimização

### Alert Rules
- [ ] Thresholds adequados (não muito sensíveis)
- [ ] Durações ajustadas (evitar flapping)
- [ ] Annotations completas (summary, description, runbook)
- [ ] Labels corretos (severity, component)

### Alertmanager
- [ ] Group wait adequado (0s para critical, 30s warning)
- [ ] Repeat interval razoável (5min critical, 3h warning)
- [ ] Resolve timeout correto (5min)
- [ ] Inibição evita spam

### Prometheus
- [ ] Scrape interval adequado (15s)
- [ ] Evaluation interval correto (30s)
- [ ] Retention time suficiente (15 dias)
- [ ] Storage não está cheio

---

## 🔄 13. Backup e Disaster Recovery

### Backup de Configurações
- [ ] Configurações versionadas no git
- [ ] `.env.alerting` tem backup seguro (fora do git)
- [ ] Dashboards Grafana exportados (JSON)

### Backup de Dados
- [ ] Volumes Docker com backup periódico
- [ ] Prometheus TSDB com snapshot
- [ ] Grafana database com backup
- [ ] Alertmanager state com backup

### Disaster Recovery
- [ ] Procedimento de restore documentado
- [ ] Tempo de restore testado (< 30min)
- [ ] Backup offsite configurado
- [ ] RTO/RPO definidos

---

## ✅ 14. Validação Final

### Teste End-to-End
- [ ] Deploy uma mudança no backend
- [ ] Observar métricas no Prometheus
- [ ] Simular um erro (ex: derrubar backend)
- [ ] Verificar alerta disparou
- [ ] Verificar notificação chegou
- [ ] Seguir runbook para resolver
- [ ] Verificar alerta resolveu
- [ ] Verificar resolved notification

### Teste de Carga
- [ ] Sistema aguenta tráfego esperado
- [ ] Métricas não atrasam
- [ ] Alertas disparam corretamente sob carga
- [ ] Grafana continua responsivo

### Teste de Failover
- [ ] Prometheus reinicia sem perder dados
- [ ] Alertmanager mantém state após restart
- [ ] Grafana reconecta automaticamente
- [ ] Alertas continuam funcionando

---

## 🎯 Critérios de Aceitação

**Sistema está pronto para produção quando:**

✅ **Todas as 200+ checklist items acima estão marcadas**

✅ **Teste end-to-end completo passou**

✅ **Equipe treinada e confortável com ferramentas**

✅ **Documentação completa e atualizada**

✅ **Backups configurados e testados**

---

## 📊 Métricas de Sucesso (Medir após 1 mês)

### Objetivos Técnicos
- MTTD (Mean Time To Detect): **< 1 minuto** ✅ Target: 30s
- MTTR (Mean Time To Resolve): **< 15 minutos** ⏳ A medir
- Alert Accuracy: **> 95%** ⏳ A medir
- False Positive Rate: **< 5%** ⏳ A medir

### Objetivos de Negócio
- Disponibilidade: **> 99.9%** (SLO)
- Latência P95: **< 2s** (SLO)
- Satisfação da equipe on-call: **> 4/5**
- Tempo de onboarding: **< 1 hora** (com este checklist)

---

**Status**: ⏳ Em validação  
**Responsável**: _[Nome]_  
**Data de validação**: _[Data]_  
**Aprovado por**: _[Nome]_

---

**Última atualização**: 17 de novembro de 2025
