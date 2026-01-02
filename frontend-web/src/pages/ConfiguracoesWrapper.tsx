/**
 * Wrapper para redirecionar tabs antigas de Configurações
 * que foram movidas para outras páginas
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfiguracoesAtendimentoPage from '../features/atendimento/configuracoes/ConfiguracoesAtendimentoPage';

const ConfiguracoesWrapper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    // Redirects de tabs movidas para /atendimento/equipe
    if (tab === 'equipes' || tab === 'atendentes') {
      navigate(`/atendimento/equipe?tab=${tab}`, { replace: true });
    }
    // Tab fluxos movida para Automações > Bot
    else if (tab === 'fluxos') {
      navigate('/atendimento/automacoes?tab=bot', { replace: true });
    }
    // Tab fechamento foi removida (funcionalidade será em Automações > Regras)
    else if (tab === 'fechamento') {
      navigate('/atendimento/automacoes?tab=regras', { replace: true });
    }
  }, [location.search, navigate]);

  // Renderizar página normal se tab é válida (geral, nucleos, tags, fluxos)
  return <ConfiguracoesAtendimentoPage />;
};

export default ConfiguracoesWrapper;
