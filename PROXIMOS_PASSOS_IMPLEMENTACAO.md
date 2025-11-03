# 🚀 PRÓXIMOS PASSOS - Guia Rápido

## ⚡ Ação Imediata (5 minutos)

### 1. Executar Migration de Versionamento

```bash
# Opção 1: Via psql (Windows)
psql -U postgres -d conectcrm_db -f C:\Projetos\conectcrm\add-versionamento-fluxos.sql

# Opção 2: Via pgAdmin
# 1. Abrir pgAdmin
# 2. Conectar no banco conectcrm_db
# 3. Query Tool → Abrir arquivo add-versionamento-fluxos.sql
# 4. Execute (F5)

# Opção 3: Via DBeaver/outro cliente
# Abrir o arquivo e executar as queries
```

**Validação**:
```sql
-- Verificar se colunas foram adicionadas:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fluxos_triagem' 
AND column_name IN ('historico_versoes', 'versao_atual');

-- Deve retornar:
-- historico_versoes | jsonb
-- versao_atual | integer
```

---

## 📋 Implementação Frontend (4-6 horas)

### 2. Criar Service de Versionamento

**Arquivo**: `frontend-web/src/services/fluxoService.ts`

```typescript
// Adicionar estas funções no service existente:

export const getHistoricoVersoes = async (fluxoId: string) => {
  const response = await api.get(`/fluxos/${fluxoId}/historico`);
  return response.data;
};

export const salvarVersao = async (fluxoId: string, descricao?: string) => {
  const response = await api.post(`/fluxos/${fluxoId}/salvar-versao`, {
    descricao,
  });
  return response.data;
};

export const restaurarVersao = async (
  fluxoId: string,
  numeroVersao: number
) => {
  const response = await api.post(`/fluxos/${fluxoId}/restaurar-versao`, {
    numeroVersao,
  });
  return response.data;
};
```

---

### 3. Criar Componente de Histórico

**Arquivo**: `frontend-web/src/features/bot-builder/components/ModalHistoricoVersoes.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Eye, Download, Clock } from 'lucide-react';
import { getHistoricoVersoes, restaurarVersao } from '../../../services/fluxoService';

interface VersaoFluxo {
  numero: number;
  timestamp: Date;
  autor: string;
  descricao?: string;
  publicada: boolean;
}

interface ModalHistoricoVersoesProps {
  open: boolean;
  fluxoId: string;
  onClose: () => void;
  onRestore: () => void;
}

export const ModalHistoricoVersoes: React.FC<ModalHistoricoVersoesProps> = ({
  open,
  fluxoId,
  onClose,
  onRestore,
}) => {
  const [versoes, setVersoes] = useState<VersaoFluxo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && fluxoId) {
      carregarHistorico();
    }
  }, [open, fluxoId]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getHistoricoVersoes(fluxoId);
      setVersoes(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico de versões');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (numeroVersao: number) => {
    if (!confirm(`Tem certeza que deseja restaurar para a versão ${numeroVersao}?`)) {
      return;
    }

    try {
      setLoading(true);
      await restaurarVersao(fluxoId, numeroVersao);
      alert(`Versão ${numeroVersao} restaurada com sucesso!`);
      onRestore();
      onClose();
    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
      alert('Erro ao restaurar versão');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (timestamp: Date) => {
    const date = new Date(timestamp);
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);

    if (horas < 1) return 'Agora mesmo';
    if (horas < 24) return `há ${horas}h`;
    if (dias < 7) return `há ${dias}d`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-[#002333]">
              📦 Histórico de Versões
            </h2>
            <p className="text-sm text-gray-500">
              {versoes.length} versão(ões) salva(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          {!loading && !error && versoes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma versão salva ainda</p>
              <p className="text-sm mt-2">
                As versões são salvas automaticamente ao publicar
              </p>
            </div>
          )}

          {!loading && !error && versoes.length > 0 && (
            <div className="space-y-4">
              {versoes.map((versao) => (
                <div
                  key={versao.numero}
                  className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-purple-600">
                          v{versao.numero}
                        </span>
                        {versao.publicada && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            ✅ PUBLICADA
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatarData(versao.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-1">
                        {versao.descricao || 'Sem descrição'}
                      </p>

                      <p className="text-xs text-gray-500">
                        Por: {versao.autor}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(versao.numero)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### 4. Integrar em FluxoBuilderPage

**Arquivo**: `frontend-web/src/pages/FluxoBuilderPage.tsx`

```typescript
// 1. Adicionar imports:
import { History } from 'lucide-react';
import { ModalHistoricoVersoes } from '../features/bot-builder/components/ModalHistoricoVersoes';

// 2. Adicionar estado:
const [showHistorico, setShowHistorico] = useState(false);

// 3. Adicionar botão no header (próximo ao botão "Salvar"):
<button
  onClick={() => setShowHistorico(true)}
  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
>
  <History className="w-4 h-4" />
  Histórico
</button>

// 4. Adicionar modal antes do fechamento do return:
<ModalHistoricoVersoes
  open={showHistorico}
  fluxoId={fluxoId || ''}
  onClose={() => setShowHistorico(false)}
  onRestore={() => {
    carregarFluxo(); // Recarrega fluxo após restaurar
    toast.success('Versão restaurada com sucesso!');
  }}
/>
```

---

### 5. Integrar em GestaoFluxosPage

**Arquivo**: `frontend-web/src/pages/GestaoFluxosPage.tsx`

```typescript
// Adicionar botão no menu dropdown dos cards:
<button
  onClick={() => {
    setFluxoSelecionado(fluxo);
    setShowHistorico(true);
  }}
  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  <History className="w-4 h-4" />
  Ver Histórico
</button>

// Adicionar estado e modal:
const [showHistorico, setShowHistorico] = useState(false);
const [fluxoSelecionado, setFluxoSelecionado] = useState<FluxoTriagem | null>(null);

<ModalHistoricoVersoes
  open={showHistorico}
  fluxoId={fluxoSelecionado?.id || ''}
  onClose={() => {
    setShowHistorico(false);
    setFluxoSelecionado(null);
  }}
  onRestore={() => {
    carregarFluxos(); // Recarrega lista após restaurar
    setShowHistorico(false);
    toast.success('Versão restaurada!');
  }}
/>
```

---

## 🧪 Testar a Implementação

### 1. Criar um Fluxo de Teste
1. Ir em Gestão → Fluxos
2. Clicar em "Criar Novo Fluxo"
3. Adicionar alguns blocos
4. Salvar e publicar

### 2. Modificar e Publicar Novamente
1. Abrir o fluxo
2. Adicionar mais blocos
3. Publicar novamente
4. ✅ Versão deve ser salva automaticamente

### 3. Verificar Histórico
1. Clicar em "Histórico" no editor
2. Ver lista de versões
3. Tentar restaurar uma versão anterior
4. ✅ Fluxo deve voltar ao estado anterior

---

## 📊 Validação Final

### Checklist de Testes:

- [ ] Migration executada sem erros
- [ ] Colunas criadas no banco (verificar com query)
- [ ] Service frontend compilando sem erros
- [ ] Componente `ModalHistoricoVersoes` renderizando
- [ ] Botão "Histórico" aparece no editor
- [ ] Lista de versões carrega corretamente
- [ ] Formatação de datas funciona
- [ ] Restaurar versão funciona
- [ ] Confirmação antes de restaurar aparece
- [ ] Toast de sucesso aparece
- [ ] Fluxo recarrega após restaurar
- [ ] Versão é salva ao publicar
- [ ] Descrição customizada salva corretamente

---

## 🚀 Deploy em Produção

### 1. Backend
```bash
# 1. Rodar migration
psql -U $DB_USER -d $DB_NAME -f add-versionamento-fluxos.sql

# 2. Verificar logs do backend
tail -f /var/log/backend.log

# 3. Testar endpoints
curl -X GET https://api.seudominio.com/fluxos/{id}/historico \
  -H "Authorization: Bearer {token}"
```

### 2. Frontend
```bash
# 1. Build
cd frontend-web
npm run build

# 2. Deploy (exemplo Netlify)
netlify deploy --prod --dir=build
```

### 3. Validação Pós-Deploy
- [ ] Endpoints retornando 200
- [ ] UI mostrando histórico
- [ ] Restaurar versão funciona
- [ ] Logs no backend OK

---

## 💡 Dicas e Troubleshooting

### Problema: Migration não roda
**Solução**: Execute manualmente via pgAdmin ou DBeaver

### Problema: Histórico vazio mesmo após publicar
**Solução**: Verificar se método `salvarVersao()` é chamado no `publicar()`

### Problema: Erro 404 ao chamar `/historico`
**Solução**: 
1. Verificar se backend está rodando
2. Verificar rota no controller
3. Ver logs do backend

### Problema: Frontend não compila
**Solução**: 
1. Verificar imports (History icon, ModalHistoricoVersoes)
2. npm install se faltarem dependências
3. Verificar typescript errors

---

## 📚 Documentação de Referência

- `VERSIONAMENTO_FLUXOS_IMPLEMENTADO.md` - Documentação técnica completa
- `CONSOLIDACAO_MELHORIAS_TRIAGEM.md` - Visão geral do que foi feito
- `ANALISE_PROMPT_TRIAGEM_BOT.md` - Análise inicial do sistema

---

**Boa sorte! 🚀**  
Qualquer dúvida, consulte a documentação ou peça ajuda ao Copilot! 🤖
