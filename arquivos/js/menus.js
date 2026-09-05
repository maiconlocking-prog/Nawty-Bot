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
      prefix + 'menurank',
      prefix + 'modobrincadeira 1/0'
    ])
  )
}

function menuAdm(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('🛡️ GESTÃO DE USUÁRIOS', [
      prefix + 'ban @ / kick @',
      prefix + 'promover @',
      prefix + 'rebaixar @'
    ]) + '\n\n' +
    section('💬 MARCAÇÕES', [
      prefix + 'marcar <texto>',
      prefix + 'hidetag <texto>'
    ]) + '\n\n' +
    section('⚙️ GRUPO', [
      prefix + 'grupo a  (abrir)',
      prefix + 'grupo f  (fechar)',
      prefix + 'linkgp',
      prefix + 'del  (apaga msg marcada)'
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
    section('🏆 RANKS ALEATÓRIOS', [
      prefix + 'rankgay',
      prefix + 'rankcorno',
      prefix + 'rankgado',
      prefix + 'rankgostoso',
      prefix + 'ranklindo',
      prefix + 'rankengracado',
      prefix + 'menurank  (lista todos)'
    ]) + '\n\n' +
    section('⚡ ATIVAÇÃO NO GRUPO', [
      prefix + 'modobrincadeira 1',
      prefix + 'modobrincadeira 0'
    ])
  )
}

function menuRank(prefix, botName, userName) {
  return (
    header(botName, userName) + '\n\n' +
    section('📊 RANK REAL', [
      prefix + 'rankativo  (mais ativos)',
      prefix + 'resetativo  (admin)'
    ]) + '\n\n' +
    section('🎲 RANKS DE BRINCADEIRA', [
      prefix + 'rankgay',
      prefix + 'rankburro',
      prefix + 'rankinteligente',
      prefix + 'rankotaku',
      prefix + 'rankfiel / rankinfiel',
      prefix + 'rankcorno / rankgado',
      prefix + 'rankgostoso / rankgostosa',
      prefix + 'rankrico / rankpobre',
      prefix + 'ranklindo / ranklinda',
      prefix + 'rankengracado',
      prefix + 'rankfofoqueiro',
      prefix + 'rankdorminhoco',
      prefix + 'rankromantico',
      prefix + 'rankciumento'
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
    ])
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
      prefix + 'speed 1.5'
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
  menuRank,
  menuDono,
  menuCmd
}
