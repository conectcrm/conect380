import { AsyncLocalStorage } from 'async_hooks';

type TenantStore = {
  empresaId?: string;
};

const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function runWithTenant<T>(empresaId: string, callback: () => Promise<T> | T): Promise<T> | T {
  return tenantStorage.run({ empresaId }, callback);
}

export function getCurrentTenantId(): string | undefined {
  return tenantStorage.getStore()?.empresaId;
}

export function setCurrentTenantId(empresaId?: string): void {
  const store = tenantStorage.getStore();
  if (store) {
    store.empresaId = empresaId;
  }
}
