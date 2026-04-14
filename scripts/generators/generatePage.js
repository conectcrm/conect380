#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração de cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const MODULE_OPTIONS = ['ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'BILLING', 'ADMINISTRACAO'];
const ROLE_OPTIONS = ['superadmin', 'admin', 'gerente', 'vendedor', 'suporte', 'financeiro'];

class PageGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {
      entityName: '',
      entityDisplayName: '',
      entityNamePlural: '',
      fields: [],
      permissions: [],
      module: 'CRM',
      roles: ['superadmin', 'admin'],
      routePath: '',
      hasAudit: true,
      hasExport: true,
      hasFilters: true
    };
  }

  async generate() {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('🏗️  Gerador de Páginas ConectCRM');
    console.log('=====================================');
    console.log(`${colors.reset}`);
    console.log('Este gerador criará uma página completa com:');
    console.log('✅ CRUD com API integrada');
    console.log('✅ Formulários com validação e segurança');
    console.log('✅ Tabela com filtros e paginação');
    console.log('✅ Sistema de permissões');
    console.log('✅ Auditoria automática');
    console.log('✅ Testes unitários');
    console.log('');

    try {
      await this.collectEntityInfo();
      await this.collectFields();
      await this.collectPermissions();
      await this.collectGovernance();
      await this.collectFeatures();
      
      console.log(`${colors.yellow}Gerando arquivos...${colors.reset}`);
      
      await this.generateFiles();
      
      console.log(`${colors.green}${colors.bright}`);
      console.log('✅ Página gerada com sucesso!');
      console.log(`${colors.reset}`);
      console.log('Arquivos criados:');
      console.log(`  📄 ${this.getPagePath()}`);
      console.log(`  🔧 ${this.getServicePath()}`);
      console.log(`  🧪 ${this.getTestPath()}`);
      console.log(`  📘 ${this.getTypesPath()}`);
      console.log(`  🗂️  ${this.getGovernancePath()}`);
      console.log('');
      console.log('Próximos passos:');
      console.log('1. Implementar as rotas da API no backend');
      console.log('2. Adicionar a nova página às rotas do frontend');
      console.log('3. Atualizar menuConfig com requiredModule e permissions');
      console.log('4. Validar perfis do role matrix com o manifesto gerado');
      console.log('5. Executar os testes');

    } catch (error) {
      console.error(`${colors.red}Erro: ${error.message}${colors.reset}`);
    } finally {
      this.rl.close();
    }
  }

  async collectEntityInfo() {
    console.log(`${colors.blue}📝 Informações da Entidade${colors.reset}`);
    
    this.config.entityName = await this.question('Nome da entidade (ex: Usuario, Produto): ');
    this.config.entityDisplayName = await this.question('Nome para exibição (ex: Usuário, Produto): ');
    this.config.entityNamePlural = await this.question('Nome no plural (ex: Usuários, Produtos): ');
    
    console.log('');
  }

  async collectFields() {
    console.log(`${colors.blue}🏗️  Campos da Entidade${colors.reset}`);
    console.log('Digite os campos um por vez. Pressione Enter sem digitar para finalizar.');
    console.log('Formato: nome:tipo (ex: nome:string, idade:number, ativo:boolean)');
    console.log('');

    while (true) {
      const fieldInput = await this.question('Campo (nome:tipo): ');
      
      if (!fieldInput.trim()) break;
      
      const [name, type] = fieldInput.split(':');
      if (!name || !type) {
        console.log(`${colors.red}Formato inválido. Use nome:tipo${colors.reset}`);
        continue;
      }
      
      const required = (await this.question('É obrigatório? (s/N): ')).toLowerCase() === 's';
      const searchable = (await this.question('É pesquisável? (s/N): ')).toLowerCase() === 's';
      
      this.config.fields.push({
        name: name.trim(),
        type: type.trim(),
        required,
        searchable
      });
      
      console.log(`${colors.green}✓ Campo ${name} adicionado${colors.reset}`);
    }
    
    console.log('');
  }

  async collectPermissions() {
    console.log(`${colors.blue}🔐 Configuração de Permissões${colors.reset}`);
    
    const entityLower = this.config.entityName.toLowerCase();
    const defaultPermissions = [
      `${entityLower}.read`,
      `${entityLower}.create`, 
      `${entityLower}.update`,
      `${entityLower}.delete`
    ];
    
    console.log('Permissões padrão sugeridas:');
    defaultPermissions.forEach(perm => console.log(`  - ${perm}`));
    
    const useDefault = (await this.question('Usar permissões padrão? (S/n): ')).toLowerCase() !== 'n';
    
    if (useDefault) {
      this.config.permissions = defaultPermissions;
    } else {
      console.log('Digite as permissões personalizadas:');
      while (true) {
        const permission = await this.question('Permissão: ');
        if (!permission.trim()) break;
        this.config.permissions.push(permission.trim());
      }
    }
    
    console.log('');
  }

  async collectGovernance() {
    console.log(`${colors.blue}🧭 Governança (módulo e perfis)${colors.reset}`);
    console.log(`Módulos disponíveis: ${MODULE_OPTIONS.join(', ')}`);

    const moduleInputRaw = await this.question(
      `Módulo da funcionalidade (padrão: ${this.config.module}): `
    );
    const moduleInput = moduleInputRaw.trim().toUpperCase();
    if (moduleInput) {
      if (!MODULE_OPTIONS.includes(moduleInput)) {
        throw new Error(`Módulo inválido: ${moduleInput}. Use um dos módulos listados.`);
      }
      this.config.module = moduleInput;
    }

    console.log(`Perfis disponíveis: ${ROLE_OPTIONS.join(', ')}`);
    const roleInputRaw = await this.question(
      `Perfis autorizados (csv, padrão: ${this.config.roles.join(',')}): `
    );
    const roleInput = roleInputRaw.trim().toLowerCase();
    if (roleInput) {
      const roles = roleInput
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);

      const invalidRoles = roles.filter((role) => !ROLE_OPTIONS.includes(role));
      if (invalidRoles.length > 0) {
        throw new Error(
          `Perfis inválidos: ${invalidRoles.join(', ')}. Use apenas: ${ROLE_OPTIONS.join(', ')}`
        );
      }

      this.config.roles = Array.from(new Set(roles));
    }

    const routeSuggestion = `/${this.config.entityNamePlural.toLowerCase()}`;
    const routeInputRaw = await this.question(
      `Rota principal da funcionalidade (padrão: ${routeSuggestion}): `
    );
    this.config.routePath = routeInputRaw.trim() || routeSuggestion;

    console.log('');
  }

  async collectFeatures() {
    console.log(`${colors.blue}⚙️  Funcionalidades${colors.reset}`);
    
    this.config.hasAudit = (await this.question('Incluir auditoria? (S/n): ')).toLowerCase() !== 'n';
    this.config.hasExport = (await this.question('Incluir exportação? (S/n): ')).toLowerCase() !== 'n';
    this.config.hasFilters = (await this.question('Incluir filtros avançados? (S/n): ')).toLowerCase() !== 'n';
    
    console.log('');
  }

  async generateFiles() {
    // Gerar página principal
    const pageContent = this.generatePageContent();
    fs.writeFileSync(this.getPagePath(), pageContent);
    
    // Gerar serviço
    const serviceContent = this.generateServiceContent();
    fs.writeFileSync(this.getServicePath(), serviceContent);
    
    // Gerar tipos
    const typesContent = this.generateTypesContent();
    fs.writeFileSync(this.getTypesPath(), typesContent);
    
    // Gerar testes
    const testContent = this.generateTestContent();
    fs.writeFileSync(this.getTestPath(), testContent);

    // Gerar manifesto de governanca
    const governanceContent = this.generateGovernanceContent();
    const governancePath = this.getGovernancePath();
    fs.mkdirSync(path.dirname(governancePath), { recursive: true });
    fs.writeFileSync(governancePath, governanceContent);
  }

  generatePageContent() {
    const template = fs.readFileSync(path.join(__dirname, '../../templates/PageTemplate/PageTemplate.tsx'), 'utf8');
    
    const replacements = {
      '{{ENTITY_NAME}}': this.config.entityName,
      '{{ENTITY_DISPLAY_NAME}}': this.config.entityDisplayName,
      '{{entity_name}}': this.config.entityName.toLowerCase(),
      '{{entity_name_plural}}': this.config.entityNamePlural.toLowerCase(),
      '{{ENTITY_FIELDS}}': this.generateFieldsInterface(),
      '{{ENTITY_SCHEMA_FIELDS}}': this.generateSchemaFields(),
      '{{TABLE_COLUMNS}}': this.generateTableColumns(),
      '{{FORM_FIELDS}}': this.generateFormFields(),
      '{{FORM_RESET_CODE}}': this.generateFormResetCode(),
      '{{SANITIZE_FIELDS}}': this.generateSanitizeFields()
    };
    
    let content = template;
    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
    });
    
    return content;
  }

  generateServiceContent() {
    const entityLower = this.config.entityName.toLowerCase();
    const entityPlural = this.config.entityNamePlural.toLowerCase();
    
    return `import { api } from './api';
import { ${this.config.entityName} } from '../types/${entityLower}Types';

export const ${entityLower}Service = {
  async listar(): Promise<${this.config.entityName}[]> {
    const response = await api.get('/${entityPlural}');
    return response.data;
  },

  async buscarPorId(id: string): Promise<${this.config.entityName}> {
    const response = await api.get(\`/${entityPlural}/\${id}\`);
    return response.data;
  },

  async criar(data: Partial<${this.config.entityName}>): Promise<${this.config.entityName}> {
    const response = await api.post('/${entityPlural}', data);
    return response.data;
  },

  async atualizar(id: string, data: Partial<${this.config.entityName}>): Promise<${this.config.entityName}> {
    const response = await api.put(\`/${entityPlural}/\${id}\`, data);
    return response.data;
  },

  async deletar(id: string): Promise<void> {
    await api.delete(\`/${entityPlural}/\${id}\`);
  }
};`;
  }

  generateTypesContent() {
    return `export interface ${this.config.entityName} {
  id: string;
${this.config.fields.map(field => `  ${field.name}: ${this.mapFieldType(field.type)};`).join('\n')}
  createdAt: string;
  updatedAt: string;
}

export interface Criar${this.config.entityName}Request {
${this.config.fields.map(field => `  ${field.name}${field.required ? '' : '?'}: ${this.mapFieldType(field.type)};`).join('\n')}
}

export interface Atualizar${this.config.entityName}Request {
${this.config.fields.map(field => `  ${field.name}?: ${this.mapFieldType(field.type)};`).join('\n')}
}`;
  }

  generateTestContent() {
    const entityLower = this.config.entityName.toLowerCase();
    
    return `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ${this.config.entityName}Page from '../${this.config.entityName}Page';
import { ${entityLower}Service } from '../../services/${entityLower}Service';

// Mock do serviço
jest.mock('../../services/${entityLower}Service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('${this.config.entityName}Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page correctly', () => {
    render(<${this.config.entityName}Page />, { wrapper: createWrapper() });
    
    expect(screen.getByText('${this.config.entityDisplayName}')).toBeInTheDocument();
    expect(screen.getByText('Novo ${this.config.entityDisplayName}')).toBeInTheDocument();
  });

  it('should open create modal when clicking new button', () => {
    render(<${this.config.entityName}Page />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Novo ${this.config.entityDisplayName}'));
    
    expect(screen.getByText('Novo ${this.config.entityDisplayName}')).toBeInTheDocument();
  });

  // TODO: Adicionar mais testes específicos
});`;
  }

  generateGovernanceContent() {
    const manifest = {
      feature: {
        id: this.config.entityName.toLowerCase(),
        entityName: this.config.entityName,
        displayName: this.config.entityDisplayName
      },
      ownership: {
        module: this.config.module,
        allowedRoles: this.config.roles
      },
      access: {
        routePath: this.config.routePath,
        permissions: this.config.permissions
      },
      checklist: [
        'Atualizar menuConfig.requiredModule para o modulo informado',
        'Atualizar menuConfig.permissions e ROUTE_PERMISSION_RULES',
        'Garantir cobertura no catalogo de permissoes e defaults por role',
        'Adicionar/atualizar testes de permissao e rota'
      ],
      generatedAt: new Date().toISOString()
    };

    return `${JSON.stringify(manifest, null, 2)}\n`;
  }

  generateFieldsInterface() {
    return this.config.fields.map(field => 
      `${field.name}: ${this.mapFieldType(field.type)};`
    ).join('\n  ');
  }

  generateSchemaFields() {
    return this.config.fields.map(field => {
      const zodType = this.mapZodType(field.type);
      const validation = field.required ? zodType : `${zodType}.optional()`;
      return `${field.name}: ${validation}`;
    }).join(',\n  ');
  }

  generateTableColumns() {
    return this.config.fields.map(field => `{
    key: '${field.name}',
    title: '${this.capitalize(field.name)}',
    type: '${this.mapTableType(field.type)}',
    sortable: true,
    filterable: ${field.searchable}
  }`).join(',\n  ');
  }

  generateFormFields() {
    return this.config.fields.map(field => {
      const inputType = this.mapInputType(field.type);
      return `<div>
            <label htmlFor="${field.name}" className="block text-sm font-medium text-gray-700">
              ${this.capitalize(field.name)}
            </label>
            <Input
              id="${field.name}"
              type="${inputType}"
              {...form.register('${field.name}')}
              disabled={!form.canEditField('${field.name}')}
              error={form.formState.errors.${field.name}?.message}
              required={${field.required}}
            />
          </div>`;
    }).join('\n          ');
  }

  generateFormResetCode() {
    const resetFields = this.config.fields.map(field => 
      `${field.name}: crudState.selectedItem.${field.name}`
    ).join(',\n        ');
    
    return `form.reset({
        ${resetFields}
      });`;
  }

  generateSanitizeFields() {
    const stringFields = this.config.fields
      .filter(field => field.type === 'string')
      .map(field => `'${field.name}'`);
    
    return stringFields.join(', ');
  }

  mapFieldType(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'string',
      'email': 'string',
      'text': 'string'
    };
    return typeMap[type] || 'string';
  }

  mapZodType(type) {
    const zodMap = {
      'string': 'z.string()',
      'number': 'z.number()',
      'boolean': 'z.boolean()',
      'date': 'z.string().datetime()',
      'email': 'z.string().email()',
      'text': 'z.string()'
    };
    return zodMap[type] || 'z.string()';
  }

  mapTableType(type) {
    const tableMap = {
      'string': 'text',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'email': 'text',
      'text': 'text'
    };
    return tableMap[type] || 'text';
  }

  mapInputType(type) {
    const inputMap = {
      'string': 'text',
      'number': 'number',
      'boolean': 'checkbox',
      'date': 'date',
      'email': 'email',
      'text': 'text'
    };
    return inputMap[type] || 'text';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getPagePath() {
    return path.join(__dirname, `../../frontend-web/src/pages/${this.config.entityName}Page.tsx`);
  }

  getServicePath() {
    return path.join(__dirname, `../../frontend-web/src/services/${this.config.entityName.toLowerCase()}Service.ts`);
  }

  getTypesPath() {
    return path.join(__dirname, `../../frontend-web/src/types/${this.config.entityName.toLowerCase()}Types.ts`);
  }

  getTestPath() {
    return path.join(__dirname, `../../frontend-web/src/pages/__tests__/${this.config.entityName}Page.test.tsx`);
  }

  getGovernancePath() {
    return path.join(
      __dirname,
      `../../docs/feature-governance/${this.config.entityName.toLowerCase()}.feature.json`
    );
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new PageGenerator();
  generator.generate().catch(console.error);
}

module.exports = PageGenerator;
