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
  { name: 'U+FFFD replacement character', regex: /\uFFFD/g },
  {
    name: 'UTF-8 mojibake (C3xx sequences)',
    regex:
      /\u00C3\u00A7|\u00C3\u00A3|\u00C3\u00B5|\u00C3\u00A1|\u00C3\u00A9|\u00C3\u00AD|\u00C3\u00B3|\u00C3\u00BA|\u00C3\u00AA|\u00C3\u0080|\u00C3\u0089|\u00C3\u0093|\u00C3\u009A|\u00C3\u0094/g,
  },
  {
    name: 'UTF-8 mojibake (C2xx sequences)',
    regex: /\u00C2\u00A9|\u00C2\u00AE|\u00C2\u00B0|\u00C2\u00BA|\u00C2\u00AA|\u00C2\u00B7/g,
  },
  {
    name: 'UTF-8 mojibake (punctuation sequences)',
    regex:
      /\u00E2\u20AC\u2122|\u00E2\u20AC\u0153|\u00E2\u20AC\u02DC|\u00E2\u20AC\u201C|\u00E2\u20AC\u201D|\u00E2\u20AC\u00A6|\u00E2\u20AC\u00A2|\u00E2\u201E\u00A2/g,
  },
  {
    name: 'UTF-8 mojibake (symbol/emoji fragments)',
    regex: /\u00E2\u2020|\u00E2\u0153|\u00E2\u009D|\u00F0\u0178/g,
  },
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
  console.log('Usage: node scripts/checkEncoding.js [--stdin] [--all] [files...]');
  console.log('  --stdin  Read file list from stdin (one per line)');
  console.log('  --all    Scan default dirs (frontend-web/src and backend/src)');
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
    console.log(colorize('No files informed. Use --stdin, --all, or explicit paths.', 'yellow'));
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
      allFindings.push({
        file: file.rel,
        pattern: 'Read error as UTF-8',
        index: 0,
        sample: '',
        line: 0,
        col: 0,
        lineText: String(err && err.message ? err.message : err),
      });
    }
  }

  if (allFindings.length === 0) {
    console.log(colorize(`[OK] Encoding OK (${filesToScan.length} file(s) scanned)`, 'green'));
    process.exit(0);
  }

  console.log(colorize('[FAIL] Encoding issues found:', 'red'));
  for (const f of allFindings) {
    const location = f.line ? `:${f.line}:${f.col}` : '';
    console.log(colorize(`- ${f.file}${location}`, 'bright'));
    console.log(`  Pattern: ${f.pattern}`);
    if (f.sample) {
      console.log(`  Sample: ${JSON.stringify(f.sample)}`);
    }
    if (f.lineText) {
      console.log(`  Line: ${f.lineText.trim()}`);
    }
  }

  console.log('');
  console.log('Tip: file was likely saved in the wrong encoding or copied with mojibake.');
  process.exit(1);
}

main().catch((err) => {
  console.error(colorize(`Unexpected error: ${err && err.stack ? err.stack : err}`, 'red'));
  process.exit(1);
});
