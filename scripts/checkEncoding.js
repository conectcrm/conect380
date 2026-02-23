#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function colorize(message, color) {
  return `${colors[color] || colors.reset}${message}${colors.reset}`;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.md',
    '.sql',
    '.yml',
    '.yaml',
    '.txt',
    '.html',
    '.css',
    '.scss',
    '.ps1',
    '.sh',
    '.bat',
  ].includes(ext);
}

function shouldIgnore(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.startsWith('node_modules/') ||
    normalized.includes('/node_modules/') ||
    normalized.startsWith('.git/') ||
    normalized.includes('/dist/') ||
    normalized.includes('/build/') ||
    normalized.includes('/coverage/') ||
    normalized.includes('/.next/') ||
    normalized.includes('/.cache/')
  );
}

const PROBLEM_PATTERNS = [
  { name: 'U+FFFD (caractere de substituição \uFFFD)', regex: /\uFFFD/g },
  {
    name: 'Mojibake UTF-8→Latin-1 (Ã§/Ã£/Ãµ/...)',
    regex: /Ã§|Ã£|Ãµ|Ã¡|Ã©|Ã­|Ã³|Ãº|Ãª|Ã€|Ã‰|Ã“|Ãš|Ã”/g,
  },
  { name: 'Mojibake comum (Â...)', regex: /Â©|Â®|Â°|Âº|Âª|Â·/g },
  {
    name: 'Mojibake comum (â€™/â€œ/â€�/â€“/â€”/â€¦)',
    regex: /â€™|â€œ|â€�|â€˜|â€“|â€”|â€¦|â€¢|â„¢/g,
  },
  { name: 'Mojibake comum (â†/âœ/â/ðŸ)', regex: /â†|âœ|â|ðŸ/g },
];

function indexToLineCol(content, index) {
  const before = content.slice(0, index);
  const lines = before.split(/\r\n|\n|\r/);
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

function getLine(content, lineNumber) {
  const lines = content.split(/\r\n|\n|\r/);
  return lines[lineNumber - 1] ?? '';
}

function scanContent(content) {
  const findings = [];

  for (const pattern of PROBLEM_PATTERNS) {
    pattern.regex.lastIndex = 0;
    const match = pattern.regex.exec(content);
    if (!match) continue;

    findings.push({
      pattern: pattern.name,
      index: match.index,
      sample: match[0],
    });
  }

  return findings;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = scanContent(content);
  if (findings.length === 0) return [];

  return findings.map((f) => {
    const pos = indexToLineCol(content, f.index);
    const lineText = getLine(content, pos.line);
    return {
      ...f,
      line: pos.line,
      col: pos.col,
      lineText,
    };
  });
}

async function readStdinLines() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      const lines = data
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter(Boolean);
      resolve(lines);
    });
  });
}

function printUsage() {
  console.log('Uso: node scripts/checkEncoding.js [--stdin] [--all] [arquivos...]');
  console.log('  --stdin  Lê lista de arquivos via stdin (um por linha)');
  console.log('  --all    Varre diretórios padrão (frontend-web/src e backend/src)');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const useStdin = args.includes('--stdin');
  const scanAll = args.includes('--all');
  const explicitFiles = args.filter((a) => !a.startsWith('--'));

  let targets = [];

  if (useStdin) {
    targets = await readStdinLines();
  } else if (explicitFiles.length > 0) {
    targets = explicitFiles;
  } else if (scanAll) {
    targets = ['frontend-web/src', 'backend/src'];
  } else {
    console.log(colorize('Nenhum arquivo informado. Use --stdin, --all, ou passe caminhos.', 'yellow'));
    printUsage();
    process.exit(0);
  }

  const repoRoot = process.cwd();
  const fileQueue = [];

  for (const t of targets) {
    const resolved = path.resolve(repoRoot, t);
    if (!fs.existsSync(resolved)) continue;

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      const stack = [resolved];
      while (stack.length) {
        const dir = stack.pop();
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
          if (shouldIgnore(relPath)) continue;

          if (entry.isDirectory()) {
            stack.push(fullPath);
          } else if (entry.isFile()) {
            fileQueue.push(fullPath);
          }
        }
      }
    } else if (stat.isFile()) {
      fileQueue.push(resolved);
    }
  }

  const filesToScan = fileQueue
    .map((p) => ({ abs: p, rel: path.relative(repoRoot, p).replace(/\\/g, '/') }))
    .filter((f) => !shouldIgnore(f.rel))
    .filter((f) => isTextFile(f.rel));

  const allFindings = [];

  for (const file of filesToScan) {
    try {
      const findings = scanFile(file.abs);
      for (const finding of findings) {
        allFindings.push({ file: file.rel, ...finding });
      }
    } catch (err) {
      // Se não conseguir ler como texto (ex.: arquivo muito grande ou encoding estranho), reporta e falha.
      allFindings.push({
        file: file.rel,
        pattern: 'Erro ao ler arquivo como UTF-8',
        index: 0,
        sample: '',
        line: 0,
        col: 0,
        lineText: String(err && err.message ? err.message : err),
      });
    }
  }

  if (allFindings.length === 0) {
    console.log(colorize(`✅ Encoding OK (${filesToScan.length} arquivo(s) verificado(s))`, 'green'));
    process.exit(0);
  }

  console.log(colorize('❌ Problemas de encoding encontrados:', 'red'));
  for (const f of allFindings) {
    const location = f.line ? `:${f.line}:${f.col}` : '';
    console.log(colorize(`- ${f.file}${location}`, 'bright'));
    console.log(`  Padrão: ${f.pattern}`);
    if (f.sample) {
      console.log(`  Amostra: ${JSON.stringify(f.sample)}`);
    }
    if (f.lineText) {
      console.log(`  Linha: ${f.lineText.trim()}`);
    }
  }

  console.log('');
  console.log('Dica: geralmente isso indica arquivo salvo fora de UTF-8 ou texto copiado com encoding errado.');
  process.exit(1);
}

main().catch((err) => {
  console.error(colorize(`Erro inesperado: ${err && err.stack ? err.stack : err}`, 'red'));
  process.exit(1);
});
