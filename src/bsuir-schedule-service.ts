import * as mongoose from 'mongoose';
import * as moment from 'moment';

import { XmlParser } from './utils/xml-parser';
import { Group } from './models/group';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';

const ONE_MONTH = moment.duration(1, 'months');

export class BsuirScheduleService {
  lastUpdateTime: any;

  constructor() {
    this.lastUpdateTime = moment();
    this.updateGroupsList();
  }

  private async updateGroupsList() {
    console.log('update groups')

    if (moment().diff(this.lastUpdateTime) < ONE_MONTH.asMilliseconds()) {
      return;
    }

    console.log('updating groups')

    let groups = await BsuirApiService.getAllGroups();

    await Group.remove({});

    Group.insertMany(groups);

    this.lastUpdateTime = moment();
  }
}