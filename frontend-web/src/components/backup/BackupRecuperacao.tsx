import React, { useState } from 'react';
import { DatabaseBackup, UploadCloud } from 'lucide-react';

type Props = {
  onExecutarBackup: () => void | Promise<void>;
  onRestaurarBackup: () => void | Promise<void>;
};

export default function BackupRecuperacao({ onExecutarBackup, onRestaurarBackup }: Props) {
  const [loading, setLoading] = useState<'backup' | 'restore' | null>(null);

  const executar = async (tipo: 'backup' | 'restore') => {
    try {
      setLoading(tipo);
      if (tipo === 'backup') {
        await onExecutarBackup();
      } else {
        await onRestaurarBackup();
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-[#002333]">Backup e Recuperação</h2>
          <p className="mt-2 text-sm text-[#002333]/70">
            Execute backups manuais e restaure um backup quando necessário.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => executar('backup')}
            disabled={loading !== null}
            className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            <DatabaseBackup className="h-4 w-4" />
            {loading === 'backup' ? 'Executando...' : 'Executar Backup'}
          </button>

          <button
            type="button"
            onClick={() => executar('restore')}
            disabled={loading !== null}
            className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="h-4 w-4 text-[#159A9C]" />
            {loading === 'restore' ? 'Restaurando...' : 'Restaurar Backup'}
          </button>
        </div>
      </div>
    </div>
  );
}
