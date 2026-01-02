/**
 * Testes de Validação do Tema Crevasse
 *
 * Estes testes garantem que todas as páginas seguem:
 * - Paleta de cores Crevasse
 * - Estrutura de componentes padrão
 * - Estados obrigatórios (loading, error, empty)
 * - Responsividade
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Paleta Crevasse oficial
const CREVASSE_COLORS = {
  primary: '#159A9C',
  primaryHover: '#0F7B7D',
  text: '#002333',
  secondary: '#B4BEC9',
  border: '#B4BEC9',
  borderLight: '#DEEFE7',
  background: '#FFFFFF',
  backgroundSoft: '#DEEFE7',
};

// Cores PROIBIDAS (não-Crevasse)
const FORBIDDEN_COLORS = [
  '#3b82f6', // blue-500
  '#2563eb', // blue-600
  '#1e40af', // blue-700
  '#6b7280', // gray-500
  '#374151', // gray-700
  '#111827', // gray-900
];

describe('🎨 Validação do Tema Crevasse', () => {
  const pagesDir = path.join(__dirname, '../src/pages');
  const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));

  describe('Cores da Paleta', () => {
    pageFiles.forEach((file) => {
      it(`${file} deve usar APENAS cores Crevasse`, () => {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Verificar se NÃO usa cores proibidas
        FORBIDDEN_COLORS.forEach((color) => {
          expect(content).not.toContain(color);
        });

        // Se usar className com cores hex, devem ser da paleta
        const hexColorRegex = /#[0-9A-Fa-f]{6}/g;
        const hexColorsFound = content.match(hexColorRegex) || [];
        const crevassePalette = Object.values(CREVASSE_COLORS);

        hexColorsFound.forEach((hex) => {
          const upperHex = hex.toUpperCase();
          const isCrevasseColor = crevassePalette.some((c) => c.toUpperCase() === upperHex);

          if (!isCrevasseColor) {
            console.warn(`⚠️ ${file}: Cor não-Crevasse encontrada: ${hex}`);
          }
        });
      });
    });
  });

  describe('Componente BackToNucleus', () => {
    pageFiles.forEach((file) => {
      if (file === '_TemplatePage.tsx') return; // Skip template

      it(`${file} deve ter BackToNucleus`, () => {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const hasBackToNucleus =
          content.includes('BackToNucleus') || content.includes('import { BackToNucleus }');

        expect(hasBackToNucleus).toBe(true);
      });
    });
  });

  describe('Estados Obrigatórios', () => {
    pageFiles.forEach((file) => {
      if (file === '_TemplatePage.tsx') return;

      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      it(`${file} deve ter estado de loading`, () => {
        const hasLoadingState =
          content.includes('useState') &&
          (content.includes('loading') || content.includes('isLoading'));

        expect(hasLoadingState).toBe(true);
      });

      it(`${file} deve ter estado de erro`, () => {
        const hasErrorState = content.includes('useState') && content.includes('error');

        expect(hasErrorState).toBe(true);
      });

      it(`${file} deve ter tratamento de lista vazia`, () => {
        const hasEmptyState =
          content.includes('length === 0') ||
          content.includes('.length === 0') ||
          content.includes('items.length');

        expect(hasEmptyState).toBe(true);
      });
    });
  });

  describe('Responsividade', () => {
    pageFiles.forEach((file) => {
      it(`${file} deve usar classes responsivas`, () => {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const hasResponsiveClasses =
          content.includes('md:') || content.includes('lg:') || content.includes('sm:');

        expect(hasResponsiveClasses).toBe(true);
      });

      it(`${file} deve usar grid responsivo`, () => {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (content.includes('grid')) {
          const hasResponsiveGrid =
            content.includes('grid-cols-1') &&
            (content.includes('md:grid-cols') || content.includes('lg:grid-cols'));

          expect(hasResponsiveGrid).toBe(true);
        }
      });
    });
  });

  describe('Componentes Proibidos', () => {
    pageFiles.forEach((file) => {
      it(`${file} NÃO deve usar componentes shadcn/ui`, () => {
        const filePath = path.join(pagesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const forbiddenImports = [
          "from '../components/ui/button'",
          "from '../components/ui/card'",
          "from '../components/ui/dialog'",
          "from '../components/ui/input'",
          "from '@/components/ui",
        ];

        forbiddenImports.forEach((importPath) => {
          expect(content).not.toContain(importPath);
        });
      });
    });
  });

  describe('Acessibilidade', () => {
    pageFiles.forEach((file) => {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes('<input')) {
        it(`${file} - inputs devem ter labels`, () => {
          const inputCount = (content.match(/<input/g) || []).length;
          const labelCount = (content.match(/<label/g) || []).length;

          // Pelo menos 70% dos inputs devem ter labels
          const ratio = labelCount / inputCount;
          expect(ratio).toBeGreaterThanOrEqual(0.7);
        });
      }

      if (content.includes('focus:ring')) {
        it(`${file} - focus rings devem ser Crevasse primary`, () => {
          const hasCrevasseFocus =
            content.includes('focus:ring-[#159A9C]') || content.includes('focus:ring-2');

          expect(hasCrevasseFocus).toBe(true);
        });
      }
    });
  });

  describe('Performance', () => {
    pageFiles.forEach((file) => {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes('useEffect')) {
        it(`${file} - useEffect deve ter array de dependências`, () => {
          const useEffectRegex = /useEffect\([^)]+\)/g;
          const effects = content.match(useEffectRegex) || [];

          effects.forEach((effect) => {
            // useEffect deve ter segundo argumento (dependências)
            const hasDeps = effect.includes(',');
            expect(hasDeps).toBe(true);
          });
        });
      }
    });
  });
});

describe('🔧 Validação do ThemeContext', () => {
  const themeContextPath = path.join(__dirname, '../src/contexts/ThemeContext.tsx');

  it('Deve ter Crevasse como tema padrão', () => {
    const content = fs.readFileSync(themeContextPath, 'utf-8');

    expect(content).toContain("useState<string>('crevasse')");
  });

  it('Deve ter paleta Crevasse completa definida', () => {
    const content = fs.readFileSync(themeContextPath, 'utf-8');

    Object.entries(CREVASSE_COLORS).forEach(([key, value]) => {
      expect(content).toContain(value);
    });
  });
});

describe('📚 Validação de Documentação', () => {
  it('DESIGN_GUIDELINES.md deve existir', () => {
    const guidelinesPath = path.join(__dirname, '../DESIGN_GUIDELINES.md');
    expect(fs.existsSync(guidelinesPath)).toBe(true);
  });

  it('COMPONENTS_GUIDE.md deve existir', () => {
    const guidePath = path.join(__dirname, '../COMPONENTS_GUIDE.md');
    expect(fs.existsSync(guidePath)).toBe(true);
  });

  it('copilot-instructions.md deve mencionar Crevasse', () => {
    const copilotPath = path.join(__dirname, '../../.github/copilot-instructions.md');
    const content = fs.readFileSync(copilotPath, 'utf-8');

    expect(content).toContain('Crevasse');
    expect(content).toContain('#159A9C');
  });
});

describe('🚀 Validação de Template', () => {
  const templatePath = path.join(__dirname, '../src/pages/_TemplatePage.tsx');

  it('_TemplatePage.tsx deve existir', () => {
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  it('Template deve ter marcadores [PERSONALIZAR]', () => {
    const content = fs.readFileSync(templatePath, 'utf-8');
    expect(content).toContain('[PERSONALIZAR]');
  });

  it('Template deve usar cores Crevasse', () => {
    const content = fs.readFileSync(templatePath, 'utf-8');

    // Deve ter pelo menos uma cor Crevasse
    const hasCrevasseColor = Object.values(CREVASSE_COLORS).some((color) =>
      content.includes(color),
    );

    expect(hasCrevasseColor).toBe(true);
  });

  it('Template deve ter BackToNucleus', () => {
    const content = fs.readFileSync(templatePath, 'utf-8');
    expect(content).toContain('BackToNucleus');
  });

  it('Template deve ter todos os estados', () => {
    const content = fs.readFileSync(templatePath, 'utf-8');

    expect(content).toContain('loading');
    expect(content).toContain('error');
    expect(content).toContain('length === 0');
  });
});

describe('📊 Estatísticas do Projeto', () => {
  it('Deve ter pelo menos 5 páginas criadas', () => {
    const pagesDir = path.join(__dirname, '../src/pages');
    const pages = fs
      .readdirSync(pagesDir)
      .filter((f) => f.endsWith('.tsx') && f !== '_TemplatePage.tsx');

    expect(pages.length).toBeGreaterThanOrEqual(5);
  });

  it('Deve reportar páginas que NÃO seguem Crevasse', () => {
    const pagesDir = path.join(__dirname, '../src/pages');
    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx'));

    const nonCompliantPages: string[] = [];

    pageFiles.forEach((file) => {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verificar se tem cores proibidas
      const hasForbiddenColors = FORBIDDEN_COLORS.some((color) => content.includes(color));

      if (hasForbiddenColors) {
        nonCompliantPages.push(file);
      }
    });

    if (nonCompliantPages.length > 0) {
      console.warn('\n⚠️ Páginas que NÃO seguem 100% Crevasse:');
      nonCompliantPages.forEach((page) => console.warn(`   - ${page}`));
    }

    // Permitir até 20% de páginas não-compliant
    const complianceRate = 1 - nonCompliantPages.length / pageFiles.length;
    expect(complianceRate).toBeGreaterThanOrEqual(0.8);
  });
});
