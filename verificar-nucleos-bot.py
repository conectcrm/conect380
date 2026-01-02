#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar configuração de núcleos
Mostra quais núcleos estão visíveis no bot
"""

import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'database': 'conectcrm_db',
    'user': 'conectcrm',
    'password': 'conectcrm123'
}

EMPRESA_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

print("🔗 Conectando ao banco de dados...")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("✅ Conectado com sucesso!\n")
    
    # Buscar todos os núcleos
    cursor.execute("""
        SELECT 
            id,
            nome,
            ativo,
            visivel_no_bot,
            prioridade,
            codigo
        FROM nucleos_atendimento
        WHERE empresa_id = %s
        ORDER BY prioridade ASC, nome ASC
    """, (EMPRESA_ID,))
    
    nucleos = cursor.fetchall()
    
    if not nucleos:
        print(f"❌ Nenhum núcleo encontrado para empresa {EMPRESA_ID}")
        exit(1)
    
    print(f"📊 Total de núcleos cadastrados: {len(nucleos)}\n")
    print("=" * 80)
    
    visiveis_count = 0
    invisiveis = []
    
    for nucleo in nucleos:
        id, nome, ativo, visivel_no_bot, prioridade, codigo = nucleo
        
        status_ativo = "✅ Ativo" if ativo else "❌ Inativo"
        status_bot = "👁️  Visível" if visivel_no_bot else "🚫 Invisível"
        
        print(f"Núcleo: {nome}")
        print(f"  Código: {codigo}")
        print(f"  Status: {status_ativo}")
        print(f"  Bot: {status_bot}")
        print(f"  Prioridade: {prioridade}")
        print(f"  ID: {id}")
        print("-" * 80)
        
        if visivel_no_bot and ativo:
            visiveis_count += 1
        else:
            invisiveis.append(nome)
    
    print("\n📈 RESUMO:")
    print(f"  ✅ Núcleos VISÍVEIS no bot: {visiveis_count}")
    print(f"  🚫 Núcleos INVISÍVEIS no bot: {len(invisiveis)}")
    
    if invisiveis:
        print(f"\n⚠️  Núcleos que NÃO aparecem no bot:")
        for nome in invisiveis:
            print(f"    - {nome}")
    
    print("\n💡 SOLUÇÃO:")
    print("   Para ativar um núcleo no bot, execute:")
    print("   UPDATE nucleos_atendimento")
    print("   SET visivel_no_bot = true")
    print("   WHERE nome = 'NomeDoNucleo';")
    
except psycopg2.Error as e:
    print(f"\n❌ Erro no banco de dados: {e}")
    exit(1)
except Exception as e:
    print(f"\n❌ Erro inesperado: {e}")
    exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
        print("\n🔌 Conexão com banco fechada")
