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
    it('deve permitir FILA → EM_ATENDIMENTO', () => {
      const resultado = validarTransicaoStatus(StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO);
      expect(resultado).toBe(true);
    });

    it('deve permitir EM_ATENDIMENTO → AGUARDANDO_CLIENTE', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO_CLIENTE,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir EM_ATENDIMENTO → CONCLUIDO', () => {
      const resultado = validarTransicaoStatus(StatusTicket.EM_ATENDIMENTO, StatusTicket.CONCLUIDO);
      expect(resultado).toBe(true);
    });

    it('deve permitir AGUARDANDO_CLIENTE → EM_ATENDIMENTO', () => {
      const resultado = validarTransicaoStatus(
        StatusTicket.AGUARDANDO_CLIENTE,
        StatusTicket.EM_ATENDIMENTO,
      );
      expect(resultado).toBe(true);
    });

    it('deve permitir CONCLUIDO → ENCERRADO', () => {
      const resultado = validarTransicaoStatus(StatusTicket.CONCLUIDO, StatusTicket.ENCERRADO);
      expect(resultado).toBe(true);
    });

    it('deve permitir ENCERRADO → FILA (reabertura)', () => {
      const resultado = validarTransicaoStatus(StatusTicket.ENCERRADO, StatusTicket.FILA);
      expect(resultado).toBe(true);
    });

    it('deve permitir status igual (não mudou)', () => {
      const resultado = validarTransicaoStatus(StatusTicket.FILA, StatusTicket.FILA);
      expect(resultado).toBe(true);
    });

    it('NÃO deve permitir FILA → AGUARDANDO_CLIENTE (pula etapa)', () => {
      const resultado = validarTransicaoStatus(StatusTicket.FILA, StatusTicket.AGUARDANDO_CLIENTE);
      expect(resultado).toBe(false);
    });

    it('NÃO deve permitir FILA → CONCLUIDO (pula etapas)', () => {
      const resultado = validarTransicaoStatus(StatusTicket.FILA, StatusTicket.CONCLUIDO);
      expect(resultado).toBe(false);
    });

    it('NÃO deve permitir ENCERRADO → EM_ATENDIMENTO (direto)', () => {
      const resultado = validarTransicaoStatus(StatusTicket.ENCERRADO, StatusTicket.EM_ATENDIMENTO);
      expect(resultado).toBe(false);
    });

    it('deve permitir AGUARDANDO_CLIENTE → ENCERRADO', () => {
      const resultado = validarTransicaoStatus(StatusTicket.AGUARDANDO_CLIENTE, StatusTicket.ENCERRADO);
      expect(resultado).toBe(true);
    });
  });

  describe('obterProximosStatusValidos', () => {
    it('deve retornar próximos status válidos para FILA', () => {
      const validos = obterProximosStatusValidos(StatusTicket.FILA);
      expect(validos).toContain(StatusTicket.EM_ATENDIMENTO);
      expect(validos).toContain(StatusTicket.ENCERRADO);
      expect(validos).toContain(StatusTicket.CANCELADO);
      expect(validos).toHaveLength(3);
    });

    it('deve retornar próximos status válidos para EM_ATENDIMENTO', () => {
      const validos = obterProximosStatusValidos(StatusTicket.EM_ATENDIMENTO);
      expect(validos).toContain(StatusTicket.AGUARDANDO_CLIENTE);
      expect(validos).toContain(StatusTicket.AGUARDANDO_INTERNO);
      expect(validos).toContain(StatusTicket.CONCLUIDO);
      expect(validos).toContain(StatusTicket.ENCERRADO);
      expect(validos).toContain(StatusTicket.FILA);
      expect(validos).toHaveLength(5);
    });

    it('deve retornar próximos status válidos para ENCERRADO', () => {
      const validos = obterProximosStatusValidos(StatusTicket.ENCERRADO);
      expect(validos).toContain(StatusTicket.FILA);
      expect(validos).toHaveLength(1);
    });
  });

  describe('gerarMensagemErroTransicao', () => {
    it('deve gerar mensagem de erro para transição inválida', () => {
      const mensagem = gerarMensagemErroTransicao(StatusTicket.FILA, StatusTicket.CONCLUIDO);
      expect(mensagem).toContain('Transição inválida');
      expect(mensagem).toContain('FILA');
      expect(mensagem).toContain('CONCLUIDO');
      expect(mensagem).toContain('EM_ATENDIMENTO');
      expect(mensagem).toContain('ENCERRADO');
    });
  });

  describe('obterDescricaoTransicao', () => {
    it('deve retornar descrição para FILA → EM_ATENDIMENTO', () => {
      const descricao = obterDescricaoTransicao(StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO);
      expect(descricao).toContain('assumido');
    });

    it('deve retornar descrição para EM_ATENDIMENTO → CONCLUIDO', () => {
      const descricao = obterDescricaoTransicao(
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.CONCLUIDO,
      );
      expect(descricao).toContain('concluído');
    });

    it('deve retornar descrição genérica para transição não mapeada', () => {
      const descricao = obterDescricaoTransicao(StatusTicket.FILA, StatusTicket.ENCERRADO);
      expect(descricao).toContain('FILA');
      expect(descricao).toContain('ENCERRADO');
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
            throw new Error(`Status ${status} permite transição para si mesmo`);
          }
        });
      });
    });

    it('deve permitir fluxo completo: FILA → ENCERRADO', () => {
      // Fluxo feliz: FILA → EM_ATENDIMENTO → CONCLUIDO → ENCERRADO
      const fluxo = [
        StatusTicket.FILA,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.CONCLUIDO,
        StatusTicket.ENCERRADO,
      ];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });

    it('deve permitir fluxo com aguardando: FILA → EM_ATENDIMENTO → AGUARDANDO_CLIENTE → EM_ATENDIMENTO → CONCLUIDO', () => {
      const fluxo = [
        StatusTicket.FILA,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.AGUARDANDO_CLIENTE,
        StatusTicket.EM_ATENDIMENTO,
        StatusTicket.CONCLUIDO,
      ];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });

    it('deve permitir reabertura completa: ENCERRADO → FILA → EM_ATENDIMENTO', () => {
      const fluxo = [StatusTicket.ENCERRADO, StatusTicket.FILA, StatusTicket.EM_ATENDIMENTO];

      for (let i = 0; i < fluxo.length - 1; i++) {
        const atual = fluxo[i];
        const proximo = fluxo[i + 1];
        const valido = validarTransicaoStatus(atual, proximo);
        expect(valido).toBe(true);
      }
    });
  });
});
