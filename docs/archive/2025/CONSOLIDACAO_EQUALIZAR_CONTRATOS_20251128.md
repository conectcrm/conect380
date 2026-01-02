# Consolidação — Equalização de Contratos (28/11/2025)

## 1. Escopo da Rodada
- **Oportunidades**: refatoração do service para alinhar 100% com o contrato real (`/oportunidades` CRUD, métricas, pipeline e atividades).
- **Propostas**: limpeza de endpoints inexistentes e ajuste do service principal para refletir apenas as rotas disponíveis no backend NestJS.
- **Clientes HTTP**: padronização para uso exclusivo do wrapper compartilhado (`api.ts`) tanto em oportunidades quanto em usuários.

## 2. Artefatos Alterados
| Arquivo | Ação | Observação |
| --- | --- | --- |
| `frontend-web/src/services/oportunidadesService.ts` | Refatorado | Removeu axios privado, passou a usar `api`, eliminou métodos sem backend (`/buscar`, `/clonar`, `/exportar`, etc.). |
| `frontend-web/src/services/propostasService.ts` | Atualizado | Contrato reduzido para rotas existentes (`findAll`, `findById`, `create`, `delete`, `updateStatus`), remoção de `generatePDF`, `duplicate`, `sendByEmail`, estatísticas mock. |
| `frontend-web/src/services/usuariosService.ts` | Refatorado | Padronizado para usar `api`, garantindo interceptores globais e remoção de duplicação de token/baseURL. |

## 3. Validações Executadas
- `cd frontend-web && CI=true npm test`
  - 11 suítes / 136 testes ✅
  - Aviso esperado de deduplicação no store de atendimento (não regressivo).
- `cd backend && npm run test`
  - 5 suítes / 63 testes ✅
  - Logs de serviço (faturas, distribuição/ticket) originados dos próprios testes.

## 4. Status Final dos Todos
1. Mapear gaps oportunidades — **Concluído**
2. Padronizar oportunidadesService — **Concluído**
3. Complementar ajustes propostas — **Concluído**
4. Padronizar clients HTTP — **Concluído**
5. Testar e documentar rodada — **Concluído** (este documento)

## 5. Próximos Passos Recomendados
- Monitorar futuras demandas por busca, clonagem ou exportação em oportunidades/propostas antes de reintroduzir endpoints.
- Revisitar UI de Propostas quando o backend disponibilizar PDF/duplicação/envio e reimplementar handlers com base no contrato oficial.
