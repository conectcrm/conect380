# COM-006 - Checklist de QA e Sign-off da Integracao Contratos -> Financeiro (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional da integracao entre Contratos e Financeiro com base em [COM-003_CONTRATO_INTEGRACAO_CONTRATOS_FINANCEIRO_2026-03.md](COM-003_CONTRATO_INTEGRACAO_CONTRATOS_FINANCEIRO_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato de integracao publicado: `docs/features/COM-003_CONTRATO_INTEGRACAO_CONTRATOS_FINANCEIRO_2026-03.md`
- [x] Contrato funcional de Contratos publicado: `docs/features/COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md`
- [x] Backlog tecnico Vendas -> Financeiro publicado: `docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md`
- [x] Evidencia local do MVP com contratos publicada:
  - `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`
- [x] Sign-off integrado do fluxo Vendas -> Financeiro publicado:
  - `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`
- [ ] Evidencia automatizada dedicada da integracao Contratos -> Financeiro publicada em `docs/features/evidencias/`.
- [ ] Evidencia de QA manual da jornada contrato -> fatura -> pagamento publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Contrato assinado elegivel gera fatura automatica com sucesso.
- [ ] Fatura automatica herda `contratoId`, `clienteId` e `usuarioResponsavelId` coerentes.
- [ ] Criacao manual de fatura com `contratoId` funciona quando o contrato pertence ao tenant.
- [ ] Criacao manual de fatura falha quando `contratoId` e invalido.
- [ ] Criacao manual de fatura falha quando `contratoId` pertence a outro tenant.
- [ ] Faturas vinculadas podem ser listadas e filtradas por `contratoId`.
- [ ] Consulta operacional exibe coerencia entre estado do contrato e estado financeiro esperado.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Contrato nao assinado nao gera fatura automatica no fluxo padrao.
- [ ] Contrato cancelado nao gera nova fatura automatica.
- [ ] Pagamento aprovado reflete no estado financeiro da fatura vinculada.
- [ ] Cancelamento ou estorno financeiro segue as regras do backlog AP304 sem corromper o contrato.
- [ ] Fluxos comerciais e financeiros mantem fronteira clara entre documento contratual e cobranca.

Responsavel Produto/Financeiro:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Validacoes de tenant entre contrato e fatura estao ativas.
- [ ] Contrato de outro tenant nao pode ser referenciado por fatura.
- [ ] Trilhas operacionais mantem `empresa_id` coerente entre modulos.
- [ ] Permissoes comerciais/financeiras para operacoes cruzadas estao coerentes.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao de observabilidade e auditoria

- [ ] Fluxo contrato -> fatura -> pagamento possui rastreabilidade minima.
- [ ] Eventos de integracao relevantes podem ser investigados por correlacao.
- [ ] Divergencias de sincronizacao caem na fila/fluxo operacional esperado.
- [ ] Reprocessamento operacional, quando aplicavel, nao gera duplicidade de efeitos.

Responsavel Operacoes:
Data:
Observacoes:

## 7. Decisao final

- Status final: [ ] GO  [ ] NO-GO
- GO tecnico: [ ] SIM  [ ] NAO
- GO negocio: [ ] SIM  [ ] NAO
- Condicionantes (se houver):
- Data da decisao:
- Responsavel final:

## 8. Proxima acao apos decisao

- [ ] Publicar evidencias dedicadas em `docs/features/evidencias/`.
- [ ] Refinar matriz de status entre Contrato, Fatura e Pagamento quando necessario.
- [ ] Revisar pendencias tecnicas de multi-tenancy e schema legados do acoplamento Contratos/Faturas.
