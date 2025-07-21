"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var yup_1 = require("@hookform/resolvers/yup");
var yup = require("yup");
// Schema de teste simplificado
var testSchema = yup.object({
    nome: yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: yup.string().required('E-mail é obrigatório').email('E-mail deve ter um formato válido'),
    telefone: yup.string().required('Telefone é obrigatório'),
    status: yup.string().required('Status é obrigatório').oneOf(['lead', 'prospect', 'cliente', 'inativo'], 'Status inválido')
});
var ClienteModalTest = function () {
    var _a = (0, react_hook_form_1.useForm)({
        resolver: (0, yup_1.yupResolver)(testSchema),
        mode: 'onChange',
        defaultValues: {
            nome: '',
            email: '',
            telefone: '',
            status: 'lead'
        }
    }), register = _a.register, handleSubmit = _a.handleSubmit, _b = _a.formState, errors = _b.errors, isValid = _b.isValid, isSubmitting = _b.isSubmitting, isDirty = _b.isDirty;
    var onSubmit = function (data) {
        console.log('Dados do formulário:', data);
    };
    console.log('Estado do formulário:', { isValid: isValid, isDirty: isDirty, errors: errors });
    return (<div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Teste de Validação</h2>
      
      <form onSubmit={handleSubmit(onSubmit, function (errors) {
            console.log('Erros de validação:', errors);
        })}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input {...register('nome')} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Digite o nome"/>
            {errors.nome && <span className="text-red-500 text-sm">{errors.nome.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input {...register('email')} type="email" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Digite o email"/>
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input {...register('telefone')} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Digite o telefone"/>
            {errors.telefone && <span className="text-red-500 text-sm">{errors.telefone.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select {...register('status')} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="cliente">Cliente</option>
              <option value="inativo">Inativo</option>
            </select>
            {errors.status && <span className="text-red-500 text-sm">{errors.status.message}</span>}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm">
              <span className={"".concat(isValid ? 'text-green-600' : 'text-red-600')}>
                isValid: {isValid ? 'true' : 'false'}
              </span>
              <br />
              <span className="text-gray-600">
                isDirty: {isDirty ? 'true' : 'false'}
              </span>
            </div>
            
            <button type="submit" disabled={!isValid || isSubmitting} className={"px-4 py-2 rounded-md font-medium ".concat(isValid && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed')}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </form>
    </div>);
};
exports["default"] = ClienteModalTest;
