/**
 * Comando CRIADOR — protegido
 *
 * Edite o número abaixo com SEU WhatsApp (DDI+DDD+número)
 */
const CRIADOR_CONFIG = {
  // ===== EDITE AQUI =====
  nome: '𝕹𝖆𝖜𝖙𝖞𝖁',
  // Pode ser string OU lista de números autorizados como criador
  numero: '5511987654321',
  // numeros extras (opcional): ['5511999999999']
  numerosExtra: [],
  botFancy: '𝑵𝒂𝒘𝒕𝒚-𝑩𝒐𝒕'
  // ======================
}

const _CMD = ['criador', 'creator', 'creditos', 'créditos']

function isComandoProtegido(cmd) {
  return _CMD.includes(String(cmd || '').toLowerCase())
}

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '')
}

/** Compara números ignorando DDI/diferenças de formatação */
function numbersMatch(a, b) {
  const x = onlyDigits(a)
  const y = onlyDigits(b)
  if (!x || !y) return false
  if (x === y) return true
  // últimos 10–11 dígitos (BR)
  if (x.slice(-10) === y.slice(-10)) return true
  if (x.slice(-11) === y.slice(-11)) return true
  if (x.endsWith(y) || y.endsWith(x)) return true
  return false
}

/** Lista de números do criador */
function criadorNumbers() {
  const list = []
  const main = CRIADOR_CONFIG.numero
  if (Array.isArray(main)) list.push(...main)
  else if (main) list.push(main)
  if (Array.isArray(CRIADOR_CONFIG.numerosExtra)) {
    list.push(...CRIADOR_CONFIG.numerosExtra)
  }
  return list.map(onlyDigits).filter(Boolean)
}

/** Extrai possíveis IDs de remetente da mensagem Baileys */
function collectSenderCandidates(jidOrNumber, msg) {
  const out = new Set()
  const add = (v) => {
    if (!v) return
    out.add(String(v))
    const d = onlyDigits(String(v).split('@')[0].split(':')[0])
    if (d) out.add(d)
  }
  add(jidOrNumber)
  if (msg?.key) {
    add(msg.key.participant)
    add(msg.key.participantAlt)
    add(msg.key.remoteJid)
    add(msg.key.remoteJidAlt)
    add(msg.key.participantPn)
    add(msg.key.senderPn)
  }
  // alguns forks
  if (msg?.participant) add(msg.participant)
  return [...out]
}

/**
 * Reconhece se o JID/número é o criador
 */
function isCriador(jidOrNumber, msg) {
  const alvos = criadorNumbers()
  if (!alvos.length) return false
  const candidates = collectSenderCandidates(jidOrNumber, msg)
  for (const c of candidates) {
    for (const alvo of alvos) {
      if (numbersMatch(c, alvo)) return true
    }
  }
  return false
}

function buildCaption(config) {
  const nums = criadorNumbers()
  const botName = (config && config.NomeDoBot) || 'NAWTY BOT'
  return [
    '╭┈⊰ 🌸 『 *CRIADOR* 』',
    '┊𝕮𝖗𝖎𝖆𝖉𝖔𝖗: *' + CRIADOR_CONFIG.nome + '*',
    '┊' + CRIADOR_CONFIG.botFancy,
    '┊🤖 Bot: *' + botName + '*',
    nums[0] ? ('┊📱 wa.me/' + nums[0]) : null,
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
  isCriador,
  numbersMatch,
  onlyDigits,
  criadorNumbers,
  collectSenderCandidates
}
