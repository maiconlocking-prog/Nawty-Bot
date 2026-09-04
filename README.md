# 🌸 NAWTY BOT 🌸

Base de bot para WhatsApp com **Pairing Code** (padrão) e suporte a QR Code.  
Atualizado para **@whiskeysockets/baileys 7.0.0-rc14**.

## 🚀 Como iniciar

### Instalação
```bash
npm install --legacy-peer-deps
```

### Iniciar com Pairing Code (recomendado)
```bash
sh start.sh
# ou
npm start
```

O bot vai pedir o número e gerar um código de 8 dígitos.

### Iniciar com QR Code
```bash
sh start.sh qr
```

## ⚙️ Configuração

Edite `database/config.json`:

```json
{
  "prefix": "¥",
  "NomeDoBot": "NAWTY BOT",
  "NomeDoDono": "Seu Nome",
  "NumeroDoDono": "5511987654321"
}
```

## 📂 Plugins

Crie arquivos `.js` dentro das pastas:

- `plugins/admin/` → só admins
- `plugins/dono/` → só dono
- `plugins/premium/` → usuários premium
- `plugins/cmds-aleatorios/` → público

## Créditos

Base original por MisheruModz  
Adaptado e atualizado para Nawty + Baileys 7 por maiconlocking-prog
