import * as mongoose from 'mongoose';

import { BsuirScheduleService } from './bsuir-schedule-service';
import { Bot } from './bot';

(<any>mongoose).Promise = global.Promise;
mongoose.connect('mongodb://localhost/bsuirchik_bot');

const bot = new Bot();
bot.run();

const bsuirScheduleService = new BsuirScheduleService();
console.log('started');