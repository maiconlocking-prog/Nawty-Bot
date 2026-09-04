#!/bin/bash

NOCOLOR='\033[0m'
RED='\033[0;31m'
CYAN='\033[0;36m'

# Por padrão usa Pairing Code. Use "qr" para QR Code
if [ "$1" = "qr" ]; then
  while :
  do
    clear
    echo -e "${CYAN}"
    echo "NAWTY BOT - Modo QR Code"
    echo -e "${RED}NAWTY BOT CONTÉM PROTEÇÃO DIRETA CONTRA QUEDAS.${NOCOLOR}"
    sleep 1
    node index.js
  done
else
  while :
  do
    clear
    echo -e "${CYAN}"
    echo "NAWTY BOT - Modo Pairing Code"
    echo -e "${RED}NAWTY BOT CONTÉM PROTEÇÃO DIRETA CONTRA QUEDAS.${NOCOLOR}"
    echo -e "${CYAN}>>> MODO PAREAMENTO POR CÓDIGO ATIVO <<<${NOCOLOR}"
    sleep 1
    node index.js --code
  done
fi
