import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import { BotOption, DepartamentoBotOption, NucleoBotOption } from '../types/triagem-bot.types';

export function criarOpcoesNucleos(sessao: SessaoTriagem, nucleos: NucleoBotOption[]): BotOption[] {
  return nucleos.map((nucleo, index) => {
    const departamentosDisponiveis = Array.isArray(nucleo.departamentos)
      ? nucleo.departamentos
      : [];
    const temDepartamentos = departamentosDisponiveis.length > 0;

    // 🎯 Verificar se núcleo tem atendentes diretos (quando não tem departamentos)
    const atendentesNucleo = Array.isArray(nucleo.atendentesIds) ? nucleo.atendentesIds : [];
    const nucleoTemAtendentes = atendentesNucleo.length > 0;

    return {
      valor: String(index + 1),
      texto: nucleo.nome,
      descricao: nucleo.descricao || `Atendimento de ${String(nucleo.nome || '').toLowerCase()}`,
      acao: 'proximo_passo',
      proximaEtapa: temDepartamentos ? 'escolha-departamento' : 'transferir-atendimento',
      salvarContexto: {
        areaTitulo: String(nucleo.nome || '').toLowerCase(),
        destinoNucleoId: nucleo.id,
        nucleoNome: nucleo.nome,
        __mensagemFinal: nucleo.mensagemBoasVindas || null,
        __departamentosDisponiveis: departamentosDisponiveis,
        __temDepartamentos: temDepartamentos,
        __nucleoTemAtendentes: nucleoTemAtendentes,
        __atendentesNucleoIds: atendentesNucleo,
      },
    } as BotOption;
  });
}

export function criarOpcoesDepartamentos(
  sessao: SessaoTriagem,
  departamentos: DepartamentoBotOption[],
  proximaEtapa: string = 'transferir-atendimento',
): BotOption[] {
  const destinoEtapa =
    typeof proximaEtapa === 'string' && proximaEtapa.trim().length > 0
      ? proximaEtapa.trim()
      : 'transferir-atendimento';

  const areaAtual =
    sessao.contexto?.areaTitulo || sessao.contexto?.areaTituloOriginal || 'atendimento';

  return departamentos.map((dept, index) => ({
    valor: String(index + 1),
    texto: dept.nome,
    descricao: dept.descricao || `Departamento de ${String(dept.nome || '').toLowerCase()}`,
    acao: 'proximo_passo',
    proximaEtapa: destinoEtapa,
    salvarContexto: {
      destinoDepartamentoId: dept.id,
      departamentoNome: dept.nome,
      areaTitulo: `${areaAtual} - ${dept.nome}`,
      proximaEtapaDepartamento: destinoEtapa,
    },
  }));
}
