const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('src/secrets.json', 'utf8'));

export let config = {
    tgToken: secrets.tgToken,
    apiUrls: {
        allGroups: 'https://www.bsuir.by/schedule/rest/studentGroup',
        scheduleById: 'https://www.bsuir.by/schedule/rest/schedule',
        weekNumberByWeek: 'https://www.bsuir.by/schedule/rest/currentWeek/date'
    }
}