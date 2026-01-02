/**
 * Hook para formatação de moeda brasileira (BRL)
 * Formata valores para o padrão brasileiro: R$ 1.234,56
 *
 * Funcionalidades:
 * - Formatação automática durante digitação
 * - Separador de milhares (ponto)
 * - Separador decimal (vírgula)
 * - Símbolo da moeda (R$)
 * - Conversão para número para envio ao backend
 */

import React, { useState, useCallback, useEffect } from 'react';

interface UseCurrencyFormatReturn {
  displayValue: string;
  numericValue: number;
  formattedValue: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: number | string) => void;
  reset: () => void;
}

interface UseCurrencyFormatOptions {
  initialValue?: number;
  allowNegative?: boolean;
  maxDigits?: number;
  showSymbol?: boolean;
}

export const useCurrencyFormat = (
  options: UseCurrencyFormatOptions = {},
): UseCurrencyFormatReturn => {
  const { initialValue = 0, allowNegative = false, maxDigits = 12, showSymbol = true } = options;

  const [numericValue, setNumericValue] = useState<number>(initialValue);

  // Formata número para exibição brasileira
  const formatToBRL = useCallback(
    (value: number): string => {
      const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return showSymbol
        ? formatter.format(value)
        : formatter.format(value).replace('R$', '').trim();
    },
    [showSymbol],
  );

  // Remove formatação e converte para número
  const parseFromBRL = useCallback(
    (value: string): number => {
      // Remove todos os caracteres que não são dígitos, vírgula ou sinal negativo
      let cleaned = value.replace(/[^\d,-]/g, '');

      // Se não permitir negativo, remove o sinal
      if (!allowNegative) {
        cleaned = cleaned.replace('-', '');
      }

      // Se está vazio, retorna 0
      if (!cleaned || cleaned === '-') {
        return 0;
      }

      // Substitui vírgula por ponto para conversão
      cleaned = cleaned.replace(',', '.');

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    },
    [allowNegative],
  );

  // Formata valor durante a digitação
  const formatDuringTyping = useCallback(
    (value: string): string => {
      // Remove tudo exceto dígitos
      let digitsOnly = value.replace(/\D/g, '');

      // Limita o número de dígitos
      if (digitsOnly.length > maxDigits) {
        digitsOnly = digitsOnly.slice(0, maxDigits);
      }

      // Se vazio, retorna string vazia
      if (!digitsOnly) {
        return '';
      }

      // Converte para número considerando os centavos
      const numericValue = parseInt(digitsOnly) / 100;

      // Formata para BRL
      return formatToBRL(numericValue);
    },
    [maxDigits, formatToBRL],
  );

  // Handler para mudança no input
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // Remove tudo exceto dígitos
    const digitsOnly = inputValue.replace(/\D/g, '');

    // Se vazio, zera o valor
    if (!digitsOnly) {
      setNumericValue(0);
      return;
    }

    // Converte para número (centavos)
    const numericValue = parseInt(digitsOnly) / 100;
    setNumericValue(numericValue);
  }, []);

  // Define valor programaticamente
  const setValue = useCallback(
    (value: number | string) => {
      if (typeof value === 'string') {
        const parsed = parseFromBRL(value);
        setNumericValue(parsed);
      } else {
        setNumericValue(value);
      }
    },
    [parseFromBRL],
  );

  // Reset para valor inicial
  const reset = useCallback(() => {
    setNumericValue(initialValue);
  }, [initialValue]);

  // Valores calculados
  const displayValue = numericValue === 0 ? '' : formatToBRL(numericValue);
  const formattedValue = formatToBRL(numericValue);

  return {
    displayValue,
    numericValue,
    formattedValue,
    handleChange,
    setValue,
    reset,
  };
};

// Hook simplificado para campos de moeda
export const useMoney = (initialValue = 0) => {
  return useCurrencyFormat({
    initialValue,
    showSymbol: true,
  });
};

// Hook para valores sem símbolo de moeda
export const useNumericCurrency = (initialValue = 0) => {
  return useCurrencyFormat({
    initialValue,
    showSymbol: false,
  });
};

// Utilitários auxiliares
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
