#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificar estrutura dos botões Reply no fluxo de triagem
"""
import psycopg2
import json

# Conectar ao banco
conn = psycopg2.connect(
    host="localhost",
    port=5434,
    database="conectcrm_db",
    user="conectcrm",
    password="conectcrm123"
)

cur = conn.cursor()

# Buscar estrutura dos botões
cur.execute("""
    SELECT 
        versao,
        published_at AT TIME ZONE 'America/Sao_Paulo' as publicado,
        estrutura->'etapas'->'boas-vindas' as boas_vindas
    FROM fluxos_triagem 
    WHERE id = 'ce74c2f3-b5d3-46dd-96f1-5f88339b9061'
""")

row = cur.fetchone()
versao, publicado, boas_vindas = row

print(f"✅ Fluxo encontrado!")
print(f"   Versão: {versao}")
print(f"   Publicado: {publicado}")
print(f"\n📋 Estrutura boas-vindas:")
print(f"   Tipo: {boas_vindas.get('tipo')}")
print(f"   Mensagem: {boas_vindas.get('mensagem')[:80]}...")
print(f"\n🔘 BOTÕES:")

opcoes = boas_vindas.get('opcoes', [])
for i, opcao in enumerate(opcoes, 1):
    print(f"\n   Botão {i}:")
    print(f"      ID: {opcao.get('id')}")
    print(f"      Texto: {opcao.get('texto')}")
    print(f"      Valor: {opcao.get('valor')}")
    print(f"      Próxima Etapa: {opcao.get('proximaEtapa')}")

# Verificar etapa de despedida
cur.execute("""
    SELECT 
        estrutura->'etapas'->'despedida-cancelamento' as despedida
    FROM fluxos_triagem 
    WHERE id = 'ce74c2f3-b5d3-46dd-96f1-5f88339b9061'
""")

row = cur.fetchone()
despedida = row[0] if row else None

if despedida:
    print(f"\n✅ Etapa de despedida encontrada:")
    print(f"   Tipo: {despedida.get('tipo')}")
    print(f"   Mensagem: {despedida.get('mensagem')[:80]}...")
else:
    print(f"\n⚠️  Etapa de despedida NÃO encontrada!")

cur.close()
conn.close()

print(f"\n✅ Verificação concluída!")
