/*
  NAWTY BOT - Baileys 7
  Muitos comandos offline inspirados na Nazuna
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const ffmpeg = require('fluent-ffmpeg')
const webp = require('node-webpmux')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { GreenLog, RedLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'

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

// ===================== TEXT STYLES =====================
const STYLES = {
  bold: {'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦','n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝐮','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳','A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌','N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙','0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'},
  italic: {'a':'𝘢','b':'𝘣','c':'𝘤','d':'𝘥','e':'𝘦','f':'𝘧','g':'𝘨','h':'𝘩','i':'𝘪','j':'𝘫','k':'𝘬','l':'𝘭','m':'𝘮','n':'𝘯','o':'𝘰','p':'𝘱','q':'𝘲','r':'𝘳','s':'𝘴','t':'𝘵','u':'𝘶','v':'𝘷','w':'𝘸','x':'𝘹','y':'𝘺','z':'𝘻','A':'𝘈','B':'𝘉','C':'𝘊','D':'𝘋','E':'𝘌','F':'𝘍','G':'𝘎','H':'𝘏','I':'𝘐','J':'𝘑','K':'𝘒','L':'𝘓','M':'𝘔','N':'𝘕','O':'𝘖','P':'𝘗','Q':'𝘘','R':'𝘙','S':'𝘚','T':'𝘛','U':'𝘜','V':'𝘝','W':'𝘞','X':'𝘟','Y':'𝘠','Z':'𝘡'},
  script: {'a':'𝓪','b':'𝓫','c':'𝓬','d':'𝓭','e':'𝓮','f':'𝓯','g':'𝓰','h':'𝓱','i':'𝓲','j':'𝓳','k':'𝓴','l':'𝓵','m':'𝓶','n':'𝓷','o':'𝓸','p':'𝓹','q':'𝓺','r':'𝓻','s':'𝓼','t':'𝓽','u':'𝓾','v':'𝓿','w':'𝔀','x':'𝔁','y':'𝔂','z':'𝔃','A':'𝓐','B':'𝓑','C':'𝓒','D':'𝓓','E':'𝓔','F':'𝓕','G':'𝓖','H':'𝓗','I':'𝓘','J':'𝓙','K':'𝓚','L':'𝓛','M':'𝓜','N':'𝓝','O':'𝓞','P':'𝓟','Q':'𝓠','R':'𝓡','S':'𝓢','T':'𝓣','U':'𝓤','V':'𝓥','W':'𝓦','X':'𝓧','Y':'𝓨','Z':'𝓩'},
  bubbled: {'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ','A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ'},
  fullwidth: {'a':'ａ','b':'ｂ','c':'ｃ','d':'ｄ','e':'ｅ','f':'ｆ','g':'ｇ','h':'ｈ','i':'ｉ','j':'ｊ','k':'ｋ','l':'ｌ','m':'ｍ','n':'ｎ','o':'ｏ','p':'ｐ','q':'ｑ','r':'ｒ','s':'ｓ','t':'ｔ','u':'ｕ','v':'ｖ','w':'ｗ','x':'ｘ','y':'ｙ','z':'ｚ','A':'Ａ','B':'Ｂ','C':'Ｃ','D':'Ｄ','E':'Ｅ','F':'Ｆ','G':'Ｇ','H':'Ｈ','I':'Ｉ','J':'Ｊ','K':'Ｋ','L':'Ｌ','M':'Ｍ','N':'Ｎ','O':'Ｏ','P':'Ｐ','Q':'Ｑ','R':'Ｒ','S':'Ｓ','T':'Ｔ','U':'Ｕ','V':'Ｖ','W':'Ｗ','X':'Ｘ','Y':'Ｙ','Z':'Ｚ','0':'０','1':'１','2':'２','3':'３','4':'４','5':'５','6':'６','7':'７','8':'８','9':'９'},
  small: {'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','q':'q','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','A':'ᴬ','B':'ᴮ','C':'ᶜ','D':'ᴰ','E':'ᴱ','F':'ᶠ','G':'ᴳ','H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','Q':'Q','R':'ᴿ','S':'ˢ','T':'ᵀ','U':'ᵁ','V':'ⱽ','W':'ᵂ','X':'ˣ','Y':'ʸ','Z':'ᶻ'},
  inverted: {'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ᴉ','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','B':'ᗺ','C':'Ɔ','D':'ᗡ','E':'Ǝ','F':'Ⅎ','G':'⅁','H':'H','I':'I','J':'ſ','K':'⋊','L':'˥','M':'W','N':'N','O':'O','P':'Ԁ','Q':'Q','R':'ᴚ','S':'S','T':'⊥','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z'}
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
      const isGroup = from.endsWith('@g.us')
      const sender = msg.key.participant || from
      const pushname = msg.pushName || 'Usuário'
      const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || ''
      if (!body) return

      const isCmd = body.startsWith(prefix)
      const command = isCmd ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : ''
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')

      const reply = (t) => nawty.sendMessage(from, { text: t }, { quoted: msg })
      const reagir = (e) => nawty.sendMessage(from, { react: { text: e, key: msg.key } })

      // ========== MENU ==========
      if (['menu','help','ajuda'].includes(command)) {
        await reply(`╭🌸───────────────🌸╮
        *NAWTY BOT*
╰🌸───────────────🌸╯

👤 ${pushname}
🔰 Prefixo: *${prefix}*

╭─『 𝗙𝗜𝗚𝗨𝗥𝗜𝗡𝗛𝗔𝗦 』
│ ${prefix}s / ${prefix}sticker / ${prefix}f
│ ${prefix}toimg
╰──────────────

╭─『 𝗧𝗘𝗫𝗧𝗢 』
│ ${prefix}nick <texto>
│ ${prefix}say <texto>
╰──────────────

╭─『 𝗙𝗨𝗡 』
│ ${prefix}gay @
│ ${prefix}ship @ @
│ ${prefix}chance <texto>
│ ${prefix}dado
│ ${prefix}cara
╰──────────────

╭─『 𝗨𝗧𝗜𝗟𝗦 』
│ ${prefix}ping
│ ${prefix}calc <expressão>
│ ${prefix}info
│ ${prefix}dono
│ ${prefix}pp @
╰──────────────`)
      }

      // ========== STICKER ==========
      else if (['s','sticker','f','fig','figurinha'].includes(command)) {
        try {
          await reagir('⏳')
          let media=null, isVideo=false
          const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
          if (quoted?.imageMessage) { media=quoted.imageMessage; isVideo=false }
          else if (quoted?.videoMessage) { media=quoted.videoMessage; isVideo=true }
          else if (quoted?.stickerMessage) { media=quoted.stickerMessage; isVideo=false }
          else if (msg.message.imageMessage) { media=msg.message.imageMessage; isVideo=false }
          else if (msg.message.videoMessage) { media=msg.message.videoMessage; isVideo=true }

          if (!media) return reply(`❌ Responda uma imagem/vídeo com ${prefix}s`)

          const buffer = await getBuffer(media, isVideo?'video':'image')
          let webpBuf = await convertToWebp(buffer, isVideo)
          webpBuf = await writeExif(webpBuf, config.NomeDoBot||'Nawty', config.NomeDoDono||'Nawty')
          await nawty.sendMessage(from, { sticker: webpBuf }, { quoted: msg })
          await reagir('✅')
        } catch(e) {
          console.error(e)
          await reply('❌ Erro ao criar figurinha. Instale: pkg install ffmpeg')
          await reagir('❌')
        }
      }

      // ========== TOIMG ==========
      else if (command === 'toimg') {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted?.stickerMessage) return reply(`Responda um sticker com ${prefix}toimg`)
        await reagir('⏳')
        const buf = await getBuffer(quoted.stickerMessage, 'sticker')
        await nawty.sendMessage(from, { image: buf, caption: '✅' }, { quoted: msg })
        await reagir('✅')
      }

      // ========== NICK / ESTILOS ==========
      else if (command === 'nick' || command === 'estilo') {
        if (!q) return reply(`Use: ${prefix}nick seu texto`)
        let txt = `✨ *Estilos para:* ${q}\n\n`
        for (const [name, map] of Object.entries(STYLES)) {
          txt += `*${name}*: ${styleText(q, name)}\n`
        }
        await reply(txt)
      }

      // ========== CALC ==========
      else if (command === 'calc' || command === 'calcular') {
        if (!q) return reply(`Use: ${prefix}calc 2+2*5`)
        try {
          // segurança básica
          if (!/^[0-9+\-*/().%\s]+$/.test(q)) return reply('Expressão inválida')
          const result = Function(`"use strict"; return (${q})`)()
          await reply(`🧮 *Resultado:*\n${q} = *${result}*`)
        } catch {
          await reply('Erro no cálculo')
        }
      }

      // ========== FUN ==========
      else if (command === 'gay') {
        const pct = Math.floor(Math.random()*101)
        const target = q || pushname
        await reply(`🏳️‍🌈 *${target}* é *${pct}%* gay`)
      }
      else if (command === 'ship') {
        const pct = Math.floor(Math.random()*101)
        const n1 = args[0] || pushname
        const n2 = args[1] || 'Alguém'
        let emoji = pct > 80 ? '💘' : pct > 50 ? '❤️' : pct > 20 ? '💔' : '❌'
        await reply(`${emoji} *Ship*\n${n1} + ${n2}\nCompatibilidade: *${pct}%*`)
      }
      else if (command === 'chance') {
        if (!q) return reply(`Use: ${prefix}chance de eu ganhar na loteria`)
        const pct = Math.floor(Math.random()*101)
        await reply(`🎯 A chance de *${q}* é de *${pct}%*`)
      }
      else if (command === 'dado' || command === 'roll') {
        const n = Math.floor(Math.random()*6)+1
        await reply(`🎲 Você tirou: *${n}*`)
      }
      else if (command === 'cara' || command === 'coroa') {
        const r = Math.random() > 0.5 ? 'Cara' : 'Coroa'
        await reply(`🪙 Resultado: *${r}*`)
      }

      // ========== PP (foto de perfil) ==========
      else if (command === 'pp' || command === 'perfil') {
        try {
          let jid = sender
          if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            jid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0]
          } else if (msg.message.extendedTextMessage?.contextInfo?.participant) {
            jid = msg.message.extendedTextMessage.contextInfo.participant
          }
          const pp = await nawty.profilePictureUrl(jid, 'image').catch(()=>null)
          if (!pp) return reply('Não foi possível obter a foto de perfil.')
          await nawty.sendMessage(from, { image: { url: pp }, caption: '📸 Foto de perfil' }, { quoted: msg })
        } catch {
          await reply('Erro ao pegar foto de perfil.')
        }
      }

      // ========== SAY ==========
      else if (command === 'say') {
        if (!q) return reply(`Use: ${prefix}say texto`)
        await nawty.sendMessage(from, { text: q })
      }

      // ========== BÁSICOS ==========
      else if (command === 'ping') {
        const t = Date.now()
        await reply(`🏓 Pong!\n⏱️ ${Date.now()-t}ms`)
      }
      else if (command === 'dono') {
        await reply(`👑 *Dono*\n${config.NomeDoDono}\n${config.NumeroDoDono}`)
      }
      else if (command === 'info') {
        await reply(`🤖 *${config.NomeDoBot}*\nPrefixo: ${prefix}\nBaileys 7\nOnline ✅`)
      }

    } catch (e) {
      console.error(colors.red('Erro:'), e)
    }
  })

  GreenLog('✅ Bot pronto com vários comandos!')
}

main()
