/**
 * ⏰ Utilitário para verificação de horário comercial
 */

export interface HorarioFuncionamento {
  segunda?: { inicio: string; fim: string };
  terca?: { inicio: string; fim: string };
  quarta?: { inicio: string; fim: string };
  quinta?: { inicio: string; fim: string };
  sexta?: { inicio: string; fim: string };
  sabado?: { inicio: string; fim: string };
  domingo?: { inicio: string; fim: string };
  timezone?: string;
  feriados?: string[]; // Array de datas no formato 'YYYY-MM-DD'
}

export interface VerificacaoHorario {
  estaAberto: boolean;
  motivoFechado?: string;
  proximaAbertura?: Date;
  horarioAtual?: string;
}

export class HorarioUtil {
  /**
   * Verifica se está dentro do horário de funcionamento
   */
  static verificarDisponibilidade(
    horario?: HorarioFuncionamento,
    dataReferencia: Date = new Date(),
  ): VerificacaoHorario {
    // Se não tem horário configurado, assume sempre aberto
    if (!horario) {
      return { estaAberto: true };
    }

    // Converter para timezone configurado
    const timezone = horario.timezone || 'America/Sao_Paulo';
    const dataLocal = this.converterParaTimezone(dataReferencia, timezone);

    // Verificar se é feriado
    const dataStr = this.formatarData(dataLocal);
    if (horario.feriados?.includes(dataStr)) {
      return {
        estaAberto: false,
        motivoFechado: 'Feriado',
        horarioAtual: this.formatarHorario(dataLocal),
      };
    }

    // Pegar configuração do dia da semana
    const diaSemana = this.obterDiaSemana(dataLocal);
    const configDia = this.obterConfigDia(horario, diaSemana);

    if (!configDia || !configDia.inicio || !configDia.fim) {
      return {
        estaAberto: false,
        motivoFechado: `Fechado ${diaSemana}`,
        horarioAtual: this.formatarHorario(dataLocal),
      };
    }

    // Verificar se está dentro do horário
    const horarioAtual = this.extrairHoraMinuto(dataLocal);
    const { inicio, fim } = configDia;

    const dentroDoHorario = this.horarioEntre(horarioAtual, inicio, fim);

    if (dentroDoHorario) {
      return {
        estaAberto: true,
        horarioAtual: this.formatarHorario(dataLocal),
      };
    }

    // Fora do horário - calcular próxima abertura
    const proximaAbertura = this.calcularProximaAbertura(horario, dataLocal);

    return {
      estaAberto: false,
      motivoFechado: `Horário de atendimento: ${inicio} às ${fim}`,
      proximaAbertura,
      horarioAtual: this.formatarHorario(dataLocal),
    };
  }

  /**
   * Formata mensagem de indisponibilidade
   */
  static formatarMensagemForaHorario(
    nomeNucleo: string,
    mensagemCustom?: string,
    horario?: HorarioFuncionamento,
  ): string {
    if (mensagemCustom) {
      return mensagemCustom;
    }

    const verificacao = this.verificarDisponibilidade(horario);

    if (verificacao.estaAberto) {
      return `${nomeNucleo} está disponível agora.`;
    }

    let mensagem = `🕒 *${nomeNucleo}* está temporariamente indisponível.\n\n`;

    if (verificacao.motivoFechado) {
      mensagem += `${verificacao.motivoFechado}\n\n`;
    }

    if (horario) {
      mensagem += `📅 *Horários de atendimento:*\n`;
      mensagem += this.formatarHorariosSemanais(horario);
    }

    if (verificacao.proximaAbertura) {
      const dataProxima = this.formatarDataHora(verificacao.proximaAbertura);
      mensagem += `\n🔔 Próxima abertura: ${dataProxima}`;
    }

    return mensagem;
  }

  /**
   * Converte data para timezone específico
   */
  private static converterParaTimezone(data: Date, timezone: string): Date {
    try {
      // Usar Intl.DateTimeFormat para converter
      const dtf = new Intl.DateTimeFormat('pt-BR', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = dtf.formatToParts(data);
      const valores: any = {};
      parts.forEach(({ type, value }) => {
        valores[type] = value;
      });

      return new Date(
        `${valores.year}-${valores.month}-${valores.day}T${valores.hour}:${valores.minute}:${valores.second}`,
      );
    } catch (error) {
      // Fallback: retornar data original
      return data;
    }
  }

  /**
   * Obtém dia da semana (segunda, terca, etc)
   */
  private static obterDiaSemana(
    data: Date,
  ): keyof Omit<HorarioFuncionamento, 'timezone' | 'feriados'> {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
    return dias[data.getDay()];
  }

  /**
   * Obtém configuração do dia
   */
  private static obterConfigDia(
    horario: HorarioFuncionamento,
    dia: keyof Omit<HorarioFuncionamento, 'timezone' | 'feriados'>,
  ): { inicio: string; fim: string } | undefined {
    return horario[dia];
  }

  /**
   * Extrai hora:minuto da data
   */
  private static extrairHoraMinuto(data: Date): string {
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${hora}:${minuto}`;
  }

  /**
   * Verifica se horário está entre início e fim
   */
  private static horarioEntre(horario: string, inicio: string, fim: string): boolean {
    const [h, m] = horario.split(':').map(Number);
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);

    const minutos = h * 60 + m;
    const minutosInicio = hi * 60 + mi;
    const minutosFim = hf * 60 + mf;

    return minutos >= minutosInicio && minutos <= minutosFim;
  }

  /**
   * Calcula próxima abertura
   */
  private static calcularProximaAbertura(
    horario: HorarioFuncionamento,
    dataAtual: Date,
  ): Date | undefined {
    const diasOrdem: Array<keyof Omit<HorarioFuncionamento, 'timezone' | 'feriados'>> = [
      'segunda',
      'terca',
      'quarta',
      'quinta',
      'sexta',
      'sabado',
      'domingo',
    ];

    for (let i = 0; i < 7; i++) {
      const dataFutura = new Date(dataAtual);
      dataFutura.setDate(dataAtual.getDate() + i);

      const dia = this.obterDiaSemana(dataFutura);
      const config = this.obterConfigDia(horario, dia);

      if (config && config.inicio) {
        const [hora, minuto] = config.inicio.split(':').map(Number);
        dataFutura.setHours(hora, minuto, 0, 0);

        if (dataFutura > dataAtual) {
          return dataFutura;
        }
      }
    }

    return undefined;
  }

  /**
   * Formata data como YYYY-MM-DD
   */
  private static formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  /**
   * Formata horário HH:mm
   */
  private static formatarHorario(data: Date): string {
    return this.extrairHoraMinuto(data);
  }

  /**
   * Formata data e hora legível
   */
  private static formatarDataHora(data: Date): string {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = dias[data.getDay()];
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const hora = this.formatarHorario(data);

    return `${diaSemana}, ${dia}/${mes} às ${hora}`;
  }

  /**
   * Formata horários semanais para exibição
   */
  private static formatarHorariosSemanais(horario: HorarioFuncionamento): string {
    const diasNomes: Record<string, string> = {
      segunda: 'Segunda',
      terca: 'Terça',
      quarta: 'Quarta',
      quinta: 'Quinta',
      sexta: 'Sexta',
      sabado: 'Sábado',
      domingo: 'Domingo',
    };

    const linhas: string[] = [];

    (['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const).forEach(
      (dia) => {
        const config = horario[dia];
        if (config && config.inicio && config.fim) {
          linhas.push(`${diasNomes[dia]}: ${config.inicio} às ${config.fim}`);
        }
      },
    );

    return linhas.join('\n');
  }
}
