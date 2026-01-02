# 🧪 Guia de Teste - Admin Portal (Gestão de Empresas)

**Data**: 22/11/2025  
**Versão**: 1.0 (Fase 1 - 100% Concluída)  
**Tempo estimado**: 30-40 minutos  

---

## 🎯 Objetivo dos Testes

Validar que **todas as funcionalidades** do Admin Portal estão operacionais:
- ✅ Listagem de empresas com filtros e paginação
- ✅ Visualização de detalhes completos
- ✅ Criação de novas empresas (onboarding)
- ✅ Atualização de dados
- ✅ Suspensão e reativação
- ✅ Cálculo de health score
- ✅ Gestão de notas internas
- ✅ Visualização de usuários por empresa

---

## 🚀 Pré-requisitos

### 1. Verificar Servidores Rodando

```powershell
# Backend (porta 3001)
netstat -ano | Select-String ":3001" | Select-String "LISTENING"

# Frontend (porta 3000)
netstat -ano | Select-String ":3000" | Select-String "LISTENING"
```

**Resultado esperado**: Ambos devem retornar linhas indicando que as portas estão ouvindo.

### 2. Acessar Sistema

**URL**: http://localhost:3000/admin/empresas

**Login** (você precisará fazer login primeiro se não estiver autenticado):
- Email: seu email de admin
- Senha: sua senha

---

## 📋 Checklist de Testes

### PARTE 1: Tela de Listagem (EmpresasListPage)

#### 1.1. Carregamento Inicial ✅

- [ ] Página carrega sem erros no console (F12)
- [ ] KPI cards aparecem no topo (Total, Ativas, Trial, Suspensas)
- [ ] Grid de empresas carrega com dados reais da API
- [ ] Cada card de empresa mostra:
  - [ ] Nome da empresa
  - [ ] CNPJ formatado
  - [ ] Status com badge colorido (ativa=verde, trial=azul, suspensa=laranja)
  - [ ] Plano contratado
  - [ ] Usuários ativos / máximo
  - [ ] Último acesso
  - [ ] Health score (0-100)
  - [ ] Valor mensal (R$)

**Como testar**:
1. Abra http://localhost:3000/admin/empresas
2. Aguarde 1-2 segundos (loading)
3. Verifique se os cards aparecem

**Resultado esperado**: 
- Loading aparece primeiro
- Depois, grid com empresas cadastradas
- Se não houver empresas, estado vazio com botão "Nova Empresa"

---

#### 1.2. Filtros 🔍

- [ ] **Filtro de Status**: 
  - [ ] Clicar em "Todas" mostra todas as empresas
  - [ ] Clicar em "Ativas" mostra apenas empresas ativas
  - [ ] Clicar em "Trial" mostra apenas em trial
  - [ ] Clicar em "Suspensas" mostra apenas suspensas
  - [ ] Clicar em "Canceladas" mostra apenas canceladas

- [ ] **Filtro de Plano**:
  - [ ] Dropdown mostra opções: Todos, Básico, Profissional, Enterprise
  - [ ] Selecionar plano filtra corretamente

- [ ] **Busca por Texto**:
  - [ ] Digitar nome de empresa filtra em tempo real
  - [ ] Buscar por CNPJ funciona
  - [ ] Campo vazio restaura lista completa

- [ ] **Filtro de Data** (Último Acesso):
  - [ ] Selecionar "Últimos 7 dias" filtra corretamente
  - [ ] Selecionar "Últimos 30 dias" filtra corretamente
  - [ ] Selecionar "Últimos 90 dias" filtra corretamente

**Como testar**:
1. Experimente cada filtro individualmente
2. Combine filtros (ex: Status=Ativa + Plano=Profissional)
3. Verifique se URL atualiza com query params

**Resultado esperado**:
- Grid atualiza imediatamente
- Contador de resultados atualiza
- URL mostra filtros: `?status=ativa&plano=profissional`

---

#### 1.3. Paginação 📄

- [ ] Botão "Anterior" desabilitado na primeira página
- [ ] Botão "Próxima" funciona e carrega página seguinte
- [ ] Contador mostra "Página X de Y"
- [ ] Botão "Próxima" desabilita na última página
- [ ] Navegar entre páginas mantém filtros ativos

**Como testar**:
1. Se houver mais de 20 empresas, botão "Próxima" estará habilitado
2. Clicar em "Próxima" e verificar se carrega novos itens
3. Clicar em "Anterior" e voltar para página 1

**Resultado esperado**:
- Grid atualiza com animação smooth
- Loading aparece durante transição
- URL atualiza: `?page=2`

---

#### 1.4. Ações nos Cards 🎬

- [ ] **Hover no Card**: Card levanta (shadow aumenta)
- [ ] **Clicar no Card**: Navega para página de detalhes (`/admin/empresas/:id`)
- [ ] **Botão Refresh** (ícone circular): Recarrega lista
- [ ] **Botão "Nova Empresa"**: Abre modal de cadastro

**Como testar**:
1. Passe o mouse sobre um card (hover effect)
2. Clique em qualquer parte do card
3. Deve navegar para `/admin/empresas/{id}`

---

### PARTE 2: Tela de Detalhes (EmpresaDetailPage)

Ao clicar em um card, você será redirecionado para a tela de detalhes.

#### 2.1. Carregamento e Layout ✅

- [ ] URL é `/admin/empresas/{uuid}`
- [ ] Header mostra:
  - [ ] Nome da empresa
  - [ ] Badge de status (colorido)
  - [ ] CNPJ, email, telefone
  - [ ] Botões de ação (Suspender/Reativar, Calcular Health Score, Voltar)
- [ ] 3 cards principais aparecem:
  - [ ] Card 1: Plano e Faturamento
  - [ ] Card 2: Atividade e Uso
  - [ ] Card 3: Health Score
- [ ] Seção de usuários aparece abaixo
- [ ] Seção de notas internas no final

**Como testar**:
1. Na listagem, clicar em qualquer empresa
2. Aguardar página de detalhes carregar
3. Verificar se todos os elementos estão presentes

**Resultado esperado**:
- Loading breve
- Todos os dados aparecem
- Layout responsivo (3 colunas em desktop, empilha em mobile)

---

#### 2.2. Card de Plano e Faturamento 💰

- [ ] Mostra plano contratado (Básico/Profissional/Enterprise)
- [ ] Valor mensal formatado (R$ X,XX)
- [ ] Data de vencimento do trial (se aplicável)
- [ ] Stripe customer ID (se houver)
- [ ] Stripe subscription ID (se houver)

**Como testar**:
1. Verificar se dados correspondem ao esperado
2. Se empresa está em trial, data de vencimento deve aparecer

---

#### 2.3. Card de Atividade 📊

- [ ] Usuários ativos / máximo (ex: 3/10)
- [ ] Último acesso (data e hora)
- [ ] Timestamp de criação
- [ ] Timestamp de última atualização

**Como testar**:
1. Verificar se datas estão formatadas corretamente (pt-BR)
2. Verificar se contador de usuários faz sentido

---

#### 2.4. Card de Health Score 🎯

- [ ] Barra de progresso aparece
- [ ] Cor da barra muda conforme score:
  - [ ] Verde (≥80): "Cliente saudável"
  - [ ] Amarelo (50-79): "Atenção necessária"
  - [ ] Vermelho (<50): "Risco de churn"
- [ ] Número do score aparece (0-100)
- [ ] Texto explicativo aparece

**Como testar**:
1. Verificar se score corresponde ao esperado
2. Observar cores da barra de progresso

---

#### 2.5. Botão "Calcular Health Score" 🔄

- [ ] Botão aparece no header (ícone de gráfico)
- [ ] Clicar no botão:
  - [ ] Mostra loading no botão
  - [ ] Faz requisição POST `/admin/empresas/:id/health-score`
  - [ ] Atualiza valor do score no card
  - [ ] Mostra notificação de sucesso (toast verde)
  - [ ] Barra de progresso atualiza

**Como testar**:
1. Clicar no botão "Calcular Health Score"
2. Aguardar 1-2 segundos
3. Verificar se score foi atualizado

**Resultado esperado**:
- Toast verde: "✅ Health Score Atualizado - Novo score: X"
- Card atualiza imediatamente
- Botão volta ao estado normal

**Se falhar**:
- Toast vermelho: "❌ Erro - Não foi possível calcular o health score"
- Verificar console do navegador (F12) para detalhes

---

#### 2.6. Suspender Empresa 🚫

- [ ] Botão "Suspender" aparece (vermelho) se empresa está ativa
- [ ] Clicar em "Suspender":
  - [ ] Abre modal de confirmação
  - [ ] Pede motivo da suspensão (textarea obrigatória)
  - [ ] Botão "Confirmar" desabilitado se motivo vazio
  - [ ] Clicar "Cancelar" fecha modal sem ação
  - [ ] Clicar "Confirmar" com motivo:
    - [ ] Faz requisição PATCH `/admin/empresas/:id/suspender`
    - [ ] Atualiza badge de status para "Suspensa" (laranja)
    - [ ] Mostra toast amarelo: "⚠️ Empresa Suspensa"
    - [ ] Botão "Suspender" se transforma em "Reativar"

**Como testar**:
1. Escolher empresa com status "Ativa"
2. Clicar em "Suspender"
3. Preencher motivo: "Teste de suspensão - inadimplência"
4. Clicar em "Confirmar"

**Resultado esperado**:
- Modal fecha
- Badge atualiza para "Suspensa"
- Toast aparece
- Botão muda para "Reativar"

---

#### 2.7. Reativar Empresa ✅

- [ ] Botão "Reativar" aparece (verde) se empresa está suspensa
- [ ] Clicar em "Reativar":
  - [ ] Abre modal de confirmação simples
  - [ ] Clicar "Cancelar" fecha modal
  - [ ] Clicar "Confirmar":
    - [ ] Faz requisição PATCH `/admin/empresas/:id/reativar`
    - [ ] Atualiza badge de status para "Ativa" (verde)
    - [ ] Mostra toast verde: "✅ Empresa Reativada"
    - [ ] Botão "Reativar" se transforma em "Suspender"

**Como testar**:
1. Após suspender empresa, clicar em "Reativar"
2. Confirmar ação

**Resultado esperado**:
- Badge volta para "Ativa"
- Toast verde aparece
- Botão volta para "Suspender"

---

#### 2.8. Tabela de Usuários 👥

- [ ] Tabela mostra lista de usuários da empresa
- [ ] Colunas: Nome, Email, Papel, Status
- [ ] Status "Ativo" aparece em verde
- [ ] Status "Inativo" aparece em vermelho
- [ ] Papel (role) aparece formatado

**Como testar**:
1. Verificar se usuários aparecem corretamente
2. Verificar se dados correspondem ao esperado

**Se não houver usuários**:
- Deve mostrar mensagem: "Nenhum usuário encontrado"

---

#### 2.9. Notas Internas 📝

- [ ] Seção "Notas Internas" aparece no final
- [ ] Se houver notas, aparecem no campo de texto
- [ ] Botão "Editar Notas" abre modal
- [ ] Modal mostra textarea com notas atuais
- [ ] Editar texto e clicar "Salvar":
  - [ ] Faz requisição PUT `/admin/empresas/:id`
  - [ ] Atualiza notas na tela
  - [ ] Mostra toast verde: "✅ Notas Salvas"
  - [ ] Modal fecha
- [ ] Clicar "Cancelar" descarta mudanças

**Como testar**:
1. Clicar em "Editar Notas"
2. Adicionar texto: "Cliente VIP - contato preferencial por WhatsApp"
3. Clicar em "Salvar"
4. Verificar se notas aparecem na tela

**Resultado esperado**:
- Notas salvas no backend
- Toast verde aparece
- Texto atualizado na tela

---

#### 2.10. Botão Voltar 🔙

- [ ] Botão "Voltar" aparece no topo (seta para esquerda)
- [ ] Clicar no botão navega de volta para `/admin/empresas`
- [ ] Lista mantém filtros e página anteriores

**Como testar**:
1. Clicar no botão "Voltar"
2. Verificar se volta para listagem

---

### PARTE 3: Criar Nova Empresa (Modal)

**NOTA**: Esta funcionalidade depende do componente `ModalCadastroEmpresa` estar integrado corretamente.

#### 3.1. Abrir Modal ➕

- [ ] Na listagem, clicar em "Nova Empresa"
- [ ] Modal abre com formulário
- [ ] Campos obrigatórios marcados com *

**Campos do formulário**:
- [ ] Nome da empresa (obrigatório)
- [ ] CNPJ (obrigatório, com máscara)
- [ ] Email (obrigatório, validação de email)
- [ ] Telefone (opcional, com máscara)
- [ ] Plano (dropdown: Básico, Profissional, Enterprise)
- [ ] Valor mensal (R$)
- [ ] Trial (dias de trial)
- [ ] Admin - Nome (obrigatório)
- [ ] Admin - Email (obrigatório)
- [ ] Admin - Senha (obrigatório, min 8 caracteres)

#### 3.2. Validações ✅

- [ ] Campos obrigatórios validam ao tentar enviar
- [ ] Email valida formato
- [ ] CNPJ valida formato
- [ ] Senha deve ter no mínimo 8 caracteres
- [ ] Botão "Criar" desabilitado se formulário inválido

#### 3.3. Criar Empresa ✨

- [ ] Preencher todos os campos
- [ ] Clicar em "Criar"
- [ ] Loading aparece no botão
- [ ] Requisição POST `/admin/empresas` é enviada
- [ ] Se sucesso:
  - [ ] Modal fecha
  - [ ] Toast verde: "✅ Empresa criada com sucesso!"
  - [ ] Nova empresa aparece na listagem
- [ ] Se erro:
  - [ ] Toast vermelho com mensagem de erro
  - [ ] Modal permanece aberto

**Dados de teste**:
```
Nome: Empresa Teste LTDA
CNPJ: 12.345.678/0001-90
Email: contato@empresateste.com.br
Telefone: (11) 98765-4321
Plano: Profissional
Valor mensal: R$ 299,00
Trial: 14 dias
Admin Nome: Admin Teste
Admin Email: admin@empresateste.com.br
Admin Senha: senha12345
```

---

## 🐛 Erros Comuns e Soluções

### Erro 1: "Network Error" ou "ERR_CONNECTION_REFUSED"

**Causa**: Backend não está rodando.

**Solução**:
```powershell
cd c:\Projetos\conectcrm\backend
npx nest start --watch
```

---

### Erro 2: Página em branco ou "Cannot GET /admin/empresas"

**Causa**: Frontend não está rodando.

**Solução**:
```powershell
cd c:\Projetos\conectcrm\frontend-web
npm start
```

---

### Erro 3: "401 Unauthorized" nas requisições

**Causa**: Usuário não está autenticado ou token expirou.

**Solução**:
1. Fazer logout
2. Fazer login novamente
3. Verificar se usuário tem role ADMIN

---

### Erro 4: Dados não aparecem (lista vazia)

**Causa**: Banco de dados sem registros.

**Solução**:
1. Criar empresa pelo modal
2. Ou executar seed de dados (se houver)

---

### Erro 5: "TypeError: Cannot read property 'id' of undefined"

**Causa**: Dados não carregaram corretamente da API.

**Solução**:
1. Abrir DevTools (F12) → Network
2. Verificar se requisição `/admin/empresas` retornou 200
3. Verificar resposta JSON
4. Se 401/403: problema de autenticação
5. Se 500: problema no backend (verificar logs)

---

## 📊 Validação de Integração Backend/Frontend

### Verificar Requisições HTTP (DevTools)

Abra DevTools (F12) → Aba "Network" e verifique:

| Ação | Endpoint | Método | Status Esperado |
|------|----------|--------|-----------------|
| Carregar listagem | `/admin/empresas?page=1&limit=20` | GET | 200 |
| Filtrar por status | `/admin/empresas?status=ativa` | GET | 200 |
| Carregar detalhes | `/admin/empresas/{id}` | GET | 200 |
| Calcular health score | `/admin/empresas/{id}/health-score` | POST | 200 |
| Suspender | `/admin/empresas/{id}/suspender` | PATCH | 200 |
| Reativar | `/admin/empresas/{id}/reativar` | PATCH | 200 |
| Atualizar notas | `/admin/empresas/{id}` | PUT | 200 |
| Listar usuários | `/admin/empresas/{id}/usuarios` | GET | 200 |
| Criar empresa | `/admin/empresas` | POST | 201 |

**Todos devem retornar status de sucesso (2xx)!**

---

## 📝 Checklist Final

Antes de considerar testes concluídos, verifique:

- [ ] ✅ Listagem carrega corretamente
- [ ] ✅ Filtros funcionam (status, plano, busca, data)
- [ ] ✅ Paginação funciona
- [ ] ✅ Detalhes da empresa carregam
- [ ] ✅ Health score calcula corretamente
- [ ] ✅ Suspender empresa funciona
- [ ] ✅ Reativar empresa funciona
- [ ] ✅ Notas internas salvam
- [ ] ✅ Tabela de usuários aparece
- [ ] ✅ Notificações (toasts) aparecem
- [ ] ✅ Loading states aparecem durante ações
- [ ] ✅ Navegação entre páginas funciona
- [ ] ✅ Console (F12) sem erros críticos
- [ ] ✅ Responsividade funciona (testar em mobile)

---

## 🎯 Próximos Passos Após Testes

Se **todos os testes passarem** ✅:
- Marcar Fase 1 como **VALIDADA**
- Documentar bugs encontrados (se houver)
- Decidir: avançar para Fase 2 ou implementar melhorias

Se **houver falhas** ❌:
- Documentar erros encontrados
- Priorizar correções
- Re-testar após correções

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do backend (terminal onde `nest start --watch` está rodando)
2. Verificar console do browser (F12)
3. Verificar network tab (F12 → Network)
4. Documentar erro completo (screenshot + mensagem + passos para reproduzir)

---

**Boa sorte nos testes! 🚀**

**Última atualização**: 22/11/2025
