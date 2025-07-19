import { useState, useEffect } from 'react';

interface KPIData {
  totalClientes: {
    value: number;
    trend: { value: number; isPositive: boolean; label: string };
  };
  propostasAtivas: {
    value: number;
    trend: { value: number; isPositive: boolean; label: string };
  };
  receitaMes: {
    value: string;
    trend: { value: number; isPositive: boolean; label: string };
  };
  taxaConversao: {
    value: string;
    trend: { value: number; isPositive: boolean; label: string };
  };
}

export const useKPIData = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setIsLoading(true);
        
        // Simula uma chamada para API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockData: KPIData = {
          totalClientes: {
            value: 248,
            trend: { value: 12, isPositive: true, label: 'este mês' }
          },
          propostasAtivas: {
            value: 32,
            trend: { value: 5, isPositive: true, label: 'esta semana' }
          },
          receitaMes: {
            value: 'R$ 125.000,00',
            trend: { value: 23, isPositive: true, label: 'vs mês anterior' }
          },
          taxaConversao: {
            value: '68%',
            trend: { value: 3, isPositive: true, label: 'vs período anterior' }
          }
        };
        
        setData(mockData);
      } catch (err) {
        setError('Erro ao carregar dados dos KPIs');
        console.error('Erro ao buscar KPIs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  return { data, isLoading, error };
};
