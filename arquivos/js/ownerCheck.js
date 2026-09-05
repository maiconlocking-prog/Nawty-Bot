/**
 * Dono:
 * 1) JID salvo em database/owners.json (resolve @lid)
 * 2) Se owners.json estiver VAZIO → o PRIMEIRO a mandar msg vira dono
 * 3) Também compara NumeroDoDono do config (quando houver número)
 */
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, '../../database/config.json')
const OWNERS_PATH = path.join(__dirname, '../../database/owners.json')

if (!fs.existsSync(path.dirname(OWNERS_PATH))) {
  fs.mkdirSync(path.dirname(OWNERS_PATH), { recursive: true })
}
if (!fs.existsSync(OWNERS_PATH)) {
  fs.writeFileSync(OWNERS_PATH, '[]')
}

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

function loadOwnerJids() {
  try {
    const d = JSON.parse(fs.readFileSync(OWNERS_PATH, 'utf8'))
    return Array.isArray(d) ? d.map(String) : []
  } catch {
    return []
  }
}

function saveOwnerJids(list) {
  const uniq = [...new Set(list.map(String).filter(Boolean))]
  const tmp = OWNERS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(uniq, null, 2))
  fs.renameSync(tmp, OWNERS_PATH)
  return uniq
}

function collectIds(sender, msg) {
  const out = []
  const add = (v) => {
    if (!v) return
    const s = String(v)
    out.push(s)
    const d = onlyDigits(s.split('@')[0].split(':')[0])
    if (d && d.length >= 5) out.push(d)
  }
  add(sender)
  const k = msg?.key || {}
  add(k.participant)
  add(k.participantAlt)
  add(k.remoteJid)
  add(k.remoteJidAlt)
  add(k.participantPn)
  add(k.senderLid)
  add(k.senderPn)
  // device-less variants
  for (const v of [...out]) {
    if (String(v).includes(':')) {
      add(String(v).replace(/:[^@]+/, ''))
    }
  }
  return [...new Set(out)]
}

function resolveSenderJid(msg, fallbackSender) {
  const k = msg?.key || {}
  if (k.participantAlt) return k.participantAlt
  if (k.remoteJidAlt && !String(k.remoteJid || '').endsWith('@g.us')) return k.remoteJidAlt
  if (k.participant) return k.participant
  return fallbackSender || k.remoteJid
}

function ownerDigitsList(config) {
  const cfg = config || loadConfig()
  const list = []
  if (cfg.NumeroDoDono) list.push(cfg.NumeroDoDono)
  if (Array.isArray(cfg.Owners)) list.push(...cfg.Owners)
  if (cfg.owners) list.push(...[].concat(cfg.owners))
  return [...new Set(list.map(onlyDigits).filter(d => d && d.length >= 8))]
}

function idsMatchOwnerList(ids, ownerList) {
  for (const id of ids) {
    for (const o of ownerList) {
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

/** Salva todos os IDs possíveis do remetente como dono */
function registerOwnerFromMessage(sender, msg) {
  const list = loadOwnerJids()
  for (const id of collectIds(sender, msg)) {
    if (!list.includes(id)) list.push(id)
  }
  return saveOwnerJids(list)
}

/**
 * Se ainda não existe dono registrado, o primeiro a falar vira dono.
 * Retorna true se registrou agora.
 */
function bootstrapOwnerIfEmpty(sender, msg) {
  const list = loadOwnerJids()
  if (list.length > 0) return false
  const saved = registerOwnerFromMessage(sender, msg)
  console.log('[DONO] Auto-registrado (primeiro usuário):', sender)
  console.log('[DONO] IDs salvos:', saved.join(', '))
  return true
}

function isOwnerSync(sender, config, msg) {
  const ids = collectIds(sender, msg)

  // 1) arquivo owners.json (inclui @lid)
  if (idsMatchOwnerList(ids, loadOwnerJids())) return true

  // 2) números do config
  if (idsMatchOwnerList(ids, ownerDigitsList(config))) return true

  return false
}

async function resolveToPhoneJid(sock, jid) {
  if (!jid) return jid
  const s = String(jid)
  if (s.includes('@s.whatsapp.net')) return s
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
    }
  } catch {}
  return s
}

async function isOwnerAsync(sock, sender, config, msg) {
  // bootstrap antes de checar
  bootstrapOwnerIfEmpty(sender, msg)

  if (isOwnerSync(sender, config, msg)) return true

  // tenta mapear LID → número e salvar se bater com config
  const ids = collectIds(sender, msg)
  for (const id of ids) {
    const resolved = await resolveToPhoneJid(sock, id)
    if (resolved && resolved !== id) {
      const owners = ownerDigitsList(config)
      if (idsMatchOwnerList([resolved], owners) || idsMatchOwnerList([resolved], loadOwnerJids())) {
        registerOwnerFromMessage(sender, msg)
        return true
      }
    }
  }
  return false
}

function isOwnerOrCriador(sender, config, msg) {
  bootstrapOwnerIfEmpty(sender, msg)
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
  loadConfig,
  loadOwnerJids,
  registerOwnerFromMessage,
  bootstrapOwnerIfEmpty,
  OWNERS_PATH
}
