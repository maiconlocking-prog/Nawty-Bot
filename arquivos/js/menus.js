/**
 * Menus organizados — estilo Nazuna
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
      prefix + 'menurpg',
      prefix + 'menuvip',
      prefix + 'criador',
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
    section('👑 DONO / CRIADOR', [
      prefix + 'criador',
      prefix + 'dono / ' + prefix + 'info',
      prefix + 'backup',
      prefix + 'setfoto <cmd> | list | del',
      prefix + 'semprefixo list/add/del',
      prefix + 'modobrincadeira 1/0'
    ], '👑') + '\n\n' +
    section('💎 VIP', [
      prefix + 'addvip @user [dias]',
      prefix + 'delvip @user',
      prefix + 'listvip'
    ], '💎') + '\n\n' +
    section('💰 ECONOMIA RPG', [
      prefix + 'addcoins @user <valor>',
      prefix + 'delcoins @user <valor>',
      prefix + 'setcoins @user <valor>',
      prefix + 'sorteio <valor>',
      prefix + 'resetrpg @user'
    ], '💰')
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

function menuRpg(prefix, botName, userName) {
  return (
    header(botName, userName, '⚔️') + '\n\n' +
    section('👤 PERFIL', [
      prefix + 'perfilrpg',
      prefix + 'carteira',
      prefix + 'inv',
      prefix + 'toprpg'
    ], '⚔️') + '\n\n' +
    section('💰 ECONOMIA', [
      prefix + 'daily',
      prefix + 'trabalhar',
      prefix + 'minerar',
      prefix + 'dep <valor|all>',
      prefix + 'sacar <valor|all>',
      prefix + 'pix @user <valor>',
      prefix + 'loja',
      prefix + 'comprar <item>'
    ], '💰') + '\n\n' +
    section('⚔️ COMBATE', [
      prefix + 'batalhar @user'
    ], '⚔️') + '\n\n' +
    section('💎 VIP', [
      prefix + 'menuvip',
      prefix + 'vip'
    ], '💎')
  )
}

function menuVip(prefix, botName, userName) {
  return (
    header(botName, userName, '💎') + '\n\n' +
    section('💎 BENEFÍCIOS VIP', [
      'Daily em dobro',
      'Trabalhar cooldown menor',
      'Minerar com bônus',
      prefix + 'vip  (status)'
    ], '💎') + '\n\n' +
    section('👑 GESTÃO (DONO/CRIADOR)', [
      prefix + 'addvip @user [dias]',
      prefix + 'delvip @user',
      prefix + 'listvip',
      prefix + 'addcoins @ <valor>',
      prefix + 'delcoins @ <valor>',
      prefix + 'sorteio <valor>'
    ], '👑')
  )
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
