# 🔧 CORREÇÃO: Bot Usando Configurações Antigas (Departamentos)

**Data**: 10 de novembro de 2025  
**Problema Identificado**: Bot ainda tenta buscar departamentos (tabela antiga)  
**Impacto**: Nenhum núcleo aparece no bot porque filtro exige departamentos

---

## ❌ PROBLEMA ENCONTRADO

### NucleoService.findOpcoesParaBot()

**Código Antigo** (ANTES):
```typescript
// Buscar departamentos
const departamentos = await this.nucleoRepository.manager
  .getRepository('departamentos')  // ❌ Tabela antiga que não existe mais!
  .createQueryBuilder('dep')
  .where('dep.nucleoId = :nucleoId', { nucleoId: nucleo.id })
  .andWhere('dep.ativo = true')
  .andWhere('dep.visivelNoBot = true')
  .getMany();

// Filtrar apenas núcleos com departamentos
const filtrados = resultado.filter((nucleo) => nucleo.departamentos.length > 0);
// ❌ Resultado: ZERO núcleos porque nenhum tem departamentos!

return filtrados;
```

**Resultado**: 
- Bot busca 3 núcleos (Suporte, Comercial, Financeiro)
- Tenta buscar departamentos de cada um
- Nenhum núcleo tem departamentos (estrutura antiga)
- **Retorna lista VAZIA** ❌
- **Bot não mostra opções para o usuário** ❌

---

## ✅ CORREÇÃO APLICADA

### Arquivo: `backend/src/modules/triagem/services/nucleo.service.ts`

#### Mudança 1: Remover busca de departamentos (linhas 321-334)

**ANTES**:
```typescript
// Buscar departamentos
const departamentos = await this.nucleoRepository.manager
  .getRepository('departamentos')
  .createQueryBuilder('dep')
  .where('dep.nucleoId = :nucleoId', { nucleoId: nucleo.id })
  .andWhere('dep.ativo = true')
  .andWhere('dep.visivelNoBot = true')
  .orderBy('dep.ordem', 'ASC')
  .addOrderBy('dep.nome', 'ASC')
  .getMany();

departamentos: departamentos.map((dep: any) => ({
  id: dep.id,
  nome: dep.nome,
  // ...
})),
```

**DEPOIS** (✅ CORRIGIDO):
```typescript
// ✅ ATUALIZADO: Núcleos agora são a estrutura principal (não mais departamentos)
// Núcleos substituíram os departamentos na nova arquitetura
console.log('✅ [NUCLEO DEBUG] Núcleo processado:', nucleo.nome);

// ✅ REMOVIDO: Não há mais departamentos - núcleos são a entidade principal
departamentos: [], // Array vazio para compatibilidade com código legado
```

#### Mudança 2: Remover filtro de departamentos (linhas 372-380)

**ANTES**:
```typescript
// Retornar APENAS núcleos que têm departamentos
const filtrados = resultado.filter((nucleo) => nucleo.departamentos.length > 0);
// ❌ Resultado: lista vazia!

return filtrados;
```

**DEPOIS** (✅ CORRIGIDO):
```typescript
// ✅ ATUALIZADO: Retornar TODOS os núcleos visíveis no bot (não filtrar por departamentos)
// Na nova arquitetura, os núcleos são a entidade principal
console.log('✅ [NUCLEO DEBUG] Retornando todos os', resultado.length, 'núcleos visíveis');

return resultado;
```

---

## 🎯 RESULTADO ESPERADO

### ANTES da Correção:
```
Cliente: "Olá"

Bot busca núcleos:
✅ Suporte Técnico (visível)
✅ Comercial (visível)
✅ Financeiro (visível)

Bot busca departamentos:
❌ Suporte: 0 departamentos
❌ Comercial: 0 departamentos
❌ Financeiro: 0 departamentos

Bot filtra núcleos com departamentos:
❌ Lista vazia!

Bot retorna: []

Cliente recebe: (nada) ❌
```

### DEPOIS da Correção:
```
Cliente: "Olá"

Bot busca núcleos:
✅ Suporte Técnico (visível)
✅ Comercial (visível)
✅ Financeiro (visível)

Bot NÃO busca departamentos (removido)

Bot retorna: [Suporte, Comercial, Financeiro]

Cliente recebe:
"Olá! 👋 Como posso ajudar?

1️⃣ Suporte Técnico
2️⃣ Comercial
3️⃣ Financeiro

Digite o número da opção desejada."
```

---

## 🔍 OUTRAS REFERÊNCIAS A DEPARTAMENTOS

O arquivo `triagem-bot.service.ts` ainda tem **58+ referências** a departamentos em:

### 1. Lógica de "Escolha de Departamento" (linhas 667-680)
```typescript
} else if (sessao.etapaAtual === 'escolha-departamento') {
  const departamentosDisponiveis = sessao.contexto?.__departamentosDisponiveis;
  // ...
}
```

**Status**: ⚠️ **MANTER POR ENQUANTO**  
**Motivo**: Pode haver fluxos legados que ainda usam "departamentos"  
**Ação futura**: Deprecar gradualmente após migração completa

### 2. Contexto de Ticket (linhas 341, 409, 412-413)
```typescript
relations: ['departamento'],
ultimoTicket.departamento?.nome
contextoInicial.__ultimoDepartamentoId
```

**Status**: ⚠️ **MANTER POR ENQUANTO**  
**Motivo**: Entidade `Ticket` ainda tem coluna `departamentoId` (legacy)  
**Ação futura**: Migration para remover coluna após garantir que todos usam `nucleoId`

### 3. Criação de Ticket (linha 1005)
```typescript
const departamentoId = sessao.contexto?.destinoDepartamentoId || null;
```

**Status**: ⚠️ **MANTER POR ENQUANTO**  
**Motivo**: Compatibilidade com fluxos antigos  
**Ação futura**: Remover após migração completa

---

## ✅ VALIDAÇÃO

### Teste 1: Verificar Núcleos Retornados

```sql
-- Deve retornar 3 núcleos
SELECT id, nome, ativo, visivel_no_bot 
FROM nucleos_atendimento 
WHERE ativo = true AND visivel_no_bot = true;

-- Resultado esperado:
-- Suporte Técnico
-- Comercial
-- Financeiro
```

### Teste 2: Enviar Webhook de Teste

```bash
# Reiniciar backend para aplicar mudanças
cd backend
npm run start:dev

# Enviar webhook
curl -X POST http://localhost:3001/api/atendimento/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "metadata": { "phone_number_id": "704423209430762" },
          "messages": [{
            "from": "5511999887766",
            "text": { "body": "Olá" },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

### Teste 3: Verificar Logs do Backend

```
Procurar por:
✅ [NUCLEO DEBUG] Retornando todos os 3 núcleos visíveis
✅ [BOT] Enviando menu com 3 opções
✅ [WHATSAPP] Mensagem enviada com sucesso
```

---

## 🚀 PRÓXIMOS PASSOS

### Curto Prazo (Agora):
1. ✅ **CONCLUÍDO**: Remover busca de departamentos em `findOpcoesParaBot`
2. ✅ **CONCLUÍDO**: Remover filtro de departamentos
3. ⏳ **PENDENTE**: Reiniciar backend
4. ⏳ **PENDENTE**: Testar webhook real

### Médio Prazo (Próximas semanas):
1. ⏳ Deprecar lógica de "escolha-departamento" no FlowEngine
2. ⏳ Migration para remover coluna `departamentoId` da tabela `tickets`
3. ⏳ Limpar imports de `criarOpcoesDepartamentos`
4. ⏳ Remover tabela `departamentos` antiga (se ainda existir)

### Longo Prazo (Próximos meses):
1. ⏳ Revisar TODOS os fluxos de bot para usar apenas núcleos
2. ⏳ Atualizar documentação do sistema
3. ⏳ Remover código legado relacionado a departamentos

---

## 📊 STATUS FINAL

```
╔═══════════════════════════════════════════════════════╗
║       CORREÇÃO: BOT AGORA USA NÚCLEOS CORRETAMENTE    ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  ✅ Busca de departamentos REMOVIDA                   ║
║  ✅ Filtro de departamentos REMOVIDO                  ║
║  ✅ Núcleos agora são retornados diretamente          ║
║  ✅ Array vazio para compatibilidade legado           ║
║                                                       ║
║  ⏳ Aguardando: Reiniciar backend                     ║
║  ⏳ Aguardando: Teste com webhook real                ║
║                                                       ║
║  Impacto: Bot agora mostrará 3 opções ✅              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

**Arquivos Modificados**:
- ✅ `backend/src/modules/triagem/services/nucleo.service.ts` (2 mudanças)

**Arquivos Verificados** (não modificados ainda):
- ⚠️ `backend/src/modules/triagem/services/triagem-bot.service.ts` (58+ refs a departamentos - legado)

**Teste Necessário**: Reiniciar backend + Enviar webhook + Verificar logs
