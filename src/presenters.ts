import * as moment from 'moment';

import { IScheduleItem, IScheduleDay } from './models';
import { daysByIndex, minutesOfDay } from './utils/date-utils';

interface PresentScheduleItemOptions {
  time: boolean;
  employee: boolean;
}

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

    let scheduleItemOptions: PresentScheduleItemOptions = {
      time: true,
      employee: false
    };

    if (prevItem && minutesOfDay(prevItem.timeFrom) === minutesOfDay(item.timeFrom)) {
      scheduleItemOptions.time = false;
    }

    let line = scheduleItem(item, scheduleItemOptions);
    responseLines.push(line);
  }

  return responseLines.join('\n');
}

export function scheduleItem(item: IScheduleItem, options: PresentScheduleItemOptions = {
  time: true,
  employee: false
}) {
  let timeInfo = '';
  if (options.time) {
    timeInfo = `${moment(item.timeFrom).format('HH:mm')}-${moment(item.timeTo).format('HH:mm')}`;
  } else {
    timeInfo = ' '.repeat(22);
  }

  let line = `${timeInfo} ${item.lessonType} ${item.subjectName} ${item.auditory}`;

  if (item.subgroup !== 0) {
    line = `${line} (${item.subgroup} subgroup)`
  }

  return line;
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