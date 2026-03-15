# COM-007 - Checklist de QA e Sign-off da Assinatura Eletronica (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional do fluxo de assinatura eletronica com base em [COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md](COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Contrato funcional de assinatura publicado: `docs/features/COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md`
- [x] DTOs de assinatura revisados: `backend/src/modules/contratos/dto/assinatura.dto.ts`
- [x] Entidade de assinatura revisada: `backend/src/modules/contratos/entities/assinatura-contrato.entity.ts`
- [x] Service de assinatura revisado: `backend/src/modules/contratos/services/assinatura-digital.service.ts`
- [x] Endpoints de assinatura revisados em `backend/src/modules/contratos/contratos.controller.ts`
- [ ] Evidencia automatizada dedicada do fluxo de assinatura publicada em `docs/features/evidencias/`.
- [ ] Evidencia manual do fluxo tokenizado e da confirmacao externa/manual publicada em `docs/features/evidencias/`.

## 3. Validacao funcional (QA)

- [ ] Criar solicitacao de assinatura para contrato elegivel funciona.
- [ ] Criar solicitacao de assinatura falha para contrato inexistente.
- [ ] Criar solicitacao de assinatura falha para contrato fora de `aguardando_assinatura`.
- [ ] Duplicidade de assinatura pendente para mesmo usuario/contrato e bloqueada.
- [ ] Consulta `GET /contratos/:id/assinaturas` retorna lista coerente.
- [ ] Consulta `GET /contratos/assinar/:token` retorna contexto valido para token ativo.
- [ ] Token invalido e rejeitado corretamente.
- [ ] Token expirado muda para `expirado` e e rejeitado corretamente.
- [ ] `POST /contratos/assinar/processar` conclui assinatura e persiste evidencias minimas.
- [ ] `POST /contratos/assinar/rejeitar` persiste rejeicao e motivo.
- [ ] `POST /contratos/:id/confirmar-assinatura-externa` funciona para contrato elegivel.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Contrato assinado reflete o resultado de assinatura valida.
- [ ] Contrato cancelado nao aceita confirmacao externa/manual.
- [ ] Contrato expirado nao aceita confirmacao externa/manual.
- [ ] Data de assinatura futura e rejeitada.
- [ ] Falha em sincronizacao obrigatoria executa rollback coerente da assinatura processada ou criada.

Responsavel Produto/Comercial:
Data:
Observacoes:

## 5. Validacao de seguranca e acesso

- [ ] Criacao e listagem autenticadas respeitam permissoes do modulo comercial.
- [ ] Endpoints publicos de token nao exigem JWT, mas validam token corretamente.
- [ ] Fluxo publico nao expoe assinatura de contrato fora do token valido.
- [ ] Trilhas de `ipAssinatura` e `userAgent` sao persistidas quando fornecidas.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao de observabilidade e auditoria

- [ ] Fluxos de criacao, processamento, rejeicao e expiracao geram rastreabilidade minima.
- [ ] Confirmacao externa/manual deixa registro auditavel no contrato.
- [ ] Historico de assinatura nao some em atualizacoes operacionais comuns.

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
- [x] Publicar backlog tecnico de provider externo quando a operacao exigir integracao formal (COM-008).
- [ ] Refinar exigencias juridicas/evidenciais da fase seguinte.
