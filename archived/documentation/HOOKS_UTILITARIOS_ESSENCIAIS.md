# 🔧 Hooks e Utilitários Essenciais - ConectCRM

## 🎯 Hooks Customizados para Reutilização

### 🔍 Hook useDebounce (OBRIGATÓRIO)

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

**Uso:**

```typescript
const [termoBusca, setTermoBusca] = useState("");
const [termoBuscaDebounced] = useDebounce(termoBusca, 300);

// Usar termoBuscaDebounced nas buscas
```

### 🔄 Hook useEntidade (Template)

```typescript
// src/hooks/useEntidade.ts
import { useState, useEffect, useCallback } from "react";

interface UseEntidadeProps {
  endpoint: string;
  filtrosIniciais?: any;
}

export const useEntidade = <T, F>({
  endpoint,
  filtrosIniciais,
}: UseEntidadeProps) => {
  const [dados, setDados] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<F>(filtrosIniciais || {});
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada à API
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filtros, pagina }),
      });

      if (!response.ok) throw new Error("Erro ao carregar dados");

      const resultado = await response.json();
      setDados(resultado.dados);
      setTotal(resultado.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [endpoint, filtros, pagina]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarItem = useCallback(
    async (novoItem: Partial<T>) => {
      try {
        // TODO: Implementar criação
        const response = await fetch(`/api/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoItem),
        });

        if (!response.ok) throw new Error("Erro ao criar item");

        await carregarDados();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar item");
        return false;
      }
    },
    [endpoint, carregarDados]
  );

  const atualizarItem = useCallback(
    async (id: string, dadosAtualizados: Partial<T>) => {
      try {
        // TODO: Implementar atualização
        const response = await fetch(`/api/${endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosAtualizados),
        });

        if (!response.ok) throw new Error("Erro ao atualizar item");

        await carregarDados();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar item");
        return false;
      }
    },
    [endpoint, carregarDados]
  );

  const excluirItem = useCallback(
    async (id: string) => {
      try {
        // TODO: Implementar exclusão
        const response = await fetch(`/api/${endpoint}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Erro ao excluir item");

        await carregarDados();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao excluir item");
        return false;
      }
    },
    [endpoint, carregarDados]
  );

  return {
    dados,
    loading,
    error,
    filtros,
    setFiltros,
    total,
    pagina,
    setPagina,
    carregarDados,
    criarItem,
    atualizarItem,
    excluirItem,
  };
};
```

### 📋 Hook useFormulario (Para Modais)

```typescript
// src/hooks/useFormulario.ts
import { useState, useCallback } from "react";

interface UseFormularioProps<T> {
  dadosIniciais: T;
  validarFuncao: (dados: T) => Record<string, string>;
  aoSalvar: (dados: T) => Promise<boolean>;
}

export const useFormulario = <T>({
  dadosIniciais,
  validarFuncao,
  aoSalvar,
}: UseFormularioProps<T>) => {
  const [formData, setFormData] = useState<T>(dadosIniciais);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);

  const atualizarCampo = useCallback(
    (campo: keyof T, valor: any) => {
      setFormData((prev) => ({
        ...prev,
        [campo]: valor,
      }));

      // Limpar erro do campo
      if (errors[campo as string]) {
        setErrors((prev) => ({
          ...prev,
          [campo as string]: "",
        }));
      }
    },
    [errors]
  );

  const validarFormulario = useCallback(() => {
    const novosErros = validarFuncao(formData);
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [formData, validarFuncao]);

  const salvar = useCallback(async () => {
    if (!validarFormulario()) return false;

    try {
      setLoading(true);
      const sucesso = await aoSalvar(formData);
      return sucesso;
    } catch (err) {
      console.error("Erro ao salvar:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, validarFormulario, aoSalvar]);

  const resetar = useCallback(() => {
    setFormData(dadosIniciais);
    setErrors({});
    setEtapaAtual(0);
  }, [dadosIniciais]);

  return {
    formData,
    errors,
    loading,
    etapaAtual,
    setEtapaAtual,
    atualizarCampo,
    validarFormulario,
    salvar,
    resetar,
  };
};
```

---

## 🛠️ Utilitários de Formatação

### 💰 Formatação Monetária (COPIAR E COLAR)

```typescript
// src/utils/formatacao.ts

/**
 * Formata um número para o formato de moeda brasileira
 * @param valor - Número a ser formatado
 * @returns Valor formatado (ex: "1.234,56")
 */
export const formatarMoedaInput = (valor: number | string): string => {
  if (valor === "" || valor === 0 || valor === null || valor === undefined)
    return "";

  const numero = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(numero)) return "";

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Converte string formatada brasileira para número
 * @param valorFormatado - String formatada (ex: "1.234,56")
 * @returns Número decimal
 */
export const parsearMoedaInput = (valorFormatado: string): number => {
  if (!valorFormatado) return 0;

  const apenasNumeros = valorFormatado.replace(/[^\d,.-]/g, "");
  if (!apenasNumeros) return 0;

  const valorAmericano = apenasNumeros.replace(/\./g, "").replace(",", ".");
  const numero = parseFloat(valorAmericano);
  return isNaN(numero) ? 0 : numero;
};

/**
 * Formata um número para exibição como moeda com R$
 * @param valor - Número a ser formatado
 * @returns Valor formatado com símbolo (ex: "R$ 1.234,56")
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

/**
 * Formata porcentagem
 * @param valor - Número a ser formatado (0.15 = 15%)
 * @returns Valor formatado (ex: "15,00%")
 */
export const formatarPorcentagem = (valor: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};
```

### 📅 Formatação de Datas

```typescript
// src/utils/datas.ts

/**
 * Formata data para formato brasileiro
 * @param data - String ISO ou objeto Date
 * @returns Data formatada (ex: "15/01/2024")
 */
export const formatarData = (data: string | Date): string => {
  return new Date(data).toLocaleDateString("pt-BR");
};

/**
 * Formata data e hora para formato brasileiro
 * @param data - String ISO ou objeto Date
 * @returns Data e hora formatada (ex: "15/01/2024 14:30")
 */
export const formatarDataHora = (data: string | Date): string => {
  return new Date(data).toLocaleString("pt-BR");
};

/**
 * Converte data brasileira para ISO
 * @param dataBrasileira - Data no formato DD/MM/AAAA
 * @returns Data no formato ISO
 */
export const converterDataBrasileiraParaISO = (
  dataBrasileira: string
): string => {
  const [dia, mes, ano] = dataBrasileira.split("/");
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
};

/**
 * Verifica se uma data está vencida
 * @param dataVencimento - Data de vencimento
 * @returns true se estiver vencida
 */
export const estaVencida = (dataVencimento: string | Date): boolean => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento < hoje;
};

/**
 * Verifica se uma data vence hoje
 * @param dataVencimento - Data de vencimento
 * @returns true se vence hoje
 */
export const venceHoje = (dataVencimento: string | Date): boolean => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  return hoje.toDateString() === vencimento.toDateString();
};
```

### 🔤 Validações

```typescript
// src/utils/validacoes.ts

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns true se válido
 */
export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida CPF
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se válido
 */
export const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
};

/**
 * Valida CNPJ
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se válido
 */
export const validarCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (cnpj: string, posicoes: number[]) => {
    let soma = 0;
    for (let i = 0; i < posicoes.length; i++) {
      soma += parseInt(cnpj.charAt(i)) * posicoes[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const posicoes1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const posicoes2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1 = calcularDigito(cnpj, posicoes1);
  const digito2 = calcularDigito(cnpj, posicoes2);

  return (
    digito1 === parseInt(cnpj.charAt(12)) &&
    digito2 === parseInt(cnpj.charAt(13))
  );
};

/**
 * Formatar CPF
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (ex: "123.456.789-01")
 */
export const formatarCPF = (cpf: string): string => {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Formatar CNPJ
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (ex: "12.345.678/0001-90")
 */
export const formatarCNPJ = (cnpj: string): string => {
  cnpj = cnpj.replace(/[^\d]/g, "");
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};
```

---

## 🎨 Componentes Utilitários

### 🔄 LoadingSpinner

```typescript
// src/components/common/LoadingSpinner.tsx
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "white" | "gray";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  text,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-32 w-32",
  };

  const colorClasses = {
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};
```

### 📄 EmptyState

```typescript
// src/components/common/EmptyState.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acaoPrimaria?: {
    texto: string;
    onClick: () => void;
  };
  acaoSecundaria?: {
    texto: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  titulo,
  descricao,
  acaoPrimaria,
  acaoSecundaria,
}) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
        <Icon size={96} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{titulo}</h3>
      {descricao && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{descricao}</p>
      )}
      <div className="flex justify-center gap-3">
        {acaoPrimaria && (
          <button
            onClick={acaoPrimaria.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {acaoPrimaria.texto}
          </button>
        )}
        {acaoSecundaria && (
          <button
            onClick={acaoSecundaria.onClick}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {acaoSecundaria.texto}
          </button>
        )}
      </div>
    </div>
  );
};
```

### 🎯 CardResumo

```typescript
// src/components/common/CardResumo.tsx
import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface CardResumoProps {
  titulo: string;
  valor: string | number;
  quantidade?: number;
  icone: LucideIcon;
  cor: "blue" | "green" | "red" | "orange" | "purple";
  trend?: {
    valor: number;
    tipo: "aumento" | "reducao";
  };
}

export const CardResumo: React.FC<CardResumoProps> = ({
  titulo,
  valor,
  quantidade,
  icone: Icone,
  cor,
  trend,
}) => {
  const coresConfig = {
    blue: {
      texto: "text-blue-600",
      fundo: "bg-blue-100",
    },
    green: {
      texto: "text-green-600",
      fundo: "bg-green-100",
    },
    red: {
      texto: "text-red-600",
      fundo: "bg-red-100",
    },
    orange: {
      texto: "text-orange-600",
      fundo: "bg-orange-100",
    },
    purple: {
      texto: "text-purple-600",
      fundo: "bg-purple-100",
    },
  };

  const config = coresConfig[cor];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{titulo}</p>
          <p className={`text-2xl font-bold ${config.texto}`}>{valor}</p>

          <div className="flex items-center gap-4 mt-1">
            {quantidade !== undefined && (
              <p className="text-xs text-gray-500">
                {quantidade} item{quantidade !== 1 ? "s" : ""}
              </p>
            )}

            {trend && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  trend.tipo === "aumento" ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.tipo === "aumento" ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                <span>{Math.abs(trend.valor)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className={`p-3 ${config.fundo} rounded-full`}>
          <Icone className={`h-6 w-6 ${config.texto}`} />
        </div>
      </div>
    </div>
  );
};
```

---

## 📦 Como Usar os Utilitários

### 🚀 Exemplo de Implementação Completa

```typescript
// src/pages/exemplo/ExemploPage.tsx
import React from "react";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

// Hooks personalizados
import { useDebounce } from "../../hooks/useDebounce";
import { useEntidade } from "../../hooks/useEntidade";
import { useFormulario } from "../../hooks/useFormulario";

// Utilitários
import { formatarMoeda, formatarMoedaInput } from "../../utils/formatacao";
import { formatarData, estaVencida } from "../../utils/datas";
import { validarEmail, validarCPF } from "../../utils/validacoes";

// Componentes
import { CardResumo } from "../../components/common/CardResumo";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";

const ExemploPage: React.FC = () => {
  // Busca com debounce
  const [termoBusca, setTermoBusca] = useState("");
  const termoBuscaDebounced = useDebounce(termoBusca, 300);

  // Gerenciamento de entidade
  const { dados, loading, error, criarItem, atualizarItem, excluirItem } =
    useEntidade<MinhaEntidade, FiltrosEntidade>({
      endpoint: "minha-entidade",
      filtrosIniciais: {},
    });

  // Formulário
  const { formData, errors, atualizarCampo, salvar, resetar } = useFormulario({
    dadosIniciais: { nome: "", valor: 0, email: "" },
    validarFuncao: (dados) => {
      const erros: Record<string, string> = {};

      if (!dados.nome.trim()) {
        erros.nome = "Nome é obrigatório";
      }

      if (!dados.valor || dados.valor <= 0) {
        erros.valor = "Valor deve ser maior que zero";
      }

      if (dados.email && !validarEmail(dados.email)) {
        erros.email = "Email inválido";
      }

      return erros;
    },
    aoSalvar: async (dados) => {
      return await criarItem(dados);
    },
  });

  // Handler para campos monetários
  const handleMoneyChange = (campo: string, valor: string) => {
    const valorNumerico = valor === "" ? 0 : parsearMoedaInput(valor);
    atualizarCampo(campo, valorNumerico);
  };

  if (loading) return <LoadingSpinner size="lg" text="Carregando dados..." />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CardResumo
          titulo="Total Geral"
          valor={formatarMoeda(125000)}
          quantidade={45}
          icone={DollarSign}
          cor="blue"
          trend={{ valor: 12.5, tipo: "aumento" }}
        />

        <CardResumo
          titulo="Usuários Ativos"
          valor="1.234"
          icone={Users}
          cor="green"
        />

        <CardResumo
          titulo="Vencimentos Hoje"
          valor={formatarMoeda(8500)}
          quantidade={3}
          icone={Calendar}
          cor="orange"
        />

        <CardResumo
          titulo="Performance"
          valor="94,2%"
          icone={TrendingUp}
          cor="purple"
          trend={{ valor: 3.1, tipo: "aumento" }}
        />
      </div>

      {/* Estado vazio */}
      {dados.length === 0 && (
        <EmptyState
          icon={DollarSign}
          titulo="Nenhum registro encontrado"
          descricao="Comece criando seu primeiro item para começar a usar o sistema."
          acaoPrimaria={{
            texto: "Criar Primeiro Item",
            onClick: () => console.log("Criar item"),
          }}
        />
      )}

      {/* Exemplo de formulário com formatação */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Exemplo de Formulário</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Monetário *
            </label>
            <input
              type="text"
              value={
                formData.valor === 0 ? "" : formatarMoedaInput(formData.valor)
              }
              onChange={(e) => handleMoneyChange("valor", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0,00"
            />
            {errors.valor && (
              <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => atualizarCampo("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={salvar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salvar
          </button>
          <button
            onClick={resetar}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExemploPage;
```

---

## 📋 Checklist de Uso

### ✅ Antes de Usar

- [ ] Instalar dependências necessárias
- [ ] Criar hooks personalizados na pasta `src/hooks/`
- [ ] Criar utilitários na pasta `src/utils/`
- [ ] Criar componentes comuns na pasta `src/components/common/`

### ✅ Durante o Desenvolvimento

- [ ] Usar `useDebounce` para buscas
- [ ] Usar `useEntidade` para gerenciamento de dados
- [ ] Usar `useFormulario` para modais complexos
- [ ] Aplicar formatações brasileiras
- [ ] Implementar validações adequadas

### ✅ Componentes Obrigatórios

- [ ] `CardResumo` para métricas
- [ ] `LoadingSpinner` para carregamentos
- [ ] `EmptyState` para estados vazios
- [ ] Formatação monetária em todos os campos de valor

---

_📚 Estes utilitários devem ser reutilizados em todas as telas para garantir consistência e qualidade do código._
