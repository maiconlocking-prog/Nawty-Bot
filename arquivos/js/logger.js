const colors = require('colors')

function CyanLog(msg) {
  console.log(colors.cyan(msg))
}
function GreenLog(msg) {
  console.log(colors.green(msg))
}
function RedLog(msg) {
  console.log(colors.red(msg))
}
function MagentaLog(msg) {
  console.log(colors.magenta(msg))
}

module.exports = { CyanLog, GreenLog, RedLog, MagentaLog }
