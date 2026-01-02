# 🔁 Orquestração de Webhooks WhatsApp

## 📌 Propósito

Centralizar o fluxo de entrada do WhatsApp no ConectCRM, garantindo que toda mensagem recebida siga uma trilha única: validação → roteamento → ticketização → automações. O objetivo é substituir o sistema de triagem legado (TriagemBotService + fluxos dedicados) por uma camada leve de orquestração, alinhada ao modelo atual de atendimento omnichannel.

## 🧭 Diagnóstico Atual

- Webhook já cria/atualiza tickets diretamente, mas ainda tenta acionar o módulo de triagem antigo, gerando _warnings_ e dependências mortas.
- Falhas recorrentes: ausência de fluxo padrão publicado, erros de obtenção de foto e janela de 24h.
- Documentação espalhada descreve melhorias do bot antigo que não serão mais evoluídas.

## 🎯 Objetivos

1. **Fluxo único** de processamento para qualquer mensagem recebida do WhatsApp.
2. **Decisão configurável** (tabela de roteamento) para definir respostas automáticas, templates de reengajamento e encaminhamentos manuais.
3. **Reaproveitar módulos úteis** do bot (ex.: coletores de dados) como blocos opcionais, sem manter o motor completo.
4. **Observabilidade completa**: logs estruturados, métricas e alertas.
5. **Desativar o legado** com segurança, retirando código e documentação não utilizados.

## 🏛️ Arquitetura Proposta

```
WhatsApp Cloud API
       |
       v
┌────────────────────────────┐
│ Webhook WhatsApp Controller│
└──────────────┬─────────────┘
               v
     ┌────────────────────┐
     │ OrchestratorService│
     └──────┬──────┬──────┘
            │      │
            │      └─► TemplatesService (24h / notificações)
            │
            ├─► TicketRouter (busca/abre ticket, aplica regras SLA)
            │
            └─► AutomationBus (opcional: dispara blocos reutilizáveis
                                ex. coletar dados, confirmar identidade)

Saídas:
1) Resposta automática (texto/template)
2) Ticket atualizado + notificação via Gateway
3) Publicação de eventos (WebSocket, analytics)
```

## 🔄 Fluxo de Decisão do Webhook

| Etapa | Descrição | Ação principal |
| --- | --- | --- |
| 1. Validação de assinatura | Respeitar `ALLOW_INSECURE_WHATSAPP_WEBHOOK` apenas em desenvolvimento. | Log crítico, rejeitar em produção se inválido. |
| 2. Deduplicação | Verificar `wamid` já processado. | Ignorar duplicatas, registrar evento. |
| 3. Identificação da empresa/canal | Usar `phone_number_id` e cache de integrações. | Carrega configurações e preferências. |
| 4. Verificação janela 24h | Consultar `statuses` para erros 131047 etc. | Se fora da janela, responder com template configurado. |
| 5. Ticketização | Localizar ticket aberto do contato; se inexistente, abrir novo com metadados. | Atualizar `ultima_mensagem_em` e status. |
| 6. Automação opcional | Avaliar regras (palavras-chave, horário, segmentação). | Executar bloco reutilizável ou seguir direto para agente. |
| 7. Notificação interna | Emitir eventos para filas/agentes + analytics. | `AtendimentoGateway` envia updates para frontend. |

## ⚙️ Configuração & Roteamento

- Nova tabela (ou JSON em `atendimento_integracoes_config`) com regras declarativas:
  - `template_reengajamento`, `mensagem_fora_horario`, `rota_padrao`.
  - `regras_palavra_chave`: lista de gatilhos → ações (ex.: disparar bloco "financeiro").
  - `fallback`: sempre abrir ticket e alertar equipe específica.
- Painel administrativo deve permitir alterar regras sem deploy.

## 🧱 Reaproveitamento do Bot Legado

| Componente atual | Situação | Nova abordagem |
| --- | --- | --- |
| `TriagemBotService` | Será desativado | Extrair utilidades úteis (ex. normalização) para helpers simples. |
| Fluxos JSON complexos | Não serão mais renderizados | Converter etapas críticas em _playbooks_ curtos (collect info → anexar ao ticket). |
| Jobs de timeout | Analisar impacto real; se necessário, portar para monitorar tickets aguardando resposta (não sessões). |

## 📊 Observabilidade

- **Logs estruturados**: manter `userId`, `phone_number_id`, `ticketId` em cada passo.
- **Métricas** (Prometheus/Grafana): tempo médio de processamento, % de templates enviados, fila de jobs pendentes.
- **Alertas**: falha na busca de integração, erro ao enviar template, aumento de erros 131047.

## 🛣️ Plano de Migração

1. **Inventário** das dependências do TriagemBot (controllers, jobs, páginas, docs).
2. **Feature flag** para desligar chamadas ao bot e ativar OrchestratorService.
3. **Portar regras essenciais** do bot como blocos reutilizáveis (ex.: coleta de CPF) e conectar ao AutomationBus.
4. **Atualizar documentação e runbooks** (este arquivo assume papel principal).
5. **Remover código/documentos antigos** após validação em staging.

## ✅ Checklist de Desativação do Legado

- [ ] Feature flag ativada (TriagemBot desligado) em staging.
- [ ] Testes E2E validam recebimento → ticket → notificação.
- [ ] Template de reengajamento configurado para cada empresa.
- [ ] Métricas/alerts configurados.
- [ ] Código e documentação do bot antigo removidos.
- [ ] Release notes comunicam mudança às equipes.

## 📅 Próximos Passos Sugeridos

1. Implementar `OrchestratorService` e ajustar controller/processor para usá-lo.
2. Criar tabela de regras simples (inicialmente YAML/JSON em config, depois UI).
3. Publicar templates default de reengajamento.
4. Migrar coletores úteis para blocos modulares.
5. Planejar remoção definitiva do módulo `triagem` após auditoria de dependências.
