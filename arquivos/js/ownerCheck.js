/**
 * Verificação unificada de DONO / CRIADOR
 * Suporta número, JID e @lid (registro em owners.json)
 */
const fs = require('fs')
const path = require('path')
const {
  isCriador,
  numbersMatch,
  onlyDigits,
  collectSenderCandidates
} = require('./criador.js')

const CONFIG_PATH = path.join(__dirname, '../../database/config.json')
const OWNERS_PATH = path.join(__dirname, '../../database/owners.json')

if (!fs.existsSync(path.dirname(OWNERS_PATH))) {
  fs.mkdirSync(path.dirname(OWNERS_PATH), { recursive: true })
}
if (!fs.existsSync(OWNERS_PATH)) {
  fs.writeFileSync(OWNERS_PATH, '[]')
}

function loadConfigSafe() {
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
  const tmp = OWNERS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify([...new Set(list.map(String))], null, 2))
  fs.renameSync(tmp, OWNERS_PATH)
}

/** Registra todos os identificadores possíveis do sender como dono */
function registerOwnerFromMessage(sender, msg) {
  const list = loadOwnerJids()
  const cands = collectSenderCandidates(sender, msg)
  // também salva JID completo bruto
  if (sender) cands.push(String(sender))
  if (msg?.key?.participant) cands.push(String(msg.key.participant))
  if (msg?.key?.remoteJid && !String(msg.key.remoteJid).endsWith('@g.us')) {
    cands.push(String(msg.key.remoteJid))
  }
  for (const c of cands) {
    if (c && !list.includes(c)) list.push(c)
    const d = onlyDigits(String(c).split('@')[0].split(':')[0])
    if (d && d.length >= 8 && !list.includes(d)) list.push(d)
  }
  saveOwnerJids(list)
  return list
}

function ownerNumbersFromConfig(config) {
  const list = []
  if (config?.NumeroDoDono) list.push(config.NumeroDoDono)
  if (Array.isArray(config?.Owners)) list.push(...config.Owners)
  if (config?.owners) list.push(...[].concat(config.owners))
  return list.map(onlyDigits).filter(Boolean)
}

function jidMatchesRegistered(sender, msg) {
  const registered = loadOwnerJids()
  if (!registered.length) return false
  const cands = collectSenderCandidates(sender, msg)
  cands.push(String(sender || ''))
  if (msg?.key?.participant) cands.push(String(msg.key.participant))
  if (msg?.key?.participantAlt) cands.push(String(msg.key.participantAlt))
  if (msg?.key?.remoteJidAlt) cands.push(String(msg.key.remoteJidAlt))

  for (const c of cands) {
    if (!c) continue
    for (const r of registered) {
      if (!r) continue
      if (String(c) === String(r)) return true
      if (numbersMatch(c, r)) return true
      // compara parte antes do @
      const c0 = String(c).split('@')[0].split(':')[0]
      const r0 = String(r).split('@')[0].split(':')[0]
      if (c0 && r0 && (c0 === r0 || numbersMatch(c0, r0))) return true
    }
  }
  return false
}

function isOwnerOrCriador(sender, config, msg) {
  // 1) JID registrado (resolve @lid)
  if (jidMatchesRegistered(sender, msg)) return true

  // 2) criador.js
  if (isCriador(sender, msg)) return true

  // 3) config.json números
  const cfg = config || loadConfigSafe()
  const owners = ownerNumbersFromConfig(cfg)
  const candidates = collectSenderCandidates(sender, msg)
  for (const c of candidates) {
    for (const o of owners) {
      if (numbersMatch(c, o)) return true
    }
  }
  return false
}

function getOwnerPin(config) {
  const cfg = config || loadConfigSafe()
  return String(cfg.OwnerPin || cfg.ownerPin || 'nawty2026')
}

module.exports = {
  isOwnerOrCriador,
  ownerNumbersFromConfig,
  registerOwnerFromMessage,
  loadOwnerJids,
  getOwnerPin,
  OWNERS_PATH
}
