/*
  NAWTY BOT - Baileys 7
  Personalizacao estilo Nazuna
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const ffmpeg = require('fluent-ffmpeg')
const webp = require('node-webpmux')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const {
  applyAudioEffect,
  applyVideoEffect,
  cutAudio,
  cutVideo,
  toMp3,
  audioFilters,
  videoFilters
} = require('./arquivos/js/mediaEffects.js')
const { menuPrincipal, menuAdm, menuBrincadeiras, menuDono, menuCmd } = require('./arquivos/js/menus.js')
const { handleAdminAndRanks, registrarAtividade } = require('./arquivos/js/adminHandler.js')
const { processSecurity } = require('./arquivos/js/security.js')
const { isGroupAdmin, botIsAdmin } = require('./arquivos/js/groupAdmin.js')
const {
  gayReply,
  shipReply,
  chanceReply,
  dadoReply,
  caraCoroaReply,
  pingReply,
  infoReply,
  donoReply,
  wrap,
  ok,
  fail
} = require('./arquivos/js/style.js')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'
const FOTOS_PATH = path.join(__dirname, 'database/fotos.json')
const FOTOS_DIR = path.join(__dirname, 'database/fotos')
const BRINCADEIRA_PATH = path.join(__dirname, 'database/brincadeira.json')

if (!fs.existsSync(FOTOS_DIR)) fs.mkdirSync(FOTOS_DIR, { recursive: true })
if (!fs.existsSync(FOTOS_PATH)) fs.writeFileSync(FOTOS_PATH, '{}')
if (!fs.existsSync(BRINCADEIRA_PATH)) fs.writeFileSync(BRINCADEIRA_PATH, '{}')

function loadFotos() {
  try { return JSON.parse(fs.readFileSync(FOTOS_PATH)) } catch { return {} }
}
function saveFotos(data) {
  fs.writeFileSync(FOTOS_PATH, JSON.stringify(data, null, 2))
}
function loadBrincadeira() {
  try { return JSON.parse(fs.readFileSync(BRINCADEIRA_PATH)) } catch { return {} }
}
function saveBrincadeira(data) {
  fs.writeFileSync(BRINCADEIRA_PATH, JSON.stringify(data, null, 2))
}
function isBrincadeiraOn(jid) {
  return !!loadBrincadeira()[jid]
}

function ensureTmpDir() {
  const dir = path.join(__dirname, 'database/tmp')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}
function tempFile(ext) {
  return path.join(ensureTmpDir(), `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)
}
function detectExt(buf) {
  if (buf[0]===0x89&&buf[1]===0x50) return 'png'
  if (buf[0]===0xFF&&buf[1]===0xD8) return 'jpg'
  if (buf.slice(0,4).toString()==='RIFF'&&buf.slice(8,12).toString()==='WEBP') return 'webp'
  return 'jpg'
}
async function convertToWebp(buffer, isVideo=false) {
  if (!isVideo && buffer.slice(0,4).toString()==='RIFF' && buffer.slice(8,12).toString()==='WEBP') return buffer
  const tmpIn = tempFile(isVideo?'mp4':detectExt(buffer))
  fs.writeFileSync(tmpIn, buffer)
  const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba'
  let quality = isVideo ? 40 : 70
  let outBuf = null
  for (let i=0;i<5;i++) {
    const tmpOut = tempFile('webp')
    const opts = ['-vf', isVideo?`${vf},fps=15`:vf, '-c:v','libwebp','-lossless','0','-q:v',String(quality)]
    if (isVideo) opts.push('-loop','0','-an','-t','6')
    await new Promise((res,rej)=>ffmpeg(tmpIn).outputOptions(opts).format('webp').on('end',res).on('error',rej).save(tmpOut))
    outBuf = fs.readFileSync(tmpOut)
    try{fs.unlinkSync(tmpOut)}catch{}
    if (outBuf.length < 1000000) break
    quality = Math.max(15, quality-12)
  }
  try{fs.unlinkSync(tmpIn)}catch{}
  return outBuf
}
async function writeExif(buf, pack='Nawty Bot', author='Nawty') {
  try {
    const img = new webp.Image()
    await img.load(buf)
    const json = { 'sticker-pack-id':'nawty-bot', 'sticker-pack-name':pack, 'sticker-pack-publisher':author, emojis:['🌸'] }
    const attr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonB = Buffer.from(JSON.stringify(json))
    const exif = Buffer.concat([attr, jsonB])
    exif.writeUIntLE(jsonB.length,14,4)
    img.exif = exif
    return await img.save(null)
  } catch { return buf }
}
async function getBuffer(msg, type) {
  const stream = await downloadContentFromMessage(msg, type)
  let b = Buffer.from([])
  for await (const c of stream) b = Buffer.concat([b,c])
  return b
}
async function replyWithFoto(sock, from, cmdName, texto, quotedMsg, mentions=[]) {
  const fotos = loadFotos()
  const fotoPath = fotos[cmdName]
  const opts = { quoted: quotedMsg }
  if (fotoPath && fs.existsSync(fotoPath)) {
    await sock.sendMessage(from, { image: fs.readFileSync(fotoPath), caption: texto, mentions }, opts)
  } else {
    await sock.sendMessage(from, { text: texto, mentions }, opts)
  }
}
function getQuotedMedia(msg) {
  const q = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
  if (!q) return null
  if (q.audioMessage) return { msg: q.audioMessage, type: 'audio' }
  if (q.videoMessage) return { msg: q.videoMessage, type: 'video' }
  if (q.imageMessage) return { msg: q.imageMessage, type: 'image' }
  if (q.documentMessage) return { msg: q.documentMessage, type: 'document' }
  if (q.stickerMessage) return { msg: q.stickerMessage, type: 'sticker' }
  return null
}
function getOwnMedia(msg) {
  if (msg.message.audioMessage) return { msg: msg.message.audioMessage, type: 'audio' }
  if (msg.message.videoMessage) return { msg: msg.message.videoMessage, type: 'video' }
  if (msg.message.imageMessage) return { msg: msg.message.imageMessage, type: 'image' }
  return null
}

const BRINCADEIRA_CMDS = ['gay','ship','chance','dado','roll','cara','coroa','menubrincadeiras','menubrincadeira']
const AUDIO_CMDS = Object.keys(audioFilters).concat(['bassbn','bassn','speed','velocidade','cortaraudio','reverse','audioreverso'])
const VIDEO_CMDS = Object.keys(videoFilters).concat(['videoloop','cortarvideo'])

async function getRandomGroupMembers(sock, groupJid, count = 2) {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const participants = (meta.participants || []).map(p => p.id).filter(id => id && !id.includes('status') && id !== sock.user?.id)
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[participants[i], participants[j]] = [participants[j], participants[i]]
    }
    return participants.slice(0, count)
  } catch { return [] }
}

async function main() {
  console.log(colors.cyan('🌸 Iniciando Nawty Bot...'))
  nawty = await startConnection(null, config)
  if (!nawty) return

  nawty.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg?.message) return

      const from = msg.key.remoteJid
      const isGroup = from.endsWith('@g.us')
      const sender = msg.key.participant || from
      const pushname = msg.pushName || 'Usuario'
      const botName = config.NomeDoBot || 'Nawty'

      let body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        msg.message.audioMessage?.caption ||
        ''

      if (isGroup && sender) registrarAtividade(from, sender)

      if (isGroup && sender) {
        const admUser = await isGroupAdmin(nawty, from, sender)
        const botAdm = await botIsAdmin(nawty, from)
        const blocked = await processSecurity(nawty, msg, from, sender, body, admUser, botAdm)
        if (blocked) return
      }

      if (!body || !body.startsWith(prefix)) return

      const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase()
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')

      const reply = async (t, mentions=[]) => nawty.sendMessage(from, { text: t, mentions }, { quoted: msg })
      const reagir = async (e) => { try { await nawty.sendMessage(from, { react: { text: e, key: msg.key } }) } catch {} }

      if (['menu','help','ajuda'].includes(command)) {
        await replyWithFoto(nawty, from, 'menu', menuPrincipal(prefix, botName, pushname), msg)
        return
      }
      if (command === 'menuadm' || command === 'menuadmin') {
        await replyWithFoto(nawty, from, 'menuadm', menuAdm(prefix, botName, pushname), msg)
        return
      }
      if (command === 'menudono') {
        await replyWithFoto(nawty, from, 'menudono', menuDono(prefix, botName, pushname), msg)
        return
      }
      if (command === 'menucmd' || command === 'menucomandos') {
        await replyWithFoto(nawty, from, 'menucmd', menuCmd(prefix, botName, pushname), msg)
        return
      }

      const handled = await handleAdminAndRanks({
        nawty, msg, from, isGroup, sender, pushname, command, args, q, prefix, reply, replyWithFoto, botName
      })
      if (handled) return

      if (command === 'modobrincadeira') {
        if (!isGroup) return reply(fail('Só em grupos.'))
        const val = (args[0] || '').trim()
        if (val !== '0' && val !== '1') {
          const status = isBrincadeiraOn(from) ? '✅ ATIVADO' : '❌ DESATIVADO'
          return reply(wrap('🎮 MODO BRINCADEIRA', 'Use:\n' + prefix + 'modobrincadeira *1*\n' + prefix + 'modobrincadeira *0*\n\nStatus: *' + status + '*'))
        }
        const data = loadBrincadeira()
        if (val === '1') {
          data[from] = true
          saveBrincadeira(data)
          return reply(wrap('🎮 MODO BRINCADEIRA', ok('Modo Brincadeira *ATIVADO*!\nUse ' + prefix + 'menubrincadeiras')))
        } else {
          delete data[from]
          saveBrincadeira(data)
          return reply(wrap('🎮 MODO BRINCADEIRA', '❌ Modo Brincadeira *DESATIVADO*.'))
        }
      }

      if (isGroup && BRINCADEIRA_CMDS.includes(command)) {
        if (!isBrincadeiraOn(from)) {
          return reply(wrap('🔒 BLOQUEADO', 'Brincadeiras desativadas.\nAtive com:\n' + prefix + 'modobrincadeira *1*'))
        }
      }

      if (command === 'menubrincadeiras' || command === 'menubrincadeira') {
        await replyWithFoto(nawty, from, 'menubrincadeiras', menuBrincadeiras(prefix, botName, pushname), msg)
        return
      }

      if (command === 'ship') {
        let n1, n2, mentions = []
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        if (mentioned.length >= 2) {
          n1 = '@' + mentioned[0].split('@')[0]
          n2 = '@' + mentioned[1].split('@')[0]
          mentions = [mentioned[0], mentioned[1]]
        } else if (isGroup && !args[0]) {
          const randoms = await getRandomGroupMembers(nawty, from, 2)
          if (randoms.length < 1) return reply(fail('Membros insuficientes'))
          if (randoms.length === 1) {
            n1 = '@' + randoms[0].split('@')[0]
            n2 = pushname
            mentions = [randoms[0]]
          } else {
            n1 = '@' + randoms[0].split('@')[0]
            n2 = '@' + randoms[1].split('@')[0]
            mentions = randoms
          }
        } else {
          n1 = args[0] || pushname
          n2 = args[1] || 'Alguém'
        }
        const pct = Math.floor(Math.random() * 101)
        await replyWithFoto(nawty, from, 'ship', shipReply(n1, n2, pct), msg, mentions)
        return
      }

      if (command === 'gay') {
        let target = q || pushname
        let mentions = []
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        if (mentioned[0]) { target = '@' + mentioned[0].split('@')[0]; mentions = [mentioned[0]] }
        await replyWithFoto(nawty, from, 'gay', gayReply(target, Math.floor(Math.random()*101)), msg, mentions)
        return
      }
      if (command === 'chance') {
        if (!q) return reply(wrap('🎯 CHANCE', 'Use: ' + prefix + 'chance <texto>'))
        await replyWithFoto(nawty, from, 'chance', chanceReply(q, Math.floor(Math.random()*101)), msg)
        return
      }
      if (command === 'dado' || command === 'roll') {
        await replyWithFoto(nawty, from, 'dado', dadoReply(Math.floor(Math.random()*6)+1), msg)
        return
      }
      if (command === 'cara' || command === 'coroa') {
        await replyWithFoto(nawty, from, 'cara', caraCoroaReply(Math.random() > 0.5 ? 'Cara' : 'Coroa'), msg)
        return
      }

      if (command === 'tomp3') {
        const media = getQuotedMedia(msg) || getOwnMedia(msg)
        if (!media || (media.type !== 'video' && media.type !== 'audio')) return reply(fail('Responda um *vídeo* ou *áudio*.'))
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, media.type)
          const mp3 = await toMp3(buf, media.type === 'video')
          await nawty.sendMessage(from, { audio: mp3, mimetype: 'audio/mpeg' }, { quoted: msg })
          await reagir('✅')
        } catch (e) { await reply(fail('Erro no tomp3. Instale ffmpeg.')) }
        return
      }

      if (AUDIO_CMDS.includes(command)) {
        const media = getQuotedMedia(msg)
        if (!media || (media.type !== 'audio' && media.type !== 'video')) return reply(fail('Responda um *áudio*.'))
        try {
          await reagir('⏳')
          let buf = await getBuffer(media.msg, media.type)
          if (media.type === 'video') buf = await toMp3(buf, true)
          let effect = command === 'audioreverso' ? 'reverse' : command
          const extra = {}
          if (effect === 'speed' || effect === 'velocidade') extra.speed = args[0]
          const out = await applyAudioEffect(buf, effect, extra)
          await nawty.sendMessage(from, { audio: out, mimetype: 'audio/mpeg' }, { quoted: msg })
          await reagir('✅')
        } catch (e) { await reply(fail('Erro no efeito de áudio.')) }
        return
      }

      if (VIDEO_CMDS.includes(command)) {
        const media = getQuotedMedia(msg)
        if (!media || media.type !== 'video') return reply(fail('Responda um *vídeo*.'))
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, 'video')
          const out = await applyVideoEffect(buf, command)
          await nawty.sendMessage(from, { video: out, caption: wrap('🎬 EFEITO', command) }, { quoted: msg })
          await reagir('✅')
        } catch (e) { await reply(fail('Erro no efeito de vídeo.')) }
        return
      }

      if (command === 'setfoto') {
        const sub = (args[0] || '').toLowerCase()
        if (sub === 'list') {
          const fotos = loadFotos()
          const keys = Object.keys(fotos)
          if (!keys.length) return reply(wrap('📸 FOTOS', '_Nenhuma foto configurada._'))
          return reply(wrap('📸 FOTOS', keys.map(k => '• ' + prefix + k).join('\n')))
        }
        if (['del','delete','rm'].includes(sub)) {
          const cmdName = (args[1] || '').toLowerCase()
          const fotos = loadFotos()
          if (!fotos[cmdName]) return reply(fail('Sem foto nesse comando.'))
          try { fs.unlinkSync(fotos[cmdName]) } catch {}
          delete fotos[cmdName]
          saveFotos(fotos)
          return reply(ok('Foto de *' + prefix + cmdName + '* removida.'))
        }
        let cmdName = (args[0] || '').toLowerCase()
        if (!cmdName) return reply(wrap('📸 SETFOTO', prefix + 'setfoto menu\n' + prefix + 'setfoto list\n' + prefix + 'setfoto del menu'))
        let media = msg.message.imageMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
        if (!media) return reply(fail('Marque uma *imagem* com o comando.'))
        try {
          const buffer = await getBuffer(media, 'image')
          const filePath = path.join(FOTOS_DIR, cmdName + '.jpg')
          fs.writeFileSync(filePath, buffer)
          const fotos = loadFotos()
          fotos[cmdName] = filePath
          saveFotos(fotos)
          await reply(ok('Foto definida para *' + prefix + cmdName + '*'))
        } catch { await reply(fail('Erro ao salvar a foto.')) }
        return
      }

      if (['s','sticker','f','fig','figurinha'].includes(command)) {
        try {
          await reagir('⏳')
          let media=null, isVideo=false
          const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          if (quoted?.imageMessage) { media=quoted.imageMessage }
          else if (quoted?.videoMessage) { media=quoted.videoMessage; isVideo=true }
          else if (msg.message.imageMessage) { media=msg.message.imageMessage }
          else if (msg.message.videoMessage) { media=msg.message.videoMessage; isVideo=true }
          if (!media) return reply(fail('Responda uma *imagem* ou *vídeo*.'))
          const buffer = await getBuffer(media, isVideo?'video':'image')
          let webpBuf = await convertToWebp(buffer, isVideo)
          webpBuf = await writeExif(webpBuf, config.NomeDoBot||'Nawty', config.NomeDoDono||'Nawty')
          await nawty.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
          await reagir('✅')
        } catch { await reply(fail('Erro ao criar figurinha.')) }
        return
      }

      if (command === 'toimg') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) return reply(fail('Responda um *sticker*.'))
        try {
          const buf = await getBuffer(quoted.stickerMessage, 'sticker')
          await nawty.sendMessage(from, { image: buf, caption: ok('Convertido!') }, { quoted: msg })
        } catch { await reply(fail('Erro na conversão.')) }
        return
      }

      if (command === 'nick') {
        if (!q) return reply(wrap('✨ NICK', 'Use: ' + prefix + 'nick <texto>'))
        await replyWithFoto(nawty, from, 'nick', wrap('✨ NICK', q), msg)
        return
      }
      if (command === 'calc') {
        if (!q) return reply(wrap('🧮 CALC', 'Use: ' + prefix + 'calc 2+2'))
        try {
          if (!/^[0-9+\-*/().%\s]+$/.test(q)) return reply(fail('Expressão inválida.'))
          await reply(wrap('🧮 CALC', q + ' = *' + Function('"use strict"; return (' + q + ')')() + '*'))
        } catch { await reply(fail('Erro no cálculo.')) }
        return
      }
      if (command === 'pp' || command === 'perfil') {
        try {
          let jid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
          const pp = await nawty.profilePictureUrl(jid, 'image').catch(()=>null)
          if (!pp) return reply(fail('Sem foto de perfil.'))
          await nawty.sendMessage(from, { image: { url: pp }, caption: wrap('📸 PERFIL', '@' + jid.split('@')[0]) }, { quoted: msg })
        } catch { await reply(fail('Erro ao buscar foto.')) }
        return
      }
      if (command === 'say') {
        if (!q) return reply(wrap('💬 SAY', 'Use: ' + prefix + 'say <texto>'))
        await nawty.sendMessage(from, { text: q })
        return
      }
      if (command === 'ping') {
        const t = Date.now()
        await replyWithFoto(nawty, from, 'ping', pingReply(Date.now()-t), msg)
        return
      }
      if (command === 'dono') {
        await replyWithFoto(nawty, from, 'dono', donoReply(config.NomeDoDono, config.NumeroDoDono), msg)
        return
      }
      if (command === 'info') {
        await replyWithFoto(nawty, from, 'info', infoReply(config.NomeDoBot, prefix), msg)
        return
      }

    } catch (e) {
      console.error(colors.red('Erro:'), e)
    }
  })

  GreenLog('✅ Nawty pronta — estilo Nazuna ativo!')
}

main()
