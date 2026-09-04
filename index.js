/*
  NAWTY BOT - Atualizado para Baileys 7.0.0-rc14
*/
const fs = require('fs')
const path = require('path')
const colors = require('colors')
const chokidar = require('chokidar')

const config = JSON.parse(fs.readFileSync('./database/config.json'))
const startConnection = require('./conexao.js')
const { CyanLog, RedLog, GreenLog } = require('./arquivos/js/logger.js')

let nawty = null

async function main() {
  try {
    console.log(colors.cyan('Iniciando Nawty Bot...'))
    nawty = await startConnection(null, config)
  } catch (err) {
    console.error(colors.red('Erro ao iniciar:'), err)
    process.exit(1)
  }
}

main()
