const fs = require('fs')
const path = require('path')
const {
  registrarAtividade,
  getRankAtivo,
  isGroupAdmin,
  botIsAdmin,
  getParticipants,
  pickRandom,
  loadRanks
} = require('./groupAdmin.js')
const { getGroupSec, setGroupSec } = require('./security.js')
const {
  rankFunReply,
  rankAtivoReply,
  adminOk,
  secStatus,
  wrap,
  ok,
  fail
} = require('./style.js')

const FUN_RANK_CMDS = Object.keys(loadRanks())

function parseOnOff(v) {
  if (v === '1' || v === 'on' || v === 'ativar') return true
  if (v === '0' || v === 'off' || v === 'desativar') return false
  return null
}

async function handleAdminAndRanks({
  nawty, msg, from, isGroup, sender, pushname, command, args, q, prefix, reply, replyWithFoto, botName
}) {
  const secCmds = ['antilink','antiflood','antipalavra','antidoc','antiloc','seguranca']
  const needAdmin = ['marcar','hidetag','ban','kick','promover','rebaixar','grupo','linkgp','del','resetativo', ...secCmds]

  if (needAdmin.includes(command)) {
    if (!isGroup) { await reply(fail('Só em grupos.')); return true }
    const adm = await isGroupAdmin(nawty, from, sender)
    if (!adm) { await reply(fail('Só *admins* podem usar este comando.')); return true }
    if (['ban','kick','promover','rebaixar','grupo'].includes(command)) {
      const botAdm = await botIsAdmin(nawty, from)
      if (!botAdm) { await reply(fail('O bot precisa ser *admin* do grupo.')); return true }
    }
  }

  if (command === 'seguranca') {
    await reply(secStatus(getGroupSec(from)))
    return true
  }

  if (command === 'antilink') {
    const v = parseOnOff((args[0] || '').toLowerCase())
    if (v === null) { await reply(wrap('🔗 ANTILINK', 'Use: ' + prefix + 'antilink *1* ou *0*')); return true }
    setGroupSec(from, { antilink: v })
    await reply(adminOk(v ? 'Antilink *ativado*' : 'Antilink *desativado*'))
    return true
  }

  if (command === 'antiflood') {
    const v = parseOnOff((args[0] || '').toLowerCase())
    if (v === null) { await reply(wrap('🌊 ANTIFLOOD', 'Use: ' + prefix + 'antiflood *1* ou *0*')); return true }
    setGroupSec(from, { antiflood: v })
    await reply(adminOk(v ? 'Antiflood *ativado*' : 'Antiflood *desativado*'))
    return true
  }

  if (command === 'antidoc') {
    const v = parseOnOff((args[0] || '').toLowerCase())
    if (v === null) { await reply(wrap('📄 ANTIDOC', 'Use: ' + prefix + 'antidoc *1/0*')); return true }
    setGroupSec(from, { antidoc: v })
    await reply(adminOk(v ? 'Antidoc *ativado*' : 'Antidoc *desativado*'))
    return true
  }

  if (command === 'antiloc') {
    const v = parseOnOff((args[0] || '').toLowerCase())
    if (v === null) { await reply(wrap('📍 ANTILOC', 'Use: ' + prefix + 'antiloc *1/0*')); return true }
    setGroupSec(from, { antiloc: v })
    await reply(adminOk(v ? 'Antiloc *ativado*' : 'Antiloc *desativado*'))
    return true
  }

  if (command === 'antipalavra') {
    const sub = (args[0] || '').toLowerCase()
    const s = getGroupSec(from)
    if (sub === '1' || sub === 'on' || sub === '0' || sub === 'off') {
      const v = parseOnOff(sub)
      setGroupSec(from, { antipalavra: v })
      await reply(adminOk(v ? 'Antipalavra *ativado*' : 'Antipalavra *desativado*'))
      return true
    }
    if (sub === 'list' || sub === 'lista') {
      const lista = s.palavras || []
      await reply(wrap('📝 PALAVRAS', lista.length ? lista.map(p => '• ' + p).join('\n') : '_Lista vazia_'))
      return true
    }
    if (sub === 'add' && args[1]) {
      const p = args.slice(1).join(' ').toLowerCase()
      const palavras = Array.from(new Set([...(s.palavras || []), p]))
      setGroupSec(from, { palavras })
      await reply(adminOk('Palavra adicionada: *' + p + '*'))
      return true
    }
    if ((sub === 'del' || sub === 'rm') && args[1]) {
      const p = args.slice(1).join(' ').toLowerCase()
      const palavras = (s.palavras || []).filter(x => x !== p)
      setGroupSec(from, { palavras })
      await reply(adminOk('Palavra removida: *' + p + '*'))
      return true
    }
    await reply(wrap('🚫 ANTIPALAVRA', [
      prefix + 'antipalavra 1/0',
      prefix + 'antipalavra add palavra',
      prefix + 'antipalavra del palavra',
      prefix + 'antipalavra list'
    ].join('\n')))
    return true
  }

  if (command === 'marcar') {
    const members = await getParticipants(nawty, from)
    const texto = q || '📢 Marcação geral'
    const mentionsText = members.map(j => '@' + j.split('@')[0]).join(' ')
    await nawty.sendMessage(from, {
      text: wrap('📢 MARCAR', texto + '\n\n' + mentionsText),
      mentions: members
    }, { quoted: msg })
    return true
  }

  if (command === 'hidetag') {
    const members = await getParticipants(nawty, from)
    const texto = q || '📢'
    await nawty.sendMessage(from, { text: texto, mentions: members }, { quoted: msg })
    return true
  }

  if (command === 'ban' || command === 'kick') {
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : [])
    if (!targets.length) {
      await reply(wrap('🚫 BAN', 'Marque ou responda quem deseja remover.\nEx: ' + prefix + 'ban @user'))
      return true
    }
    try {
      await nawty.groupParticipantsUpdate(from, targets, 'remove')
      await reply(adminOk('Removido(s) do grupo.'))
    } catch {
      await reply(fail('Falha ao remover. Verifique permissões.'))
    }
    return true
  }

  if (command === 'promover' || command === 'rebaixar') {
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : [])
    if (!targets.length) {
      await reply(wrap('⬆️ CARGO', 'Marque alguém.\nEx: ' + prefix + command + ' @user'))
      return true
    }
    try {
      await nawty.groupParticipantsUpdate(from, targets, command === 'promover' ? 'promote' : 'demote')
      await reply(adminOk(command === 'promover' ? 'Promovido a admin.' : 'Rebaixado.'))
    } catch {
      await reply(fail('Falha na operação.'))
    }
    return true
  }

  if (command === 'grupo') {
    const op = (args[0] || '').toLowerCase()
    if (!['a','f','abrir','fechar','open','close'].includes(op)) {
      await reply(wrap('⚙️ GRUPO', prefix + 'grupo *a* (abrir)\n' + prefix + 'grupo *f* (fechar)'))
      return true
    }
    const open = ['a','abrir','open'].includes(op)
    try {
      await nawty.groupSettingUpdate(from, open ? 'not_announcement' : 'announcement')
      await reply(adminOk(open ? 'Grupo *aberto* para todos.' : 'Grupo *fechado* (só admins).'))
    } catch {
      await reply(fail('Não foi possível alterar o grupo.'))
    }
    return true
  }

  if (command === 'linkgp') {
    try {
      const code = await nawty.groupInviteCode(from)
      await reply(wrap('🔗 LINK DO GRUPO', 'https://chat.whatsapp.com/' + code))
    } catch {
      await reply(fail('Não foi possível obter o link (bot precisa ser admin).'))
    }
    return true
  }

  if (command === 'del') {
    const ctx = msg.message.extendedTextMessage?.contextInfo
    if (!ctx?.stanzaId) {
      await reply(wrap('🗑️ DEL', 'Responda a mensagem que deseja apagar com ' + prefix + 'del'))
      return true
    }
    try {
      await nawty.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: !ctx.participant,
          id: ctx.stanzaId,
          participant: ctx.participant
        }
      })
    } catch {
      await reply(fail('Não consegui apagar.'))
    }
    return true
  }

  if (command === 'rankativo') {
    if (!isGroup) { await reply(fail('Só em grupos.')); return true }
    const ranking = getRankAtivo(from, 10)
    if (!ranking.length) { await reply(wrap('📊 RANK ATIVOS', '_Ainda não há atividade registrada._')); return true }
    const mentions = ranking.map(([jid]) => jid)
    await nawty.sendMessage(from, { text: rankAtivoReply(ranking), mentions }, { quoted: msg })
    return true
  }

  if (command === 'resetativo') {
    if (!isGroup) { await reply(fail('Só em grupos.')); return true }
    const ATIV = path.join(__dirname, '../../database/atividade.json')
    let data = {}
    try { data = JSON.parse(fs.readFileSync(ATIV, 'utf8')) } catch {}
    delete data[from]
    fs.writeFileSync(ATIV, JSON.stringify(data, null, 2))
    await reply(adminOk('Rank de atividade resetado neste grupo.'))
    return true
  }

  if (FUN_RANK_CMDS.includes(command)) {
    if (!isGroup) { await reply(fail('Ranks só em grupos.')); return true }
    const ranks = loadRanks()
    const title = ranks[command] || ('🏆 *' + command + '*')
    const members = await getParticipants(nawty, from)
    let filtered = members.filter(j => j !== nawty.user?.id)
    if (!filtered.length) filtered = members
    if (!filtered.length) { await reply(fail('Nenhum membro encontrado.')); return true }
    const n = Math.min(10, Math.max(1, filtered.length))
    const chosen = pickRandom(filtered, n)
    const scores = chosen.map(() => Math.floor(Math.random() * 101)).sort((a, b) => b - a)
    await nawty.sendMessage(from, {
      text: rankFunReply(title, chosen, scores),
      mentions: chosen
    }, { quoted: msg })
    return true
  }

  return false
}

module.exports = { handleAdminAndRanks, registrarAtividade }
