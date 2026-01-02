type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
  message?: string;
};

const extractApiMessage = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const responseMessage = (error as ApiErrorResponse).response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join('. ');
  }

  if (typeof responseMessage === 'string') {
    return responseMessage;
  }

  return undefined;
};

export const getErrorMessage = (error: unknown, fallback = 'Erro inesperado'): string => {
  const apiMessage = extractApiMessage(error);

  if (apiMessage) {
    return apiMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
