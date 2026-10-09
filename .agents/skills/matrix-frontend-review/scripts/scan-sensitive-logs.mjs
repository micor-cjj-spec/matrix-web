#!/usr/bin/env node
/** Scan changed frontend files for sensitive logging and risky literals. */

import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve } from 'node:path'

const TEXT_EXTENSIONS = new Set(['.vue', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.env', '.scss', '.css', '.html'])
const SKIP_SEGMENTS = new Set(['.git', 'node_modules', 'dist', 'coverage'])
const rootArgIndex = process.argv.indexOf('--root')
const root = resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd())
const strict = process.argv.includes('--strict')
const explicit = process.argv.slice(2).filter((value, index, all) => {
  if (value === '--strict' || value === '--root') return false
  if (index > 0 && all[index - 1] === '--root') return false
  return true
})

function gitNames(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function selectedFiles() {
  const names = explicit.length
    ? explicit
    : [
        ...gitNames(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']),
        ...gitNames(['ls-files', '--others', '--exclude-standard']),
      ]
  const unique = new Set()
  for (const name of names) {
    const file = isAbsolute(name) ? name : join(root, name)
    if (file.includes('\0')) continue
    let stat
    try {
      stat = statSync(file)
    } catch {
      continue
    }
    if (!stat.isFile() || stat.size > 2_000_000) continue
    const parts = relative(root, file).split(/[\\/]/)
    if (parts.some((part) => SKIP_SEGMENTS.has(part))) continue
    const extension = extname(file).toLowerCase()
    if (!TEXT_EXTENSIONS.has(extension) && !file.endsWith('.env')) continue
    unique.add(resolve(file))
  }
  return [...unique].sort()
}

function add(findings, severity, file, line, code, message) {
  findings.push({ severity, file, line, code, message })
}

function scan(file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return []
  }
  const findings = []
  const lines = text.split(/\r?\n/)
  lines.forEach((line, index) => {
    const lineNo = index + 1
    if (/console\.(?:log|debug|info)\s*\(/.test(line)) {
      if (/(token|authorization|password|passwd|secret|cookie|credential|api[_-]?key)/i.test(line)) {
        add(findings, 'ERROR', file, lineNo, 'WEBSEC001', 'sensitive value may be written to the browser console')
      } else {
        add(findings, 'WARN', file, lineNo, 'WEBSEC002', 'remove console logging from production paths or use the project logger')
      }
    }
    if (/Bearer\s+[A-Za-z0-9._-]{12,}/.test(line)) {
      add(findings, 'ERROR', file, lineNo, 'WEBSEC003', 'hard-coded bearer credential detected')
    }
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) {
      add(findings, 'ERROR', file, lineNo, 'WEBSEC004', 'private key material detected')
    }
    if (/\bv-html\s*=/.test(line)) {
      add(findings, 'WARN', file, lineNo, 'WEBSEC005', 'v-html requires explicit trusted-content sanitization review')
    }
    if (/target=["']_blank["']/.test(line) && !/rel=["'][^"']*(?:noopener|noreferrer)/.test(line)) {
      add(findings, 'WARN', file, lineNo, 'WEBSEC006', 'target=_blank should include rel=noopener or noreferrer')
    }
    if (/https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/.test(line) && !/(127\.0\.0\.1|0\.0\.0\.0)/.test(line)) {
      add(findings, 'WARN', file, lineNo, 'WEBSEC007', 'public service address should normally come from environment configuration')
    }
  })
  return findings
}

const files = selectedFiles()
if (files.length === 0) {
  console.log('No frontend files selected.')
  process.exit(0)
}

const findings = files.flatMap(scan)
for (const finding of findings) {
  console.log(`[${finding.severity}] ${relative(root, finding.file)}:${finding.line} ${finding.code} ${finding.message}`)
}
const errors = findings.filter((item) => item.severity === 'ERROR').length
const warnings = findings.filter((item) => item.severity === 'WARN').length
console.log(`Scanned ${files.length} file(s): ${errors} error(s), ${warnings} warning(s).`)
process.exit(errors > 0 || (strict && warnings > 0) ? 1 : 0)
