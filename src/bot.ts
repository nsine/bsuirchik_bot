import * as TelegramBot from 'node-telegram-bot-api/src/telegram';
import * as moment from 'moment';

import { config } from './config';
import { Group } from './models/group';
import { User } from './models/user';
import { UserStatus } from './models/user-status';
import { Employee } from './models/employee';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';
import { XmlParser } from './utils/xml-parser';
import { getTodaySchedule, getScheduleForDay, getScheduleForWeek } from './bot-helpers/schedule-helper';
import * as presenters from './presenters';
import constants from './constants';

export class Bot {
  private _bot: TelegramBot;
  private _commands: Map<RegExp, any>;
  private _state: any = {

  };

  constructor() {
    this._commands = new Map([
      [/\/echo (.+)/, this.onEcho.bind(this)],
      [/\/start/, this.onStart.bind(this)],
      [/\/info/, this.onInfo.bind(this)],
      [/\/today/, this.onToday.bind(this)],
      [/\/tomorrow/, this.onTomorrow.bind(this)],
      [/\/week\s?(\d+)?/, this.onWeek.bind(this)],
      [/.+/, this.onTextMessage.bind(this)]
    ]);
  }

  run() {
    this._bot = new TelegramBot(config.tgToken, {
      polling: true,
      onlyFirstMatch: true
    });

    for (let command of this._commands.keys()) {
      this._bot.onText(command, this._commands.get(command));
    }
  }

  onEcho(msg, match) {
    const chatId = msg.chat.id;
    const response = match[1]; // the captured "whatever"

    this._bot.sendMessage(chatId, response);
  }

  async onInfo(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let user = await User.findOne({ telegramId: userId });
    if (!user) return;

    if (user.status === UserStatus.New) {
      this.askRequiredInfo(chatId);
    } else {
      const response = user.group;
      this._bot.sendMessage(chatId, response);
    }
  }

  async onStart(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      user = new User({
        telegramId: userId,
        status: UserStatus.New
      });
    } else {
      user.status = UserStatus.New;
    }

    user.save().then(() => {
      this.askRequiredInfo(chatId);
    }).catch(err => console.log);

  }

  async onTextMessage(msg, match) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    if (user.status === UserStatus.New) {
      // Wait for valid group name
      let groupName = match[0];

      let group = await Group.findOne({ name: groupName });
      if (!group) {
        this._bot.sendMessage(chatId, 'Invalid group name');
        return;
      }

      user.group = group.name;
      user.status = UserStatus.Full;
      await user.save();

      // Check if there is schedule in db
      // If no, then add
      try {
        if (!group.schedule) {
          group.schedule = await BsuirApiService.getScheduleByGroupId(group.id);
          await group.save();
        }
      } catch (e) {
        this._bot.sendMessage(chatId, e.message);
        return;
      }
    } else {
      // Add logic for parsing text messages
      let response = `Success: ${match[0]}`;
      this._bot.sendMessage(chatId, response);
    }
  }

  async onToday(msg, match) {
    const day = new Date();
    return await this.sendScheduleForDay(msg, day, 'today');
  }

  async onTomorrow(msg, match) {
    let day = moment(new Date());
    day = day.add(1, 'day');

    console.log(day);
    return await this.sendScheduleForDay(msg, day.toDate(), 'tomorrow');
  }

  onWeek(msg, match) {
    let weekNumber: number;
    if (match[1]) {
      weekNumber = +match[1];
      if (isNaN(weekNumber) || !(weekNumber >= 1 && weekNumber <= constants.WeekCount)) {
        this._bot.sendMessage(msg.chatId, 'Invalid week number');
        return;
      }
      this.sendScheduleForWeek(msg, weekNumber);
    } else {
      weekNumber = BsuirApiService.getWeekNumberByDate(new Date()).then(weekNumber => {
        this.sendScheduleForWeek(msg, weekNumber);
      });
    }
  }

  async sendScheduleForWeek(msg, weekNumber: number) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let schedule = await getScheduleForWeek(user.group, weekNumber);

    let view = presenters.scheduleForWeek(schedule);
    this._bot.sendMessage(chatId, view);
  }

  async sendScheduleForDay(msg, day: Date, dayName: string) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    // TODO cache week number
    let weekNumber = await BsuirApiService.getWeekNumberByDate(day);

    let scheduleItems = await getScheduleForDay(user.group, weekNumber, day.getDay() - 1);

    let view = presenters.scheduleForDay(scheduleItems, dayName);
    this._bot.sendMessage(chatId, view);
  }

  askRequiredInfo(chatId) {
    this._bot.sendMessage(chatId, 'Enter your group number');
  }
}