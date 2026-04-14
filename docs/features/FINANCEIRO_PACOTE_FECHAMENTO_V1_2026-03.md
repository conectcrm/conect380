# Pacote V1 - Fechamento Financeiro (2026-03)

## Objetivo
Fechar o modulo financeiro em nivel operacional para uso diario sem lacunas criticas de processo, mantendo integracao com propostas, pipeline comercial e portal do cliente.

## Estado atual (resumo)
- Faturamento operacional com criacao/edicao de faturas.
- Pagamentos, estorno e historico ja implementados.
- Contas a pagar, aprovacoes e conciliacao bancaria ja implementados.
- Cobranca em lote integrada no backend e conectada ao botao de acao em massa no faturamento.
- Tributacao estruturada em fatura implementada (campos, DTO/API e persistencia).
- Painel de divergencias operacional no dashboard de faturamento.
- Relatorios de fechamento disponiveis (fluxo de caixa, competencia mensal e aging de recebiveis).
- Centro de custo com cadastro/gestao completa e integracao em contas a pagar (cadastro + selecao guiada + exportacao/filtro).
- Runbook operacional de fechamento mensal e estorno publicado em `docs/runbooks/RUNBOOK_FECHAMENTO_FINANCEIRO_MENSAL_E_ESTORNO_2026-03.md`.

## Escopo do pacote

### Em escopo (P0/P1)
1. Tributacao estruturada em faturamento (sem dependencia de texto em observacoes).
2. Cobranca em lote real para faturas elegiveis.
3. Centro de custo completo (cadastro + selecao guiada).
4. Relatorios de fechamento financeiro (caixa, competencia, aging).
5. Checklist de homologacao e operacao.

### Fora de escopo (P2+)
- Emissao fiscal oficial NFe/NFSe.
- Integracao contabil externa (ERP/contabilidade terceirizada).
- Automacoes fiscais por regime tributario complexo.

---

## Pacote para fechar agora (P0 operacional)

### Objetivo pratico
Concluir o "minimo completo" para o financeiro operar sem planilha paralela e sem ajustes manuais recorrentes.

### Itens obrigatorios do P0
1. Tributacao estruturada na fatura (Fase 1 completa).
2. Cobranca em lote funcionando no botao do faturamento (parte 1 da Fase 2).
3. Centro de custo com selecao por lista nas telas principais (parte 2 da Fase 2).
4. Painel de divergencias minimo (topo da Fase 3):
- itens x total da fatura
- estorno pendente de conciliacao
- pagamento parcial sem baixa final
5. Runbook financeiro de fechamento mensal e estorno (parte da Fase 4).

### Definicao de pronto (P0)
- Time financeiro fecha o mes usando apenas o sistema.
- Estorno/cancelamento tem trilha de auditoria e acao rastreavel.
- Operacao em lote de cobranca retorna sucesso/falha por fatura.
- Nenhum total depende de parsing de texto em `observacoes`.

### Janela sugerida
- 7 a 10 dias uteis (execucao + QA + homologacao assistida).

---

## Fase 1 - Tributacao estruturada (P0)

### Problema
Parte dos dados financeiros avancados da fatura esta embutida em metadados de texto dentro de `observacoes`, o que prejudica consulta, auditoria, filtros e relatorios.

### Entregas tecnicas
1. Banco de dados (faturas)
- Adicionar campos estruturados:
  - `valorImpostos` (decimal, default 0)
  - `percentualImpostos` (decimal, nullable)
  - `diasCarenciaJuros` (int, default 0)
  - `percentualJuros` (decimal, default 0)
  - `percentualMulta` (decimal, default 0)
  - `detalhesTributarios` (jsonb, nullable)
2. DTO/API
- Atualizar `CreateFaturaDto` e `UpdateFaturaDto` para receber os novos campos.
- Garantir retorno dos campos em listagem/detalhes.
3. Regras de negocio
- Centralizar calculo de total com:
  - subtotal de itens
  - desconto item + desconto global
  - impostos
  - juros/multa projetados (quando aplicavel)
4. Migracao de dados
- Script para ler metadados legados de `observacoes` (`[CONFIG_FATURA]`) e popular novos campos.
- Remover dependencia de parsing no frontend apos migracao.
5. Frontend
- `ModalFatura` salva os novos campos via API estruturada.
- `ModalDetalhesFatura` exibe valores de imposto/juros/multa diretamente da fatura.

### Criterios de aceite
- Criar e editar fatura com imposto persistido em coluna.
- Consulta de faturas retorna imposto sem depender de `observacoes`.
- Relatorio/visualizacao financeira bate com total calculado.
- Migracao legada preserva dados historicos existentes.

---

## Fase 2 - Cobranca em lote + Centro de custo (P1)

### Entregas tecnicas
1. Cobranca em lote
- Implementar endpoint backend para acao em massa:
  - gerar cobranca
  - enviar por e-mail/whatsapp conforme configuracao
  - retorno por item (sucesso/falha/motivo)
- Conectar botao da tela de faturamento (hoje indisponivel).
2. Centro de custo completo
- CRUD de centro de custo (backend + tela).
- Seletor no cadastro/edicao de contas a pagar (sem digitacao manual de ID).
- Filtros e exportacao por centro de custo.

### Criterios de aceite
- Acao "Gerar cobranca" executa lote real e retorna resultado por item.
- Usuario seleciona centro de custo por lista e filtra por ele no grid/exportacao.

---

## Fase 3 - Fechamento financeiro (P1)

### Entregas tecnicas
1. Relatorios de fechamento
- Fluxo de caixa (realizado x previsto).
- Competencia mensal (receitas/despesas por periodo).
- Aging de recebiveis (a vencer, vencidos 1-30, 31-60, 61+).
2. Painel de divergencias
- Divergencia entre valor de itens x total fatura.
- Faturas pagas parcialmente sem baixa final.
- Estornos pendentes de conciliacao.
3. Exportacao
- CSV/XLSX padrao para financeiro.
- Campos obrigatorios para auditoria (status, datas, responsavel, origem).

### Criterios de aceite
- Fechamento mensal pode ser gerado sem ajustes manuais fora do sistema.
- Equipe financeira consegue identificar e tratar divergencias em uma unica tela.

---

## Fase 4 - Operacao e governanca (P1)

### Entregas tecnicas
1. Permissoes
- Validar trilha de permissao para:
  - faturamento leitura
  - faturamento gestao
  - pagamentos leitura
  - pagamentos gestao
2. Auditoria
- Registrar acao critica: cancelamento, estorno, alteracao de valor, aprovacao/reprovacao.
3. Runbook
- Passo a passo de fechamento mensal.
- Procedimento de estorno e reconciliacao.
- Procedimento de contingencia (fallback sem gateway).

### Criterios de aceite
- Toda acao critica tem rastro de auditoria.
- Runbook permite operacao por equipe sem apoio tecnico.

---

## Ordem recomendada de implementacao
1. Fase 1 (tributacao estruturada)
2. Fase 2 (cobranca em lote + centro de custo)
3. Fase 3 (relatorios de fechamento)
4. Fase 4 (governanca operacional)

## Estimativa macro
- Fase 1: 3 a 5 dias uteis
- Fase 2: 3 a 4 dias uteis
- Fase 3: 4 a 6 dias uteis
- Fase 4: 2 a 3 dias uteis
- Total: 12 a 18 dias uteis (com QA funcional)

## Riscos e mitigacao
- Risco: quebra de compatibilidade com dados legados em `observacoes`.
  - Mitigacao: migracao gradual + leitura dupla temporaria.
- Risco: divergencia de total entre proposta e fatura.
  - Mitigacao: regra unica de calculo compartilhada e testes de regressao.
- Risco: acao em massa impactar desempenho.
  - Mitigacao: processamento em lote com feedback progressivo e logs por item.

## Checklist de pronto para "Financeiro Fechado V1"
- [x] Impostos estruturados implementados (campos + API + UI).
- [x] Cobranca em lote integrada ao fluxo de faturamento.
- [x] Centro de custo com cadastro e uso real.
- [x] Relatorios de fechamento disponiveis.
- [x] Auditoria tecnica de acoes criticas implementada (cancelamento, estorno, alteracao de valor, aprovacao/reprovacao).
- [x] Runbook operacional publicado.
