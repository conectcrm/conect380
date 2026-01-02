#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Adiciona Reply Buttons na etapa boas-vindas
Botões estilo WhatsApp Business API
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

# Etapa boas-vindas com Reply Buttons (para clientes existentes)
BOAS_VINDAS_ATUALIZADA = {
    "id": "boas-vindas",
    "tipo": "interativo",  # Mudado de "mensagem" para "interativo"
    "mensagem": "👋 Olá{{#if primeiroNome}}, *{{primeiroNome}}*{{/if}}! Seja muito bem-vindo(a) ao *ConectCRM*!\n\n😊 É um prazer ter você aqui!",
    "nomeExibicao": "Boas-vindas",
    "proximaEtapa": "coleta-primeiro-nome",
    "opcoes": [
        {
            "id": "sim-confirmar",
            "titulo": "✅ Sim, vamos lá!",
            "proximaEtapa": "coleta-primeiro-nome"
        },
        {
            "id": "nao-agora",
            "titulo": "❌ Não, voltar depois",
            "proximaEtapa": "despedida-cancelamento"
        },
        {
            "id": "sair",
            "titulo": "🚪 Sair do atendimento",
            "proximaEtapa": "despedida-cancelamento"
        }
    ],
    "metadata": {
        "verificarContatoAutomaticamente": True,
        "personalizarSeClienteExistente": True,
        "usarNomeSeDisponivel": True,
        "mensagemClienteExistente": "👋 Olá, *{{primeiroNome}}*! Que bom ter você de volta ao *ConectCRM*! 😊\n\nVamos confirmar seus dados antes de prosseguir?",
        "usarBotoesInterativos": True,  # Flag para usar Reply Buttons
        "tipoBotao": "reply"  # Tipo de botão WhatsApp
    }
}

# Etapa de despedida para cancelamento
DESPEDIDA_CANCELAMENTO = {
    "id": "despedida-cancelamento",
    "tipo": "mensagem",
    "mensagem": "Tudo bem! 👋\n\nQuando precisar de ajuda, é só chamar novamente. Estaremos aqui! 😊",
    "nomeExibicao": "Despedida - Cancelamento",
    "proximaEtapa": None,
    "metadata": {
        "finalizarSessao": True
    }
}

def main():
    try:
        print("🔌 Conectando ao PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        cur = conn.cursor()
        
        # 1. Buscar estrutura atual
        print("📋 Buscando estrutura atual do fluxo...")
        cur.execute("""
            SELECT estrutura FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        estrutura_atual = cur.fetchone()[0]
        
        # 2. Atualizar etapa boas-vindas
        print("✏️ Atualizando etapa boas-vindas com Reply Buttons...")
        estrutura_atual['etapas']['boas-vindas'] = BOAS_VINDAS_ATUALIZADA
        
        # 3. Adicionar etapa de despedida
        print("➕ Adicionando etapa de despedida...")
        estrutura_atual['etapas']['despedida-cancelamento'] = DESPEDIDA_CANCELAMENTO
        
        # 4. Salvar no banco
        print("💾 Salvando no banco de dados...")
        cur.execute("""
            UPDATE fluxos_triagem 
            SET estrutura = %s,
                versao = versao + 1,
                updated_at = NOW()
            WHERE id = %s
            RETURNING versao, updated_at;
        """, (json.dumps(estrutura_atual, ensure_ascii=False), FLOW_ID))
        
        versao, updated_at = cur.fetchone()
        conn.commit()
        
        print(f"\n✅ Fluxo atualizado com sucesso!")
        print(f"   Nova versão: {versao}")
        print(f"   Atualizado em: {updated_at}")
        
        # 5. Verificar resultado
        print("\n🔍 Verificando etapa boas-vindas...")
        cur.execute("""
            SELECT 
                estrutura->'etapas'->'boas-vindas'->>'tipo',
                jsonb_array_length(estrutura->'etapas'->'boas-vindas'->'opcoes')
            FROM fluxos_triagem WHERE id = %s
        """, (FLOW_ID,))
        tipo, num_opcoes = cur.fetchone()
        
        print(f"   Tipo: {tipo}")
        print(f"   Número de opções: {num_opcoes}")
        
        if tipo == 'interativo' and num_opcoes == 3:
            print("\n✅ Reply Buttons configurados corretamente!")
        else:
            print("\n⚠️ Atenção: Configuração pode estar incorreta")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
