import * as mongoose from 'mongoose';

import { runJobs } from './job-scheduler';
import { Bot } from './bot';
import logger from './logger';

(<any>mongoose).Promise = global.Promise;
mongoose.connect('mongodb://localhost/bsuirchik_bot', { useMongoClient: true });

const bot = new Bot();
bot.run();

runJobs();
logger.info('App is started');