require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
bot.setMyCommands([
  { command: '/start', description: 'Botni ishga tushirish' },
  { command: '/help', description: 'Yordam olish' },
  { command: '/info', description: 'Bot haqida ma’lumot' },
]);

module.exports = { bot }

require("./message");
require('./query');
require('./photo');



