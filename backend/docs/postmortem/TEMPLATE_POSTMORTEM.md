# Postmortem - [Título do Incidente]

**Data do Incidente**: [YYYY-MM-DD]  
**Duração**: [X horas Y minutos]  
**Severidade**: [Critical / High / Medium / Low]  
**Autor**: [Nome do autor]  
**Data do Postmortem**: [YYYY-MM-DD]  
**Revisor**: [Nome do revisor]

---

## 📊 Resumo Executivo

[Resumo de 2-3 parágrafos descrevendo o incidente, impacto e resolução]

### Impacto
- **Usuários Afetados**: [Número ou percentual]
- **Serviços Afetados**: [Lista de serviços]
- **Tempo de Inatividade**: [Duração total]
- **Receita Perdida**: [Valor estimado, se aplicável]
- **SLO Violado**: [Qual SLO foi violado]
- **Error Budget Consumido**: [Percentual do budget consumido]

---

## 🕐 Linha do Tempo

| Horário | Evento | Ação Tomada |
|---------|--------|-------------|
| HH:MM | [Descrição do evento] | [O que foi feito] |
| HH:MM | [Próximo evento] | [Próxima ação] |
| HH:MM | Incidente detectado | [Como foi detectado] |
| HH:MM | Equipe notificada | [Quem foi notificado] |
| HH:MM | Investigação iniciada | [Primeiros passos] |
| HH:MM | Causa raiz identificada | [O que foi descoberto] |
| HH:MM | Solução aplicada | [O que foi implementado] |
| HH:MM | Incidente resolvido | [Confirmação da resolução] |
| HH:MM | Comunicação aos stakeholders | [O que foi comunicado] |

---

## 🔍 Detecção

### Como o incidente foi detectado?
- [ ] Alerta automático (Prometheus/Alertmanager)
- [ ] Monitoramento manual
- [ ] Relatório de usuário
- [ ] Outro: [Especificar]

### Tempo até detecção (TTD)
**[X minutos]** desde o início do incidente até a detecção.

### Qual alerta disparou?
- **Nome do Alerta**: [Nome do alerta]
- **Severidade**: [Critical/Warning/Info]
- **Canal de Notificação**: [Slack/Email/PagerDuty]
- **Mensagem**: [Texto do alerta]

---

## 🔧 Causa Raiz

### Análise 5 Porquês

1. **Por que o incidente ocorreu?**
   - [Resposta]

2. **Por que [resposta anterior]?**
   - [Resposta]

3. **Por que [resposta anterior]?**
   - [Resposta]

4. **Por que [resposta anterior]?**
   - [Resposta]

5. **Por que [resposta anterior]? (Causa Raiz)**
   - [Resposta final - causa raiz]

### Causa Raiz Identificada
[Descrição detalhada da causa raiz do incidente]

### Fatores Contribuintes
- [Fator 1]
- [Fator 2]
- [Fator 3]

---

## ✅ Resolução

### Solução Imediata (Mitigação)
[Descrever as ações tomadas para resolver o incidente imediatamente]

```bash
# Comandos executados (se aplicável)
kubectl rollback deployment/api-backend
# ou
docker restart conectsuite-backend
```

### Tempo Médio de Resolução (MTTR)
**[X minutos]** desde a detecção até a resolução.

### Verificação da Resolução
- [ ] Serviço voltou ao normal
- [ ] Alertas silenciados
- [ ] Métricas normalizadas
- [ ] Usuários confirmaram funcionamento
- [ ] Testes executados com sucesso

---

## 📈 Impacto no Error Budget

### SLO Afetado: Availability (99.9%)

| Métrica | Antes | Durante | Depois |
|---------|-------|---------|--------|
| Uptime | 99.95% | 98.50% | 99.92% |
| Error Rate | 0.05% | 1.50% | 0.08% |
| Error Budget Remaining | 85% | 45% | 42% |

### Consumo de Error Budget
- **Budget Consumido**: [X%]
- **Budget Restante**: [Y%]
- **Status de Deploy**: [Normal / Caution / Warning / FREEZE]

### Impacto na Janela de 30 dias
[Gráfico ou descrição do impacto no SLO de 30 dias]

---

## 🛠️ Action Items

### Curto Prazo (1-2 dias)
- [ ] [Ação 1] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 2] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 3] - Responsável: [Nome] - Prazo: [Data]

### Médio Prazo (1-2 semanas)
- [ ] [Ação 1] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 2] - Responsável: [Nome] - Prazo: [Data]

### Longo Prazo (1-3 meses)
- [ ] [Ação 1] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 2] - Responsável: [Nome] - Prazo: [Data]

---

## 📚 Lições Aprendidas

### O que funcionou bem?
1. [Item 1]
2. [Item 2]
3. [Item 3]

### O que não funcionou bem?
1. [Item 1]
2. [Item 2]
3. [Item 3]

### Onde tivemos sorte?
1. [Item 1 - coisas que poderiam ter piorado]
2. [Item 2]

---

## 🔄 Melhorias de Processo

### Monitoramento
- [ ] Adicionar alerta para [situação específica]
- [ ] Melhorar threshold de [alerta X]
- [ ] Criar dashboard para [métrica Y]

### Documentação
- [ ] Atualizar runbook de [processo X]
- [ ] Documentar [procedimento novo]
- [ ] Criar guia de troubleshooting para [situação Y]

### Automação
- [ ] Automatizar [tarefa manual executada]
- [ ] Criar script para [ação repetitiva]
- [ ] Implementar auto-scaling para [serviço X]

### Arquitetura
- [ ] Adicionar redundância em [componente X]
- [ ] Implementar circuit breaker em [serviço Y]
- [ ] Melhorar resiliência de [sistema Z]

---

## 📞 Comunicação

### Stakeholders Notificados
- [ ] CTO
- [ ] Equipe de Desenvolvimento
- [ ] Equipe de Operações
- [ ] Suporte ao Cliente
- [ ] Clientes Afetados
- [ ] Management

### Canais de Comunicação Utilizados
- [ ] Slack (#incidents)
- [ ] Email
- [ ] Status Page
- [ ] Telefone (on-call)

### Timeline de Comunicação

| Horário | Canal | Mensagem | Destinatário |
|---------|-------|----------|--------------|
| HH:MM | Slack | "Incidente detectado" | Equipe On-call |
| HH:MM | Email | "Status update #1" | Stakeholders |
| HH:MM | Status Page | "Investigating issue" | Clientes |
| HH:MM | Slack | "Incidente resolvido" | Todos |

---

## 🔒 Informações Sensíveis

[Incluir aqui quaisquer informações confidenciais, dados sensíveis ou detalhes de segurança que não devem ser compartilhados publicamente]

---

## 📎 Anexos

### Links Úteis
- Dashboard Grafana: [URL]
- Alertmanager: [URL]
- Logs relevantes: [URL]
- PR com fix: [URL]
- Issue tracker: [URL]

### Screenshots
[Incluir screenshots relevantes de:
- Alertas disparados
- Gráficos de métricas durante o incidente
- Logs de erro
- Dashboards de impacto]

---

## ✍️ Aprovações

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Autor | [Nome] | [Data] | [OK/Pendente] |
| Tech Lead | [Nome] | [Data] | [OK/Pendente] |
| CTO | [Nome] | [Data] | [OK/Pendente] |

---

## 📝 Notas Adicionais

[Quaisquer informações adicionais que não se encaixam nas seções acima]

---

**Template Version**: 1.0  
**Last Updated**: 2025-11-17  
**Next Review Date**: [YYYY-MM-DD + 30 dias]
