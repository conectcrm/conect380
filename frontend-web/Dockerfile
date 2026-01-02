# ============================================
# Multi-stage build para frontend React
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build args para variáveis de ambiente do React (ANTES de copiar código)
ARG REACT_APP_API_URL=http://localhost:3001
ARG REACT_APP_WS_URL=ws://localhost:3001

# Expor variáveis como ambiente em tempo de build
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte (exceto .env.production via .dockerignore)
COPY . .

# Build para produção (com variáveis ENV já definidas)
RUN npm run build

# ============================================
# Stage 2: Production com Nginx
FROM nginx:alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar build do React
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Executar Nginx
CMD ["nginx", "-g", "daemon off;"]
