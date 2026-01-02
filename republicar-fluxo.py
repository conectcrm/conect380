#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Republicar fluxo para forçar atualização do campo published_at
sem alterar a estrutura
"""
import psycopg2
from datetime import datetime

# Conectar ao banco
conn = psycopg2.connect(
    host="localhost",
    port=5434,
    database="conectcrm_db",
    user="conectcrm",
    password="conectcrm123"
)

cur = conn.cursor()

# ID do fluxo
fluxo_id = 'ce74c2f3-b5d3-46dd-96f1-5f88339b9061'

# Atualizar apenas o campo published_at (força recarregamento)
cur.execute("""
    UPDATE fluxos_triagem
    SET 
        published_at = NOW(),
        updated_at = NOW()
    WHERE id = %s
    RETURNING versao, published_at AT TIME ZONE 'America/Sao_Paulo' as publicado
""", (fluxo_id,))

row = cur.fetchone()
versao, publicado = row

conn.commit()

print(f"✅ Fluxo republicado com sucesso!")
print(f"   Versão: {versao}")
print(f"   Publicado: {publicado}")
print(f"\n📝 Nota: A estrutura do fluxo permanece inalterada (versão 8 com botões).")
print(f"         Apenas o timestamp de publicação foi atualizado.")

cur.close()
conn.close()

print(f"\n🔄 Reinicie o backend para garantir que o cache seja limpo:")
print(f"   cd backend && npm run start:dev")
