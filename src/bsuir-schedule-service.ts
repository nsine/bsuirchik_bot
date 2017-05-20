import * as mongoose from 'mongoose';
import * as moment from 'moment';
import * as fetch from 'node-fetch';
const parseString = require('xml2js').parseString;

import { config } from './config';
import { Group } from './models/group';
import { GroupsResponseRaw, GroupRaw } from './external-models/groups';

const ONE_MONTH = moment.duration(1, 'months');

export class BsuirScheduleService {
  lastUpdateTime: any;

  constructor() {
    this.lastUpdateTime = moment();
    this.updateGroupsList();
  }

  private updateGroupsList() {
    if (moment().diff(this.lastUpdateTime) > ONE_MONTH.asMilliseconds()) {
      return;
    }
    this.getXmlData().then(data => new Promise((resolve, reject) => {
      parseString(data, (err, result: GroupsResponseRaw) => {
        resolve(result.studentGroupXmlModels.studentGroup);
      });
    })).then((groupsData: GroupRaw[]) => {
      Group.remove({}, () => { }).exec().then(() => {
          for (let rawGroup of groupsData) {
            // There can be no group or course, so need to check
            let groupData: any = {
              id: parseInt(rawGroup.id[0]),
              name: parseInt(rawGroup.name[0])
            };

            let courseData = rawGroup.course;
            if (courseData) {
              groupData.course = parseInt(courseData[0])
            }
            let facultyIdData = rawGroup.facultyId;
            if (courseData) {
              groupData.facultyId = parseInt(facultyIdData[0])
            }

            let group = new Group(groupData);
            group.save();
          }
        })
    })

    this.lastUpdateTime = moment();
  }

  private getXmlData() {
    return fetch(config.apiUrls.allGroups).then(res => res.text());
  }
}