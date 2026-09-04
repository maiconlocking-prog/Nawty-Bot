/*
  NAWTY BOT - Baileys 7.0.0-rc14
  Comandos inspirados na Nazuna + menu melhorado
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { CyanLog, RedLog, GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'

// Função auxiliar para baixar mídia
async function getBuffer(message, type) {
  const stream = await downloadContentFromMessage(message, type)
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

async function main() {
  try {
    console.log(colors.cyan('🌸 Iniciando Nawty Bot...'))
    nawty = await startConnection(null, config)

    if (!nawty) {
      console.log(colors.red('Falha ao conectar.'))
      return
    }

    nawty.ev.on('messages.upsert', async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg || !msg.message) return

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
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          ''

        if (!body) return

        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : body.toLowerCase()
        const args = body.trim().split(/ +/).slice(1)

        const reply = async (texto) => {
          await nawty.sendMessage(from, { text: texto }, { quoted: msg })
        }

        const reagir = async (emoji) => {
          await nawty.sendMessage(from, { react: { text: emoji, key: msg.key } })
        }

        // ==================== MENU ====================
        if (command === 'menu' || command === 'help' || command === 'ajuda') {
          const menuTxt = `
╭🌸──────────────🌸╮
       *NAWTY BOT*
╰🌸──────────────🌸╯

👤 *${pushname}*
🤖 ${config.NomeDoBot}
🔰 Prefixo: *${prefix}*

╭─『 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 』
│
│ 🎨 *Figurinhas*
│ ⊃ ${prefix}s / ${prefix}sticker
│ ⊃ ${prefix}f
│
│ ⚡ *Utilitários*
│ ⊃ ${prefix}ping
│ ⊃ ${prefix}info
│ ⊃ ${prefix}dono
│
│ 📂 *Menus*
│ ⊃ ${prefix}menuadm
│ ⊃ ${prefix}menudono
│ ⊃ ${prefix}menucmd
│
╰────────────────

_Envie uma imagem/vídeo com ${prefix}s para fazer figurinha_
_Nawty Bot • Baileys 7_`

          await reply(menuTxt)
        }

        // ==================== STICKER (inspirado na Nazuna) ====================
        else if (['s', 'sticker', 'f', 'fig', 'figurinha'].includes(command)) {
          try {
            await reagir('⏳')

            let mediaMessage = null
            let isVideo = false

            // Verifica se é resposta a uma mídia
            if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
              const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage
              if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage
                isVideo = false
              } else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage
                isVideo = true
              } else if (quoted.stickerMessage) {
                mediaMessage = quoted.stickerMessage
                isVideo = false
              }
            }

            // Ou se a própria mensagem tem mídia
            if (!mediaMessage) {
              if (msg.message.imageMessage) {
                mediaMessage = msg.message.imageMessage
                isVideo = false
              } else if (msg.message.videoMessage) {
                mediaMessage = msg.message.videoMessage
                isVideo = true
              }
            }

            if (!mediaMessage) {
              await reply(`❌ Marque ou responda uma *imagem* ou *vídeo* com o comando:\n\n${prefix}s`)
              return
            }

            const buffer = await getBuffer(mediaMessage, isVideo ? 'video' : 'image')

            await nawty.sendMessage(from, {
              sticker: buffer
            }, { quoted: msg })

            await reagir('✅')

          } catch (err) {
            console.error('Erro no sticker:', err)
            await reply('❌ Erro ao criar a figurinha. Tente novamente com outra mídia.')
            await reagir('❌')
          }
        }

        // ==================== OUTROS COMANDOS ====================
        else if (command === 'ping') {
          const start = Date.now()
          await reply(`🏓 *Pong!*\n⏱️ ${Date.now() - start}ms`)
        }

        else if (command === 'dono') {
          await reply(`👑 *Dono do Bot*\n\nNome: ${config.NomeDoDono || 'Não configurado'}\nNúmero: ${config.NumeroDoDono || 'Não configurado'}`)
        }

        else if (command === 'info') {
          await reply(`🤖 *${config.NomeDoBot}*\n\nPrefixo: ${prefix}\nVersão: Baileys 7.0.0-rc14\nStatus: Online ✅\n
Comandos de figurinha: ${prefix}s | ${prefix}sticker | ${prefix}f`)
        }

        // Placeholders de menus
        else if (['menuadm','menucmd','menudono','menudownloads','menuefeitos','menuia','menumidias','menupremium','menubrincadeira','menurpg'].includes(command)) {
          await reply(`📂 Menu *${command}* em desenvolvimento.\nEm breve mais comandos!`)
        }

      } catch (e) {
        console.error(colors.red('Erro ao processar mensagem:'), e)
      }
    })

    GreenLog('✅ Bot pronto! Comando de sticker ativo.')

  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
