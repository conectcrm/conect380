# 🔍 ANÁLISE: Lógica de Visibilidade no Bot

## ✅ Status Atual: **SEGURO E FUNCIONAL**

A lógica atual do endpoint `/nucleos/bot/opcoes` está **funcionando corretamente** com os seguintes filtros:

### Filtros Aplicados

**Para Núcleos:**
```typescript
.andWhere('nucleo.ativo = true')
.andWhere('nucleo.visivelNoBot = true')
```

**Para Departamentos:**
```typescript
.andWhere('dep.ativo = true')
.andWhere('dep.visivelNoBot = true')
```

---

## 📊 Matriz de Cenários

| Cenário | Núcleo | Departamento | Resultado no Bot |
|---------|--------|--------------|------------------|
| **1. Tudo OK** | ✅ Ativo + 👁️ Visível | ✅ Ativo + 👁️ Visível | ✅ Aparece completo |
| **2. Núcleo oculto** | ✅ Ativo + 🚫 Oculto | ✅ Ativo + 👁️ Visível | ❌ Não aparece |
| **3. Núcleo inativo** | ⏸️ Inativo + 👁️ Visível | ✅ Ativo + 👁️ Visível | ❌ Não aparece |
| **4. Dept oculto** | ✅ Ativo + 👁️ Visível | ✅ Ativo + 🚫 Oculto | ⚠️ Núcleo aparece vazio |
| **5. Dept inativo** | ✅ Ativo + 👁️ Visível | ⏸️ Inativo + 👁️ Visível | ⚠️ Núcleo aparece vazio |
| **6. Ambos ocultos** | 🚫 Oculto | 🚫 Oculto | ❌ Não aparece |
| **7. Ambos inativos** | ⏸️ Inativo | ⏸️ Inativo | ❌ Não aparece |

---

## ⚠️ Comportamento Atual (Potencial Melhoria)

### Cenário Problemático
Se um núcleo está **ativo e visível**, mas **todos os seus departamentos estão ocultos ou inativos**:

**Resposta Atual:**
```json
[
  {
    "id": "nucleo-123",
    "nome": "Suporte Técnico",
    "departamentos": []  // ← Array vazio!
  }
]
```

**Experiência do Usuário:**
1. Cliente seleciona "Suporte Técnico"
2. Não aparece nenhum departamento para escolher
3. Cliente fica sem opção 😕

---

## ✅ Solução Recomendada (Opcional)

### Opção 1: Filtrar Núcleos Vazios (Recomendado)
Só retornar núcleos que tenham **pelo menos 1 departamento visível**:

```typescript
// Após buscar núcleos e departamentos
const resultado = await Promise.all(...);

// Filtrar núcleos vazios
return resultado.filter(nucleo => nucleo.departamentos.length > 0);
```

**Vantagem:** Cliente só vê opções válidas  
**Desvantagem:** Se todos os departamentos forem ocultados, o núcleo "desaparece"

### Opção 2: Criar Ticket Direto no Núcleo
Se núcleo não tem departamentos, criar ticket direto no núcleo:

```typescript
if (nucleo.departamentos.length === 0) {
  // No bot, criar ticket direto sem pedir departamento
  await criarTicket({ nucleoId, telefone });
}
```

**Vantagem:** Cliente sempre consegue ser atendido  
**Desvantagem:** Mais complexo de implementar

### Opção 3: Manter Como Está
Deixar o bot lidar com núcleos vazios mostrando mensagem:

```
"Desculpe, não há departamentos disponíveis neste setor no momento. 
Você será direcionado para o primeiro atendente disponível."
```

**Vantagem:** Simples, flexível  
**Desvantagem:** Requer lógica extra no bot

---

## 🎯 Recomendação Final

### Para Produção:
Use **Opção 1** (filtrar núcleos vazios) com **Opção 3** (mensagem de fallback)

### Implementação:
```typescript
// No nucleo.service.ts - findOpcoesParaBot()
const resultado = await Promise.all(...);

// Filtrar núcleos que têm pelo menos 1 departamento
const nucleosComDepartamentos = resultado.filter(
  nucleo => nucleo.departamentos.length > 0
);

// Se não houver nenhum núcleo com departamentos, retornar array vazio
// O bot pode mostrar mensagem: "No momento não há setores disponíveis"
return nucleosComDepartamentos;
```

---

## 📝 Casos de Uso Reais

### Caso 1: Manutenção Programada
**Cenário:** Departamento de "Suporte Nível 2" em manutenção  
**Ação:** Desmarcar "Visível no Bot" no departamento  
**Resultado:** Núcleo "Suporte" ainda aparece com "Suporte Nível 1"  
**Status:** ✅ Funciona perfeitamente

### Caso 2: Núcleo Temporariamente Indisponível
**Cenário:** Todo o núcleo "Vendas" está em treinamento  
**Ação:** Desmarcar "Visível no Bot" no núcleo OU desativar núcleo  
**Resultado:** Núcleo "Vendas" não aparece no bot  
**Status:** ✅ Funciona perfeitamente

### Caso 3: Restruturação de Departamentos
**Cenário:** Movendo todos os departamentos de "SAC" para "Atendimento"  
**Ação:** Ocultar departamentos temporariamente  
**Resultado:** Núcleo "SAC" aparece vazio (potencial problema)  
**Status:** ⚠️ Recomendado implementar Opção 1

---

## ✅ Checklist de Validação

- [x] Núcleo inativo não aparece no bot
- [x] Núcleo oculto não aparece no bot
- [x] Departamento inativo não aparece no bot
- [x] Departamento oculto não aparece no bot
- [x] Filtros aplicados corretamente
- [ ] Núcleo sem departamentos não aparece (melhoria recomendada)
- [ ] Mensagem de fallback implementada no bot (se necessário)

---

## 🚀 Implementar Melhoria?

**Se quiser implementar a Opção 1** (filtrar núcleos vazios), execute:

```bash
# Arquivo: backend/src/modules/triagem/services/nucleo.service.ts
# Adicione após o Promise.all():

return resultado.filter(nucleo => nucleo.departamentos.length > 0);
```

Isso garante que **apenas núcleos com departamentos disponíveis** apareçam no bot.

---

## 📚 Documentação Relacionada

- `README_VISIBILIDADE_BOT.md` - Guia completo
- `SISTEMA_VISIBILIDADE_BOT.md` - Documentação técnica
- `ERRO_500_RESOLVIDO.md` - Solução do erro de colunas

---

## 🎉 Conclusão

A lógica atual está **SEGURA e FUNCIONAL**. 

✅ **Não há risco** de mostrar núcleos/departamentos inativos ou ocultos  
⚠️ **Melhoria opcional:** Filtrar núcleos sem departamentos disponíveis  
📖 **Documentação:** Completa e detalhada
