/**
 * 🔍 Utilitário para detectar loops infinitos em fluxos de triagem
 */

import { EstruturaFluxo, Etapa } from '../entities/fluxo-triagem.entity';

export interface LoopDetectionResult {
  temLoop: boolean;
  loops: string[][]; // Array de caminhos com loop
  mensagem?: string;
}

/**
 * Detecta loops infinitos no fluxo
 * @param estrutura Estrutura do fluxo a ser analisada
 * @returns Resultado da detecção com loops encontrados
 */
export function detectarLoops(estrutura: EstruturaFluxo): LoopDetectionResult {
  const loops: string[][] = [];
  const visitedPaths = new Map<string, Set<string>>();

  function dfs(etapaId: string, path: string[]): void {
    // Se etapa já está no caminho atual, encontramos um loop
    if (path.includes(etapaId)) {
      const loopStart = path.indexOf(etapaId);
      const loop = [...path.slice(loopStart), etapaId];

      // Evitar duplicatas (mesmo loop com ordem diferente)
      const loopKey = [...loop].sort().join('→');
      const jaAdicionado = loops.some((l) => {
        const existingKey = [...l].sort().join('→');
        return existingKey === loopKey;
      });

      if (!jaAdicionado) {
        loops.push(loop);
      }
      return;
    }

    // Prevenir explosão combinatória
    if (!visitedPaths.has(etapaId)) {
      visitedPaths.set(etapaId, new Set());
    }
    const pathKey = path.join('→');
    if (visitedPaths.get(etapaId)!.has(pathKey)) {
      return;
    }
    visitedPaths.get(etapaId)!.add(pathKey);

    const etapa = estrutura.etapas[etapaId];
    if (!etapa) return;

    const newPath = [...path, etapaId];

    // Checar proximaEtapa direta
    const proximaEtapa = (etapa as any).proximaEtapa || (etapa as any).proxima_etapa;
    if (proximaEtapa && typeof proximaEtapa === 'string') {
      dfs(proximaEtapa, newPath);
    }

    // Checar opções de menu
    if (etapa.opcoes && Array.isArray(etapa.opcoes)) {
      for (const opcao of etapa.opcoes) {
        const proxima = (opcao as any).proximaEtapa || (opcao as any).proxima_etapa;
        if (proxima && typeof proxima === 'string') {
          dfs(proxima, newPath);
        }
      }
    }

    // Checar condicao (lógica if/then/else)
    if (etapa.condicao) {
      if (etapa.condicao.proximaEtapaTrue) {
        dfs(etapa.condicao.proximaEtapaTrue, newPath);
      }
      if (etapa.condicao.proximaEtapaFalse) {
        dfs(etapa.condicao.proximaEtapaFalse, newPath);
      }
    }

    // Checar proximaEtapaCondicional
    if (
      (etapa as any).proximaEtapaCondicional &&
      Array.isArray((etapa as any).proximaEtapaCondicional)
    ) {
      for (const cond of (etapa as any).proximaEtapaCondicional) {
        if (cond.entao) {
          dfs(cond.entao, newPath);
        }
      }
    }
  }

  // Iniciar DFS da etapa inicial
  if (estrutura.etapaInicial) {
    dfs(estrutura.etapaInicial, []);
  }

  if (loops.length > 0) {
    const loopDescriptions = loops.map((loop) => loop.join(' → ')).join('\n');
    return {
      temLoop: true,
      loops,
      mensagem: `Detectado(s) ${loops.length} loop(s) infinito(s):\n${loopDescriptions}`,
    };
  }

  return {
    temLoop: false,
    loops: [],
  };
}

/**
 * Valida se o fluxo pode ser publicado (sem loops)
 * @param estrutura Estrutura do fluxo
 * @throws Error se houver loops
 */
export function validarFluxoParaPublicacao(estrutura: EstruturaFluxo): void {
  const resultado = detectarLoops(estrutura);

  if (resultado.temLoop) {
    throw new Error(
      `❌ Não é possível publicar fluxo com loops infinitos.\n\n${resultado.mensagem}\n\n` +
        `Por favor, corrija o fluxo removendo as referências circulares antes de publicar.`,
    );
  }
}
