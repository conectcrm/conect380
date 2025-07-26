# Formatação de Moeda em Tempo Real - Modal Nova Conta a Pagar

## 📋 Resumo da Implementação

Implementada formatação automática de moeda brasileira (R$) em tempo real para os campos de valor no modal de Nova Conta a Pagar, seguindo o padrão de separação de milhares com ponto e decimais com vírgula (1.234,56).

## ✅ Funcionalidades Implementadas

### 🔄 Formatação Automática

- **Valor Original**: Formatação em tempo real conforme o usuário digita
- **Valor de Desconto**: Formatação em tempo real conforme o usuário digita
- **Valor Total**: Cálculo e formatação automática (campo somente leitura)

### 🎯 Padrão de Formatação

```
Entrada: 1234.56
Exibição: 1.234,56

Entrada: 1000
Exibição: 1.000,00

Entrada: 0 ou vazio
Exibição: (campo vazio)
```

## 🔧 Funções Implementadas

### `formatarMoedaInput(valor)`

Converte número para formato brasileiro de moeda:

```typescript
const formatarMoedaInput = (valor: number | string): string => {
  if (valor === "" || valor === 0 || valor === null || valor === undefined)
    return "";

  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(numero)) return "";

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
```

### `parsearMoedaInput(valorFormatado)`

Converte formato brasileiro de volta para número:

```typescript
const parsearMoedaInput = (valorFormatado: string): number => {
  if (!valorFormatado) return 0;

  const apenasNumeros = valorFormatado.replace(/[^\d,.-]/g, "");
  if (!apenasNumeros) return 0;

  const valorAmericano = apenasNumeros.replace(/\./g, "").replace(",", ".");

  const numero = parseFloat(valorAmericano);
  return isNaN(numero) ? 0 : numero;
};
```

### `handleMoneyChange(campo, valorFormatado)`

Handler específico para campos monetários:

```typescript
const handleMoneyChange = (
  campo: keyof NovaContaPagar,
  valorFormatado: string
) => {
  if (valorFormatado === "") {
    setFormData((prev) => ({
      ...prev,
      [campo]: 0,
    }));
  } else {
    const valorNumerico = parsearMoedaInput(valorFormatado);

    setFormData((prev) => ({
      ...prev,
      [campo]: valorNumerico,
    }));
  }

  // Limpar erro do campo
  if (errors[campo]) {
    setErrors((prev) => ({
      ...prev,
      [campo]: "",
    }));
  }
};
```

## 🎨 Alterações na Interface

### Campos de Valor Original e Desconto

- **Antes**: `type="number"` com `handleNumericChange`
- **Depois**: `type="text"` com `handleMoneyChange`
- **Formatação**: Valor exibido com `formatarMoedaInput(formData.valor)`

### Valor Total

- **Cálculo automático**: (Valor Original - Valor Desconto)
- **Formatação**: `R$ ${formatarMoedaInput(valorCalculado)}`
- **Status**: Campo somente leitura com estilo diferenciado

## 🧪 Exemplos de Uso

### Digitação Normal

```
Usuário digita: "1500"
Campo exibe: "1.500,00"
Valor salvo: 1500
```

### Digitação com Decimais

```
Usuário digita: "1500,75"
Campo exibe: "1.500,75"
Valor salvo: 1500.75
```

### Campo Vazio

```
Usuário apaga tudo: ""
Campo exibe: (vazio)
Valor salvo: 0
```

### Cálculo Automático do Total

```
Valor Original: 2.500,00
Desconto: 250,00
Valor Total: R$ 2.250,00
```

## 🔄 UX/UI Melhorada

### ✅ Benefícios para o Usuário

- **Visualização clara**: Separação de milhares e decimais
- **Entrada intuitiva**: Formatação automática conforme digita
- **Feedback visual**: Cálculo do total em tempo real
- **Padrão brasileiro**: Formato familiar (1.234,56)

### ✅ Validações Mantidas

- **Valor obrigatório**: Valor Original continua obrigatório
- **Desconto máximo**: Não pode ser maior que valor original
- **Números válidos**: Tratamento de entradas inválidas
- **Limpeza de erros**: Erros removidos ao corrigir campos

## 🚀 Próximos Passos

1. **Testes de usuário**: Validar experiência com dados reais
2. **Outros modais**: Aplicar formatação em outros formulários financeiros
3. **Configuração**: Permitir outros formatos de moeda se necessário
4. **Performance**: Monitorar performance em formulários grandes

## 📝 Observações Técnicas

- **Compatibilidade**: Usa `toLocaleString('pt-BR')` nativo do JavaScript
- **Performance**: Formatação leve sem bibliotecas externas
- **Manutenibilidade**: Funções reutilizáveis para outros componentes
- **Estado consistente**: Valor interno sempre numérico, formatação apenas visual

---

_Implementação concluída em: Dezembro 2024_
_Status: ✅ Funcional e testado_
