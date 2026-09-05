/**
 * Estilo de menus inspirado na Nazuna
 */

function header(botName, userName) {
  return (
    '╭┈⊰ 🌸 『 *' + botName + '* 』\n' +
    '┊Olá, *' + userName + '*!\n' +
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  )
}

const TOP = '╭┈'
const MID = '┊'
const BOT = '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
const SEP = '❁'
const ITEM = '•.̇𖥨֗💜◆'
const TITLE = '🍧ꕸ▸'

function section(title, lines) {
  let t = TOP + SEP + ' *' + title + '*\n' + MID + '\n'
  for (const line of lines) {
    t += MID + ITEM + line + '\n'
  }
  t += BOT
  return t
}

function menuPrincipal(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('MENU PRINCIPAL', [
      prefix + 'menuadm',
      prefix + 'menubrincadeiras',
      prefix + 'menudono',
      prefix + 'menucmd',
      prefix + 'modobrincadeira 1/0'
    ])
  )
}

function menuAdm(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🛡️ GESTÃO (em breve)', [
      prefix + 'ban / ' + prefix + 'kick',
      prefix + 'promover / ' + prefix + 'rebaixar',
      prefix + 'marcar / ' + prefix + 'hidetag',
      prefix + 'grupo A/F',
      prefix + 'antilink'
    ]) + '\n\n' +
    section('⚙️ CONFIGURAÇÕES', [
      prefix + 'modobrincadeira 1/0',
      '_Sem necessidade de ativação_'
    ])
  )
}

function menuBrincadeiras(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🎮 BRINCADEIRAS', [
      prefix + 'gay @ ou nome',
      prefix + 'ship  (2 aleatórios no grupo)',
      prefix + 'ship @ @',
      prefix + 'chance <texto>',
      prefix + 'dado',
      prefix + 'cara'
    ]) + '\n\n' +
    section('⚡ ATIVAÇÃO NO GRUPO', [
      prefix + 'modobrincadeira 1',
      prefix + 'modobrincadeira 0'
    ])
  )
}

function menuDono(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('👑 DONO', [
      prefix + 'dono',
      prefix + 'info',
      prefix + 'setfoto <comando>',
      prefix + 'setfoto list',
      prefix + 'setfoto del <comando>',
      prefix + 'modobrincadeira 1/0'
    ]) + '\n\n' +
    MID + '_Sem necessidade de ativação_\n' + BOT
  )
}

function menuCmd(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🎨 FIGURINHAS', [
      prefix + 's / ' + prefix + 'sticker',
      prefix + 'toimg'
    ]) + '\n\n' +
    section('🎬 MÍDIA', [
      prefix + 'tomp3',
      prefix + 'cortaraudio <i> <f>',
      prefix + 'cortarvideo <i> <f>'
    ]) + '\n\n' +
    section('🔊 ÁUDIO', [
      prefix + 'bass ' + prefix + 'grave ' + prefix + 'eco',
      prefix + 'reverse ' + prefix + 'normalizar',
      prefix + 'vozmenino ' + prefix + 'vozmulher',
      prefix + 'speed 1.5 ' + prefix + 'volumeboost'
    ]) + '\n\n' +
    section('🎥 VÍDEO', [
      prefix + 'videorapido ' + prefix + 'videoslow',
      prefix + 'videoreverso ' + prefix + 'videomudo',
      prefix + 'espelhar ' + prefix + 'rotacionar'
    ]) + '\n\n' +
    section('🛠️ UTILS', [
      prefix + 'nick ' + prefix + 'calc ' + prefix + 'ping',
      prefix + 'pp ' + prefix + 'say'
    ])
  )
}

module.exports = {
  menuPrincipal,
  menuAdm,
  menuBrincadeiras,
  menuDono,
  menuCmd
}
