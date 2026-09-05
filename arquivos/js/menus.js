/**
 * Estilo de menus inspirado na Nazuna
 * Personalizável via opções
 */

function buildHeader(botName, userName, opts = {}) {
  const header = opts.header || `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`
  return header.replace(/#user#/g, userName)
}

const STYLE = {
  menuTopBorder: '╭┈',
  bottomBorder: '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯',
  menuTitleIcon: '🍧ฺꕸ▸',
  menuItemIcon: '•.̇𖥨֗💜 lagged',
  separatorIcon: '❁',
  middleBorder: '┊'
}
// fix typo - use proper icon
STYLE.menuItemIcon = '•.̇𖥨֗💜 lagged'.replace(' lagged', ' lagged')
// Use the Nazuna icon properly:
const ITEM = '•.̇𖥨֗💜 lagged'
// Actually Nazuna uses: •.̇𖥨֗💜 lagged - let me use clean version
const I = {
  top: '╭┈',
  bottom: '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯',
  title: '🍧ฺꕸ▸',
  item: '•.̇𖥨֗💜 lagged',
  sep: '❁',
  mid: '┊'
}
// Correct item icon from Nazuna source:
I.item = '•.̇𖥨֗💜 lagged'

function section(title, lines) {
  let t = `${I.top}${I.sep} *${title}*\n${I.mid}\n`
  for (const line of lines) {
    t += `${I.mid}${I.item}${line}\n`
  }
  t += `${I.bottom}`
  return t
}

function menuPrincipal(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('MENU PRINCIPAL', [
  `${prefix}menuadm — Admin do grupo`,
  `${prefix}menubrincadeiras — Diversão`,
  `${prefix}menudono — Dono do bot`,
  `${prefix}menucmd — Figurinhas, mídia e utils`,
  `${prefix}menufig — Figurinhas`,
  `${prefix}menumidia — Áudio e vídeo`,
])}

${I.mid} ⚙️ ${prefix}modobrincadeira 1/0`
}

function menuAdm(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('MENU ADMIN', [
  `${prefix}ban / ${prefix}kick @`,
  `${prefix}promover @`,
  `${prefix}rebaixar @`,
  `${prefix}marcar`,
  `${prefix}hidetag <texto>`,
  `${prefix}grupo abrir`,
  `${prefix}grupo fechar`,
  `${prefix}antilink 1/0`,
])}

${I.mid} _Sem necessidade de ativação_`
}

function menuBrincadeiras(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('MENU BRINCADEIRAS', [
  `${prefix}gay @ ou nome`,
  `${prefix}ship  (2 aleatórios no grupo)`,
  `${prefix}ship @ @`,
  `${prefix}chance <texto>`,
  `${prefix}dado`,
  `${prefix}cara`,
])}

${section('ATIVAR / DESATIVAR', [
  `${prefix}modobrincadeira 1`,
  `${prefix}modobrincadeira 0`,
])}`
}

function menuDono(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('MENU DONO', [
  `${prefix}dono`,
  `${prefix}info`,
  `${prefix}setfoto <comando>`,
  `${prefix}setfoto list`,
  `${prefix}setfoto del <comando>`,
  `${prefix}modobrincadeira 1/0`,
])}

${I.mid} _Alguns comandos são exclusivos do dono_`
}

function menuCmd(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('FIGURINHAS', [
  `${prefix}s / ${prefix}sticker`,
  `${prefix}toimg`,
])}

${section('UTILS', [
  `${prefix}nick <texto>`,
  `${prefix}calc 2+2`,
  `${prefix}ping`,
  `${prefix}pp`,
  `${prefix}say <texto>`,
])}`
}

function menuFig(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('MENU FIGURINHAS', [
  `${prefix}s — cria figurinha`,
  `${prefix}sticker — cria figurinha`,
  `${prefix}toimg — sticker → imagem`,
])}`
}

function menuMidia(prefix, botName, userName) {
  const h = buildHeader(botName, userName)
  return `${h}

${section('CONVERSÃO / CORTE', [
  `${prefix}tomp3`,
  `${prefix}cortaraudio <inicio> <fim>`,
  `${prefix}cortarvideo <inicio> <fim>`,
])}

${section('EFEITOS DE ÁUDIO', [
  `${prefix}bass ${prefix}bass2 ${prefix}bass3`,
  `${prefix}grave ${prefix}eco ${prefix}reverb`,
  `${prefix}reverse ${prefix}normalizar`,
  `${prefix}vozmenino ${prefix}vozmulher`,
  `${prefix}vozhomem ${prefix}vozcrianca`,
  `${prefix}audiorapido ${prefix}audiolento`,
  `${prefix}speed 1.5 ${prefix}volumeboost`,
  `${prefix}chorus ${prefix}flanger ${prefix}tremolo`,
])}

${section('EFEITOS DE VÍDEO', [
  `${prefix}videorapido ${prefix}videoslow`,
  `${prefix}videoreverso ${prefix}videoloop`,
  `${prefix}videomudo ${prefix}videobw`,
  `${prefix}espelhar ${prefix}rotacionar`,
  `${prefix}sepia ${prefix}pretoebranco`,
])}`
}

module.exports = {
  menuPrincipal,
  menuAdm,
  menuBrincadeiras,
  menuDono,
  menuCmd,
  menuFig,
  menuMidia,
  buildHeader,
  STYLE: I
}
