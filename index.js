/*
  NAWTY BOT - Baileys 7.0.0-rc14
  Menu interativo com botões
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
          msg.message.buttonsResponseMessage?.selectedButtonId ||
          msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
          msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
          ''

        // Trata resposta de lista interativa
        let selectedId = ''
        try {
          if (msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
            const parsed = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
            selectedId = parsed?.id || ''
          }
        } catch {}

        const textBody = body || selectedId
        if (!textBody) return

        const isCmd = textBody.startsWith(prefix)
        const command = isCmd ? textBody.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : textBody.toLowerCase()

        const reply = async (texto) => {
          await nawty.sendMessage(from, { text: texto }, { quoted: msg })
        }

        // ========== MENU COM BOTÕES ==========
        if (command === 'menu' || command === 'help' || command === 'ajuda') {
          console.log(colors.yellow(`[MENU] Solicitado por ${sender}`))

          const menuTxt = `
╭🌸─━⛩─━❄━─⛩━─🌸╮

    『 𝗡𝗔𝗪𝗧𝗬 𝗕𝗢𝗧 』

╰🌸─━⛩─━❄━─⛩━─🌸╯
        ❱❱ 𝗡𝗮𝘄𝘁𝘆 𝗕𝗼𝘁 ❰❰
╭🌸━─━─━─🌸─━─━─━─🌸╮
│❄╭─⛩༺ナウティ༻⛩─╮
│❄│ 𝐁𝐨𝐭: ${config.NomeDoBot}
│❄│ 𝐔𝐬𝐞𝐫: ${pushname}
│❄│ 𝐍𝐮𝐦𝐞𝐫𝐨: ${sender.split('@')[0]}
│❄│ 𝐆𝐫𝐮𝐩𝐨: ${isGroup ? 'Sim ✅' : 'Não ❌'}
│❄│ 𝐒𝐭𝐚𝐭𝐮𝐬: Online 🟢
│❄╰─⛩༺ナウティ༻⛩─╯
╰🌸━─━─━─🌸─━─━─━─🌸╯`

          const botoes = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "🌸 𝐌𝐄𝐍𝐔 ❆ 𝐋𝐈𝐒𝐓𝐀 🌸",
              sections: [{
                title: "Escolha uma categoria",
                rows: [
                  { header: "𝗠𝗘𝗡𝗨 𝗔𝗗𝗠", title: "🛡️ Admin", description: "Comandos para administradores", id: `${prefix}menuadm` },
                  { header: "𝗠𝗘𝗡𝗨 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦", title: "🗒 Comandos", description: "Comandos aleatórios", id: `${prefix}menucmd` },
                  { header: "𝗠𝗘𝗡𝗨 𝗗𝗢𝗡𝗢", title: "👑 Dono", description: "Comandos exclusivos do dono", id: `${prefix}menudono` },
                  { header: "𝗠𝗘𝗡𝗨 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗦", title: "⬇️ Downloads", description: "Baixar mídias", id: `${prefix}menudownloads` },
                  { header: "𝗠𝗘𝗡𝗨 𝗘𝗙𝗘𝗜𝗧𝗢𝗦", title: "🎨 Efeitos", description: "Efeitos de imagem e áudio", id: `${prefix}menuefeitos` },
                  { header: "𝗠𝗘𝗡𝗨 𝗜𝗔", title: "🤖 IA", description: "Inteligência Artificial", id: `${prefix}menuia` },
                  { header: "𝗠𝗘𝗡𝗨 𝗠𝗜𝗗𝗜𝗔𝗦", title: "🎬 Mídias", description: "Comandos de mídia", id: `${prefix}menumidias` },
                  { header: "𝗠𝗘𝗡𝗨 𝗣𝗥𝗘𝗠𝗜𝗨𝗠", title: "💎 Premium", description: "Comandos premium", id: `${prefix}menupremium` },
                  { header: "𝗠𝗘𝗡𝗨 𝗥𝗘𝗦𝗘𝗡𝗛𝗔", title: "🎮 Jogos", description: "Jogos e brincadeiras", id: `${prefix}menubrincadeira` },
                  { header: "𝗠𝗘𝗡𝗨 𝗥𝗣𝗚", title: "⚔️ RPG", description: "Sistema de RPG", id: `${prefix}menurpg` }
                ]
              }]
            })
          }]

          try {
            // Tenta enviar menu interativo moderno
            await nawty.relayMessage(from, {
              interactiveMessage: {
                body: { text: '⛩️🎐 _Clique no botão abaixo para ver os menus._ 🎐⛩️' },
                footer: { text: 'Nawty Bot • Baileys 7' },
                nativeFlowMessage: {
                  buttons: botoes
                }
              }
            }, {})
          } catch (e) {
            // Fallback caso o interativo falhe
            console.log('Fallback menu texto:', e.message)
            await reply(menuTxt + `\n\n*Comandos:*\n${prefix}ping\n${prefix}info\n${prefix}dono\n${prefix}menu`)
          }
        }

        // ========== OUTROS COMANDOS ==========
        else if (command === 'ping') {
          const start = Date.now()
          await reply(`🏓 Pong!\n⏱️ ${Date.now() - start}ms`)
        }

        else if (command === 'dono') {
          await reply(`👑 Dono: ${config.NomeDoDono || 'Não configurado'}\n📱 ${config.NumeroDoDono || 'Não configurado'}`)
        }

        else if (command === 'info') {
          await reply(`🤖 *${config.NomeDoBot}*\n\nPrefixo: ${prefix}\nVersão: Baileys 7.0.0-rc14\nStatus: Online ✅`)
        }

        // Resposta dos submenus (placeholder)
        else if (['menuadm','menucmd','menudono','menudownloads','menuefeitos','menuia','menumidias','menupremium','menubrincadeira','menurpg'].includes(command)) {
          await reply(`📂 Menu *${command}* ainda em desenvolvimento.\nEm breve terá todos os comandos dessa categoria.`)
        }

      } catch (e) {
        console.error(colors.red('Erro ao processar mensagem:'), e)
      }
    })

    GreenLog('✅ Bot pronto! Menu com botões ativo.')

  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
