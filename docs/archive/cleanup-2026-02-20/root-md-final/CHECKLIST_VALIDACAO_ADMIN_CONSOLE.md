# ✅ Checklist de Validação - Admin Console

**Data**: 04 de dezembro de 2025  
**Objetivo**: Garantir que todas as funcionalidades do Admin Console estão operacionais

---

## 🔐 Pré-requisitos

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Banco de dados PostgreSQL ativo (porta 5434)
- [ ] Usuário SuperAdmin criado: `admin@conectsuite.com.br` / `admin123`
- [ ] Migration de superadmin executada

**Comandos de Verificação**:
```powershell
# Backend
netstat -ano | findstr :3001

# Frontend
netstat -ano | findstr :3000

# Database
psql -h localhost -p 5434 -U postgres -d conectcrm -c "SELECT role FROM users WHERE email='admin@conectsuite.com.br';"
# Esperado: role = 'superadmin'
```

---

## 🧪 Testes de Interface

### **1. Acesso e Autenticação** ✅

- [ ] Acesso direto via URL `/admin/console` redireciona para login se não autenticado
- [ ] Login com `admin@conectsuite.com.br` / `admin123` funciona
- [ ] Após login, `/admin/console` carrega corretamente
- [ ] Menu lateral mostra item "Administrativo" → "Admin Console"
- [ ] Clicar no menu abre a página sem erros

**Como Testar**:
1. Abra navegador anônimo (Ctrl+Shift+N)
2. Acesse `http://localhost:3000/admin/console`
3. Verifique redirecionamento para login
4. Faça login com credenciais SuperAdmin
5. Verifique que retorna para Admin Console

---

### **2. Dashboard Executivo - KPI Cards** ✅

- [ ] Card "Empresas Ativas" exibe número correto (verde)
- [ ] Card "Trials Expirando" exibe número correto (amarelo)
- [ ] Card "Módulos Críticos" exibe número correto (vermelho)
- [ ] Card "MRR Total" exibe valor formatado em R$ (teal)
- [ ] Valores dos cards mudam ao aplicar filtros
- [ ] Cards são responsivos (empilham em mobile)

**Como Testar**:
1. Conte manualmente empresas ativas na tabela
2. Compare com valor do card verde
3. Aplique filtro "Status: Trial"
4. Observe se cards recalculam

---

### **3. Filtros e Busca** ✅

#### **Busca por Texto**:
- [ ] Digitar nome de empresa filtra resultados
- [ ] Busca por CNPJ funciona
- [ ] Busca por email funciona
- [ ] Busca é case-insensitive
- [ ] Limpar campo retorna todas as empresas

**Teste Manual**:
```
1. Digite "Empresa" no campo de busca
2. Verifique que mostra apenas empresas com "Empresa" no nome
3. Apague o texto
4. Verifique que mostra todas novamente
```

#### **Filtro de Status**:
- [ ] Dropdown mostra 6 opções + "Todos os status"
- [ ] Filtrar por "Ativa" mostra apenas empresas ativas
- [ ] Filtrar por "Trial" mostra apenas empresas trial
- [ ] Filtrar por "Inadimplente" mostra apenas past_due
- [ ] Filtrar por "Suspensa" mostra apenas suspensas
- [ ] "Todos os status" remove filtro

#### **Filtro de Plano**:
- [ ] Dropdown mostra 5 opções + "Todos os planos"
- [ ] Filtrar por "Professional" mostra apenas esse plano
- [ ] Filtrar por "Starter" mostra apenas esse plano
- [ ] "Todos os planos" remove filtro

#### **Botão Limpar**:
- [ ] Clicar em "Limpar" reseta busca, status e plano
- [ ] Cards KPI recalculam após limpar
- [ ] Tabela volta ao estado inicial

---

### **4. Tabela de Empresas** ✅

#### **Colunas e Dados**:
- [ ] Coluna "Empresa" mostra avatar + nome + email
- [ ] Avatar tem inicial da empresa em maiúscula
- [ ] Coluna "CNPJ" mostra CNPJ ou "--"
- [ ] Coluna "Plano" tem badge azul capitalizado
- [ ] Coluna "Status" tem badge correto:
  - Verde para "Ativa"
  - Azul para "Trial"
  - Vermelho para "Inadimplente"
  - Laranja para "Suspensa"
  - Cinza para "Cancelada" ou "Inativa"
- [ ] Coluna "Health" mostra score 0-100 com badge:
  - Verde para ≥80
  - Amarelo para 50-79
  - Vermelho para <50
  - "--" para undefined
- [ ] Coluna "Valor/Mês" formata corretamente em R$
- [ ] Coluna "Último Acesso" mostra data/hora ou "Nunca"

#### **Ações**:
- [ ] Botão "👁️ Ver Detalhes" (eye) aparece em todas as linhas
- [ ] Clicar em "Ver Detalhes" navega para `/admin/empresas/:id`
- [ ] Botão "🚫 Suspender" (ban) aparece para empresas NÃO suspensas
- [ ] Botão "✅ Reativar" (check-circle) aparece para empresas suspensas
- [ ] Clicar em "Suspender" abre prompt para motivo
- [ ] Cancelar prompt não suspende
- [ ] Confirmar com motivo suspende empresa
- [ ] Status muda para "Suspensa" após suspender
- [ ] Badge fica laranja após suspensão
- [ ] Clicar em "Reativar" reativa sem prompt
- [ ] Status volta para "Ativa" após reativar
- [ ] Badge volta para verde após reativação
- [ ] Botão de ação fica desabilitado durante operação

**Teste Completo de Suspensão/Reativação**:
```
1. Localize empresa com status "Ativa"
2. Clique no botão 🚫 (suspender)
3. No prompt, digite "Teste de suspensão"
4. Clique OK
5. Verifique que:
   - Badge muda para laranja "Suspensa"
   - Botão 🚫 desaparece
   - Botão ✅ aparece
6. Clique no botão ✅ (reativar)
7. Verifique que:
   - Badge volta para verde "Ativa"
   - Botão ✅ desaparece
   - Botão 🚫 reaparece
```

#### **Estados da Tabela**:
- [ ] Loading: Spinner aparece durante carregamento
- [ ] Empty: Mensagem "Nenhuma empresa encontrada" quando sem resultados
- [ ] Error: Mensagem de erro aparece se falhar (testar desligando backend)
- [ ] Hover: Linha fica cinza claro ao passar mouse

#### **Paginação**:
- [ ] Rodapé mostra "Mostrando X de Y empresas"
- [ ] Botão "Anterior" desabilitado na página 1
- [ ] Botão "Próxima" desabilitado na última página
- [ ] Clicar em "Próxima" carrega página 2
- [ ] Clicar em "Anterior" volta para página 1
- [ ] Contador "Página X de Y" atualiza corretamente

---

### **5. Gestão de Módulos** ✅

#### **Seletor de Empresa**:
- [ ] Dropdown mostra todas as empresas carregadas
- [ ] Formato: "Nome da Empresa (plano)"
- [ ] Opção padrão: "-- Selecione uma empresa --"
- [ ] Selecionar empresa carrega módulos dela

#### **Cards de Módulos**:
- [ ] Grid responsivo: 1 coluna (mobile) → 2 (tablet) → 3 (desktop)
- [ ] Cada card mostra:
  - [ ] Ícone colorido do módulo
  - [ ] Nome do módulo (ex: "CRM", "Atendimento")
  - [ ] Descrição breve
  - [ ] Uso atual / Limite (ex: "45 / 100")
  - [ ] Barra de progresso colorida:
    - Verde se <70%
    - Amarelo se 70-89%
    - Vermelho se ≥90%
  - [ ] Percentual de uso (ex: "45.0% utilizado")
  - [ ] Alerta "⚠️ Crítico" se ≥90%
  - [ ] Status "✓ Ativo" ou "○ Inativo"
  - [ ] Botão "Configurar →"
- [ ] Card com uso ≥90% tem borda vermelha e fundo vermelho claro
- [ ] Clicar em "Configurar" navega para `/admin/empresas/:id/modulos/:modulo`

#### **Estados**:
- [ ] Loading: Spinner enquanto carrega módulos
- [ ] Empty sem empresa selecionada: Mensagem "Selecione uma empresa..."
- [ ] Empty com empresa: Mensagem "Nenhum módulo encontrado"

**Teste de Módulo Crítico**:
```
1. Selecione empresa com módulo acima de 90% de uso
2. Verifique que card tem:
   - Borda vermelha (border-red-300)
   - Fundo vermelho claro (bg-red-50)
   - Barra de progresso vermelha
   - Texto "⚠️ Crítico" visível
```

---

### **6. Resumo Financeiro (Billing)** ✅

#### **Cards Financeiros**:
- [ ] Card "MRR Consolidado" (gradiente verde) mostra valor total
- [ ] Card "Inadimplentes" (gradiente vermelho) mostra:
  - Valor total inadimplente
  - Quantidade de empresas
- [ ] Card "Suspensas" (gradiente laranja) mostra quantidade
- [ ] Card "Trials em Risco" (gradiente amarelo) mostra quantidade

#### **Empresas Críticas**:
- [ ] Seção aparece apenas se houver empresas críticas
- [ ] Lista mostra máximo 5 empresas
- [ ] Empresas são ordenadas por valor (maior primeiro)
- [ ] Cada linha mostra:
  - [ ] Avatar com inicial
  - [ ] Nome da empresa
  - [ ] Email
  - [ ] Badge de status
  - [ ] Valor mensal
  - [ ] Botão "Resolver"
- [ ] Fundo da linha é vermelho claro (bg-red-50)
- [ ] Borda da linha é vermelha (border-red-200)
- [ ] Clicar em "Resolver" navega para detalhes da empresa

**Validação de Cálculos**:
```
1. Conte manualmente empresas com status="past_due"
2. Some os valores de valor_mensal dessas empresas
3. Compare com card "Inadimplentes"
4. Valores devem bater
```

---

### **7. Responsividade** ✅

#### **Mobile (375px)**:
- [ ] KPI cards empilham em 1 coluna
- [ ] Filtros empilham verticalmente
- [ ] Tabela tem scroll horizontal
- [ ] Cards de módulos em 1 coluna
- [ ] Menu lateral colapsa em hambúrguer

#### **Tablet (768px)**:
- [ ] KPI cards em 2 colunas
- [ ] Filtros em linha com wrap
- [ ] Cards de módulos em 2 colunas

#### **Desktop (1920px)**:
- [ ] KPI cards em 4 colunas
- [ ] Filtros todos na mesma linha
- [ ] Cards de módulos em 3 colunas
- [ ] Tabela usa largura completa

**Teste Rápido**:
```
1. Abra DevTools (F12)
2. Clique no ícone de device toolbar (Ctrl+Shift+M)
3. Selecione iPhone SE (375px)
4. Verifique layout mobile
5. Selecione iPad (768px)
6. Verifique layout tablet
7. Selecione Responsive e defina 1920px
8. Verifique layout desktop
```

---

### **8. Performance e UX** ✅

- [ ] Página carrega em menos de 2 segundos
- [ ] Filtros respondem instantaneamente (<100ms)
- [ ] Suspender/reativar completa em menos de 1 segundo
- [ ] Sem erros no console do navegador (F12)
- [ ] Sem warnings críticos no console
- [ ] Animações suaves (transitions em 200-300ms)
- [ ] Loading spinners aparecem durante operações assíncronas
- [ ] Hover effects funcionam nos botões e linhas da tabela

#### **Console do Navegador**:
```
Abra F12 → Console
✅ Permitido: Avisos de desenvolvimento (NODE_ENV)
❌ Bloqueado: Erros vermelhos (network, syntax, runtime)
❌ Bloqueado: Warnings de type errors
```

---

## 🔌 Testes de Integração Backend

### **Endpoints Testados**:

#### **1. GET /api/admin/empresas**:
```bash
# Thunder Client / Postman
GET http://localhost:3001/api/admin/empresas
Headers:
  Authorization: Bearer <token_superadmin>

✅ Esperado: 200 OK com array de empresas
✅ Estrutura: { data: EmpresaAdmin[], meta: { total, page, totalPages, ... } }
```

#### **2. GET /api/admin/empresas/:id**:
```bash
GET http://localhost:3001/api/admin/empresas/uuid-da-empresa
Headers:
  Authorization: Bearer <token_superadmin>

✅ Esperado: 200 OK com empresa completa
✅ Campos: id, nome, cnpj, email, plano, status, health_score, valor_mensal, ...
```

#### **3. PATCH /api/admin/empresas/:id/suspender**:
```bash
PATCH http://localhost:3001/api/admin/empresas/uuid-da-empresa/suspender
Headers:
  Authorization: Bearer <token_superadmin>
Body:
  {
    "motivo": "Teste de suspensão"
  }

✅ Esperado: 200 OK com { message, empresa: { status: 'suspended' } }
```

#### **4. PATCH /api/admin/empresas/:id/reativar**:
```bash
PATCH http://localhost:3001/api/admin/empresas/uuid-da-empresa/reativar
Headers:
  Authorization: Bearer <token_superadmin>

✅ Esperado: 200 OK com { message, empresa: { status: 'active' } }
```

#### **5. GET /api/admin/empresas/:id/modulos**:
```bash
GET http://localhost:3001/api/admin/empresas/uuid-da-empresa/modulos
Headers:
  Authorization: Bearer <token_superadmin>

✅ Esperado: 200 OK com array de ModuloEmpresa[]
✅ Campos: modulo, ativo, limite, uso_atual, configuracoes
```

---

## 🛡️ Testes de Segurança

### **Proteção de Rotas**:

- [ ] Usuário não logado não acessa `/admin/console`
- [ ] Usuário com role='user' não acessa `/admin/console`
- [ ] Usuário com role='admin' não acessa `/admin/console`
- [ ] Apenas role='superadmin' acessa `/admin/console`

**Teste Manual**:
```
1. Crie usuário teste com role='admin' no banco:
   INSERT INTO users (email, password_hash, role, empresa_id)
   VALUES ('teste@teste.com', 'hash', 'admin', 'uuid-empresa');

2. Faça login com esse usuário
3. Tente acessar /admin/console
4. Esperado: Redirecionamento ou erro 403 Forbidden
```

### **Validação Backend**:
- [ ] Endpoints exigem JWT válido
- [ ] Endpoints verificam role='superadmin'
- [ ] Token expirado retorna 401
- [ ] Role inválido retorna 403

---

## 📝 Checklist de Compilação

- [ ] `npm run build` (frontend) compila sem erros
- [ ] Apenas warnings de arquivos não relacionados
- [ ] AdminConsolePage.tsx sem erros TypeScript
- [ ] Services (adminEmpresasService, adminModulosService) sem erros
- [ ] Build gera bundle otimizado em `build/`

**Comando**:
```powershell
cd frontend-web
npm run build
# Esperado: "Compiled successfully!" ou "Compiled with warnings."
```

---

## 🎯 Critérios de Aceitação

Para considerar o Admin Console **pronto para produção**, todos os itens abaixo devem estar ✅:

### **Essenciais** (Bloqueantes):
- [ ] Login SuperAdmin funciona
- [ ] KPI cards carregam dados corretos
- [ ] Tabela de empresas carrega e exibe dados
- [ ] Filtros funcionam corretamente
- [ ] Suspender/reativar empresa funciona
- [ ] Gestão de módulos carrega e exibe dados
- [ ] Resumo financeiro calcula valores corretos
- [ ] Sem erros no console
- [ ] Backend protege rotas (apenas superadmin)

### **Importantes** (Alta prioridade):
- [ ] Paginação funciona
- [ ] Loading states aparecem
- [ ] Empty states aparecem
- [ ] Error handling funciona
- [ ] Responsividade mobile/tablet/desktop
- [ ] Hover effects funcionam

### **Desejáveis** (Média prioridade):
- [ ] Animações suaves
- [ ] Performance < 2s carregamento
- [ ] Módulos críticos destacados
- [ ] Empresas críticas listadas

---

## 📊 Resultado Final

### **Score de Qualidade**:
```
Essenciais:    ___/9  (___%)
Importantes:   ___/6  (___%)
Desejáveis:    ___/4  (___%)

TOTAL: ___/19 (___%)
```

### **Status**:
- [ ] ✅ **APROVADO** (≥90%)
- [ ] ⚠️ **APROVADO COM RESTRIÇÕES** (70-89%)
- [ ] ❌ **REPROVADO** (<70%)

---

## 🚀 Próximos Passos

Após aprovação neste checklist:

1. **Deploy em Staging**: Testar em ambiente de homologação
2. **Testes E2E**: Playwright para automação
3. **Code Review**: Revisão por pares
4. **Documentação**: Finalizar guias de usuário
5. **Deploy em Produção**: Rollout gradual

---

**Data de Validação**: ___/___/2025  
**Validador**: _________________  
**Resultado**: [ ] Aprovado [ ] Reprovado [ ] Aprovado com restrições

---

**Última Atualização**: 04/12/2025  
**Versão do Checklist**: 1.0.0
