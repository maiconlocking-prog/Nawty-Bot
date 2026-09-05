/**
 * Sistema RPG + VIP (inspirado na Nazuna) — offline, JSON
 * Salvamento automático a cada ação (escrita atômica)
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '../../database')
const RPG_PATH = path.join(DIR, 'rpg.json')
const VIP_PATH = path.join(DIR, 'vip.json')

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })
if (!fs.existsSync(RPG_PATH)) fs.writeFileSync(RPG_PATH, '{}')
if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, '{}')

function loadRPG() {
  try { return JSON.parse(fs.readFileSync(RPG_PATH)) } catch { return {} }
}
function saveRPG(d) {
  const tmp = RPG_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2))
  fs.renameSync(tmp, RPG_PATH)
}
function loadVIP() {
  try { return JSON.parse(fs.readFileSync(VIP_PATH)) } catch { return {} }
}
function saveVIP(d) {
  const tmp = VIP_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2))
  fs.renameSync(tmp, VIP_PATH)
}

function uid(jid) {
  return String(jid || '').split('@')[0].split(':')[0]
}

function defaultPlayer(name) {
  return {
    nome: name || 'Aventureiro',
    nivel: 1,
    xp: 0,
    xpNext: 100,
    dinheiro: 100,
    banco: 0,
    inventario: {},
    lastDaily: 0,
    lastWork: 0,
    lastMine: 0,
    vitorias: 0,
    derrotas: 0,
    criado: Date.now()
  }
}

function getPlayer(jid, name) {
  const db = loadRPG()
  const id = uid(jid)
  if (!db[id]) {
    db[id] = defaultPlayer(name)
    saveRPG(db)
  }
  return db[id]
}

function setPlayer(jid, data) {
  const db = loadRPG()
  db[uid(jid)] = data
  saveRPG(db)
}

function addXp(p, amount) {
  p.xp += amount
  let up = 0
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext
    p.nivel += 1
    p.xpNext = Math.floor(100 * Math.pow(1.25, p.nivel - 1))
    p.dinheiro += 50
    up++
  }
  return up
}

function isVip(jid) {
  const v = loadVIP()[uid(jid)]
  if (!v) return false
  if (v.permanente) return true
  if (v.expira && Date.now() > v.expira) return false
  return true
}

function getVipInfo(jid) {
  return loadVIP()[uid(jid)] || null
}

function setVip(jid, dias, by) {
  const db = loadVIP()
  const id = uid(jid)
  const permanente = !dias || dias <= 0
  db[id] = {
    desde: Date.now(),
    expira: permanente ? null : Date.now() + dias * 86400000,
    permanente,
    by: by || 'dono'
  }
  saveVIP(db)
  return db[id]
}

function delVip(jid) {
  const db = loadVIP()
  delete db[uid(jid)]
  saveVIP(db)
}

const LOJA = {
  pocao: { nome: 'Poção HP', preco: 80, desc: 'Recupera energia narrativa' },
  espada: { nome: 'Espada de Ferro', preco: 300, desc: 'Aumenta chance em batalha' },
  escudo: { nome: 'Escudo de Madeira', preco: 220, desc: 'Reduz perda em batalha' },
  picareta: { nome: 'Picareta', preco: 150, desc: 'Melhora mineração' },
  anel: { nome: 'Anel da Sorte', preco: 500, desc: 'Bônus no daily' }
}

function perfilText(p, jid, vip) {
  const vipTag = vip ? '💎 VIP' : '👤 Free'
  return [
    '╭┈⊰ ⚔️ 『 *PERFIL RPG* 』',
    '┊' + vipTag,
    '┊👤 *' + p.nome + '*',
    '┊⭐ Nível: *' + p.nivel + '*',
    '┊✨ XP: *' + p.xp + '/' + p.xpNext + '*',
    '┊💰 Carteira: *' + p.dinheiro + '*',
    '┊🏦 Banco: *' + p.banco + '*',
    '┊⚔️ W/L: *' + p.vitorias + '/' + p.derrotas + '*',
    '╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯'
  ].join('\n')
}

function carteiraText(p) {
  return [
    '╭┈⊰ 💰 『 *CARTEIRA* 』',
    '┊💵 Em mãos: *' + p.dinheiro + '*',
    '┊🏦 Banco: *' + p.banco + '*',
    '┊📊 Total: *' + (p.dinheiro + p.banco) + '*',
    '╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯'
  ].join('\n')
}

function invText(p) {
  const keys = Object.keys(p.inventario || {})
  if (!keys.length) {
    return '╭┈⊰ 🎒 『 *INVENTÁRIO* 』\n┊_Vazio_\n╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯'
  }
  let lines = ['╭┈⊰ 🎒 『 *INVENTÁRIO* 』', '┊']
  for (const k of keys) {
    const item = LOJA[k]
    const nome = item ? item.nome : k
    lines.push('┊• ' + nome + ' x' + p.inventario[k])
  }
  lines.push('╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯')
  return lines.join('\n')
}

function lojaText(prefix) {
  let lines = ['╭┈⊰ 🛒 『 *LOJA RPG* 』', '┊']
  for (const [k, v] of Object.entries(LOJA)) {
    lines.push('┊• *' + k + '* — ' + v.nome)
    lines.push('┊  💰 ' + v.preco + ' | ' + v.desc)
  }
  lines.push('┊')
  lines.push('┊Use: ' + prefix + 'comprar <item>')
  lines.push('╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯')
  return lines.join('\n')
}

function topRpgText(limit = 10) {
  const db = loadRPG()
  const arr = Object.entries(db).map(([id, p]) => ({
    id, nome: p.nome, nivel: p.nivel, xp: p.xp, money: (p.dinheiro || 0) + (p.banco || 0)
  }))
  arr.sort((a, b) => b.nivel - a.nivel || b.xp - a.xp)
  let lines = ['╭┈⊰ 🏆 『 *TOP RPG* 』', '┊']
  arr.slice(0, limit).forEach((u, i) => {
    lines.push('┊' + (i + 1) + '. *' + u.nome + '* — Nv.' + u.nivel + ' | 💰' + u.money)
  })
  if (arr.length === 0) lines.push('┊_Ninguém ainda_')
  lines.push('╰─┈┈┈┈┈◜⚔️◞┈┈┈┈┈─╯')
  return lines.join('\n')
}

function vipMenuText(prefix, isUserVip) {
  const status = isUserVip ? '✅ Você é *VIP*' : '❌ Você *não* é VIP'
  return [
    '╭┈⊰ 💎 『 *MENU VIP* 』',
    '┊' + status,
    '┊',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'vip  (status)',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'daily  (bônus VIP x2)',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'trabalhar  (cooldown menor)',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'minerar  (ganho extra)',
    '┊',
    '┊👑 Dono:',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'addvip @user [dias]',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'delvip @user',
    '┊•.̇𖥨֗💜◆ ' + prefix + 'listvip',
    '╰─┈┈┈┈┈◜💎◞┈┈┈┈┈─╯'
  ].join('\n')
}

async function handleRpg({
  command, args, q, sender, pushname, from, isGroup, msg,
  prefix, reply, sock, isOwner
}) {
  const p = getPlayer(sender, pushname)
  const vip = isVip(sender)
  const now = Date.now()

  if (command === 'menurpg' || command === 'rpg') {
    const { menuRpg } = require('./menus.js')
    await reply(menuRpg(prefix, 'NAWTY BOT', pushname))
    return true
  }
  if (command === 'menuvip' || command === 'vipmenu') {
    await reply(vipMenuText(prefix, vip))
    return true
  }

  if (command === 'perfilrpg' || command === 'perfilr') {
    p.nome = pushname || p.nome
    setPlayer(sender, p)
    await reply(perfilText(p, sender, vip))
    return true
  }

  if (command === 'carteira' || command === 'saldo' || command === 'bank') {
    await reply(carteiraText(p))
    return true
  }

  if (command === 'inv' || command === 'inventario' || command === 'inventário') {
    await reply(invText(p))
    return true
  }

  if (command === 'loja') {
    await reply(lojaText(prefix))
    return true
  }

  if (command === 'toprpg') {
    await reply(topRpgText())
    return true
  }

  if (command === 'daily' || command === 'diario' || command === 'diário') {
    const cd = 20 * 60 * 60 * 1000
    if (now - (p.lastDaily || 0) < cd) {
      const left = cd - (now - p.lastDaily)
      const h = Math.floor(left / 3600000)
      const m = Math.floor((left % 3600000) / 60000)
      await reply('⏳ Daily em *' + h + 'h ' + m + 'm*.')
      return true
    }
    let gain = 100 + p.nivel * 10
    if (p.inventario.anel) gain = Math.floor(gain * 1.3)
    if (vip) gain *= 2
    p.dinheiro += gain
    const ups = addXp(p, 25)
    p.lastDaily = now
    setPlayer(sender, p)
    let txt = '🎁 Daily coletado!\n💰 +*' + gain + '*' + (vip ? ' (VIP x2)' : '')
    if (ups) txt += '\n⭐ Subiu *' + ups + '* nível(is)!'
    await reply(txt)
    return true
  }

  if (command === 'trabalhar' || command === 'work') {
    const cd = vip ? 5 * 60 * 1000 : 15 * 60 * 1000
    if (now - (p.lastWork || 0) < cd) {
      const left = cd - (now - p.lastWork)
      await reply('⏳ Aguarde *' + Math.ceil(left / 60000) + ' min* para trabalhar.')
      return true
    }
    let gain = 30 + Math.floor(Math.random() * 40) + p.nivel * 3
    if (vip) gain = Math.floor(gain * 1.5)
    p.dinheiro += gain
    const ups = addXp(p, 15)
    p.lastWork = now
    setPlayer(sender, p)
    let txt = '💼 Você trabalhou e ganhou *' + gain + '* coins.'
    if (ups) txt += '\n⭐ Level up!'
    await reply(txt)
    return true
  }

  if (command === 'minerar' || command === 'mine') {
    const cd = vip ? 8 * 60 * 1000 : 20 * 60 * 1000
    if (now - (p.lastMine || 0) < cd) {
      const left = cd - (now - p.lastMine)
      await reply('⏳ Aguarde *' + Math.ceil(left / 60000) + ' min* para minerar.')
      return true
    }
    let gain = 20 + Math.floor(Math.random() * 50)
    if (p.inventario.picareta) gain = Math.floor(gain * 1.4)
    if (vip) gain = Math.floor(gain * 1.5)
    p.dinheiro += gain
    const ups = addXp(p, 20)
    p.lastMine = now
    setPlayer(sender, p)
    let txt = '⛏️ Mineração: +*' + gain + '* coins.'
    if (ups) txt += '\n⭐ Level up!'
    await reply(txt)
    return true
  }

  if (command === 'dep' || command === 'depositar') {
    let val = String(args[0] || '').toLowerCase()
    if (val === 'all' || val === 'tudo') val = p.dinheiro
    else val = parseInt(val, 10)
    if (!val || val <= 0) {
      await reply('Use: ' + prefix + 'dep <valor|all>')
      return true
    }
    if (val > p.dinheiro) {
      await reply('❌ Saldo insuficiente.')
      return true
    }
    p.dinheiro -= val
    p.banco += val
    setPlayer(sender, p)
    await reply('🏦 Depositou *' + val + '*. Banco: *' + p.banco + '*')
    return true
  }

  if (command === 'sacar') {
    let val = String(args[0] || '').toLowerCase()
    if (val === 'all' || val === 'tudo') val = p.banco
    else val = parseInt(val, 10)
    if (!val || val <= 0) {
      await reply('Use: ' + prefix + 'sacar <valor|all>')
      return true
    }
    if (val > p.banco) {
      await reply('❌ Banco insuficiente.')
      return true
    }
    p.banco -= val
    p.dinheiro += val
    setPlayer(sender, p)
    await reply('💵 Sacou *' + val + '*. Carteira: *' + p.dinheiro + '*')
    return true
  }

  if (command === 'pix' || command === 'pay' || command === 'pagar') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const target = mentioned[0]
    const val = parseInt(args.find(a => /^\d+$/.test(a)) || args[1] || args[0], 10)
    if (!target || !val || val <= 0) {
      await reply('Use: ' + prefix + 'pix @user <valor>')
      return true
    }
    if (val > p.dinheiro) {
      await reply('❌ Saldo insuficiente.')
      return true
    }
    const other = getPlayer(target, 'User')
    p.dinheiro -= val
    other.dinheiro += val
    setPlayer(sender, p)
    setPlayer(target, other)
    await reply('💸 Pix de *' + val + '* enviado para @' + uid(target), [target])
    return true
  }

  if (command === 'comprar') {
    const item = String(args[0] || '').toLowerCase()
    if (!LOJA[item]) {
      await reply('Item inválido. Veja: ' + prefix + 'loja')
      return true
    }
    const info = LOJA[item]
    if (p.dinheiro < info.preco) {
      await reply('❌ Precisa de *' + info.preco + '* coins.')
      return true
    }
    p.dinheiro -= info.preco
    p.inventario[item] = (p.inventario[item] || 0) + 1
    setPlayer(sender, p)
    await reply('🛒 Comprou *' + info.nome + '*!\n💰 Restante: *' + p.dinheiro + '*')
    return true
  }

  if (command === 'batalhar' || command === 'batalha' || command === 'fight') {
    if (!isGroup) {
      await reply('Só em grupos.')
      return true
    }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    let alvo = mentioned[0]
    if (!alvo) {
      await reply('Use: ' + prefix + 'batalhar @user')
      return true
    }
    if (uid(alvo) === uid(sender)) {
      await reply('Não pode batalhar consigo mesmo.')
      return true
    }
    const enemy = getPlayer(alvo, 'Rival')
    let powerMe = p.nivel * 10 + Math.random() * 50
    let powerEn = enemy.nivel * 10 + Math.random() * 50
    if (p.inventario.espada) powerMe += 15
    if (p.inventario.escudo) powerEn -= 10
    if (enemy.inventario.espada) powerEn += 15
    if (enemy.inventario.escudo) powerMe -= 10
    const win = powerMe >= powerEn
    const premio = 40 + Math.floor(Math.random() * 40)
    if (win) {
      p.dinheiro += premio
      p.vitorias++
      enemy.derrotas++
      addXp(p, 30)
      setPlayer(sender, p)
      setPlayer(alvo, enemy)
      await reply('⚔️ *Vitória!*\nVocê venceu @' + uid(alvo) + '\n💰 +' + premio, [alvo])
    } else {
      const perda = Math.min(p.dinheiro, Math.floor(premio / 2))
      p.dinheiro -= perda
      p.derrotas++
      enemy.vitorias++
      enemy.dinheiro += perda
      setPlayer(sender, p)
      setPlayer(alvo, enemy)
      await reply('💀 *Derrota...*\n@' + uid(alvo) + ' venceu.\n💸 -' + perda, [alvo])
    }
    return true
  }

  if (command === 'vip') {
    const info = getVipInfo(sender)
    if (!vip) {
      await reply('💎 Você *não* é VIP.\nVeja: ' + prefix + 'menuvip')
      return true
    }
    let exp = info.permanente ? 'Permanente' : new Date(info.expira).toLocaleString('pt-BR')
    await reply('💎 VIP ativo!\n📅 Expira: *' + exp + '*')
    return true
  }

  if (command === 'addvip') {
    if (!isOwner) {
      await reply('❌ Só o dono.')
      return true
    }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const target = mentioned[0]
    if (!target) {
      await reply('Use: ' + prefix + 'addvip @user [dias]\n(0 ou vazio = permanente)')
      return true
    }
    const dias = parseInt(args.find(a => /^\d+$/.test(a)) || '0', 10)
    setVip(target, dias, uid(sender))
    await reply('✅ VIP adicionado para @' + uid(target) + (dias ? ' por *' + dias + '* dias' : ' *permanente*'), [target])
    return true
  }

  if (command === 'delvip') {
    if (!isOwner) {
      await reply('❌ Só o dono.')
      return true
    }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const target = mentioned[0]
    if (!target) {
      await reply('Use: ' + prefix + 'delvip @user')
      return true
    }
    delVip(target)
    await reply('🗑️ VIP removido de @' + uid(target), [target])
    return true
  }

  if (command === 'listvip') {
    if (!isOwner) {
      await reply('❌ Só o dono.')
      return true
    }
    const db = loadVIP()
    const keys = Object.keys(db)
    if (!keys.length) {
      await reply('_Nenhum VIP._')
      return true
    }
    let txt = '💎 *LISTA VIP*\n\n'
    keys.forEach((k, i) => {
      const v = db[k]
      const exp = v.permanente ? '∞' : new Date(v.expira).toLocaleDateString('pt-BR')
      txt += (i + 1) + '. ' + k + ' — ' + exp + '\n'
    })
    await reply(txt)
    return true
  }

  return false
}

module.exports = {
  handleRpg,
  isVip,
  getPlayer,
  LOJA
}
