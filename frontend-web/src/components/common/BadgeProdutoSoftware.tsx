/**
 * Badge para identificar produtos de software
 * Facilita a identificação visual de diferentes tipos de produto
 */
import React from 'react';
import { Monitor, Package, Wrench, Smartphone, Shield } from 'lucide-react';

interface BadgeProdutoSoftwareProps {
  tipoItem: string;
  tamanho?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface TipoConfig {
  icon: React.ElementType;
  label: string;
  cor: string;
  corFundo: string;
  descricao: string;
}

const TIPOS_CONFIGURACAO: Record<string, TipoConfig> = {
  produto: {
    icon: Package,
    label: 'Produto',
    cor: 'text-gray-600',
    corFundo: 'bg-gray-100',
    descricao: 'Produto físico'
  },
  servico: {
    icon: Wrench,
    label: 'Serviço',
    cor: 'text-blue-600',
    corFundo: 'bg-blue-100',
    descricao: 'Serviço prestado'
  },
  licenca: {
    icon: Shield,
    label: 'Licença',
    cor: 'text-purple-600',
    corFundo: 'bg-purple-100',
    descricao: 'Software - Licença'
  },
  modulo: {
    icon: Monitor,
    label: 'Módulo',
    cor: 'text-indigo-600',
    corFundo: 'bg-indigo-100',
    descricao: 'Software - Módulo'
  },
  aplicativo: {
    icon: Smartphone,
    label: 'Aplicativo',
    cor: 'text-green-600',
    corFundo: 'bg-green-100',
    descricao: 'Software - Aplicativo'
  }
};

const TAMANHOS = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    gap: 'gap-1'
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-1.5'
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    gap: 'gap-2'
  }
};

export const BadgeProdutoSoftware: React.FC<BadgeProdutoSoftwareProps> = ({
  tipoItem,
  tamanho = 'md',
  showLabel = true
}) => {
  const config = TIPOS_CONFIGURACAO[tipoItem] || TIPOS_CONFIGURACAO.produto;
  const tamanhoConfig = TAMANHOS[tamanho];
  const IconComponent = config.icon;

  // Verificar se é produto de software
  const isSoftware = ['licenca', 'modulo', 'aplicativo'].includes(tipoItem);

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${tamanhoConfig.badge} ${tamanhoConfig.gap}
        ${config.cor} ${config.corFundo}
        ${isSoftware ? 'ring-2 ring-offset-1 ring-purple-200' : ''}
      `}
      title={config.descricao}
    >
      <IconComponent className={tamanhoConfig.icon} />
      {showLabel && (
        <span>{config.label}</span>
      )}
      {isSoftware && (
        <span className="ml-1 text-xs bg-purple-200 text-purple-700 px-1 rounded">
          SW
        </span>
      )}
    </span>
  );
};

// Hook para obter informações de tipo de produto
export const useTipoProdutoInfo = (tipoItem: string) => {
  const config = TIPOS_CONFIGURACAO[tipoItem] || TIPOS_CONFIGURACAO.produto;
  const isSoftware = ['licenca', 'modulo', 'aplicativo'].includes(tipoItem);
  
  return {
    ...config,
    isSoftware,
    categoria: isSoftware ? 'Software' : 'Físico'
  };
};

// Componente para lista de produtos com badges
interface ListaProdutosBadgesProps {
  produtos: Array<{
    id: string;
    nome: string;
    tipoItem: string;
    precoUnitario?: number;
    tipoLicenciamento?: string;
    periodicidadeLicenca?: string;
  }>;
  onProdutoClick?: (produto: any) => void;
}

// Componente separado para cada item da lista
interface ItemProdutoProps {
  produto: {
    id: string;
    nome: string;
    tipoItem: string;
    precoUnitario?: number;
    tipoLicenciamento?: string;
    periodicidadeLicenca?: string;
  };
  onProdutoClick?: (produto: any) => void;
}

const ItemProduto: React.FC<ItemProdutoProps> = ({ produto, onProdutoClick }) => {
  const { isSoftware } = useTipoProdutoInfo(produto.tipoItem);
  
  return (
    <div
      key={produto.id}
      onClick={() => onProdutoClick?.(produto)}
      className={`
        p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
        ${isSoftware ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BadgeProdutoSoftware tipoItem={produto.tipoItem} />
          <div>
            <h4 className="font-medium text-gray-900">{produto.nome}</h4>
            {isSoftware && produto.tipoLicenciamento && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                  {produto.tipoLicenciamento}
                </span>
                {produto.periodicidadeLicenca && (
                  <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                    {produto.periodicidadeLicenca}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {produto.precoUnitario && (
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              R$ {produto.precoUnitario.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            {isSoftware && produto.periodicidadeLicenca && (
              <p className="text-xs text-gray-500">
                por {produto.periodicidadeLicenca}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ListaProdutosBadges: React.FC<ListaProdutosBadgesProps> = ({
  produtos,
  onProdutoClick
}) => {
  return (
    <div className="space-y-2">
      {produtos.map((produto) => (
        <ItemProduto
          key={produto.id}
          produto={produto}
          onProdutoClick={onProdutoClick}
        />
      ))}
    </div>
  );
};
