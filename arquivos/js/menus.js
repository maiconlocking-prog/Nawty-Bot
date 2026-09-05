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
      prefix + 'criador',
      prefix + 'modobrincadeira 1/0'
    ])
  )
}

function menuAdm(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🛡️ GESTÃO', [
      prefix + 'ban @ / ' + prefix + 'kick @',
      prefix + 'promover @ / ' + prefix + 'rebaixar @',
      prefix + 'marcar <texto>',
      prefix + 'hidetag <texto>',
      prefix + 'grupo a/f',
      prefix + 'linkgp',
      prefix + 'del'
    ]) + '\n\n' +
    section('🔒 SEGURANÇA', [
      prefix + 'antilink 1/0',
      prefix + 'antiflood 1/0',
      prefix + 'antipalavra 1/0',
      prefix + 'antipalavra add/del/list',
      prefix + 'antidoc 1/0',
      prefix + 'antiloc 1/0',
      prefix + 'seguranca'
    ]) + '\n\n' +
    section('📊 ATIVIDADE', [
      prefix + 'rankativo',
      prefix + 'resetativo'
    ])
  )
}

function menuBrincadeiras(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🎮 BRINCADEIRAS', [
      prefix + 'gay @',
      prefix + 'ship',
      prefix + 'chance <texto>',
      prefix + 'dado',
      prefix + 'cara'
    ]) + '\n\n' +
    section('🏆 RANKS', [
      prefix + 'rankativo',
      prefix + 'rankgay / rankcorno / rankgado',
      prefix + 'rankgostoso / ranklindo',
      prefix + 'rankengracado / rankfofoqueiro'
    ]) + '\n\n' +
    section('⚡ ATIVAÇÃO', [
      prefix + 'modobrincadeira 1',
      prefix + 'modobrincadeira 0'
    ])
  )
}

function menuDono(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('👑 DONO', [
      prefix + 'criador  (protegido)',
      prefix + 'dono',
      prefix + 'info',
      prefix + 'setfoto <comando>',
      prefix + 'setfoto list / del',
      prefix + 'modobrincadeira 1/0'
    ])
  )
}

function menuCmd(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🎨 FIGURINHAS', [
      prefix + 's / ' + prefix + 'sticker',
      prefix + 'toimg',
      prefix + 'rgtake Pack/Autor',
      prefix + 'rtake Pack/Autor',
      prefix + 'take  (responde figurinha)'
    ]) + '\n\n' +
    section('🎬 MÍDIA', [
      prefix + 'tomp3',
      prefix + 'cortaraudio <i> <f>',
      prefix + 'cortarvideo <i> <f>'
    ]) + '\n\n' +
    section('🔊 ÁUDIO / 🎥 VÍDEO', [
      prefix + 'bass ' + prefix + 'grave ' + prefix + 'eco',
      prefix + 'reverse ' + prefix + 'videorapido',
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
