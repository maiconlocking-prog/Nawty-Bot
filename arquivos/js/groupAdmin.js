const fs = require('fs')
const path = require('path')

const ATIVIDADE_PATH = path.join(__dirname, '../../database/atividade.json')
const RANKS_PATH = path.join(__dirname, '../../database/ranks.json')

if (!fs.existsSync(ATIVIDADE_PATH)) fs.writeFileSync(ATIVIDADE_PATH, '{}')

function loadAtividade() {
  try { return JSON.parse(fs.readFileSync(ATIVIDADE_PATH)) } catch { return {} }
}
function saveAtividade(data) {
  fs.writeFileSync(ATIVIDADE_PATH, JSON.stringify(data, null, 2))
}
function loadRanks() {
  try { return JSON.parse(fs.readFileSync(RANKS_PATH)) } catch { return {} }
}

function registrarAtividade(groupJid, userJid) {
  if (!groupJid.endsWith('@g.us') || !userJid) return
  const data = loadAtividade()
  if (!data[groupJid]) data[groupJid] = {}
  data[groupJid][userJid] = (data[groupJid][userJid] || 0) + 1
  saveAtividade(data)
}

function getRankAtivo(groupJid, limit = 10) {
  const data = loadAtividade()
  const g = data[groupJid] || {}
  return Object.entries(g)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

async function isGroupAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const p = meta.participants.find(x => x.id === userJid || x.id?.split(':')[0] === userJid?.split(':')[0])
    return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'))
  } catch {
    return false
  }
}

async function botIsAdmin(sock, groupJid) {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const botId = sock.user?.id
    const botNum = botId?.split(':')[0]
    const p = meta.participants.find(x => x.id === botId || x.id?.startsWith(botNum))
    return !!(p && (p.admin === 'admin' || p.admin === 'superadmin'))
  } catch {
    return false
  }
}

async function getParticipants(sock, groupJid) {
  const meta = await sock.groupMetadata(groupJid)
  return (meta.participants || []).map(p => p.id).filter(Boolean)
}

function pickRandom(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function buildFunRank(title, members, scores) {
  let txt = title + '\n\n'
  members.forEach((jid, i) => {
    const num = jid.split('@')[0]
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
    txt += `${medal} @${num} — *${scores[i]}%*\n`
  })
  return txt
}

module.exports = {
  registrarAtividade,
  getRankAtivo,
  isGroupAdmin,
  botIsAdmin,
  getParticipants,
  pickRandom,
  buildFunRank,
  loadRanks
}
