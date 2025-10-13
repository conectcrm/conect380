import { MessageCircle, Send, Mail, Phone, MessageSquare } from 'lucide-react';
import { CanalTipo } from './types';

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
export const formatarTempoDecorrido = (data: Date): string => {
  const agora = new Date();
  const diff = agora.getTime() - data.getTime();
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
export const formatarHorarioMensagem = (data: Date): string => {
  const hoje = new Date();
  const ehHoje = data.toDateString() === hoje.toDateString();

  const horas = data.getHours().toString().padStart(2, '0');
  const minutos = data.getMinutes().toString().padStart(2, '0');

  if (ehHoje) {
    return `${horas}:${minutos}`;
  }

  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');

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
