import * as moment from 'moment';
import constants from '../constants';
import state from '../state';

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

export function parseTime(timeString: string) {
  return moment(timeString, 'HH:mm').toDate();
}

export function getWeekNumberByDate(date: Date | moment.Moment) {
  let momentDate: moment.Moment = date instanceof Date
    ? moment(date)
    : date;

  let diffFromCurrentWeek = momentDate.diff(moment(), 'week');
  return (state.weekNumber + diffFromCurrentWeek) % constants.WeekCount;
}