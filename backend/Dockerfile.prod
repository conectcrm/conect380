# ============================================
# Multi-stage build para otimização de produção
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY src ./src
COPY ormconfig.js ./

# Build da aplicação
RUN npm run build

# Limpar devDependencies
RUN npm prune --production --legacy-peer-deps

# ============================================
# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Instalar dumb-init para gerenciamento correto de processos
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Copiar dependências de produção
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar build
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/ormconfig.js ./

# Criar diretórios necessários
RUN mkdir -p uploads logs && \
  chown -R nestjs:nodejs uploads logs

# Trocar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check (porta interna 3001, mapeada externamente para 3500)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 || r.statusCode === 404 ? 0 : 1)})"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Executar aplicação
CMD ["node", "dist/main.js"]
