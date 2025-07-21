"use strict";
exports.__esModule = true;
var react_1 = require("react");
var I18nContext_1 = require("../../contexts/I18nContext");
var PropostasPage = function () {
    var t = (0, I18nContext_1.useI18n)().t;
    return (<div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('navigation.proposals')}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="btn-primary">
            Adicionar Proposta
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <div className="text-center py-8 text-gray-500">
            Módulo de propostas será implementado aqui com:
            <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
              <li>• Criação de propostas comerciais</li>
              <li>• Funil de vendas interativo</li>
              <li>• Exportação para PDF</li>
              <li>• Acompanhamento de status</li>
              <li>• Histórico de negociações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>);
};
exports["default"] = PropostasPage;
