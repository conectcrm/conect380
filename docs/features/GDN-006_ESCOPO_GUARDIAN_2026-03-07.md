# GDN-006 - Escopo e fronteira do Guardian (2026-03-07)

## Objetivo

Definir o que pertence ao Guardian e o que permanece no sistema operacional do cliente.

## Regras de fronteira

1. Guardian e uma superficie isolada de administracao global.
2. Sistema do cliente nao deve expor rota, endpoint ou cliente HTTP do Guardian.
3. Entitlement e controles administrativos devem ser validados no backend.

## Escopo dentro do Guardian

1. Gestao global de empresas (status, plano, limites).
2. Gestao de planos, modulos e precificacao.
3. Operacoes de cobranca global e ajustes administrativos.
4. Auditoria administrativa central.
5. Gestao de privilegios de alto risco.

## Escopo fora do Guardian (app cliente)

1. Operacao diaria da empresa cliente.
2. CRM, Atendimento, Vendas, Financeiro da propria empresa.
3. Configuracoes locais permitidas ao admin da propria empresa.

## Diretriz tecnica de isolamento

1. Frontend:
   - `guardian-web` em host/subdominio separado.
   - remover menu/rotas/clientes admin globais do `frontend-web`.
2. Backend:
   - namespace dedicado `guardian/*`.
   - guards de role/permissao/MFA antes de qualquer handler.
3. Documentacao:
   - nao publicar endpoints guardian em swagger publico.

## Controles de seguranca

1. Logs de auditoria imutaveis para acoes criticas.
2. Rate limit e protecao de sessao reforcada em rotas guardian.
3. Politica de segredo: sem hardcode de endpoint sensivel no cliente.
