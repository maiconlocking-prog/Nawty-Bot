/*
  NAWTY BOT - Baileys 7.0.0-rc14
  Menu funcional e estável
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { CyanLog, RedLog, GreenLog } = require('./arquivos/js/logger.js')

let nawty = null
const prefix = config.prefix || '¥'

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

        const reply = async (texto) => {
          await nawty.sendMessage(from, { text: texto }, { quoted: msg })
        }

        // ==================== MENU ====================
        if (command === 'menu' || command === 'help' || command === 'ajuda') {
          console.log(colors.yellow(`[MENU] ${sender}`))

          const menuTxt = `
╭🌸────────────🌸╮
      *NAWTY BOT*
╰🌸────────────🌸╯

👤 Usuário: *${pushname}*
📱 Número: *${sender.split('@')[0]}*
🤖 Bot: *${config.NomeDoBot}*
🔰 Prefixo: *${prefix}*
📍 Grupo: *${isGroup ? 'Sim' : 'Não'}*
🟢 Status: *Online*

╭─『 𝗠𝗘𝗡𝗨𝗦 』
│
│ 🛡️ ${prefix}menuadm
│ 🗒 ${prefix}menucmd
│ 👑 ${prefix}menudono
│ ⬇️ ${prefix}menudownloads
│ 🎨 ${prefix}menuefeitos
│ 🤖 ${prefix}menuia
│ 🎬 ${prefix}menumidias
│ 💎 ${prefix}menupremium
│ 🎮 ${prefix}menubrincadeira
│ ⚔️ ${prefix}menurpg
│
╰───────────────

⚡ Comandos rápidos:
• ${prefix}ping
• ${prefix}info
• ${prefix}dono

_Nawty Bot • Baileys 7_`

          // Tenta enviar com imagem se existir
          const imgPath = path.join(__dirname, 'arquivos/imagem/menu.jpg')
          
          try {
            if (fs.existsSync(imgPath)) {
              await nawty.sendMessage(from, {
                image: fs.readFileSync(imgPath),
                caption: menuTxt
              }, { quoted: msg })
            } else {
              // Sem imagem → tenta lista interativa simples
              await nawty.sendMessage(from, {
                text: menuTxt,
                footer: 'Nawty Bot',
                title: '🌸 Menu Principal',
                buttonText: 'Ver Categorias',
                sections: [{
                  title: 'Escolha uma categoria',
                  rows: [
                    { title: '🛡️ Admin', rowId: `${prefix}menuadm`, description: 'Comandos de administradores' },
                    { title: '🗒 Comandos', rowId: `${prefix}menucmd`, description: 'Comandos aleatórios' },
                    { title: '👑 Dono', rowId: `${prefix}menudono`, description: 'Comandos do dono' },
                    { title: '⬇️ Downloads', rowId: `${prefix}menudownloads`, description: 'Baixar mídias' },
                    { title: '🎨 Efeitos', rowId: `${prefix}menuefeitos`, description: 'Efeitos de imagem/áudio' },
                    { title: '🤖 IA', rowId: `${prefix}menuia`, description: 'Inteligência Artificial' },
                    { title: '🎬 Mídias', rowId: `${prefix}menumidias`, description: 'Comandos de mídia' },
                    { title: '💎 Premium', rowId: `${prefix}menupremium`, description: 'Comandos premium' },
                    { title: '🎮 Jogos', rowId: `${prefix}menubrincadeira`, description: 'Jogos e brincadeiras' },
                    { title: '⚔️ RPG', rowId: `${prefix}menurpg`, description: 'Sistema de RPG' }
                  ]
                }]
              }, { quoted: msg })
            }
          } catch (err) {
            // Último fallback: só texto
            console.log('Erro no menu avançado, usando texto puro:', err.message)
            await reply(menuTxt)
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
          await reply(`🤖 *Informações*\n\nNome: ${config.NomeDoBot}\nPrefixo: ${prefix}\nVersão: Baileys 7.0.0-rc14\nStatus: Online ✅`)
        }

        // Submenus (placeholder)
        else if (['menuadm','menucmd','menudono','menudownloads','menuefeitos','menuia','menumidias','menupremium','menubrincadeira','menurpg'].includes(command)) {
          await reply(`📂 O menu *${command}* ainda está em desenvolvimento.\nEm breve terá a lista completa de comandos.`)
        }

      } catch (e) {
        console.error(colors.red('Erro ao processar mensagem:'), e)
      }
    })

    GreenLog('✅ Bot pronto e respondendo!')

  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
