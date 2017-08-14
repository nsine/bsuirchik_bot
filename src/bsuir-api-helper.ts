import * as fetch from 'node-fetch';

import { config } from './config';

export class BsuirApiHelper {
    static getAllGroups() {
        return fetch(config.apiUrls.allGroups).then(res => res.text());
    }

    static getScheduleByGroupId(groupId) {
        return fetch(`${config.apiUrls.scheduleById}/${groupId}`).then(res => res.text());
    }
}