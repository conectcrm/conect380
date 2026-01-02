#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige estrutura de botões para formato correto
Campo 'titulo' deve ser 'texto' para compatibilidade com BotOption
"""

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

# Botões com campo correto (texto em vez de titulo)
OPCOES_CORRIGIDAS = [
    {
        "id": "sim-confirmar",
        "texto": "✅ Sim, vamos lá!",
        "valor": "sim-confirmar",
        "proximaEtapa": "coleta-primeiro-nome"
    },
    {
        "id": "nao-agora",
        "texto": "❌ Não, voltar depois",
        "valor": "nao-agora",
        "proximaEtapa": "despedida-cancelamento"
    },
    {
        "id": "sair",
        "texto": "🚪 Sair do atendimento",
        "valor": "sair",
        "proximaEtapa": "despedida-cancelamento"
    }
]

def main():
    try:
        print("🔌 Conectando ao PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        cur = conn.cursor()
        
        # Buscar estrutura atual
        print("📋 Buscando estrutura atual...")
        cur.execute("""
            SELECT estrutura FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        estrutura = cur.fetchone()[0]
        
        # Corrigir opções
        print("✏️ Corrigindo estrutura de botões...")
        estrutura['etapas']['boas-vindas']['opcoes'] = OPCOES_CORRIGIDAS
        
        # Salvar
        print("💾 Salvando no banco...")
        cur.execute("""
            UPDATE fluxos_triagem 
            SET estrutura = %s,
                versao = versao + 1,
                updated_at = NOW(),
                published_at = NOW()
            WHERE id = %s
            RETURNING versao;
        """, (json.dumps(estrutura, ensure_ascii=False), FLOW_ID))
        
        versao = cur.fetchone()[0]
        conn.commit()
        
        print(f"\n✅ Botões corrigidos! Nova versão: {versao}")
        
        # Verificar
        print("\n🔍 Verificando botões...")
        cur.execute("""
            SELECT jsonb_pretty(estrutura->'etapas'->'boas-vindas'->'opcoes')
            FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        opcoes = cur.fetchone()[0]
        print(opcoes)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
