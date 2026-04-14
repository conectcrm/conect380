# COM-002 - Checklist de QA e Sign-off do Modulo Contratos v1 (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional do modulo Contratos com base em [COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md](COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato funcional do modulo publicado: `docs/features/COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md`
- [x] Contrato de integracao Contratos -> Financeiro publicado: `docs/features/COM-003_CONTRATO_INTEGRACAO_CONTRATOS_FINANCEIRO_2026-03.md`
- [x] Contrato funcional de assinatura eletronica publicado: `docs/features/COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md`
- [x] Checklist de QA da assinatura eletronica publicado: `docs/features/COM-007_CHECKLIST_QA_ASSINATURA_ELETRONICA_2026-03.md`
- [x] Controller do modulo identificado e revisado: `backend/src/modules/contratos/contratos.controller.ts`
- [x] DTOs vigentes revisados: `backend/src/modules/contratos/dto/contrato.dto.ts`
- [x] Entidade vigente revisada: `backend/src/modules/contratos/entities/contrato.entity.ts`
- [x] Evidencia local do MVP registrada no fluxo integrado:
  - `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`
- [ ] Evidencia automatizada dedicada do modulo Contratos publicada em `docs/features/evidencias/`.
- [ ] Evidencia de QA manual da UI/fluxo operacional publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Criar contrato com payload minimo obrigatorio funciona sem erro.
- [ ] Criar contrato com `propostaId` opcional funciona.
- [ ] Criar contrato com `condicoesPagamento` valida corretamente parcelas, dia e valor.
- [ ] Listagem `GET /contratos` retorna contratos do tenant.
- [ ] Filtro por `status` funciona.
- [ ] Filtro por `clienteId` funciona.
- [ ] Filtro por `propostaId` funciona.
- [ ] Filtro por intervalo de datas funciona.
- [ ] Busca por `id` retorna contrato correto.
- [ ] Busca por `numero` retorna contrato correto.
- [ ] Atualizacao via `PUT /contratos/:id` altera apenas campos permitidos.
- [ ] Cancelamento via `DELETE /contratos/:id` registra resultado coerente.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] `numero` e unico e nao gera duplicidade.
- [ ] `clienteId` deve referenciar cliente valido do tenant.
- [ ] `usuarioResponsavelId` deve referenciar usuario valido do tenant.
- [ ] `valorTotal` menor ou igual a zero e rejeitado.
- [ ] `dataFim` anterior a `dataInicio` e tratada conforme regra vigente.
- [ ] Contrato assinado nao pode ser tratado como contrato cancelado sem historico.
- [ ] Fluxo de PDF, quando acionado, permanece coerente com o contrato base.

Responsavel Produto/Comercial:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Endpoints internos exigem autenticacao.
- [ ] Listagem respeita `empresa_id`.
- [ ] Busca por `id` respeita `empresa_id`.
- [ ] Busca por `numero` respeita `empresa_id`.
- [ ] Atualizacao de contrato de outro tenant e bloqueada.
- [ ] Cancelamento de contrato de outro tenant e bloqueado.
- [ ] Permissoes comerciais de leitura, criacao, edicao e exclusao estao coerentes.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao de integracoes associadas

- [ ] Contrato criado a partir de proposta segue rastreabilidade minima.
- [ ] PDF do contrato pode ser gerado/consultado sem inconsistencias basicas.
- [ ] Subfluxo de assinatura nao corrompe dados principais do contrato.
- [ ] Fluxos publicos de assinatura externa, se usados, possuem validacao adequada.
- [ ] Integracao com Financeiro nao depende de campos fora do contrato funcional base.

Responsavel Operacoes/Comercial:
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

- [ ] Publicar evidencias adicionais em `docs/features/evidencias/`.
- [x] Contrato de integracao Contratos -> Financeiro (COM-003) publicado.
- [x] Refinar minuta de assinatura eletronica em contrato funcional v1 publicado (COM-005).
- [ ] Reconciliar pendencias tecnicas de multi-tenancy do legado do modulo Contratos.
