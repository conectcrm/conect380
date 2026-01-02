# ✅ Checklist Pós-Configuração do WhatsApp

> Use este checklist imediatamente após configurar ou alterar a integração WhatsApp Business no ConectCRM. Cada item precisa de um responsável e timestamp registrados para auditoria.

## 1. Pre-flight do ambiente

- [ ] Backend rodando em `http://localhost:3001` (ou servidor oficial) com logs sem erros
- [ ] Frontend ativo em `http://localhost:3000` (quando ambiente local)
- [ ] Banco acessível e migrações aplicadas
- [ ] `WHATSAPP_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `DEFAULT_EMPRESA_ID` preenchidos no `.env` do backend
- [ ] URL pública disponível (ngrok ou domínio oficial) anotada
- [ ] Responsável e horário registrados nesta seção

## 2. Meta Developer Console

- [ ] App correto selecionado (WhatsApp Business API habilitado)
- [ ] `Phone Number ID`, `API Token` permanente e `Business Account ID` copiados e guardados com segurança
- [ ] `Webhook Verify Token` documentado (o mesmo usado no ConectCRM)
- [ ] Callback configurada como `https://<host>/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>` (substituir `<ID_EMPRESA>` pelo UUID da empresa ativa)
- [ ] Eventos marcados: `messages` e `messaging_postbacks`
- [ ] Teste "Verify and Save" executado com sucesso (registrar captura e horário)
- [ ] Responsável e horário registrados nesta seção

## 3. Configuração no ConectCRM

- [ ] Acessou `/nuclei/configuracoes/integracoes` e abriu o card "WhatsApp Business API"
- [ ] Campos preenchidos: `Phone Number ID`, `API Token`, `Webhook Verify Token`, `Business Account ID`
- [ ] Switch "Ativar WhatsApp" ligado e `Salvar Configurações` executado sem erro
- [ ] Botão "Testar Conexão" retornou sucesso (anexar evidência)
- [ ] Responsável e horário registrados nesta seção

## 4. Segurança e validação do webhook

- [ ] Endpoint confirmado: `POST /api/atendimento/webhooks/whatsapp/<ID_EMPRESA>` (sem uso de query string `?empresaId=`)
- [ ] Header `X-Hub-Signature-256` validado em todos os testes e scripts (assinado com o `WHATSAPP_APP_SECRET` via HMAC SHA-256)
- [ ] Scripts/tests internos atualizados para enviar o header (PowerShell, curl, collections)
- [ ] Logs do backend mostram mensagens `Assinatura válida` ao receber webhooks
- [ ] Responsável e horário registrados nesta seção

## 5. Testes funcionais

- [ ] Execução do teste automatizado/simulador documentada (ex.: `test-webhook-whatsapp.js` ou runbook equivalente)
- [ ] Mensagem real enviada do WhatsApp de homologação/produção com texto "Olá" e resposta do bot verificada
- [ ] Ticket criado automaticamente para a empresa correta; conferido em `atendimento_tickets`
- [ ] Atendente disponível assumiu ticket, enviou resposta e mensagem chegou ao WhatsApp
- [ ] Consultas SQL executadas para `atendimento_contatos`, `atendimento_conversas` e `atendimento_mensagens` confirmaram registros
- [ ] Responsável e horário registrados nesta seção

## 6. Troubleshooting rápido (preencher apenas se aplicável)

- [ ] Erros de token resolvidos (novo token permanente gerado e atualizado)
- [ ] Falha na verificação do webhook solucionada (verify token idêntico e URL corrigida)
- [ ] Problemas de assinatura corrigidos (App Secret revisado + backend reiniciado)
- [ ] Logs anexados a `STATUS_WEBHOOK_ATUAL.md` ou documento de incidente correspondente

## 7. Registro final e próximos passos

| Item                       | Responsável | Data/Hora | Observações |
|---------------------------|-------------|-----------|-------------|
| Pre-flight                |             |           |             |
| Meta Developer Console    |             |           |             |
| Configuração ConectCRM    |             |           |             |
| Segurança do Webhook      |             |           |             |
| Testes Funcionais         |             |           |             |
| Troubleshooting (se houve)|             |           |             |

- [ ] Scripts de simulação (`simular-bot-simples.ps1`, `simular-atendimento-bot.ps1`) atualizados para o novo endpoint e header (ou registrar pendência)
- [ ] Checklist anexado ao ticket/tarefa principal e comunicado ao time responsável

## Referências Rápidas

- `docs/handbook/GUIA_RAPIDO_ATIVAR_WHATSAPP.md`
- `docs/runbooks/TESTE_FLUXO_COMPLETO_ATENDIMENTO.md`
- `CONFIGURACAO_WEBHOOK_WHATSAPP.md`
- `INDICE_WEBHOOK_WHATSAPP.md`
