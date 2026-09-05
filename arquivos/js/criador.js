/**
 * Utilitários de branding (comando criador removido do fluxo principal)
 */
const CRIADOR_CONFIG = {
  nome: '𝕹𝖆𝖜𝖙𝖞𝖁',
  numero: '5518996965458',
  numerosExtra: ['18996965458'],
  botFancy: '𝑵𝒂𝒘𝒕𝒚-𝑩𝒐𝒕'
}

const _CMD = ['criador', 'creator', 'creditos', 'créditos']

function isComandoProtegido(cmd) {
  return _CMD.includes(String(cmd || '').toLowerCase())
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

function criadorNumbers() {
  const list = []
  const main = CRIADOR_CONFIG.numero
  if (Array.isArray(main)) list.push(...main)
  else if (main) list.push(main)
  if (Array.isArray(CRIADOR_CONFIG.numerosExtra)) list.push(...CRIADOR_CONFIG.numerosExtra)
  return list.map(onlyDigits).filter(Boolean)
}

function collectSenderCandidates(jidOrNumber, msg) {
  const out = new Set()
  const add = (v) => {
    if (!v) return
    out.add(String(v))
    const d = onlyDigits(String(v).split('@')[0].split(':')[0])
    if (d) out.add(d)
  }
  add(jidOrNumber)
  if (msg?.key) {
    add(msg.key.participant)
    add(msg.key.participantAlt)
    add(msg.key.remoteJid)
    add(msg.key.remoteJidAlt)
  }
  return [...out]
}

function isCriador(jidOrNumber, msg) {
  const alvos = criadorNumbers()
  if (!alvos.length) return false
  const candidates = collectSenderCandidates(jidOrNumber, msg)
  for (const c of candidates) {
    for (const alvo of alvos) {
      if (numbersMatch(c, alvo)) return true
    }
  }
  return false
}

module.exports = {
  CRIADOR_CONFIG,
  isComandoProtegido,
  isCriador,
  numbersMatch,
  onlyDigits,
  criadorNumbers,
  collectSenderCandidates
}
