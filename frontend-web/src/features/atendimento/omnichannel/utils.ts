import { MessageCircle, Send, Mail, Phone, MessageSquare } from 'lucide-react';
import { CanalTipo, Contato } from './types';

/**
 * 🎯 Resolve o nome do CONTATO para exibição
 *
 * Usado em: Sidebar, Header do Chat, Lista de Tickets
 * SEMPRE retorna o nome do contato (pessoa conversando), não do cliente
 */
export const resolverNomeExibicao = (contato: Contato | null | undefined): string => {
  if (!contato) return 'Sem nome';

  // ✅ Retorna o nome do contato (pessoa que está conversando)
  if (contato.nome) {
    return contato.nome;
  }

  // ❌ Fallback
  return 'Sem nome';
};

/**
 * 🏢 Resolve o nome do CLIENTE vinculado ao contato
 *
 * Usado em: Painel "Informações do Cliente" (lado direito)
 * Retorna o nome do cliente CRM se estiver vinculado, ou null
 */
export const resolverNomeCliente = (contato: Contato | null | undefined): string | null => {
  if (!contato) return null;

  // ✅ Retorna o nome do cliente vinculado (empresa/pessoa no CRM)
  if (contato.clienteVinculado?.nome) {
    return contato.clienteVinculado.nome;
  }

  // Não tem cliente vinculado
  return null;
};

// Retorna o ícone apropriado para cada canal
export const getIconeCanal = (canal: CanalTipo) => {
  switch (canal) {
    case 'whatsapp':
      return MessageCircle;
    case 'telegram':
      return Send;
    case 'email':
      return Mail;
    case 'telefone':
      return Phone;
    case 'chat':
    default:
      return MessageSquare;
  }
};

// Retorna a cor do canal
export const getCorCanal = (canal: CanalTipo): string => {
  switch (canal) {
    case 'whatsapp':
      return 'bg-green-500';
    case 'telegram':
      return 'bg-blue-400';
    case 'email':
      return 'bg-red-500';
    case 'telefone':
      return 'bg-purple-500';
    case 'chat':
    default:
      return 'bg-gray-500';
  }
};

// Formata tempo em formato legível
export const formatarTempoDecorrido = (data: Date | string | undefined): string => {
  // ✅ Validação: retornar fallback se data for undefined/null
  if (!data) return '-';

  // ✅ Converter string para Date se necessário
  const dataObj = typeof data === 'string' ? new Date(data) : data;

  // ✅ Validar se é uma data válida
  if (isNaN(dataObj.getTime())) return '-';

  const agora = new Date();
  const diff = agora.getTime() - dataObj.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return 'agora';
  if (minutos < 60) return `${minutos}min`;
  if (horas < 24) return `${horas}h`;
  if (dias === 1) return 'ontem';
  return `${dias} dias`;
};

// Formata tempo de atendimento (segundos para MM:SS ou HH:MM)
export const formatarTempoAtendimento = (segundos: number): string => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;

  if (horas > 0) {
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
  return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
};

// Formata horário da mensagem
export const formatarHorarioMensagem = (data: Date | string | null | undefined): string => {
  if (!data) return '--:--';

  const dataObj = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(dataObj.getTime())) return '--:--';

  const hoje = new Date();
  const ehHoje = dataObj.toDateString() === hoje.toDateString();

  const horas = dataObj.getHours().toString().padStart(2, '0');
  const minutos = dataObj.getMinutes().toString().padStart(2, '0');

  if (ehHoje) {
    return `${horas}:${minutos}`;
  }

  const dia = dataObj.getDate().toString().padStart(2, '0');
  const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');

  return `${dia}/${mes} ${horas}:${minutos}`;
};

// Copia texto para clipboard
export const copiarParaClipboard = async (texto: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (err) {
    console.error('Erro ao copiar:', err);
    return false;
  }
};
