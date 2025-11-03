import { BotOption } from '../types/triagem-bot.types';

export function normalizarTextoMenu(valor?: string | number | null): string {
  if (valor === null || typeof valor === 'undefined') {
    return '';
  }

  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function formatarOpcoes(opcoes: BotOption[]): string {
  return opcoes
    .map((opcao, index) => {
      const texto = `${index + 1}. ${opcao.texto}`;
      return opcao.descricao ? `${texto}\n   ${opcao.descricao}` : texto;
    })
    .join('\n\n');
}

export function obterEmojiPorNome(nome: string): string {
  const nomeLower = (nome || '').toLowerCase();
  const normalized = nomeLower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('suporte') || normalized.includes('tecnico')) {
    return '1️⃣';
  }

  if (normalized.includes('financeiro') || normalized.includes('cobranca')) {
    return '2️⃣';
  }

  if (normalized.includes('comercial') || normalized.includes('vendas')) {
    return '3️⃣';
  }

  if (normalized.includes('geral') || normalized.includes('atendimento')) {
    return '4️⃣';
  }

  return '▪️';
}
