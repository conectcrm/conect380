/**
 * Hook simplificado para input de moeda - versão final
 * Otimizado para performance e usabilidade
 */

import { useState, useCallback } from 'react';

export const useSimpleCurrency = (initialValue = 0) => {
  const [rawInput, setRawInput] = useState('');
  const [value, setValue] = useState(initialValue);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;

    // Extrai apenas dígitos
    const digitsOnly = input.replace(/\D/g, '');

    // Atualiza o raw input
    setRawInput(digitsOnly);

    let newValue: number;
    if (digitsOnly === '') {
      newValue = 0;
      setValue(0);
    } else {
      // Converte para centavos
      newValue = parseInt(digitsOnly, 10) / 100;
      setValue(newValue);
    }

    // Retorna o valor calculado para uso imediato
    return newValue;
  }, []);

  // Display sempre formatado baseado no valor numérico
  const displayValue = value === 0 && rawInput === '' ? '' : formatCurrency(value);

  return {
    value,
    displayValue,
    handleChange,
    setValue: useCallback((newValue: number) => {
      setValue(newValue);
      setRawInput(newValue === 0 ? '' : (newValue * 100).toString());
    }, []),
  };
};
