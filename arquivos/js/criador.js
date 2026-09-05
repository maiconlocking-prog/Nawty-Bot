/**
 * Comando CRIADOR — protegido
 *
 * Edite apenas este bloco para definir o criador reconhecido pelo bot:
 */
const CRIADOR_CONFIG = {
  // ===== EDITE AQUI =====
  nome: '𝕹𝖆𝖜𝖙𝖞𝖁',
  numero: '5511987654321', // só números, com DDI (ex: 5511999999999)
  botFancy: '𝑵𝒂𝒘𝒕𝒚-𝑩𝒐𝒕'
  // ======================
}

const _CMD = ['criador', 'creator', 'creditos', 'créditos']

function isComandoProtegido(cmd) {
  return _CMD.includes(String(cmd || '').toLowerCase())
}

/** Normaliza número para comparação */
function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

/**
 * Reconhece se o JID/número é o criador
 * Aceita: 5511..., ou jid tipo 5511...@s.whatsapp.net
 */
function isCriador(jidOrNumber) {
  const alvo = onlyDigits(CRIADOR_CONFIG.numero)
  if (!alvo) return false
  const n = onlyDigits(String(jidOrNumber || '').split('@')[0].split(':')[0])
  if (!n) return false
  // compara finais (evita diferença de 55 / nono dígito em alguns casos)
  return n === alvo || n.endsWith(alvo) || alvo.endsWith(n)
}

function buildCaption(config) {
  const num = onlyDigits(CRIADOR_CONFIG.numero)
  const botName = (config && config.NomeDoBot) || 'NAWTY BOT'
  return [
    '╭┈⊰ 🌸 『 *CRIADOR* 』',
    '┊𝕮𝖗𝖎𝖆𝖉𝖔𝖗: *' + CRIADOR_CONFIG.nome + '*',
    '┊' + CRIADOR_CONFIG.botFancy,
    '┊🤖 Bot: *' + botName + '*',
    num ? ('┊📱 wa.me/' + num) : null,
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  ].filter(Boolean).join('\n')
}

async function enviarCriador(sock, from, msg, config) {
  const caption = buildCaption(config)
  const fakeBytes = 999 * 1024 * 1024 * 1024
  const content = Buffer.from(
    'Nawty-Bot — ' + CRIADOR_CONFIG.nome + '\nDocumento simbólico do criador.\n'
  )

  try {
    const baileys = await import('@whiskeysockets/baileys')
    const { generateWAMessageFromContent, prepareWAMessageMedia } = baileys

    const media = await prepareWAMessageMedia(
      { document: content },
      { upload: sock.waUploadToServer }
    )

    if (media.documentMessage) {
      media.documentMessage.fileLength = fakeBytes
      media.documentMessage.fileName = 'CRIADOR-NAWTYV-999GB.pdf'
      media.documentMessage.mimetype = 'application/pdf'
      media.documentMessage.title = CRIADOR_CONFIG.nome + ' | Nawty-Bot'
    }

    const waMsg = generateWAMessageFromContent(
      from,
      { documentMessage: { ...media.documentMessage, caption } },
      { quoted: msg, userJid: sock.user?.id }
    )

    await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id })
    return true
  } catch {
    try {
      await sock.sendMessage(from, {
        document: content,
        mimetype: 'application/pdf',
        fileName: 'CRIADOR-NAWTYV-999GB.pdf',
        caption
      }, { quoted: msg })
      return true
    } catch {
      await sock.sendMessage(from, { text: caption }, { quoted: msg })
      return false
    }
  }
}

module.exports = {
  CRIADOR_CONFIG,
  buildCaption,
  enviarCriador,
  isComandoProtegido,
  isCriador
}
