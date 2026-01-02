# 🔐 JWT Token Refresh - Análise e Correção

## 📊 Situação Atual

### Problema Identificado
- WebSocket estava falhando ao conectar com erro: **TokenExpiredError: jwt expired**
- JWT configurado originalmente para expirar em 24h
- Usuários que ficam com a aplicação aberta por > 24h perdem conexão

### Causa Raiz
O sistema atual **não possui refresh token adequado**:

```typescript
// ❌ PROBLEMA: Endpoint /auth/refresh requer JWT válido
@UseGuards(AuthGuard('jwt'))  // ← Rejeita token expirado!
@Post('refresh')
async refresh(@Request() req) {
  return this.authService.refreshToken(req.user);
}
```

**Paradoxo**: Para renovar um token expirado, você precisa de um token válido! 🤔

## 🔧 Correção Temporária Aplicada

### 1. Aumentado Tempo de Expiração
```env
# backend/.env
JWT_EXPIRES_IN=7d  # Era: 24h
```

**Vantagem**: Usuários conseguem manter sessão por 7 dias sem interrupção.
**Desvantagem**: Tokens roubados ficam válidos por mais tempo (risco de segurança).

### 2. Implementado Tentativa de Auto-Refresh no Frontend
```typescript
// frontend-web/src/services/api.ts
// Interceptor tenta renovar token quando recebe 401
// ⚠️ MAS: backend rejeita token expirado, então não funciona ainda!
```

### 3. WebSocket com Reconexão Inteligente
```typescript
// frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts
socket.on('connect_error', (err) => {
  if (err.message.includes('jwt expired')) {
    // Aguarda 2s e tenta obter novo token
    setTimeout(() => {
      const newToken = localStorage.getItem('authToken');
      if (newToken !== oldToken) {
        connect(); // Reconecta com novo token
      }
    }, 2000);
  }
});
```

## ✅ Solução Correta (TODO)

### Arquitetura de Refresh Token Adequada

#### Backend - Criar Tabela de Refresh Tokens

```sql
-- migration: criar tabela refresh_tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);
```

#### Backend - Entity e Service

```typescript
// refresh-token.entity.ts
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  token: string;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  revoked: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

```typescript
// auth.service.ts
async login(email: string, senha: string) {
  // ... validações ...
  
  const accessToken = this.generateAccessToken(user);  // 15min
  const refreshToken = await this.generateRefreshToken(user);  // 30 dias
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 900, // 15 minutos em segundos
  };
}

async generateRefreshToken(user: User): Promise<string> {
  const token = uuidv4(); // Token aleatório, não JWT
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias
  
  await this.refreshTokenRepository.save({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });
  
  return token;
}

// ✅ NOVO: Endpoint SEM guard (aceita refresh token)
async refreshAccessToken(refreshToken: string) {
  const storedToken = await this.refreshTokenRepository.findOne({
    where: { token: refreshToken, revoked: false },
    relations: ['user'],
  });
  
  if (!storedToken || storedToken.expires_at < new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  const newAccessToken = this.generateAccessToken(storedToken.user);
  
  return {
    access_token: newAccessToken,
    expires_in: 900,
  };
}
```

#### Backend - Controller Sem Guard

```typescript
// auth.controller.ts
@Post('refresh')
// ✅ SEM @UseGuards - aceita refresh token no body
async refresh(@Body('refresh_token') refreshToken: string) {
  return this.authService.refreshAccessToken(refreshToken);
}
```

#### Frontend - Salvar Refresh Token

```typescript
// authService.ts
async login(credentials: LoginRequest) {
  const response = await api.post('/auth/login', credentials);
  
  const { access_token, refresh_token, user } = response.data.data;
  
  // Salvar ambos os tokens
  localStorage.setItem('authToken', access_token);
  localStorage.setItem('refreshToken', refresh_token);  // ✅ NOVO
  localStorage.setItem('user_data', JSON.stringify(user));
  
  return response.data;
}
```

#### Frontend - Interceptor Usando Refresh Token

```typescript
// api.ts
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // ✅ Usar refresh token para obter novo access token
        const response = await apiPublic.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const newAccessToken = response.data.data.access_token;
        localStorage.setItem('authToken', newAccessToken);
        
        // Retentar requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh falhou - fazer logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

#### Frontend - WebSocket com Refresh Token

```typescript
// useWebSocket.ts
socket.on('connect_error', async (err) => {
  if (err.message.includes('jwt expired')) {
    try {
      // ✅ Renovar token antes de reconectar
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      
      const newAccessToken = response.data.data.access_token;
      localStorage.setItem('authToken', newAccessToken);
      
      // Reconectar com novo token
      socket.io.opts.auth.token = newAccessToken;
      socket.connect();
      
    } catch (refreshError) {
      console.error('Falha ao renovar token:', refreshError);
      window.location.href = '/login';
    }
  }
});
```

## 📋 Checklist de Implementação

### Backend
- [ ] Criar migration para tabela `refresh_tokens`
- [ ] Criar entity `RefreshToken`
- [ ] Criar `RefreshTokenService` com métodos:
  - [ ] `generateRefreshToken(user)`
  - [ ] `validateRefreshToken(token)`
  - [ ] `revokeRefreshToken(token)`
  - [ ] `revokeAllUserTokens(userId)` (para logout de todos os dispositivos)
- [ ] Atualizar `AuthService.login()` para retornar refresh token
- [ ] Criar endpoint `POST /auth/refresh` SEM guard
- [ ] Reduzir `JWT_EXPIRES_IN` para 15min (access token curto)
- [ ] Manter `JWT_REFRESH_EXPIRES_IN` em 30 dias

### Frontend
- [ ] Salvar `refreshToken` no localStorage ao fazer login
- [ ] Atualizar interceptor axios para usar refresh token
- [ ] Atualizar `useWebSocket` para renovar token antes de reconectar
- [ ] Implementar logout que revoga refresh token no backend
- [ ] Limpar `refreshToken` do localStorage ao deslogar

### Segurança Adicional
- [ ] Implementar **token rotation**: cada refresh gera novo refresh token
- [ ] Implementar **device fingerprint** para detectar uso indevido
- [ ] Implementar **rate limiting** no endpoint `/auth/refresh`
- [ ] Adicionar logs de auditoria para renovações de token
- [ ] Implementar **revoke on password change** (invalidar todos os tokens)

## 🎯 Benefícios da Solução Correta

1. **Segurança**: Access token expira em 15min (janela curta para roubo)
2. **UX**: Usuário não precisa fazer login novamente (refresh automático)
3. **Controle**: Possível revogar sessões individuais (logout remoto)
4. **Auditoria**: Logs de todas as renovações de token
5. **Multi-device**: Cada dispositivo tem seu refresh token único

## ⏱️ Cronograma Sugerido

### Curto Prazo (Atual)
- ✅ JWT expira em 7 dias (solução temporária)
- ✅ WebSocket tenta reconectar se detectar novo token
- ✅ Interceptor preparado (mas não funcional sem backend adequado)

### Médio Prazo (Sprint 1-2)
- [ ] Implementar tabela e lógica de refresh token no backend
- [ ] Atualizar frontend para usar refresh token
- [ ] Reduzir JWT para 15min

### Longo Prazo (Sprint 3-4)
- [ ] Token rotation
- [ ] Device fingerprint
- [ ] Auditoria completa
- [ ] Dashboard de sessões ativas

## 📚 Referências

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6749: OAuth 2.0 - Refresh Token](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)
- [NestJS JWT Best Practices](https://docs.nestjs.com/security/authentication#jwt-token)
- [Auth0: Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)

## 🔗 Arquivos Afetados

### Alterados Nesta Sessão
- ✅ `backend/.env` - JWT_EXPIRES_IN: 24h → 7d
- ✅ `frontend-web/src/services/api.ts` - Interceptor com tentativa de refresh
- ✅ `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts` - Reconexão inteligente

### A Criar (TODO)
- `backend/src/modules/auth/entities/refresh-token.entity.ts`
- `backend/src/modules/auth/services/refresh-token.service.ts`
- `backend/src/migrations/YYYYMMDDHHMMSS-create-refresh-tokens-table.ts`

### A Modificar (TODO)
- `backend/src/modules/auth/auth.service.ts` - Adicionar lógica de refresh token
- `backend/src/modules/auth/auth.controller.ts` - Endpoint refresh sem guard
- `frontend-web/src/services/authService.ts` - Salvar/usar refresh token
- `frontend-web/src/contexts/AuthContext.tsx` - Gerenciar refresh token

---

**Última atualização**: 2025-01-18  
**Status**: Correção temporária aplicada (7 dias), solução definitiva pendente  
**Prioridade**: Alta (segurança e UX)
