# Fluxo Recomendado: Proposta Gerada Pelo Pipeline

## Decisao

- O Pipeline nao gera proposta comercial final.
- O Pipeline gera apenas um `rascunho de proposta`.
- A composicao comercial obrigatoria acontece na tela de `Propostas`.

## Motivo

- A oportunidade do Pipeline nao guarda, por padrao, os itens/produtos negociados com quantidade e preco.
- Sem esses itens, a proposta criada a partir da oportunidade tem apenas cabecalho comercial:
  - titulo
  - cliente
  - valor total
  - observacoes de origem

## Regra de UX

1. No Pipeline, a acao deve ser exibida como `Criar rascunho de proposta`.
2. Apos criar o rascunho, o sistema deve abrir a proposta em modo de edicao.
3. Se o rascunho nao tiver itens, a tela deve orientar o usuario a completar os produtos/servicos.
4. O usuario pode editar rascunhos diretamente pela tela de Propostas.

## Regra de Negocio

1. Proposta sem itens nao pode ser:
   - enviada ao cliente
   - aprovada
   - usada para gerar PDF final
2. O backend deve validar essa regra, mesmo se a chamada nao vier da interface.
3. O frontend deve impedir o fluxo e orientar o usuario a adicionar itens reais.

## Resultado Esperado

- Pipeline continua sendo a origem da negociacao.
- Propostas continua sendo a origem da composicao comercial.
- O sistema deixa de produzir proposta "aparentemente pronta" sem itens reais.
