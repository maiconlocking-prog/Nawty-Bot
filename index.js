/*
  NAWTY BOT - Baileys 7
  Sistema de fotos nos comandos (setfoto)
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const ffmpeg = require('fluent-ffmpeg')
const webp = require('node-webpmux')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'
const FOTOS_PATH = path.join(__dirname, 'database/fotos.json')
const FOTOS_DIR = path.join(__dirname, 'database/fotos')

// cria pastas se não existirem
if (!fs.existsSync(FOTOS_DIR)) fs.mkdirSync(FOTOS_DIR, { recursive: true })
if (!fs.existsSync(FOTOS_PATH)) fs.writeFileSync(FOTOS_PATH, '{}')

function loadFotos() {
  try { return JSON.parse(fs.readFileSync(FOTOS_PATH)) } catch { return {} }
}
function saveFotos(data) {
  fs.writeFileSync(FOTOS_PATH, JSON.stringify(data, null, 2))
}

// ===================== STICKER HELPERS =====================
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

// envia resposta com foto do comando (se existir)
async function replyWithFoto(sock, from, cmdName, texto, quotedMsg) {
  const fotos = loadFotos()
  const fotoPath = fotos[cmdName]
  if (fotoPath && fs.existsSync(fotoPath)) {
    await sock.sendMessage(from, {
      image: fs.readFileSync(fotoPath),
      caption: texto
    }, { quoted: quotedMsg })
  } else {
    await sock.sendMessage(from, { text: texto }, { quoted: quotedMsg })
  }
}

// ===================== TEXT STYLES =====================
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

// ===================== MAIN =====================
async function main() {
  console.log(colors.cyan('🌸 Iniciando Nawty Bot...'))
  nawty = await startConnection(null, config)
  if (!nawty) return

  nawty.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg?.message) return

      const from = msg.key.remoteJid
      const sender = msg.key.participant || from
      const pushname = msg.pushName || 'Usuário'

      let body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''

      if (!body) return

      const isCmd = body.startsWith(prefix)
      if (!isCmd) return

      const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase()
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')

      const reply = async (t) => {
        await nawty.sendMessage(from, { text: t }, { quoted: msg })
      }
      const reagir = async (e) => {
        try { await nawty.sendMessage(from, { react: { text: e, key: msg.key } }) } catch {}
      }

      // ========== SETFOTO ==========
      if (command === 'setfoto') {
        if (!q) {
          await reply(`📸 *Como usar:*\n\n1. Envie ou marque uma *imagem*\n2. Responda ela com:\n${prefix}setfoto nome_do_comando\n\n*Exemplos:*\n${prefix}setfoto menu\n${prefix}setfoto gay\n${prefix}setfoto ship\n${prefix}setfoto ping\n\n*Remover foto:*\n${prefix}delfoto menu\n\n*Ver fotos salvas:*\n${prefix}listfoto`)
          return
        }

        const cmdName = q.toLowerCase().replace(prefix, '').trim()
        let media = null

        // imagem na mensagem
        if (msg.message.imageMessage) {
          media = msg.message.imageMessage
        }
        // resposta a imagem
        else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          media = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
        }

        if (!media) {
          await reply(`❌ Marque ou envie uma *imagem* junto com:\n${prefix}setfoto ${cmdName}`)
          return
        }

        try {
          await reagir('⏳')
          const buffer = await getBuffer(media, 'image')
          const filePath = path.join(FOTOS_DIR, `${cmdName}.jpg`)
          fs.writeFileSync(filePath, buffer)

          const fotos = loadFotos()
          fotos[cmdName] = filePath
          saveFotos(fotos)

          await reply(`✅ Foto definida para o comando *${prefix}${cmdName}*\n\nAgora quando alguém usar ${prefix}${cmdName}, a foto vai junto.`)
          await reagir('✅')
        } catch (e) {
          console.error(e)
          await reply('❌ Erro ao salvar a foto.')
          await reagir('❌')
        }
        return
      }

      // ========== DELFOTO ==========
      if (command === 'delfoto') {
        if (!q) {
          await reply(`Use: ${prefix}delfoto nome_do_comando\nEx: ${prefix}delfoto menu`)
          return
        }
        const cmdName = q.toLowerCase().replace(prefix, '').trim()
        const fotos = loadFotos()
        if (!fotos[cmdName]) {
          await reply(`Nenhuma foto salva para *${cmdName}*`)
          return
        }
        try { if (fs.existsSync(fotos[cmdName])) fs.unlinkSync(fotos[cmdName]) } catch {}
        delete fotos[cmdName]
        saveFotos(fotos)
        await reply(`🗑️ Foto do comando *${prefix}${cmdName}* removida.`)
        return
      }

      // ========== LISTFOTO ==========
      if (command === 'listfoto') {
        const fotos = loadFotos()
        const keys = Object.keys(fotos)
        if (!keys.length) {
          await reply('Nenhuma foto configurada ainda.\nUse: ' + prefix + 'setfoto menu')
          return
        }
        let txt = '📸 *Fotos configuradas:*\n\n'
        keys.forEach(k => txt += `• ${prefix}${k}\n`)
        await reply(txt)
        return
      }

      // ========== MENU ==========
      if (['menu','help','ajuda'].includes(command)) {
        const menu = `╭🌸───────────────🌸╮
       *NAWTY BOT*
╰🌸───────────────🌸╯

👤 ${pushname}
🔰 Prefixo: *${prefix}*

╭─『 FIGURINHAS 』
│ ${prefix}s / ${prefix}sticker
│ ${prefix}toimg
╰──────────────

╭─『 TEXTO 』
│ ${prefix}nick <texto>
│ ${prefix}say <texto>
╰──────────────

╭─『 DIVERSÃO 』
│ ${prefix}gay
│ ${prefix}ship
│ ${prefix}chance <texto>
│ ${prefix}dado
│ ${prefix}cara
╰──────────────

╭─『 FOTOS 』
│ ${prefix}setfoto <comando>
│ ${prefix}delfoto <comando>
│ ${prefix}listfoto
╰──────────────

╭─『 UTILS 』
│ ${prefix}ping
│ ${prefix}calc 2+2
│ ${prefix}pp
│ ${prefix}info
│ ${prefix}dono
╰──────────────`

        await replyWithFoto(nawty, from, 'menu', menu, msg)
        return
      }

      // ========== STICKER ==========
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

          if (!media) {
            await reply(`❌ Responda uma imagem/vídeo com ${prefix}s`)
            return
          }

          const buffer = await getBuffer(media, isVideo?'video':'image')
          let webpBuf = await convertToWebp(buffer, isVideo)
          webpBuf = await writeExif(webpBuf, config.NomeDoBot||'Nawty', config.NomeDoDono||'Nawty')
          await nawty.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
          await reagir('✅')
        } catch(e) {
          console.error(e)
          await reply('❌ Erro ao criar figurinha.')
          await reagir('❌')
        }
        return
      }

      // ========== TOIMG ==========
      if (command === 'toimg') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) {
          await reply(`Responda um sticker com ${prefix}toimg`)
          return
        }
        await reagir('⏳')
        try {
          const buf = await getBuffer(quoted.stickerMessage, 'sticker')
          await nawty.sendMessage(from, { image: buf, caption: '✅' }, { quoted: msg })
          await reagir('✅')
        } catch {
          await reply('Erro ao converter')
        }
        return
      }

      // ========== NICK ==========
      if (command === 'nick' || command === 'estilo') {
        if (!q) {
          await reply(`Use: ${prefix}nick seu texto`)
          return
        }
        let txt = `✨ *Estilos para:* ${q}\n\n`
        for (const name of Object.keys(STYLES)) {
          txt += `*${name}*: ${styleText(q, name)}\n`
        }
        await replyWithFoto(nawty, from, 'nick', txt, msg)
        return
      }

      // ========== CALC ==========
      if (command === 'calc' || command === 'calcular') {
        if (!q) {
          await reply(`Use: ${prefix}calc 2+2*5`)
          return
        }
        try {
          if (!/^[0-9+\-*/().%\s]+$/.test(q)) {
            await reply('Expressão inválida')
            return
          }
          const result = Function(`"use strict"; return (${q})`)()
          await reply(`🧮 *Resultado:*\n${q} = *${result}*`)
        } catch {
          await reply('Erro no cálculo')
        }
        return
      }

      // ========== FUN ==========
      if (command === 'gay') {
        const texto = `🏳️‍🌈 *${q || pushname}* é *${Math.floor(Math.random()*101)}%* gay`
        await replyWithFoto(nawty, from, 'gay', texto, msg)
        return
      }
      if (command === 'ship') {
        const pct = Math.floor(Math.random()*101)
        const n1 = args[0] || pushname
        const n2 = args[1] || 'Alguém'
        const emoji = pct > 80 ? '💘' : pct > 50 ? '❤️' : '💔'
        const texto = `${emoji} *Ship*\n${n1} + ${n2}\nCompatibilidade: *${pct}%*`
        await replyWithFoto(nawty, from, 'ship', texto, msg)
        return
      }
      if (command === 'chance') {
        if (!q) {
          await reply(`Use: ${prefix}chance de eu ficar rico`)
          return
        }
        const texto = `🎯 A chance de *${q}* é de *${Math.floor(Math.random()*101)}%*`
        await replyWithFoto(nawty, from, 'chance', texto, msg)
        return
      }
      if (command === 'dado' || command === 'roll') {
        const texto = `🎲 Você tirou: *${Math.floor(Math.random()*6)+1}*`
        await replyWithFoto(nawty, from, 'dado', texto, msg)
        return
      }
      if (command === 'cara' || command === 'coroa') {
        const texto = `🪙 Resultado: *${Math.random() > 0.5 ? 'Cara' : 'Coroa'}*`
        await replyWithFoto(nawty, from, 'cara', texto, msg)
        return
      }

      // ========== PP ==========
      if (command === 'pp' || command === 'perfil') {
        try {
          let jid = sender
          const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          if (mentioned) jid = mentioned
          const pp = await nawty.profilePictureUrl(jid, 'image').catch(()=>null)
          if (!pp) {
            await reply('Não foi possível obter a foto.')
            return
          }
          await nawty.sendMessage(from, { image: { url: pp }, caption: '📸' }, { quoted: msg })
        } catch {
          await reply('Erro ao pegar foto de perfil.')
        }
        return
      }

      // ========== SAY ==========
      if (command === 'say') {
        if (!q) {
          await reply(`Use: ${prefix}say texto`)
          return
        }
        await nawty.sendMessage(from, { text: q })
        return
      }

      // ========== BÁSICOS ==========
      if (command === 'ping') {
        const t = Date.now()
        const texto = `🏓 Pong!\n⏱️ ${Date.now()-t}ms`
        await replyWithFoto(nawty, from, 'ping', texto, msg)
        return
      }
      if (command === 'dono') {
        const texto = `👑 *Dono*\n${config.NomeDoDono}\n${config.NumeroDoDono}`
        await replyWithFoto(nawty, from, 'dono', texto, msg)
        return
      }
      if (command === 'info') {
        const texto = `🤖 *${config.NomeDoBot}*\nPrefixo: ${prefix}\nBaileys 7\nOnline ✅`
        await replyWithFoto(nawty, from, 'info', texto, msg)
        return
      }

    } catch (e) {
      console.error(colors.red('Erro:'), e)
    }
  })

  GreenLog('✅ Bot pronto! Sistema de fotos ativo.')
}

main()
