# 🎯 Guia Rápido para Novos Desenvolvedores

Bem-vindo ao **ConectSuite**! Este guia vai te ajudar a começar rapidamente.

---

## ⚡ Start Rápido (10 minutos)

### 1️⃣ Clone e Configure (2 min)

```powershell
# Clone
git clone https://github.com/Dhonleno/conectsuite.git
cd conectsuite

# Suba database e cache
docker-compose up -d postgres redis
```

### 2️⃣ Backend (4 min)

```powershell
cd backend
cp .env.example .env
# Edite .env (DATABASE_PASSWORD, JWT_SECRET no mínimo)

npm install
npm run migration:run
npm run start:dev
```

✅ Backend rodando em: http://localhost:3001

### 3️⃣ Frontend (4 min)

```powershell
# Novo terminal
cd frontend-web
cp .env.example .env

npm install
npm start
```

✅ Frontend rodando em: http://localhost:3000

---

## 📚 Documentação Essencial

Leia **nesta ordem**:

1. **README.md** - Visão geral e features
2. **DEV_SETUP.md** - Setup detalhado ⬅️ **Você está aqui**
3. **CONTRIBUTING.md** - Como contribuir
4. **.github/copilot-instructions.md** - Regras de código

---

## 🎨 Criar Nova Página (Frontend)

```powershell
# 1. Copiar template
cd frontend-web/src/pages
cp _TemplatePage.tsx MinhaNovaPage.tsx

# 2. Buscar [PERSONALIZAR] e substituir
# 3. Ajustar cor do módulo (ver DESIGN_GUIDELINES.md)

# 4. Registrar rota em App.tsx
# 5. Adicionar no menuConfig.ts
```

**Cores por módulo**:
- Comercial: `#159A9C`
- Atendimento: `#9333EA`
- Financeiro: `#16A34A`
- Gestão: `#2563EB`

---

## 🔧 Criar Novo Módulo (Backend)

```powershell
cd backend/src/modules

# 1. Criar entity
touch meu-modulo/entities/minha-entity.entity.ts

# 2. Criar DTO
touch meu-modulo/dto/create-minha-entity.dto.ts

# 3. Criar service
touch meu-modulo/services/minha-entity.service.ts

# 4. Criar controller
touch meu-modulo/controllers/minha-entity.controller.ts

# 5. Criar module
touch meu-modulo/meu-modulo.module.ts

# 6. Registrar entity em database.config.ts
# 7. Registrar module em app.module.ts

# 8. Gerar migration
npm run migration:generate -- src/migrations/AddMeuModulo

# 9. Rodar migration
npm run migration:run
```

---

## 🧪 Testar Código

```powershell
# Backend
cd backend
npm test                    # Todos os testes
npm run test:watch          # Watch mode
npm run test:cov            # Coverage

# Frontend
cd frontend-web
npm test                    # Todos os testes
npm test -- --coverage      # Coverage
```

---

## 📝 Fazer um Commit

```powershell
# 1. Criar branch
git checkout -b feature/minha-feature

# 2. Fazer alterações...

# 3. Commitar (Conventional Commits)
git add .
git commit -m "feat(modulo): adicionar nova funcionalidade"

# Tipos: feat, fix, docs, style, refactor, test, chore

# 4. Push
git push origin feature/minha-feature

# 5. Abrir Pull Request no GitHub
```

---

## 🐛 Problemas Comuns

### Backend não inicia

```powershell
# Verificar PostgreSQL
docker ps | findstr postgres

# Ver logs
npm run start:dev
```

### Frontend com erro de rede

```powershell
# Verificar se backend está rodando
curl http://localhost:3001/health

# Verificar .env
cat frontend-web/.env
# Deve ter: REACT_APP_API_URL=http://localhost:3001
```

### Migration não roda

```powershell
cd backend
npm run migration:show      # Ver pendentes
npm run migration:revert    # Reverter última
npm run migration:run       # Rodar novamente
```

---

## 🔗 Links Úteis

- **Repo**: https://github.com/Dhonleno/conectsuite
- **Issues**: https://github.com/Dhonleno/conectsuite/issues
- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev

---

## 💡 Dicas

- Use **GitHub Copilot** (está configurado!)
- Leia **.github/copilot-instructions.md** antes de codificar
- Siga **DESIGN_GUIDELINES.md** para UI
- Use **Conventional Commits** sempre
- Teste localmente antes de commitar

---

## 🆘 Precisa de Ajuda?

1. Leia **SUPPORT.md**
2. Procure em **Issues** existentes
3. Abra uma **Discussion** no GitHub
4. Abra uma **Issue** se for bug

---

**Boa codificação!** 🚀
