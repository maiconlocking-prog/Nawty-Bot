/**
 * Menus — estilo Nazuna (sem RPG/VIP)
 */

function header(botName, userName, icon = '🌸') {
  return (
    '╭┈⊰ ' + icon + ' 『 *' + botName + '* 』\n' +
    '┊Olá, *' + userName + '*!\n' +
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  )
}

const TOP = '╭┈'
const MID = '┊'
const BOT = '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
const SEP = '❁'
const ITEM = '•.̇𖥨֗💜◆'

function section(title, lines, sep = SEP) {
  let t = TOP + sep + ' *' + title + '*\n' + MID + '\n'
  for (const line of lines) t += MID + ITEM + line + '\n'
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
    header(botName, userName, '🛡️') + '\n\n' +
    section('🛡️ GESTÃO', [
      prefix + 'ban @ / ' + prefix + 'kick @',
      prefix + 'promover @ / ' + prefix + 'rebaixar @',
      prefix + 'marcar <texto>',
      prefix + 'hidetag <texto>',
      prefix + 'grupo a/f',
      prefix + 'linkgp',
      prefix + 'del'
    ], '🛡️') + '\n\n' +
    section('🔒 SEGURANÇA', [
      prefix + 'antilink 1/0',
      prefix + 'antiflood 1/0',
      prefix + 'antipalavra 1/0',
      prefix + 'antipalavra add/del/list',
      prefix + 'antidoc 1/0',
      prefix + 'antiloc 1/0',
      prefix + 'seguranca'
    ], '🔒') + '\n\n' +
    section('📊 ATIVIDADE', [
      prefix + 'rankativo',
      prefix + 'resetativo'
    ], '📊')
  )
}

function menuBrincadeiras(prefix, botName, userName) {
  return (
    header(botName, userName, '🎮') + '\n\n' +
    section('🎮 BRINCADEIRAS', [
      prefix + 'gay @',
      prefix + 'ship',
      prefix + 'chance <texto>',
      prefix + 'dado',
      prefix + 'cara'
    ], '🎮') + '\n\n' +
    section('🏆 RANKS', [
      prefix + 'rankativo',
      prefix + 'rankgay / rankcorno / rankgado',
      prefix + 'rankgostoso / rankgostosa',
      prefix + 'ranklindo / ranklinda',
      prefix + 'rankengracado / rankfofoqueiro',
      prefix + 'rankburro / rankinteligente',
      prefix + 'rankrico / rankpobre',
      prefix + 'rankromantico / rankciumento'
    ], '🏆') + '\n\n' +
    section('⚡ ATIVAÇÃO', [
      prefix + 'modobrincadeira 1/0'
    ], '⚡')
  )
}

function menuDono(prefix, botName, userName) {
  return (
    header(botName, userName, '👑') + '\n\n' +
    section('🤖 CONFIGURAÇÕES', [
      prefix + 'prefixo <novo>',
      prefix + 'numerodono <número>',
      prefix + 'nomedono <nome>',
      prefix + 'nomebot <nome>',
      prefix + 'fotobot',
      prefix + 'msgprefix'
    ], '🤖') + '\n\n' +
    section('👥 USUÁRIOS', [
      prefix + 'blockuserg @',
      prefix + 'unblockuserg @',
      prefix + 'listblocks',
      prefix + 'addblackglobal @',
      prefix + 'rmblackglobal @',
      prefix + 'listblackglobal'
    ], '👥') + '\n\n' +
    section('🚫 GRUPOS', [
      prefix + 'bangp / ' + prefix + 'unbangp',
      prefix + 'listbangp',
      prefix + 'listagp',
      prefix + 'entrar <link>',
      prefix + 'sairgp',
      prefix + 'nuke confirmar'
    ], '🚫') + '\n\n' +
    section('📡 TRANSMISSÕES', [
      prefix + 'tm <mensagem>',
      prefix + 'divulgar <mensagem>'
    ], '📡') + '\n\n' +
    section('⚡ SEM PREFIXO', [
      prefix + 'addnopref S s',
      prefix + 'delnopref S',
      prefix + 'listnopref'
    ], '⚡') + '\n\n' +
    section('🛠️ MANUTENÇÃO', [
      prefix + 'reiniciar',
      prefix + 'backup',
      prefix + 'limpardb confirmar',
      prefix + 'limparrankg',
      prefix + 'seradm / ' + prefix + 'sermembro',
      prefix + 'setfoto <cmd>'
    ], '🛠️')
  )
}

function menuCmd(prefix, botName, userName) {
  return (
    header(botName, userName, '🛠️') + '\n\n' +
    section('🎨 FIGURINHAS', [
      prefix + 's / sticker  (atalho: S)',
      prefix + 'toimg',
      prefix + 'rgtake Nome/Autor',
      prefix + 'rtake Nome/Autor',
      prefix + 'take  (atalho: T)'
    ], '🎨') + '\n\n' +
    section('🎬 MÍDIA', [
      prefix + 'tomp3',
      prefix + 'cortaraudio / cortarvideo',
      prefix + 'bass grave eco reverse',
      prefix + 'videorapido espelhar rotacionar'
    ], '🎬') + '\n\n' +
    section('🛠️ UTILS', [
      prefix + 'nick / calc / ping',
      prefix + 'pp / say',
      prefix + 'semprefixo list'
    ], '🛠️')
  )
}

// stubs para não quebrar requires antigos
function menuRpg(prefix, botName, userName) {
  return menuPrincipal(prefix, botName, userName)
}
function menuVip(prefix, botName, userName) {
  return menuDono(prefix, botName, userName)
}

module.exports = {
  menuPrincipal,
  menuAdm,
  menuBrincadeiras,
  menuDono,
  menuCmd,
  menuRpg,
  menuVip
}
