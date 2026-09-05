const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '../../database/semprefixo.json')

const DEFAULTS = {
  s: 's',
  f: 's',
  t: 'take'
}

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2))
}

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return data && typeof data === 'object' ? data : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

/**
 * Se a mensagem NÃO começa com prefixo, tenta mapear atalho.
 * Retorna { command, args, q } ou null
 */
function resolveSemPrefixo(body) {
  if (!body || typeof body !== 'string') return null
  const trimmed = body.trim()
  if (!trimmed) return null

  const parts = trimmed.split(/\s+/)
  const alias = parts[0].toLowerCase()
  const map = load()

  // só atalho “puro” ou atalho + argumentos
  if (!Object.prototype.hasOwnProperty.call(map, alias)) return null

  const command = String(map[alias] || '').toLowerCase().replace(/^[^a-z0-9]+/i, '')
  if (!command) return null

  const args = parts.slice(1)
  return { command, args, q: args.join(' '), alias }
}

function addAlias(alias, command) {
  const a = String(alias || '').toLowerCase().trim()
  const c = String(command || '').toLowerCase().trim().replace(/^[^a-z0-9]+/i, '')
  if (!a || !c) return { ok: false, msg: 'Use: alias e comando válidos' }
  if (/\s/.test(a)) return { ok: false, msg: 'O atalho não pode ter espaço' }
  const data = load()
  data[a] = c
  save(data)
  return { ok: true, alias: a, command: c }
}

function delAlias(alias) {
  const a = String(alias || '').toLowerCase().trim()
  const data = load()
  if (!Object.prototype.hasOwnProperty.call(data, a)) {
    return { ok: false, msg: 'Atalho não existe' }
  }
  delete data[a]
  save(data)
  return { ok: true, alias: a }
}

function listAliases() {
  return load()
}

module.exports = {
  resolveSemPrefixo,
  addAlias,
  delAlias,
  listAliases,
  load
}
