#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Criar um script de teste de validação do DTO
"""
import json

# Estrutura que o frontend provavelmente está enviando
payload_frontend = {
    "nome": "Fluxo Padrão - Triagem Inteligente v3.0",
    "descricao": "Fluxo de triagem automática",
    "tipo": "arvore_decisao",
    "canais": ["whatsapp"],
    "ativo": True,
    "estrutura": {
        "etapaInicial": "boas-vindas",
        "versao": "3.1",
        "etapas": {
            "boas-vindas": {
                "id": "boas-vindas",
                "tipo": "interativo",
                "mensagem": "👋 Olá{{#if primeiroNome}}, *{{primeiroNome}}*{{/if}}!",
                "opcoes": [
                    {
                        "id": "sim-confirmar",
                        "texto": "✅ Sim, vamos lá!",
                        "valor": "sim-confirmar",
                        "proximaEtapa": "coleta-primeiro-nome"
                    }
                ]
            }
        }
    }
}

# Validações do DTO
validacoes = {
    "CreateFluxoDto": {
        "nome": {"type": "string", "required": True},
        "descricao": {"type": "string", "required": False},
        "tipo": {"type": "enum", "required": True, "values": ["menu_opcoes", "menu_simples", "arvore_decisao", "keyword_match", "coleta_dados", "condicional"]},
        "canais": {"type": "array<string>", "required": False},
        "estrutura": {"type": "EstruturaFluxoDto", "required": True}
    },
    "EstruturaFluxoDto": {
        "etapaInicial": {"type": "string", "required": True},
        "versao": {"type": "string", "required": False},
        "etapas": {"type": "Record<string, EtapaDto>", "required": True}
    },
    "EtapaDto": {
        "id": {"type": "string", "required": True},
        "mensagem": {"type": "string", "required": True},
        "opcoes": {"type": "array<OpcaoMenuDto>", "required": False},
        "tipo": {"type": "string", "required": False}
    },
    "OpcaoMenuDto": {
        "numero": {"type": "number", "required": False},
        "valor": {"type": "string", "required": False},
        "texto": {"type": "string", "required": True},
        "proximaEtapa": {"type": "string", "required": False}
    }
}

print("🔍 Validando payload do frontend...")
print("\n📋 Estrutura enviada:")
print(json.dumps(payload_frontend, indent=2, ensure_ascii=False))

# Verificar campos obrigatórios
def validar_objeto(obj, schema_name, schema):
    erros = []
    
    for campo, regras in schema.items():
        if regras.get("required") and campo not in obj:
            erros.append(f"Campo obrigatório '{campo}' ausente em {schema_name}")
        
        if campo in obj:
            valor = obj[campo]
            tipo_esperado = regras["type"]
            
            # Validar enum
            if tipo_esperado == "enum" and "values" in regras:
                if valor not in regras["values"]:
                    erros.append(f"Campo '{campo}' tem valor inválido '{valor}'. Esperado: {regras['values']}")
    
    return erros

# Validar CreateFluxoDto
erros = validar_objeto(payload_frontend, "CreateFluxoDto", validacoes["CreateFluxoDto"])

# Validar estrutura
if "estrutura" in payload_frontend:
    erros += validar_objeto(payload_frontend["estrutura"], "EstruturaFluxoDto", validacoes["EstruturaFluxoDto"])
    
    # Validar etapas
    if "etapas" in payload_frontend["estrutura"]:
        for etapa_id, etapa in payload_frontend["estrutura"]["etapas"].items():
            erros += validar_objeto(etapa, f"EtapaDto[{etapa_id}]", validacoes["EtapaDto"])
            
            # Validar opcoes
            if "opcoes" in etapa:
                for idx, opcao in enumerate(etapa["opcoes"]):
                    erros += validar_objeto(opcao, f"OpcaoMenuDto[{etapa_id}][{idx}]", validacoes["OpcaoMenuDto"])

if erros:
    print("\n❌ ERROS DE VALIDAÇÃO ENCONTRADOS:")
    for erro in erros:
        print(f"   - {erro}")
else:
    print("\n✅ Payload válido! Todas as validações passaram.")

print("\n📝 Possíveis causas do erro 400:")
print("   1. Campo 'tipo' inválido (deve ser um dos valores do enum TipoFluxo)")
print("   2. Campos aninhados com validação @ValidateNested() falhando")
print("   3. Campo OpcaoMenuDto.texto pode estar faltando em alguma opção")
print("   4. Campo EtapaDto.mensagem pode estar vazio em alguma etapa")
print("\n💡 Solução: Verifique o console do NAVEGADOR para ver a resposta completa do erro 400")
print("   O backend deve retornar um array com as validações que falharam")
