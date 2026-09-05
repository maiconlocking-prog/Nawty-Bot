/*
  NAWTY BOT - Baileys 7
  Menus separados estilo Nazuna
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
const STYLES = {
  bold: {'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳','A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙','0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'},
  italic: {'a':'𝘢','b':'𝘣','c':'𝘤','d':'𝘥','e':'𝘦','f':'𝘧','g':'𝘨','h':'𝘩','i':'𝘪','j':'𝘫','k':'𝘬','l':'𝘭','m':'𝘮','n':'𝘯','o':'𝘰','p':'𝘱','q':'𝘲','r':'𝘳','s':'𝘴','t':'𝘵','u':'𝘶','v':'𝘷','w':'𝘸','x':'𝘹','y':'𝘺','z':'𝘻','A':'𝘈','B':'𝘉','C':'𝘊','D':'𝘋','E':'𝘌','F':'𝘍','G':'𝘎','H':'𝘏','I':'𝘐','J':'𝘑','K':'𝘒','L':'𝘓','M':'𝘔','N':'𝘕','O':'𝘖','P':'𝘗','Q':'𝘘','R':'𝘙','S':'𝘚','T':'𝘛','U':'𝘜','V':'𝘝','W':'𝘞','X':'𝘟','Y':'𝘠','Z':'𝘡'},
  script: {'a':'𝓪','b':'𝓫','c':'𝓬','d':'𝓭','e':'𝓮','f':'𝓯','g':'𝓰','h':'𝓱','i':'𝓲','j':'𝓳','k':'𝓴','l':'𝓵','m':'𝓶','n':'𝓷','o':'𝓸','p':'𝓹','q':'𝓺','r':'𝓻','s':'𝓼','t':'𝓽','u':'𝓾','v':'𝓿','w':'𝔀','x':'𝔁','y':'𝔂','z':'𝔃','A':'𝓐','B':'𝓑','C':'𝓒','D':'𝓓','E':'𝓔','F':'𝓕','G':'𝓖','H':'𝓗','I':'𝓘','J':'𝓙','K':'𝓚','L':'𝓛','M':'𝓜','N':'𝓝','O':'𝓞','P':'𝓟','Q':'𝓠','R':'𝓡','S':'𝓢','T':'𝓣','U':'𝓤','V':'𝓥','W':'𝓦','X':'𝓧','Y':'𝓨','Z':'𝓩'},
  bubbled: {'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ','A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ'},
  fullwidth: {'a':'ａ','b':'ｂ','c':'ｃ','d':'ｄ','e':'ｅ','f':'ｆ','g':'ｇ','h':'ｈ','i':'ｉ','j':'ｊ','k':'ｋ','l':'ｌ','m':'ｍ','n':'ｎ','o':'ｏ','p':'ｐ','q':'ｑ','r':'ｒ','s':'ｓ','t':'ｔ','u':'ｕ','v':'ｖ','w':'ｗ','x':'ｘ','y':'ｙ','z':'ｚ','A':'Ａ','B':'Ｂ','C':'Ｃ','D':'Ｄ','E':'Ｅ','F':'Ｆ','G':'Ｇ','H':'Ｈ','I':'Ｉ','J':'Ｊ','K':'Ｋ','L':'Ｌ','M':'Ｍ','N':'Ｎ','O':'Ｏ','P':'Ｐ','Q':'Ｑ','R':'Ｒ','S':'Ｓ','T':'Ｔ','U':'Ｕ','V':'Ｖ','W':'Ｗ','X':'Ｘ','Y':'Ｙ','Z':'Ｚ','0':'０','1':'１','2':'２','3':'３','4':'４','5':'５','6':'６','7':'７','8':'８','9':'９'}
}
function styleText(text, style) {
  const map = STYLES[style]
  if (!map) return text
  return [...text].map(c => map[c] || c).join('')
}
function detectCmdFromText(text) {
  if (!text) return null
  const re = new RegExp(`[${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/!]([a-zA-Z0-9_]+)`, 'i')
  const m = text.match(re)
  return m ? m[1].toLowerCase() : null
}

const BRINCADEIRA_CMDS = ['gay','ship','chance','dado','roll','cara','coroa','menubrincadeiras','menubrincadeira']
const AUDIO_CMDS = Object.keys(audioFilters).concat(['bassbn','bassn','speed','velocidade','cortaraudio','reverse','audioreverso'])
const VIDEO_CMDS = Object.keys(videoFilters).concat(['videoloop','cortarvideo'])

async function getRandomGroupMembers(sock, groupJid, count = 2) {
  try {
    const meta = await sock.groupMetadata(groupJid)
    const participants = (meta.participants || [])
      .map(p => p.id)
      .filter(id => id && !id.includes('status') && id !== sock.user?.id)
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[participants[i], participants[j]] = [participants[j], participants[i]]
    }
    return participants.slice(0, count)
  } catch {
    return []
  }
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
      const pushname = msg.pushName || 'Usuário'
      const botName = config.NomeDoBot || 'Nawty'

      let body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        msg.message.audioMessage?.caption ||
        ''

      if (!body || !body.startsWith(prefix)) return

      const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase()
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')

      const reply = async (t, mentions=[]) => nawty.sendMessage(from, { text: t, mentions }, { quoted: msg })
      const reagir = async (e) => { try { await nawty.sendMessage(from, { react: { text: e, key: msg.key } }) } catch {} }

      // ========== MENUS ESTILO NAZUNA ==========
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

      // ========== MODO BRINCADEIRA ==========
      if (command === 'modobrincadeira') {
        if (!isGroup) return reply('❌ Este comando só funciona em *grupos*.')
        const val = (args[0] || '').trim()
        if (val !== '0' && val !== '1') {
          const status = isBrincadeiraOn(from) ? 'ATIVADO ✅' : 'DESATIVADO ❌'
          return reply('🎮 *Modo Brincadeira*\n\nUse:\n' + prefix + 'modobrincadeira 1 → ativar\n' + prefix + 'modobrincadeira 0 → desativar\n\nStatus atual: *' + status + '*')
        }
        const data = loadBrincadeira()
        if (val === '1') {
          data[from] = true
          saveBrincadeira(data)
          return reply('✅ *Modo Brincadeira ATIVADO* neste grupo!\n\nUse ' + prefix + 'menubrincadeiras')
        } else {
          delete data[from]
          saveBrincadeira(data)
          return reply('❌ *Modo Brincadeira DESATIVADO* neste grupo.')
        }
      }

      if (isGroup && BRINCADEIRA_CMDS.includes(command)) {
        if (!isBrincadeiraOn(from)) {
          return reply('🔒 Brincadeiras *desativadas* neste grupo.\n\nAtive com:\n' + prefix + 'modobrincadeira 1')
        }
      }

      if (command === 'menubrincadeiras' || command === 'menubrincadeira') {
        await replyWithFoto(nawty, from, 'menubrincadeiras', menuBrincadeiras(prefix, botName, pushname), msg)
        return
      }

      // ========== SHIP ==========
      if (command === 'ship') {
        let n1, n2, mentions = []
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        if (mentioned.length >= 2) {
          n1 = '@' + mentioned[0].split('@')[0]
          n2 = '@' + mentioned[1].split('@')[0]
          mentions = [mentioned[0], mentioned[1]]
        } else if (mentioned.length === 1) {
          n1 = '@' + mentioned[0].split('@')[0]
          mentions = [mentioned[0]]
          if (isGroup) {
            const randoms = await getRandomGroupMembers(nawty, from, 1)
            if (randoms[0]) {
              n2 = '@' + randoms[0].split('@')[0]
              mentions.push(randoms[0])
            } else n2 = args[0] || 'Alguém'
          } else n2 = args[0] || 'Alguém'
        } else if (isGroup && !args[0]) {
          const randoms = await getRandomGroupMembers(nawty, from, 2)
          if (randoms.length < 2) return reply('❌ Membros insuficientes no grupo.')
          n1 = '@' + randoms[0].split('@')[0]
          n2 = '@' + randoms[1].split('@')[0]
          mentions = randoms
        } else {
          n1 = args[0] || pushname
          n2 = args[1] || 'Alguém'
        }
        const pct = Math.floor(Math.random() * 101)
        const emoji = pct > 80 ? '💘' : pct > 50 ? '❤️' : pct > 20 ? '💔' : '❌'
        const texto = emoji + ' *SHIP*\n\n' + n1 + ' + ' + n2 + '\nCompatibilidade: *' + pct + '%*'
        await replyWithFoto(nawty, from, 'ship', texto, msg, mentions)
        return
      }

      if (command === 'gay') {
        let target = q || pushname
        let mentions = []
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []
        if (mentioned[0]) {
          target = '@' + mentioned[0].split('@')[0]
          mentions = [mentioned[0]]
        }
        await replyWithFoto(nawty, from, 'gay', '🏳️‍🌈 *' + target + '* é *' + Math.floor(Math.random()*101) + '%* gay', msg, mentions)
        return
      }
      if (command === 'chance') {
        if (!q) return reply('Use: ' + prefix + 'chance ...')
        await replyWithFoto(nawty, from, 'chance', '🎯 *' + q + '* → *' + Math.floor(Math.random()*101) + '%*', msg)
        return
      }
      if (command === 'dado' || command === 'roll') {
        await replyWithFoto(nawty, from, 'dado', '🎲 *' + (Math.floor(Math.random()*6)+1) + '*', msg)
        return
      }
      if (command === 'cara' || command === 'coroa') {
        await replyWithFoto(nawty, from, 'cara', '🪙 *' + (Math.random() > 0.5 ? 'Cara' : 'Coroa') + '*', msg)
        return
      }

      if (command === 'tomp3') {
        const media = getQuotedMedia(msg) || getOwnMedia(msg)
        if (!media || (media.type !== 'video' && media.type !== 'audio')) {
          return reply('❌ Responda um *vídeo* ou *áudio* com ' + prefix + 'tomp3')
        }
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, media.type)
          const mp3 = await toMp3(buf, media.type === 'video')
          await nawty.sendMessage(from, { audio: mp3, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg })
          await reagir('✅')
        } catch (e) {
          console.error(e)
          await reply('❌ Erro no tomp3. pkg install ffmpeg')
          await reagir('❌')
        }
        return
      }

      if (command === 'cortaraudio') {
        if (args.length < 2) return reply('Use: ' + prefix + 'cortaraudio <inicio> <fim>')
        const media = getQuotedMedia(msg)
        if (!media || media.type !== 'audio') return reply('❌ Responda um *áudio*')
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, 'audio')
          const out = await cutAudio(buf, args[0], args[1])
          await nawty.sendMessage(from, { audio: out, mimetype: 'audio/mpeg' }, { quoted: msg })
          await reagir('✅')
        } catch { await reply('❌ Erro ao cortar áudio') }
        return
      }

      if (command === 'cortarvideo') {
        if (args.length < 2) return reply('Use: ' + prefix + 'cortarvideo <inicio> <fim>')
        const media = getQuotedMedia(msg)
        if (!media || media.type !== 'video') return reply('❌ Responda um *vídeo*')
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, 'video')
          const out = await cutVideo(buf, args[0], args[1])
          await nawty.sendMessage(from, { video: out, caption: '✂️ Cortado' }, { quoted: msg })
          await reagir('✅')
        } catch { await reply('❌ Erro ao cortar vídeo') }
        return
      }

      if (AUDIO_CMDS.includes(command)) {
        const media = getQuotedMedia(msg)
        if (!media || (media.type !== 'audio' && media.type !== 'video')) {
          return reply('❌ Responda um *áudio* com ' + prefix + command)
        }
        try {
          await reagir('⏳')
          let buf = await getBuffer(media.msg, media.type)
          if (media.type === 'video') buf = await toMp3(buf, true)
          let effect = command === 'audioreverso' ? 'reverse' : command
          const extra = {}
          if (effect === 'bassbn' || effect === 'bassn') extra.gain = args[0]
          if (effect === 'speed' || effect === 'velocidade') extra.speed = args[0]
          const out = await applyAudioEffect(buf, effect, extra)
          await nawty.sendMessage(from, { audio: out, mimetype: 'audio/mpeg' }, { quoted: msg })
          await reagir('✅')
        } catch (e) {
          console.error(e)
          await reply('❌ Erro no efeito. pkg install ffmpeg')
          await reagir('❌')
        }
        return
      }

      if (VIDEO_CMDS.includes(command)) {
        const media = getQuotedMedia(msg)
        if (!media || media.type !== 'video') return reply('❌ Responda um *vídeo* com ' + prefix + command)
        try {
          await reagir('⏳')
          const buf = await getBuffer(media.msg, 'video')
          const out = await applyVideoEffect(buf, command)
          await nawty.sendMessage(from, { video: out, caption: '🎬 ' + command }, { quoted: msg })
          await reagir('✅')
        } catch (e) {
          console.error(e)
          await reply('❌ Erro no efeito de vídeo')
          await reagir('❌')
        }
        return
      }

      if (command === 'setfoto') {
        const sub = (args[0] || '').toLowerCase()
        if (sub === 'list' || sub === 'lista') {
          const fotos = loadFotos()
          const keys = Object.keys(fotos)
          if (!keys.length) return reply('Nenhuma foto configurada.')
          let txt = '📸 *Fotos:*\n\n'
          keys.forEach(k => txt += '• ' + prefix + k + '\n')
          return reply(txt)
        }
        if (['del','delete','remover','rm'].includes(sub)) {
          const cmdName = (args[1] || '').toLowerCase().replace(prefix, '')
          if (!cmdName) return reply('Use: ' + prefix + 'setfoto del menu')
          const fotos = loadFotos()
          if (!fotos[cmdName]) return reply('Nenhuma foto em *' + cmdName + '*')
          try { if (fs.existsSync(fotos[cmdName])) fs.unlinkSync(fotos[cmdName]) } catch {}
          delete fotos[cmdName]
          saveFotos(fotos)
          return reply('🗑️ Foto de *' + prefix + cmdName + '* removida.')
        }
        let cmdName = (args[0] || '').toLowerCase().replace(prefix, '').trim()
        if (!cmdName) {
          const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          const qt = quoted?.conversation || quoted?.extendedTextMessage?.text || ''
          cmdName = detectCmdFromText(qt) || ''
        }
        if (!cmdName) return reply('📸 ' + prefix + 'setfoto menu | list | del menu')
        let media = null
        if (msg.message.imageMessage) media = msg.message.imageMessage
        else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          media = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
        }
        if (!media) return reply('❌ Marque uma imagem com ' + prefix + 'setfoto ' + cmdName)
        try {
          await reagir('⏳')
          const buffer = await getBuffer(media, 'image')
          const filePath = path.join(FOTOS_DIR, cmdName + '.jpg')
          fs.writeFileSync(filePath, buffer)
          const fotos = loadFotos()
          fotos[cmdName] = filePath
          saveFotos(fotos)
          await reply('✅ Foto definida para *' + prefix + cmdName + '*')
          await reagir('✅')
        } catch { await reply('❌ Erro ao salvar a foto.') }
        return
      }

      if (['s','sticker','f','fig','figurinha'].includes(command)) {
        try {
          await reagir('⏳')
          let media=null, isVideo=false
          const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          if (quoted?.imageMessage) { media=quoted.imageMessage; isVideo=false }
          else if (quoted?.videoMessage) { media=quoted.videoMessage; isVideo=true }
          else if (quoted?.stickerMessage) { media=quoted.stickerMessage; isVideo=false }
          else if (msg.message.imageMessage) { media=msg.message.imageMessage; isVideo=false }
          else if (msg.message.videoMessage) { media=msg.message.videoMessage; isVideo=true }
          if (!media) return reply('❌ Responda imagem/vídeo com ' + prefix + 's')
          const buffer = await getBuffer(media, isVideo?'video':'image')
          let webpBuf = await convertToWebp(buffer, isVideo)
          webpBuf = await writeExif(webpBuf, config.NomeDoBot||'Nawty', config.NomeDoDono||'Nawty')
          await nawty.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
          await reagir('✅')
        } catch { await reply('❌ Erro na figurinha') }
        return
      }

      if (command === 'toimg') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) return reply('Responda sticker com ' + prefix + 'toimg')
        await reagir('⏳')
        try {
          const buf = await getBuffer(quoted.stickerMessage, 'sticker')
          await nawty.sendMessage(from, { image: buf, caption: '✅' }, { quoted: msg })
          await reagir('✅')
        } catch { await reply('Erro') }
        return
      }

      if (command === 'nick' || command === 'estilo') {
        if (!q) return reply('Use: ' + prefix + 'nick texto')
        let txt = '✨ *Estilos:* ' + q + '\n\n'
        for (const name of Object.keys(STYLES)) txt += '*' + name + '*: ' + styleText(q, name) + '\n'
        await replyWithFoto(nawty, from, 'nick', txt, msg)
        return
      }

      if (command === 'calc') {
        if (!q) return reply('Use: ' + prefix + 'calc 2+2')
        try {
          if (!/^[0-9+\-*/().%\s]+$/.test(q)) return reply('Inválido')
          await reply('🧮 ' + q + ' = *' + Function('"use strict"; return (' + q + ')')() + '*')
        } catch { await reply('Erro') }
        return
      }

      if (command === 'pp' || command === 'perfil') {
        try {
          let jid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
          const pp = await nawty.profilePictureUrl(jid, 'image').catch(()=>null)
          if (!pp) return reply('Sem foto')
          await nawty.sendMessage(from, { image: { url: pp }, caption: '📸' }, { quoted: msg })
        } catch { await reply('Erro') }
        return
      }
      if (command === 'say') {
        if (!q) return reply('Use: ' + prefix + 'say texto')
        await nawty.sendMessage(from, { text: q })
        return
      }
      if (command === 'ping') {
        const t = Date.now()
        await replyWithFoto(nawty, from, 'ping', '🏓 ' + (Date.now()-t) + 'ms', msg)
        return
      }
      if (command === 'dono') {
        await replyWithFoto(nawty, from, 'dono', '👑 ' + config.NomeDoDono + '\n' + config.NumeroDoDono, msg)
        return
      }
      if (command === 'info') {
        await replyWithFoto(nawty, from, 'info', '🤖 ' + config.NomeDoBot + '\nPrefixo: ' + prefix + '\nOnline ✅', msg)
        return
      }

    } catch (e) {
      console.error(colors.red('Erro:'), e)
    }
  })

  GreenLog('✅ Bot pronto! Menus estilo Nazuna ativos.')
}

main()
