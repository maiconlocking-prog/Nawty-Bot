/**
 * Nawty Buttons Helper
 * Tenta enviar menu interativo (nativeFlow / single_select)
 * Se falhar, usa fallback em texto
 */

async function sendButtonMenu(sock, jid, {
  title = 'Menu',
  text = 'Escolha uma opção:',
  footer = 'Nawty Bot',
  sections = [],
  quoted = null
} = {}) {

  // Formato moderno (nativeFlow + single_select)
  const interactiveMessage = {
    body: { text },
    footer: { text: footer },
    header: { title, hasMediaAttachment: false },
    nativeFlowMessage: {
      buttons: [{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: title,
          sections: sections
        })
      }]
    }
  }

  try {
    // Tentativa 1: relayMessage (mais compatível)
    await sock.relayMessage(jid, {
      interactiveMessage
    }, {})
    return true
  } catch (e1) {
    try {
      // Tentativa 2: sendMessage com interactiveButtons
      await sock.sendMessage(jid, {
        text,
        footer,
        title,
        interactiveButtons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title,
            sections
          })
        }]
      }, quoted ? { quoted } : {})
      return true
    } catch (e2) {
      try {
        // Tentativa 3: formato buttons antigo + nativeFlowInfo
        await sock.sendMessage(jid, {
          text,
          footer,
          buttons: [{
            buttonId: 'menu_list',
            buttonText: { displayText: '📋 Abrir Menu' },
            type: 4,
            nativeFlowInfo: {
              name: 'single_select',
              paramsJson: JSON.stringify({
                title,
                sections
              })
            }
          }],
          headerType: 1,
          viewOnce: true
        }, quoted ? { quoted } : {})
        return true
      } catch (e3) {
        // Fallback final: texto puro
        let fallback = `*${title}*\n\n${text}\n\n`
        for (const section of sections) {
          fallback += `*${section.title}*\n`
          for (const row of (section.rows || [])) {
            fallback += `• ${row.title}${row.description ? ' — ' + row.description : ''}\n`
          }
          fallback += '\n'
        }
        fallback += `_${footer}_`
        await sock.sendMessage(jid, { text: fallback }, quoted ? { quoted } : {})
        return false
      }
    }
  }
}

async function sendQuickButtons(sock, jid, {
  text = 'Escolha:',
  footer = 'Nawty Bot',
  buttons = [],
  quoted = null
} = {}) {
  // buttons = [{ id, text }]
  try {
    await sock.sendMessage(jid, {
      text,
      footer,
      interactiveButtons: buttons.map(b => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.text,
          id: b.id
        })
      }))
    }, quoted ? { quoted } : {})
    return true
  } catch {
    // Fallback texto
    let t = `${text}\n\n`
    buttons.forEach((b, i) => t += `${i + 1}. ${b.text}\n`)
    t += `\n_${footer}_`
    await sock.sendMessage(jid, { text: t }, quoted ? { quoted } : {})
    return false
  }
}

module.exports = { sendButtonMenu, sendQuickButtons }
