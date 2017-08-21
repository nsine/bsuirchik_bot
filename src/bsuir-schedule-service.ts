import * as mongoose from 'mongoose';
import * as moment from 'moment';

import { XmlParser } from './utils/xml-parser';
import { Group } from './models/group';
import { BsuirApiService } from './bsuir-api/bsuir-api-service';

const ONE_MONTH = moment.duration(1, 'months');

// TODO Implement autoupdating groups
export class BsuirScheduleService {
  lastUpdateTime: any;

  constructor() {
    this.lastUpdateTime = moment();
    this.updateGroupsList();
  }

  private async updateGroupsList() {
    if (moment().diff(this.lastUpdateTime) < ONE_MONTH.asMilliseconds()) {
      return;
    }

    let groups = await BsuirApiService.getAllGroups();

    await Group.remove({});

    Group.insertMany(groups);

    this.lastUpdateTime = moment();
  }
}