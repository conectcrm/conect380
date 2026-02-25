import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { ConfirmationOptions, useConfirmation } from '../hooks/useConfirmation';

type ConfirmInput = string | ConfirmationOptions;

interface GlobalConfirmationContextData {
  confirm: (input: ConfirmInput) => Promise<boolean>;
}

const GlobalConfirmationContext = createContext<GlobalConfirmationContextData | undefined>(
  undefined,
);

interface GlobalConfirmationProviderProps {
  children: ReactNode;
}

const normalizeInput = (input: ConfirmInput): ConfirmationOptions => {
  if (typeof input === 'string') {
    return { message: input };
  }
  return input;
};

export const GlobalConfirmationProvider: React.FC<GlobalConfirmationProviderProps> = ({
  children,
}) => {
  const { confirmationState, showConfirmation } = useConfirmation();

  const confirm = useCallback(
    (input: ConfirmInput) =>
      new Promise<boolean>((resolve) => {
        const options = normalizeInput(input);

        showConfirmation({
          ...options,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [showConfirmation],
  );

  const value = useMemo<GlobalConfirmationContextData>(
    () => ({
      confirm,
    }),
    [confirm],
  );

  return (
    <GlobalConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationModal confirmationState={confirmationState} />
    </GlobalConfirmationContext.Provider>
  );
};

export const useGlobalConfirmation = (): GlobalConfirmationContextData => {
  const context = useContext(GlobalConfirmationContext);
  if (!context) {
    throw new Error(
      'useGlobalConfirmation must be used within a GlobalConfirmationProvider',
    );
  }
  return context;
};

export default GlobalConfirmationContext;
