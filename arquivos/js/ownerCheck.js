/**
 * Verificação unificada de DONO / CRIADOR
 */
const fs = require('fs')
const path = require('path')
const { isCriador, numbersMatch, onlyDigits, collectSenderCandidates } = require('./criador.js')

const CONFIG_PATH = path.join(__dirname, '../../database/config.json')

function loadConfigSafe() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) } catch { return {} }
}

function ownerNumbersFromConfig(config) {
  const list = []
  if (config?.NumeroDoDono) list.push(config.NumeroDoDono)
  if (Array.isArray(config?.Owners)) list.push(...config.Owners)
  if (config?.owners) list.push(...[].concat(config.owners))
  return list.map(onlyDigits).filter(Boolean)
}

/**
 * true se sender for criador OU dono do config
 */
function isOwnerOrCriador(sender, config, msg) {
  if (isCriador(sender, msg)) return true
  const cfg = config || loadConfigSafe()
  const owners = ownerNumbersFromConfig(cfg)
  if (!owners.length) return false
  const candidates = collectSenderCandidates(sender, msg)
  for (const c of candidates) {
    for (const o of owners) {
      if (numbersMatch(c, o)) return true
    }
  }
  return false
}

module.exports = {
  isOwnerOrCriador,
  ownerNumbersFromConfig
}
