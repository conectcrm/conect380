import { useState, useCallback } from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../useNotification';

interface SecureFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  permissions?: {
    read?: string[];
    write?: string[];
    fields?: Record<string, string[]>; // Permissões por campo
  };
  auditConfig?: {
    entityType: string;
    entityId?: string;
    trackFields?: string[];
  };
  securityConfig?: {
    requireConfirmation?: boolean;
    confirmationMessage?: string;
    rateLimitMs?: number; // Rate limiting por usuário
    sanitizeFields?: string[]; // Campos que precisam de sanitização
  };
}

interface FormSecurity {
  isSubmitting: boolean;
  hasPermission: (action: 'read' | 'write', field?: string) => boolean;
  validateSecurity: () => boolean;
  sanitizeData: (data: any) => any;
  lastSubmitTime: number;
}

export function useSecureForm<T extends FieldValues>(
  options: SecureFormOptions<T>
): UseFormReturn<T> & {
  security: FormSecurity;
  submitSecure: () => Promise<void>;
  canEditField: (field: Path<T>) => boolean;
  canViewField: (field: Path<T>) => boolean;
} {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Configurar react-hook-form com validações
  const form = useForm<T>({
    resolver: zodResolver(options.schema),
    mode: 'onChange'
  });

  // Verificar permissões
  const hasPermission = useCallback((action: 'read' | 'write', field?: string) => {
    if (!user) return false;

    // Verificar permissão geral
    const generalPermissions = options.permissions?.[action];
    if (generalPermissions) {
      // TODO: Implementar validação de permissão quando necessário
      console.log('Permission check needed for:', generalPermissions);
    }

    // Verificar permissão por campo
    if (field && options.permissions?.fields?.[field]) {
      // TODO: Implementar validação de permissão de campo quando necessário
      console.log('Field permission check needed for:', field);
      return true;
    }

    return true;
  }, [user, options.permissions]);

  // Validar segurança geral
  const validateSecurity = useCallback(() => {
    // Rate limiting
    if (options.securityConfig?.rateLimitMs) {
      const now = Date.now();
      if (now - lastSubmitTime < options.securityConfig.rateLimitMs) {
        showNotification({
          tipo: 'aviso',
          titulo: 'Ação muito rápida',
          mensagem: 'Aguarde antes de tentar novamente.'
        });
        return false;
      }
    }

    // Verificar permissão de escrita
    if (!hasPermission('write')) {
      showNotification({
        tipo: 'erro',
        titulo: 'Sem permissão',
        mensagem: 'Você não tem permissão para realizar esta ação.'
      });
      return false;
    }

    return true;
  }, [lastSubmitTime, options.securityConfig?.rateLimitMs, hasPermission]);

  // Sanitizar dados
  const sanitizeData = useCallback((data: T) => {
    if (!options.securityConfig?.sanitizeFields) return data;

    const sanitizedData = { ...data };
    
    options.securityConfig.sanitizeFields.forEach(field => {
      if (sanitizedData[field as keyof T] && typeof sanitizedData[field as keyof T] === 'string') {
        // Sanitização básica: remover scripts e tags perigosas
        let value = sanitizedData[field as keyof T] as string;
        value = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/javascript:/gi, '');
        
        sanitizedData[field as keyof T] = value as T[keyof T];
      }
    });

    return sanitizedData;
  }, [options.securityConfig?.sanitizeFields]);

  // Submit seguro
  const submitSecure = useCallback(async () => {
    if (!validateSecurity()) return;

    // Confirmação se necessária
    if (options.securityConfig?.requireConfirmation) {
      const message = options.securityConfig.confirmationMessage || 'Tem certeza que deseja continuar?';
      if (!window.confirm(message)) return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(Date.now());

    try {
      const data = form.getValues();
      const sanitizedData = sanitizeData(data);
      
      // Validar dados com schema
      const validatedData = options.schema.parse(sanitizedData);
      
      // Executar submit
      await options.onSubmit(validatedData);
      
      // Auditoria
      if (options.auditConfig) {
        // TODO: Implementar auditoria de formulário
        console.log('Audit log:', {
          action: 'FORM_SUBMIT',
          entityType: options.auditConfig.entityType,
          entityId: options.auditConfig.entityId,
          userId: user?.id,
          changes: validatedData,
          timestamp: new Date()
        });
      }
      
      options.onSuccess?.(validatedData);
      
      showNotification({
        tipo: 'sucesso',
        titulo: 'Sucesso!',
        mensagem: 'Dados salvos com sucesso.'
      });

    } catch (error: any) {
      console.error('Form submission error:', error);
      
      options.onError?.(error);
      
      if (error instanceof z.ZodError) {
        // Tratar erros de validação do Zod
        error.errors.forEach(err => {
          form.setError(err.path.join('.') as Path<T>, {
            type: 'manual',
            message: err.message
          });
        });
        
        showNotification({
          tipo: 'erro',
          titulo: 'Dados inválidos',
          mensagem: 'Verifique os campos marcados em vermelho.'
        });
      } else {
        showNotification({
          tipo: 'erro',
          titulo: 'Erro ao salvar',
          mensagem: error.message || 'Erro inesperado ao salvar os dados.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateSecurity,
    options,
    form,
    sanitizeData,
    user?.id
  ]);

  // Verificar se pode editar campo específico
  const canEditField = useCallback((field: Path<T>) => {
    return hasPermission('write', field);
  }, [hasPermission]);

  // Verificar se pode visualizar campo específico
  const canViewField = useCallback((field: Path<T>) => {
    return hasPermission('read', field);
  }, [hasPermission]);

  const security: FormSecurity = {
    isSubmitting,
    hasPermission,
    validateSecurity,
    sanitizeData,
    lastSubmitTime
  };

  return {
    ...form,
    security,
    submitSecure,
    canEditField,
    canViewField
  };
}
