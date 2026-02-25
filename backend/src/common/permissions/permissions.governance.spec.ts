import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import {
  ALL_PERMISSIONS,
  LEGACY_PERMISSION_ALIASES,
  PERMISSION_CATALOG,
  Permission,
  ROLE_DEFAULT_PERMISSIONS,
} from './permissions.constants';

type ControllerDecoratorViolation = {
  file: string;
  detail: string;
};

const uniqueSorted = (values: string[]): string[] => Array.from(new Set(values)).sort();

const collectControllerFiles = (directory: string): string[] => {
  const files: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectControllerFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }

  return files;
};

describe('permissions governance', () => {
  const allPermissionSet = new Set<string>(ALL_PERMISSIONS);
  const legacyAssignableSet = new Set<string>(PERMISSION_CATALOG.legacyAssignablePermissions);
  const catalogOptionValues = PERMISSION_CATALOG.groups.flatMap((group) =>
    group.options.map((option) => option.value),
  );
  const catalogOptionSet = new Set<string>(catalogOptionValues);
  const catalogCanonicalSet = new Set<string>(
    catalogOptionValues.filter((value) => allPermissionSet.has(value)),
  );
  const allowedCatalogValues = new Set<string>([
    ...Array.from(allPermissionSet),
    ...Array.from(legacyAssignableSet),
  ]);

  it('mantem enum Permission, ALL_PERMISSIONS e catalog.allPermissions sincronizados', () => {
    const enumValues = Object.values(Permission);
    expect(new Set(enumValues).size).toBe(enumValues.length);
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);

    expect(uniqueSorted(enumValues)).toEqual(uniqueSorted(ALL_PERMISSIONS));
    expect(uniqueSorted(PERMISSION_CATALOG.allPermissions)).toEqual(uniqueSorted(ALL_PERMISSIONS));
  });

  it('garante que cada permissao canonica esteja visivel no catalogo para selecao', () => {
    const missingFromGroups = ALL_PERMISSIONS.filter((permission) => !catalogCanonicalSet.has(permission));
    expect(missingFromGroups).toEqual([]);
  });

  it('aceita apenas permissoes canonicas ou legadas permitidas no catalogo', () => {
    const invalidCatalogValues = PERMISSION_CATALOG.groups.flatMap((group) =>
      group.options
        .filter((option) => !allowedCatalogValues.has(option.value))
        .map((option) => `${group.id}:${option.value}`),
    );

    expect(invalidCatalogValues).toEqual([]);
  });

  it('mantem defaults por role com permissoes canonicas e cobrindo roles principais', () => {
    const missingRoleDefaults = Object.keys(ROLE_DEFAULT_PERMISSIONS).filter(
      (role) => !Array.isArray(PERMISSION_CATALOG.defaultsByRole[role]),
    );
    expect(missingRoleDefaults).toEqual([]);

    const invalidRoleDefaults = Object.entries(PERMISSION_CATALOG.defaultsByRole).flatMap(
      ([role, permissions]) =>
        permissions
          .filter((permission) => !allPermissionSet.has(permission))
          .map((permission) => `${role}:${permission}`),
    );

    expect(invalidRoleDefaults).toEqual([]);
  });

  it('mantem tokens legados atribuiveis consistentes no catalogo', () => {
    const legacyOptionValues = PERMISSION_CATALOG.groups.flatMap((group) =>
      group.options.filter((option) => option.legacy).map((option) => option.value),
    );
    const legacyOptionSet = new Set<string>(legacyOptionValues);

    const missingLegacyOptions = PERMISSION_CATALOG.legacyAssignablePermissions.filter(
      (legacyValue) => !legacyOptionSet.has(legacyValue),
    );
    expect(missingLegacyOptions).toEqual([]);

    const unexpectedLegacyOptions = legacyOptionValues.filter(
      (legacyValue) => !legacyAssignableSet.has(legacyValue),
    );
    expect(uniqueSorted(unexpectedLegacyOptions)).toEqual([]);
  });

  it('mantem aliases legados apontando para permissoes canonicas existentes', () => {
    const invalidAliasTargets = Object.entries(LEGACY_PERMISSION_ALIASES)
      .filter(([, permission]) => !allPermissionSet.has(permission))
      .map(([alias, permission]) => `${alias}:${permission}`);

    expect(invalidAliasTargets).toEqual([]);
  });

  it('exige @Permissions com Permission.* em controllers que usam PermissionsGuard', () => {
    const modulesRoot = path.resolve(__dirname, '../../modules');
    const controllerFiles = collectControllerFiles(modulesRoot);
    const missingPermissionsDecorator: string[] = [];
    const decoratorViolations: ControllerDecoratorViolation[] = [];

    for (const filePath of controllerFiles) {
      const source = readFileSync(filePath, 'utf8');
      if (!source.includes('PermissionsGuard')) {
        continue;
      }

      const relativePath = path.relative(path.resolve(__dirname, '../../..'), filePath).replace(/\\/g, '/');
      if (!source.includes('@Permissions(')) {
        missingPermissionsDecorator.push(relativePath);
        continue;
      }

      const permissionDecorators = source.matchAll(/@Permissions\s*\(([\s\S]*?)\)/g);
      for (const match of permissionDecorators) {
        const args = match[1] ?? '';
        const rawStringLiterals = Array.from(args.matchAll(/['"`][^'"`]+['"`]/g)).map((item) => item[0]);
        if (rawStringLiterals.length > 0) {
          decoratorViolations.push({
            file: relativePath,
            detail: `@Permissions com literal string: ${rawStringLiterals.join(', ')}`,
          });
        }

        const enumReferences = Array.from(args.matchAll(/\bPermission\.([A-Z0-9_]+)\b/g)).map(
          (item) => item[1],
        );
        if (enumReferences.length === 0) {
          decoratorViolations.push({
            file: relativePath,
            detail: '@Permissions sem uso explicito de Permission.*',
          });
          continue;
        }

        for (const enumKey of enumReferences) {
          if (!Object.prototype.hasOwnProperty.call(Permission, enumKey)) {
            decoratorViolations.push({
              file: relativePath,
              detail: `Permission.${enumKey} inexistente no enum`,
            });
            continue;
          }

          const permissionValue = Permission[enumKey as keyof typeof Permission];
          if (!catalogOptionSet.has(permissionValue)) {
            decoratorViolations.push({
              file: relativePath,
              detail: `${permissionValue} nao encontrado em PERMISSION_CATALOG.groups`,
            });
          }
        }
      }
    }

    expect(uniqueSorted(missingPermissionsDecorator)).toEqual([]);
    expect(decoratorViolations).toEqual([]);
  });
});
