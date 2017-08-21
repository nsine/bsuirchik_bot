import * as TelegramBot from 'node-telegram-bot-api/src/telegram';
import * as moment from 'moment';

import { minutesOfDay } from '../utils/date-utils'
import { Group } from '../models';
import { BsuirApiService } from '../bsuir-api/bsuir-api-service';

export async function getTodaySchedule(groupId: string) {
  let weekNumber = await BsuirApiService.getWeekNumberByDate(new Date());
  let dayNumber = new Date().getDay() - 1;
  return getScheduleForDay(groupId, weekNumber, dayNumber);
}

export async function getScheduleForDay(groupId: string, weekNumber: number, dayNumber: number) {
  // Find schedule for today
  let group = await Group.findOne({
    name: groupId
  });

  let scheduleDay = group.schedule.find(day => day.dayNumber === dayNumber);

  if (!scheduleDay) {
    return null;
  }

  return scheduleDay.schedule.filter(item => item.weekNumbers.indexOf(weekNumber) !== -1);
}

export async function getScheduleForWeek(groupId: string, weekNumber: number) {
  // Find schedule for today
  let group = await Group.findOne({
    name: groupId
  });

  let schedule = group.schedule;
  for (let day of schedule) {
    day.schedule = day.schedule.filter(item => item.weekNumbers.indexOf(weekNumber) !== -1);
  }

  return schedule;
}

export async function getScheduleForNow(groupId: string) {
  let scheduleItems = await getTodaySchedule(groupId);

  let currentLessons = [];
  let nextLessons = [];

  let now = moment();

  let nowLessonIndex: number = -1;
  scheduleItems.forEach((item, index) => {
    let timeFrom = moment(item.timeFrom);
    let timeTo = moment(item.timeTo);

    let timeFromMinutes = minutesOfDay(timeFrom);
    let timeToMinutes = minutesOfDay(timeTo);

    if (minutesOfDay(now) >= timeFromMinutes && minutesOfDay(now) <= timeToMinutes) {
      currentLessons.push(item);
      nowLessonIndex = index;
    }
  });

  let needToShowNextLesson = false;

  // If lessons will be later
  if (currentLessons.length === 0 &&
      scheduleItems &&
      minutesOfDay(now) < minutesOfDay(scheduleItems[0].timeFrom)) {
    needToShowNextLesson = true;
  } else {
    // If more than half of the lesson has passed
    if (minutesOfDay(now) - minutesOfDay(currentLessons[0].timeFrom) >
        minutesOfDay(currentLessons[0].timeTo) - minutesOfDay(now)) {
      needToShowNextLesson = true;
    }
  }

  if (needToShowNextLesson) {
    let nextLesson = scheduleItems[nowLessonIndex + 1];
    if (nextLesson) {
      nextLessons = scheduleItems.filter(item => item.timeFrom === nextLesson.timeFrom);
    }
  }

  return {
    currentLessons: currentLessons,
    nextLessons: nextLessons
  };
}