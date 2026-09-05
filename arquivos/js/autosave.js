/**
 * Autosave + backup automático de todos os bancos JSON do bot
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '../..')
const DB_DIR = path.join(ROOT, 'database')
const BACKUP_DIR = path.join(DB_DIR, 'backups')

const WATCH_FILES = [
  'rpg.json',
  'vip.json',
  'config.json',
  'fotos.json',
  'brincadeira.json',
  'take.json',
  'semprefixo.json',
  'ranks.json',
  'atividade.json',
  'security.json'
]

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })

// garante arquivos mínimos
for (const f of WATCH_FILES) {
  const p = path.join(DB_DIR, f)
  if (!fs.existsSync(p)) {
    const empty = f === 'config.json'
      ? '{\n  "prefix": "¥",\n  "NomeDoBot": "NAWTY BOT",\n  "NomeDoDono": "Seu Nome",\n  "NumeroDoDono": "5511987654321"\n}\n'
      : '{}'
    fs.writeFileSync(p, empty)
  }
}

function safeRead(file) {
  try {
    return fs.readFileSync(path.join(DB_DIR, file), 'utf8')
  } catch {
    return null
  }
}

function writeJsonAtomic(filePath, data) {
  const tmp = filePath + '.tmp'
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  fs.writeFileSync(tmp, text)
  fs.renameSync(tmp, filePath)
}

/** Salva um objeto JSON no database com escrita atômica */
function saveDb(name, data) {
  const file = name.endsWith('.json') ? name : name + '.json'
  writeJsonAtomic(path.join(DB_DIR, file), data)
  return true
}

/** Lê JSON do database */
function loadDb(name, fallback = {}) {
  const file = name.endsWith('.json') ? name : name + '.json'
  try {
    return JSON.parse(fs.readFileSync(path.join(DB_DIR, file), 'utf8'))
  } catch {
    return fallback
  }
}

/** Cópia de segurança de todos os JSON */
function backupAll(tag = '') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const folder = path.join(BACKUP_DIR, stamp + (tag ? '_' + tag : ''))
  fs.mkdirSync(folder, { recursive: true })
  let count = 0
  for (const f of WATCH_FILES) {
    const src = path.join(DB_DIR, f)
    if (!fs.existsSync(src)) continue
    try {
      fs.copyFileSync(src, path.join(folder, f))
      count++
    } catch {}
  }
  // limpa backups antigos (mantém os 10 mais recentes)
  try {
    const dirs = fs.readdirSync(BACKUP_DIR)
      .map(n => ({ n, t: fs.statSync(path.join(BACKUP_DIR, n)).mtimeMs }))
      .sort((a, b) => b.t - a.t)
    dirs.slice(10).forEach(d => {
      const p = path.join(BACKUP_DIR, d.n)
      try {
        fs.rmSync(p, { recursive: true, force: true })
      } catch {}
    })
  } catch {}
  return { folder, count }
}

let started = false
let lastBackup = 0

/** Inicia backup periódico (a cada 10 min) + ao encerrar processo */
function startAutosave(intervalMs = 10 * 60 * 1000) {
  if (started) return
  started = true

  // backup inicial leve
  try { backupAll('boot') } catch {}

  setInterval(() => {
    try {
      lastBackup = Date.now()
      backupAll('auto')
    } catch (e) {
      console.error('[autosave] erro no backup:', e.message)
    }
  }, intervalMs).unref?.()

  const onExit = () => {
    try { backupAll('exit') } catch {}
  }
  process.on('exit', onExit)
  process.on('SIGINT', () => { onExit(); process.exit(0) })
  process.on('SIGTERM', () => { onExit(); process.exit(0) })
}

module.exports = {
  saveDb,
  loadDb,
  backupAll,
  startAutosave,
  DB_DIR,
  BACKUP_DIR,
  WATCH_FILES
}
