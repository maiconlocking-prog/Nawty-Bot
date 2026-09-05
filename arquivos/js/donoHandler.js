/**
 * Comandos de DONO (inspirados na Nazuna) — offline / funcionais
 */
const fs = require('fs')
const path = require('path')
const { isCriador } = require('./criador.js')

const DB = path.join(__dirname, '../../database')
const CONFIG_PATH = path.join(DB, 'config.json')
const BLOCK_PATH = path.join(DB, 'block.json')
const BANGP_PATH = path.join(DB, 'bangp.json')
const BLACK_PATH = path.join(DB, 'blacklist.json')

for (const p of [BLOCK_PATH, BANGP_PATH, BLACK_PATH]) {
  if (!fs.existsSync(p)) fs.writeFileSync(p, '[]')
}

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

function uid(jid) {
  return onlyDigits(String(jid || '').split('@')[0].split(':')[0]) ||
    String(jid || '').split('@')[0].split(':')[0]
}

function loadJson(p, fb) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return fb }
}
function saveJson(p, data) {
  const tmp = p + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, p)
}

function loadConfig() {
  return loadJson(CONFIG_PATH, {})
}
function saveConfig(cfg) {
  saveJson(CONFIG_PATH, cfg)
}

function isOwnerSender(sender, config, msg) {
  try {
    const { isOwnerOrCriador } = require('./ownerCheck.js')
    return isOwnerOrCriador(sender, config, msg)
  } catch {
    if (isCriador(sender, msg)) return true
    const numDono = onlyDigits(config?.NumeroDoDono || '')
    const n = onlyDigits(String(sender || '').split('@')[0].split(':')[0])
    if (!numDono || !n) return false
    return n === numDono || n.endsWith(numDono) || numDono.endsWith(n)
  }
}

function loadList(p) {
  const d = loadJson(p, [])
  return Array.isArray(d) ? d : []
}
function saveList(p, arr) {
  saveJson(p, arr)
}

function isBlocked(jid) {
  const id = uid(jid)
  return loadList(BLOCK_PATH).includes(id) || loadList(BLACK_PATH).includes(id)
}

function isGroupBanned(jid) {
  return loadList(BANGP_PATH).includes(String(jid))
}

function resolveTarget(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentioned[0]) return mentioned[0]
  for (const a of args) {
    const d = onlyDigits(a)
    if (d.length >= 8) return d + '@s.whatsapp.net'
  }
  const p = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (p) return p
  return null
}

function box(title, lines) {
  return ['╭┈⊰ 👑 『 *' + title + '* 』', ...lines.map(l => '┊' + l), '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'].join('\n')
}

async function handleDono(ctx) {
  const {
    command, args, q, sender, pushname, from, isGroup, msg,
    prefix, reply, sock, config, isOwner
  } = ctx

  const owner = isOwner || isOwnerSender(sender, config, msg)

  const donoCmds = new Set([
    'prefixo', 'numerodono', 'nomedono', 'nomebot',
    'fotobot', 'blockuserg', 'unblockuserg', 'listblocks',
    'addblackglobal', 'rmblackglobal', 'listblackglobal',
    'bangp', 'unbangp', 'listbangp',
    'tm', 'tm2', 'divulgar', 'divdono', 'listagp',
    'entrar', 'sairgp', 'reiniciar',
    'seradm', 'sermembro',
    'limpardb', 'limparrankg',
    'addpremium', 'delpremium', 'listprem',
    'addnopref', 'delnopref', 'listnopref',
    'msgprefix', 'viewmsg', 'nuke'
  ])

  if (!donoCmds.has(command)) return false
  if (!owner) {
    await reply('❌ Só o *dono/criador* pode usar este comando.')
    return true
  }

  if (command === 'prefixo') {
    const novo = (args[0] || '').trim()
    if (!novo || novo.length > 3) {
      await reply(box('PREFIXO', ['Atual: *' + (config.prefix || '¥') + '*', 'Use: ' + prefix + 'prefixo <novo>']))
      return true
    }
    const cfg = loadConfig()
    cfg.prefix = novo
    saveConfig(cfg)
    config.prefix = novo
    await reply('✅ Prefixo alterado para: *' + novo + '*\n_Reinicie o bot se não aplicar na hora._')
    return true
  }

  if (command === 'numerodono') {
    const n = onlyDigits(args[0] || q)
    if (!n || n.length < 8) {
      await reply(box('NÚMERO DONO', ['Atual: *' + (config.NumeroDoDono || '—') + '*', 'Use: ' + prefix + 'numerodono 5511...']))
      return true
    }
    const cfg = loadConfig()
    cfg.NumeroDoDono = n
    saveConfig(cfg)
    config.NumeroDoDono = n
    await reply('✅ Número do dono: *' + n + '*')
    return true
  }

  if (command === 'nomedono') {
    if (!q) {
      await reply(box('NOME DONO', ['Atual: *' + (config.NomeDoDono || '—') + '*', 'Use: ' + prefix + 'nomedono <nome>']))
      return true
    }
    const cfg = loadConfig()
    cfg.NomeDoDono = q
    saveConfig(cfg)
    config.NomeDoDono = q
    await reply('✅ Nome do dono: *' + q + '*')
    return true
  }

  if (command === 'nomebot') {
    if (!q) {
      await reply(box('NOME BOT', ['Atual: *' + (config.NomeDoBot || '—') + '*', 'Use: ' + prefix + 'nomebot <nome>']))
      return true
    }
    const cfg = loadConfig()
    cfg.NomeDoBot = q
    saveConfig(cfg)
    config.NomeDoBot = q
    await reply('✅ Nome do bot: *' + q + '*')
    return true
  }

  if (command === 'fotobot') {
    const img = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
    if (!img) {
      await reply('Marque ou envie uma *imagem* com ' + prefix + 'fotobot')
      return true
    }
    try {
      const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
      const stream = await downloadContentFromMessage(img, 'image')
      let buf = Buffer.from([])
      for await (const c of stream) buf = Buffer.concat([buf, c])
      await sock.updateProfilePicture(sock.user.id, buf)
      await reply('✅ Foto do bot atualizada!')
    } catch (e) {
      await reply('❌ Erro ao mudar foto: ' + (e.message || e))
    }
    return true
  }

  if (command === 'blockuserg') {
    const t = resolveTarget(msg, args)
    if (!t) { await reply(prefix + 'blockuserg @user'); return true }
    const list = loadList(BLOCK_PATH)
    const id = uid(t)
    if (!list.includes(id)) list.push(id)
    saveList(BLOCK_PATH, list)
    try { await sock.updateBlockStatus(t, 'block') } catch {}
    await reply('🚫 Usuário bloqueado: @' + id, [t])
    return true
  }

  if (command === 'unblockuserg') {
    const t = resolveTarget(msg, args)
    if (!t) { await reply(prefix + 'unblockuserg @user'); return true }
    const list = loadList(BLOCK_PATH).filter(x => x !== uid(t))
    saveList(BLOCK_PATH, list)
    try { await sock.updateBlockStatus(t, 'unblock') } catch {}
    await reply('✅ Desbloqueado: @' + uid(t), [t])
    return true
  }

  if (command === 'listblocks') {
    const list = loadList(BLOCK_PATH)
    await reply(list.length ? box('BLOCKS', list.map((x, i) => (i + 1) + '. ' + x)) : '_Nenhum bloqueado._')
    return true
  }

  if (command === 'addblackglobal') {
    const t = resolveTarget(msg, args)
    if (!t) { await reply(prefix + 'addblackglobal @user'); return true }
    const list = loadList(BLACK_PATH)
    const id = uid(t)
    if (!list.includes(id)) list.push(id)
    saveList(BLACK_PATH, list)
    await reply('⬛ Blacklist: @' + id, [t])
    return true
  }

  if (command === 'rmblackglobal') {
    const t = resolveTarget(msg, args)
    if (!t) { await reply(prefix + 'rmblackglobal @user'); return true }
    saveList(BLACK_PATH, loadList(BLACK_PATH).filter(x => x !== uid(t)))
    await reply('✅ Removido da blacklist: @' + uid(t), [t])
    return true
  }

  if (command === 'listblackglobal') {
    const list = loadList(BLACK_PATH)
    await reply(list.length ? box('BLACKLIST', list.map((x, i) => (i + 1) + '. ' + x)) : '_Vazia._')
    return true
  }

  if (command === 'bangp') {
    const gp = isGroup ? from : (args[0] || '')
    if (!gp || !String(gp).endsWith('@g.us')) {
      await reply('Use *no grupo* ou: ' + prefix + 'bangp id@g.us')
      return true
    }
    const list = loadList(BANGP_PATH)
    if (!list.includes(gp)) list.push(gp)
    saveList(BANGP_PATH, list)
    await reply('🚫 Grupo banido do bot.')
    return true
  }

  if (command === 'unbangp') {
    const gp = isGroup ? from : (args[0] || '')
    saveList(BANGP_PATH, loadList(BANGP_PATH).filter(x => x !== gp))
    await reply('✅ Grupo desbanido.')
    return true
  }

  if (command === 'listbangp') {
    const list = loadList(BANGP_PATH)
    await reply(list.length ? box('GRUPOS BANIDOS', list.map((x, i) => (i + 1) + '. ' + x)) : '_Nenhum._')
    return true
  }

  if (command === 'tm' || command === 'tm2' || command === 'divulgar' || command === 'divdono') {
    if (!q) {
      await reply(box('TRANSMISSÃO', ['Use: ' + prefix + 'tm <mensagem>', 'Envia para todos os grupos do bot.']))
      return true
    }
    let groups = []
    try {
      groups = await sock.groupFetchAllParticipating()
      groups = Object.keys(groups || {})
    } catch {
      await reply('❌ Não foi possível listar grupos.')
      return true
    }
    let okc = 0, fail = 0
    await reply('📡 Enviando para *' + groups.length + '* grupos...')
    for (const g of groups) {
      try {
        await sock.sendMessage(g, { text: '📢 *Comunicado*\n\n' + q })
        okc++
        await new Promise(r => setTimeout(r, 800))
      } catch { fail++ }
    }
    await reply('✅ Enviados: *' + okc + '*\n❌ Falhas: *' + fail + '*')
    return true
  }

  if (command === 'listagp') {
    try {
      const groups = await sock.groupFetchAllParticipating()
      const entries = Object.values(groups || {})
      if (!entries.length) { await reply('_Bot não está em grupos._'); return true }
      const lines = entries.slice(0, 40).map((g, i) => (i + 1) + '. ' + (g.subject || '?') + '\n   ' + g.id)
      await reply(box('GRUPOS (' + entries.length + ')', lines))
    } catch {
      await reply('❌ Erro ao listar grupos.')
    }
    return true
  }

  if (command === 'entrar') {
    const link = q || args[0] || ''
    const code = link.replace('https://chat.whatsapp.com/', '').replace('http://chat.whatsapp.com/', '').trim()
    if (!code) { await reply(prefix + 'entrar <link do grupo>'); return true }
    try {
      const res = await sock.groupAcceptInvite(code)
      await reply('✅ Entrou no grupo: ' + (res || code))
    } catch (e) {
      await reply('❌ Não foi possível entrar: ' + (e.message || e))
    }
    return true
  }

  if (command === 'sairgp') {
    if (!isGroup) { await reply('Use dentro do grupo.'); return true }
    await reply('👋 Saindo do grupo...')
    try { await sock.groupLeave(from) } catch (e) { await reply('❌ ' + (e.message || e)) }
    return true
  }

  if (command === 'reiniciar') {
    await reply('🔄 Reiniciando bot...')
    setTimeout(() => process.exit(0), 800)
    return true
  }

  if (command === 'seradm') {
    if (!isGroup) { await reply('Só em grupo.'); return true }
    try {
      await sock.groupParticipantsUpdate(from, [sock.user.id], 'promote')
      await reply('✅ Tentei me promover a admin.')
    } catch {
      await reply('❌ Preciso ser admin ou não tenho permissão.')
    }
    return true
  }

  if (command === 'sermembro') {
    if (!isGroup) { await reply('Só em grupo.'); return true }
    try {
      await sock.groupParticipantsUpdate(from, [sock.user.id], 'demote')
      await reply('✅ Tentei me rebaixar a membro.')
    } catch {
      await reply('❌ Falha ao rebaixar.')
    }
    return true
  }

  if (command === 'nuke') {
    if (!isGroup) { await reply('Só em grupo.'); return true }
    if ((args[0] || '').toLowerCase() !== 'confirmar') {
      await reply('⚠️ Isso faz o bot *sair do grupo*.\nConfirme: ' + prefix + 'nuke confirmar')
      return true
    }
    await reply('💥 Saindo...')
    try { await sock.groupLeave(from) } catch {}
    return true
  }

  if (command === 'limpardb') {
    if ((args[0] || '').toLowerCase() !== 'confirmar') {
      await reply('⚠️ Apaga dados de ranks/atividade.\n' + prefix + 'limpardb confirmar')
      return true
    }
    for (const f of ['ranks.json', 'atividade.json']) {
      try { fs.writeFileSync(path.join(DB, f), '{}') } catch {}
    }
    await reply('🧹 ranks/atividade limpos.')
    return true
  }

  if (command === 'limparrankg') {
    try { fs.writeFileSync(path.join(DB, 'ranks.json'), '{}') } catch {}
    await reply('🧹 Ranks limpos.')
    return true
  }

  if (command === 'addpremium') {
    const { handleRpg } = require('./rpg.js')
    return handleRpg({ ...ctx, command: 'addvip', isOwner: true })
  }
  if (command === 'delpremium') {
    const { handleRpg } = require('./rpg.js')
    return handleRpg({ ...ctx, command: 'delvip', isOwner: true })
  }
  if (command === 'listprem') {
    const { handleRpg } = require('./rpg.js')
    return handleRpg({ ...ctx, command: 'listvip', isOwner: true })
  }

  if (command === 'listnopref') {
    const { listAliases } = require('./semprefixo.js')
    const map = listAliases()
    const keys = Object.keys(map)
    await reply(keys.length ? box('SEM PREFIXO', keys.map(k => k.toUpperCase() + ' → ' + prefix + map[k])) : '_Vazio_')
    return true
  }
  if (command === 'addnopref') {
    const { addAlias } = require('./semprefixo.js')
    if (!args[0] || !args[1]) { await reply(prefix + 'addnopref S s'); return true }
    const r = addAlias(args[0], args[1])
    await reply(r.ok ? '✅ ' + r.alias + ' → ' + r.command : '❌ ' + r.msg)
    return true
  }
  if (command === 'delnopref') {
    const { delAlias } = require('./semprefixo.js')
    if (!args[0]) { await reply(prefix + 'delnopref S'); return true }
    const r = delAlias(args[0])
    await reply(r.ok ? '✅ Removido' : '❌ ' + r.msg)
    return true
  }

  if (command === 'msgprefix' || command === 'viewmsg') {
    await reply(box('INFO', [
      'Prefixo: *' + (config.prefix || '¥') + '*',
      'Bot: *' + (config.NomeDoBot || 'Nawty') + '*',
      'Dono: *' + (config.NomeDoDono || '—') + '*',
      'Número: *' + (config.NumeroDoDono || '—') + '*'
    ]))
    return true
  }

  return false
}

module.exports = {
  handleDono,
  isBlocked,
  isGroupBanned,
  isOwnerSender
}
