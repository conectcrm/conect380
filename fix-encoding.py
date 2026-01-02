#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix UTF-8 encoding para Fluxo Padrão v3.1
Insere corretamente emojis no PostgreSQL
"""

import psycopg2
import json

# Configuração do banco
DB_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'database': 'conectcrm_db',
    'user': 'conectcrm',
    'password': 'conectcrm123'
}

# Etapa boas-vindas com encoding correto
BOAS_VINDAS_ETAPA = {
    "id": "boas-vindas",
    "tipo": "mensagem",
    "mensagem": "👋 Olá{{#if primeiroNome}}, *{{primeiroNome}}*{{/if}}! Seja muito bem-vindo(a) ao *ConectCRM*!\n\n😊 É um prazer ter você aqui!",
    "nomeExibicao": "Boas-vindas",
    "proximaEtapa": "coleta-primeiro-nome",
    "metadata": {
        "verificarContatoAutomaticamente": True,
        "personalizarSeClienteExistente": True,
        "usarNomeSeDisponivel": True,
        "mensagemClienteExistente": "👋 Olá, *{{primeiroNome}}*! Que bom ter você de volta ao *ConectCRM*! 😊\n\nVamos confirmar seus dados antes de prosseguir?"
    }
}

FLOW_ID = 'ce74c2f3-b5d3-46dd-96f1-5f88339b9061'

def main():
    try:
        # Conectar ao banco
        print("🔌 Conectando ao PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        cur = conn.cursor()
        
        # Atualizar etapa boas-vindas
        print("📝 Atualizando etapa boas-vindas com encoding UTF-8...")
        query = """
        UPDATE fluxos_triagem 
        SET estrutura = jsonb_set(
            estrutura,
            '{etapas,boas-vindas}',
            %s::jsonb
        ),
        versao = versao + 1,
        updated_at = NOW()
        WHERE id = %s
        RETURNING versao;
        """
        
        cur.execute(query, (json.dumps(BOAS_VINDAS_ETAPA, ensure_ascii=False), FLOW_ID))
        versao = cur.fetchone()[0]
        conn.commit()
        
        print(f"✅ Fluxo atualizado com sucesso! Nova versão: {versao}")
        
        # Verificar resultado
        print("\n🔍 Verificando mensagem salva...")
        cur.execute("""
            SELECT estrutura->'etapas'->'boas-vindas'->>'mensagem' 
            FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        mensagem = cur.fetchone()[0]
        
        print(f"\n📋 Mensagem no banco:\n{mensagem}\n")
        
        # Verificar mensagemClienteExistente
        cur.execute("""
            SELECT estrutura->'etapas'->'boas-vindas'->'metadata'->>'mensagemClienteExistente' 
            FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        mensagem_existente = cur.fetchone()[0]
        
        print(f"📋 Mensagem Cliente Existente:\n{mensagem_existente}\n")
        
        cur.close()
        conn.close()
        
        print("✅ Encoding corrigido com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
