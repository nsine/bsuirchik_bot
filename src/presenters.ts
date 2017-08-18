import { IScheduleItem, IScheduleDay } from './models';
import { daysByIndex } from './utils/day-helper';

export function scheduleForDay(scheduleItems: IScheduleItem[], dayName) {
  if (scheduleItems === null) {
    return `No schedule for ${dayName}`;
  } else if (scheduleItems.length === 0) {
    return `No lessons ${dayName}`;
  }

  let responseLines: string[] = [];

  for (let i = 0; i < scheduleItems.length; i++) {
    let item = scheduleItems[i];
    let prevItem = scheduleItems[i - 1];

    let timeInfo = '';
    if (prevItem && prevItem.time === item.time) {
      timeInfo = '\t\t\t';
    } else {
      timeInfo = item.time;
    }

    let line = `${timeInfo} ${item.lessonType} ${item.subjectName} ${item.auditory}`;

    if (item.subgroup !== 0) {
      line = `${line} (${item.subgroup} subgroup)`
    }

    responseLines.push(line);
  }

  return responseLines.join('\n');
}

export function scheduleForWeek(schedule: IScheduleDay[]) {
  let responseLines: string[] = [];

  for (let day of schedule) {
    responseLines.push(daysByIndex[day.dayNumber]);
    responseLines.push(scheduleForDay(day.schedule, ''));
    responseLines.push('');
  }

  return responseLines.join('\n');
}