#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

function runGit(args, repoRoot, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: options.buffer ? null : 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function getStagedFiles(repoRoot) {
  const result = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], repoRoot);
  if (result.status !== 0) {
    throw new Error((result.stderr || '').trim() || 'Failed to list staged files');
  }

  return (result.stdout || '')
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readStagedBuffer(repoRoot, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const result = runGit(['show', `:${normalized}`], repoRoot, { buffer: true });
  if (result.status !== 0) {
    return null;
  }

  return result.stdout;
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

const QUESTION_INSIDE_WORD_REGEX = /[A-Za-z\u00c0-\u017f]\?+[A-Za-z\u00c0-\u017f]/g;

function normalizeToken(token) {
  return token
    .replace(/^[('"`[{<]+/, '')
    .replace(/[)\]"'`>.,;:]+$/, '');
}

function isLikelyPathOrQueryToken(token) {
  if (!token) return false;

  const normalized = normalizeToken(token);
  if (!normalized) return false;

  if (normalized.includes('://')) {
    return true;
  }

  if (
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../') ||
    normalized.startsWith('#/')
  ) {
    return true;
  }

  if (normalized.includes('${')) {
    return true;
  }

  if (!/\s/.test(normalized) && /[?&][A-Za-z0-9_.-]+=/.test(normalized)) {
    return true;
  }

  if ((normalized.includes('?') || normalized.includes('&')) && normalized.includes('=')) {
    return true;
  }

  if ((normalized.includes('?') || normalized.includes('&')) && normalized.includes('/')) {
    return true;
  }

  return false;
}

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

function scanFile(fileInfo, options) {
  const { repoRoot, strictMode, stagedMode, enforceCrLf } = options;

  let buffer = null;
  if (stagedMode) {
    buffer = readStagedBuffer(repoRoot, fileInfo.rel);
  }

  if (!buffer) {
    buffer = fs.readFileSync(fileInfo.abs);
  }

  const content = buffer.toString('utf8');
  const findings = [];

  if (
    strictMode &&
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    findings.push({
      pattern: 'UTF-8 BOM no inicio do arquivo',
      index: 0,
      sample: 'EF BB BF',
      line: 1,
      col: 1,
      lineText: getLine(content, 1),
    });
  }

  if (strictMode && enforceCrLf) {
    const crlfIndex = content.indexOf('\r\n');
    const crIndex = crlfIndex >= 0 ? crlfIndex : content.indexOf('\r');
    if (crIndex >= 0) {
      const pos = indexToLineCol(content, crIndex);
      findings.push({
        pattern: 'Quebra de linha CRLF/CR detectada (esperado LF)',
        index: crIndex,
        sample: '\\r',
        line: pos.line,
        col: pos.col,
        lineText: getLine(content, pos.line),
      });
    }
  }

  const scannedFindings = scanContent(content).map((f) => {
    const pos = indexToLineCol(content, f.index);
    const lineText = getLine(content, pos.line);

    return {
      ...f,
      line: pos.line,
      col: pos.col,
      lineText,
    };
  });

  findings.push(...scannedFindings);

  const lines = content.split(/\r\n|\n|\r/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    QUESTION_INSIDE_WORD_REGEX.lastIndex = 0;
    let match = QUESTION_INSIDE_WORD_REGEX.exec(line);

    while (match) {
      let start = match.index;
      let end = match.index + match[0].length;

      while (start > 0 && !/\s/.test(line[start - 1])) {
        start -= 1;
      }
      while (end < line.length && !/\s/.test(line[end])) {
        end += 1;
      }

      const token = line.slice(start, end);
      if (!isLikelyPathOrQueryToken(token)) {
        findings.push({
          pattern: 'Possivel perda de acentuacao em literal (?)',
          index: match.index,
          sample: match[0],
          line: i + 1,
          col: match.index + 1,
          lineText: line,
        });
        break;
      }

      match = QUESTION_INSIDE_WORD_REGEX.exec(line);
    }
  }

  return findings;
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
  console.log('Usage: node scripts/checkEncoding.js [--stdin] [--all] [--strict] [--staged] [files...]');
  console.log('  --stdin  Read file list from stdin (one per line)');
  console.log('  --all    Scan default dirs (frontend-web/src and backend/src)');
  console.log('  --strict Enable strict checks (BOM + staged CRLF validation)');
  console.log('  --staged Read file content from git index (staged snapshot)');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const useStdin = args.includes('--stdin');
  const scanAll = args.includes('--all');
  const strictMode = args.includes('--strict');
  const stagedMode = args.includes('--staged');
  const explicitFiles = args.filter((a) => !a.startsWith('--'));
  const repoRoot = process.cwd();
  const enforceCrLf = strictMode && stagedMode;

  let targets = [];

  if (useStdin) {
    targets = await readStdinLines();
  } else if (explicitFiles.length > 0) {
    targets = explicitFiles;
  } else if (stagedMode) {
    targets = getStagedFiles(repoRoot);
  } else if (scanAll) {
    targets = ['frontend-web/src', 'backend/src'];
  } else {
    console.log(colorize('No files informed. Use --stdin, --all, or explicit paths.', 'yellow'));
    printUsage();
    process.exit(0);
  }

  if (stagedMode && targets.length === 0) {
    console.log(colorize('[OK] No staged files to scan', 'green'));
    process.exit(0);
  }

  if (strictMode && !stagedMode) {
    console.log(
      colorize(
        '[WARN] Strict mode without --staged validates BOM only. Use --staged to enforce LF policy.',
        'yellow',
      ),
    );
  }

  const fileQueue = [];

  for (const t of targets) {
    const normalizedTarget = t.replace(/\\/g, '/');
    const resolved = path.resolve(repoRoot, normalizedTarget);
    if (!fs.existsSync(resolved)) {
      if (stagedMode && !shouldIgnore(normalizedTarget) && isTextFile(normalizedTarget)) {
        fileQueue.push({ abs: resolved, rel: normalizedTarget });
      }
      continue;
    }

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
            fileQueue.push({ abs: fullPath, rel: relPath });
          }
        }
      }
    } else if (stat.isFile()) {
      const relPath = path.relative(repoRoot, resolved).replace(/\\/g, '/');
      fileQueue.push({ abs: resolved, rel: relPath });
    } else if (stagedMode) {
      fileQueue.push({ abs: resolved, rel: normalizedTarget });
    }
  }

  const filesToScan = fileQueue
    .filter((f) => !shouldIgnore(f.rel))
    .filter((f) => isTextFile(f.rel));

  const dedupedFilesToScan = [];
  const seen = new Set();
  for (const file of filesToScan) {
    if (seen.has(file.rel)) continue;
    seen.add(file.rel);
    dedupedFilesToScan.push(file);
  }

  const allFindings = [];

  for (const file of dedupedFilesToScan) {
    try {
      const findings = scanFile(file, { repoRoot, strictMode, stagedMode, enforceCrLf });
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
    console.log(colorize(`[OK] Encoding OK (${dedupedFilesToScan.length} file(s) scanned)`, 'green'));
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
