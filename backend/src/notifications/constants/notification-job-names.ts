// Lista oficial de jobNames para a fila de notificações
export enum NotificationJobName {
  SEND_EMAIL = 'send-email',
  SEND_WHATSAPP = 'send-whatsapp',
  SEND_SMS = 'send-sms',
  SEND_PUSH = 'send-push',
  NOTIFY_USER = 'notify-user',
}

export const NOTIFICATION_JOB_NAMES: string[] = [
  NotificationJobName.SEND_EMAIL,
  NotificationJobName.SEND_WHATSAPP,
  NotificationJobName.SEND_SMS,
  NotificationJobName.SEND_PUSH,
  NotificationJobName.NOTIFY_USER,
];
