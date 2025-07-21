# Sistema de Cadastro de Produtos Personalizável

Um sistema avançado de cadastro de produtos que se adapta automaticamente a diferentes segmentos de negócio, permitindo configurações flexíveis e campos dinâmicos.

## 🚀 Características Principais

- **Configuração por Segmento**: Cada tipo de negócio tem suas próprias configurações
- **Campos Dinâmicos**: Adicione campos específicos baseados no tipo de produto
- **Precificação Flexível**: Suporte a diferentes modelos de precificação
- **Interface Responsiva**: Funciona perfeitamente em dispositivos móveis e desktop
- **Validação Inteligente**: Validações que se adaptam ao contexto do produto

## 📋 Segmentos Suportados

### 1. Agropecuário
**Ideal para**: Empresas que vendem sistemas para fazendas, criação de gado, agricultura

**Tipos de Produto:**
- **Plano de Sistema Completo**: Planos com múltiplos módulos
- **Módulo Individual**: Funcionalidades específicas
- **Licença de Aplicativo**: Apps móveis e web
- **Serviço de Consultoria**: Implementação e treinamento

**Módulos Disponíveis:**
- Gestão de Gado, Confinamento, Reprodução
- Sanidade Animal, Agricultura, Financeiro Rural
- Estoque e Insumos, Relatórios Técnicos
- Integração Balanças, Rastreabilidade

**Licenças Disponíveis:**
- MB Task (Aplicativo de Campo)
- MB Curral (Manejo de Gado)
- Portal Web Completo
- Apps Mobile (Proprietário/Funcionário)

### 2. Software/SaaS
**Ideal para**: Empresas de tecnologia que vendem software como serviço

**Tipos de Produto:**
- **Plano SaaS**: Assinaturas com recursos escalonáveis
- **Add-on/Plugin**: Extensões e funcionalidades extras
- **Licença Enterprise**: Soluções corporativas

### 3. E-commerce
**Ideal para**: Lojas virtuais e marketplace

**Tipos de Produto:**
- **Produto Físico**: Itens com estoque e logística
- **Produto Digital**: Downloads, cursos, e-books

### 4. Serviços Profissionais
**Ideal para**: Consultorias e prestadores de serviço

**Tipos de Produto:**
- **Consultoria**: Projetos de consultoria especializada
- **Treinamento**: Cursos e capacitação corporativa

## 🛠️ Como Usar

### Instalação Básica

```tsx
import { ModalCadastroProdutoAvancado } from '@/components/modals/ModalCadastroProdutoAvancado';
import { useSegmentoConfig } from '@/hooks/useSegmentoConfig';

// Em seu componente
const { configuracaoAtiva } = useSegmentoConfig('agropecuario');

<ModalCadastroProdutoAvancado
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSave={handleSaveProduto}
  segmentoConfig={configuracaoAtiva}
/>
```

### Exemplo Completo

```tsx
import React, { useState } from 'react';
import { ModalCadastroProdutoAvancado } from '@/components/modals/ModalCadastroProdutoAvancado';
import { useSegmentoConfig } from '@/hooks/useSegmentoConfig';

export const MeuComponente = () => {
  const [showModal, setShowModal] = useState(false);
  const [produto, setProduto] = useState(null);
  
  // Configurar segmento (agropecuario, software_saas, ecommerce, servicos_profissionais)
  const { configuracaoAtiva, setSegmentoAtivo } = useSegmentoConfig('agropecuario');
  
  const handleSaveProduto = async (data) => {
    try {
      // Sua lógica de salvamento aqui
      if (produto) {
        await produtoService.update(produto.id, data);
      } else {
        await produtoService.create(data);
      }
      
      // Fechar modal após sucesso
      setShowModal(false);
    } catch (error) {
      throw error; // Modal irá tratar o erro
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Novo Produto
      </button>
      
      <ModalCadastroProdutoAvancado
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveProduto}
        produto={produto}
        segmentoConfig={configuracaoAtiva}
      />
    </>
  );
};
```

## 🎯 Casos de Uso Reais

### Cliente de Sistema Agropecuário

```tsx
// Configuração para cliente que vende sistema agropecuário
const { configuracaoAtiva } = useSegmentoConfig('agropecuario');

// Produto: Plano Professional
{
  nome: 'Plano Professional Agro',
  tipoProduto: 'plano_sistema',
  categoria: 'gestao_pecuaria',
  tipoPreco: 'fixo',
  precoBase: 299.99,
  modulos: [
    { nome: 'Gestão de Gado', incluido: true, quantidade: 1 },
    { nome: 'Reprodução', incluido: true, quantidade: 1 },
    { nome: 'Financeiro Rural', incluido: false, quantidade: 0 }
  ],
  licencas: [
    { nome: 'Portal Web Completo', tipo: 'web', quantidade: 5 },
    { nome: 'MB Task', tipo: 'mobile', quantidade: 2 }
  ],
  configuracoes: {
    periodo_contrato: 'Anual',
    numero_usuarios: 5,
    numero_propriedades: 1,
    limite_animais: 10000,
    suporte_incluso: 'WhatsApp'
  }
}
```

### Cliente de Software SaaS

```tsx
// Configuração para empresa de CRM
const { configuracaoAtiva } = useSegmentoConfig('software_saas');

// Produto: Plano Enterprise
{
  nome: 'CRM Enterprise',
  tipoProduto: 'plano_saas',
  categoria: 'crm',
  tipoPreco: 'por_usuario',
  precoBase: 99.99,
  configuracoes: {
    limite_usuarios: 100,
    armazenamento_gb: 500,
    api_calls_mes: 50000,
    backup_incluido: true
  }
}
```

## 🔧 Personalização

### Criando Novos Segmentos

```tsx
import { useSegmentoConfig } from '@/hooks/useSegmentoConfig';

const { criarConfiguracaoPersonalizada } = useSegmentoConfig();

// Criar segmento personalizado
criarConfiguracaoPersonalizada({
  id: 'meu_segmento',
  nome: 'Meu Segmento Personalizado',
  descricao: 'Descrição do segmento',
  tiposProduto: [
    {
      value: 'produto_customizado',
      label: 'Produto Customizado',
      icon: Package,
      descricao: 'Descrição do produto',
      precificacaoPermitida: ['fixo', 'variavel'],
      campos: [
        {
          id: 'campo_especial',
          nome: 'Campo Especial',
          tipo: 'texto',
          obrigatorio: true,
          placeholder: 'Digite algo...'
        }
      ]
    }
  ],
  categorias: [
    { value: 'categoria1', label: 'Categoria 1' }
  ],
  camposPersonalizados: []
});
```

### Adicionando Campos Dinâmicos

```tsx
const { adicionarCampoPersonalizado } = useSegmentoConfig();

adicionarCampoPersonalizado({
  id: 'novo_campo',
  nome: 'Novo Campo',
  tipo: 'select',
  obrigatorio: true,
  opcoes: ['Opção 1', 'Opção 2', 'Opção 3'],
  ajuda: 'Texto de ajuda para o usuário'
});
```

## 📊 Estrutura de Dados

### ProdutoFormData

```typescript
interface ProdutoAvancadoFormData {
  // Dados básicos
  nome: string;
  codigo: string;
  categoria: string;
  tipoProduto: string;
  status: string;
  descricao?: string;
  
  // Precificação
  tipoPreco: 'fixo' | 'variavel' | 'por_modulo' | 'por_licenca' | 'customizado';
  precoBase?: number;
  precoMinimo?: number;
  precoMaximo?: number;
  
  // Configurações específicas
  modulos: ConfiguracaoModulo[];
  licencas: ConfiguracaoLicenca[];
  camposPersonalizados: CampoPersonalizado[];
  
  // Metadados
  segmento: string;
  tags: string[];
  configuracoes: Record<string, any>;
}
```

## 🎨 Componentes Inclusos

### Tabs Dinâmicas
- **Dados Básicos**: Informações fundamentais do produto
- **Configurações**: Campos específicos do tipo de produto
- **Módulos**: Gerenciamento de módulos do sistema (quando aplicável)
- **Licenças**: Configuração de licenças (quando aplicável)
- **Campos Extras**: Campos personalizados do segmento

### Validação Inteligente
- Validações que mudam baseadas no tipo de produto
- Campos obrigatórios dinâmicos
- Validações customizadas por segmento

### Interface Responsiva
- Layout adaptativo para mobile, tablet e desktop
- Componentes que se reorganizam automaticamente
- Experiência otimizada para diferentes tamanhos de tela

## 🔄 Integração com Backend

### Salvamento de Produto

```tsx
const handleSaveProduto = async (data: ProdutoAvancadoFormData) => {
  try {
    const response = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Erro ao salvar');
    
    const produto = await response.json();
    return produto;
  } catch (error) {
    throw error; // Modal tratará o erro automaticamente
  }
};
```

### Carregamento de Configurações

```tsx
// Carregar configurações personalizadas do servidor
const carregarConfiguracaoPersonalizada = async (empresaId: string) => {
  const response = await fetch(`/api/empresas/${empresaId}/configuracao-produto`);
  const config = await response.json();
  
  // Aplicar configuração personalizada
  criarConfiguracaoPersonalizada(config);
};
```

## 🧪 Testando o Sistema

Execute o exemplo incluído:

```bash
# Navegue até o diretório do projeto
cd frontend-web

# Execute o exemplo
npm start

# Acesse: http://localhost:3000
# Navegue até: /examples/produto-avancado
```

## 📝 Notas Importantes

1. **Performance**: O sistema carrega apenas as configurações do segmento ativo
2. **Memória**: Configurações são cacheadas para evitar re-renderizações
3. **Extensibilidade**: Fácil adição de novos tipos de campo e validações
4. **Manutenibilidade**: Configurações centralizadas e tipadas

## 🤝 Contribuindo

Para adicionar novos segmentos ou tipos de produto:

1. Edite o arquivo `src/hooks/useSegmentoConfig.ts`
2. Adicione sua configuração em `SEGMENTOS_CONFIGURACAO`
3. Teste com o exemplo em `ExemploModalProdutoAvancado.tsx`
4. Documente as novas funcionalidades

## 📞 Suporte

Para dúvidas ou sugestões sobre o sistema de produtos personalizável, consulte a documentação completa dos componentes base ou entre em contato com a equipe de desenvolvimento.
