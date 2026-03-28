# Baseline de Remocao de Legado

Data: 2026-03-27

## Resumo objetivo
- Busca por marcadores de legado no codigo (`legacy|legado|fallback|compatibilidade`) encontrou `1503` ocorrencias.
- O numero inclui comentarios historicos, compatibilidade ativa e testes de transicao.
- Nem todo item deve ser removido; parte protege rotas antigas em producao.

## Top hotspots (por volume)
1. `backend/src/modules/propostas/propostas.service.ts` (82)
2. `backend/src/modules/admin/guards/legacy-admin-transition.guard.spec.ts` (65)
3. `frontend-web/src/services/produtosService.ts` (44)
4. `backend/src/modules/oportunidades/oportunidades.service.ts` (39)
5. `frontend-web/src/features/propostas/services/propostasService.ts` (35)
6. `backend/src/modules/admin/guards/legacy-admin-transition.guard.ts` (31)
7. `backend/src/modules/faturamento/services/documento-fiscal.service.ts` (26)

## Limpeza realizada nesta fase
1. Removido alias legado de compras no namespace de vendas:
- `/vendas/cotacoes`
- `/vendas/aprovacoes`

Arquivos alterados:
- `frontend-web/src/App.tsx`
- `frontend-web/src/config/menuConfig.ts`
- `frontend-web/src/config/mvpScope.ts`
- `frontend-web/src/config/__tests__/menuConfig.permissions.test.ts`

2. Mantido legado de transicao que ainda protege UX/links antigos:
- `/financeiro/cotacoes` -> `/compras/cotacoes`
- `/financeiro/compras/aprovacoes` -> `/compras/aprovacoes`

Motivo: `PermissionPathGuard` usa `canUserAccessPath` antes do roteamento final.
Remover isso agora pode bloquear usuarios de `COMPRAS` sem modulo `FINANCEIRO`.

## Proximos blocos recomendados (ordem)

### Bloco A (baixo risco)
- Limpar aliases de menu/rota sem uso em app nem bookmarks oficiais.
- Consolidar redirects duplicados em `App.tsx`.
- Garantir testes de permissao/roteamento verdes.

### Bloco B (medio risco)
- Reduzir fallbacks de servicos front (`produtosService`, `agendaEventosService`) quando endpoint canonico estiver estavel.
- Manter telemetria de erro por 7 dias apos corte.

### Bloco C (medio/alto risco)
- Revisar e reduzir `legacy-admin-transition.guard*` no backend.
- Exige validacao com perfis admin/guardian em homologacao.

### Bloco D (alto risco)
- Remocao de aliases legados de permissao (`ATENDIMENTO`, `COMPRAS`) e compat de payloads antigos.
- Requer migracao de dados/usuarios + janela de comunicacao.

## Regras de seguranca para o processo
- Sempre remover por modulo/vertical, nunca em lote grande.
- Rodar testes focados + type-check em cada bloco.
- Validar rotas protegidas com usuario sem permissao antes e depois.
- So remover compatibilidade de producao quando houver evidencia de nao uso.
