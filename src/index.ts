import * as TelegramBot from 'node-telegram-bot-api';
import * as mongoose from 'mongoose';

import { config } from './config';
import { BsuirScheduleService } from './bsuir-schedule-service';

mongoose.connect('mongodb://localhost/bsuirchik_bot');

const bot = new TelegramBot(config.tgToken, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = match[1]; // the captured "whatever"

  bot.sendMessage(chatId, response);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Received your fucking f message');
});


const bsuirScheduleService = new BsuirScheduleService();
console.log('started');