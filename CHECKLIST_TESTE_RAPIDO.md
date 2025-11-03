# ✅ CHECKLIST RÁPIDO DE TESTE

## 🚀 ANTES DE COMEÇAR
- [ ] Navegador aberto (Chrome/Edge/Firefox)
- [ ] DevTools aberto (F12)
- [ ] Aba "Console" selecionada no DevTools

---

## 📋 TESTE RÁPIDO (5 minutos)

### 1️⃣ Abrir e Logar
- [ ] Acessar `http://localhost:3000`
- [ ] Fazer login
- [ ] Sem erros no console

### 2️⃣ Ver Tickets
- [ ] Menu → Atendimento → WhatsApp
- [ ] Lista de tickets carrega
- [ ] Cada ticket tem avatar
- [ ] Bolinhas verde/cinza visíveis
- [ ] Badge vermelho se houver msgs não lidas

### 3️⃣ Testar Atualização
- [ ] Selecionar um ticket
- [ ] Enviar mensagem de teste
- [ ] Aguardar 2-3 segundos
- [ ] Verificar log no console:
```
[WhatsApp] Status de contato atualizado via WebSocket
```
- [ ] Bolinha mudou para VERDE
- [ ] Animação pulse ativa

---

## ✅ APROVAÇÃO

**Se todos os itens acima estão ✅:**
→ Sistema está funcionando perfeitamente! 🎉

**Se algum item está ❌:**
→ Consulte `GUIA_TESTE_MANUAL.md` seção "Problemas Comuns"

---

## 📸 EVIDÊNCIAS

Tire screenshots de:
1. Lista de tickets com avatares
2. Console mostrando log WebSocket
3. Badge de mensagens não lidas

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Pré-requisito:** Backend e frontend rodando
