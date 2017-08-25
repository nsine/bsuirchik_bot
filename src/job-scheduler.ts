import * as mongoose from 'mongoose';
import * as scheduler from 'node-schedule';
import logger from './logger';

import state from './state';
import { Group } from './models/group';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';
import constants from './constants';

const environment = process.env.NODE_ENV;

export function runJobs() {
  runUpdateGroupsJob();
  runUpdateWeekDayJob();
};

function runUpdateGroupsJob() {
  let updateGroupsRule = new scheduler.RecurrenceRule();

  updateGroupsRule.date = 1;

  async function updateGroups() {
    try {
      let groups = await BsuirApiService.getAllGroups();
      await Group.remove({});
      Group.insertMany(groups);
      logger.info('Groups updated')
    } catch (e) {
      logger.error(e.message);
    }
  }

  // updateGroups();
  if (environment === 'production') {
    scheduler.scheduleJob(updateGroupsRule, updateGroups);
  }
}

function runUpdateWeekDayJob() {
  let updateWeekRule = new scheduler.RecurrenceRule();

  updateWeekRule.dayOfWeek = 0;

  async function updateWeekDay() {
    let weekDay = await BsuirApiService.getWeekNumberByDate(new Date());
    if (isNaN(weekDay)) {
      weekDay = (state.weekNumber % constants.WeekCount) + 1;
      logger.warn(`Week number updated offline`);
    }
    state.weekNumber = weekDay;
    logger.info(`Week number updated ${weekDay}`)
  }

  updateWeekDay();
  if (environment === 'production') {
    scheduler.scheduleJob(updateWeekRule, updateWeekDay);
  }
}