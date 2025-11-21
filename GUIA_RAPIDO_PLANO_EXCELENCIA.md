# ⚡ GUIA RÁPIDO - PLANO DE EXCELÊNCIA

**TL;DR**: Eliminar gambiarras + Implementar features enterprise em 90 dias

---

## 🎯 OBJETIVO

Transformar ConectCRM de **7.5/10** para **9/10** (nível Zendesk/Intercom)

---

## 🚨 4 GAMBIARRAS IDENTIFICADAS

| # | Gambiarra | Solução | Prazo |
|---|-----------|---------|-------|
| 1 | ❌ WebSocket com reload HTTP | ✅ Adicionar direto no state | 2h |
| 2 | ❌ State descentralizado | ✅ Zustand store | 1 dia |
| 3 | ❌ Upload sem validação | ✅ Validar tipo/tamanho | 3h |
| 4 | ❌ Reconexão sem backoff | ✅ Backoff exponencial | 2h |

**Total**: 2 dias para eliminar TODAS

---

## 📅 ROADMAP (90 DIAS)

### Sprint 1 (Semanas 1-2): 🔴 CRÍTICO
- ✅ Eliminar 4 gambiarras
- ✅ Sistema de filas + distribuição automática
- **Resultado**: Código limpo + filas inteligentes

### Sprint 2 (Semanas 3-4): 🔴 ALTA
- ✅ Templates de mensagens (atalhos `/`)
- ✅ SLA tracking básico
- **Resultado**: Produtividade +50%

### Sprint 3 (Semanas 5-6): 🟡 MÉDIA
- ✅ Dashboard de métricas em tempo real
- **Resultado**: Gestão profissional

### Sprint 4-6 (Semanas 7-12): 🟢 BAIXA
- Email, Instagram, Facebook, Tags, Chatbot

---

## 🚫 REGRAS INEGOCIÁVEIS

### ❌ PROIBIDO

1. `any` no TypeScript → **PR rejeitado**
2. `console.log` em produção → **Build falha**
3. Queries N+1 → **PR rejeitado**
4. Código duplicado → **Refatoração obrigatória**
5. Lógica no Controller → **PR rejeitado**
6. Upload sem validação → **Vulnerabilidade!**
7. HTTP sem timeout → **PR rejeitado**
8. Magic numbers → **Usar constantes**
9. Reconexão sem backoff → **Pode derrubar servidor**
10. Retornar senha/token → **Vulnerabilidade crítica!**

### ✅ OBRIGATÓRIO

1. JSDoc em métodos públicos
2. DTO com validações (class-validator)
3. Try-catch em serviços externos
4. Loading/error/empty states (React)
5. Code coverage >= 70%

---

## 🔍 CHECKLIST PRÉ-COMMIT

```bash
# Executar antes de CADA commit
npm run lint          # ✅ Sem erros
npm run type-check    # ✅ TypeScript OK
npm test              # ✅ Testes passando
npm run format        # ✅ Código formatado

# OU usar script único:
.\verificar-qualidade.ps1
```

---

## 🛠️ SETUP RÁPIDO

```powershell
# 1. Executar setup (instala tudo)
.\setup-qualidade.ps1

# 2. Ler regras completas
code REGRAS_ANTI_GAMBIARRAS.md

# 3. Ler plano detalhado
code PLANO_ELIMINACAO_GAMBIARRAS_ROADMAP.md

# 4. Ver análise completa
code ANALISE_ARQUITETURA_OMNICHANNEL_COMPLETA.md
```

---

## 📊 PROGRESSO ESPERADO

| Semana | Meta | Nota |
|--------|------|------|
| 0 (hoje) | Baseline | 7.5/10 |
| 2 | Sem gambiarras + Filas | 8.0/10 |
| 4 | Templates + SLA | 8.5/10 |
| 6 | Dashboard | 8.7/10 |
| 12 | Multi-canal completo | 9.0/10 |

---

## 🎯 CRITÉRIOS DE SUCESSO

**Sprint 1 (Crítico)**:
- ✅ 0 gambiarras
- ✅ Coverage >= 70%
- ✅ Build sem warnings
- ✅ Filas automáticas

**Final (90 dias)**:
- ✅ Nota >= 9/10
- ✅ Comparável a Zendesk
- ✅ Multi-canal
- ✅ SLA + Templates + Dashboard

---

## 🚀 COMEÇAR AGORA

### Dia 1 (Hoje):
```powershell
# 1. Configurar ambiente
.\setup-qualidade.ps1

# 2. Corrigir Gambiarra #1 (2h)
code frontend-web/src/features/atendimento/omnichannel/hooks/useMensagens.ts

# 3. Executar testes
npm test
```

### Dia 2 (Amanhã):
```powershell
# 1. Corrigir Gambiarra #2 (Zustand)
npm install zustand
code frontend-web/src/stores/atendimentoStore.ts

# 2. Migrar componentes
# ...
```

---

## 📚 DOCUMENTOS PRINCIPAIS

1. **REGRAS_ANTI_GAMBIARRAS.md** ← Leia PRIMEIRO!
2. **PLANO_ELIMINACAO_GAMBIARRAS_ROADMAP.md** ← Plano completo
3. **ANALISE_ARQUITETURA_OMNICHANNEL_COMPLETA.md** ← Análise técnica

---

## 💡 DICA PRINCIPAL

> **"Não acumule débito técnico. Corrija gambiarras AGORA, não depois."**

---

## ✅ TEMPLATE DE COMMIT

```
feat(atendimento): corrigir gambiarra de reconexão WebSocket

- Implementar backoff exponencial
- Adicionar retry com jitter
- Limitar tentativas em 10

Closes #123
```

---

## 🏆 META FINAL

**Sistema ConectCRM omnichannel comparável a Zendesk/Intercom, SEM gambiarras, com código limpo e manutenível.**

**Nota alvo**: **9/10** ⭐⭐⭐⭐⭐⭐⭐⭐⭐

---

**Criado**: 06/11/2025  
**Prazo**: 90 dias (até 04/02/2026)  
**Status**: 🟢 PRONTO PARA COMEÇAR
