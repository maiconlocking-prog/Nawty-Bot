/*
  NAWTY BOT - Baileys 7
  Sticker funcional + comandos extras
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const webp = require('node-webpmux')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { CyanLog, RedLog, GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'

// ============== STICKER HELPERS ==============
function ensureTmpDir() {
  const tmpDir = path.join(__dirname, 'database/tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  return tmpDir
}

function generateTempFileName(ext) {
  return path.join(ensureTmpDir(), `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`)
}

function detectImageExtension(buf) {
  if (buf.length >= 12) {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png'
    if (buf[0] === 0xFF && buf[1] === 0xD8) return 'jpg'
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp'
  }
  return 'jpg'
}

async function convertToWebp(mediaBuffer, isVideo = false) {
  if (!isVideo && mediaBuffer.slice(0, 4).toString() === 'RIFF' && mediaBuffer.slice(8, 12).toString() === 'WEBP') {
    return mediaBuffer
  }

  const inExt = isVideo ? 'mp4' : detectImageExtension(mediaBuffer)
  const tmpIn = generateTempFileName(isVideo ? 'mp4' : inExt)
  fs.writeFileSync(tmpIn, mediaBuffer)

  const vf = 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba'
  const filters = isVideo ? `${vf},fps=15` : vf

  let quality = isVideo ? 40 : 70
  let outBuffer = null
  const MAX_SIZE = 1000000

  for (let i = 0; i < 6; i++) {
    const tmpOut = generateTempFileName('webp')
    const options = [
      '-vf', filters,
      '-c:v', 'libwebp',
      '-lossless', '0',
      '-compression_level', '6',
      '-q:v', String(quality)
    ]
    if (isVideo) options.push('-loop', '0', '-an', '-vsync', '0', '-t', '6')

    await new Promise((resolve, reject) => {
      ffmpeg(tmpIn)
        .outputOptions(options)
        .format('webp')
        .on('error', reject)
        .on('end', resolve)
        .save(tmpOut)
    })

    outBuffer = fs.readFileSync(tmpOut)
    try { fs.unlinkSync(tmpOut) } catch {}

    if (outBuffer.length <= MAX_SIZE) break
    quality = Math.max(15, quality - 12)
  }

  try { fs.unlinkSync(tmpIn) } catch {}
  return outBuffer
}

async function writeExif(webpBuffer, packname = 'Nawty Bot', author = 'Nawty') {
  try {
    const img = new webp.Image()
    await img.load(webpBuffer)
    const json = {
      'sticker-pack-id': 'https://github.com/maiconlocking-prog/Nawty-Bot',
      'sticker-pack-name': packname,
      'sticker-pack-publisher': author,
      'emojis': ['🌸']
    }
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
    const exif = Buffer.concat([exifAttr, jsonBuff])
    exif.writeUIntLE(jsonBuff.length, 14, 4)
    img.exif = exif
    return await img.save(null)
  } catch {
    return webpBuffer
  }
}

async function getMediaBuffer(message, type) {
  const stream = await downloadContentFromMessage(message, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

// ============== MAIN ==============
async function main() {
  try {
    console.log(colors.cyan('🌸 Iniciando Nawty Bot...'))
    nawty = await startConnection(null, config)
    if (!nawty) return

    nawty.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg?.message) return

        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = msg.key.participant || msg.key.remoteJid
        const pushname = msg.pushName || 'Usuário'

        const body =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          ''

        if (!body) return

        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')

        const reply = (texto) => nawty.sendMessage(from, { text: texto }, { quoted: msg })
        const reagir = (emoji) => nawty.sendMessage(from, { react: { text: emoji, key: msg.key } })

        // ========== MENU ==========
        if (['menu', 'help', 'ajuda'].includes(command)) {
          await reply(`╭🌸──────────────🌸╮
       *NAWTY BOT*
╰🌸──────────────🌸╯

👤 ${pushname}
🔰 Prefixo: *${prefix}*

╭─『 FIGURINHAS 』
│ ${prefix}s / ${prefix}sticker / ${prefix}f
│ ${prefix}toimg (sticker → imagem)
╰──────────────

╭─『 UTILITÁRIOS 』
│ ${prefix}ping
│ ${prefix}info
│ ${prefix}dono
│ ${prefix}say <texto>
╰──────────────

_Envie imagem/vídeo + ${prefix}s para fazer figurinha_`) 
        }

        // ========== STICKER ==========
        else if (['s', 'sticker', 'f', 'fig', 'figurinha'].includes(command)) {
          try {
            await reagir('⏳')

            let mediaMsg = null
            let isVideo = false

            // Resposta a mídia
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (quoted) {
              if (quoted.imageMessage) { mediaMsg = quoted.imageMessage; isVideo = false }
              else if (quoted.videoMessage) { mediaMsg = quoted.videoMessage; isVideo = true }
              else if (quoted.stickerMessage) { mediaMsg = quoted.stickerMessage; isVideo = false }
            }

            // Mídia na própria mensagem
            if (!mediaMsg) {
              if (msg.message.imageMessage) { mediaMsg = msg.message.imageMessage; isVideo = false }
              else if (msg.message.videoMessage) { mediaMsg = msg.message.videoMessage; isVideo = true }
            }

            if (!mediaMsg) {
              await reply(`❌ Marque ou responda uma *imagem* ou *vídeo* com:\n\n${prefix}s`)
              return
            }

            const buffer = await getMediaBuffer(mediaMsg, isVideo ? 'video' : 'image')
            let webpBuffer = await convertToWebp(buffer, isVideo)
            webpBuffer = await writeExif(webpBuffer, config.NomeDoBot || 'Nawty Bot', config.NomeDoDono || 'Nawty')

            await nawty.sendMessage(from, { sticker: webpBuffer }, { quoted: msg })
            await reagir('✅')

          } catch (err) {
            console.error('Erro sticker:', err)
            await reply('❌ Falha ao criar figurinha.\nVerifique se o ffmpeg está instalado (`pkg install ffmpeg`).')
            await reagir('❌')
          }
        }

        // ========== TOIMG ==========
        else if (command === 'toimg') {
          try {
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted?.stickerMessage) {
              await reply(`❌ Responda um *sticker* com ${prefix}toimg`)
              return
            }
            await reagir('⏳')
            const buffer = await getMediaBuffer(quoted.stickerMessage, 'sticker')
            await nawty.sendMessage(from, { image: buffer, caption: '✅ Convertido!' }, { quoted: msg })
            await reagir('✅')
          } catch (e) {
            await reply('❌ Erro ao converter sticker.')
          }
        }

        // ========== OUTROS ==========
        else if (command === 'ping') {
          const t = Date.now()
          await reply(`🏓 Pong!\n⏱️ ${Date.now() - t}ms`)
        }
        else if (command === 'dono') {
          await reply(`👑 *Dono*\n${config.NomeDoDono}\n${config.NumeroDoDono}`)
        }
        else if (command === 'info') {
          await reply(`🤖 *${config.NomeDoBot}*\nPrefixo: ${prefix}\nBaileys 7.0.0-rc14\nStatus: Online ✅`)
        }
        else if (command === 'say') {
          if (!q) return reply(`Use: ${prefix}say seu texto`)
          await nawty.sendMessage(from, { text: q })
        }

      } catch (e) {
        console.error(colors.red('Erro:'), e)
      }
    })

    GreenLog('✅ Bot pronto! Sticker + toimg ativos.')
  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
