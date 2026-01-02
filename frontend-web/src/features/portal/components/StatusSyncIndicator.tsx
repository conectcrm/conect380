import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusSyncProps {
  propostaId: string;
  onSyncCheck?: (synced: boolean) => void;
}

export const StatusSyncIndicator: React.FC<StatusSyncProps> = ({ propostaId, onSyncCheck }) => {
  const [syncStatus, setSyncStatus] = useState<'checking' | 'synced' | 'pending' | 'error'>(
    'checking',
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkSyncStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkSyncStatus, 30000);

    return () => clearInterval(interval);
  }, [propostaId]);

  const checkSyncStatus = async () => {
    try {
      setSyncStatus('checking');

      // Verificar no localStorage primeiro (simulação do CRM local)
      const propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
      const proposta = propostas.find((p: any) => p.numero === propostaId || p.id === propostaId);

      if (proposta && proposta.status === 'aprovada') {
        setSyncStatus('synced');
        setLastChecked(new Date());
        onSyncCheck?.(true);
        return;
      }

      // Tentar verificar no backend se disponível
      try {
        const response = await fetch(`http://localhost:3001/propostas/${propostaId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.proposta?.status === 'aprovada') {
            setSyncStatus('synced');
            setLastChecked(new Date());
            onSyncCheck?.(true);
            return;
          }
        }
      } catch (backendError) {
        console.log('Backend não disponível, usando dados locais');
      }

      // Se chegou até aqui, ainda está pendente
      setSyncStatus('pending');
      setLastChecked(new Date());
      onSyncCheck?.(false);
    } catch (error) {
      console.error('Erro ao verificar sincronização:', error);
      setSyncStatus('error');
      setLastChecked(new Date());
      onSyncCheck?.(false);
    }
  };

  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'checking':
        return {
          icon: <Clock className="h-4 w-4 animate-spin" />,
          text: 'Verificando sincronização...',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
        };

      case 'synced':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Sincronizado com o CRM',
          className: 'text-green-600 bg-green-50 border-green-200',
        };

      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Sincronização pendente',
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        };

      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Erro na verificação',
          className: 'text-red-600 bg-red-50 border-red-200',
        };

      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Verificando...',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-center p-3 rounded-lg border ${status.className}`}>
      <div className="flex items-center flex-1">
        {status.icon}
        <span className="ml-2 text-sm font-medium">{status.text}</span>
      </div>

      {lastChecked && <div className="text-xs opacity-75">{lastChecked.toLocaleTimeString()}</div>}

      {syncStatus === 'pending' && (
        <button
          onClick={checkSyncStatus}
          className="ml-2 text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50"
        >
          Verificar
        </button>
      )}
    </div>
  );
};
