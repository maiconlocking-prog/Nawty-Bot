/*
  NAWTY BOT - Baileys 7.0.0-rc14
  Com sistema básico de resposta
  Agora responde também comandos enviados pela própria conta do bot
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { CyanLog, RedLog, GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'
const dono = (config.NumeroDoDono || '').replace(/\D/g, '')

async function main() {
  try {
    console.log(colors.cyan('🌸 Iniciando Nawty Bot...'))
    nawty = await startConnection(null, config)

    if (!nawty) {
      console.log(colors.red('Falha ao conectar.'))
      return
    }

    // Escuta mensagens
    nawty.ev.on('messages.upsert', async ({ messages, type }) => {
      try {
        const msg = messages[0]
        if (!msg || !msg.message) return

        // Agora permite mensagens fromMe (da própria conta do bot)
        // if (msg.key.fromMe) return  ← removido

        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = isGroup ? (msg.key.participant || msg.participant) : from

        // Extrai o texto da mensagem
        const body = 
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          ''

        if (!body) return

        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')

        // Função de resposta rápida
        const reply = async (texto) => {
          await nawty.sendMessage(from, { text: texto }, { quoted: msg })
        }

        // ========== COMANDOS BÁSICOS ==========
        if (isCmd) {
          console.log(colors.yellow(`[CMD] ${command} | De: ${sender} | fromMe: ${msg.key.fromMe}`))

          if (command === 'menu' || command === 'help' || command === 'ajuda') {
            await reply(`🌸 *NAWTY BOT* 🌸\n\nPrefixo: ${prefix}\n\n*Comandos disponíveis:*\n${prefix}menu\n${prefix}ping\n${prefix}dono\n${prefix}info\n\nBot atualizado com Baileys 7 + Pairing Code`)
          }

          else if (command === 'ping') {
            const start = Date.now()
            await reply(`🏓 Pong!\n⏱️ ${Date.now() - start}ms`)
          }

          else if (command === 'dono') {
            await reply(`👑 Dono do bot: ${config.NomeDoDono || 'Não configurado'}\n📱 Número: ${config.NumeroDoDono || 'Não configurado'}`)
          }

          else if (command === 'info') {
            await reply(`🤖 *Informações do Bot*\n\nNome: ${config.NomeDoBot}\nPrefixo: ${prefix}\nVersão: Baileys 7.0.0-rc14\nStatus: Online ✅`)
          }

          else {
            // Comando não encontrado
            // await reply(`Comando *${command}* não encontrado.\nUse ${prefix}menu`)
          }
        }

      } catch (e) {
        console.error(colors.red('Erro ao processar mensagem:'), e)
      }
    })

    GreenLog('✅ Bot pronto e ouvindo mensagens! (inclusive da própria conta)')

  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
