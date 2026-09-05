/**
 * DONO garantido:
 * - Número fixo 5518996965458
 * - Qualquer chat PRIVADO autoriza e grava o JID (@lid ok)
 * - No grupo usa owners.json + número
 */
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '../../database/config.json')
const OWNERS_PATH = path.join(__dirname, '../../database/owners.json')

// NÚMERO DO DONO (fixo no código)
const HARDCODED_OWNERS = ['5518996965458', '18996965458']

if (!fs.existsSync(path.dirname(OWNERS_PATH))) {
  fs.mkdirSync(path.dirname(OWNERS_PATH), { recursive: true })
}
if (!fs.existsSync(OWNERS_PATH)) {
  fs.writeFileSync(OWNERS_PATH, JSON.stringify(HARDCODED_OWNERS, null, 2))
}

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

function numbersMatch(a, b) {
  const x = onlyDigits(a)
  const y = onlyDigits(b)
  if (!x || !y) return false
  if (x === y) return true
  if (x.length >= 8 && y.length >= 8) {
    if (x.slice(-8) === y.slice(-8)) return true
    if (x.slice(-10) === y.slice(-10)) return true
    if (x.slice(-11) === y.slice(-11)) return true
  }
  if (x.endsWith(y) || y.endsWith(x)) return true
  return false
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } catch { return {} }
}

function loadOwnerJids() {
  try {
    const d = JSON.parse(fs.readFileSync(OWNERS_PATH, 'utf8'))
    return Array.isArray(d) ? d.map(String) : []
  } catch {
    return []
  }
}

function saveOwnerJids(list) {
  const base = [...HARDCODED_OWNERS, ...list.map(String)]
  const uniq = [...new Set(base.filter(Boolean))]
  const tmp = OWNERS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(uniq, null, 2))
  fs.renameSync(tmp, OWNERS_PATH)
  return uniq
}

function collectIds(sender, msg) {
  const out = []
  const add = (v) => {
    if (v == null || v === '') return
    const s = String(v)
    out.push(s)
    const d = onlyDigits(s.split('@')[0].split(':')[0])
    if (d && d.length >= 5) out.push(d)
    if (s.includes(':')) out.push(s.replace(/:[^@]+/, ''))
  }
  add(sender)
  const k = msg?.key || {}
  add(k.participant)
  add(k.participantAlt)
  add(k.remoteJid)
  add(k.remoteJidAlt)
  add(k.participantPn)
  add(k.senderPn)
  add(k.senderLid)
  return [...new Set(out)]
}

function resolveSenderJid(msg, fallbackSender) {
  const k = msg?.key || {}
  if (k.participantAlt) return k.participantAlt
  if (k.remoteJidAlt && !String(k.remoteJid || '').endsWith('@g.us')) return k.remoteJidAlt
  if (k.participant) return k.participant
  return fallbackSender || k.remoteJid
}

function allOwnerDigits(config) {
  const cfg = config || loadConfig()
  const list = [...HARDCODED_OWNERS]
  if (cfg.NumeroDoDono) list.push(cfg.NumeroDoDono)
  if (Array.isArray(cfg.Owners)) list.push(...cfg.Owners)
  return [...new Set(list.map(onlyDigits).filter(d => d && d.length >= 8))]
}

function matchAny(ids, owners) {
  for (const id of ids) {
    for (const o of owners) {
      if (!o) continue
      if (String(id) === String(o)) return true
      if (numbersMatch(id, o)) return true
      const a = String(id).split('@')[0].split(':')[0]
      const b = String(o).split('@')[0].split(':')[0]
      if (a && b && (a === b || numbersMatch(a, b))) return true
    }
  }
  return false
}

function registerOwnerFromMessage(sender, msg) {
  const list = loadOwnerJids()
  for (const id of collectIds(sender, msg)) {
    if (!list.includes(id)) list.push(id)
  }
  return saveOwnerJids(list)
}

function isPrivateChat(msg) {
  const jid = msg?.key?.remoteJid || ''
  return jid && !String(jid).endsWith('@g.us') && !String(jid).endsWith('@broadcast')
}

function isOwnerSync(sender, config, msg) {
  const ids = collectIds(sender, msg)

  // 1) hardcoded + config numbers
  if (matchAny(ids, allOwnerDigits(config))) return true

  // 2) JIDs salvos (inclui @lid)
  if (matchAny(ids, loadOwnerJids())) return true

  // 3) PRIVADO = dono (bot pessoal) e grava JID para usar no grupo depois
  if (isPrivateChat(msg)) {
    registerOwnerFromMessage(sender, msg)
    return true
  }

  return false
}

async function isOwnerAsync(sock, sender, config, msg) {
  if (isOwnerSync(sender, config, msg)) return true

  // tenta LID → PN
  try {
    const map = sock?.signalRepository?.lidMapping
    const ids = collectIds(sender, msg)
    for (const id of ids) {
      if (!String(id).includes('@lid')) continue
      let pn = null
      if (map?.getPNForLID) pn = await map.getPNForLID(id)
      else if (map?.getPNForLid) pn = await map.getPNForLid(id)
      if (pn && matchAny([pn], allOwnerDigits(config))) {
        registerOwnerFromMessage(sender, msg)
        return true
      }
    }
  } catch {}

  return false
}

function isOwnerOrCriador(sender, config, msg) {
  return isOwnerSync(sender, config, msg)
}

module.exports = {
  isOwnerOrCriador,
  isOwnerSync,
  isOwnerAsync,
  resolveSenderJid,
  loadConfig,
  loadOwnerJids,
  registerOwnerFromMessage,
  HARDCODED_OWNERS,
  onlyDigits,
  numbersMatch,
  OWNERS_PATH
}
