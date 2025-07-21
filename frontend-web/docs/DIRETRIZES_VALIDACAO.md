# 📋 DIRETRIZES DE VALIDAÇÃO - FÊNIX CRM

## 🎯 **Padrão Obrigatório para Formulários**

### ✅ **Regras de Validação:**

1. **Campos obrigatórios** devem ter `required`
2. **Validação de formato** para e-mail, CPF, CNPJ, telefone, etc.
3. **Tamanho mínimo/máximo** quando necessário (ex: senha, nome)
4. **Só permitir números** em campos numéricos (ex: telefone, valor)
5. **Validação condicional** (ex: se tipoCliente == "PJ", exibir e validar CNPJ)
6. **Formulário de senha** deve incluir campo de confirmação
7. **Validar dados** com esquema usando Yup ou Zod se estiver usando React Hook Form ou Formik
8. **Sempre exibir mensagens** de erro amigáveis abaixo de cada campo
9. **Desabilitar botão "Salvar"** enquanto houver campos inválidos
10. **Preparar estrutura** para integração com validação backend via API

---

## 🛠️ **Implementação Técnica**

### **Stack de Validação:**
- **React Hook Form** + **Yup** para esquemas de validação
- **Máscaras** com react-input-mask ou similar
- **Validação assíncrona** para campos únicos (email, CNPJ)

### **Exemplo de Esquema Yup:**
```javascript
import * as yup from 'yup';

const clienteSchema = yup.object({
  nome: yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: yup.string()
    .required('E-mail é obrigatório')
    .email('E-mail deve ter um formato válido'),
  
  telefone: yup.string()
    .required('Telefone é obrigatório')
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve seguir o formato (11) 99999-9999'),
  
  tipo: yup.string()
    .required('Tipo de cliente é obrigatório')
    .oneOf(['pessoa_fisica', 'pessoa_juridica'], 'Tipo inválido'),
  
  cpf: yup.string()
    .when('tipo', {
      is: 'pessoa_fisica',
      then: (schema) => schema
        .required('CPF é obrigatório para pessoa física')
        .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve seguir o formato 000.000.000-00'),
      otherwise: (schema) => schema.nullable()
    }),
  
  cnpj: yup.string()
    .when('tipo', {
      is: 'pessoa_juridica',
      then: (schema) => schema
        .required('CNPJ é obrigatório para pessoa jurídica')
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve seguir o formato 00.000.000/0000-00'),
      otherwise: (schema) => schema.nullable()
    }),
});
```

### **Exemplo de Componente de Campo:**
```jsx
const FormField = ({ name, label, type = "text", mask, required, error, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {mask ? (
        <InputMask
          mask={mask}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
      ) : (
        <input
          type={type}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## 📱 **Padrões Específicos por Tipo**

### **🧑‍💼 Clientes:**
- Nome completo (2-100 caracteres)
- E-mail único no sistema
- Telefone com máscara (11) 99999-9999
- CPF/CNPJ conforme tipo
- Validação condicional de campos empresa

### **💰 Propostas:**
- Título obrigatório
- Valor numérico positivo
- Data de vencimento futura
- Cliente obrigatório (select)

### **👤 Usuários:**
- Nome completo
- E-mail único
- Senha forte (8+ caracteres, maiúscula, minúscula, número)
- Confirmação de senha
- Role obrigatória

### **🏢 Empresas:**
- Razão social
- CNPJ único e válido
- E-mail corporativo
- Telefone comercial

---

## 🎨 **Padrões de UX**

### **Estados Visuais:**
- ✅ **Campo válido**: borda verde sutil
- ❌ **Campo inválido**: borda vermelha + mensagem
- ⏳ **Validando**: spinner pequeno no campo
- 💾 **Salvando**: botão com loading

### **Mensagens de Erro:**
- Específicas e claras
- Em português brasileiro
- Sugestão de correção quando possível
- Posicionadas abaixo do campo

### **Experiência do Usuário:**
- Validação em tempo real (onChange)
- Foco automático no primeiro erro
- Scroll suave para campos com erro
- Confirmação visual de sucesso

---

## 🔧 **Utilitários de Validação**

### **Funções Helper:**
```javascript
// utils/validation.js

export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
export const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
export const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const validateCPF = (cpf) => {
  // Implementar algoritmo de validação de CPF
};

export const validateCNPJ = (cnpj) => {
  // Implementar algoritmo de validação de CNPJ
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
```

---

## 📦 **Dependências Necessárias**

```json
{
  "react-hook-form": "^7.45.0",
  "yup": "^1.2.0",
  "@hookform/resolvers": "^3.1.0",
  "react-input-mask": "^2.0.4",
  "react-hot-toast": "^2.4.0"
}
```

---

## 🚀 **Checklist de Implementação**

### Antes de criar um modal:
- [ ] Definir esquema Yup de validação
- [ ] Configurar React Hook Form
- [ ] Implementar máscaras necessárias
- [ ] Preparar mensagens de erro
- [ ] Configurar validação condicional
- [ ] Testar todos os cenários de erro
- [ ] Implementar feedback visual
- [ ] Verificar acessibilidade (a11y)

### Após implementação:
- [ ] Testar com dados inválidos
- [ ] Verificar responsividade
- [ ] Validar integração com API
- [ ] Documentar casos especiais
- [ ] Revisar UX com usuários

---

**💡 Lembre-se:** Boa validação = melhor experiência do usuário = menos suporte = mais produtividade!
