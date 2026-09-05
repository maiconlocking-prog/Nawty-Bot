/* 
  NAWTY BOT - Atualizado para Baileys 7.0.0-rc14
  Suporte a Pairing Code (padrão) e QR Code
*/

// Silencia spam de sessão do Baileys/libsignal no terminal
const _log = console.log.bind(console)
const _info = console.info.bind(console)
const _warn = console.warn.bind(console)
const _debug = console.debug ? console.debug.bind(console) : () => {}
const _error = console.error.bind(console)

function shouldSilence(args) {
  try {
    const text = args.map(a => {
      if (typeof a === 'string') return a
      if (a && typeof a === 'object') return JSON.stringify(a)
      return String(a)
    }).join(' ')
    return (
      text.includes('Closing open session') ||
      text.includes('Closing session') ||
      text.includes('SessionEntry') ||
      text.includes('prekey bundle') ||
      text.includes('currentRatchet') ||
      text.includes('ephemeralKeyPair') ||
      text.includes('remoteIdentityKey') ||
      text.includes('chainKey') ||
      text.includes('messageKeys')
    )
  } catch {
    return false
  }
}

console.log = (...args) => { if (!shouldSilence(args)) _log(...args) }
console.info = (...args) => { if (!shouldSilence(args)) _info(...args) }
console.warn = (...args) => { if (!shouldSilence(args)) _warn(...args) }
console.debug = (...args) => { if (!shouldSilence(args)) _debug(...args) }
// mantém erros reais, mas filtra spam de sessão
console.error = (...args) => { if (!shouldSilence(args)) _error(...args) }

const { Boom } = require('@hapi/boom')
const NodeCache = require('node-cache')
const readline = require('readline')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const { CyanLog, GreenLog, RedLog } = require('./arquivos/js/logger.js')

const msgRetryCounterCache = new NodeCache()
const groupCache = new NodeCache({ stdTTL: 300, useClones: false })
const AUTH_DIR = './database/Nawty-QR'

if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true })
if (!fs.existsSync('./database/users')) fs.mkdirSync('./database/users', { recursive: true })
if (!fs.existsSync('./arquivos/json')) fs.mkdirSync('./arquivos/json', { recursive: true })
if (!fs.existsSync('./plugins')) {
  for (const cat of ['admin', 'dono', 'cmds-aleatorios', 'resenha', 'downloads', 'efeitos', 'midias', 'inteligencia-ia', 'rpg']) {
    fs.mkdirSync(`./plugins/${cat}`, { recursive: true })
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

let isReconnecting = false
let reconnectTimer = null

async function startConnection(NucleoDeCmds, config) {
  if (isReconnecting) {
    CyanLog('🌸❄️ Reconexão já em andamento, aguarde...')
    return null
  }

  isReconnecting = true

  const baileys = await import('@whiskeysockets/baileys')
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
  } = baileys

  const usePairingCode = process.argv.includes('--code')
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()
  const logger = pino({ level: 'silent' })

  const nawty = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: Browsers.windows('Chrome'),
    msgRetryCounterCache,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: false,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
    getMessage: async () => undefined
  })

  if (usePairingCode && !nawty.authState.creds.registered) {
    let phoneNumber = await question(colors.cyan('Digite o número do WhatsApp (com DDD, só números, ex: 5511987654321): '))
    phoneNumber = phoneNumber.replace(/\D/g, '')

    if (!phoneNumber || phoneNumber.length < 11) {
      console.log(colors.red('Número inválido! Use formato: 5511987654321'))
      process.exit(1)
    }

    console.log(colors.yellow(`\nSolicitando código de pareamento para: ${phoneNumber}...`))
    try {
      const code = await nawty.requestPairingCode(phoneNumber)
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code
      console.log(colors.green.bold(`\n✅ Código de Pareamento: ${formatted}\n`))
      console.log(colors.cyan('Vá em: WhatsApp → Aparelhos conectados → Conectar um aparelho → Usar código de emparelhamento'))
    } catch (err) {
      console.log(colors.red('Erro ao gerar código:'), err.message)
      process.exit(1)
    }
  }

  nawty.ev.on('creds.update', saveCreds)

  nawty.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !usePairingCode) {
      console.log(colors.yellow('\n📱 QR Code gerado! Escaneie com o WhatsApp:\n'))
      try {
        const qrcode = require('qrcode-terminal')
        qrcode.generate(qr, { small: true })
      } catch (e) {
        console.log(colors.yellow('QR (texto):'), qr)
      }
    }

    if (connection === 'open') {
      GreenLog(`✅ ${config.NomeDoBot} conectado com sucesso!`)
      const botNumber = nawty.user?.id?.split(':')[0] || 'desconhecido'
      GreenLog(`📱 Número do Bot: ${botNumber}`)

      if (!fs.existsSync('./arquivos/json/welkon.json')) {
        fs.writeFileSync('./arquivos/json/welkon.json', JSON.stringify([]))
      }
      if (!fs.existsSync('./arquivos/json/legendas.json')) {
        fs.writeFileSync('./arquivos/json/legendas.json', JSON.stringify({}))
      }

      isReconnecting = false
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      RedLog(`Conexão fechada - Código: ${statusCode}`)

      if (statusCode !== DisconnectReason.loggedOut) {
        RedLog('🌸 Reiniciando a Nawty em 3 segundos...')

        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => {
          CyanLog('🌸 Encerrando processo para reiniciar...')
          process.exit(0)
        }, 3000)
      } else {
        RedLog('🌸 Sessão expirada! Exclua a pasta database/Nawty-QR e reinicie.')
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = setTimeout(() => process.exit(0), 5000)
      }
    }
  })

  nawty.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update
    if (!fs.existsSync('./arquivos/json/welkon.json')) return

    const welcomeGroups = JSON.parse(fs.readFileSync('./arquivos/json/welkon.json'))
    if (!welcomeGroups.includes(id)) return
    if (participants[0] === nawty.user?.id?.split(':')[0]) return

    let groupMetadata
    try {
      groupMetadata = await nawty.groupMetadata(id)
    } catch (e) { return }

    const legendasPath = './arquivos/json/legendas.json'
    let legendas = {}
    if (fs.existsSync(legendasPath)) {
      legendas = JSON.parse(fs.readFileSync(legendasPath))
    }

    const legenda = legendas[id] || 'Bem-vindo(a) ao grupo!'
    const part = participants[0]
    const jid = part?.phoneNumber || part?.id || part?.jid
    if (!jid) return
    const numeroParticipante = jid.split('@')[0]

    if (action === 'add') {
      await nawty.sendMessage(id, {
        image: { url: 'https://files.catbox.moe/mjxxwp.jpeg' },
        caption: `╭᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╮\n            𝗕𝗲𝗺-𝘃𝗶𝗻𝗱𝗼(𝗮):\n@${numeroParticipante}!\n\n*Legenda:* ${legenda}\n\n╰᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╯`,
        mentions: [jid]
      })
    } else if (action === 'remove') {
      await nawty.sendMessage(id, {
        image: { url: 'https://files.catbox.moe/9i38ij.jpeg' },
        caption: `╭᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╮\n            *SAYŌNARA*\n@${numeroParticipante}\n\n╰᯽༊·˚༊·˚˚₊‧꒰ა ᯽ ໒꒱ ‧₊˚˚༊·˚༊᯽╯`,
        mentions: [jid]
      })
    }
  })

  isReconnecting = false
  return nawty
}

module.exports = startConnection
