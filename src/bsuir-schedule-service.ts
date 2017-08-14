import * as mongoose from 'mongoose';
import * as moment from 'moment';

import { XmlParser } from './utils/xml-parser';
import { Group } from './models/group';
import { GroupsResponseRaw } from './external-models/groups';
import { BsuirApiHelper } from './bsuir-api-helper';

const ONE_MONTH = moment.duration(1, 'months');

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

    let data = await BsuirApiHelper.getAllGroups();
    let groupsDataWrapped = await XmlParser.parse(data) as GroupsResponseRaw;
    let groupsData = groupsDataWrapped.studentGroupXmlModels.studentGroup;

    await Group.remove({});

    for (let rawGroup of groupsData) {
      // There can be no group or course, so need to check
      let groupData: any = {
        id: +rawGroup.id,
        name: rawGroup.name
      };

      let courseData = rawGroup.course;
      if (courseData) {
        groupData.course = +courseData;
      }
      let facultyIdData = rawGroup.facultyId;
      if (courseData) {
        groupData.facultyId = +facultyIdData;
      }

      let group = new Group(groupData);
      group.save();
    }

    this.lastUpdateTime = moment();
  }
}