/**
 * RPG + VIP otimizado (Nazuna-inspired)
 * Salvamento atômico · dono/criador com poderes de economia
 */
const fs = require('fs')
const path = require('path')
const { isCriador, CRIADOR_CONFIG } = require('./criador.js')

const DIR = path.join(__dirname, '../../database')
const RPG_PATH = path.join(DIR, 'rpg.json')
const VIP_PATH = path.join(DIR, 'vip.json')

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })
if (!fs.existsSync(RPG_PATH)) fs.writeFileSync(RPG_PATH, '{}')
if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, '{}')

// cache em memória (menos I/O)
let _rpgCache = null
let _vipCache = null
let _rpgDirty = false
let _vipDirty = false

function atomicWrite(file, data) {
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

function loadRPG() {
  if (_rpgCache) return _rpgCache
  try { _rpgCache = JSON.parse(fs.readFileSync(RPG_PATH, 'utf8')) }
  catch { _rpgCache = {} }
  return _rpgCache
}
function loadVIP() {
  if (_vipCache) return _vipCache
  try { _vipCache = JSON.parse(fs.readFileSync(VIP_PATH, 'utf8')) }
  catch { _vipCache = {} }
  return _vipCache
}
function flushRPG() {
  if (!_rpgDirty || !_rpgCache) return
  atomicWrite(RPG_PATH, _rpgCache)
  _rpgDirty = false
}
function flushVIP() {
  if (!_vipDirty || !_vipCache) return
  atomicWrite(VIP_PATH, _vipCache)
  _vipDirty = false
}
function saveRPG() { _rpgDirty = true; flushRPG() }
function saveVIP() { _vipDirty = true; flushVIP() }

function uid(jid) {
  return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '') || String(jid || '').split('@')[0].split(':')[0]
}

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

/** Dono do config OU número do criador (criador.js) */
function checkOwner(sender, config) {
  if (isCriador(sender)) return true
  const numDono = onlyDigits(config?.NumeroDoDono || '')
  const n = onlyDigits(String(sender || '').split('@')[0].split(':')[0])
  if (!numDono || !n) return false
  return n === numDono || n.endsWith(numDono) || numDono.endsWith(n)
}

function defaultPlayer(name) {
  return {
    nome: name || 'Aventureiro',
    nivel: 1,
    xp: 0,
    xpNext: 100,
    dinheiro: 150,
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
    saveRPG()
  } else if (name && db[id].nome !== name) {
    db[id].nome = name
  }
  return db[id]
}

function setPlayer(jid, data) {
  const db = loadRPG()
  db[uid(jid)] = data
  saveRPG()
}

function addXp(p, amount) {
  p.xp += amount
  let up = 0
  while (p.xp >= p.xpNext && p.nivel < 999) {
    p.xp -= p.xpNext
    p.nivel += 1
    p.xpNext = Math.floor(100 * Math.pow(1.22, p.nivel - 1))
    p.dinheiro += 40 + p.nivel * 2
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
  saveVIP()
  return db[id]
}

function delVip(jid) {
  const db = loadVIP()
  delete db[uid(jid)]
  saveVIP()
}

const LOJA = {
  pocao: { nome: 'Poção HP', preco: 80, desc: 'Item de suporte' },
  espada: { nome: 'Espada de Ferro', preco: 300, desc: '+poder em batalha' },
  escudo: { nome: 'Escudo de Madeira', preco: 220, desc: '-perda em batalha' },
  picareta: { nome: 'Picareta', preco: 150, desc: '+mineração' },
  anel: { nome: 'Anel da Sorte', preco: 500, desc: '+daily' }
}

function box(title, lines, icon = '⚔️') {
  return ['╭┈⊰ ' + icon + ' 『 *' + title + '* 』', ...lines.map(l => '┊' + l), '╰─┈┈┈┈┈◜' + icon + '◞┈┈┈┈┈─╯'].join('\n')
}

function perfilText(p, vip) {
  return box('PERFIL RPG', [
    vip ? '💎 VIP' : '👤 Free',
    '👤 *' + p.nome + '*',
    '⭐ Nível: *' + p.nivel + '*',
    '✨ XP: *' + p.xp + '/' + p.xpNext + '*',
    '💰 Carteira: *' + p.dinheiro + '*',
    '🏦 Banco: *' + p.banco + '*',
    '⚔️ W/L: *' + p.vitorias + '/' + p.derrotas + '*'
  ])
}

function carteiraText(p) {
  return box('CARTEIRA', [
    '💵 Em mãos: *' + p.dinheiro + '*',
    '🏦 Banco: *' + p.banco + '*',
    '📊 Total: *' + (p.dinheiro + p.banco) + '*'
  ], '💰')
}

function invText(p) {
  const keys = Object.keys(p.inventario || {})
  if (!keys.length) return box('INVENTÁRIO', ['_Vazio_'], '🎒')
  return box('INVENTÁRIO', keys.map(k => '• ' + (LOJA[k]?.nome || k) + ' x' + p.inventario[k]), '🎒')
}

function lojaText(prefix) {
  const lines = []
  for (const [k, v] of Object.entries(LOJA)) {
    lines.push('• *' + k + '* — ' + v.nome)
    lines.push('  💰' + v.preco + ' | ' + v.desc)
  }
  lines.push('Use: ' + prefix + 'comprar <item>')
  return box('LOJA RPG', lines, '🛒')
}

function topRpgText(limit = 10) {
  const db = loadRPG()
  const arr = Object.entries(db).map(([id, p]) => ({
    nome: p.nome, nivel: p.nivel || 1, xp: p.xp || 0,
    money: (p.dinheiro || 0) + (p.banco || 0)
  }))
  arr.sort((a, b) => b.nivel - a.nivel || b.xp - a.xp || b.money - a.money)
  const lines = arr.slice(0, limit).map((u, i) =>
    (i + 1) + '. *' + u.nome + '* — Nv.' + u.nivel + ' | 💰' + u.money
  )
  if (!lines.length) lines.push('_Ninguém ainda_')
  return box('TOP RPG', lines, '🏆')
}

function resolveTarget(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentioned[0]) return mentioned[0]
  // número cru nos args
  const num = args.find(a => /^\d{8,15}$/.test(a.replace(/\D/g, '')) && a.replace(/\D/g, '').length >= 8)
  if (num) {
    const d = onlyDigits(num)
    return d + '@s.whatsapp.net'
  }
  return null
}

function parseAmount(args, fallbackIndex = 0) {
  for (const a of args) {
    if (/^\d+$/.test(a)) return parseInt(a, 10)
  }
  return null
}

async function handleRpg(ctx) {
  const {
    command, args, q, sender, pushname, from, isGroup, msg,
    prefix, reply, sock, isOwner: isOwnerFlag, config
  } = ctx

  const owner = isOwnerFlag || checkOwner(sender, config || {})
  const p = getPlayer(sender, pushname)
  const vip = isVip(sender)
  const now = Date.now()

  // —— menus ——
  if (command === 'menurpg' || command === 'rpg') {
    const { menuRpg } = require('./menus.js')
    await reply(menuRpg(prefix, 'NAWTY BOT', pushname))
    return true
  }
  if (command === 'menuvip' || command === 'vipmenu') {
    const { menuVip } = require('./menus.js')
    await reply(menuVip(prefix, 'NAWTY BOT', pushname))
    return true
  }

  if (command === 'perfilrpg' || command === 'perfilr') {
    await reply(perfilText(p, vip))
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

  // —— economia jogador ——
  if (command === 'daily' || command === 'diario' || command === 'diário') {
    const cd = 20 * 60 * 60 * 1000
    if (now - (p.lastDaily || 0) < cd) {
      const left = cd - (now - p.lastDaily)
      await reply('⏳ Daily em *' + Math.floor(left / 3600000) + 'h ' + Math.floor((left % 3600000) / 60000) + 'm*.')
      return true
    }
    let gain = 120 + p.nivel * 12
    if (p.inventario.anel) gain = Math.floor(gain * 1.35)
    if (vip) gain *= 2
    p.dinheiro += gain
    const ups = addXp(p, 30)
    p.lastDaily = now
    setPlayer(sender, p)
    let txt = '🎁 Daily! 💰 +*' + gain + '*' + (vip ? ' (VIP x2)' : '')
    if (ups) txt += '\n⭐ +' + ups + ' nível(is)!'
    await reply(txt)
    return true
  }

  if (command === 'trabalhar' || command === 'work') {
    const cd = vip ? 4 * 60 * 1000 : 12 * 60 * 1000
    if (now - (p.lastWork || 0) < cd) {
      await reply('⏳ Aguarde *' + Math.ceil((cd - (now - p.lastWork)) / 60000) + ' min*.')
      return true
    }
    let gain = 35 + Math.floor(Math.random() * 45) + p.nivel * 4
    if (vip) gain = Math.floor(gain * 1.5)
    p.dinheiro += gain
    const ups = addXp(p, 18)
    p.lastWork = now
    setPlayer(sender, p)
    await reply('💼 +*' + gain + '* coins.' + (ups ? '\n⭐ Level up!' : ''))
    return true
  }

  if (command === 'minerar' || command === 'mine') {
    const cd = vip ? 6 * 60 * 1000 : 18 * 60 * 1000
    if (now - (p.lastMine || 0) < cd) {
      await reply('⏳ Aguarde *' + Math.ceil((cd - (now - p.lastMine)) / 60000) + ' min*.')
      return true
    }
    let gain = 25 + Math.floor(Math.random() * 55)
    if (p.inventario.picareta) gain = Math.floor(gain * 1.45)
    if (vip) gain = Math.floor(gain * 1.5)
    p.dinheiro += gain
    const ups = addXp(p, 22)
    p.lastMine = now
    setPlayer(sender, p)
    await reply('⛏️ +*' + gain + '* coins.' + (ups ? '\n⭐ Level up!' : ''))
    return true
  }

  if (command === 'dep' || command === 'depositar') {
    let val = String(args[0] || '').toLowerCase()
    val = (val === 'all' || val === 'tudo') ? p.dinheiro : parseInt(val, 10)
    if (!val || val <= 0) { await reply(prefix + 'dep <valor|all>'); return true }
    if (val > p.dinheiro) { await reply('❌ Saldo insuficiente.'); return true }
    p.dinheiro -= val; p.banco += val; setPlayer(sender, p)
    await reply('🏦 Depositou *' + val + '*. Banco: *' + p.banco + '*')
    return true
  }

  if (command === 'sacar') {
    let val = String(args[0] || '').toLowerCase()
    val = (val === 'all' || val === 'tudo') ? p.banco : parseInt(val, 10)
    if (!val || val <= 0) { await reply(prefix + 'sacar <valor|all>'); return true }
    if (val > p.banco) { await reply('❌ Banco insuficiente.'); return true }
    p.banco -= val; p.dinheiro += val; setPlayer(sender, p)
    await reply('💵 Sacou *' + val + '*. Carteira: *' + p.dinheiro + '*')
    return true
  }

  if (command === 'pix' || command === 'pay' || command === 'pagar') {
    const target = resolveTarget(msg, args)
    const val = parseAmount(args)
    if (!target || !val || val <= 0) { await reply(prefix + 'pix @user <valor>'); return true }
    if (uid(target) === uid(sender)) { await reply('❌ Não pode pix para si.'); return true }
    if (val > p.dinheiro) { await reply('❌ Saldo insuficiente.'); return true }
    const other = getPlayer(target, 'User')
    p.dinheiro -= val; other.dinheiro += val
    setPlayer(sender, p); setPlayer(target, other)
    await reply('💸 Pix *' + val + '* → @' + uid(target), [target])
    return true
  }

  if (command === 'comprar') {
    const item = String(args[0] || '').toLowerCase()
    if (!LOJA[item]) { await reply('Item inválido. ' + prefix + 'loja'); return true }
    const info = LOJA[item]
    if (p.dinheiro < info.preco) { await reply('❌ Precisa de *' + info.preco + '*.'); return true }
    p.dinheiro -= info.preco
    p.inventario[item] = (p.inventario[item] || 0) + 1
    setPlayer(sender, p)
    await reply('🛒 *' + info.nome + '* comprado!\n💰 ' + p.dinheiro)
    return true
  }

  if (command === 'batalhar' || command === 'batalha' || command === 'fight') {
    if (!isGroup) { await reply('Só em grupos.'); return true }
    const alvo = resolveTarget(msg, args)
    if (!alvo) { await reply(prefix + 'batalhar @user'); return true }
    if (uid(alvo) === uid(sender)) { await reply('❌ Impossível.'); return true }
    const enemy = getPlayer(alvo, 'Rival')
    let powerMe = p.nivel * 12 + Math.random() * 55 + (p.inventario.espada ? 18 : 0)
    let powerEn = enemy.nivel * 12 + Math.random() * 55 + (enemy.inventario.espada ? 18 : 0)
    if (p.inventario.escudo) powerEn *= 0.9
    if (enemy.inventario.escudo) powerMe *= 0.9
    const premio = 45 + Math.floor(Math.random() * 50)
    if (powerMe >= powerEn) {
      p.dinheiro += premio; p.vitorias++; enemy.derrotas++; addXp(p, 35)
      setPlayer(sender, p); setPlayer(alvo, enemy)
      await reply('⚔️ *Vitória* vs @' + uid(alvo) + '\n💰 +' + premio, [alvo])
    } else {
      const perda = Math.min(p.dinheiro, Math.floor(premio / 2))
      p.dinheiro -= perda; p.derrotas++; enemy.vitorias++; enemy.dinheiro += perda
      setPlayer(sender, p); setPlayer(alvo, enemy)
      await reply('💀 *Derrota* vs @' + uid(alvo) + '\n💸 -' + perda, [alvo])
    }
    return true
  }

  // —— VIP ——
  if (command === 'vip') {
    if (!vip) { await reply('💎 Você não é VIP.\n' + prefix + 'menuvip'); return true }
    const info = getVipInfo(sender)
    const exp = info.permanente ? 'Permanente' : new Date(info.expira).toLocaleString('pt-BR')
    await reply('💎 VIP ativo!\n📅 *' + exp + '*')
    return true
  }

  if (command === 'addvip') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    if (!target) { await reply(prefix + 'addvip @user [dias]\n(0 = permanente)'); return true }
    const dias = parseAmount(args) || 0
    setVip(target, dias, uid(sender))
    await reply('✅ VIP → @' + uid(target) + (dias ? ' (*' + dias + '* dias)' : ' (*permanente*)'), [target])
    return true
  }

  if (command === 'delvip') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    if (!target) { await reply(prefix + 'delvip @user'); return true }
    delVip(target)
    await reply('🗑️ VIP removido de @' + uid(target), [target])
    return true
  }

  if (command === 'listvip') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const db = loadVIP()
    const keys = Object.keys(db)
    if (!keys.length) { await reply('_Nenhum VIP._'); return true }
    let txt = '💎 *LISTA VIP*\n\n'
    keys.forEach((k, i) => {
      const v = db[k]
      txt += (i + 1) + '. ' + k + ' — ' + (v.permanente ? '∞' : new Date(v.expira).toLocaleDateString('pt-BR')) + '\n'
    })
    await reply(txt)
    return true
  }

  // —— DONO: economia ——
  if (command === 'addcoins' || command === 'addcoin' || command === 'darcoins') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    const val = parseAmount(args)
    if (!target || !val || val <= 0) {
      await reply(prefix + 'addcoins @user <valor>\n' + prefix + 'addcoins 5511... <valor>')
      return true
    }
    const t = getPlayer(target, 'User')
    t.dinheiro += val
    setPlayer(target, t)
    await reply('💰 +*' + val + '* coins para @' + uid(target) + '\nSaldo: *' + t.dinheiro + '*', [target])
    return true
  }

  if (command === 'delcoins' || command === 'removecoins' || command === 'tirarcoins' || command === 'rmcoins') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    const val = parseAmount(args)
    if (!target || !val || val <= 0) {
      await reply(prefix + 'delcoins @user <valor>')
      return true
    }
    const t = getPlayer(target, 'User')
    const tirar = Math.min(t.dinheiro, val)
    t.dinheiro -= tirar
    setPlayer(target, t)
    await reply('💸 -*' + tirar + '* coins de @' + uid(target) + '\nSaldo: *' + t.dinheiro + '*', [target])
    return true
  }

  if (command === 'setcoins') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    const val = parseAmount(args)
    if (!target || val === null || val < 0) {
      await reply(prefix + 'setcoins @user <valor>')
      return true
    }
    const t = getPlayer(target, 'User')
    t.dinheiro = val
    setPlayer(target, t)
    await reply('🔧 Coins de @' + uid(target) + ' = *' + val + '*', [target])
    return true
  }

  if (command === 'sorteio' || command === 'sortearcoins') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    if (!isGroup) { await reply('Sorteio só em *grupo*.'); return true }
    const val = parseAmount(args) || 100
    if (val <= 0) { await reply(prefix + 'sorteio <valor>'); return true }
    try {
      const meta = await sock.groupMetadata(from)
      const parts = (meta.participants || [])
        .map(x => x.id)
        .filter(id => id && !id.includes('status') && id !== sock.user?.id)
      if (!parts.length) { await reply('Sem participantes.'); return true }
      const winner = parts[Math.floor(Math.random() * parts.length)]
      const t = getPlayer(winner, 'Sorteado')
      t.dinheiro += val
      setPlayer(winner, t)
      await reply(
        box('SORTEIO', [
          '🎉 Ganhador: @' + uid(winner),
          '💰 Prêmio: *' + val + '* coins',
          '👥 No sorteio: *' + parts.length + '*'
        ], '🎰'),
        [winner]
      )
    } catch (e) {
      await reply('❌ Erro no sorteio.')
    }
    return true
  }

  if (command === 'resetRpg' || command === 'resetrpg') {
    if (!owner) { await reply('❌ Só dono/criador.'); return true }
    const target = resolveTarget(msg, args)
    if (!target) { await reply(prefix + 'resetrpg @user'); return true }
    const db = loadRPG()
    db[uid(target)] = defaultPlayer('Aventureiro')
    saveRPG()
    await reply('🔄 RPG resetado: @' + uid(target), [target])
    return true
  }

  return false
}

module.exports = {
  handleRpg,
  isVip,
  getPlayer,
  checkOwner,
  LOJA,
  flushRPG,
  flushVIP
}
