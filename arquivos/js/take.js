const fs = require('fs')
const path = require('path')

const TAKE_PATH = path.join(__dirname, '../../database/take.json')

if (!fs.existsSync(TAKE_PATH)) fs.writeFileSync(TAKE_PATH, '{}')

function loadTake() {
  try { return JSON.parse(fs.readFileSync(TAKE_PATH)) } catch { return {} }
}

function saveTake(data) {
  fs.writeFileSync(TAKE_PATH, JSON.stringify(data, null, 2))
}

function userKey(jid) {
  return String(jid || '').split(':')[0]
}

/** Parse "Pack/Author" ou "Pack | Author" */
function parseTakeName(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  let pack = raw
  let author = 'Nawty'
  if (raw.includes('/')) {
    const parts = raw.split('/')
    pack = (parts[0] || '').trim() || 'Nawty'
    author = (parts.slice(1).join('/') || '').trim() || 'Nawty'
  } else if (raw.includes('|')) {
    const parts = raw.split('|')
    pack = (parts[0] || '').trim() || 'Nawty'
    author = (parts.slice(1).join('|') || '').trim() || 'Nawty'
  }
  return { pack, author }
}

function getUserTake(jid) {
  const data = loadTake()
  return data[userKey(jid)] || null
}

function setUserTake(jid, pack, author) {
  const data = loadTake()
  data[userKey(jid)] = { pack, author, updatedAt: Date.now() }
  saveTake(data)
  return data[userKey(jid)]
}

module.exports = {
  parseTakeName,
  getUserTake,
  setUserTake
}
