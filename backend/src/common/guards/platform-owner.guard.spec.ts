import { ForbiddenException } from '@nestjs/common';
import { PlatformOwnerGuard } from './platform-owner.guard';

describe('PlatformOwnerGuard', () => {
  const originalOwnerIds = process.env.PLATFORM_OWNER_EMPRESA_IDS;
  const originalEnforceWhenEmpty = process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY;

  const createContext = (empresaId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            empresa_id: empresaId,
          },
        }),
      }),
    }) as any;

  afterEach(() => {
    if (originalOwnerIds === undefined) {
      delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
    } else {
      process.env.PLATFORM_OWNER_EMPRESA_IDS = originalOwnerIds;
    }

    if (originalEnforceWhenEmpty === undefined) {
      delete process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY;
    } else {
      process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY = originalEnforceWhenEmpty;
    }
  });

  it('permite acesso quando usuario pertence a empresa proprietaria', () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';
    process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY = 'true';

    const guard = new PlatformOwnerGuard();
    expect(guard.canActivate(createContext('owner-tenant-id'))).toBe(true);
  });

  it('bloqueia acesso quando usuario nao pertence a empresa proprietaria', () => {
    process.env.PLATFORM_OWNER_EMPRESA_IDS = 'owner-tenant-id';
    process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY = 'true';

    const guard = new PlatformOwnerGuard();
    expect(() => guard.canActivate(createContext('regular-tenant-id'))).toThrow(ForbiddenException);
  });

  it('bloqueia acesso quando lista owner nao estiver configurada', () => {
    delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
    process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY = 'true';

    const guard = new PlatformOwnerGuard();
    expect(() => guard.canActivate(createContext('owner-tenant-id'))).toThrow(ForbiddenException);
  });

  it('permite acesso quando lista owner vazia e enforce desabilitado', () => {
    delete process.env.PLATFORM_OWNER_EMPRESA_IDS;
    process.env.PLATFORM_OWNER_ENFORCE_WHEN_EMPTY = 'false';

    const guard = new PlatformOwnerGuard();
    expect(guard.canActivate(createContext('qualquer-tenant'))).toBe(true);
  });
});
