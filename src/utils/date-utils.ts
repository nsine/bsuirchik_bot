import * as moment from 'moment';

export const daysByIndex = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export function minutesOfDay(date: Date | moment.Moment) {
  if (date instanceof Date) {
    return date.getMinutes() + date.getHours() * 60;
  } else {
    return date.minutes() + date.hours() * 60;
  }
}