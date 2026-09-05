/**
 * Comando CRIADOR — inalterável
 * Marca original protegida (não usa setfoto)
 */
const fs = require('fs')
const path = require('path')
const { wrap } = require('./style.js')

// ===== MARCA ORIGINAL (não editar via comandos do bot) =====
const CRIADOR_FIXO = {
  nomeMarca: 'Nawty Bot',
  creditoBase: 'Base adaptada e personalizada',
  estilo: 'Nazuna-inspired',
  versao: 'V1',
  // texto institucional fixo
  texto: [
    '👑 *CRIADOR / DONO*',
    '',
    'Bot: *NAWTY BOT*',
    'Marca original protegida ✅',
    'Estilo visual: *Nazuna*',
    '',
    'Este comando é *inalterável*.',
    'Não aceita setfoto nem edição por menu.'
  ].join('\n')
}

function buildCaption(config) {
  const dono = config.NomeDoDono || 'Dono'
  const num = String(config.NumeroDoDono || '').replace(/\D/g, '')
  const linhas = [
    '╭┈⊰ 🌸 『 *CRIADOR* 』',
    '┊',
    '┊👑 Dono: *' + dono + '*',
    num ? ('┊📱 wa.me/' + num) : null,
    '┊🤖 Bot: *' + (config.NomeDoBot || 'NAWTY BOT') + '*',
    '┊🛡️ Marca original: *protegida*',
    '┊🎨 Estilo: *Nazuna*',
    '┊📦 Doc: *999 GB* (metadado)',
    '┊',
    '┊_Comando inalterável — crédito do criador_',
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  ].filter(Boolean)
  return linhas.join('\n')
}

/**
 * Envia documento falso com fileLength enorme + legenda do criador.
 * O arquivo real é minúsculo; o WhatsApp só exibe o tamanho dos metadados.
 */
async function enviarCriador(sock, from, msg, config) {
  const caption = buildCaption(config)
  const fakeBytes = 999 * 1024 * 1024 * 1024 // 999 GB em metadado
  const content = Buffer.from(
    'NAWTY BOT — Documento simbólico do criador.\n' +
    'Este arquivo é propositalmente pequeno.\n' +
    'O tamanho exibido (999GB) é apenas metadado de apresentação.\n'
  )

  // tenta via proto Baileys (fileLength falso)
  try {
    const baileys = await import('@whiskeysockets/baileys')
    const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = baileys

    // upload real minúsculo + sobrescreve fileLength na mensagem
    const media = await prepareWAMessageMedia(
      { document: content },
      { upload: sock.waUploadToServer }
    )

    if (media.documentMessage) {
      media.documentMessage.fileLength = fakeBytes
      media.documentMessage.fileName = 'CRIADOR-NAWTY-999GB.pdf'
      media.documentMessage.mimetype = 'application/pdf'
      media.documentMessage.title = 'CRIADOR NAWTY'
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
  } catch (e) {
    // fallback simples
    try {
      await sock.sendMessage(from, {
        document: content,
        mimetype: 'application/pdf',
        fileName: 'CRIADOR-NAWTY-999GB.pdf',
        caption
      }, { quoted: msg })
      return true
    } catch {
      await sock.sendMessage(from, { text: caption }, { quoted: msg })
      return false
    }
  }
}

/** Bloqueia setfoto no comando criador */
function isComandoProtegido(cmd) {
  return ['criador', 'creator', 'creditos', 'créditos'].includes(String(cmd || '').toLowerCase())
}

module.exports = {
  CRIADOR_FIXO,
  buildCaption,
  enviarCriador,
  isComandoProtegido
}
