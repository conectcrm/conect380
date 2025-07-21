"use strict";
exports.__esModule = true;
exports.useI18n = exports.I18nProvider = void 0;
var react_1 = require("react");
var i18next_1 = require("i18next");
var react_i18next_1 = require("react-i18next");
var i18next_browser_languagedetector_1 = require("i18next-browser-languagedetector");
// Configuração do i18next
i18next_1["default"]
    .use(i18next_browser_languagedetector_1["default"])
    .use(react_i18next_1.initReactI18next)
    .init({
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
        escapeValue: false
    },
    resources: {
        'pt-BR': {
            translation: {
                // Textos da aplicação em português
                common: {
                    save: 'Salvar',
                    cancel: 'Cancelar',
                    "delete": 'Excluir',
                    edit: 'Editar',
                    add: 'Adicionar',
                    search: 'Pesquisar',
                    loading: 'Carregando...',
                    error: 'Erro',
                    success: 'Sucesso'
                },
                auth: {
                    login: 'Entrar',
                    logout: 'Sair',
                    email: 'E-mail',
                    password: 'Senha',
                    forgotPassword: 'Esqueci minha senha',
                    rememberMe: 'Lembrar de mim'
                },
                navigation: {
                    dashboard: 'Dashboard',
                    clients: 'Clientes',
                    proposals: 'Propostas',
                    products: 'Produtos',
                    contracts: 'Contratos',
                    financial: 'Financeiro',
                    settings: 'Configurações'
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
                    notes: 'Observações'
                }
            }
        },
        'en-US': {
            translation: {
                common: {
                    save: 'Save',
                    cancel: 'Cancel',
                    "delete": 'Delete',
                    edit: 'Edit',
                    add: 'Add',
                    search: 'Search',
                    loading: 'Loading...',
                    error: 'Error',
                    success: 'Success'
                },
                auth: {
                    login: 'Sign In',
                    logout: 'Sign Out',
                    email: 'Email',
                    password: 'Password',
                    forgotPassword: 'Forgot Password',
                    rememberMe: 'Remember Me'
                },
                navigation: {
                    dashboard: 'Dashboard',
                    clients: 'Clients',
                    proposals: 'Proposals',
                    products: 'Products',
                    contracts: 'Contracts',
                    financial: 'Financial',
                    settings: 'Settings'
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
                    notes: 'Notes'
                }
            }
        }
    }
});
var I18nContext = (0, react_1.createContext)({});
var I18nProvider = function (_a) {
    var children = _a.children;
    var changeLanguage = function (lng) {
        i18next_1["default"].changeLanguage(lng);
    };
    var t = function (key) {
        return i18next_1["default"].t(key);
    };
    var value = {
        language: i18next_1["default"].language,
        changeLanguage: changeLanguage,
        t: t
    };
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
exports.I18nProvider = I18nProvider;
var useI18n = function () {
    var context = (0, react_1.useContext)(I18nContext);
    if (!context) {
        throw new Error('useI18n deve ser usado dentro de um I18nProvider');
    }
    return context;
};
exports.useI18n = useI18n;
