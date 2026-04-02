# Contrato de Arquitetura da Aplicacao

## Objetivo

Definir regras minimas e executaveis para manter logica de negocio no lugar correto, mesmo com implementacao majoritariamente feita por agentes de IA.

## Fluxo de camadas

`Controller -> Service/Application -> Domain/Policy -> Repository/Infra`

- `Controller` recebe request, valida entrada e delega.
- `Service/Application` concentra regra de negocio e orquestracao.
- `Repository/Infra` concentra acesso a banco, fila, provider externo e cache.
- Frontend chama API somente pela camada `frontend-web/src/services/**`.

## Regras obrigatorias validadas no CI

### `ARCH001` - Controller sem acesso direto a infraestrutura

Arquivos `backend/src/modules/**/*.controller.ts`:

- nao podem importar `typeorm` ou `@nestjs/typeorm`;
- nao podem importar `entity`/`repository` diretamente;
- nao podem usar `@InjectRepository`, `createQueryBuilder` ou `getRepository`.

### `ARCH002` - Service sem dependencia de Controller

Arquivos `backend/src/modules/**/*.service.ts`:

- nao podem importar arquivos `*.controller.ts`.

### `ARCH003` - Frontend sem chamada de API fora da camada de servicos

Arquivos `frontend-web/src/**/*.{ts,tsx}` fora de `frontend-web/src/services/**`:

- nao podem usar `fetch` ou `axios` diretamente.

## Excecoes controladas

Quando houver excecao obrigatoria, o arquivo deve ter comentario explicito:

```ts
// architecture-guardrail:ignore ARCH003 <motivo-tecnico>
```

Sem justificativa, o PR nao deve ser aprovado.

## Comando local

```bash
npm run validate:architecture
```

Variantes uteis:

```bash
node scripts/ci/architecture-guardrails.mjs --all
node scripts/ci/architecture-guardrails.mjs --files backend/src/modules/faturamento/faturamento.controller.ts
```
