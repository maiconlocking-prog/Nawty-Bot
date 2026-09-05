/**
 * Menus no estilo Nazuna (bordas, ícones e organização)
 */

const B = {
  header: (bot, user) =>
    `╭┈⊰ 🌸 『 *${bot}* 』\n┊Olá, ${user}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
  top: '╭┈❁',
  mid: '┊',
  item: '•.̇𖥨֗💜 lagged'.replace(' lagged', ''),
  bottom: '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
}

// Ícone de item no padrão Nazuna
B.item = '•.̇𖥨֗💜 lagged'.includes(' lagged')
  ? '•.̇𖥨֗💜 lagged'.replace(/ lagged/g, '')
  : '•.̇𖥨֗💜 lagged'

// Valor final estável (visual Nazuna)
B.item = '•.̇𖥨֗💜 lagged'.replace(/ lagged/g, '')
if (!B.item || B.item.length < 3) B.item = '•.̇𖥨֗💜 lagged'.replace(/ lagged/g, '')
B.item = '•.̇𖥨֗💜 lagged'.split(' ').join('').replace(/lagged/g, '')
// fallback visual limpo se algo der errado
if (B.item.length < 4) B.item = '•.̇𖥨֗💜'

function block(title, lines) {
  let t = `${B.top} *${title}*\n${B.mid}\n`
  for (const line of lines) t += `${B.mid}${B.item}${line}\n`
  t += B.bottom
  return t
}

function menuPrincipal(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('MENU PRINCIPAL', [
  `${prefix}menuadm`,
  `${prefix}menubrincadeiras`,
  `${prefix}menudono`,
  `${prefix}menucmd`,
  `${prefix}menufig`,
  `${prefix}menumidia`
])}

${B.mid}⚙️ ${prefix}modobrincadeira 1/0`
}

function menuAdm(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('MENU ADMIN', [
  `${prefix}ban / ${prefix}kick @`,
  `${prefix}promover @`,
  `${prefix}rebaixar @`,
  `${prefix}marcar`,
  `${prefix}hidetag <texto>`,
  `${prefix}grupo abrir`,
  `${prefix}grupo fechar`,
  `${prefix}antilink 1/0`
])}

${B.mid}_Sem necessidade de ativação_`
}

function menuBrincadeiras(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('MENU BRINCADEIRAS', [
  `${prefix}gay @ ou nome`,
  `${prefix}ship  (2 aleatórios no grupo)`,
  `${prefix}ship @ @`,
  `${prefix}chance <texto>`,
  `${prefix}dado`,
  `${prefix}cara`
])}

${block('ATIVAR / DESATIVAR', [
  `${prefix}modobrincadeira 1`,
  `${prefix}modobrincadeira 0`
])}`
}

function menuDono(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('MENU DONO', [
  `${prefix}dono`,
  `${prefix}info`,
  `${prefix}setfoto <comando>`,
  `${prefix}setfoto list`,
  `${prefix}setfoto del <comando>`,
  `${prefix}modobrincadeira 1/0`
])}

${B.mid}_Alguns comandos são exclusivos do dono_`
}

function menuCmd(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('FIGURINHAS', [
  `${prefix}s / ${prefix}sticker`,
  `${prefix}toimg`
])}

${block('UTILS', [
  `${prefix}nick <texto>`,
  `${prefix}calc 2+2`,
  `${prefix}ping`,
  `${prefix}pp`,
  `${prefix}say <texto>`
])}`
}

function menuFig(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('MENU FIGURINHAS', [
  `${prefix}s — cria figurinha`,
  `${prefix}sticker — cria figurinha`,
  `${prefix}toimg — sticker → imagem`
])}`
}

function menuMidia(prefix, botName, userName) {
  return `${B.header(botName, userName)}

${block('CONVERSÃO / CORTE', [
  `${prefix}tomp3`,
  `${prefix}cortaraudio <inicio> <fim>`,
  `${prefix}cortarvideo <inicio> <fim>`
])}

${block('EFEITOS DE ÁUDIO', [
  `${prefix}bass ${prefix}bass2 ${prefix}bass3`,
  `${prefix}grave ${prefix}eco ${prefix}reverb`,
  `${prefix}reverse ${prefix}normalizar`,
  `${prefix}vozmenino ${prefix}vozmulher`,
  `${prefix}vozhomem ${prefix}vozcrianca`,
  `${prefix}audiorapido ${prefix}audiolento`,
  `${prefix}speed 1.5 ${prefix}volumeboost`,
  `${prefix}chorus ${prefix}flanger ${prefix}tremolo`
])}

${block('EFEITOS DE VÍDEO', [
  `${prefix}videorapido ${prefix}videoslow`,
  `${prefix}videoreverso ${prefix}videoloop`,
  `${prefix}videomudo ${prefix}videobw`,
  `${prefix}espelhar ${prefix}rotacionar`,
  `${prefix}sepia ${prefix}pretoebranco`
])}`
}

module.exports = {
  menuPrincipal,
  menuAdm,
  menuBrincadeiras,
  menuDono,
  menuCmd,
  menuFig,
  menuMidia
}
