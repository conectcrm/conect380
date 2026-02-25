import toast, { type ToastOptions } from 'react-hot-toast';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeApiErrorMessage = (err: unknown): string | undefined => {
  const errRecord = isRecord(err) ? err : undefined;
  const response = errRecord && isRecord(errRecord['response']) ? errRecord['response'] : undefined;
  const data = response && isRecord(response['data']) ? response['data'] : undefined;
  const responseMessage = data ? data['message'] : undefined;

  if (Array.isArray(responseMessage)) {
    const joined = responseMessage
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join('. ');
    return joined || undefined;
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  const message = err instanceof Error ? err.message : undefined;
  return message?.trim() ? message : undefined;
};

export const toastService = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, options);
  },

  error(message: string, options?: ToastOptions) {
    return toast.error(message, options);
  },

  apiError(err: unknown, fallbackMessage = 'Erro inesperado', options?: ToastOptions) {
    const message = normalizeApiErrorMessage(err) ?? fallbackMessage;
    return toast.error(message, options);
  },

  info(message: string, options?: ToastOptions) {
    return toast(message, options);
  },

  warning(message: string, options?: ToastOptions) {
    return toast(message, options);
  },

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, options);
  },

  dismiss(id?: string) {
    toast.dismiss(id);
  },
};
