import * as mongoose from 'mongoose';
import * as scheduler from 'node-schedule';
import logger from './logger';

import state from './state';
import { Group } from './models/group';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';

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
    try {
      let weekDay = await BsuirApiService.getWeekNumberByDate(new Date());
      state.weekNumber = weekDay;
      logger.info(`Week number updated ${weekDay}`)
    } catch (e) {
      logger.error(e.message);
    }
  }

  updateWeekDay();
  if (environment === 'production') {
    scheduler.scheduleJob(updateWeekRule, updateWeekDay);
  }
}