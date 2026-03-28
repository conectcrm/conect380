import 'reflect-metadata';
import { PATH_METADATA } from '@nestjs/common/constants';
import { CoreAdminController } from './core-admin.controller';

describe('CoreAdminController', () => {
  it('usa namespace core-admin', () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, CoreAdminController);
    expect(controllerPath).toBe('core-admin');
  });

  it('retorna payload de health canonico', () => {
    const controller = new CoreAdminController({} as never);
    const result = controller.health({
      user: { id: 'user-1', role: 'superadmin' },
    } as never);

    expect(result).toMatchObject({
      namespace: 'core-admin',
      isolated: true,
      actor: 'user-1',
      role: 'superadmin',
      canonical: true,
    });
    expect(typeof result.timestamp).toBe('string');
  });
});
