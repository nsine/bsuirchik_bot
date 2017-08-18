import * as TelegramBot from 'node-telegram-bot-api/src/telegram';

import { Group } from '../models';

export async function getTodaySchedule(groupId: string, weekNumber: number) {
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