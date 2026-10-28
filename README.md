# MNYANDWA-MD V2

Standalone WhatsApp bot using Baileys. It does not depend on the old `../luka` command framework.

## Requirements
- Node.js 20 or newer
- A WhatsApp account you own or have permission to link

## Install and run
```bash
npm install
npm start
```

On first start, enter your WhatsApp number with country code and digits only, for example `2557XXXXXXXX`. The pairing code appears in the terminal. On your phone open WhatsApp > Linked devices > Link a device > Link with phone number, then enter the code.

The session is saved in `./session`. Keep it private and do not upload it to a public GitHub repository.

## Commands
- `.menu`
- `.ping`
- `.alive`
- `.uptime`
- `.botinfo`
- `.owner`
- `.date`
- `.jid`
- `.groupinfo`
- `.tagall` (group admins only)
- `.hidetag` (group admins only)
- `.system`
- `.ram`

## Configuration
Optional environment variables:
- `PREFIX` (default `.`)
- `OWNER_NAME` (default `MNYANDWA`)
- `OWNER_NUMBER` (digits only, country code included)
- `SESSION_DIR` (default `./session`)
- `LOG_LEVEL` (default `silent`)
- `TZ` (default `Africa/Dar_es_Salaam`)

Example:
```bash
OWNER_NAME=MNYANDWA OWNER_NUMBER=2557XXXXXXXX PREFIX=. npm start
```

## Important
- This is a starter bot, not an official WhatsApp Business API integration.
- Avoid bulk messaging or unsolicited tagging; WhatsApp may restrict accounts that spam.
- Keep your session credentials private.
- Some hosting platforms do not preserve local files between deploys. Use persistent storage for the `session` folder or the bot may need to pair again after restarts.
