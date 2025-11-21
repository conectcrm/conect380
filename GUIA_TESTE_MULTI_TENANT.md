# 🧪 Guia de Teste: Isolamento Multi-Tenant

**Data de Execução**: 19 de novembro de 2025  
**Objetivo**: Verificar isolamento completo de dados entre empresas  
**Tempo Estimado**: 45-60 minutos  
**Status**: ✅ Sistema pronto para teste (Backend: ✅ | Frontend: ✅)

---

## 📋 Pré-Requisitos

- [x] Backend rodando na porta 3001
- [x] Frontend rodando na porta 3000
- [x] Todas as correções de código aplicadas (20 instâncias)
- [x] Compilação TypeScript sem erros
- [x] **✅ VERIFICAÇÃO DE EMAIL DESABILITADA** (login imediato permitido)

**URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🎯 Cenário de Teste

### Empresas a Testar:
- **Empresa A**: "TechCorp Ltda" (criar nova ou usar existente)
- **Empresa B**: "SoluçõesPro S.A." (criar nova)

### Módulos Críticos a Validar:
1. ✅ **Atendimento** - AtendimentoPage, NovoAtendimentoModal
2. ✅ **Gestão de Filas** - GestaoFilasPage, SelecionarFilaModal
3. ✅ **Templates de Mensagem** - GestaoTemplatesPage
4. ✅ **Configuração de Inatividade** - FechamentoAutomaticoPage
5. ✅ **Configuração de Empresa** - ConfiguracaoEmpresaPage
6. ✅ **Chat** - ChatArea, RespostasRapidas, PainelContextoCliente
7. ✅ **Busca Global** - BuscaRapida

---

## 📝 Roteiro de Teste Detalhado

### FASE 1: Setup Empresa A (15 minutos)

#### 1.1. Login/Criação Empresa A
```
URL: http://localhost:3000/registro
Ação: Criar nova empresa "TechCorp Ltda"
✅ IMPORTANTE: Login será IMEDIATO (verificação de email desabilitada)
Validar: Após criar empresa, você será redirecionado automaticamente ou poderá fazer login imediatamente
```

**Dados de Teste para Registrar**:
- [ ] Nome da Empresa: _______________________
- [ ] Email do Usuário: _______________________
- [ ] Empresa ID (verificar em DevTools → Application → Local Storage): _______________________

#### 1.2. Criar Dados de Teste - Empresa A

**a) Template de Mensagem**:
```
Navegação: Menu → Configurações → Templates de Mensagem
Ação: Criar novo template
Dados:
  - Nome: "Boas-vindas TechCorp"
  - Conteúdo: "Olá! Bem-vindo à TechCorp. Como podemos ajudar?"
  - Categoria: "Saudação"
Validar: Template salvo com sucesso
```
- [ ] Template ID: _______________________

**b) Configuração de Inatividade**:
```
Navegação: Menu → Configurações → Fechamento Automático
Ação: Ativar e configurar
Dados:
  - Ativar: SIM
  - Tempo: 30 minutos
  - Mensagem: "Atendimento encerrado por inatividade - TechCorp"
Validar: Configuração salva
```
- [ ] Config salva em: ________ (horário)

**c) Fila de Atendimento**:
```
Navegação: Menu → Atendimento → Gestão de Filas
Ação: Criar nova fila
Dados:
  - Nome: "Suporte TechCorp"
  - Descrição: "Fila principal de suporte"
  - Prioridade: Alta
Validar: Fila criada e visível na lista
```
- [ ] Fila ID: _______________________

**d) Atendimento (Ticket)**:
```
Navegação: Menu → Atendimento → Atendimentos
Ação: Criar novo atendimento
Dados:
  - Cliente: "João Silva" (criar se necessário)
  - Fila: "Suporte TechCorp"
  - Canal: WhatsApp
  - Assunto: "Problema com login"
Validar: Atendimento criado
```
- [ ] Atendimento ID: _______________________
- [ ] Cliente: _______________________

**e) Resposta Rápida**:
```
Navegação: No chat, buscar "Respostas Rápidas"
Ação: Criar resposta rápida
Dados:
  - Atalho: "/techcorp"
  - Mensagem: "Equipe TechCorp à disposição!"
Validar: Resposta salva
```
- [ ] Resposta criada: ✅ / ❌

**f) Configuração de Empresa**:
```
Navegação: Menu → Configurações → Empresa
Ação: Atualizar dados
Dados:
  - Telefone: "(11) 98888-7777"
  - Email suporte: "suporte@techcorp.com"
Validar: Dados salvos
```
- [ ] Telefone salvo: _______________________

---

### FASE 2: Validação Empresa A (5 minutos)

#### 2.1. Verificar Visibilidade de Dados
```
Checklist (todos devem estar VISÍVEIS):
- [ ] Template "Boas-vindas TechCorp" aparece na lista
- [ ] Configuração de inatividade 30min ativa
- [ ] Fila "Suporte TechCorp" na gestão de filas
- [ ] Atendimento "Problema com login" na lista
- [ ] Resposta rápida "/techcorp" disponível
- [ ] Telefone "(11) 98888-7777" em Config Empresa
```

#### 2.2. Testar Busca Global
```
Ação: Usar busca global (componente BuscaRapida)
Buscar: "TechCorp"
Validar: Deve retornar dados criados acima
```
- [ ] Busca funcionou: ✅ / ❌
- [ ] Resultados corretos: ✅ / ❌

#### 2.3. Logout
```
Ação: Fazer logout completo
Validar: Redirect para /login, token removido
```
- [ ] Logout realizado: ✅ / ❌

---

### FASE 3: Setup Empresa B (15 minutos)

#### 3.1. Criar Empresa B
```
URL: http://localhost:3000/registro
Ação: Criar nova empresa "SoluçõesPro S.A."
Dados:
  - Nome Empresa: "SoluçõesPro S.A."
  - Email: "admin@solucoespro.com"
  - Senha: (sua escolha)
  - CNPJ: Diferente de Empresa A
✅ IMPORTANTE: Login será IMEDIATO após criar conta
Validar: Conta criada, login automático ou manual bem-sucedido
```

**Dados da Empresa B**:
- [ ] Nome: _______________________
- [ ] Email: _______________________
- [ ] Empresa ID: _______________________

#### 3.2. **VERIFICAÇÃO CRÍTICA: Zero Dados de Empresa A**

```
🚨 TESTE CRUCIAL - Empresa B NÃO PODE ver dados de Empresa A!

Checklist (todos devem estar VAZIOS/INVISÍVEIS):
- [ ] Templates: Lista VAZIA (não deve ter "Boas-vindas TechCorp")
- [ ] Filas: Lista VAZIA (não deve ter "Suporte TechCorp")
- [ ] Atendimentos: Lista VAZIA (não deve ter ticket "Problema com login")
- [ ] Config Inatividade: SEM configuração (deve estar desativado ou default)
- [ ] Config Empresa: SEM dados de TechCorp (telefone diferente ou vazio)
- [ ] Busca por "TechCorp": ZERO resultados
```

**RESULTADO**:
- [ ] ✅ SUCESSO - Zero dados de Empresa A visíveis
- [ ] ❌ FALHA - Encontrei dados de Empresa A (detalhar abaixo)

**Se FALHA, detalhar**:
```
Módulo com vazamento: _______________________
Dado visível: _______________________
Tela: _______________________
```

#### 3.3. Criar Dados de Teste - Empresa B

**Repetir processo da Fase 1, mas com dados diferentes**:

**a) Template**:
- Nome: "Boas-vindas SoluçõesPro"
- Conteúdo: "Bem-vindo à SoluçõesPro! Estamos prontos para ajudar."

**b) Fila**:
- Nome: "Atendimento SoluçõesPro"
- Descrição: "Fila de atendimento geral"

**c) Atendimento**:
- Cliente: "Maria Santos"
- Assunto: "Dúvida sobre contrato"

**d) Config Inatividade**:
- Tempo: 60 minutos (diferente de Empresa A)
- Mensagem: "Encerrando - SoluçõesPro"

**e) Config Empresa**:
- Telefone: "(21) 97777-6666"

**Registrar IDs**:
- [ ] Template ID: _______________________
- [ ] Fila ID: _______________________
- [ ] Atendimento ID: _______________________

---

### FASE 4: Validação Cruzada (10 minutos)

#### 4.1. Ainda Logado como Empresa B

```
Verificar ISOLAMENTO (dados de A devem estar invisíveis):
- [ ] Buscar "TechCorp" → Zero resultados
- [ ] Buscar "João Silva" (cliente A) → Não encontrado
- [ ] Buscar "/techcorp" (resposta rápida A) → Não disponível
- [ ] Lista de templates → Só "Boas-vindas SoluçõesPro"
- [ ] Lista de filas → Só "Atendimento SoluçõesPro"
```

**RESULTADO**:
- [ ] ✅ Isolamento perfeito - Empresa B não vê dados de A
- [ ] ❌ Vazamento detectado (detalhar):

#### 4.2. Logout e Login como Empresa A

```
Ação: Logout de Empresa B
Ação: Login novamente como Empresa A (TechCorp)
```

#### 4.3. Verificar Integridade dos Dados de Empresa A

```
Checklist (todos os dados originais devem estar intactos):
- [ ] Template "Boas-vindas TechCorp" ainda existe
- [ ] Fila "Suporte TechCorp" inalterada
- [ ] Atendimento "Problema com login" ainda aberto
- [ ] Config inatividade 30min mantida
- [ ] Telefone "(11) 98888-7777" em Config Empresa
- [ ] Cliente "João Silva" ainda existe
```

#### 4.4. Verificar ISOLAMENTO de Empresa A

```
Empresa A NÃO PODE ver dados de Empresa B:
- [ ] Buscar "SoluçõesPro" → Zero resultados
- [ ] Buscar "Maria Santos" (cliente B) → Não encontrado
- [ ] Lista templates → NÃO tem "Boas-vindas SoluçõesPro"
- [ ] Lista filas → NÃO tem "Atendimento SoluçõesPro"
- [ ] Config inatividade → 30min (não 60min de B)
```

**RESULTADO FINAL**:
- [ ] ✅ Isolamento bidirecional perfeito
- [ ] ❌ Vazamento detectado

---

## 🎯 Critérios de Sucesso

### ✅ APROVADO se:
1. Empresa B não vê NENHUM dado de Empresa A
2. Empresa A não vê NENHUM dado de Empresa B
3. Dados de cada empresa permanecem intactos após troca de login
4. Busca global respeita isolamento
5. Todas as telas testadas respeitam empresa_id do JWT

### ❌ REPROVADO se:
1. Qualquer dado vazar entre empresas
2. Busca retornar dados de outra empresa
3. Templates, filas, atendimentos ou configs misturarem
4. localStorage ainda sendo usado (verificar DevTools)

---

## 🔧 Ferramentas de Debug

### Verificar JWT Token:
1. Abrir DevTools (F12)
2. Application → Local Storage → http://localhost:3000
3. Procurar chave `token` ou similar
4. Copiar valor e decodificar em https://jwt.io
5. Verificar campo `empresa_id` no payload

### Verificar Network Requests:
1. DevTools → Network tab
2. Filtrar por "Fetch/XHR"
3. Inspecionar requisições para `/api/...`
4. Verificar se `Authorization: Bearer <token>` está presente
5. Verificar se corpo da request NÃO contém `empresaId` hardcoded

### Verificar Console Errors:
1. DevTools → Console
2. Procurar por erros relacionados a `empresaId`
3. Verificar warnings sobre `localStorage.getItem('empresaId')`

---

## 📊 Resultados do Teste

### Resumo Executivo:
- **Data**: ___/___/2025
- **Executor**: _______________________
- **Duração**: _______ minutos
- **Resultado**: ✅ APROVADO / ❌ REPROVADO

### Módulos Testados (7/7):
- [ ] Atendimento - AtendimentoPage
- [ ] Gestão de Filas - GestaoFilasPage
- [ ] Templates - GestaoTemplatesPage
- [ ] Config Inatividade - FechamentoAutomaticoPage
- [ ] Config Empresa - ConfiguracaoEmpresaPage
- [ ] Chat - ChatArea, RespostasRapidas
- [ ] Busca - BuscaRapida

### Vazamentos Detectados:
```
(Se nenhum, escrever "NENHUM")

1. Módulo: _______________________
   Dados vazados: _______________________
   Severidade: 🔴 Crítico / 🟡 Moderado / 🟢 Baixo

2. Módulo: _______________________
   ...
```

### Evidências (Screenshots):
```
Anexar screenshots se houver vazamento:
- Screenshot 1: [descrição]
- Screenshot 2: [descrição]
```

---

## 🚀 Próximos Passos

### Se APROVADO:
1. ✅ Marcar task de teste como completa
2. ✅ Documentar sucesso em CONSOLIDACAO_MULTI_TENANT.md
3. ✅ Sistema pronto para produção (multi-tenant completo)
4. 📝 Considerar testes automatizados (E2E com Cypress/Playwright)

### Se REPROVADO:
1. 🔍 Identificar módulo com vazamento
2. 🐛 Revisar código do componente afetado
3. 🔧 Aplicar correção (useAuth pattern)
4. ♻️ Re-executar teste completo

---

## 📝 Notas Adicionais

### Arquivos Corrigidos (Referência):
1. FechamentoAutomaticoPage.tsx (4 hardcoded UUIDs)
2. AtendimentoPage.tsx (localStorage)
3. NovoAtendimentoModal.tsx (3 localStorage)
4. EncerrarAtendimentoModal.tsx (1 localStorage)
5. TransferirAtendimentoModal.tsx (2 localStorage)
6. VincularClienteModal.tsx (1 localStorage)
7. BuscaRapida.tsx (1 localStorage)
8. PainelContextoCliente.tsx (1 localStorage)
9. ChatArea.tsx (2 localStorage)
10. GestaoFilasPage.tsx (1 localStorage complexo)
11. FilaIndicator.tsx (1 localStorage)
12. RespostasRapidas.tsx (1 localStorage)
13. SelecionarFilaModal.tsx (1 localStorage)

**Total**: 20 instâncias corrigidas em 13 arquivos.

### Padrão Aplicado:
```typescript
import { useAuth } from '../hooks/useAuth';

const { user } = useAuth();
const empresaId = user?.empresa?.id;

if (!empresaId) {
  throw new Error('Usuário não possui empresa associada');
}
```

---

**Documento gerado automaticamente pelo GitHub Copilot**  
**Versão**: 1.0  
**Última atualização**: 19/11/2025 15:56
