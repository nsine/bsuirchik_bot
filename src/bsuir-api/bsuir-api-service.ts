import * as fetch from 'node-fetch';
import * as moment from 'moment';
import logger from '../logger';

import { config } from '../config';
import { XmlParser } from '../utils/xml-parser';
import { ScheduleResponseRaw, EmployeeRaw, ScheduleItemRaw, GroupRaw } from './models';
import { IScheduleDay, IScheduleItem, IGroup, Employee, IEmployee } from '../models';
import { getDayNumberByName } from './bsuir-api-utils';
import { parseTime } from '../utils/date-utils';

export class BsuirApiService {
  static getAllGroups() {
    return fetch(config.apiUrls.allGroups)
      .then(res => res.json())
      .then(BsuirApiService.createGroupsModelFromData)
      .catch(e => logger.error(e));
  }

  static getScheduleByGroupId(groupId): IScheduleDay[] {
    return fetch(`${config.apiUrls.scheduleById}?id=${groupId}`)
      .then(res => res.json())
      .then(BsuirApiService.createScheduleModelFromData)
      .catch(e => logger.error(e));
  }

  static getWeekNumberByDate(date: Date) {
    throw new Error('Not implemented in BSUIR API');
  }

  static getCurrentWeekNumber(): number {
    // Temp solution
    return fetch(`${config.apiUrls.scheduleById}?id=21155`)
      .then(res => res.json())
      .then((data: ScheduleResponseRaw) => data.currentWeekNumber)
      .catch(e => {
        logger.error(e);
        return null;
      });
  }

  private static createGroupsModelFromData(groupsData: GroupRaw[]) {
    let groups: IGroup[] = [];

    for (let rawGroup of groupsData) {
      let groupData: any = {
        apiId: +rawGroup.id,
        name: rawGroup.name,
        course: null,
        facultyId: null,
        schedule: null
      };

      let courseData = rawGroup.course;
      if (courseData) {
        groupData.course = +courseData;
      }
      let facultyIdData = rawGroup.facultyId;
      if (courseData) {
        groupData.facultyId = +facultyIdData;
      }

      groups.push(groupData);
    }

    return groups;
  }

  private static async createScheduleModelFromData(scheduleData: ScheduleResponseRaw) {
    let schedule: IScheduleDay[] = [];

    for (let day of scheduleData.schedules) {
      let scheduleDay: IScheduleDay = {
        dayNumber: getDayNumberByName(day.weekDay),
        schedule: []
      };

      let daySchedule: ScheduleItemRaw[];
      if (Array.isArray(day.schedule)) {
        daySchedule = day.schedule;
      } else {
        daySchedule = [day.schedule];
      }

      for (let item of daySchedule) {
        let scheduleItem: IScheduleItem = {
          auditory: item.auditory.join(' ') || '',
          lessonType: item.lessonType,
          note: item.note,
          subgroup: item.numSubgroup,
          subjectName: item.subject,
          timeFrom: parseTime(item.startLessonTime),
          timeTo: parseTime(item.endLessonTime),
          employeeId: null,
          weekNumbers: item.weekNumber
        };

        if (item.employee) {
          let employees = await BsuirApiService.findOrSaveEmployee(item.employee);
          scheduleItem.employeeId = employees.map(e => e._id);
        }

        scheduleDay.schedule.push(scheduleItem);
      }

      schedule.push(scheduleDay);
    }

    return schedule;
  }

  private static async findOrSaveEmployee(employeesData: EmployeeRaw[]) {
    let employees: IEmployee[] = [];

    for (let employeeData of employeesData) {
      let employee = await Employee.findOne({ apiId: employeeData.id });
      if (!employee) {
        employee = new Employee({
          apiId: employeeData.id,
          firstName: employeeData.firstName,
          middleName: employeeData.middleName,
          lastName: employeeData.lastName,
          rank: employeeData.rank,
          calendarId: employeeData.calendarId,
          academicDepartment: employeeData.academicDepartment
        });

        let nameParts = [employee.firstName, employee.middleName, employee.lastName];
        nameParts.sort();
        employee.fullNameKey = nameParts.join('');

        await employee.save();
      }

      employees.push(employee);
    }

    return employees;
  }
}