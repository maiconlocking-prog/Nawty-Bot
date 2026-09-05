/**
 * Comando CRIADOR — protegido / ofuscado
 * Não altera via setfoto nem menus.
 */

// strings protegidas (base64) — dificulta edição casual
const _b = (s) => Buffer.from(s, 'base64').toString('utf8')

const _N1 = _b('TmF3dHlW')           // NawtyV (fallback ASCII)
const _N2 = _b('TmF3dHktQm90')       // Nawty-Bot
const _CMD = ['criador', 'creator', 'creditos', 'créditos']

// marca estilizada (Unicode)
const MARCA = {
  criadorFancy: '𝕹𝖆𝖜𝖙𝖞𝖁',
  botFancy: '𝑵𝒂𝒘𝒕𝒚-𝑩𝒐𝒕',
  criadorLabel: '𝕮𝖗𝖎𝖆𝖉𝖔𝖗'
}

function isComandoProtegido(cmd) {
  return _CMD.includes(String(cmd || '').toLowerCase())
}

function buildCaption(config) {
  const donoCfg = config.NomeDoDono || MARCA.criadorFancy
  const num = String(config.NumeroDoDono || '').replace(/\D/g, '')
  return [
    '╭┈⊰ 🌸 『 *CRIADOR* 』',
    '┊',
    '┊' + MARCA.criadorLabel + ': *' + MARCA.criadorFancy + '*',
    '┊' + MARCA.botFancy,
    '┊',
    '┊🤖 Bot: *' + (config.NomeDoBot || _N2) + '*',
    '┊👤 Config dono: *' + donoCfg + '*',
    num ? ('┊📱 wa.me/' + num) : null,
    '┊🛡️ Marca original: *protegida*',
    '┊🔐 Comando: *inalterável*',
    '┊📦 Doc: *999 GB* (metadado)',
    '┊',
    '┊_Crédito fixo do criador — não editável_',
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  ].filter(Boolean).join('\n')
}

/**
 * Documento falso 999GB + legenda do criador
 */
async function enviarCriador(sock, from, msg, config) {
  const caption = buildCaption(config)
  const fakeBytes = 999 * 1024 * 1024 * 1024
  const content = Buffer.from(
    _N2 + ' — ' + MARCA.criadorFancy + '\n' +
    'Documento simbólico do criador.\n' +
    'Tamanho 999GB é apenas metadado.\n'
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
      media.documentMessage.title = MARCA.criadorFancy + ' | ' + MARCA.botFancy
    }

    const waMsg = generateWAMessageFromContent(
      from,
      {
        documentMessage: {
          ...media.documentMessage,
          caption
        }
      },
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
  MARCA,
  buildCaption,
  enviarCriador,
  isComandoProtegido
}
