# 📚 Índice de Documentação - Sistema de Alerting & SLOs

**Guia rápido para encontrar o que você precisa.**

---

## 🚀 Para Começar

### Você quer... ENTÃO leia...

| Objetivo | Documento | Tempo |
|----------|-----------|-------|
| **Setup rápido (5 min)** | [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) | 5 min |
| **Visão geral do sistema** | [SEMANA_5_RESUMO_SIMPLES.md](./SEMANA_5_RESUMO_SIMPLES.md) | 3 min |
| **Testar alertas agora** | [scripts/test-alerting.ps1](./scripts/test-alerting.ps1) | 2 min |

---

## 📖 Documentação Técnica

### Por Nível de Detalhe

| Nível | Documento | Páginas | Público |
|-------|-----------|---------|---------|
| **🟢 Básico** | [SEMANA_5_RESUMO_SIMPLES.md](./SEMANA_5_RESUMO_SIMPLES.md) | 3 | Todos |
| **🟡 Intermediário** | [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) | 8 | Desenvolvedores |
| **🔴 Avançado** | [ALERTING_README.md](./ALERTING_README.md) | 20 | DevOps/SRE |
| **⚫ Completo** | [SEMANA_5_ALERTING_SLOS.md](./SEMANA_5_ALERTING_SLOS.md) | 15 | Tech Leads |

---

## 🎯 Por Papel/Função

### 👨‍💻 Desenvolvedor Backend
1. [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) - Como iniciar
2. [PROMQL_QUERIES.md](./PROMQL_QUERIES.md) - Queries úteis
3. [backend/config/alert-rules.yml](./backend/config/alert-rules.yml) - Alertas configurados

### 🔧 DevOps / SRE
1. [ALERTING_README.md](./ALERTING_README.md) - Documentação completa
2. [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md) - Comandos diários
3. [CHECKLIST_VALIDACAO_ALERTING.md](./CHECKLIST_VALIDACAO_ALERTING.md) - Validação produção
4. [docker-compose.yml](./docker-compose.yml) - Configuração infraestrutura

### 🚨 On-call Engineer
1. [backend/docs/runbooks/api-down.md](./backend/docs/runbooks/api-down.md) - API fora do ar
2. [backend/docs/runbooks/db-pool-exhausted.md](./backend/docs/runbooks/db-pool-exhausted.md) - Pool esgotado
3. [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md) - Comandos emergência

### 📊 Tech Lead / Gerente
1. [CONCLUSAO_SEMANA_5.md](./CONCLUSAO_SEMANA_5.md) - Resumo executivo
2. [SEMANA_5_ALERTING_SLOS.md](./SEMANA_5_ALERTING_SLOS.md) - Visão técnica
3. [backend/config/slo-definitions.yml](./backend/config/slo-definitions.yml) - SLOs e error budgets

### ✅ QA / Validação
1. [CHECKLIST_VALIDACAO_ALERTING.md](./CHECKLIST_VALIDACAO_ALERTING.md) - 200+ checks
2. [scripts/test-alerting.ps1](./scripts/test-alerting.ps1) - Teste automatizado

---

## 🗂️ Por Tipo de Conteúdo

### 📄 Configurações (Editar aqui)

| Arquivo | Propósito | Quando Editar |
|---------|-----------|---------------|
| [backend/config/alertmanager.yml](./backend/config/alertmanager.yml) | Roteamento de alertas | Mudar canais/emails |
| [backend/config/alert-rules.yml](./backend/config/alert-rules.yml) | Regras de alerta | Adicionar/modificar alertas |
| [backend/config/slo-definitions.yml](./backend/config/slo-definitions.yml) | SLOs e error budgets | Ajustar targets |
| [observability/prometheus.yml](./observability/prometheus.yml) | Scrape configs | Adicionar targets |
| [.env.alerting.example](./.env.alerting.example) | Variáveis template | Onboarding |

### 📋 Runbooks (Procedimentos)

| Runbook | Alerta | Severidade | RTO |
|---------|--------|------------|-----|
| [api-down.md](./backend/docs/runbooks/api-down.md) | APIDown | 🔴 Critical | 5 min |
| [db-pool-exhausted.md](./backend/docs/runbooks/db-pool-exhausted.md) | DatabaseConnectionPoolExhausted | 🔴 Critical | 5 min |
| ⏳ high-latency.md | HighLatencyP95/P99 | 🟡 Warning | 15 min |
| ⏳ high-error-rate.md | HighHTTPErrorRate | 🟡 Warning | 10 min |
| ⏳ slo-violation.md | SLO alerts | 🔴 Critical | 30 min |

### 🛠️ Scripts (Executar aqui)

| Script | Propósito | Quando Usar |
|--------|-----------|-------------|
| [scripts/test-alerting.ps1](./scripts/test-alerting.ps1) | Testar alertas | Setup inicial, validação |
| [.env.alerting.example](./.env.alerting.example) | Template variáveis | Primeiro deploy |

### 📚 Guias (Ler aqui)

| Guia | Tamanho | Para Quem |
|------|---------|-----------|
| [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) | 8 páginas | Iniciantes |
| [ALERTING_README.md](./ALERTING_README.md) | 20 páginas | Avançados |
| [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md) | 15 páginas | On-call |
| [PROMQL_QUERIES.md](./PROMQL_QUERIES.md) | 18 páginas | Todos |
| [CHECKLIST_VALIDACAO_ALERTING.md](./CHECKLIST_VALIDACAO_ALERTING.md) | 12 páginas | QA |

---

## 🔍 Busca Rápida por Tópico

### Configuração e Setup
- **Como iniciar?** → [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md)
- **Configurar Slack?** → [ALERTING_README.md](./ALERTING_README.md#configurar-slack)
- **Configurar Email?** → [ALERTING_README.md](./ALERTING_README.md#configurar-smtp-gmail)
- **Configurar PagerDuty?** → [ALERTING_README.md](./ALERTING_README.md#configurar-pagerduty)

### Alertas
- **Quais alertas existem?** → [ALERTING_README.md](./ALERTING_README.md#alertas-configurados)
- **Como adicionar alerta?** → [backend/config/alert-rules.yml](./backend/config/alert-rules.yml)
- **Como testar alertas?** → [scripts/test-alerting.ps1](./scripts/test-alerting.ps1)
- **Como silenciar alerta?** → [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md#silenciar-alertas)

### SLOs e Error Budget
- **O que são SLOs?** → [SEMANA_5_ALERTING_SLOS.md](./SEMANA_5_ALERTING_SLOS.md#conceitos-importantes)
- **Quais SLOs temos?** → [backend/config/slo-definitions.yml](./backend/config/slo-definitions.yml)
- **Error Budget Policy?** → [ALERTING_README.md](./ALERTING_README.md#error-budget-policy)
- **Como medir SLOs?** → [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#slos--error-budget)

### Incidentes e Runbooks
- **API está fora?** → [backend/docs/runbooks/api-down.md](./backend/docs/runbooks/api-down.md)
- **Pool do banco cheio?** → [backend/docs/runbooks/db-pool-exhausted.md](./backend/docs/runbooks/db-pool-exhausted.md)
- **Como criar runbook?** → Copiar template dos existentes

### Troubleshooting
- **Alertas não chegam?** → [ALERTING_README.md](./ALERTING_README.md#troubleshooting)
- **Prometheus não mostra alertas?** → [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md#problema-prometheus-não-mostra-alertas)
- **Grafana não conecta?** → [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md#problema-grafana-não-conecta-ao-prometheus)

### Queries e Métricas
- **Queries prontas?** → [PROMQL_QUERIES.md](./PROMQL_QUERIES.md)
- **Ver latência?** → [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#latência-p95--2s-target)
- **Ver error rate?** → [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#error-rate--01-target)
- **Ver disponibilidade?** → [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#disponibilidade-999-target)

---

## 📖 Ordem de Leitura Recomendada

### Para Novatos (0 → 100)
1. [SEMANA_5_RESUMO_SIMPLES.md](./SEMANA_5_RESUMO_SIMPLES.md) - 3 min
2. [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) - 10 min
3. [scripts/test-alerting.ps1](./scripts/test-alerting.ps1) - 5 min (executar)
4. [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md) - 15 min
5. [PROMQL_QUERIES.md](./PROMQL_QUERIES.md) - Consulta quando necessário

### Para Experts (Deep Dive)
1. [SEMANA_5_ALERTING_SLOS.md](./SEMANA_5_ALERTING_SLOS.md) - 20 min
2. [ALERTING_README.md](./ALERTING_README.md) - 30 min
3. [backend/config/alert-rules.yml](./backend/config/alert-rules.yml) - Estudar código
4. [backend/config/slo-definitions.yml](./backend/config/slo-definitions.yml) - Estudar código
5. [CHECKLIST_VALIDACAO_ALERTING.md](./CHECKLIST_VALIDACAO_ALERTING.md) - Validar tudo

---

## 🎯 Casos de Uso Comuns

### "Preciso adicionar um novo alerta"
1. Editar [backend/config/alert-rules.yml](./backend/config/alert-rules.yml)
2. Validar: `docker-compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml`
3. Reload: `Invoke-RestMethod -Uri "http://localhost:9090/-/reload" -Method Post`
4. Testar: [scripts/test-alerting.ps1](./scripts/test-alerting.ps1)

### "Alerta disparou, o que fazer?"
1. Acessar: http://localhost:9093/#/alerts
2. Ver alerta ativo e pegar nome
3. Buscar runbook: `backend/docs/runbooks/{alertname}.md`
4. Seguir procedimento do runbook
5. Se não tiver runbook, ver [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md)

### "Preciso ver métricas de SLO"
1. Abrir: http://localhost:3002 (Grafana)
2. Dashboard: "SLO Overview"
3. Ou usar queries de [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#slos--error-budget)

### "Vou fazer deploy, posso?"
1. Ver error budget: [PROMQL_QUERIES.md](./PROMQL_QUERIES.md#disponibilidade-999-target)
2. Consultar policy: [ALERTING_README.md](./ALERTING_README.md#error-budget-policy)
3. Se < 20% → **DEPLOY FREEZE!**

---

## 🆘 Ajuda Rápida

### Não sei por onde começar
→ Leia: [SEMANA_5_RESUMO_SIMPLES.md](./SEMANA_5_RESUMO_SIMPLES.md)

### Preciso fazer setup agora
→ Execute: [QUICKSTART_ALERTING.md](./QUICKSTART_ALERTING.md) (5 min)

### Alerta disparou, socorro!
→ Procure: `backend/docs/runbooks/{alertname}.md`

### Preciso de um comando específico
→ Busque: [OPERACOES_DIARIAS_ALERTING.md](./OPERACOES_DIARIAS_ALERTING.md)

### Quero entender o sistema completo
→ Leia: [ALERTING_README.md](./ALERTING_README.md)

---

## 📞 Contato e Suporte

**Slack**: #observability  
**Email**: devops@conectcrm.com  
**Docs**: https://docs.conectcrm.com/alerting  
**Issues**: GitHub Issues do projeto

---

**Última atualização**: 17 de novembro de 2025  
**Mantenedor**: Equipe DevOps ConectCRM
