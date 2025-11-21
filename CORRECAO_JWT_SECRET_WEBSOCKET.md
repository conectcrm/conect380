# 🔐 Correção: JWT Secret - WebSocket

## ❌ PROBLEMA IDENTIFICADO

**Erro:** `JsonWebTokenError: invalid signature`

**Causa:** O módulo de atendimento estava usando um JWT_SECRET diferente do módulo de autenticação.

```typescript
// ❌ ANTES (INCORRETO)
JwtModule.register({
  secret: process.env.JWT_SECRET || 'secret-key',  // ❌ Diferente
  signOptions: { expiresIn: '24h' },
})

// No módulo de autenticação:
JwtModule.register({
  secret: process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_2024',  // ✅ Padrão
  signOptions: { expiresIn: '24h' },
})
```

---

## ✅ SOLUÇÃO APLICADA

**Arquivo:** `backend/src/modules/atendimento/atendimento.module.ts`

```typescript
// ✅ DEPOIS (CORRETO)
JwtModule.register({
  secret: process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_2024',  // ✅ Mesmo secret
  signOptions: { expiresIn: '24h' },
})
```

---

## 🔍 O QUE ACONTECIA

1. **Login no Frontend:**
   - Usuário fazia login
   - Backend Auth gerava token com secret: `seu_jwt_secret_super_seguro_aqui_2024`
   - Frontend armazenava token no `localStorage`

2. **Conexão WebSocket:**
   - Frontend enviava token armazenado
   - Gateway tentava validar com secret: `secret-key` ❌
   - **Resultado:** `invalid signature`

3. **Fluxo Correto:**
```
Login → Token gerado com Secret A
         ↓
WebSocket → Token validado com Secret A ✅
```

4. **Fluxo Incorreto (antes da correção):**
```
Login → Token gerado com Secret A
         ↓
WebSocket → Token validado com Secret B ❌ ERRO
```

---

## 🎯 COMO EVITAR NO FUTURO

### 1. Centralizar Configuração JWT

**Recomendação:** Criar um módulo JWT compartilhado

```typescript
// jwt-config.module.ts (SUGESTÃO)
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 
                'seu_jwt_secret_super_seguro_aqui_2024',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
```

**Uso nos módulos:**
```typescript
@Module({
  imports: [
    JwtConfigModule,  // ✅ Sempre usa mesma configuração
  ],
})
```

### 2. Validar .env no Startup

```typescript
// main.ts
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_HOST', 'DATABASE_PORT'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} não definida!`);
  }
});
```

### 3. Documentar Segredos no .env.example

```properties
# .env.example
# ⚠️ IMPORTANTE: Todos os módulos devem usar o mesmo JWT_SECRET
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_2024
JWT_EXPIRES_IN=24h
```

---

## 🧪 TESTE DE VALIDAÇÃO

### Antes da Correção ❌
```bash
[Nest] ERROR [AtendimentoGateway] ❌ Erro ao conectar cliente: invalid signature
```

### Depois da Correção ✅
```bash
[Nest] LOG [AtendimentoGateway] ✅ Cliente conectado: abc123 (User: user123, Role: atendente)
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Sempre que adicionar novo módulo com JWT:

- [ ] ✅ Verificar que usa `process.env.JWT_SECRET`
- [ ] ✅ Verificar que fallback é o MESMO em todos os módulos
- [ ] ✅ Testar login e autenticação
- [ ] ✅ Testar WebSocket (se aplicável)
- [ ] ✅ Verificar logs para `invalid signature`

---

## 🔐 SEGURANÇA EM PRODUÇÃO

### ⚠️ NÃO FAZER:

```typescript
// ❌ Hardcoded secret
secret: 'meu-secret-123'

// ❌ Secret fraco
secret: 'secret'

// ❌ Fallbacks diferentes
Module1: secret: process.env.JWT_SECRET || 'secret-a'
Module2: secret: process.env.JWT_SECRET || 'secret-b'
```

### ✅ FAZER:

```typescript
// ✅ Usar variável de ambiente
secret: process.env.JWT_SECRET

// ✅ Validar na inicialização
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado!');
}

// ✅ Secret forte (256 bits)
JWT_SECRET=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

### Gerar Secret Seguro:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64
```

---

## 📚 REFERÊNCIAS

- [NestJS JWT Module](https://docs.nestjs.com/security/authentication#jwt-functionality)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

## ✅ STATUS

**Problema:** ❌ `invalid signature` no WebSocket  
**Causa:** JWT_SECRET inconsistente entre módulos  
**Correção:** ✅ Aplicada em `atendimento.module.ts`  
**Teste:** ✅ Conectar ao WebSocket agora funciona  

**Data:** 14/10/2025  
**Arquivo Corrigido:** `backend/src/modules/atendimento/atendimento.module.ts`
