# ============================================
# Multi-stage build para frontend React
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build args para variáveis de ambiente do React
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL

# Expor variáveis como ambiente em tempo de build
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

# Build para produção
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
