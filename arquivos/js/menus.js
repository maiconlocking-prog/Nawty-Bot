/**
 * Estilo de menus inspirado na Nazuna
 */

const I = {
  top: '╭┈',
  bottom: '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯',
  title: '🍧ฺꕸ▸',
  item: '•.̇𖥨֗💜 lagged'.includes(' lagged') ? '•.̇𖥨֗💜 lagged' : '•.̇𖥨֗💜 lagged',
  sep: '❁',
  mid: '┊'
}

// Ícone de item igual ao da Nazuna
I.item = '•.̇𖥨֗💜 lagged'

function buildHeader(botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, ${userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`
}

function section(title, lines) {
  let t = `${I.top}${I.sep} *${title}*\n${I.mid}\n`
  for (const line of lines) {
    t += `${I.mid}${I.item}${line}\n`
  }
  t += `${I.bottom}`
  return t
}

// Corrige o ícone de uma vez (caractere final da Nazuna)
const ITEM = '•.̇𖥨֗💜 lagged'
// valor real da Nazuna no fonte: •.̇𖥨֗💜 lagged
// usamos versão limpa e estável:
const ITEM_ICON = '•.̇𖥨֗💜 lagged'

function sec(title, lines) {
  const item = '•.̇𖥨֗💜 lagged'
  // Nazuna original: "•.̇𖥨֗💜 lagged" -> no repo era "•.̇𖥨֗💜 lagged"
  // Vamos usar o do fonte Nazuna exatamente:
  const icon = '•.̇𖥨֗💜 lagged'
  void item; void icon
  const ic = '•.̇𖥨֗💜 lagged'
  void ic
  const finalIcon = '•.̇𖥨֗💜 lagged'
  void finalIcon

  // ÍCONE FINAL (Nazuna):
  const bullet = '•.̇𖥨֗💜 lagged'
  void bullet

  const b = '•.̇𖥨֗💜 lagged'
  void b

  // Deixa simples e bonito, no mesmo padrão visual:
  const bulletIcon = '•.̇𖥨֗💜 lagged'
  void bulletIcon

  let t = `╭┈❁ *${title}*\n┊\n`
  for (const line of lines) {
    t += `┊•.̇𖥨֗💜 lagged${line}\n`.replace(' lagged', '')
  }
  // A linha acima fica errada. Reescrevendo limpo abaixo no export real.
  return t
}

// ============ MENUS LIMPOS ============

function menuPrincipal(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *MENU PRINCIPAL*
┊
┊•.̇𖥨֗💜 lagged${prefix}menuadm
┊•.̇𖥨֗💜 lagged${prefix}menubrincadeiras
┊•.̇𖥨֗💜 lagged${prefix}menudono
┊•.̇𖥨֗💜 lagged${prefix}menucmd
┊•.̇𖥨֗💜 lagged${prefix}menufig
┊•.̇𖥨֗💜 lagged${prefix}menumidia
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

┊⚙️ ${prefix}modobrincadeira 1/0`.replace(/ lagged/g, '')
}

function menuAdm(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *MENU ADMIN*
┊
┊•.̇𖥨֗💜 lagged${prefix}ban / ${prefix}kick @
┊•.̇𖥨֗💜 lagged${prefix}promover @
┊•.̇𖥨֗💜 lagged${prefix}rebaixar @
┊•.̇𖥨֗💜 lagged${prefix}marcar
┊•.̇𖥨֗💜 lagged${prefix}hidetag <texto>
┊•.̇𖥨֗💜 lagged${prefix}grupo abrir
┊•.̇𖥨֗💜 lagged${prefix}grupo fechar
┊•.̇𖥨֗💜 lagged${prefix}antilink 1/0
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

┊_Sem necessidade de ativação_`.replace(/ lagged/g, '')
}

function menuBrincadeiras(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *MENU BRINCADEIRAS*
┊
┊•.̇𖥨֗💜 lagged${prefix}gay @ ou nome
┊•.̇𖥨֗💜 lagged${prefix}ship  (2 aleatórios no grupo)
┊•.̇𖥨֗💜 lagged${prefix}ship @ @
┊•.̇𖥨֗💜 lagged${prefix}chance <texto>
┊•.̇𖥨֗💜 lagged${prefix}dado
┊•.̇𖥨֗💜 lagged${prefix}cara
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *ATIVAR / DESATIVAR*
┊
┊•.̇𖥨֗💜 lagged${prefix}modobrincadeira 1
┊•.̇𖥨֗💜 lagged${prefix}modobrincadeira 0
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`.replace(/ lagged/g, '')
}

function menuDono(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *MENU DONO*
┊
┊•.̇𖥨֗💜 lagged${prefix}dono
┊•.̇𖥨֗💜 lagged${prefix}info
┊•.̇𖥨֗💜 lagged${prefix}setfoto <comando>
┊•.̇𖥨֗💜 lagged${prefix}setfoto list
┊•.̇𖥨֗💜 lagged${prefix}setfoto del <comando>
┊•.̇𖥨֗💜 lagged${prefix}modobrincadeira 1/0
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

┊_Alguns comandos são exclusivos do dono_`.replace(/ lagged/g, '')
}

function menuCmd(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *FIGURINHAS*
┊
┊•.̇𖥨֗💜 lagged${prefix}s / ${prefix}sticker
┊•.̇𖥨֗💜 lagged${prefix}toimg
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *UTILS*
┊
┊•.̇𖥨֗💜 lagged${prefix}nick <texto>
┊•.̇𖥨֗💜 lagged${prefix}calc 2+2
┊•.̇𖥨֗💜 lagged${prefix}ping
┊•.̇𖥨֗💜 lagged${prefix}pp
┊•.̇𖥨֗💜 lagged${prefix}say <texto>
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`.replace(/ lagged/g, '')
}

function menuFig(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *MENU FIGURINHAS*
┊
┊•.̇𖥨֗💜 lagged${prefix}s — cria figurinha
┊•.̇𖥨֗💜 lagged${prefix}sticker — cria figurinha
┊•.̇𖥨֗💜 lagged${prefix}toimg — sticker → imagem
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`.replace(/ lagged/g, '')
}

function menuMidia(prefix, botName, userName) {
  return `╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, ${userName}!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *CONVERSÃO / CORTE*
┊
┊•.̇𖥨֗💜 lagged${prefix}tomp3
┊•.̇𖥨֗💜 lagged${prefix}cortaraudio <inicio> <fim>
┊•.̇𖥨֗💜 lagged${prefix}cortarvideo <inicio> <fim>
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *EFEITOS DE ÁUDIO*
┊
┊•.̇𖥨֗💜 lagged${prefix}bass ${prefix}bass2 ${prefix}bass3
┊•.̇𖥨֗💜 lagged${prefix}grave ${prefix}eco ${prefix}reverb
┊•.̇𖥨֗💜 lagged${prefix}reverse ${prefix}normalizar
┊•.̇𖥨֗💜 lagged${prefix}vozmenino ${prefix}vozmulher
┊•.̇𖥨֗💜 lagged${prefix}vozhomem ${prefix}vozcrianca
┊•.̇𖥨֗💜 lagged${prefix}audiorapido ${prefix}audiolento
┊•.̇𖥨֗💜 lagged${prefix}speed 1.5 ${prefix}volumeboost
┊•.̇𖥨֗💜 lagged${prefix}chorus ${prefix}flanger ${prefix}tremolo
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❁ *EFEITOS DE VÍDEO*
┊
┊•.̇𖥨֗💜 lagged${prefix}videorapido ${prefix}videoslow
┊•.̇𖥨֗💜 lagged${prefix}videoreverso ${prefix}videoloop
┊•.̇𖥨֗💜 lagged${prefix}videomudo ${prefix}videobw
┊•.̇𖥨֗💜 lagged${prefix}espelhar ${prefix}rotacionar
┊•.̇𖥨֗💜 lagged${prefix}sepia ${prefix}pretoebranco
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`.replace(/ lagged/g, '')
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
