#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para simular a consulta findOpcoesParaBot
Testa se os 3 núcleos agora aparecem no bot
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
print(f"🕒 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print(f"📅 Dia da semana: {datetime.now().strftime('%A')}\n")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("✅ Conectado com sucesso!")
    print("=" * 100)
    
    # Simular a query do nucleo.service.ts
    print("\n📊 SIMULANDO QUERY findOpcoesParaBot...\n")
    
    cursor.execute("""
        SELECT 
            n.id,
            n.nome,
            n.descricao,
            n.cor,
            n.icone,
            n.prioridade,
            n.horario_funcionamento
        FROM nucleos_atendimento n
        WHERE n.empresa_id = %s
          AND n.ativo = true
          AND n.visivel_no_bot = true
        ORDER BY n.prioridade ASC, n.nome ASC
    """, (EMPRESA_ID,))
    
    nucleos = cursor.fetchall()
    
    print(f"🔍 [NUCLEO DEBUG] Núcleos encontrados: {len(nucleos)}\n")
    
    resultado_final = []
    
    for nucleo in nucleos:
        id, nome, descricao, cor, icone, prioridade, horario_funcionamento = nucleo
        
        print(f"🏢 NÚCLEO: {nome}")
        print(f"   Prioridade: {prioridade}")
        
        # Buscar departamentos (como faz o código)
        cursor.execute("""
            SELECT 
                id,
                nome,
                descricao,
                cor,
                icone
            FROM departamentos
            WHERE nucleo_id = %s
              AND ativo = true
              AND visivel_no_bot = true
            ORDER BY ordem ASC, nome ASC
        """, (id,))
        
        departamentos = cursor.fetchall()
        
        print(f"   📊 Departamentos: {len(departamentos)}")
        
        if departamentos:
            for dep in departamentos:
                print(f"      - {dep[1]}")
            
            resultado_final.append({
                'id': id,
                'nome': nome,
                'departamentos': len(departamentos)
            })
            print(f"   ✅ SERÁ EXIBIDO NO BOT")
        else:
            print(f"   ❌ NÃO SERÁ EXIBIDO (sem departamentos)")
        
        print("-" * 100)
    
    print("\n" + "=" * 100)
    print(f"🎯 RESULTADO FINAL: {len(resultado_final)} núcleo(s) disponível(is) no bot\n")
    
    for i, nucleo in enumerate(resultado_final, 1):
        print(f"   {i}. {nucleo['nome']} ({nucleo['departamentos']} departamento(s))")
    
    if len(resultado_final) == 3:
        print("\n✅ SUCESSO! Todos os 3 núcleos agora aparecem no bot!")
    elif len(resultado_final) < 3:
        print(f"\n⚠️  ATENÇÃO: Apenas {len(resultado_final)} de 3 núcleos aparecem")
    else:
        print(f"\n✅ {len(resultado_final)} núcleos disponíveis!")
    
    print("\n💡 PRÓXIMO PASSO:")
    print("   Teste no WhatsApp enviando 'Olá' e verifique se os 3 núcleos aparecem!")
    
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
