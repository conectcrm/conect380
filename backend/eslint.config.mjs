import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['**/*.spec.ts'],
  },
  {
    files: ['src/**/*.ts'],
    ignores: [
      'dist',
      'node_modules',
      'migrations',
      'test',
      '*.ts',
      '*.d.ts',
      '**/*.spec.ts',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
      ],

      // Code quality rules
      'no-console': 'off',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-throw-literal': 'error',
      'no-duplicate-imports': 'error',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['src/scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/notifications/**/*.ts', 'src/routes/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['src/modules/users/**/*.ts', 'src/modules/triagem/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: 'off',
      'no-duplicate-imports': 'off',
    },
  },
  {
    files: ['src/modules/propostas/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: 'off',
    },
  },
  {
    files: ['src/utils/**/*.ts', 'src/services/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['src/modules/planos/**/*.ts', 'src/modules/produtos/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['src/modules/pagamentos/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
    },
  },
  {
    files: ['src/modules/orquestrador/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: 'off',
      'no-duplicate-imports': 'off',
    },
  },
  {
    files: ['src/modules/oportunidades/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['src/modules/**/*.ts', 'src/common/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      eqeqeq: 'off',
    },
  },
  {
    files: ['src/cotacao/**/*.ts', 'src/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      eqeqeq: 'off',
    },
  },
  {
    files: ['src/modules/atendimento/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/naming-convention': 'off',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      eqeqeq: 'off',
    },
  },
  {
    files: ['src/modules/ia/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/naming-convention': 'off',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      eqeqeq: 'off',
    },
  },
  {
    files: ['src/empresas/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-duplicate-imports': 'off',
      eqeqeq: 'off',
    },
  },
  prettier,
];
