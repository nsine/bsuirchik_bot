const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('src/secrets.json', 'utf8'));

/**
 * @property {string} apiUrls.weekNumberByWeek - Deprecated
 */
export let config = {
    tgToken: secrets.tgToken,
    apiUrls: {
        allGroups: 'http://students.bsuir.by/api/v1/groups',
        scheduleById: 'http://students.bsuir.by/api/v1/studentGroup/schedule',
        weekNumberByWeek: 'https://www.bsuir.by/schedule/rest/currentWeek/date',
        lastUpdateTime: 'http://students.bsuir.by/api/v1/studentGroup/lastUpdateDate'
    }
}