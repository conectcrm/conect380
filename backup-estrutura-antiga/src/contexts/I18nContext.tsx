import React, { createContext, useContext, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Configuração do i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      'pt-BR': {
        translation: {
          // Textos da aplicação em português
          common: {
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            add: 'Adicionar',
            search: 'Pesquisar',
            loading: 'Carregando...',
            error: 'Erro',
            success: 'Sucesso',
          },
          auth: {
            login: 'Entrar',
            logout: 'Sair',
            email: 'E-mail',
            password: 'Senha',
            forgotPassword: 'Esqueci minha senha',
            rememberMe: 'Lembrar de mim',
          },
          navigation: {
            dashboard: 'Dashboard',
            clients: 'Clientes',
            proposals: 'Propostas',
            products: 'Produtos',
            contracts: 'Contratos',
            financial: 'Financeiro',
            settings: 'Configurações',
          },
          clients: {
            title: 'Clientes',
            add: 'Adicionar Cliente',
            name: 'Nome',
            email: 'E-mail',
            phone: 'Telefone',
            status: 'Status',
            type: 'Tipo',
            document: 'Documento',
            company: 'Empresa',
            position: 'Cargo',
            source: 'Origem',
            estimatedValue: 'Valor Estimado',
            lastContact: 'Último Contato',
            nextContact: 'Próximo Contato',
            notes: 'Observações',
          },
        },
      },
      'en-US': {
        translation: {
          common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            search: 'Search',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
          },
          auth: {
            login: 'Sign In',
            logout: 'Sign Out',
            email: 'Email',
            password: 'Password',
            forgotPassword: 'Forgot Password',
            rememberMe: 'Remember Me',
          },
          navigation: {
            dashboard: 'Dashboard',
            clients: 'Clients',
            proposals: 'Proposals',
            products: 'Products',
            contracts: 'Contracts',
            financial: 'Financial',
            settings: 'Settings',
          },
          clients: {
            title: 'Clients',
            add: 'Add Client',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            status: 'Status',
            type: 'Type',
            document: 'Document',
            company: 'Company',
            position: 'Position',
            source: 'Source',
            estimatedValue: 'Estimated Value',
            lastContact: 'Last Contact',
            nextContact: 'Next Contact',
            notes: 'Notes',
          },
        },
      },
    },
  });

interface I18nContextData {
  language: string;
  changeLanguage: (lng: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextData>({} as I18nContextData);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const t = (key: string) => {
    return i18n.t(key);
  };

  const value: I18nContextData = {
    language: i18n.language,
    changeLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n deve ser usado dentro de um I18nProvider');
  }
  return context;
};
