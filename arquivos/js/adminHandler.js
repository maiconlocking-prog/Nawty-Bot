const fs = require('fs')
const path = require('path')
const {
  registrarAtividade,
  getRankAtivo,
  isGroupAdmin,
  botIsAdmin,
  getParticipants,
  pickRandom,
  buildFunRank,
  loadRanks
} = require('./groupAdmin.js')
const { menuRank } = require('./menus.js')

const FUN_RANK_CMDS = Object.keys(loadRanks())

async function handleAdminAndRanks({
  nawty, msg, from, isGroup, sender, pushname, command, args, q, prefix, reply, replyWithFoto, botName
}) {
  // menurank
  if (command === 'menurank') {
    await replyWithFoto(nawty, from, 'menurank', menuRank(prefix, botName, pushname), msg)
    return true
  }

  const needAdmin = ['marcar','hidetag','ban','kick','promover','rebaixar','grupo','linkgp','del','resetativo']
  if (needAdmin.includes(command)) {
    if (!isGroup) { await reply('❌ Só em grupos.'); return true }
    const adm = await isGroupAdmin(nawty, from, sender)
    if (!adm) { await reply('❌ Só *admins* podem usar este comando.'); return true }
    if (['ban','kick','promover','rebaixar','grupo'].includes(command)) {
      const botAdm = await botIsAdmin(nawty, from)
      if (!botAdm) { await reply('❌ O bot precisa ser *admin* do grupo.'); return true }
    }
  }

  if (command === 'marcar') {
    const members = await getParticipants(nawty, from)
    const texto = q || '📢 Marcação geral'
    const mentionsText = members.map(j => '@' + j.split('@')[0]).join(' ')
    await nawty.sendMessage(from, { text: texto + '\n\n' + mentionsText, mentions: members }, { quoted: msg })
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
      await reply('Marque ou responda quem deseja remover.\nEx: ' + prefix + 'ban @user')
      return true
    }
    try {
      await nawty.groupParticipantsUpdate(from, targets, 'remove')
      await reply('✅ Removido(s) do grupo.')
    } catch {
      await reply('❌ Falha ao remover. Verifique permissões.')
    }
    return true
  }

  if (command === 'promover' || command === 'rebaixar') {
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : [])
    if (!targets.length) {
      await reply('Marque alguém.\nEx: ' + prefix + command + ' @user')
      return true
    }
    try {
      await nawty.groupParticipantsUpdate(from, targets, command === 'promover' ? 'promote' : 'demote')
      await reply(command === 'promover' ? '✅ Promovido a admin.' : '✅ Rebaixado.')
    } catch {
      await reply('❌ Falha na operação.')
    }
    return true
  }

  if (command === 'grupo') {
    const op = (args[0] || '').toLowerCase()
    if (!['a','f','abrir','fechar','open','close'].includes(op)) {
      await reply('Use:\n' + prefix + 'grupo a  (abrir)\n' + prefix + 'grupo f  (fechar)')
      return true
    }
    const open = ['a','abrir','open'].includes(op)
    try {
      await nawty.groupSettingUpdate(from, open ? 'not_announcement' : 'announcement')
      await reply(open ? '🔓 Grupo *aberto* para todos.' : '🔒 Grupo *fechado* (só admins).')
    } catch {
      await reply('❌ Não foi possível alterar o grupo.')
    }
    return true
  }

  if (command === 'linkgp') {
    try {
      const code = await nawty.groupInviteCode(from)
      await reply('🔗 Link do grupo:\nhttps://chat.whatsapp.com/' + code)
    } catch {
      await reply('❌ Não foi possível obter o link (bot precisa ser admin).')
    }
    return true
  }

  if (command === 'del') {
    const ctx = msg.message.extendedTextMessage?.contextInfo
    if (!ctx?.stanzaId) {
      await reply('Responda a mensagem que deseja apagar com ' + prefix + 'del')
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
      await reply('❌ Não consegui apagar.')
    }
    return true
  }

  if (command === 'rankativo') {
    if (!isGroup) { await reply('❌ Só em grupos.'); return true }
    const ranking = getRankAtivo(from, 10)
    if (!ranking.length) { await reply('Ainda não há atividade registrada neste grupo.'); return true }
    let txt = '📊 *RANK ATIVOS*\n\n'
    const mentions = []
    ranking.forEach(([jid, count], i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'
      txt += medal + ' @' + jid.split('@')[0] + ' — *' + count + '* msgs\n'
      mentions.push(jid)
    })
    await nawty.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    return true
  }

  if (command === 'resetativo') {
    if (!isGroup) { await reply('❌ Só em grupos.'); return true }
    const ATIV = path.join(__dirname, '../../database/atividade.json')
    let data = {}
    try { data = JSON.parse(fs.readFileSync(ATIV, 'utf8')) } catch {}
    delete data[from]
    fs.writeFileSync(ATIV, JSON.stringify(data, null, 2))
    await reply('🗑️ Rank de atividade resetado neste grupo.')
    return true
  }

  if (FUN_RANK_CMDS.includes(command)) {
    if (!isGroup) { await reply('❌ Ranks só em grupos.'); return true }
    const ranks = loadRanks()
    const title = ranks[command] || ('🏆 *' + command + '*')
    const members = await getParticipants(nawty, from)
    const filtered = members.filter(j => j !== nawty.user?.id)
    if (filtered.length < 3) { await reply('❌ Poucos membros no grupo.'); return true }
    const chosen = pickRandom(filtered, Math.min(10, filtered.length))
    const scores = chosen.map(() => Math.floor(Math.random() * 101)).sort((a, b) => b - a)
    const txt = buildFunRank(title, chosen, scores)
    await nawty.sendMessage(from, { text: txt, mentions: chosen }, { quoted: msg })
    return true
  }

  return false
}

module.exports = { handleAdminAndRanks, registrarAtividade }
