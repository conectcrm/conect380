#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar horários de funcionamento dos núcleos
"""

import psycopg2
import json
from datetime import datetime

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
    
    # Buscar núcleos visíveis
    cursor.execute("""
        SELECT 
            id,
            nome,
            ativo,
            visivel_no_bot,
            horario_funcionamento,
            prioridade
        FROM nucleos_atendimento
        WHERE empresa_id = %s
          AND ativo = true
          AND visivel_no_bot = true
        ORDER BY prioridade ASC, nome ASC
    """, (EMPRESA_ID,))
    
    nucleos = cursor.fetchall()
    
    if not nucleos:
        print(f"❌ Nenhum núcleo visível encontrado")
        exit(1)
    
    print(f"📊 Núcleos ativos e visíveis: {len(nucleos)}")
    print(f"🕒 Data/Hora atual: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"📅 Dia da semana: {datetime.now().strftime('%A')}\n")
    print("=" * 100)
    
    for nucleo in nucleos:
        id, nome, ativo, visivel_no_bot, horario_funcionamento, prioridade = nucleo
        
        print(f"\n🏢 Núcleo: {nome}")
        print(f"   Prioridade: {prioridade}")
        print(f"   ID: {id}")
        
        if horario_funcionamento:
            try:
                horario = json.loads(horario_funcionamento) if isinstance(horario_funcionamento, str) else horario_funcionamento
                print(f"   ⏰ Horário de funcionamento:")
                print(f"      {json.dumps(horario, indent=6, ensure_ascii=False)}")
            except Exception as e:
                print(f"   ⚠️  Erro ao ler horário: {e}")
        else:
            print(f"   ⚠️  SEM horário de funcionamento configurado (pode causar invisibilidade!)")
        
        print("-" * 100)
    
    print("\n💡 DIAGNÓSTICO:")
    print("   Se um núcleo não aparece no bot mesmo estando ativo e visível,")
    print("   o problema pode ser:")
    print("   1. Horário de funcionamento está fora do horário atual")
    print("   2. Dia da semana não está configurado")
    print("   3. horario_funcionamento está NULL ou inválido")
    
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
