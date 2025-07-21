import React from 'react';
import { useSimpleCurrency } from '../../hooks/useSimpleCurrency';

const TesteCurrencyInput = () => {
  const { value, displayValue, handleChange, setValue } = useSimpleCurrency(0);

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white max-w-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Teste Input Moeda</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Preço Unitário
        </label>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="R$ 0,00"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Valor numérico:</strong> {value}</p>
        <p><strong>Display formatado:</strong> {displayValue}</p>
      </div>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => setValue(10.50)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Testar R$ 10,50
        </button>
        <button
          onClick={() => setValue(1234.56)}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Testar R$ 1.234,56
        </button>
        <button
          onClick={() => setValue(0)}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default TesteCurrencyInput;
