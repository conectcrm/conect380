# Templates de Propostas Comerciais

Este módulo fornece templates profissionais para geração de propostas comerciais em PDF.

## 🎯 Funcionalidades

- **Template Comercial Completo**: Template detalhado com todas as seções necessárias
- **Template Simples**: Template minimalista para propostas rápidas
- **Geração de PDF**: Conversão automática para PDF usando Puppeteer
- **Campos de Assinatura**: Espaços dedicados para assinatura do cliente e vendedor
- **Responsivo**: Adaptável para impressão e visualização digital

## 📋 Templates Disponíveis

### 1. Proposta Comercial Completa (`proposta-comercial.html`)
- Cabeçalho com logo e informações da empresa
- Seção de título destacada
- Dados completos do cliente e vendedor
- Tabela detalhada de produtos/serviços
- Resumo financeiro com cálculos
- Condições comerciais organizadas
- Lista de condições gerais
- Área de assinaturas profissional
- Status visual da proposta

### 2. Proposta Simples (`proposta-simples.html`)
- Layout limpo e minimalista
- Informações essenciais apenas
- Ideal para propostas rápidas
- Menos seções, mais direto

## 🔧 Como Usar

### 1. Via API (Recomendado)

```typescript
import { pdfPropostasService } from './services/pdfPropostasService';

// Gerar PDF
await pdfPropostasService.downloadPdf('comercial', dadosProposta);

// Visualizar HTML
const html = await pdfPropostasService.previewHtml('comercial', dadosProposta);
```

### 2. Teste Local

```bash
cd backend/src/templates/pdf
node testar-template.js
```

### 3. Via Interface Web

Acesse `/propostas/templates` no frontend para usar a interface visual.

## 📄 Estrutura de Dados

```typescript
interface DadosProposta {
  numeroProposta?: string;
  titulo: string;
  descricao?: string;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
  dataEmissao?: string;
  dataValidade?: string;
  
  empresa?: {
    nome: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    telefone?: string;
    email?: string;
    cnpj?: string;
    logo?: string; // URL da imagem
  };
  
  cliente: {
    nome: string;
    empresa?: string;
    email: string;
    telefone?: string;
    documento?: string;
    tipoDocumento?: string;
    endereco?: string;
  };
  
  vendedor: {
    nome: string;
    email: string;
    telefone?: string;
    cargo?: string;
  };
  
  itens: Array<{
    nome: string;
    descricao?: string;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
    valorTotal: number;
  }>;
  
  subtotal?: number;
  descontoGeral?: number;
  percentualDesconto?: number;
  impostos?: number;
  valorTotal: number;
  
  formaPagamento: string;
  prazoEntrega: string;
  garantia?: string;
  validadeProposta?: string;
  
  condicoesGerais?: string[];
  observacoes?: string;
}
```

## 🎨 Personalização

### Cores
- Cor principal: `#159A9C` (Conect CRM)
- Cor secundária: `#127577`
- Cinzas: `#333`, `#666`, `#999`

### Fontes
- Principal: Arial, sans-serif
- Tamanhos: 12px-28px conforme hierarquia

### Layout
- Largura máxima: 210mm (A4)
- Margem padrão: 20px
- Breakpoints responsivos incluídos

## 📝 Campos de Assinatura

Ambos os templates incluem:
- Espaço dedicado para assinatura do cliente
- Espaço dedicado para assinatura do vendedor
- Campos para data de assinatura
- Informações de identificação automáticas

## 🚀 Endpoints da API

```
GET  /propostas/pdf/templates          # Lista templates disponíveis
POST /propostas/pdf/gerar/:tipo        # Gera PDF (retorna blob)
POST /propostas/pdf/preview/:tipo      # Gera HTML para preview
```

## 🔍 Exemplo de Uso Completo

```typescript
const dados = {
  numeroProposta: "2025001",
  titulo: "Sistema de Gestão",
  cliente: {
    nome: "João Silva",
    email: "joao@empresa.com",
    telefone: "(11) 99999-9999"
  },
  vendedor: {
    nome: "Maria Santos",
    email: "maria@conectcrm.com"
  },
  itens: [
    {
      nome: "Módulo Vendas",
      quantidade: 1,
      valorUnitario: 5000,
      valorTotal: 5000
    }
  ],
  valorTotal: 5000,
  formaPagamento: "À vista",
  prazoEntrega: "30 dias"
};

// Baixar PDF
await pdfPropostasService.downloadPdf('comercial', dados);
```

## 📦 Dependências

- `handlebars`: Template engine
- `puppeteer`: Geração de PDF
- `@types/handlebars`: Tipos TypeScript
- `@types/puppeteer`: Tipos TypeScript

## 🛠️ Desenvolvimento

Para adicionar novos templates:

1. Crie o arquivo HTML em `src/templates/pdf/`
2. Use a sintaxe do Handlebars para variáveis
3. Teste com `node testar-template.js`
4. Adicione o template no `PdfService`
5. Atualize a lista de templates no controller

## 📄 Licença

Este módulo faz parte do Conect CRM e segue a mesma licença do projeto principal.
