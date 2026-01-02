#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Despublicar fluxo para permitir edição pela interface
"""
import psycopg2

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

# Despublicar (marcar como não publicado)
cur.execute("""
    UPDATE fluxos_triagem
    SET 
        publicado = false,
        published_at = NULL,
        updated_at = NOW()
    WHERE id = %s
    RETURNING nome, versao, publicado
""", (fluxo_id,))

row = cur.fetchone()
nome, versao, publicado = row

conn.commit()

print(f"✅ Fluxo despublicado com sucesso!")
print(f"   Nome: {nome}")
print(f"   Versão: {versao}")
print(f"   Publicado: {publicado}")
print(f"\n📝 Agora você pode editar pela interface sem erro 400.")
print(f"   Após editar, clique em 'Publicar' novamente na interface.")
print(f"\n⚠️  ATENÇÃO: Enquanto despublicado, o fluxo NÃO será usado no WhatsApp!")

cur.close()
conn.close()
