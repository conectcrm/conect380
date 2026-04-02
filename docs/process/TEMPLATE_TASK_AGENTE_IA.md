# Template de Task para Agente de IA

Use este template para abrir tarefas que serao executadas por agentes de IA com menor risco de desvio arquitetural.

## 1) Contexto

- Problema observado:
- Impacto no negocio:
- Modulo(s) impactado(s):

## 2) Escopo da entrega

- O que deve ser implementado:
- O que nao deve ser alterado:
- Interfaces/rotas afetadas:

## 3) Contrato de arquitetura obrigatorio

- Camada permitida para regra de negocio: `service/domain`
- Controller deve apenas orquestrar request/response: `sim/nao`
- Frontend deve consumir API somente via `frontend-web/src/services/**`: `sim/nao`
- Restricoes de dependencia:
  - Proibido em controller: `typeorm`, `@nestjs/typeorm`, entity/repository
  - Proibido em service: importar controller

## 4) Regras de negocio impactadas

Preencha com IDs do catalogo:

- `FIN-RXXX`:
- `FIN-RXXX`:

Catalogo: `docs/rules/financeiro/REGRAS_CRITICAS_FINANCEIRO.md`

## 5) Arquivos permitidos para edicao

- Backend:
- Frontend:
- Docs:

## 6) Testes obrigatorios

- Unitarios:
- Integracao:
- E2E:
- Preflight (quando aplicavel):

## 7) Criterios de aceite

- [ ] Regra de negocio implementada na camada correta
- [ ] Sem violacao de arquitetura (`npm run validate:architecture`)
- [ ] Testes obrigatorios executados e verdes
- [ ] Evidencias registradas no PR

## 8) Evidencias esperadas no PR

- Lista de arquivos alterados
- Comandos executados
- Resultado de cada comando (pass/fail)
- Mapa `regra -> implementacao -> testes`
