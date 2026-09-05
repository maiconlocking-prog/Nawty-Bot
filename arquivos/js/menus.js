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
    section('🤖 CONFIGURAÇÕES DO BOT', [
      prefix + 'prefixo <novo>',
      prefix + 'numerodono <número>',
      prefix + 'nomedono <nome>',
      prefix + 'nomebot <nome>',
      prefix + 'fotobot  (marque imagem)',
      prefix + 'msgprefix'
    ], '🤖') + '\n\n' +
    section('👥 GERENCIAMENTO DE USUÁRIOS', [
      prefix + 'blockuserg @',
      prefix + 'unblockuserg @',
      prefix + 'listblocks',
      prefix + 'addblackglobal @',
      prefix + 'rmblackglobal @',
      prefix + 'listblackglobal'
    ], '👥') + '\n\n' +
    section('🚫 GRUPOS', [
      prefix + 'bangp',
      prefix + 'unbangp',
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
    section('💎 VIP / PREMIUM', [
      prefix + 'addvip @ [dias]',
      prefix + 'delvip @',
      prefix + 'listvip',
      prefix + 'addpremium @ [dias]',
      prefix + 'delpremium @',
      prefix + 'listprem'
    ], '💎') + '\n\n' +
    section('💰 ECONOMIA RPG', [
      prefix + 'addcoins @ <valor>',
      prefix + 'delcoins @ <valor>',
      prefix + 'setcoins @ <valor>',
      prefix + 'sorteio <valor>',
      prefix + 'resetrpg @'
    ], '💰') + '\n\n' +
    section('⚡ SEM PREFIXO', [
      prefix + 'addnopref S s',
      prefix + 'delnopref S',
      prefix + 'listnopref',
      prefix + 'semprefixo list'
    ], '⚡') + '\n\n' +
    section('🛠️ MANUTENÇÃO', [
      prefix + 'reiniciar',
      prefix + 'backup',
      prefix + 'limpardb confirmar',
      prefix + 'limparrankg',
      prefix + 'seradm / ' + prefix + 'sermembro',
      prefix + 'setfoto <cmd>',
      prefix + 'criador'
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
