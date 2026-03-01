#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const targets = [path.join(projectRoot, 'src')];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss']);

// Detect common mojibake signatures (UTF-8 interpreted as latin1/cp1252) and replacement chars.
const suspiciousRegex = /(?:\u00C3|\u00C2|\u00E2)[\u0080-\u00BF]|\uFFFD/g;

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

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    suspiciousRegex.lastIndex = 0;
    if (suspiciousRegex.test(line)) {
      findings.push({
        line: i + 1,
        preview: line.trim().slice(0, 180),
      });
    }
  }

  return findings;
}

function main() {
  const allFindings = [];

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }

    const files = listFiles(target);
    for (const file of files) {
      const findings = checkFile(file);
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
        console.error(`  L${finding.line}: ${finding.preview}`);
      }
    }
    console.error('\n[encoding-check] Corrija os textos antes de gerar build.\n');
    process.exit(1);
  }

  console.log('[encoding-check] OK: nenhum texto corrompido detectado em src/.');
}

main();