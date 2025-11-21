# 📋 Processo de Postmortem - ConectCRM

## 🎯 Objetivo

O processo de postmortem tem como objetivo **aprender com incidentes** e **prevenir recorrências**, não culpar indivíduos. É uma prática blameless focada em melhorias de sistema e processo.

---

## 🚨 Quando Criar um Postmortem?

Crie um postmortem **sempre que** ocorrer:

### Obrigatório (Severidade Alta)
- ✅ Incidente que violou SLO (ex: availability < 99.9%)
- ✅ Downtime > 5 minutos
- ✅ Error Budget consumido > 10% em um único incidente
- ✅ Impacto em > 100 usuários
- ✅ Perda de dados
- ✅ Brecha de segurança

### Recomendado (Severidade Média)
- ⚠️ Degradação de performance significativa
- ⚠️ Alerta crítico disparado (mesmo sem downtime)
- ⚠️ Near-miss (quase causou incidente grave)
- ⚠️ Descoberta de vulnerabilidade

### Opcional (Severidade Baixa)
- 💡 Incidente interessante do ponto de vista de aprendizado
- 💡 Falha em ambiente de staging que poderia ter atingido produção

---

## ⏱️ Timeline do Processo

### Fase 1: Resolução Imediata (Durante o Incidente)
**Duração**: N/A (até resolver)  
**Foco**: Restaurar o serviço

1. Detectar incidente
2. Notificar equipe on-call
3. Criar incident channel no Slack (#incident-YYYY-MM-DD)
4. Aplicar solução/mitigação
5. Verificar resolução
6. Comunicar resolução

### Fase 2: Coleta de Dados (0-24h após resolução)
**Duração**: Até 24 horas após resolução  
**Responsável**: Incident Commander

1. Coletar logs relevantes
2. Exportar métricas/gráficos
3. Salvar screenshots de alertas
4. Registrar timeline no incident channel
5. Identificar stakeholders para entrevista

### Fase 3: Escrita do Postmortem (1-3 dias após resolução)
**Duração**: 1-3 dias após resolução  
**Responsável**: Autor designado (geralmente quem resolveu ou liderou resposta)

1. Copiar template de postmortem
2. Preencher seções obrigatórias:
   - Resumo Executivo
   - Timeline
   - Causa Raiz
   - Impacto no Error Budget
   - Action Items
3. Solicitar input de membros da equipe
4. Draft completo para revisão

### Fase 4: Revisão (3-5 dias após resolução)
**Duração**: 2 dias para revisão  
**Responsável**: Tech Lead + CTO

1. Revisar postmortem
2. Validar causa raiz
3. Validar action items
4. Aprovar ou solicitar alterações
5. Marcar como aprovado

### Fase 5: Reunião de Postmortem (5-7 dias após resolução)
**Duração**: 1 hora (reunião)  
**Participantes**: Equipe envolvida + Stakeholders

1. Apresentar postmortem (15 min)
2. Discussão aberta (30 min)
3. Validar action items (10 min)
4. Atribuir responsáveis e prazos (5 min)

### Fase 6: Follow-up (Até completar action items)
**Duração**: Varia (1-90 dias)  
**Responsável**: Tech Lead

1. Acompanhar progresso dos action items
2. Atualizar status no postmortem
3. Verificar conclusão
4. Marcar como completo

---

## 📝 Como Escrever um Bom Postmortem

### Princípios Fundamentais

#### 1. **Blameless** (Sem Culpa)
- ❌ "João esqueceu de fazer X"
- ✅ "O processo não incluía checklist de X, levando ao esquecimento"

#### 2. **Focado em Sistemas**
- ❌ "Erro humano causou o problema"
- ✅ "Sistema permitiu deploy sem validação automática"

#### 3. **Orientado a Ações**
- ❌ "Precisamos ser mais cuidadosos"
- ✅ "Adicionar validação automática no CI/CD (João, até 2025-12-01)"

#### 4. **Baseado em Fatos**
- ❌ "Provavelmente o banco de dados estava lento"
- ✅ "Query levou 15s (log: backend.log:1234, timestamp: 14:32:15)"

### Seções Obrigatórias

#### ✅ Resumo Executivo
- 2-3 parágrafos
- Responda: O quê? Quando? Por quê? Como resolvemos?
- Leitura de 1 minuto

#### ✅ Timeline
- Formato de tabela
- Horários precisos (HH:MM)
- Eventos E ações tomadas

#### ✅ Causa Raiz
- Use 5 Porquês
- Identifique causa raiz real (não sintoma)
- Liste fatores contribuintes

#### ✅ Impacto no Error Budget
- Quantifique consumo de budget
- Mostre impacto no SLO
- Defina status de deploy (Normal/Caution/Warning/Freeze)

#### ✅ Action Items
- SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Responsável definido
- Prazo claro
- Prioridade (Curto/Médio/Longo prazo)

### Exemplo de Action Item BOM vs RUIM

❌ **RUIM**:
```
- Melhorar monitoramento
```

✅ **BOM**:
```
- Adicionar alerta de latência P99 > 5s para endpoint /api/orders
  Responsável: Maria Silva
  Prazo: 2025-11-25
  Prioridade: Curto prazo
```

---

## 🛠️ Ferramentas e Templates

### Localização dos Arquivos

```
backend/docs/postmortem/
├── TEMPLATE_POSTMORTEM.md           ← Template principal
├── POSTMORTEM_PROCESSO.md           ← Este documento
├── 2025-11-17-api-downtime.md       ← Exemplo de postmortem completo
└── README.md                        ← Índice de postmortems
```

### Como Criar Novo Postmortem

```bash
# 1. Copiar template
cd backend/docs/postmortem
cp TEMPLATE_POSTMORTEM.md YYYY-MM-DD-titulo-curto.md

# 2. Editar arquivo
code YYYY-MM-DD-titulo-curto.md

# 3. Preencher seções
# [Editar conforme template]

# 4. Commitar
git add YYYY-MM-DD-titulo-curto.md
git commit -m "docs: postmortem para incidente de [título]"
git push
```

### Naming Convention

```
YYYY-MM-DD-titulo-kebab-case.md

Exemplos:
✅ 2025-11-17-api-downtime.md
✅ 2025-11-20-database-pool-exhausted.md
✅ 2025-12-01-slo-violation-latency.md

❌ postmortem.md
❌ incident_11_17.md
❌ Postmortem API Down.md
```

---

## 👥 Papéis e Responsabilidades

### Incident Commander (IC)
**Durante o incidente**:
- Coordenar resposta
- Tomar decisões
- Comunicar status
- Delegar tarefas

**Após resolução**:
- Coletar dados iniciais
- Designar autor do postmortem
- Revisar timeline

### Autor do Postmortem
- Escrever postmortem usando template
- Entrevistar envolvidos
- Preencher todas as seções obrigatórias
- Solicitar revisão

### Tech Lead
- Revisar postmortem
- Validar causa raiz
- Aprovar action items
- Facilitar reunião de postmortem

### CTO
- Aprovar postmortem final
- Validar prioridade dos action items
- Alocar recursos para ações de longo prazo

### Equipe de Desenvolvimento
- Participar da reunião
- Contribuir com insights
- Executar action items designados

---

## 📊 Métricas de Postmortem

### KPIs de Processo

#### Time to Postmortem (TTP)
**Meta**: < 7 dias desde resolução até publicação

```
TTP = Data de Publicação - Data de Resolução
```

#### Action Item Completion Rate
**Meta**: > 90% em 30 dias

```
Completion Rate = (Itens Completados / Total de Itens) × 100%
```

#### Postmortem Coverage
**Meta**: 100% de incidentes críticos têm postmortem

```
Coverage = (Postmortems Criados / Incidentes Críticos) × 100%
```

### Acompanhamento

Dashboard Grafana: **Postmortem Metrics**
- Total de postmortems (últimos 30 dias)
- TTP médio
- Action items: open vs closed
- Recorrência de incidentes

---

## 🔄 Workflow no GitHub/GitLab

### Issues para Action Items

Para cada action item do postmortem, criar issue:

```markdown
**Título**: [Postmortem 2025-11-17] Adicionar alerta de latência P99

**Descrição**:
Action item do postmortem: backend/docs/postmortem/2025-11-17-api-downtime.md

**Contexto**:
Durante o incidente de 2025-11-17, não tínhamos alerta para latência P99,
causando detecção tardia de degradação de performance.

**Tarefa**:
- [ ] Adicionar métrica http_request_duration_seconds_bucket
- [ ] Configurar alerta P99 > 5s no alert-rules.yml
- [ ] Testar alerta em staging
- [ ] Documentar no runbook

**Responsável**: @maria
**Prazo**: 2025-11-25
**Prioridade**: High
**Labels**: postmortem, monitoring, p1
```

### Pull Request Template

```markdown
## [Postmortem] Fix para [Título do Incidente]

**Relacionado a**: backend/docs/postmortem/YYYY-MM-DD-titulo.md
**Action Item**: [Descrição do action item]
**Issue**: #XXX

### Mudanças
- [Mudança 1]
- [Mudança 2]

### Testes
- [ ] Testes unitários adicionados
- [ ] Testes de integração passando
- [ ] Testado em staging
- [ ] Validado por revisor

### Checklist de Deploy
- [ ] Runbook atualizado
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Equipe notificada
```

---

## 📚 Biblioteca de Postmortems

### Categorização

Organizar postmortems por:

#### Por Severidade
- **Critical**: Downtime, perda de dados, violação de SLO
- **High**: Degradação significativa, error budget > 10%
- **Medium**: Incidentes menores com aprendizado
- **Low**: Near-misses, incidentes evitados

#### Por Categoria
- **Infrastructure**: Falhas de infra (servers, network, cloud)
- **Application**: Bugs de código, lógica incorreta
- **Database**: Problemas de DB (pool, queries, locks)
- **Deployment**: Problemas em deploy, rollback
- **Security**: Vulnerabilidades, brechas de segurança
- **Human Error**: Erros de configuração, comandos errados
- **Third-Party**: Falhas de serviços externos

#### Por Causa Raiz Comum
- Falta de monitoramento
- Falta de testes
- Capacidade insuficiente
- Configuração incorreta
- Dependência externa
- Código com bug
- Processo inadequado

### Índice de Postmortems

Manter arquivo `README.md` atualizado:

```markdown
# Índice de Postmortems

## 2025

### Novembro
- [2025-11-17 - API Downtime](2025-11-17-api-downtime.md) - **Critical**
- [2025-11-20 - DB Pool Exhausted](2025-11-20-db-pool-exhausted.md) - **High**

### Dezembro
- [Em andamento]

## Estatísticas

- Total de Postmortems: 2
- MTTR Médio: 15 minutos
- Error Budget Médio Consumido: 12%
```

---

## ✅ Checklist de Qualidade

Antes de publicar um postmortem, verificar:

### Conteúdo
- [ ] Todas as seções obrigatórias preenchidas
- [ ] Timeline completa e precisa
- [ ] Causa raiz identificada (não sintoma)
- [ ] Análise 5 Porquês concluída
- [ ] Impacto quantificado (usuários, tempo, budget)

### Action Items
- [ ] Todos os action items são SMART
- [ ] Responsável definido para cada item
- [ ] Prazo definido para cada item
- [ ] Prioridade atribuída (Curto/Médio/Longo)
- [ ] Issues criadas no GitHub/GitLab

### Revisão
- [ ] Revisado por Tech Lead
- [ ] Aprovado por CTO
- [ ] Feedback da equipe incorporado
- [ ] Sem linguagem culpatória (blameless)

### Comunicação
- [ ] Postmortem compartilhado com equipe
- [ ] Reunião de postmortem agendada
- [ ] Stakeholders notificados
- [ ] Link adicionado ao índice

---

## 📖 Recursos e Referências

### Leitura Recomendada
- [Google SRE Book - Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Atlassian - Incident Postmortem Template](https://www.atlassian.com/incident-management/postmortem)
- [PagerDuty - Postmortem Best Practices](https://postmortems.pagerduty.com/)

### Templates Externos
- [Google Postmortem Template](https://sre.google/sre-book/example-postmortem/)
- [Etsy Blameless Postmortem Guide](https://codeascraft.com/2012/05/22/blameless-postmortems/)

### Ferramentas
- **Grafana**: Visualizar métricas durante incidente
- **Alertmanager**: Histórico de alertas disparados
- **GitHub/GitLab**: Issues para action items
- **Slack**: Canal #incidents para timeline
- **Postmortem.app**: Ferramenta dedicada (opcional)

---

## 🔄 Melhoria Contínua

### Revisão Trimestral

A cada 3 meses:

1. **Analisar Padrões**:
   - Causas raíz mais comuns?
   - Categorias mais frequentes?
   - Áreas que precisam mais atenção?

2. **Avaliar Eficácia**:
   - Action items estão sendo completados?
   - Incidentes estão diminuindo?
   - MTTR está melhorando?

3. **Atualizar Processo**:
   - Template precisa de ajustes?
   - Processo está muito burocrático?
   - Algo pode ser automatizado?

### Retrospectiva Anual

No final do ano:

1. **Relatório Anual de Incidentes**:
   - Total de incidentes
   - MTTR médio
   - Error budget consumido total
   - Categorias mais comuns

2. **Aprendizados do Ano**:
   - Top 5 melhorias implementadas
   - Top 5 vulnerabilidades descobertas
   - Áreas de investimento para próximo ano

3. **Celebrar Sucessos**:
   - Reconhecer equipe
   - Destacar melhorias de confiabilidade
   - Compartilhar histórias de sucesso

---

## 🎯 Conclusão

Um bom processo de postmortem transforma incidentes em **oportunidades de aprendizado**. Seguindo este processo, garantimos que:

- ✅ Aprendemos com cada incidente
- ✅ Prevenimos recorrências
- ✅ Melhoramos continuamente
- ✅ Mantemos cultura blameless
- ✅ Construímos sistemas mais resilientes

**Lembre-se**: O objetivo é **melhorar o sistema**, não culpar pessoas! 🚀

---

**Versão do Documento**: 1.0  
**Última Atualização**: 2025-11-17  
**Próxima Revisão**: 2026-02-17
