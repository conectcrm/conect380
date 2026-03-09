import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { LegacyAdminTransitionGuard } from '../admin/guards/legacy-admin-transition.guard';
import { PlanosController } from './planos.controller';

describe('PlanosController (legacy write transition)', () => {
  const methodNames: Array<keyof PlanosController> = [
    'criar',
    'atualizar',
    'remover',
    'desativar',
    'ativar',
    'toggleStatus',
  ];

  it.each(methodNames)(
    'aplica LegacyAdminTransitionGuard no metodo de escrita %s',
    (methodName) => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, PlanosController.prototype[methodName]);
      expect(Array.isArray(guards)).toBe(true);
      expect(guards).toContain(LegacyAdminTransitionGuard);
    },
  );
});
