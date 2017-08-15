import * as fetch from 'node-fetch';
import * as moment from 'moment';

import { config } from './config';

export class BsuirApiHelper {
    static getAllGroups() {
        return fetch(config.apiUrls.allGroups).then(res => res.text());
    }

    static getScheduleByGroupId(groupId) {
        return fetch(`${config.apiUrls.scheduleById}/${groupId}`).then(res => res.text());
    }

    static getWeekNumberByDate(date: Date) {
        let dateString = moment(date).format('DD.MM.YYYY');
        let a = `${config.apiUrls.weekNumberByWeek}/${dateString}`;
        return fetch(a).then(res => res.text()).then(n => {
            console.log(n);
            return +n;
        });
    }

    static getDayNumberByName(dayName: string) {
        let days = {
            'Понедельник': 0,
            'Вторник': 1,
            'Среда': 2,
            'Четверг': 3,
            'Пятница': 4,
            'Суббота': 5
        };

        return days[dayName];
    }
}