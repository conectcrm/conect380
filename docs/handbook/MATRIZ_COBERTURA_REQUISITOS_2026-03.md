# Matriz de Cobertura de Requisitos Futuros - 2026-03

## 1. Objetivo

Avaliar se o Conect360 ja possui requisitos documentados, vigentes e utilizaveis como fonte de verdade para os tipos de recursos que o produto promete evoluir futuramente.

Esta matriz foi consolidada a partir de:

1. README e visao oficial do produto.
2. docs/features como fonte principal de requisitos e backlog rastreavel.
3. docs/handbook como apoio de governanca e contexto.
4. evidencias de codigo e testes quando a documentacao estava inconsistente.

## 2. Criterios de classificacao

### Forte

Existe combinacao suficiente de:

1. contrato, minuta ou backlog tecnico vigente;
2. criterios de aceite ou checklist de homologacao/sign-off;
3. rastreabilidade para codigo, testes ou rollout.

### Parcial

Existe material relevante, mas com pelo menos um destes problemas:

1. documentacao fragmentada em excesso;
2. ausencia de contrato funcional unico;
3. material mais descritivo de implementacao do que de requisito;
4. divergencia entre documento antigo e estado real.

### Ausente

O recurso aparece como promessa de produto, roadmap ou item aspiracional, mas nao foi localizado documento vigente de requisito funcional em docs/features.

## 3. Resumo executivo

Conclusao geral:

1. O projeto NAO tem cobertura uniforme de requisitos para todos os tipos de recursos futuros.
2. O projeto TEM cobertura forte em Clientes 360, ciclo de vida de oportunidades, financeiro operacional/pagamentos e Guardian/backoffice.
3. O projeto TEM cobertura parcial em atendimento, agenda, analytics, contratos, catalogo flexivel e automacao/IA.
4. O projeto ainda possui frentes com cobertura inicial ou em refinamento, especialmente:
   - NFe/NFSe;
   - assinatura eletronica;
   - sincronizacao Google Calendar/Outlook;
   - canal email omnichannel em sua homologacao e arquitetura operacional de ingestao.

## 4. Matriz por macro-modulo de produto

| Macro-modulo | Cobertura | Evidencias principais | Leitura objetiva |
| --- | --- | --- | --- |
| Clientes / CRM Base | Forte | BACKLOG_CLIENTES_360.md; docs/features/CRM-001_CONTRATO_OFICIAL_ENTIDADE_CLIENTE_2026-03.md; docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md | Existe backlog rastreavel, contrato oficial, suites e checklist de QA. |
| CRM / Oportunidades / Pipeline | Forte | docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md; docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md; docs/features/CHECKLIST_SIGNOFF_CICLO_VIDA_OPORTUNIDADES_2026-03.md | Ciclo de vida tem governanca, rollout, gates e regressao definidos. |
| Leads | Parcial | docs/features/CRM-LEADS-001_CONTRATO_FUNCIONAL_MODULO_LEADS_2026-03.md; backend/docs/AUDITORIA_ENTITIES_MULTI_TENANCY.md; backend/docs/TESTE_E2E_MULTI_TENANCY_RESULTADOS.md | O dominio agora possui contrato funcional vigente, mas ainda pode evoluir com checklist proprio e backlog de captura/importacao. |
| Propostas / Fechamento comercial | Parcial | docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md; docs/features/FLUXO_VENDAS_RELEASE_FLAGS.md | Bom nivel de backlog operacional, mas ainda muito ligado ao fluxo Vendas -> Financeiro e nao a um contrato funcional autonomo do modulo. |
| Contratos | Parcial | docs/features/COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md; docs/features/CHECKLIST_GO_LIVE_FLUXO_VENDAS_MVP_2026-03.md; docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md | Agora existe baseline funcional do modulo, mas ainda ha refinamentos de assinatura, faturamento e legado tecnico. |
| Financeiro operacional / contas a pagar | Forte | docs/features/AP302_AP303_MINUTA_REQUISITOS_2026-03.md; docs/features/AP302_AP303_BACKLOG_TECNICO_2026-03.md; docs/features/AP303_OBSERVABILIDADE_MONITOR_ALERTAS_2026-03.md | Exportacao contabil/fiscal e alertas operacionais possuem minuta, backlog, observabilidade e evidencias. |
| Pagamentos / webhooks / conciliacao | Forte | docs/features/AP301_CONTRATO_WEBHOOK_PAGAMENTOS_2026-03.md; docs/features/AP301_VALIDACAO_TECNICA_WEBHOOK_2026-02-27.md; docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md | Fluxo de webhook e sincronizacao financeira estao bem especificados e validados. |
| Admin / Governanca / Guardian | Forte | docs/features/PROPOSTA_ADMINISTRACAO_BACKOFFICE_CONECT360_2026-03.md; serie GDN-001..GDN-516 em docs/features | E o conjunto mais maduro em requisitos, rollout, operacao, seguranca e aceite final. |
| Atendimento / Omnichannel | Parcial | README.md; VISAO_SISTEMA_2025.md; docs/ROADMAP_OMNICHANNEL.md; docs/runbooks; docs/handbook/CHECKLIST_SPRINT_OMNICHANNEL_REALTIME.md | Existe muita documentacao operacional e historica, mas falta consolidacao clara de requisitos futuros vigentes em docs/features. |
| Agenda / Calendario | Parcial | docs/features/CRM-030_CONTRATO_FUNCIONAL_AGENDA_2026-03.md; docs/features/CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md; docs/features/CRM-034_CHECKLIST_QA_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md | Agora existe baseline formal para agenda interna, sincronizacao externa v1 e fase seguinte bidirecional; a pendencia principal e homologacao operacional. |
| Analytics / Relatorios | Parcial | docs/features/ANL-001_MINUTA_REQUISITOS_ANALYTICS_RELATORIOS_2026-03.md; docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md; docs/features/AP303_OBSERVABILIDADE_MONITOR_ALERTAS_2026-03.md | Agora existe minuta-base do modulo, mas ainda falta contrato funcional unificado de analytics/relatorios. |
| Catalogo flexivel / Estoque especializado | Parcial | docs/CATALOGO_FLEXIVEL_PROPOSTA_TECNICA.md; docs/features/evidencias/CATALOGO_FLEX_ROLLOUT_SMOKE_CODEXA_20260310-153022.md | Existe proposta tecnica consistente, mas ainda com gaps de rollout e dependencia de schema/migration no ambiente ativo. |
| Automacao / IA / Triagem | Parcial | docs/handbook/INDICE_DOCUMENTACAO_IA.md; docs/handbook/GUIA_IMPLEMENTACAO_MELHORIAS_BOT.md; docs/runbooks relacionados | O dominio e importante e documentado em guias, mas a formalizacao de requisitos futuros esta menos padronizada do que em CRM/Financeiro/Guardian. |

## 5. Recursos futuros prometidos no produto sem requisito formal vigente localizado

### 5.1 Notas fiscais (NFe/NFSe)

Status: Parcial

Evidencia:

1. Promessa de roadmap em README.md.
2. Promessa no documento de visao do sistema.
3. Agora existe contrato funcional inicial da primeira fase em `docs/features/FIN-NFSE-002_CONTRATO_FUNCIONAL_FASE1_NFSE_SERVICO_2026-03.md`, derivado da minuta geral.

Impacto:

1. O risco caiu para medio, mas ainda depende de decisao de provedor fiscal, escopo inicial e evidencias de homologacao.

### 5.2 Assinatura eletronica

Status: Parcial

Evidencia:

1. Promessa de roadmap em README.md.
2. Promessa no documento de visao oficial do sistema.
3. Agora existe contrato funcional v1 em `docs/features/COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md`, derivado da minuta inicial e alinhado ao backend existente.

Impacto:

1. O risco caiu para medio, mas ainda ha refinamentos juridicos, evidencias operacionais e eventual decisao de provider externo a resolver.

### 5.3 Sincronizacao Google Calendar / Outlook

Status: Parcial

Evidencia:

1. Promessa no modulo Calendario da visao oficial do sistema.
2. Existe contrato funcional da Agenda v1 e backlog tecnico inicial em `docs/features/CRM-032_BACKLOG_TECNICO_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`.
3. Agora existe contrato funcional v1 da sincronizacao externa em `docs/features/CRM-033_CONTRATO_FUNCIONAL_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`, com provider inicial, direcao de sync e ownership definidos.

Impacto:

1. O risco caiu para medio/baixo no baseline da fase v1, mas ainda dependera de homologacao operacional e contrato proprio para a fase bidirecional.

### 5.4 Canal Email no Omnichannel como evolucao formal

Status: Parcial

Evidencia:

1. O produto promete email como canal em documentos de visao/README.
2. Existem evidencias tecnicas de suporte parcial no modulo Atendimento.
3. Agora existe contrato funcional v1 em `docs/features/ATD-EMAIL-002_CONTRATO_FUNCIONAL_CANAL_EMAIL_OMNICHANNEL_2026-03.md`, limitado ao suporte atual de configuracao do canal e envio outbound por ticket.
4. Agora existe contrato funcional da fase inbound/threading em `docs/features/ATD-EMAIL-005_CONTRATO_FUNCIONAL_INBOUND_THREADING_EMAIL_2026-03.md`.

Impacto:

1. O risco caiu para medio/baixo no baseline funcional, mas ainda depende de homologacao operacional, escolha arquitetural de provider/ingestao e evidencias de execucao.

## 6. Contradicoes documentais relevantes

### 6.1 Roadmap central antigo descontinuado

docs/handbook/ROADMAP_PROXIMAS_FASES.md foi descontinuado em 2026-03 e aponta para referencias vigentes.

Risco:

1. agentes ou devs podem continuar usando roadmap legado como base errada.

### 6.2 Leads: roadmap antigo versus backend validado

O documento docs/handbook/ROADMAP_MODULO_LEADS_CRM.md ainda preserva o retrato historico de quando Leads era gap critico.

Ao mesmo tempo:

1. backend/docs/AUDITORIA_ENTITIES_MULTI_TENANCY.md indica Leads como validado;
2. backend/docs/TESTE_E2E_MULTI_TENANCY_RESULTADOS.md mostra cobertura E2E de Leads.
3. agora existe contrato funcional vigente em `docs/features/CRM-LEADS-001_CONTRATO_FUNCIONAL_MODULO_LEADS_2026-03.md`.

Risco:

1. leitura do roadmap historico sem considerar o contrato vigente pode induzir duplicidade ou retrabalho.

### 6.3 Agenda: risco reduzido, mas ainda com heranca de material de implementacao

O problema estrutural da ausencia de contrato-base foi reduzido com a publicacao dos artefatos `CRM-030`, `CRM-032`, `CRM-033`, `CRM-034` e `CRM-035`.

Risco:

1. material antigo de implementacao/UX ainda pode ser confundido com regra vigente se a ordem de leitura nao seguir `docs/features` e a matriz.

## 7. Prioridades recomendadas

### Prioridade P0

1. Produzir evidencias de homologacao da sincronizacao externa de calendario.
2. Refinar exigencias juridicas/evidenciais da assinatura eletronica e decidir provider externo, se aplicavel.
3. Fechar provedor, backlog tecnico e homologacao da fase 1 de NFSe de servico.
4. Produzir evidencias de homologacao do canal email omnichannel e decidir arquitetura operacional de ingestao/provider.

### Prioridade P1

1. Criar checklist de QA do modulo de Leads e backlog formal de captura/importacao se essas frentes forem entrar em fase ativa.
2. Consolidar contrato funcional unico do modulo Analytics/Relatorios, separado das regras do lifecycle comercial.
3. Consolidar um backlog vigente do canal Email no Omnichannel, com escopo tecnico e operacional.

### Prioridade P2

1. Transformar esta matriz em artefato vivo de governanca.
2. Exigir que novo modulo ou roadmap futuro entre no sistema apenas quando possuir:
   - contrato ou minuta funcional;
   - backlog tecnico rastreavel;
   - checklist de QA/sign-off.

## 8. Gate minimo recomendado para futuras features implementadas por IA

Nenhum recurso novo deveria ser tratado como "pronto para implementacao" sem estes tres itens:

1. Documento de requisito funcional ou minuta aprovada.
2. Documento tecnico ou backlog refinado com dependencias e criterios de aceite.
3. Documento de validacao operacional, QA ou sign-off.

## 9. Veredito final

O Conect360 ja tem base documental suficientemente madura para evolucao segura em partes importantes do produto, mas ainda nao possui requisitos formalizados para todos os tipos de recursos futuros prometidos.

O risco principal hoje nao e ausencia total de documentacao.

O risco principal e a combinacao de:

1. cobertura desigual entre modulos;
2. documentos antigos coexistindo com fontes novas;
3. promessas de produto ainda sem contrato funcional vigente.

Para um projeto altamente editado por agentes de IA, isso significa que o proximo ganho real nao e apenas codar mais rapido; e reduzir ambiguidade de fonte de verdade.
