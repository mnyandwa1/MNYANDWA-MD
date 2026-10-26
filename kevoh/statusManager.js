'use strict';
// ╭─────────────────────────────────────────────────────────────╮
//   MNYANDWA-MD  ·  guruh/statusManager.js
//   Bridge/alias so plugins inside kevootz/ can import:
//     require('../statusManager')
//   and resolve to the real module at kevo/handlers/statusManager.js
//   Do NOT put business logic here — edit the real module instead.
// └──MNYANDWA-MD  ────────────────────────────────────────────────╯

module.exports = require('../kevo/handlers/statusManager');
