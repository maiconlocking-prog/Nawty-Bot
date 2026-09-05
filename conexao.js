const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const readline = require('readline')
const NodeCache = require('node-cache')
const qrcode = require('qrcode-terminal')

const AUTH_DIR = path.join(__dirname, 'database', 'auth')
const msgRetryCounterCache = new NodeCache()

if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true })

function question(text) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(text, ans => { rl.close(); resolve(ans) }))
}

async function startConnection(savedPhone, config) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    getMessage: async () => undefined
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log(colors.yellow('\n📱 Escaneie o QR ou use pareamento por código.\n'))
      try { qrcode.generate(qr, { small: true }) } catch {}
    }

    if (connection === 'open') {
      console.log(colors.green('✅ Conectado ao WhatsApp!'))
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = code !== DisconnectReason.loggedOut
      console.log(colors.red('Conexão fechada.'), 'code:', code, 'reconnect:', shouldReconnect)
      if (shouldReconnect) {
        setTimeout(() => startConnection(savedPhone, config), 3000)
      } else {
        console.log(colors.red('Deslogado. Apague database/auth e pareie de novo.'))
      }
    }
  })

  if (!sock.authState.creds.registered) {
    let phoneNumber = (config && config.NumeroDoDono) || savedPhone || '5518996965458'
    phoneNumber = String(phoneNumber).replace(/\D/g, '')
    if (!phoneNumber || phoneNumber.length < 10) {
      phoneNumber = await question(colors.cyan('Digite o número do WhatsApp (ex: 5518996965458): '))
      phoneNumber = String(phoneNumber).replace(/\D/g, '')
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      console.log(colors.red('Número inválido! Use formato: 5518996965458'))
      process.exit(1)
    }
    try {
      await new Promise(r => setTimeout(r, 1500))
      const code = await sock.requestPairingCode(phoneNumber)
      console.log(colors.green('\n🔐 Código de pareamento:'), colors.bold.white(code))
      console.log(colors.cyan('No WhatsApp: Aparelhos conectados → Conectar com número de telefone\n'))
    } catch (e) {
      console.log(colors.red('Erro no pareamento:'), e.message || e)
    }
  }

  return sock
}

module.exports = startConnection
