/**
 * Personalização estilo Nazuna — bordas, cabeçalhos e respostas
 */

const TOP = '╭┈'
const MID = '┊'
const BOT = '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
const SEP = '❁'
const ITEM = '•.̇𖥨֗💜◆'

function header(botName, userName) {
  return (
    '╭┈⊰ 🌸 『 *' + botName + '* 』\n' +
    '┊Olá, *' + userName + '*!\n' +
    '╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯'
  )
}

function box(title, lines) {
  let t = TOP + SEP + ' *' + title + '*\n' + MID + '\n'
  for (const line of lines) {
    t += MID + ITEM + line + '\n'
  }
  t += BOT
  return t
}

function wrap(title, body) {
  return (
    TOP + SEP + ' *' + title + '*\n' +
    MID + '\n' +
    body.split('\n').map(l => MID + l).join('\n') + '\n' +
    BOT
  )
}

function ok(msg) {
  return '✅ ' + msg
}
function fail(msg) {
  return '❌ ' + msg
}
function warn(msg) {
  return '⚠️ ' + msg
}

function gayReply(target, pct) {
  const emoji = pct >= 80 ? '🏳️‍🌈🔥' : pct >= 50 ? '🏳️‍🌈' : pct >= 20 ? '😅' : '😌'
  return wrap('🏳️‍🌈 MEDIDOR GAY', [
    emoji + ' *' + target + '*',
    '',
    'É *' + pct + '%* gay!',
    pct >= 90 ? '_Orgulho total!_ 💅' : pct >= 50 ? '_Tá no caminho..._ 😏' : '_Quase hétero_ 😂'
  ].join('\n'))
}

function shipReply(n1, n2, pct) {
  let bar = ''
  const filled = Math.round(pct / 10)
  for (let i = 0; i < 10; i++) bar += i < filled ? '💖' : '🤍'
  let frase = 'Sem chance... 💔'
  if (pct >= 90) frase = 'Casal perfeito! 💍✨'
  else if (pct >= 70) frase = 'Química forte! 💘'
  else if (pct >= 50) frase = 'Tem potencial... ❤️'
  else if (pct >= 30) frase = 'Amizade colorida? 🤔'
  else if (pct >= 10) frase = 'Melhor só amigos 😅'
  return wrap('💘 SHIP', [
    '*' + n1 + '*  ❤️  *' + n2 + '*',
    '',
    bar,
    'Compatibilidade: *' + pct + '%*',
    '_' + frase + '_'
  ].join('\n'))
}

function chanceReply(texto, pct) {
  return wrap('🎯 CHANCE', [
    '*' + texto + '*',
    '',
    'Probabilidade: *' + pct + '%*',
    pct >= 80 ? '_Quase certo!_ ✨' : pct >= 40 ? '_Pode rolar..._ 🤞' : '_Difícil hein_ 😬'
  ].join('\n'))
}

function dadoReply(n) {
  const faces = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }
  return wrap('🎲 DADO', faces[n] + ' Você tirou *' + n + '*!')
}

function caraCoroaReply(lado) {
  return wrap('🪙 CARA OU COROA', 'Resultado: *' + lado + '*!')
}

function rankFunReply(title, members, scores) {
  let body = ''
  members.forEach((jid, i) => {
    const num = jid.split('@')[0]
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'
    body += medal + ' @' + num + ' — *' + scores[i] + '%*\n'
  })
  return (
    TOP + SEP + ' ' + title + '\n' +
    MID + '\n' +
    body.split('\n').filter(Boolean).map(l => MID + l).join('\n') + '\n' +
    BOT
  )
}

function rankAtivoReply(ranking) {
  let body = ''
  ranking.forEach(([jid, count], i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'
    body += medal + ' @' + jid.split('@')[0] + ' — *' + count + '* msgs\n'
  })
  return (
    TOP + SEP + ' *📊 RANK ATIVOS*\n' +
    MID + '\n' +
    body.split('\n').filter(Boolean).map(l => MID + l).join('\n') + '\n' +
    BOT
  )
}

function adminOk(action) {
  return wrap('🛡️ ADMIN', ok(action))
}

function secStatus(s) {
  return wrap('🔒 SEGURANÇA', [
    'Antilink: ' + (s.antilink ? '✅ ON' : '❌ OFF'),
    'Antiflood: ' + (s.antiflood ? '✅ ON' : '❌ OFF') + ' (' + (s.floodLimit || 5) + '/' + (s.floodSeconds || 8) + 's)',
    'Antipalavra: ' + (s.antipalavra ? '✅ ON' : '❌ OFF'),
    'Antidoc: ' + (s.antidoc ? '✅ ON' : '❌ OFF'),
    'Antiloc: ' + (s.antiloc ? '✅ ON' : '❌ OFF')
  ].join('\n'))
}

function pingReply(ms) {
  return wrap('🏓 PING', 'Latência: *' + ms + 'ms*')
}

function infoReply(botName, prefix) {
  return wrap('🤖 INFO', [
    'Bot: *' + botName + '*',
    'Prefixo: *' + prefix + '*',
    'Status: *Online* ✅',
    'Estilo: Nazuna-inspired 🌸'
  ].join('\n'))
}

function donoReply(nome, numero) {
  return wrap('👑 DONO', [
    '*' + nome + '*',
    numero ? ('wa.me/' + String(numero).replace(/\D/g, '')) : ''
  ].filter(Boolean).join('\n'))
}

module.exports = {
  header, box, wrap, ok, fail, warn,
  gayReply, shipReply, chanceReply, dadoReply, caraCoroaReply,
  rankFunReply, rankAtivoReply, adminOk, secStatus,
  pingReply, infoReply, donoReply,
  TOP, MID, BOT, SEP, ITEM
}
