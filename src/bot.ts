import * as TelegramBot from 'node-telegram-bot-api/src/telegram';

import { config } from './config';
import { Group } from './models/group';
import { User } from './models/user';
import { UserStatus } from './models/user-status';
import { ScheduleResponseRaw } from './external-models/schedule';
import { BsuirApiHelper } from './bsuir-api-helper';
import { XmlParser } from './utils/xml-parser';

export class Bot {
    private _bot: TelegramBot;
    private _commands: Map<RegExp, any>;

    constructor () {
        this._commands = new Map([
            [/\/echo (.+)/, this.onEcho.bind(this)],
            [/\/start/, this.onStart.bind(this)],
            [/\/info/, this.onInfo.bind(this)],
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

        let user = await User.findOne({ telegramId: userId }).exec();
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
                    let scheduleData = await BsuirApiHelper.getScheduleByGroupId(group.id);
                    let schedule = <ScheduleResponseRaw>(await XmlParser.parse(scheduleData));
                    group.schedule = schedule;
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

    askRequiredInfo(chatId) {
        this._bot.sendMessage(chatId, 'Enter your group number');
    }
}