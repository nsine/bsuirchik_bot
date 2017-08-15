import * as TelegramBot from 'node-telegram-bot-api/src/telegram';

import { config } from './config';
import { Group, ScheduleDay, ScheduleItem } from './models/group';
import { User } from './models/user';
import { UserStatus } from './models/user-status';
import { Employee } from './models/employee';
import { ScheduleResponseRaw } from './external-models/schedule';
import { BsuirApiHelper } from './bsuir-api-helper';
import { XmlParser } from './utils/xml-parser';

export class Bot {
    private _bot: TelegramBot;
    private _commands: Map<RegExp, any>;

    constructor() {
        this._commands = new Map([
            [/\/echo (.+)/, this.onEcho.bind(this)],
            [/\/start/, this.onStart.bind(this)],
            [/\/info/, this.onInfo.bind(this)],
            [/\/today/, this.onToday.bind(this)],
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
                    group.schedule = await this.createScheduleModelFromData(schedule);
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
        const chatId = msg.chat.id;

        let user = await User.findOne({ telegramId: chatId });
        if (!user) return;

        // Find schedule for today
        let group = await Group.findOne({
            name: user.group
        });

        let scheduleDay = group.schedule.find(day => day.dayNumber === new Date().getDay() - 1);

        if (!scheduleDay) {
            this._bot.sendMessage(chatId, 'No schedule for today');
            return;
        }

        // TODO cache week number
        let weekNumber = await BsuirApiHelper.getWeekNumberByDate(new Date());

        let scheduleItems = scheduleDay.schedule.filter(item => item.weekNumbers.indexOf(weekNumber) !== -1);

        let response = scheduleItems.map(item =>
            `${item.time} ${item.lessonType} ${item.subjectName} ${item.auditory}`).join('\n');

        if (!response) {
            this._bot.sendMessage(chatId, 'No lessons today');
        } else {
            this._bot.sendMessage(chatId, response);
        }
    }

    askRequiredInfo(chatId) {
        this._bot.sendMessage(chatId, 'Enter your group number');
    }

    async createScheduleModelFromData(scheduleData: ScheduleResponseRaw) {
        let schedule: ScheduleDay[] = [];

        for (let day of scheduleData.scheduleXmlModels.scheduleModel) {
            let scheduleDay: ScheduleDay = {
                dayNumber: BsuirApiHelper.getDayNumberByName(day.weekDay),
                schedule: []
            };

            for (let item of day.schedule) {
                let scheduleItem: ScheduleItem = {
                    auditory: item.auditory,
                    lessonType: item.lessonType,
                    note: item.note,
                    subgroup: +item.numSubgroup,
                    subjectName: item.subject,
                    time: item.lessonTime,
                    employeeId: null,
                    weekNumbers: []
                };

                if (item.employee) {
                    // Find employee in db
                    let employee = await Employee.findOne({ apiId: item.employee.id });
                    if (!employee) {
                        employee = new Employee({
                            apiId: item.employee.id,
                            firstName: item.employee.firstName,
                            middleName: item.employee.middleName,
                            lastName: item.employee.lastName,
                            rank: item.employee.rank,
                            calendarId: item.employee.calendarId,
                            academicDepartment: []
                        });

                        if (typeof item.employee.academicDepartment === 'string') {
                            employee.academicDepartment.push(item.employee.academicDepartment);
                        } else {
                            employee.academicDepartment = item.employee.academicDepartment;
                        }

                        await employee.save();
                    }

                    scheduleItem.employeeId = employee._id;
                }

                if (typeof item.weekNumber === 'string') {
                    scheduleItem.weekNumbers.push(+item.weekNumber);
                } else {
                    scheduleItem.weekNumbers = item.weekNumber.map(n => +n);
                }

                scheduleDay.schedule.push(scheduleItem);
            }

            schedule.push(scheduleDay);
        }

        return schedule;
    }
}