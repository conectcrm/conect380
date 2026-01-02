/**
 * 🔧 Utilitário para corrigir loops infinitos em fluxos automaticamente
 */

import { EstruturaFluxo, Etapa } from '../types/flow-builder.types';

export interface LoopFixResult {
  fluxoCorrigido: EstruturaFluxo;
  loopsCorrigidos: string[][];
  acoesTomadas: string[];
}

/**
 * Corrige loops infinitos automaticamente
 * Estratégia: Remove opções "Voltar" que criam ciclos
 */
export function corrigirLoopsAutomaticamente(estrutura: EstruturaFluxo): LoopFixResult {
  const acoesTomadas: string[] = [];
  const loopsCorrigidos: string[][] = [];
  const etapasModificadas = new Set<string>();

  // Clonar estrutura para não modificar original
  const fluxoCorrigido: EstruturaFluxo = {
    ...estrutura,
    etapas: JSON.parse(JSON.stringify(estrutura.etapas)),
  };

  // Detectar e corrigir cada loop
  const loops = detectarLoops(fluxoCorrigido);

  for (const loop of loops) {
    if (loop.length < 2) continue;

    // Estratégia: Remover última conexão do loop (geralmente o "Voltar")
    const penultimaEtapa = loop[loop.length - 2];
    const ultimaEtapa = loop[loop.length - 1];

    const etapa = fluxoCorrigido.etapas[penultimaEtapa];
    if (!etapa) continue;

    let corrigido = false;

    // 1. Tentar remover da proximaEtapa direta
    if (etapa.proximaEtapa === ultimaEtapa || (etapa as any).proxima_etapa === ultimaEtapa) {
      delete etapa.proximaEtapa;
      delete (etapa as any).proxima_etapa;

      acoesTomadas.push(`✂️ Removida conexão direta: ${penultimaEtapa} ⛔ ${ultimaEtapa}`);
      corrigido = true;
    }

    // 2. Tentar remover de opções (botões "Voltar", "Menu Principal", etc)
    if (etapa.opcoes && Array.isArray(etapa.opcoes)) {
      const opcoesOriginais = etapa.opcoes.length;

      etapa.opcoes = etapa.opcoes.filter((opcao) => {
        const proxima = opcao.proximaEtapa || (opcao as any).proxima_etapa;

        if (proxima === ultimaEtapa) {
          // Detectar se é opção "Voltar"
          const textoOpcao = (opcao.texto || '').toLowerCase();
          const eOpcaoVoltar =
            textoOpcao.includes('voltar') ||
            textoOpcao.includes('menu') ||
            textoOpcao.includes('anterior') ||
            textoOpcao.includes('retornar');

          if (eOpcaoVoltar) {
            acoesTomadas.push(
              `✂️ Removida opção "${opcao.texto}" de ${penultimaEtapa} (causava loop → ${ultimaEtapa})`,
            );
            return false; // Remover opção
          }
        }
        return true; // Manter opção
      });

      if (etapa.opcoes.length < opcoesOriginais) {
        corrigido = true;
      }
    }

    // 3. Tentar remover de condições
    if (etapa.condicoes && Array.isArray(etapa.condicoes)) {
      etapa.condicoes = etapa.condicoes.filter((condicao) => {
        const proxima = condicao.proximaEtapa || (condicao as any).entao;
        if (proxima === ultimaEtapa) {
          acoesTomadas.push(`✂️ Removida condição de ${penultimaEtapa} → ${ultimaEtapa}`);
          return false;
        }
        return true;
      });
    }

    if (corrigido) {
      loopsCorrigidos.push(loop);
      etapasModificadas.add(penultimaEtapa);
    }
  }

  // Adicionar resumo
  if (etapasModificadas.size > 0) {
    acoesTomadas.unshift(
      `🔧 Corrigidos ${loopsCorrigidos.length} loops infinitos`,
      `📝 Etapas modificadas: ${Array.from(etapasModificadas).join(', ')}`,
      '',
    );
  }

  return {
    fluxoCorrigido,
    loopsCorrigidos,
    acoesTomadas,
  };
}

/**
 * Detecta loops (cópia da lógica do flowConverter.ts)
 */
function detectarLoops(estrutura: EstruturaFluxo): string[][] {
  const loops: string[][] = [];
  const visitedPaths = new Map<string, Set<string>>();

  function dfs(etapaId: string, path: string[]): void {
    if (path.includes(etapaId)) {
      const loopStart = path.indexOf(etapaId);
      const loop = [...path.slice(loopStart), etapaId];
      loops.push(loop);
      return;
    }

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

    // Checar proximaEtapa
    const proximaEtapa = (etapa as any).proximaEtapa || (etapa as any).proxima_etapa;
    if (proximaEtapa && typeof proximaEtapa === 'string') {
      dfs(proximaEtapa, newPath);
    }

    // Checar opções
    if (etapa.opcoes && Array.isArray(etapa.opcoes)) {
      for (const opcao of etapa.opcoes) {
        const proxima = (opcao as any).proximaEtapa || (opcao as any).proxima_etapa;
        if (proxima && typeof proxima === 'string') {
          dfs(proxima, newPath);
        }
      }
    }

    // Checar condições
    if (etapa.condicoes && Array.isArray(etapa.condicoes)) {
      for (const condicao of etapa.condicoes) {
        if (condicao.proximaEtapa) {
          dfs(condicao.proximaEtapa, newPath);
        }
        if ((condicao as any).entao) {
          dfs((condicao as any).entao, newPath);
        }
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

  if (estrutura.etapaInicial) {
    dfs(estrutura.etapaInicial, []);
  }

  return loops;
}
