# Faturamento - Guia Rápido

## Campos Principais
- `contratoId` (opcional): agora nullable, permite faturas avulsas.
- `itens[]`: cada item calcula `valorTotal = quantidade * valorUnitario - valorDesconto - (percentualDesconto% do subtotal)`.
- Salvaguarda: hook em `ItemFatura` recalcula antes de insert/update.

## Regras de Cálculo
1. Subtotal item = quantidade * valorUnitario
2. Desconto percentual (se informado) = subtotal * (percentualDesconto / 100)
3. Total item = subtotal - valorDesconto - descontoPercentualValor
4. Total fatura = soma dos totais dos itens

## Exemplo JSON Criação
```json
{
  "descricao": "Serviços Avulsos",
  "clienteId": 12,
  "usuarioResponsavelId": "<uuid>",
  "dataVencimento": "2025-08-31",
  "itens": [
    { "descricao": "Hora Consultoria", "quantidade": 2, "valorUnitario": 150 },
    { "descricao": "Pacote Ajustes", "quantidade": 1, "valorUnitario": 500, "percentualDesconto": 10 }
  ]
}
```

## Testes Automatizados
Arquivo: `src/faturamento-criar-fatura.spec.ts`
Casos cobertos:
- Item com desconto em valor
- Item com desconto percentual
- Combinação valor + percentual
- Soma multi-itens

## Boas Práticas
- Evitar enviar `valorTotal` dos itens do frontend (calculado no backend)
- Validar que pelo menos 1 item está presente
- Usar `FormaPagamento` apenas quando já definido (senão manter null)

## Próximos Passos Sugestivos
- Adicionar endpoint de pré-cálculo (simulação)
- Suporte a impostos linha-item
- Histórico de ajustes em fatura

