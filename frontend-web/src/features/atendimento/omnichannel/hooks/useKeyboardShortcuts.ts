/**
 * ⌨️ Hook para Atalhos de Teclado
 * 
 * Gerencia atalhos globais no ChatOmnichannel para agilizar atendimento.
 * 
 * Atalhos disponíveis:
 * - A: Assumir ticket (ABERTO → EM_ATENDIMENTO)
 * - G: Aguardar resposta (EM_ATENDIMENTO → AGUARDANDO)
 * - R: Resolver ticket (EM_ATENDIMENTO → RESOLVIDO)
 * - F: Fechar ticket (RESOLVIDO → FECHADO)
 * - Esc: Cancelar ação/fechar modal
 * 
 * Desabilita atalhos quando:
 * - Usuário está digitando (input/textarea focado)
 * - Modal está aberto
 * - Nenhum ticket selecionado
 */

import { useEffect, useCallback } from 'react';
import { StatusAtendimentoType } from '../types';

interface UseKeyboardShortcutsOptions {
  ticketSelecionado?: {
    id: string;
    status: StatusAtendimentoType;
  } | null;
  onMudarStatus: (status: StatusAtendimentoType) => void;
  modalAberto?: boolean;
  desabilitado?: boolean;
}

export const useKeyboardShortcuts = ({
  ticketSelecionado,
  onMudarStatus,
  modalAberto = false,
  desabilitado = false,
}: UseKeyboardShortcutsOptions) => {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // ❌ Não fazer nada se:
    if (
      desabilitado ||
      modalAberto ||
      !ticketSelecionado ||
      // Usuário está digitando
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as any)?.contentEditable === 'true'
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const statusAtual = ticketSelecionado.status;

    // Prevenir comportamento padrão para teclas que usamos
    const teclasMapeadas = ['a', 'g', 'r', 'f'];
    if (teclasMapeadas.includes(key)) {
      event.preventDefault();
    }

    // ⌨️ MAPEAMENTO DE ATALHOS

    // A = Assumir (ABERTO → EM_ATENDIMENTO)
    if (key === 'a' && statusAtual === 'aberto') {
      console.log('🎮 Atalho [A] - Assumir ticket');
      onMudarStatus('em_atendimento');
      return;
    }

    // G = aGuardar resposta (EM_ATENDIMENTO → AGUARDANDO)
    if (key === 'g' && statusAtual === 'em_atendimento') {
      console.log('🎮 Atalho [G] - Aguardar resposta');
      onMudarStatus('aguardando');
      return;
    }

    // R = Resolver (EM_ATENDIMENTO/AGUARDANDO → RESOLVIDO)
    if (key === 'r') {
      if (statusAtual === 'em_atendimento' || statusAtual === 'aguardando') {
        console.log('🎮 Atalho [R] - Resolver ticket');
        onMudarStatus('resolvido');
        return;
      }
    }

    // F = Fechar (RESOLVIDO → FECHADO)
    if (key === 'f' && statusAtual === 'resolvido') {
      console.log('🎮 Atalho [F] - Fechar ticket');
      onMudarStatus('fechado');
      return;
    }

  }, [ticketSelecionado, onMudarStatus, modalAberto, desabilitado]);

  useEffect(() => {
    // Adicionar listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Retornar informações sobre atalhos disponíveis
  const atalhosDisponiveis = useCallback(() => {
    if (!ticketSelecionado) return [];

    const statusAtual = ticketSelecionado.status;
    const atalhos: Array<{ tecla: string; acao: string; disponivel: boolean }> = [];

    atalhos.push({
      tecla: 'A',
      acao: 'Assumir',
      disponivel: statusAtual === 'aberto',
    });

    atalhos.push({
      tecla: 'G',
      acao: 'Aguardar',
      disponivel: statusAtual === 'em_atendimento',
    });

    atalhos.push({
      tecla: 'R',
      acao: 'Resolver',
      disponivel: statusAtual === 'em_atendimento' || statusAtual === 'aguardando',
    });

    atalhos.push({
      tecla: 'F',
      acao: 'Fechar',
      disponivel: statusAtual === 'resolvido',
    });

    return atalhos.filter(a => a.disponivel);
  }, [ticketSelecionado]);

  return {
    atalhosDisponiveis,
  };
};
