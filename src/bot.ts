import TelegramBot = require('node-telegram-bot-api');
import * as moment from 'moment';
import logger from './logger';
import * as mongoose from 'mongoose';

import { config } from './config';
import { Group, Employee, User, IUser } from './models';
import { UserStatus } from './models/user-status';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';
import { XmlParser } from './utils/xml-parser';
import {
  getTodaySchedule, getScheduleForDay,
  getScheduleForWeek, getScheduleForNow
} from './bot-helpers/schedule-helper';
import { findEmployees } from './bot-helpers/employees-helper'
import * as presenters from './presenters';
import constants from './constants';
import { minutesOfDay, getWeekNumberByDate } from './utils/date-utils';
import state from './state';

const buttons = {
  now: 'Now',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'Week'
};

const defaultAnswerOptions = {
  reply_markup: {
    keyboard: [
      [{ text: buttons.now }, { text: buttons.today }],
      [{ text: buttons.tomorrow }, { text: buttons.week }]
    ],
    resize_keyboard: true
  }
};

const noKeyboardOptions = {
  reply_markup: {
    remove_keyboard: true
  }
};

export class Bot {
  private _bot: TelegramBot;
  private _commands: Map<RegExp, any>;
  private _textCommands: any;

  constructor() {
    this._commands = new Map([
      [/\/echo (.+)/, this.onEcho.bind(this)],
      [/\/start/, this.onStart.bind(this)],
      [/\/help/, this.onHelp.bind(this)],
      [/\/settings/, this.onSettings.bind(this)],
      [/\/today/, this.onToday.bind(this)],
      [/\/tomorrow/, this.onTomorrow.bind(this)],
      [/\/week\s?(\d+)?/, this.onWeek.bind(this)],
      [/\/whatweek/, this.onWhatWeek.bind(this)],
      [/\/now/, this.onNow.bind(this)],
      [/\/where\s?(.+)?/, this.onWhere.bind(this)],
      [/.+/, this.onTextMessage.bind(this)]
    ]);

    this._textCommands = {
      [buttons.now]: this.onNow.bind(this),
      [buttons.today]: this.onToday.bind(this),
      [buttons.tomorrow]: this.onTomorrow.bind(this),
      [buttons.week]: this.onWeek.bind(this)
    };
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

  private onEcho(msg, match) {
    const chatId = msg.chat.id;
    const response = match[1];

    this._bot.sendMessage(chatId, response);
  }

  private onHelp(msg, match) {
    const response = 'Somebody have to right the help info...';
    this._bot.sendMessage(msg.chat.id, response, defaultAnswerOptions);
  }

  private async onSettings(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let user = await User.findOne({ telegramId: userId });
    if (!user) return;

    this.startConfiguration(user);
  }

  private async onNow(msg, match) {
    const chatId = msg.chat.id;
    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let { currentLessons, nextLessons } = await getScheduleForNow(user.group);
    let responseLines: string[] = [];

    if (currentLessons.length === 0) {
      responseLines.push('You can relax now');
    } else {
      for (let item of currentLessons) {
        responseLines.push(presenters.scheduleItem(item));
      }
    }

    if (nextLessons.length !== 0) {
      responseLines.push('\nNext:');
      for (let item of nextLessons) {
        responseLines.push(presenters.scheduleItem(item));
      }
    }

    this._bot.sendMessage(chatId, responseLines.join('\n'));
  }

  private async onStart(msg, match) {
    this.onHelp(msg, match);

    const chatId = msg.chat.id;
    const userId = msg.from.id;

    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      user = new User({
        telegramId: userId,
        status: UserStatus.New
      });
    }

    this.startConfiguration(user);
  }

  private async onToday(msg, match) {
    const day = new Date();
    await this.sendScheduleForToday(msg);
  }

  private async onTomorrow(msg, match) {
    let day = moment(new Date());
    day = day.add(1, 'day');
    await this.sendScheduleForDay(msg, day.toDate(), 'tomorrow');
  }

  private onWeek(msg, match) {
    let weekNumber: number;
    if (match[1]) {
      weekNumber = +match[1];
      if (isNaN(weekNumber) || !(weekNumber >= 1 && weekNumber <= constants.WeekCount)) {
        this._bot.sendMessage(msg.chatId, 'Invalid week number');
        return;
      }
    } else {
      weekNumber = state.weekNumber;
    }
    this.sendScheduleForWeek(msg, weekNumber);
  }

  private onWhatWeek(msg, match) {
    let response = `Current week is ${state.weekNumber}`;
    this._bot.sendMessage(msg.chat.id, response)
  }

  private async onWhere(msg, match) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let employeeName = match[1];
    let matchedEmployees = await findEmployees(employeeName, user.group);

    if (matchedEmployees.length === 0) {
      this._bot.sendMessage(msg.chat.id, 'I can\'t find this employee');
    }

    let responseItems = matchedEmployees.map(emp => `${emp.lastName} ${emp.firstName} ${emp.middleName}`);

    this._bot.sendMessage(msg.chat.id, responseItems.join('\n'));
  }

  private async onTextMessage(msg, match) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    switch (user.status) {
      case UserStatus.New:
        this.updateUserGroup(match, user);
        break;
      case UserStatus.EnteringGroup:
        this.updateUserGroup(match, user);
        break;
      case UserStatus.Basic:
        this.handleTextMessage(msg, match, user);
        break;
    }
  }

  private async sendScheduleForWeek(msg, weekNumber: number) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let schedule = await getScheduleForWeek(user.group, weekNumber);

    let view = presenters.scheduleForWeek(schedule);
    this._bot.sendMessage(chatId, view);
  }

  private async sendScheduleForToday(msg) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let scheduleItems = await getTodaySchedule(user.group);

    let view = presenters.scheduleForDay(scheduleItems, 'today');
    this._bot.sendMessage(chatId, view);
  }

  private async sendScheduleForDay(msg, day: Date, dayName: string) {
    const chatId = msg.chat.id;

    let user = await User.findOne({ telegramId: chatId });
    if (!user) return;

    let weekNumber = getWeekNumberByDate(day);

    let scheduleItems = await getScheduleForDay(user.group, weekNumber, day.getDay() - 1);

    let view = presenters.scheduleForDay(scheduleItems, dayName);
    this._bot.sendMessage(chatId, view);
  }

  private async startConfiguration(user: IUser) {
    this._bot.sendMessage(user.telegramId, 'Enter your group number', noKeyboardOptions);
    user.status = UserStatus.EnteringGroup;
    await user.save();
  }

  private async updateUserGroup(match, user: IUser) {
    // Wait for valid group name
    let groupName = match[0];

    let group = await Group.findOne({ name: groupName });
    if (!group) {
      this._bot.sendMessage(user.telegramId, 'Invalid group name');
      return;
    }

    user.group = group.name;
    user.status = UserStatus.Basic;
    await user.save();
    this._bot.sendMessage(user.telegramId, `Nice!`, defaultAnswerOptions);

    if (!group.schedule) {
      let schedule = await BsuirApiService.getScheduleByGroupId(group.apiId);
      if (schedule) {
        group.schedule = schedule;
        // TODO Save all employees for group
        let groupEmployees: Set<string> = new Set();

        schedule.forEach(day => {
          day.schedule.forEach(item => {
            item.employeeId.forEach(id => groupEmployees.add(id.toHexString()));
          });
        });

        group.employees = [...groupEmployees].map(id => mongoose.Types.ObjectId(id));
        await group.save();
      } else {
        logger.warn(`It looks like there is no schedule for ${group.name}`);
        this._bot.sendMessage(user.telegramId, `It looks like there is no schedule for ${group.name}`, defaultAnswerOptions);
      }
    }
  }

  private handleTextMessage(msg, match: string[], user: IUser) {
    let text = match[0];
    if (this._textCommands[text]) {
      this._textCommands[text](msg, match);
    } else {
      logger.debug('on text');
      // Add logic for parsing text messages
      let response = `Success: ${match[0]}`;
      this._bot.sendMessage(user.telegramId, response);
    }
  }
}