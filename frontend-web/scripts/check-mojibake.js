#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const defaultTargets = [path.join(projectRoot, 'src')];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']);

const mojibakeRegex = /(?:\u00c3|\u00c2|\u00e2)[\u0080-\u00bf]|\ufffd/g;
const questionInsideWordRegex = /[A-Za-z\u00c0-\u017f]\?{1,}[A-Za-z\u00c0-\u017f]/g;

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (allowedExtensions.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isLikelyPathOrQueryToken(value) {
  if (!value) {
    return false;
  }

  const normalized = value
    .replace(/^[('"`[{<]+/, '')
    .replace(/[)\]"'`>.,;:]+$/, '');

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

  if (
    (normalized.includes('?') || normalized.includes('&')) &&
    (normalized.includes('=') || normalized.includes('/'))
  ) {
    return true;
  }

  // react-router e query-like fragments often aparecem sem espacos.
  if (!/\s/.test(normalized) && /[?&][A-Za-z0-9_.-]+=/.test(normalized)) {
    return true;
  }

  return false;
}

function hasSuspiciousQuestionInLine(line) {
  questionInsideWordRegex.lastIndex = 0;
  let match = questionInsideWordRegex.exec(line);

  while (match) {
    const index = match.index;
    let start = index;
    let end = index + match[0].length;

    while (start > 0 && !/\s/.test(line[start - 1])) {
      start -= 1;
    }
    while (end < line.length && !/\s/.test(line[end])) {
      end += 1;
    }

    const token = line.slice(start, end);
    if (!isLikelyPathOrQueryToken(token)) {
      return true;
    }

    match = questionInsideWordRegex.exec(line);
  }

  return false;
}

function checkFile(filePath, strictMode) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    mojibakeRegex.lastIndex = 0;
    if (mojibakeRegex.test(line)) {
      findings.push({
        line: i + 1,
        pattern: 'Mojibake UTF-8/Latin1',
        preview: line.trim().slice(0, 180),
      });
      continue;
    }

    if (strictMode && hasSuspiciousQuestionInLine(line)) {
      findings.push({
        line: i + 1,
        pattern: 'Possivel perda de acentuacao em literal',
        preview: line.trim().slice(0, 180),
      });
    }
  }

  return findings;
}

function resolveTargets(rawTargets) {
  if (!rawTargets || rawTargets.length === 0) {
    return defaultTargets;
  }

  return rawTargets.map((target) => path.resolve(projectRoot, target));
}

function main() {
  const args = process.argv.slice(2);
  const strictMode = args.includes('--strict');
  const rawTargets = args.filter((arg) => !arg.startsWith('--'));
  const targets = resolveTargets(rawTargets);

  const allFindings = [];

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }

    const files = fs.statSync(target).isDirectory() ? listFiles(target) : [target];
    for (const file of files) {
      const findings = checkFile(file, strictMode);
      if (findings.length > 0) {
        allFindings.push({ file, findings });
      }
    }
  }

  if (allFindings.length > 0) {
    console.error('\n[encoding-check] Possiveis textos com encoding corrompido detectados:\n');
    for (const entry of allFindings) {
      const relative = path.relative(projectRoot, entry.file).replace(/\\/g, '/');
      console.error(`- ${relative}`);
      for (const finding of entry.findings) {
        console.error(`  L${finding.line} [${finding.pattern}]: ${finding.preview}`);
      }
    }
    console.error('\n[encoding-check] Corrija os textos antes de gerar build.\n');
    process.exit(1);
  }

  const strictSuffix = strictMode ? ' (strict)' : '';
  console.log(`[encoding-check] OK${strictSuffix}: nenhum texto corrompido detectado.`);
}

main();
