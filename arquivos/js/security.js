const fs = require('fs')
const path = require('path')

const SEC_PATH = path.join(__dirname, '../../database/seguranca.json')
const floodMap = new Map() // key: group+user -> {count, ts}

if (!fs.existsSync(SEC_PATH)) fs.writeFileSync(SEC_PATH, '{}')

function loadSec() {
  try { return JSON.parse(fs.readFileSync(SEC_PATH)) } catch { return {} }
}
function saveSec(data) {
  fs.writeFileSync(SEC_PATH, JSON.stringify(data, null, 2))
}

function getGroupSec(jid) {
  const all = loadSec()
  if (!all[jid]) {
    all[jid] = {
      antilink: false,
      antiflood: false,
      floodLimit: 5,
      floodSeconds: 8,
      antipalavra: false,
      palavras: ['porra','caralho','puta','viado','fdp','arrombado'],
      antidoc: false,
      antiloc: false
    }
    saveSec(all)
  }
  return all[jid]
}

function setGroupSec(jid, patch) {
  const all = loadSec()
  all[jid] = { ...getGroupSec(jid), ...patch }
  saveSec(all)
  return all[jid]
}

function hasLink(text) {
  if (!text) return false
  return /(https?:\/\/|www\.|chat\.whatsapp\.com\/|t\.me\/|wa\.me\/)/i.test(text)
}

function checkFlood(groupJid, userJid, limit, seconds) {
  const key = groupJid + '|' + userJid
  const now = Date.now()
  let entry = floodMap.get(key)
  if (!entry || now - entry.ts > seconds * 1000) {
    entry = { count: 1, ts: now }
    floodMap.set(key, entry)
    return false
  }
  entry.count++
  floodMap.set(key, entry)
  return entry.count > limit
}

function hasPalavra(text, lista) {
  if (!text || !lista?.length) return false
  const lower = text.toLowerCase()
  return lista.some(p => lower.includes(String(p).toLowerCase()))
}

/**
 * Processa antis em mensagens de grupo.
 * Retorna true se a mensagem foi tratada (ex: apagada).
 */
async function processSecurity(sock, msg, from, sender, body, isGroupAdminUser, botIsAdminUser) {
  if (!from.endsWith('@g.us')) return false
  const sec = getGroupSec(from)

  // não pune admin
  if (isGroupAdminUser) return false

  // ANTIFLOOD
  if (sec.antiflood && botIsAdminUser) {
    if (checkFlood(from, sender, sec.floodLimit || 5, sec.floodSeconds || 8)) {
      try {
        await sock.sendMessage(from, { delete: msg.key })
        await sock.sendMessage(from, { text: '⚠️ @' + sender.split('@')[0] + ' flood detectado.', mentions: [sender] })
      } catch {}
      return true
    }
  }

  // ANTILINK
  if (sec.antilink && botIsAdminUser && hasLink(body)) {
    try {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: '🔗 Link bloqueado (@' + sender.split('@')[0] + ')', mentions: [sender] })
    } catch {}
    return true
  }

  // ANTIPALAVRA
  if (sec.antipalavra && botIsAdminUser && hasPalavra(body, sec.palavras)) {
    try {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: '🚫 Palavra proibida (@' + sender.split('@')[0] + ')', mentions: [sender] })
    } catch {}
    return true
  }

  // ANTIDOC
  if (sec.antidoc && botIsAdminUser && msg.message?.documentMessage) {
    try {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: '📄 Documento bloqueado.', mentions: [sender] })
    } catch {}
    return true
  }

  // ANTILOC
  if (sec.antiloc && botIsAdminUser && (msg.message?.locationMessage || msg.message?.liveLocationMessage)) {
    try {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: '📍 Localização bloqueada.', mentions: [sender] })
    } catch {}
    return true
  }

  return false
}

module.exports = {
  getGroupSec,
  setGroupSec,
  processSecurity,
  hasLink
}
