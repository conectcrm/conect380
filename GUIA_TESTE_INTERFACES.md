# 🧪 GUIA DE TESTES - INTERFACES DE GESTÃO

**Data:** 16/10/2025 20:46  
**Status:** 🟢 Backend e Frontend ONLINE

---

## 🚀 Servidores Ativos

- ✅ **Backend NestJS:** http://localhost:3001
- ✅ **Frontend React:** http://localhost:3000

---

## 📋 ROTEIRO DE TESTES

### 🎯 **TESTE 1: Gestão de Núcleos**

**URL:** http://localhost:3000/gestao/nucleos

#### ✅ Validações a Fazer:

1. **Carregamento Inicial**
   - [ ] Página abre sem erros
   - [ ] Tabela carrega os 3 núcleos seed:
     - SUPORTE (SUP) - Round Robin
     - VENDAS (VND) - Menor Carga
     - FINANCEIRO (FIN) - Manual

2. **Filtros**
   - [ ] Buscar por nome: "SUPORTE" → retorna 1 resultado
   - [ ] Filtro Status: Selecionar "Ativo" → mostra núcleos ativos
   - [ ] Filtro Tipo Distribuição: "Round Robin" → mostra SUPORTE

3. **Criar Novo Núcleo**
   - [ ] Clicar botão "+ Novo Núcleo"
   - [ ] Preencher formulário:
     ```
     Nome: TESTE NAVEGADOR
     Código: TST
     Canal: WHATSAPP
     Tipo Distribuição: round_robin
     Capacidade Máxima: 10
     Horário Início: 08:00
     Horário Fim: 18:00
     Ativo: ✓
     ```
   - [ ] Clicar "Salvar"
   - [ ] Verificar se aparece na tabela

4. **Editar Núcleo**
   - [ ] Clicar ícone ✏️ no núcleo TESTE NAVEGADOR
   - [ ] Alterar nome para "TESTE EDITADO"
   - [ ] Salvar
   - [ ] Verificar atualização na tabela

5. **Excluir Núcleo**
   - [ ] Clicar ícone 🗑️ no núcleo TESTE EDITADO
   - [ ] Confirmar exclusão
   - [ ] Verificar que sumiu da tabela

---

### 🌊 **TESTE 2: Gestão de Fluxos**

**URL:** http://localhost:3000/gestao/fluxos

#### ✅ Validações a Fazer:

1. **Carregamento Inicial**
   - [ ] Página abre sem erros
   - [ ] Cards de fluxos aparecem (se houver fluxos cadastrados)
   - [ ] Botão "+ Novo Fluxo" visível

2. **Filtros Avançados**
   - [ ] Campo de busca funciona
   - [ ] Filtro por Tipo (ATENDIMENTO, VENDAS, etc.)
   - [ ] Filtro por Status (Ativo/Inativo)
   - [ ] Filtro por Canal (WHATSAPP, TELEGRAM, etc.)
   - [ ] Filtro Publicado (Sim/Não)

3. **Criar Novo Fluxo**
   - [ ] Clicar "+ Novo Fluxo"
   - [ ] Preencher formulário:
     ```
     Nome: Fluxo Teste Browser
     Descrição: Criado via teste de navegador
     Tipo: ATENDIMENTO
     Canal: WHATSAPP
     Versão: 1.0.0
     Prioridade: 50
     Ativo: ✓
     ```
   - [ ] Editar JSON da estrutura (manter exemplo ou customizar)
   - [ ] Salvar
   - [ ] Verificar card criado

4. **Publicar/Despublicar Fluxo**
   - [ ] Clicar botão 🚀 "Publicar" no fluxo criado
   - [ ] Verificar mudança de status para "Publicado"
   - [ ] Clicar botão 🚫 "Despublicar"
   - [ ] Verificar mudança de status para "Rascunho"

5. **Duplicar Fluxo**
   - [ ] Clicar botão 📋 "Duplicar"
   - [ ] Verificar novo card com nome "Fluxo Teste Browser (cópia)"

6. **Editar JSON do Fluxo**
   - [ ] Abrir modal de edição
   - [ ] Modificar JSON da estrutura
   - [ ] Salvar
   - [ ] Verificar que não dá erro de validação

7. **Excluir Fluxo**
   - [ ] Clicar 🗑️ no fluxo duplicado
   - [ ] Confirmar exclusão
   - [ ] Verificar que sumiu

---

## 🔍 **PONTOS DE ATENÇÃO**

### 🐛 Possíveis Problemas e Soluções:

**1. Erro 401 (Não Autorizado)**
- **Causa:** Token JWT expirado
- **Solução:** Fazer logout e login novamente

**2. Erro 500 (Erro no Servidor)**
- **Causa:** Backend pode ter problema na query
- **Solução:** Verificar logs do backend no terminal

**3. Tela Branca ou "Cannot read properties of undefined"**
- **Causa:** Dados não carregaram corretamente
- **Solução:** Abrir console (F12) e verificar erros

**4. Filtros não funcionam**
- **Causa:** Possível bug no useEffect ou debounce
- **Solução:** Limpar filtros e tentar novamente

---

## 📊 **CHECKLIST FINAL**

Após completar todos os testes, marcar:

- [ ] ✅ Gestão de Núcleos 100% funcional
- [ ] ✅ Gestão de Fluxos 100% funcional
- [ ] ✅ CRUD completo (Create, Read, Update, Delete)
- [ ] ✅ Filtros funcionando
- [ ] ✅ Validações de formulário OK
- [ ] ✅ Modais abrindo/fechando corretamente
- [ ] ✅ Sem erros no console (F12)
- [ ] ✅ Performance aceitável (< 2s para carregar)

---

## 🎯 **PRÓXIMOS PASSOS APÓS TESTES**

Se tudo estiver funcionando:

1. **Webhook Real** - Executar `.\setup-webhook.ps1`
2. **Documentação** - Criar README.md da arquitetura
3. **Otimizações** - Melhorar performance se necessário

---

## 📝 **REGISTRO DE BUGS ENCONTRADOS**

Use esta seção para anotar problemas encontrados durante os testes:

```
[DATA/HORA] - [TELA] - [AÇÃO] - [ERRO]
Exemplo:
16/10/2025 20:50 - Núcleos - Criar novo - Modal não fecha após salvar
```

---

**Bons testes! 🚀**
