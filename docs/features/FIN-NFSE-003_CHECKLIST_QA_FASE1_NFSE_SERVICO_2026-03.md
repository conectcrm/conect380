# FIN-NFSE-003 - Checklist de QA e Sign-off da Fase 1 de NFSe de Servico (2026-03)

## 1. Objetivo

Registrar a validacao funcional, tecnica e operacional da fase 1 de NFSe de servico com base em [FIN-NFSE-002_CONTRATO_FUNCIONAL_FASE1_NFSE_SERVICO_2026-03.md](FIN-NFSE-002_CONTRATO_FUNCIONAL_FASE1_NFSE_SERVICO_2026-03.md).

## 2. Evidencias obrigatorias

- [x] Minuta fiscal inicial publicada: `docs/features/FIN-NFE-001_MINUTA_REQUISITOS_NFE_NFSE_2026-03.md`
- [x] Contrato funcional da fase 1 publicado: `docs/features/FIN-NFSE-002_CONTRATO_FUNCIONAL_FASE1_NFSE_SERVICO_2026-03.md`
- [ ] Evidencia automatizada da emissao/consulta/cancelamento publicada em `docs/features/evidencias/`.
- [ ] Evidencia manual de homologacao fiscal publicada em `docs/features/evidencias/`.
- [ ] Definicao documentada do provedor fiscal da fase 1.
- [ ] Definicao documentada do escopo inicial de municipio/operacao.

## 3. Validacao funcional (QA)

- [ ] Criar rascunho fiscal NFSe a partir de origem elegivel funciona.
- [ ] Origem fiscal de outro tenant e bloqueada.
- [ ] Emissao sem dados minimos do tomador e bloqueada.
- [ ] Emissao sem item/objeto de servico elegivel e bloqueada.
- [ ] Solicitar emissao move nota para estado coerente.
- [ ] Retorno de sucesso do provedor registra nota como `emitida`.
- [ ] Retorno de rejeicao registra nota como `rejeitada` e persiste motivo.
- [ ] Consulta de numero/protocolo/XML/PDF funciona quando artefatos existem.
- [ ] Cancelamento fiscal registra estado `cancelada` sem apagar historico.

Responsavel QA:
Data:
Observacoes:

## 4. Validacao de regras de negocio

- [ ] Apenas fase 1 de NFSe de servico esta habilitada.
- [ ] NFe de produto nao entra no fluxo por engano.
- [ ] Emissao fiscal nao substitui nem altera contrato juridico automaticamente.
- [ ] Emissao fiscal nao substitui regras de pagamento/faturamento automaticamente.
- [ ] Gatilho oficial de emissao esta coerente com a politica definida para a fase 1.

Responsavel Produto/Financeiro:
Data:
Observacoes:

## 5. Validacao de seguranca e isolamento

- [ ] Fluxo fiscal respeita `empresa_id`.
- [ ] Configuracao fiscal e artefatos da nota nao vazam entre tenants.
- [ ] Acesso aos endpoints/acoes fiscais respeita permissoes do dominio.
- [ ] XML/PDF/protocolo ficam protegidos conforme politica definida.

Responsavel Tecnico:
Data:
Observacoes:

## 6. Validacao operacional

- [ ] Operacao consegue localizar nota por origem (`contrato`, `fatura` ou emissao manual).
- [ ] Rejeicoes possuem motivo acionavel.
- [ ] Falhas tecnicas no provedor nao apagam rascunho.
- [ ] Cancelamento fiscal possui trilha operacional e motivo.

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
- [ ] Criar backlog tecnico do provedor fiscal da fase 1.
- [ ] Definir se NFe de produto entrara em fase posterior com contrato proprio.
