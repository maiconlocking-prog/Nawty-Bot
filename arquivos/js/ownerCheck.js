/**
 * Dono = número(s) em database/config.json
 * Resolve @lid → número quando o Baileys expõe alt / mapping
 */
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '../../database/config.json')

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

function numbersMatch(a, b) {
  const x = onlyDigits(a)
  const y = onlyDigits(b)
  if (!x || !y) return false
  if (x === y) return true
  if (x.slice(-10) === y.slice(-10)) return true
  if (x.slice(-11) === y.slice(-11)) return true
  if (x.endsWith(y) || y.endsWith(x)) return true
  return false
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } catch { return {} }
}

function ownerDigitsList(config) {
  const cfg = config || loadConfig()
  const list = []
  if (cfg.NumeroDoDono) list.push(cfg.NumeroDoDono)
  if (Array.isArray(cfg.Owners)) list.push(...cfg.Owners)
  if (cfg.owners) list.push(...[].concat(cfg.owners))
  // também aceita campo antigo do criador se existir no config
  if (cfg.NumeroCriador) list.push(cfg.NumeroCriador)
  return [...new Set(list.map(onlyDigits).filter(d => d && d.length >= 8))]
}

/**
 * Melhor JID possível do remetente (prioriza número real)
 */
function resolveSenderJid(msg, fallbackSender) {
  const k = msg?.key || {}
  // Baileys: *Alt costuma ser o PN quando o principal é LID
  if (k.participantAlt) return k.participantAlt
  if (k.remoteJidAlt && !String(k.remoteJid || '').endsWith('@g.us')) return k.remoteJidAlt
  if (k.participant) return k.participant
  if (fallbackSender) return fallbackSender
  return k.remoteJid
}

/**
 * Tenta obter número a partir de LID via repositório do Baileys
 */
async function resolveToPhoneJid(sock, jid) {
  if (!jid) return jid
  const s = String(jid)
  if (s.includes('@s.whatsapp.net')) return s
  if (!s.includes('@lid') && !s.includes('@hosted')) return s
  try {
    const map = sock?.signalRepository?.lidMapping
    if (map) {
      if (typeof map.getPNForLID === 'function') {
        const pn = await map.getPNForLID(s)
        if (pn) return pn
      }
      if (typeof map.getPNForLid === 'function') {
        const pn = await map.getPNForLid(s)
        if (pn) return pn
      }
      if (map.lidsToPns && map.lidsToPns[s]) return map.lidsToPns[s]
    }
  } catch {}
  try {
    // alguns forks guardam em store
    const c = sock?.store?.contacts?.[s]
    if (c?.id && String(c.id).includes('@s.whatsapp.net')) return c.id
    if (c?.notify && onlyDigits(c.notify).length >= 8) {
      return onlyDigits(c.notify) + '@s.whatsapp.net'
    }
  } catch {}
  return s
}

function jidToDigits(jid) {
  return onlyDigits(String(jid || '').split('@')[0].split(':')[0])
}

/**
 * Verifica dono de forma síncrona (rápida)
 */
function isOwnerSync(sender, config, msg) {
  const owners = ownerDigitsList(config)
  if (!owners.length) return false

  const candidates = new Set()
  const add = (v) => {
    if (!v) return
    candidates.add(String(v))
    const d = jidToDigits(v)
    if (d) candidates.add(d)
  }

  add(sender)
  add(resolveSenderJid(msg, sender))
  if (msg?.key) {
    add(msg.key.participant)
    add(msg.key.participantAlt)
    add(msg.key.remoteJidAlt)
    add(msg.key.remoteJid)
  }

  for (const c of candidates) {
    for (const o of owners) {
      if (numbersMatch(c, o)) return true
    }
  }
  return false
}

/**
 * Verifica dono com resolução async de LID
 */
async function isOwnerAsync(sock, sender, config, msg) {
  if (isOwnerSync(sender, config, msg)) return true
  const owners = ownerDigitsList(config)
  if (!owners.length) return false

  const jids = [
    sender,
    resolveSenderJid(msg, sender),
    msg?.key?.participant,
    msg?.key?.participantAlt,
    msg?.key?.remoteJidAlt
  ].filter(Boolean)

  for (const j of jids) {
    const resolved = await resolveToPhoneJid(sock, j)
    const d = jidToDigits(resolved)
    for (const o of owners) {
      if (numbersMatch(d, o) || numbersMatch(resolved, o)) return true
    }
  }
  return false
}

// compat
function isOwnerOrCriador(sender, config, msg) {
  return isOwnerSync(sender, config, msg)
}

module.exports = {
  isOwnerOrCriador,
  isOwnerSync,
  isOwnerAsync,
  resolveSenderJid,
  resolveToPhoneJid,
  ownerDigitsList,
  onlyDigits,
  numbersMatch,
  loadConfig
}
