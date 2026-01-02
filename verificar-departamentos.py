#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar departamentos dos núcleos
"""

import psycopg2

DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'database': 'conectcrm_db',
    'user': 'conectcrm',
    'password': 'conectcrm123'
}

NUCLEOS_IDS = {
    'Suporte Técnico': '22222222-3333-4444-5555-666666666661',
    'Comercial': '22222222-3333-4444-5555-666666666663',
    'Financeiro': '22222222-3333-4444-5555-666666666662'
}

print("🔗 Conectando ao banco de dados...")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("✅ Conectado com sucesso!\n")
    print("=" * 100)
    
    for nucleo_nome, nucleo_id in NUCLEOS_IDS.items():
        print(f"\n🏢 NÚCLEO: {nucleo_nome}")
        print(f"   ID: {nucleo_id}")
        
        # Buscar departamentos do núcleo
        cursor.execute("""
            SELECT 
                id,
                nome,
                ativo,
                visivel_no_bot,
                ordem
            FROM departamentos
            WHERE nucleo_id = %s
            ORDER BY ordem ASC, nome ASC
        """, (nucleo_id,))
        
        departamentos = cursor.fetchall()
        
        if not departamentos:
            print(f"   ⚠️  NENHUM DEPARTAMENTO CADASTRADO!")
            print(f"   📌 Por isso este núcleo NÃO aparece no bot!")
        else:
            print(f"   📊 Total de departamentos: {len(departamentos)}")
            
            visiveis = 0
            for dep in departamentos:
                id, nome, ativo, visivel_no_bot, ordem = dep
                
                status_ativo = "✅" if ativo else "❌"
                status_bot = "👁️ " if visivel_no_bot else "🚫"
                
                print(f"      {status_ativo} {status_bot} {nome} (ordem: {ordem})")
                
                if ativo and visivel_no_bot:
                    visiveis += 1
            
            if visiveis == 0:
                print(f"   ⚠️  NENHUM DEPARTAMENTO VISÍVEL NO BOT!")
                print(f"   📌 Por isso este núcleo NÃO aparece no bot!")
            else:
                print(f"   ✅ {visiveis} departamento(s) visível(is) no bot")
        
        print("-" * 100)
    
    print("\n💡 SOLUÇÃO:")
    print("   Para um núcleo aparecer no bot, ele PRECISA ter pelo menos")
    print("   1 departamento com ativo=true E visivel_no_bot=true")
    print("\n   Para criar departamentos:")
    print("   INSERT INTO departamentos (id, nome, nucleo_id, ativo, visivel_no_bot, ordem)")
    print("   VALUES (gen_random_uuid(), 'Nome do Dep', 'id-do-nucleo', true, true, 10);")
    
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
