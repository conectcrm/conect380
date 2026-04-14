# Matriz de Fluxo Comercial-Financeiro (Quote-to-Cash)

Data: 2026-04-08
Escopo: Fechamento da venda apos proposta aprovada, com decisao de contrato obrigatorio/dispensado.

## 1) Base atual no codigo (as-is)

- Status de proposta e transicoes base estao em `backend/src/modules/propostas/propostas.service.ts`.
- No modo MVP comercial (`SALES_MVP_MODE`/`MVP_MODE`/`FINANCEIRO_MVP_MODE`), os status `fatura_criada`, `aguardando_pagamento` e `pago` ficam fora do escopo de transicao de proposta.
- Contrato so pode ser criado para proposta com status de fluxo `aprovada`.
- Permissoes:
  - Comercial: `comercial.propostas.*`
  - Financeiro: `financeiro.faturamento.*`

## 2) Matriz alvo (to-be) de transicoes

Legenda de papeis:
- VDR: Vendedor
- GER: Gerente Comercial
- JUR: Juridico
- FIN: Financeiro
- ADM: Admin/Superadmin

| De | Para | Regra/Gate | Executor padrao | Aprovador de excecao |
|---|---|---|---|---|
| `rascunho` | `enviada` | proposta com itens validos | VDR | GER |
| `enviada` | `negociacao` | resposta/interacao do cliente | VDR | GER |
| `negociacao` | `aprovada` | alcada comercial ok | VDR | GER/ADM |
| `negociacao` | `rejeitada` | perda formalizada com motivo | VDR | GER |
| `aprovada` | `contrato_gerado` | gate `contrato_obrigatorio=true` | VDR/GER | JUR (se clausula custom) |
| `aprovada` | `dispensa_contrato_solicitada` | gate `contrato_obrigatorio=false` e solicitacao formal | VDR | GER |
| `dispensa_contrato_solicitada` | `dispensa_contrato_aprovada` | motivo + trilha de auditoria | GER | ADM |
| `contrato_gerado` | `contrato_enviado` | envio para assinatura | VDR/GER | JUR (se necessario) |
| `contrato_enviado` | `contrato_assinado` | assinatura valida (interna ou externa confirmada) | VDR/GER | JUR/ADM |
| `contrato_assinado` | `faturamento_liberado` | validacao documental completa | GER/FIN | ADM |
| `dispensa_contrato_aprovada` | `faturamento_liberado` | gate de dispensa aprovado | GER/FIN | ADM |
| `faturamento_liberado` | `fatura_criada` | fatura gerada | FIN | ADM |
| `fatura_criada` | `aguardando_pagamento` | fatura enviada/ativa | FIN | ADM |
| `aguardando_pagamento` | `pago` | conciliacao/baixa confirmada | FIN | ADM |

## 3) Gate de obrigatoriedade de contrato

`contrato_obrigatorio=true` se qualquer condicao abaixo for verdadeira:
- valor_total >= limite definido pela empresa
- vigencia > 30 dias
- venda recorrente
- desconto acima de limite de alcada
- clausula especial/custom
- risco juridico/LGPD sinalizado

Se nenhum criterio disparar, permite rota de dispensa (`dispensa_contrato_*`).

## 4) Matriz de permissoes por acao

| Acao | Permissao minima | Perfis padrao |
|---|---|---|
| Criar/editar proposta | `comercial.propostas.create/update` | VDR, GER, ADM |
| Enviar proposta | `comercial.propostas.send` | VDR, GER, ADM |
| Override de aprovacao direta (rascunho->aprovada) | `comercial.propostas.approve.override` | GER, ADM |
| Criar contrato | `comercial.propostas.create` | VDR, GER, ADM |
| Atualizar status de proposta | `comercial.propostas.update` | VDR, GER, ADM |
| Operar faturamento e cobranca | `financeiro.faturamento.manage` | FIN, ADM |
| Leitura comercial pelo financeiro | `comercial.propostas.read` | FIN |

## 5) Regras obrigatorias de sistema

1. Bloquear faturamento se nao houver `contrato_assinado` ou `dispensa_contrato_aprovada`.
2. Bloquear autoaprovacao de excecao (solicitante != aprovador).
3. Exigir `motivo`, `usuario`, `timestamp` e `origem` em toda excecao.
4. Registrar historico em todas as transicoes de status.
5. Tratar cancelamento de venda com bloqueio se houver recebimento parcial/total.

## 6) Compatibilidade com o estado atual (implementacao incremental)

Como os status `dispensa_contrato_solicitada`, `dispensa_contrato_aprovada`, `faturamento_liberado` ainda nao existem no enum de fluxo atual, aplicar em 2 fases:

- Fase 1 (rapida, sem quebrar schema):
  - manter status principal em `aprovada`/`contrato_assinado`
  - gravar gate e dispensa em `emailDetails` (metadata)
  - bloquear faturamento por regra de gate

- Fase 2 (estrutural):
  - adicionar novos status no fluxo
  - expor endpoints dedicados para solicitar/aprovar dispensa
  - atualizar dashboard e relatorios por novos status

## 7) Endpoints sugeridos para o gate

- `POST /propostas/:id/contrato/decisao`
  - payload: `{ obrigatorio: boolean, motivo?: string }`
- `POST /propostas/:id/contrato/dispensa/solicitar`
- `POST /propostas/:id/contrato/dispensa/aprovar`
- `POST /propostas/:id/faturamento/liberar`

Todos com auditoria obrigatoria e controle de permissao.
