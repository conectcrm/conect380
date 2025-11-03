import React from 'react'; import React from 'react'; import React from 'react'; import React from 'react';



// ============================================

// Select Components - Tailwind Pure

// ============================================// ============================================

// Componentes compatíveis com shadcn/ui API mas usando Tailwind puro

// Select Components - Tailwind Pure

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {

  children: React.ReactNode;// ============================================// ============================================interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {

  onValueChange?: (value: string) => void;

}// Componentes compatíveis com shadcn/ui API mas usando Tailwind puro



export const Select: React.FC<SelectProps> = ({ children, className = '', onValueChange, onChange, ...props }) => {// Select Components - Tailwind Pure  children: React.ReactNode;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

    if (onChange) onChange(e); interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {

      if(onValueChange) onValueChange(e.target.value);

    }; children: React.ReactNode;// ============================================}



    return (onValueChange?: (value: string) => void;

    <select

      className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}}// Componentes compatíveis com shadcn/ui API mas usando Tailwind puro

  onChange = { handleChange }

  {...props }

    >

    { children }export const Select: React.FC<SelectProps> = ({ children, className = '', onValueChange, onChange, ...props }) => { export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {

    </select >

  ); const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

};

if (onChange) onChange(e); interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {

// SelectTrigger é um alias para Select (compatibilidade shadcn/ui)

export const SelectTrigger = Select; if (onValueChange) onValueChange(e.target.value); return (



// SelectValue não precisa renderizar nada (placeholder é nativo do select)  };

export const SelectValue: React.FC<{ placeholder?: string }> = () => null;

children: React.ReactNode; <select

// SelectContent é apenas um wrapper (não precisa estilos próprios)

export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;  return (



// SelectItem é um option nativo do HTML    <select onValueChange?: (value: string) => void;      className = {`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {

      children: React.ReactNode;      className={`border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}}

}

      onChange={handleChange}

      export const SelectItem: React.FC<SelectItemProps> = ({children, className = '', ...props }) => {

  return (      {...props}}      {...props}

        <option

          className={`py-2 px-3 hover:bg-gray-100 ${className}`}    >

          {...props}

    >      {children}    >

          {children}

        </option>    </select>

      );

};  );export const Select: React.FC<SelectProps> = ({children, className = '', onValueChange, onChange, ...props }) => {



        // ============================================};  { children }

        // Separator Component

        // ============================================

        interface SeparatorProps {

          className ?: string;// SelectTrigger é um alias para Select (compatibilidade shadcn/ui)  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {    </select >

        orientation?: 'horizontal' | 'vertical';

}export const SelectTrigger = Select;



        export const Separator: React.FC<SeparatorProps> = ({className = '', orientation = 'horizontal'}) => {    if (onChange) onChange(e);  );

          const baseClasses = orientation === 'horizontal'

          ? 'w-full h-px bg-gray-200 my-4'// SelectValue não precisa renderizar nada (placeholder é nativo do select)

          : 'h-full w-px bg-gray-200 mx-4';

          export const SelectValue: React.FC<{ placeholder ?: string}> = () => null;    if (onValueChange) onValueChange(e.target.value);

            return <hr className={`${baseClasses} ${className}`} />;

};  };



// ============================================// SelectContent é apenas um wrapper (não precisa estilos próprios)

// Alert Components

// ============================================export const SelectContent: React.FC<{ children: React.ReactNode }> = ({children}) => <>{children}</>;};

            interface AlertProps {

              children: React.ReactNode;

            className?: string;

            variant?: 'default' | 'destructive';// SelectItem é um option nativo do HTMLinterface OptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {

            }

              interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {

export const Alert: React.FC<AlertProps> = ({children, className = '', variant = 'default'}) => {

  const variantClasses = variant === 'destructive'  children: React.ReactNode;  return(children: React.ReactNode;

                  ? 'bg-red-50 border-red-200 text-red-800'

    : 'bg-blue-50 border-blue-200 text-blue-800';}



                  return (    <select}

                  <div className={`border rounded-lg p-4 ${variantClasses} ${className}`}>

                    {children}export const SelectItem: React.FC<SelectItemProps> = ({children, className = '', ...props }) => {

    </div>

                  );  return (className = {`w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}

};

                  <option

                    interface AlertDescriptionProps {

  children: React.ReactNode;      className={`py-2 px-3 hover:bg-gray-100 ${className}`}onChange = {handleChange}export const Option: React.FC<OptionProps> = ({children, ...props }) => {

                    className ?: string;

}      {...props}



                    export const AlertDescription: React.FC<AlertDescriptionProps> = ({children, className = ''}) => {    > { ...props } return <option {...props}>{children}</option>;

                      return (

                      <div className={`text-sm ${className}`}>      {children}

                        {children}

                      </div>    </option>    >};

                    );

};  );


};{children}

                  </select >

// ============================================  );

                  // Separator Component};

                  // ============================================

                  interface SeparatorProps {// SelectTrigger - Compatibilidade API shadcn/ui

                    className ?: string;export const SelectTrigger: React.FC<SelectProps> = Select;

                      orientation?: 'horizontal' | 'vertical';

}// SelectValue - Placeholder (não precisa renderizar, select nativo gerencia)

                      export const SelectValue: React.FC<{ placeholder ?: string}> = () => null;

                        export const Separator: React.FC<SeparatorProps> = ({className = '', orientation = 'horizontal'}) => {

  const baseClasses = orientation === 'horizontal'// SelectContent - Wrapper (não precisa renderizar, apenas agrupa options)

                        ? 'w-full h-px bg-gray-200 my-4'export const SelectContent: React.FC<{ children: React.ReactNode }> = ({children}) => <>{children}</>;

                        : 'h-full w-px bg-gray-200 mx-4';

                        // SelectItem - Option nativo

                        return <hr className={`${baseClasses} ${className}`} />;interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {

                        };  children: React.ReactNode;

}

// ============================================

// Alert Componentsexport const SelectItem: React.FC<SelectItemProps> = ({children, ...props }) => {

                            // ============================================  return <option {...props}>{children}</option>;

                            interface AlertProps { };

                            children: React.ReactNode;

                            className?: string;// Separator - Linha divisória

                            variant?: 'default' | 'destructive';interface SeparatorProps {

                            }  className?: string;

}

                            export const Alert: React.FC<AlertProps> = ({children, className = '', variant = 'default'}) => {

  const variantClasses = variant === 'destructive'export const Separator: React.FC<SeparatorProps> = ({className = ''}) => {

    ? 'bg-red-50 border-red-200 text-red-800'  return <hr className={`border-t border-gray-300 my-4 ${className}`} />;

    : 'bg-blue-50 border-blue-200 text-blue-800';};



                                return (// Alert - Componente de alerta

                                <div className={`border rounded-lg p-4 ${variantClasses} ${className}`}>interface AlertProps {

                                  { children }  children: React.ReactNode;

                                </div>  variant?: 'default' | 'destructive';

                                );  className?: string;

};}



                                interface AlertDescriptionProps {export const Alert: React.FC<AlertProps> = ({children, variant = 'default', className = ''}) => {

                                  children: React.ReactNode;  const baseClass = 'rounded-lg border p-4';

                                  className?: string;  const variantClass = variant === 'destructive'

}    ? 'border-red-300 bg-red-50 text-red-900'

                                  : 'border-blue-300 bg-blue-50 text-blue-900';

                                  export const AlertDescription: React.FC<AlertDescriptionProps> = ({children, className = ''}) => {

  return (  return (

                                    <div className={`text-sm ${className}`}>    <div className={`${baseClass} ${variantClass} ${className}`}>

                                      {children}      {children}

                                    </div>    </div>

                                    );  );

};};


                                    export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({children, className = ''}) => {
  return <p className={`text-sm ${className}`}>{children}</p>;
};
