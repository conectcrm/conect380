import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { LoadingSkeleton, SectionCard } from '../../components/layout-v2';
import { toastService } from '../../services/toastService';
import ModalVisualizarProposta from './components/ModalVisualizarProposta';
import {
  propostasService as propostasFeatureService,
  type PropostaCompleta,
} from './services/propostasService';

const PropostaDetalhePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const propostaId = useMemo(() => String(id || '').trim(), [id]);
  const [proposta, setProposta] = useState<PropostaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarProposta = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
      }
      setErro(null);

      if (!propostaId) {
        setProposta(null);
        setErro('Identificador da proposta nao foi informado.');
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      try {
        const propostaDetalhada = await propostasFeatureService.obterProposta(propostaId);
        if (!propostaDetalhada) {
          setProposta(null);
          setErro('Nao foi possivel localizar essa proposta.');
          return;
        }

        setProposta(propostaDetalhada);
      } catch (error) {
        console.error('Erro ao carregar detalhe da proposta:', error);
        setProposta(null);
        setErro('Nao foi possivel carregar os detalhes da proposta.');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [propostaId],
  );

  useEffect(() => {
    void carregarProposta();
  }, [carregarProposta]);

  const handleVoltar = useCallback(() => {
    navigate('/vendas/propostas');
  }, [navigate]);

  const handleEditar = useCallback(
    (propostaAtual: PropostaCompleta) => {
      const propostaAtualId = propostaAtual?.id ? String(propostaAtual.id).trim() : '';
      if (!propostaAtualId) {
        toastService.error('Proposta sem identificador para edicao.');
        return;
      }

      navigate(`/vendas/propostas?proposta=${encodeURIComponent(propostaAtualId)}&mode=edit`);
    },
    [navigate],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (erro || !proposta) {
    return (
      <SectionCard className="border border-[#F4D58D] bg-[#FFF7ED] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#7A2230]">Detalhe da proposta indisponivel</p>
            <p className="mt-1 text-sm text-[#8C4A56]">{erro || 'Proposta nao encontrada.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void carregarProposta()}
              className="inline-flex h-9 items-center rounded-md border border-[#C8DAE2] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F1F7FA]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={handleVoltar}
              className="inline-flex h-9 items-center rounded-md bg-[#159A9C] px-3 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para listagem
            </button>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <ModalVisualizarProposta
      mode="page"
      proposta={proposta}
      onClose={handleVoltar}
      onEditProposta={handleEditar}
      onPropostaUpdated={() => {
        void carregarProposta({ silent: true });
      }}
    />
  );
};

export default PropostaDetalhePage;
