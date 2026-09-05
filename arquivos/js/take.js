const fs = require('fs')
const path = require('path')
const webp = require('node-webpmux')

const TAKE_PATH = path.join(__dirname, '../../database/take.json')

if (!fs.existsSync(TAKE_PATH)) fs.writeFileSync(TAKE_PATH, '{}')

function loadTake() {
  try { return JSON.parse(fs.readFileSync(TAKE_PATH)) } catch { return {} }
}
function saveTake(data) {
  fs.writeFileSync(TAKE_PATH, JSON.stringify(data, null, 2))
}

function userKey(jid) {
  return String(jid || '').split('@')[0].split(':')[0]
}

/** Formato: Pack/Autor  ou  Pack | Autor */
function parseTakeText(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  let pack, author
  if (raw.includes('/')) {
    const i = raw.indexOf('/')
    pack = raw.slice(0, i).trim()
    author = raw.slice(i + 1).trim()
  } else if (raw.includes('|')) {
    const parts = raw.split('|').map(s => s.trim())
    pack = parts[0]
    author = parts[1] || parts[0]
  } else {
    pack = raw
    author = raw
  }
  if (!pack) return null
  if (!author) author = pack
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

async function writeStickerExif(buf, pack, author) {
  const img = new webp.Image()
  await img.load(buf)
  const json = {
    'sticker-pack-id': 'nawty-take-' + Date.now(),
    'sticker-pack-name': pack,
    'sticker-pack-publisher': author,
    emojis: ['✨']
  }
  const attr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonB = Buffer.from(JSON.stringify(json))
  const exif = Buffer.concat([attr, jsonB])
  exif.writeUIntLE(jsonB.length, 14, 4)
  img.exif = exif
  return await img.save(null)
}

module.exports = {
  parseTakeText,
  getUserTake,
  setUserTake,
  writeStickerExif
}
