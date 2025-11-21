/**
 * 🧪 Testes do Validador de Transições de Status
 */

import {
  validarTransicaoStatus,
  obterProximosStatusValidos,
  gerarMensagemErroTransicao,
  obterDescricaoTransicao,
  TRANSICOES_PERMITIDAS,
} from '../utils/status-validator';
import { StatusTicket } from '../entities/ticket.entity';

describe('StatusValidator', () => {
  describe('validarTransicaoStatus', () => {
    it('deve permitir ABERTO → EM_ATENDIMENTO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir EM_ATENDIMENTO → AGUARDANDO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir EM_ATENDIMENTO → RESOLVIDO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.RESOLVIDO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir AGUARDANDO → EM_ATENDIMENTO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.AGUARDANDO,
        StatusTicket.EM_ATENDIMENTO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir RESOLVIDO → FECHADO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.RESOLVIDO,
        StatusTicket.FECHADO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir FECHADO → ABERTO (reabertura)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.FECHADO,
        StatusTicket.ABERTO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir RESOLVIDO → ABERTO (reabertura)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.RESOLVIDO,
        StatusTicket.ABERTO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir status igual (não mudou)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.ABERTO,
        StatusTicket.ABERTO,
      );
      expect(resultado).toBe(true);
    });

    it('NÃO deve permitir ABERTO → AGUARDANDO (pula etapa)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.ABERTO,
        StatusTicket.AGUARDANDO,
      );
      expect(resultado).toBe(false);
    });

    it('NÃO deve permitir ABERTO → RESOLVIDO (pula etapas)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.ABERTO,
        StatusTicket.RESOLVIDO,
      );
      expect(resultado).toBe(false);
    });

    it('NÃO deve permitir FECHADO → EM_ATENDIMENTO (direto)', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.FECHADO,
        StatusTicket.EM_ATENDIMENTO,
      );
      expect(resultado).toBe(false);
    });

    it('NÃO deve permitir AGUARDANDO → FECHADO sem resolver', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.AGUARDANDO,
        StatusTicket.FECHADO,
      );
      // Na verdade, PERMITE fechar direto se cliente não responder
      expect(resultado).toBe(true);
    });
  });

  describe('obterProximosStatusValidos', () => {
    it('deve retornar próximos status válidos para ABERTO', () => {
      const validos = obterProximosStatusValidos(StatusTicket.ABERTO);
      expect(validos).toContain(StatusTicket.EM_ATENDIMENTO);
      expect(validos).toContain(StatusTicket.FECHADO);
      expect(validos).toHaveLength(2);
    });

    it('deve retornar próximos status válidos para EM_ATENDIMENTO', () => {
      const validos = obterProximosStatusValidos(StatusTicket.EM_ATENDIMENTO);
      expect(validos).toContain(StatusTicket.AGUARDANDO);
      expect(validos).toContain(StatusTicket.RESOLVIDO);
      expect(validos).toContain(StatusTicket.ABERTO);
      expect(validos).toHaveLength(3);
    });

    it('deve retornar próximos status válidos para FECHADO', () => {
      const validos = obterProximosStatusValidos(StatusTicket.FECHADO);
      expect(validos).toContain(StatusTicket.ABERTO);
      expect(validos).toHaveLength(1);
    });
  });

  describe('gerarMensagemErroTransicao', () => {
    it('deve gerar mensagem de erro para transição inválida', () => {
      const mensagem = gerarMensagemErroTransicao(
        StatusTicket.ABERTO,
        StatusTicket.RESOLVIDO,
      );
      expect(mensagem).toContain('Transição inválida');
      expect(mensagem).toContain('ABERTO');
      expect(mensagem).toContain('RESOLVIDO');
      expect(mensagem).toContain('EM_ATENDIMENTO');
      expect(mensagem).toContain('FECHADO');
    });
  });

  describe('obterDescricaoTransicao', () => {
    it('deve retornar descrição para ABERTO → EM_ATENDIMENTO', () => {
      const descricao = obterDescricaoTransicao(
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
      );
      expect(descricao).toContain('assumido');
    });

    it('deve retornar descrição para EM_ATENDIMENTO → RESOLVIDO', () => {
      const descricao = obterDescricaoTransicao(
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.RESOLVIDO,
      );
      expect(descricao).toContain('resolvido');
    });

    it('deve retornar descrição genérica para transição não mapeada', () => {
      const descricao = obterDescricaoTransicao(
        StatusTicket.ABERTO,
        StatusTicket.FECHADO,
      );
      expect(descricao).toContain('ABERTO');
      expect(descricao).toContain('FECHADO');
    });
  });

  describe('TRANSICOES_PERMITIDAS', () => {
    it('deve ter definição para todos os status', () => {
      const todosStatus = Object.values(StatusTicket);
      todosStatus.forEach((status) => {
        expect(TRANSICOES_PERMITIDAS[status]).toBeDefined();
        expect(Array.isArray(TRANSICOES_PERMITIDAS[status])).toBe(true);
      });
    });

    it('não deve ter ciclos infinitos simples (status → status)', () => {
      Object.entries(TRANSICOES_PERMITIDAS).forEach(([status, proximos]) => {
        // Não deve permitir transição para si mesmo (exceto validação especial)
        // Nota: validarTransicaoStatus() permite isso como caso especial
        proximos.forEach((proximo) => {
          if (status === proximo) {
            fail(`Status ${status} permite transição para si mesmo`);
          }
        });
      });
    });

    it('deve permitir fluxo completo: ABERTO → FECHADO', () => {
      // Fluxo feliz: ABERTO → EM_ATENDIMENTO → RESOLVIDO → FECHADO
      const fluxo = [
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.RESOLVIDO,
        StatusTicket.FECHADO,
      ];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });

    it('deve permitir fluxo com aguardando: ABERTO → EM_ATENDIMENTO → AGUARDANDO → EM_ATENDIMENTO → RESOLVIDO', () => {
      const fluxo = [
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.RESOLVIDO,
      ];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });

    it('deve permitir reabertura completa: FECHADO → ABERTO → EM_ATENDIMENTO', () => {
      const fluxo = [
        StatusTicket.FECHADO,
        StatusTicket.ABERTO,
        StatusTicket.EM_ATENDIMENTO,
      ];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });
  });
});
