#!/bin/bash
# Script para executar migrations dentro do container backend

echo "🔧 Executando migrations dentro do container conectsuite-backend..."

# Copiar migrations para o container
docker cp /c/Projetos/conectcrm/backend/dist/src/migrations conectsuite-backend:/app/dist/src/

# Executar migrations dentro do container
docker exec conectsuite-backend npm run migration:run

echo "✅ Migrations executadas!"
