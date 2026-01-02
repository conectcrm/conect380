#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import psycopg2
import json

DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'database': 'conectcrm_db',
    'user': 'conectcrm',
    'password': 'conectcrm123'
}

FLOW_ID = 'ce74c2f3-b5d3-46dd-96f1-5f88339b9061'

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cur = conn.cursor()
    
    # Buscar mensagem cliente existente
    cur.execute("""
        SELECT estrutura->'etapas'->'boas-vindas'->'metadata'->>'mensagemClienteExistente' 
        FROM fluxos_triagem WHERE id = %s
    """, (FLOW_ID,))
    mensagem = cur.fetchone()[0]
    
    print("📋 Mensagem Cliente Existente no banco:")
    print(mensagem)
    print("\n🔍 Análise de variáveis:")
    
    if '{{primeiroNome}}' in mensagem:
        print("✅ Usa sintaxe correta: {{primeiroNome}}")
    elif '{primeiroNome}' in mensagem:
        print("❌ Usa sintaxe errada: {primeiroNome} (falta uma chave)")
    else:
        print("❓ Não encontrou primeiroNome na mensagem")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
